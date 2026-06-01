/**
 * SOX Compliance Module Routes
 * Routes for SOX controls, testing, deficiencies, walkthroughs, and reporting.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createSOXControlSchema, updateSOXControlSchema,
  createSOXTestResultSchema, updateSOXTestResultSchema,
  createSOXAssessmentSchema, updateSOXAssessmentSchema,
} from '../validators/coreModulesSchemas';
import { asyncHandler } from '../types/express';
import soxService from '../services/soxService';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

const router = Router();
router.use(authenticate);

// ============================================================================
// DASHBOARD
// ============================================================================

router.get(
  '/dashboard',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const dashboard = await soxService.getSOXDashboard(user.organizationId);
      res.json(dashboard);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching SOX dashboard:', error);
      throw new AppError('Failed to fetch SOX dashboard', 500);
    }
  })
);

// ============================================================================
// CONTROLS (CRUD)
// ============================================================================

router.get(
  '/controls',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const controls = await soxService.getSOXControls(user.organizationId);
      res.json(controls);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching SOX controls:', error);
      throw new AppError('Failed to fetch SOX controls', 500);
    }
  })
);

router.post(
  '/controls',
  authorize('admin', 'editor'),
  validateBody(createSOXControlSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const control = await soxService.createSOXControl({
      ...req.body,
      organizationId: user.organizationId,
      createdBy: user.id,
    });
    res.status(201).json(control);
  })
);

router.get(
  '/controls/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const control = await soxService.getSOXControlById(req.params.id, user.organizationId);
    if (!control) {
      throw new AppError('Control not found', 404);
    }
    res.json(control);
  })
);

router.patch(
  '/controls/:id',
  authorize('admin', 'editor'),
  validateBody(updateSOXControlSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const control = await soxService.updateSOXControl(req.params.id, user.id, user.organizationId, req.body);
    res.json(control);
  })
);

router.delete(
  '/controls/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    await soxService.deleteSOXControl(req.params.id, user.id, user.organizationId);
    res.status(204).send();
  })
);

// ============================================================================
// TESTING
// ============================================================================

router.get(
  '/test-results',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const tests = await soxService.getSOXTestResults(user.organizationId);
      res.json(tests);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching SOX tests:', error);
      throw new AppError('Failed to fetch SOX tests', 500);
    }
  })
);

router.post(
  '/test-results',
  authorize('admin', 'editor'),
  validateBody(createSOXTestResultSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const test = await soxService.createSOXTestResult({
      ...req.body,
      organizationId: user.organizationId,
      testerId: user.id,
    });
    res.status(201).json(test);
  })
);

router.get(
  '/test-results/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const test = await soxService.getSOXTestResultById(req.params.id, user.organizationId);
    if (!test) {
      throw new AppError('Test not found', 404);
    }
    res.json(test);
  })
);

router.patch(
  '/test-results/:id',
  authorize('admin', 'editor'),
  validateBody(updateSOXTestResultSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const test = await soxService.updateSOXTestResult(req.params.id, user.id, user.organizationId, req.body);
    res.json(test);
  })
);

router.delete(
  '/test-results/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    await soxService.deleteSOXTestResult(req.params.id, user.id, user.organizationId);
    res.status(204).send();
  })
);

// ============================================================================
// ASSESSMENTS / DEFICIENCIES
// ============================================================================

router.get(
  '/assessments',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const assessments = await soxService.getSOXAssessments(user.organizationId);
      res.json(assessments);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching SOX assessments:', error);
      throw new AppError('Failed to fetch SOX assessments', 500);
    }
  })
);

router.post(
  '/assessments',
  authorize('admin', 'editor'),
  validateBody(createSOXAssessmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const assessment = await soxService.createSOXAssessment({
      ...req.body,
      organizationId: user.organizationId,
      assessorId: user.id,
    });
    res.status(201).json(assessment);
  })
);

router.get(
  '/assessments/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const assessment = await soxService.getSOXAssessmentById(req.params.id, user.organizationId);
    if (!assessment) {
      throw new AppError('Assessment not found', 404);
    }
    res.json(assessment);
  })
);

router.patch(
  '/assessments/:id',
  authorize('admin', 'editor'),
  validateBody(updateSOXAssessmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const assessment = await soxService.updateSOXAssessment(req.params.id, user.id, user.organizationId, req.body);
    res.json(assessment);
  })
);

router.delete(
  '/assessments/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    await soxService.deleteSOXAssessment(req.params.id, user.id, user.organizationId);
    res.status(204).send();
  })
);

// ============================================================================
// REPORTS
// ============================================================================

router.get(
  '/reports/full',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { fiscalYear } = req.query;
    try {
      const report = await soxService.generateSOXReport(user.organizationId, (fiscalYear as string) || '2026');
      res.json(report);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error generating SOX report:', error);
      throw new AppError('Failed to generate report', 500);
    }
  })
);

export default router;
