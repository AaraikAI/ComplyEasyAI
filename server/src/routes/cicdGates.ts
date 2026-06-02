/**
 * CI/CD Compliance Gates Routes
 *
 * Endpoints for managing CI/CD gate policies and checking pipeline compliance.
 * External CI/CD pipelines call POST /check to validate compliance before deploy.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import {
  createGatePolicySchema,
  updateGatePolicySchema,
  checkComplianceSchema,
  reportResultSchema,
} from '../validators/cicdGateSchemas';
import { AppError } from '../middleware/errorHandler';
import prisma from '../config/database';
import logger from '../config/logger';
import crypto from 'crypto';
import { encryptField } from '../utils/credentialEncryption';

const router = Router();
router.use(authenticate);

// ============================================================================
// HELPERS
// ============================================================================

function paginate(query: any): { skip: number; take: number; page: number; limit: number } {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

/**
 * Evaluate a pipeline against a policy's rules.
 * Returns { passed, violations[] }.
 */
function evaluatePolicy(
  rules: any,
  pipelineInfo: { repository: string; branch: string; commitHash: string; checks?: Record<string, boolean>; metadata?: any }
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  if (!rules || typeof rules !== 'object') {
    return { passed: true, violations };
  }

  // Check required branches
  if (rules.allowedBranches && Array.isArray(rules.allowedBranches)) {
    if (!rules.allowedBranches.includes(pipelineInfo.branch)) {
      violations.push(`Branch "${pipelineInfo.branch}" is not in allowed branches: ${rules.allowedBranches.join(', ')}`);
    }
  }

  // Check blocked branches
  if (rules.blockedBranches && Array.isArray(rules.blockedBranches)) {
    if (rules.blockedBranches.includes(pipelineInfo.branch)) {
      violations.push(`Branch "${pipelineInfo.branch}" is blocked by policy`);
    }
  }

  // Check required checks (e.g., tests, linting, security scan)
  if (rules.requiredChecks && Array.isArray(rules.requiredChecks)) {
    for (const check of rules.requiredChecks) {
      if (!pipelineInfo.checks || !pipelineInfo.checks[check]) {
        violations.push(`Required check "${check}" did not pass`);
      }
    }
  }

  // Check required approvals count
  if (rules.minApprovals && typeof rules.minApprovals === 'number') {
    const approvals = pipelineInfo.metadata?.approvals ?? 0;
    if (approvals < rules.minApprovals) {
      violations.push(`Requires ${rules.minApprovals} approvals, got ${approvals}`);
    }
  }

  // Check required frameworks compliance
  if (rules.requiredFrameworks && Array.isArray(rules.requiredFrameworks)) {
    const frameworks = pipelineInfo.metadata?.frameworks ?? [];
    for (const fw of rules.requiredFrameworks) {
      if (!frameworks.includes(fw)) {
        violations.push(`Required framework compliance "${fw}" not confirmed`);
      }
    }
  }

  return { passed: violations.length === 0, violations };
}

// ============================================================================
// LIST GATE POLICIES
// ============================================================================

router.get(
  '/policies',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);

    try {
      const where: any = { organizationId: user.organizationId };

      const [policies, total] = await Promise.all([
        prisma.cICDGatePolicy.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: { _count: { select: { results: true } } },
        }),
        prisma.cICDGatePolicy.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: { policies, total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error: any) {
      if (error?.code === 'P2021' || error?.code === 'P2010' || error?.message?.includes('does not exist')) {
        logger.warn('CI/CD gate policies table not yet available, returning empty data');
        return res.json({ status: 'success', data: { policies: [], total: 0, page, limit, totalPages: 0 } });
      }
      logger.error('Error fetching CI/CD gate policies:', error);
      throw new AppError('Failed to fetch gate policies', 500);
    }
  })
);

// ============================================================================
// GET POLICY DETAILS
// ============================================================================

router.get(
  '/policies/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const policy = await prisma.cICDGatePolicy.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
        include: {
          results: {
            orderBy: { triggeredAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!policy) {
        throw new AppError('Gate policy not found', 404);
      }

      res.json({ status: 'success', data: policy });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching CI/CD gate policy:', error);
      throw new AppError('Failed to fetch gate policy', 500);
    }
  })
);

// ============================================================================
// CREATE GATE POLICY (Admin only)
// ============================================================================

router.post(
  '/policies',
  authorize('admin'),
  validateBody(createGatePolicySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const { name, description, rules, isActive } = req.body;

      if (!name) {
        throw new AppError('name is required', 400);
      }

      const policy = await prisma.cICDGatePolicy.create({
        data: {
          organizationId: user.organizationId,
          name,
          description: description || null,
          rules: rules || {},
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      res.status(201).json({ status: 'success', data: policy });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating CI/CD gate policy:', error);
      throw new AppError('Failed to create gate policy', 500);
    }
  })
);

// ============================================================================
// UPDATE GATE POLICY
// ============================================================================

router.patch(
  '/policies/:id',
  authorize('admin'),
  validateBody(updateGatePolicySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.cICDGatePolicy.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Gate policy not found', 404);
      }

      const { pick } = await import('../utils/pick');
      const updateData = pick(req.body, ['name', 'description', 'rules', 'isActive']);

      const policy = await prisma.cICDGatePolicy.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({ status: 'success', data: policy });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating CI/CD gate policy:', error);
      throw new AppError('Failed to update gate policy', 500);
    }
  })
);

// ============================================================================
// DELETE GATE POLICY
// ============================================================================

router.delete(
  '/policies/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.cICDGatePolicy.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Gate policy not found', 404);
      }

      await prisma.cICDGatePolicy.delete({
        where: { id: req.params.id },
      });

      res.json({ status: 'success', data: { message: 'Gate policy deleted', id: req.params.id } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting CI/CD gate policy:', error);
      throw new AppError('Failed to delete gate policy', 500);
    }
  })
);

// ============================================================================
// CHECK COMPLIANCE (called by CI/CD pipelines)
// ============================================================================

router.post(
  '/check',
  validateBody(checkComplianceSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const { repository, branch, commitHash, policyId, checks, metadata } = req.body;

      if (!repository || !branch || !commitHash) {
        throw new AppError('repository, branch, and commitHash are required', 400);
      }

      // Find applicable policies
      const where: any = {
        organizationId: user.organizationId,
        isActive: true,
      };
      if (policyId) {
        where.id = policyId;
      }

      const policies = await prisma.cICDGatePolicy.findMany({ where });

      if (policies.length === 0) {
        res.json({
          status: 'success',
          data: {
            overallStatus: 'PASSED',
            message: 'No active policies found; pipeline is allowed',
            results: [],
          },
        });
        return;
      }

      const pipelineInfo = { repository, branch, commitHash, checks, metadata };
      const results: Array<{
        policyId: string;
        policyName: string;
        status: string;
        violations: string[];
      }> = [];

      let overallPassed = true;

      for (const policy of policies) {
        const evaluation = evaluatePolicy(policy.rules, pipelineInfo);

        if (!evaluation.passed) {
          overallPassed = false;
        }

        const resultStatus = evaluation.passed ? 'PASSED' : 'FAILED';

        // Persist the result
        await prisma.cICDGateResult.create({
          data: {
            policyId: policy.id,
            organizationId: user.organizationId,
            repository,
            branch,
            commitHash,
            status: resultStatus,
            details: {
              violations: evaluation.violations,
              checks: checks || {},
              metadata: metadata || {},
            },
          },
        });

        results.push({
          policyId: policy.id,
          policyName: policy.name,
          status: resultStatus,
          violations: evaluation.violations,
        });
      }

      res.json({
        status: 'success',
        data: {
          overallStatus: overallPassed ? 'PASSED' : 'FAILED',
          repository,
          branch,
          commitHash,
          results,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error checking CI/CD compliance:', error);
      throw new AppError('Failed to check compliance', 500);
    }
  })
);

// ============================================================================
// REPORT PIPELINE RESULTS
// ============================================================================

router.post(
  '/report',
  validateBody(reportResultSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const { policyId, repository, branch, commitHash, status, details } = req.body;

      if (!policyId || !repository || !branch || !commitHash || !status) {
        throw new AppError('policyId, repository, branch, commitHash, and status are required', 400);
      }

      const validStatuses = ['PASSED', 'FAILED', 'SKIPPED'];
      if (!validStatuses.includes(status)) {
        throw new AppError(`status must be one of: ${validStatuses.join(', ')}`, 400);
      }

      // Verify policy belongs to the org
      const policy = await prisma.cICDGatePolicy.findFirst({
        where: { id: policyId, organizationId: user.organizationId },
      });

      if (!policy) {
        throw new AppError('Gate policy not found', 404);
      }

      const result = await prisma.cICDGateResult.create({
        data: {
          policyId,
          organizationId: user.organizationId,
          repository,
          branch,
          commitHash,
          status,
          details: details || {},
        },
      });

      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error reporting pipeline result:', error);
      throw new AppError('Failed to report pipeline result', 500);
    }
  })
);

// ============================================================================
// LIST GATE RESULTS
// ============================================================================

router.get(
  '/results',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    const policyId = req.query.policyId as string | undefined;
    const status = req.query.status as string | undefined;
    const repository = req.query.repository as string | undefined;

    try {
      // Results are linked to policies which are org-scoped
      const where: any = {
        policy: { organizationId: user.organizationId },
      };

      if (policyId) where.policyId = policyId;
      if (status) where.status = status;
      if (repository) where.repository = repository;

      const [results, total] = await Promise.all([
        prisma.cICDGateResult.findMany({
          where,
          orderBy: { triggeredAt: 'desc' },
          skip,
          take,
          include: {
            policy: { select: { id: true, name: true } },
          },
        }),
        prisma.cICDGateResult.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: { results, total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching CI/CD gate results:', error);
      throw new AppError('Failed to fetch gate results', 500);
    }
  })
);

// ============================================================================
// GET RESULT DETAILS
// ============================================================================

router.get(
  '/results/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const result = await prisma.cICDGateResult.findFirst({
        where: {
          id: req.params.id,
          policy: { organizationId: user.organizationId },
        },
        include: {
          policy: { select: { id: true, name: true, description: true, rules: true } },
        },
      });

      if (!result) {
        throw new AppError('Gate result not found', 404);
      }

      res.json({ status: 'success', data: result });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching CI/CD gate result:', error);
      throw new AppError('Failed to fetch gate result', 500);
    }
  })
);

// ============================================================================
// ROTATE INTEGRATION TOKEN (Admin only)
// ============================================================================
//
// Generates a fresh server-side secret used to identify this organization's CI/CD
// integration. Any client-supplied token in the body is ignored — the server is the
// source of truth. The secret is encrypted at rest and persisted per-organization on
// the shared Integration model under the 'cicd_gate' provider key, and returned in
// plaintext exactly once so the operator can copy it.

router.post(
  '/integration/token',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const secret = crypto.randomBytes(32).toString('hex');
      const rotatedAt = new Date();

      await prisma.integration.upsert({
        where: {
          organizationId_provider: {
            organizationId: user.organizationId,
            provider: 'cicd_gate',
          },
        },
        create: {
          organizationId: user.organizationId,
          name: 'CI/CD Compliance Gate',
          category: 'dev',
          provider: 'cicd_gate',
          connected: true,
          config: { integrationSecret: encryptField(secret) },
          lastSync: rotatedAt,
        },
        update: {
          connected: true,
          config: { integrationSecret: encryptField(secret) },
          lastSync: rotatedAt,
        },
      });

      res.json({ token: secret, rotatedAt: rotatedAt.toISOString() });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error rotating CI/CD integration token:', error);
      throw new AppError('Failed to rotate integration token', 500);
    }
  })
);

export default router;
