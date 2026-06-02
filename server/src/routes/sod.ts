/**
 * Separation of Duties (SoD) Analysis Routes
 * Routes for SoD rules, violations, matrix, compensating controls, and analysis.
 */

import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import {
  createSoDRuleSchema, updateSoDRuleSchema, importSoDRulesSchema,
  mitigateSoDViolationSchema, acceptSoDViolationSchema, remediateSoDViolationSchema,
  createCompensatingControlSchema, updateCompensatingControlSchema,
} from '../validators/coreModulesSchemas';
import { asyncHandler } from '../types/express';
import sodService from '../services/sodService';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

const router = Router();
router.use(authenticate);

// Param validation: fail fast on malformed identifiers. Tenancy is already
// enforced by organizationId-scoped service calls; this guards format/shape.
const idParamSchema = Joi.object({
  id: Joi.string().trim().min(1).max(100).pattern(/^[A-Za-z0-9_-]+$/).required(),
});

// ============================================================================
// DASHBOARD
// ============================================================================

router.get(
  '/dashboard',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const dashboard = await sodService.getSoDDashboard(user.organizationId);
      res.json(dashboard);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching SoD dashboard:', error);
      throw new AppError('Failed to fetch SoD dashboard', 500);
    }
  })
);

// ============================================================================
// RULES
// ============================================================================

router.get(
  '/rules',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const rules = await sodService.getSoDRules(user.organizationId);
      res.json(rules);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching SoD rules:', error);
      throw new AppError('Failed to fetch SoD rules', 500);
    }
  })
);

router.post(
  '/rules',
  authorize('admin', 'editor'),
  validateBody(createSoDRuleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const rule = await sodService.createSoDRule({
      ...req.body,
      organizationId: user.organizationId,
      createdBy: user.id,
    });
    res.status(201).json(rule);
  })
);

router.get(
  '/rules/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const rule = await sodService.getSoDRuleById(req.params.id, user.organizationId);
    if (!rule) {
      throw new AppError('Rule not found', 404);
    }
    res.json(rule);
  })
);

router.patch(
  '/rules/:id',
  authorize('admin', 'editor'),
  validateBody(updateSoDRuleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const rule = await sodService.updateSoDRule(req.params.id, user.id, user.organizationId, req.body);
    res.json(rule);
  })
);

router.delete(
  '/rules/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    await sodService.deleteSoDRule(req.params.id, user.id, user.organizationId);
    res.status(204).send();
  })
);

router.post(
  '/rules/import',
  authorize('admin'),
  validateBody(importSoDRulesSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await sodService.importSoDRules(user.organizationId, user.id, req.body.rules);
    res.json(result);
  })
);

// ============================================================================
// VIOLATIONS
// ============================================================================

router.get(
  '/violations',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const violations = await sodService.getSoDViolations(user.organizationId);
      res.json(violations);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching SoD violations:', error);
      throw new AppError('Failed to fetch SoD violations', 500);
    }
  })
);

router.get(
  '/violations/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const violation = await sodService.getSoDViolationById(req.params.id, user.organizationId);
    if (!violation) {
      throw new AppError('Violation not found', 404);
    }
    res.json(violation);
  })
);

router.post(
  '/violations/:id/mitigate',
  authorize('admin', 'editor'),
  validateBody(mitigateSoDViolationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await sodService.mitigateViolation(req.params.id, user.id, user.organizationId, req.body);
    res.json(result);
  })
);

router.post(
  '/violations/:id/accept',
  authorize('admin'),
  validateBody(acceptSoDViolationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await sodService.acceptViolation(req.params.id, user.id, user.organizationId, req.body);
    res.json(result);
  })
);

router.post(
  '/violations/:id/remediate',
  authorize('admin', 'editor'),
  validateBody(remediateSoDViolationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await sodService.remediateViolation(req.params.id, user.id, user.organizationId, req.body);
    res.json(result);
  })
);

// ============================================================================
// COMPENSATING CONTROLS
// ============================================================================

router.get(
  '/violations/:violationId/compensation',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const controls = await sodService.getCompensatingControls(req.params.violationId, user.organizationId);
    res.json(controls);
  })
);

router.post(
  '/violations/:violationId/compensation',
  authorize('admin', 'editor'),
  validateBody(createCompensatingControlSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const control = await sodService.addCompensatingControl(
      req.params.violationId,
      user.id,
      user.organizationId,
      req.body
    );
    res.status(201).json(control);
  })
);

router.patch(
  '/violations/:violationId/compensation/:controlId',
  authorize('admin', 'editor'),
  validateBody(updateCompensatingControlSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const control = await sodService.updateCompensatingControl(
      req.params.violationId,
      req.params.controlId,
      user.id,
      user.organizationId,
      req.body
    );
    res.json(control);
  })
);

router.delete(
  '/violations/:violationId/compensation/:controlId',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    await sodService.deleteCompensatingControl(
      req.params.violationId,
      req.params.controlId,
      user.id,
      user.organizationId
    );
    res.status(204).send();
  })
);

// ============================================================================
// CONFLICT MATRIX
// ============================================================================

router.get(
  '/matrix',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { system } = req.query;
    try {
      const matrix = await sodService.getSoDMatrix(user.organizationId, system as string);
      res.json(matrix);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching SoD matrix:', error);
      throw new AppError('Failed to fetch SoD matrix', 500);
    }
  })
);

// ============================================================================
// ANALYSIS
// ============================================================================

router.post(
  '/analyze',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const result = await sodService.runSoDAnalysis(user.organizationId, user.id);
    res.json(result);
  })
);

export default router;
