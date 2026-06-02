/**
 * Business Impact Analysis (BIA) Routes
 *
 * Manage business processes with criticality ratings, RTO/RPO/MTPD targets,
 * dependency mapping, and aggregated BIA statistics.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createBusinessProcessSchema, updateBusinessProcessSchema,
  createProcessDependencySchema,
} from '../validators/coreModulesSchemas';
import { asyncHandler } from '../types/express';
import prisma from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';

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

// ============================================================================
// BIA STATISTICS (before /processes/:id to avoid route conflicts)
// ============================================================================

router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;
    try {
      const processes = await prisma.businessProcess.findMany({
        where: { organizationId: orgId },
        select: {
          criticality: true,
          department: true,
          rto: true,
          rpo: true,
          mtpd: true,
        },
      });

      const byCriticality: Record<string, number> = {};
      const byDepartment: Record<string, number> = {};
      let totalRto = 0;
      let totalRpo = 0;
      let totalMtpd = 0;

      for (const proc of processes) {
        byCriticality[proc.criticality] = (byCriticality[proc.criticality] || 0) + 1;
        byDepartment[proc.department] = (byDepartment[proc.department] || 0) + 1;
        totalRto += proc.rto;
        totalRpo += proc.rpo;
        totalMtpd += proc.mtpd;
      }

      const count = processes.length;

      // Count dependencies
      const dependencyCount = await prisma.processDependency.count({
        where: {
          process: { organizationId: orgId },
        },
      });

      const criticalDependencies = await prisma.processDependency.count({
        where: {
          process: { organizationId: orgId },
          isCritical: true,
        },
      });

      res.json({
        status: 'success',
        data: {
          totalProcesses: count,
          byCriticality,
          byDepartment,
          averageRtoHours: count > 0 ? Math.round((totalRto / count) * 100) / 100 : 0,
          averageRpoHours: count > 0 ? Math.round((totalRpo / count) * 100) / 100 : 0,
          averageMtpdHours: count > 0 ? Math.round((totalMtpd / count) * 100) / 100 : 0,
          totalDependencies: dependencyCount,
          criticalDependencies,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching BIA statistics:', error);
      throw new AppError('Failed to fetch BIA statistics', 500);
    }
  })
);

// ============================================================================
// LIST BUSINESS PROCESSES
// ============================================================================

router.get(
  '/processes',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    const criticality = req.query.criticality as string | undefined;
    const department = req.query.department as string | undefined;
    const search = (req.query.search as string) || '';

    try {
      const where: any = { organizationId: user.organizationId };
      if (criticality) where.criticality = criticality;
      if (department) where.department = { contains: department, mode: 'insensitive' };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { owner: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [processes, total] = await Promise.all([
        prisma.businessProcess.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take,
          include: {
            _count: { select: { dependencies: true } },
          },
        }),
        prisma.businessProcess.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: processes,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching business processes:', error);
      throw new AppError('Failed to fetch business processes', 500);
    }
  })
);

// ============================================================================
// GET BUSINESS PROCESS BY ID
// ============================================================================

router.get(
  '/processes/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const process = await prisma.businessProcess.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
        include: {
          dependencies: { orderBy: { type: 'asc' } },
        },
      });

      if (!process) {
        throw new AppError('Business process not found', 404);
      }

      // Also find processes that depend on this one (reverse dependencies).
      // Scope the owning process by organizationId so only same-tenant
      // dependent process names are surfaced even if ids ever collide.
      const dependents = await prisma.processDependency.findMany({
        where: {
          dependsOn: req.params.id,
          process: { organizationId: user.organizationId },
        },
        include: {
          process: {
            select: { id: true, name: true, criticality: true, department: true },
          },
        },
      });

      res.json({
        status: 'success',
        data: {
          ...process,
          dependents: dependents.map((d) => ({
            id: d.id,
            processId: d.processId,
            processName: d.process.name,
            criticality: d.process.criticality,
            department: d.process.department,
            type: d.type,
            isCritical: d.isCritical,
          })),
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching business process:', error);
      throw new AppError('Failed to fetch business process', 500);
    }
  })
);

// ============================================================================
// CREATE BUSINESS PROCESS
// ============================================================================

router.post(
  '/processes',
  authorize('admin', 'editor'),
  validateBody(createBusinessProcessSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const {
        name,
        description,
        owner,
        department,
        criticality,
        rto,
        rpo,
        mtpd,
        impactAnalysis,
        assets,
      } = req.body;

      if (!name || !owner || !department) {
        throw new AppError('name, owner, and department are required', 400);
      }

      if (criticality) {
        const validCriticalities = [
          'MISSION_CRITICAL', 'BUSINESS_CRITICAL', 'IMPORTANT', 'STANDARD', 'LOW_PRIORITY',
        ];
        if (!validCriticalities.includes(criticality)) {
          throw new AppError(`criticality must be one of: ${validCriticalities.join(', ')}`, 400);
        }
      }

      // Validate numeric fields
      if (rto !== undefined && (typeof rto !== 'number' || rto < 0)) {
        throw new AppError('rto must be a non-negative number (hours)', 400);
      }
      if (rpo !== undefined && (typeof rpo !== 'number' || rpo < 0)) {
        throw new AppError('rpo must be a non-negative number (hours)', 400);
      }
      if (mtpd !== undefined && (typeof mtpd !== 'number' || mtpd < 0)) {
        throw new AppError('mtpd must be a non-negative number (hours)', 400);
      }

      const process = await prisma.businessProcess.create({
        data: {
          organizationId: user.organizationId,
          name,
          description: description || null,
          owner,
          department,
          criticality: criticality || 'STANDARD',
          rto: rto ?? 24,
          rpo: rpo ?? 24,
          mtpd: mtpd ?? 72,
          impactAnalysis: impactAnalysis || null,
          assets: assets || [],
        },
        include: {
          dependencies: true,
        },
      });

      res.status(201).json({ status: 'success', data: process });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating business process:', error);
      throw new AppError('Failed to create business process', 500);
    }
  })
);

// ============================================================================
// UPDATE BUSINESS PROCESS
// ============================================================================

router.patch(
  '/processes/:id',
  authorize('admin', 'editor'),
  validateBody(updateBusinessProcessSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.businessProcess.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Business process not found', 404);
      }

      // Whitelist updatable fields only
      const { pick } = await import('../utils/pick');
      const updateData = pick(req.body, [
        'name', 'description', 'owner', 'department', 'criticality',
        'rto', 'rpo', 'mtpd', 'impactAnalysis', 'assets',
      ]);

      // Validate criticality if provided
      if (updateData.criticality) {
        const validCriticalities = [
          'MISSION_CRITICAL', 'BUSINESS_CRITICAL', 'IMPORTANT', 'STANDARD', 'LOW_PRIORITY',
        ];
        if (!validCriticalities.includes(updateData.criticality)) {
          throw new AppError(`criticality must be one of: ${validCriticalities.join(', ')}`, 400);
        }
      }

      // Validate numeric fields if provided
      if (updateData.rto !== undefined && (typeof updateData.rto !== 'number' || updateData.rto < 0)) {
        throw new AppError('rto must be a non-negative number (hours)', 400);
      }
      if (updateData.rpo !== undefined && (typeof updateData.rpo !== 'number' || updateData.rpo < 0)) {
        throw new AppError('rpo must be a non-negative number (hours)', 400);
      }
      if (updateData.mtpd !== undefined && (typeof updateData.mtpd !== 'number' || updateData.mtpd < 0)) {
        throw new AppError('mtpd must be a non-negative number (hours)', 400);
      }

      const process = await prisma.businessProcess.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          dependencies: true,
        },
      });

      res.json({ status: 'success', data: process });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating business process:', error);
      throw new AppError('Failed to update business process', 500);
    }
  })
);

// ============================================================================
// DELETE BUSINESS PROCESS
// ============================================================================

router.delete(
  '/processes/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.businessProcess.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Business process not found', 404);
      }

      // Check for dependents before deletion
      const dependents = await prisma.processDependency.count({
        where: { dependsOn: req.params.id },
      });

      if (dependents > 0) {
        throw new AppError(`Cannot delete process: ${dependents} other process(es) depend on it. Remove those dependencies first.`, 400);
      }

      // Cascade will handle deleting this process's own dependencies
      await prisma.businessProcess.delete({
        where: { id: req.params.id },
      });

      res.json({ status: 'success', data: { message: 'Business process deleted', id: req.params.id } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting business process:', error);
      throw new AppError('Failed to delete business process', 500);
    }
  })
);

// ============================================================================
// ADD DEPENDENCY
// ============================================================================

router.post(
  '/processes/:id/dependencies',
  authorize('admin', 'editor'),
  validateBody(createProcessDependencySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      // Verify the process belongs to the org
      const process = await prisma.businessProcess.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
        select: { id: true },
      });

      if (!process) {
        throw new AppError('Business process not found', 404);
      }

      const { dependsOn, type, isCritical } = req.body;

      if (!dependsOn || !type) {
        throw new AppError('dependsOn and type are required', 400);
      }

      const validTypes = ['INTERNAL_PROCESS', 'VENDOR_SERVICE', 'TECHNOLOGY', 'PERSONNEL', 'FACILITY'];
      if (!validTypes.includes(type)) {
        throw new AppError(`type must be one of: ${validTypes.join(', ')}`, 400);
      }

      // Prevent self-dependency
      if (dependsOn === req.params.id) {
        throw new AppError('A process cannot depend on itself', 400);
      }

      // When the dependency targets another internal process, verify that
      // referenced process belongs to the caller's organization. This blocks
      // linking a dependency to a process id owned by a different tenant.
      if (type === 'INTERNAL_PROCESS') {
        const target = await prisma.businessProcess.findFirst({
          where: { id: dependsOn, organizationId: user.organizationId },
          select: { id: true },
        });
        if (!target) {
          throw new AppError('Referenced process not found in your organization', 404);
        }
      }

      // Check for duplicate dependency
      const existingDep = await prisma.processDependency.findFirst({
        where: {
          processId: req.params.id,
          dependsOn,
          type,
        },
      });

      if (existingDep) {
        throw new AppError('This dependency already exists', 400);
      }

      const dependency = await prisma.processDependency.create({
        data: {
          processId: req.params.id,
          dependsOn,
          type,
          isCritical: isCritical || false,
        },
      });

      res.status(201).json({ status: 'success', data: dependency });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error adding dependency:', error);
      throw new AppError('Failed to add dependency', 500);
    }
  })
);

// ============================================================================
// REMOVE DEPENDENCY
// ============================================================================

router.delete(
  '/processes/:id/dependencies/:depId',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      // Verify the process belongs to the org
      const process = await prisma.businessProcess.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
        select: { id: true },
      });

      if (!process) {
        throw new AppError('Business process not found', 404);
      }

      const dependency = await prisma.processDependency.findFirst({
        where: { id: req.params.depId, processId: req.params.id },
      });

      if (!dependency) {
        throw new AppError('Dependency not found', 404);
      }

      await prisma.processDependency.delete({
        where: { id: req.params.depId },
      });

      res.json({ status: 'success', data: { message: 'Dependency removed', id: req.params.depId } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error removing dependency:', error);
      throw new AppError('Failed to remove dependency', 500);
    }
  })
);

export default router;
