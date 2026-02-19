/**
 * SOX Compliance Module Routes
 * Routes for SOX controls, testing, deficiencies, walkthroughs, and reporting.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import soxService from '../services/soxService';
import logger from '../config/logger';

const router = Router();
router.use(authenticate);

// ============================================================================
// DASHBOARD
// ============================================================================

router.get(
  '/dashboard',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    try {
      const dashboard = await soxService.getSOXDashboard(user.organizationId);
      res.json(dashboard);
    } catch (error) {
      logger.error('Error fetching SOX dashboard:', error);
      res.json({
        complianceScore: 0,
        totalControls: 0,
        testedControls: 0,
        deficiencies: 0,
        materialWeaknesses: 0,
        controlsByEffectiveness: {},
        recentActivity: [],
        upcomingDeadlines: [],
      });
    }
  })
);

// ============================================================================
// CONTROLS (CRUD)
// ============================================================================

router.get(
  '/controls',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    try {
      const controls = await soxService.getSOXControls(user.organizationId);
      res.json(controls);
    } catch (error) {
      logger.error('Error fetching SOX controls:', error);
      res.json([]);
    }
  })
);

router.post(
  '/controls',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
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
    const user = (req as any).user;
    const control = await soxService.getSOXControlById(req.params.id, user.organizationId);
    if (!control) {
      res.status(404).json({ error: 'Control not found' });
      return;
    }
    res.json(control);
  })
);

router.patch(
  '/controls/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const control = await soxService.updateSOXControl(req.params.id, user.id, user.organizationId, req.body);
    res.json(control);
  })
);

router.delete(
  '/controls/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    await soxService.deleteSOXControl(req.params.id, user.id, user.organizationId);
    res.status(204).send();
  })
);

// ============================================================================
// TESTING
// ============================================================================

router.get(
  '/tests',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    try {
      const tests = await soxService.getSOXTestResults(user.organizationId);
      res.json(tests);
    } catch (error) {
      logger.error('Error fetching SOX tests:', error);
      res.json([]);
    }
  })
);

router.post(
  '/tests',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const test = await soxService.createSOXTestResult({
      ...req.body,
      organizationId: user.organizationId,
      testerId: user.id,
    });
    res.status(201).json(test);
  })
);

router.get(
  '/tests/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const test = await soxService.getSOXTestResultById(req.params.id, user.organizationId);
    if (!test) {
      res.status(404).json({ error: 'Test not found' });
      return;
    }
    res.json(test);
  })
);

router.patch(
  '/tests/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const test = await soxService.updateSOXTestResult(req.params.id, user.id, user.organizationId, req.body);
    res.json(test);
  })
);

router.delete(
  '/tests/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
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
    const user = (req as any).user;
    try {
      const assessments = await soxService.getSOXAssessments(user.organizationId);
      res.json(assessments);
    } catch (error) {
      logger.error('Error fetching SOX assessments:', error);
      res.json([]);
    }
  })
);

router.post(
  '/assessments',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
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
    const user = (req as any).user;
    const assessment = await soxService.getSOXAssessmentById(req.params.id, user.organizationId);
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }
    res.json(assessment);
  })
);

router.patch(
  '/assessments/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const assessment = await soxService.updateSOXAssessment(req.params.id, user.id, user.organizationId, req.body);
    res.json(assessment);
  })
);

router.delete(
  '/assessments/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
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
    const user = (req as any).user;
    const { fiscalYear } = req.query;
    try {
      const report = await soxService.generateSOXReport(user.organizationId, (fiscalYear as string) || '2026');
      res.json(report);
    } catch (error) {
      logger.error('Error generating SOX report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  })
);

export default router;
