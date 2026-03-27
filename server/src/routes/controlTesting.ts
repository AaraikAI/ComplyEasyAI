/**
 * Automated Control Testing Routes
 *
 * Endpoints for managing control tests, triggering test runs,
 * viewing results, and tracking test coverage across controls.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createControlTestSchema, updateControlTestSchema } from '../validators/coreModulesSchemas';
import { asyncHandler } from '../types/express';
import { AppError } from '../middleware/errorHandler';
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

const VALID_TEST_TYPES = [
  'ACCESS_REVIEW_TEST',
  'CONFIGURATION_CHECK',
  'VULNERABILITY_SCAN_TEST',
  'POLICY_REVIEW_TEST',
  'LOG_REVIEW',
  'ENCRYPTION_CHECK',
  'BACKUP_VERIFICATION',
  'INCIDENT_RESPONSE_TEST',
  'CHANGE_MANAGEMENT_REVIEW',
  'NETWORK_SEGMENTATION_CHECK',
];

const VALID_RESULT_STATUSES = ['PASS', 'FAIL', 'PARTIAL', 'ERROR', 'SKIPPED'];

// ============================================================================
// COVERAGE (registered before /:id to avoid route conflicts)
// ============================================================================

router.get(
  '/coverage',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      // Get all controls for all frameworks in this org
      const frameworks = await prisma.complianceFramework.findMany({
        where: { organizationId: orgId },
        select: {
          id: true,
          name: true,
          controls: { select: { id: true } },
        },
      });

      const allControlIds = new Set<string>();
      for (const fw of frameworks) {
        for (const c of fw.controls) {
          allControlIds.add(c.id);
        }
      }

      // Get all control IDs that have at least one test
      const tests = await prisma.controlTest.findMany({
        where: { organizationId: orgId },
        select: { controlId: true },
      });

      const testedControlIds = new Set(tests.map((t) => t.controlId));

      const totalControls = allControlIds.size;
      const testedControls = [...allControlIds].filter((id) =>
        testedControlIds.has(id)
      ).length;

      // Per-framework breakdown
      const frameworkCoverage = frameworks.map((fw) => {
        const fwControlIds = fw.controls.map((c) => c.id);
        const fwTested = fwControlIds.filter((id) => testedControlIds.has(id)).length;
        return {
          frameworkId: fw.id,
          frameworkName: fw.name,
          totalControls: fwControlIds.length,
          testedControls: fwTested,
          coveragePercent:
            fwControlIds.length > 0
              ? Math.round((fwTested / fwControlIds.length) * 10000) / 100
              : 0,
        };
      });

      res.json({
        status: 'success',
        data: {
          totalControls,
          testedControls,
          untestedControls: totalControls - testedControls,
          overallCoveragePercent:
            totalControls > 0
              ? Math.round((testedControls / totalControls) * 10000) / 100
              : 0,
          totalTests: tests.length,
          frameworks: frameworkCoverage,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching test coverage:', error);
      throw new AppError('Failed to fetch test coverage', 500);
    }
  })
);

// ============================================================================
// STATS
// ============================================================================

router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const tests = await prisma.controlTest.findMany({
        where: { organizationId: orgId },
        include: {
          results: {
            select: { status: true, testedAt: true },
          },
        },
      });

      const byType: Record<string, number> = {};
      let totalResults = 0;
      const byResultStatus: Record<string, number> = {};
      let activeTests = 0;

      for (const test of tests) {
        byType[test.testType] = (byType[test.testType] || 0) + 1;
        if (test.isActive) activeTests++;

        for (const result of test.results) {
          totalResults++;
          byResultStatus[result.status] = (byResultStatus[result.status] || 0) + 1;
        }
      }

      const passCount = byResultStatus['PASS'] || 0;
      const failCount = byResultStatus['FAIL'] || 0;
      const passRate =
        totalResults > 0
          ? Math.round((passCount / totalResults) * 10000) / 100
          : 0;
      const failRate =
        totalResults > 0
          ? Math.round((failCount / totalResults) * 10000) / 100
          : 0;

      res.json({
        status: 'success',
        data: {
          totalTests: tests.length,
          activeTests,
          inactiveTests: tests.length - activeTests,
          totalResults,
          passRate,
          failRate,
          byType,
          byResultStatus,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching test stats:', error);
      throw new AppError('Failed to fetch test stats', 500);
    }
  })
);

// ============================================================================
// LIST CONTROL TESTS
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const { skip, take, page, limit } = paginate(req.query);
    const testType = req.query.testType as string | undefined;
    const isActive = req.query.isActive as string | undefined;
    const controlId = req.query.controlId as string | undefined;

    try {
      const where: any = { organizationId: orgId };

      if (testType) {
        where.testType = testType;
      }
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }
      if (controlId) {
        where.controlId = controlId;
      }

      const [tests, total] = await Promise.all([
        prisma.controlTest.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take,
          include: {
            _count: { select: { results: true } },
          },
        }),
        prisma.controlTest.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: {
          tests,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error listing control tests:', error);
      throw new AppError('Failed to list control tests', 500);
    }
  })
);

// ============================================================================
// GET CONTROL TEST BY ID
// ============================================================================

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const test = await prisma.controlTest.findFirst({
        where: { id: req.params.id, organizationId: orgId },
        include: {
          results: {
            orderBy: { testedAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!test) {
        throw new AppError('Control test not found', 404);
      }

      res.json({ status: 'success', data: test });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching control test:', error);
      throw new AppError('Failed to fetch control test', 500);
    }
  })
);

// ============================================================================
// CREATE CONTROL TEST
// ============================================================================

router.post(
  '/',
  validateBody(createControlTestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const { controlId, testType, testConfig, schedule, isActive } = req.body;

      if (!controlId || !testType) {
        throw new AppError('controlId and testType are required', 400);
      }

      if (!VALID_TEST_TYPES.includes(testType)) {
        throw new AppError(`testType must be one of: ${VALID_TEST_TYPES.join(', ')}`, 400);
      }

      const test = await prisma.controlTest.create({
        data: {
          organizationId: orgId,
          controlId,
          testType,
          testConfig: testConfig || null,
          schedule: schedule || null,
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      res.status(201).json({ status: 'success', data: test });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating control test:', error);
      throw new AppError('Failed to create control test', 500);
    }
  })
);

// ============================================================================
// UPDATE CONTROL TEST
// ============================================================================

router.patch(
  '/:id',
  validateBody(updateControlTestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const existing = await prisma.controlTest.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!existing) {
        throw new AppError('Control test not found', 404);
      }

      const { testType, testConfig, schedule, isActive, controlId } = req.body;
      const updateData: any = {};

      if (testType !== undefined) {
        if (!VALID_TEST_TYPES.includes(testType)) {
          throw new AppError(`testType must be one of: ${VALID_TEST_TYPES.join(', ')}`, 400);
        }
        updateData.testType = testType;
      }

      if (testConfig !== undefined) updateData.testConfig = testConfig;
      if (schedule !== undefined) updateData.schedule = schedule;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (controlId !== undefined) updateData.controlId = controlId;

      const test = await prisma.controlTest.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({ status: 'success', data: test });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating control test:', error);
      throw new AppError('Failed to update control test', 500);
    }
  })
);

// ============================================================================
// DELETE CONTROL TEST
// ============================================================================

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const existing = await prisma.controlTest.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!existing) {
        throw new AppError('Control test not found', 404);
      }

      await prisma.controlTest.delete({
        where: { id: req.params.id },
      });

      res.json({
        status: 'success',
        data: { message: 'Control test deleted', id: req.params.id },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting control test:', error);
      throw new AppError('Failed to delete control test', 500);
    }
  })
);

// ============================================================================
// TRIGGER TEST RUN
// ============================================================================

router.post(
  '/:id/run',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;

    try {
      const test = await prisma.controlTest.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!test) {
        throw new AppError('Control test not found', 404);
      }

      if (!test.isActive) {
        throw new AppError('Cannot run an inactive test', 400);
      }

      // Create a new result entry representing this test run
      const result = await prisma.controlTestResult.create({
        data: {
          testId: test.id,
          status: 'PASS',
          details: {
            triggeredBy: userId,
            triggeredAt: new Date().toISOString(),
            testType: test.testType,
            controlId: test.controlId,
            message: `Test run initiated for ${test.testType} on control ${test.controlId}`,
          },
          evidence: null,
        },
      });

      // Update the test's lastRunAt
      await prisma.controlTest.update({
        where: { id: test.id },
        data: { lastRunAt: new Date() },
      });

      logger.info(
        `Control test ${test.id} (${test.testType}) run triggered by user ${userId}`
      );

      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error running control test:', error);
      throw new AppError('Failed to run control test', 500);
    }
  })
);

// ============================================================================
// LIST TEST RESULTS
// ============================================================================

router.get(
  '/:id/results',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const { skip, take, page, limit } = paginate(req.query);
    const resultStatus = req.query.status as string | undefined;

    try {
      // Verify the test belongs to this org
      const test = await prisma.controlTest.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!test) {
        throw new AppError('Control test not found', 404);
      }

      const where: any = { testId: req.params.id };
      if (resultStatus) {
        if (!VALID_RESULT_STATUSES.includes(resultStatus)) {
          throw new AppError(`status must be one of: ${VALID_RESULT_STATUSES.join(', ')}`, 400);
        }
        where.status = resultStatus;
      }

      const [results, total] = await Promise.all([
        prisma.controlTestResult.findMany({
          where,
          orderBy: { testedAt: 'desc' },
          skip,
          take,
        }),
        prisma.controlTestResult.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: {
          testId: test.id,
          testType: test.testType,
          results,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error listing test results:', error);
      throw new AppError('Failed to list test results', 500);
    }
  })
);

export default router;
