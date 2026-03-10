/**
 * CI/CD Compliance Gates Routes
 *
 * Endpoints for managing CI/CD gate policies and checking pipeline compliance.
 * External CI/CD pipelines call POST /check to validate compliance before deploy.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import prisma from '../config/database';
import logger from '../config/logger';

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
    } catch (error) {
      logger.error('Error fetching CI/CD gate policies:', error);
      res.status(500).json({ error: 'Failed to fetch gate policies' });
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
        res.status(404).json({ error: 'Gate policy not found' });
        return;
      }

      res.json({ status: 'success', data: policy });
    } catch (error) {
      logger.error('Error fetching CI/CD gate policy:', error);
      res.status(500).json({ error: 'Failed to fetch gate policy' });
    }
  })
);

// ============================================================================
// CREATE GATE POLICY (Admin only)
// ============================================================================

router.post(
  '/policies',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const { name, description, rules, isActive } = req.body;

      if (!name) {
        res.status(400).json({ error: 'name is required' });
        return;
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
      logger.error('Error creating CI/CD gate policy:', error);
      res.status(500).json({ error: 'Failed to create gate policy' });
    }
  })
);

// ============================================================================
// UPDATE GATE POLICY
// ============================================================================

router.patch(
  '/policies/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.cICDGatePolicy.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Gate policy not found' });
        return;
      }

      const { id, organizationId, createdAt, ...updateData } = req.body;

      const policy = await prisma.cICDGatePolicy.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({ status: 'success', data: policy });
    } catch (error) {
      logger.error('Error updating CI/CD gate policy:', error);
      res.status(500).json({ error: 'Failed to update gate policy' });
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
        res.status(404).json({ error: 'Gate policy not found' });
        return;
      }

      await prisma.cICDGatePolicy.delete({
        where: { id: req.params.id },
      });

      res.json({ status: 'success', data: { message: 'Gate policy deleted', id: req.params.id } });
    } catch (error) {
      logger.error('Error deleting CI/CD gate policy:', error);
      res.status(500).json({ error: 'Failed to delete gate policy' });
    }
  })
);

// ============================================================================
// CHECK COMPLIANCE (called by CI/CD pipelines)
// ============================================================================

router.post(
  '/check',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const { repository, branch, commitHash, policyId, checks, metadata } = req.body;

      if (!repository || !branch || !commitHash) {
        res.status(400).json({ error: 'repository, branch, and commitHash are required' });
        return;
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
      logger.error('Error checking CI/CD compliance:', error);
      res.status(500).json({ error: 'Failed to check compliance' });
    }
  })
);

// ============================================================================
// REPORT PIPELINE RESULTS
// ============================================================================

router.post(
  '/report',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const { policyId, repository, branch, commitHash, status, details } = req.body;

      if (!policyId || !repository || !branch || !commitHash || !status) {
        res.status(400).json({ error: 'policyId, repository, branch, commitHash, and status are required' });
        return;
      }

      const validStatuses = ['PASSED', 'FAILED', 'SKIPPED'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
        return;
      }

      // Verify policy belongs to the org
      const policy = await prisma.cICDGatePolicy.findFirst({
        where: { id: policyId, organizationId: user.organizationId },
      });

      if (!policy) {
        res.status(404).json({ error: 'Gate policy not found' });
        return;
      }

      const result = await prisma.cICDGateResult.create({
        data: {
          policyId,
          repository,
          branch,
          commitHash,
          status,
          details: details || {},
        },
      });

      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      logger.error('Error reporting pipeline result:', error);
      res.status(500).json({ error: 'Failed to report pipeline result' });
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
      logger.error('Error fetching CI/CD gate results:', error);
      res.status(500).json({ error: 'Failed to fetch gate results' });
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
        res.status(404).json({ error: 'Gate result not found' });
        return;
      }

      res.json({ status: 'success', data: result });
    } catch (error) {
      logger.error('Error fetching CI/CD gate result:', error);
      res.status(500).json({ error: 'Failed to fetch gate result' });
    }
  })
);

export default router;
