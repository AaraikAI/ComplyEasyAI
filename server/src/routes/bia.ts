/**
 * Business Impact Analysis (BIA) Routes
 *
 * Manage business processes with criticality ratings, RTO/RPO/MTPD targets,
 * dependency mapping, and aggregated BIA statistics.
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
      logger.error('Error fetching BIA statistics:', error);
      res.status(500).json({ error: 'Failed to fetch BIA statistics' });
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
      logger.error('Error fetching business processes:', error);
      res.status(500).json({ error: 'Failed to fetch business processes' });
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
        res.status(404).json({ error: 'Business process not found' });
        return;
      }

      // Also find processes that depend on this one (reverse dependencies)
      const dependents = await prisma.processDependency.findMany({
        where: { dependsOn: req.params.id },
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
      logger.error('Error fetching business process:', error);
      res.status(500).json({ error: 'Failed to fetch business process' });
    }
  })
);

// ============================================================================
// CREATE BUSINESS PROCESS
// ============================================================================

router.post(
  '/processes',
  authorize('admin', 'editor'),
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
        res.status(400).json({ error: 'name, owner, and department are required' });
        return;
      }

      if (criticality) {
        const validCriticalities = [
          'MISSION_CRITICAL', 'BUSINESS_CRITICAL', 'IMPORTANT', 'STANDARD', 'LOW_PRIORITY',
        ];
        if (!validCriticalities.includes(criticality)) {
          res.status(400).json({
            error: `criticality must be one of: ${validCriticalities.join(', ')}`,
          });
          return;
        }
      }

      // Validate numeric fields
      if (rto !== undefined && (typeof rto !== 'number' || rto < 0)) {
        res.status(400).json({ error: 'rto must be a non-negative number (hours)' });
        return;
      }
      if (rpo !== undefined && (typeof rpo !== 'number' || rpo < 0)) {
        res.status(400).json({ error: 'rpo must be a non-negative number (hours)' });
        return;
      }
      if (mtpd !== undefined && (typeof mtpd !== 'number' || mtpd < 0)) {
        res.status(400).json({ error: 'mtpd must be a non-negative number (hours)' });
        return;
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
      logger.error('Error creating business process:', error);
      res.status(500).json({ error: 'Failed to create business process' });
    }
  })
);

// ============================================================================
// UPDATE BUSINESS PROCESS
// ============================================================================

router.patch(
  '/processes/:id',
  authorize('admin', 'editor'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.businessProcess.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Business process not found' });
        return;
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
          res.status(400).json({
            error: `criticality must be one of: ${validCriticalities.join(', ')}`,
          });
          return;
        }
      }

      // Validate numeric fields if provided
      if (updateData.rto !== undefined && (typeof updateData.rto !== 'number' || updateData.rto < 0)) {
        res.status(400).json({ error: 'rto must be a non-negative number (hours)' });
        return;
      }
      if (updateData.rpo !== undefined && (typeof updateData.rpo !== 'number' || updateData.rpo < 0)) {
        res.status(400).json({ error: 'rpo must be a non-negative number (hours)' });
        return;
      }
      if (updateData.mtpd !== undefined && (typeof updateData.mtpd !== 'number' || updateData.mtpd < 0)) {
        res.status(400).json({ error: 'mtpd must be a non-negative number (hours)' });
        return;
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
      logger.error('Error updating business process:', error);
      res.status(500).json({ error: 'Failed to update business process' });
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
        res.status(404).json({ error: 'Business process not found' });
        return;
      }

      // Check for dependents before deletion
      const dependents = await prisma.processDependency.count({
        where: { dependsOn: req.params.id },
      });

      if (dependents > 0) {
        res.status(400).json({
          error: `Cannot delete process: ${dependents} other process(es) depend on it. Remove those dependencies first.`,
        });
        return;
      }

      // Cascade will handle deleting this process's own dependencies
      await prisma.businessProcess.delete({
        where: { id: req.params.id },
      });

      res.json({ status: 'success', data: { message: 'Business process deleted', id: req.params.id } });
    } catch (error) {
      logger.error('Error deleting business process:', error);
      res.status(500).json({ error: 'Failed to delete business process' });
    }
  })
);

// ============================================================================
// ADD DEPENDENCY
// ============================================================================

router.post(
  '/processes/:id/dependencies',
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
        res.status(404).json({ error: 'Business process not found' });
        return;
      }

      const { dependsOn, type, isCritical } = req.body;

      if (!dependsOn || !type) {
        res.status(400).json({ error: 'dependsOn and type are required' });
        return;
      }

      const validTypes = ['INTERNAL_PROCESS', 'VENDOR_SERVICE', 'TECHNOLOGY', 'PERSONNEL', 'FACILITY'];
      if (!validTypes.includes(type)) {
        res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
        return;
      }

      // Prevent self-dependency
      if (dependsOn === req.params.id) {
        res.status(400).json({ error: 'A process cannot depend on itself' });
        return;
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
        res.status(400).json({ error: 'This dependency already exists' });
        return;
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
      logger.error('Error adding dependency:', error);
      res.status(500).json({ error: 'Failed to add dependency' });
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
        res.status(404).json({ error: 'Business process not found' });
        return;
      }

      const dependency = await prisma.processDependency.findFirst({
        where: { id: req.params.depId, processId: req.params.id },
      });

      if (!dependency) {
        res.status(404).json({ error: 'Dependency not found' });
        return;
      }

      await prisma.processDependency.delete({
        where: { id: req.params.depId },
      });

      res.json({ status: 'success', data: { message: 'Dependency removed', id: req.params.depId } });
    } catch (error) {
      logger.error('Error removing dependency:', error);
      res.status(500).json({ error: 'Failed to remove dependency' });
    }
  })
);

export default router;
