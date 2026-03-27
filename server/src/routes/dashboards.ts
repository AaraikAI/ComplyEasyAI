/**
 * Custom Dashboard Builder Routes
 *
 * Endpoints for creating, managing, and sharing custom dashboards
 * with configurable widget layouts. Includes pre-built templates
 * for CISO, DPO, Audit, and Board personas.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import {
  createDashboardSchema,
  updateDashboardSchema,
  createWidgetSchema,
  updateWidgetSchema,
  cloneDashboardSchema,
} from '../validators/dashboardSchemas';
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
// PRE-BUILT DASHBOARD TEMPLATES (before /:id to avoid route conflicts)
// ============================================================================

const DASHBOARD_TEMPLATES = [
  {
    id: 'tpl-ciso',
    name: 'CISO Executive Dashboard',
    description: 'High-level security posture overview for Chief Information Security Officers',
    persona: 'CISO',
    layout: { columns: 3, rows: 4 },
    widgets: [
      { type: 'METRIC_CARD', title: 'Overall Risk Score', config: { metric: 'riskScore', format: 'score' }, position: { x: 0, y: 0, w: 1, h: 1 } },
      { type: 'METRIC_CARD', title: 'Open Incidents', config: { metric: 'openIncidents', format: 'count' }, position: { x: 1, y: 0, w: 1, h: 1 } },
      { type: 'METRIC_CARD', title: 'Compliance Score', config: { metric: 'complianceScore', format: 'percentage' }, position: { x: 2, y: 0, w: 1, h: 1 } },
      { type: 'LINE_CHART', title: 'Risk Trend (90 Days)', config: { metric: 'riskTrend', period: '90d' }, position: { x: 0, y: 1, w: 2, h: 2 } },
      { type: 'PIE_CHART', title: 'Risks by Severity', config: { metric: 'risksBySeverity' }, position: { x: 2, y: 1, w: 1, h: 2 } },
      { type: 'TABLE', title: 'Critical Risks', config: { metric: 'criticalRisks', limit: 5 }, position: { x: 0, y: 3, w: 3, h: 1 } },
    ],
  },
  {
    id: 'tpl-dpo',
    name: 'DPO Privacy Dashboard',
    description: 'Data protection officer view with GDPR compliance metrics and DSAR tracking',
    persona: 'DPO',
    layout: { columns: 3, rows: 4 },
    widgets: [
      { type: 'METRIC_CARD', title: 'Active DSARs', config: { metric: 'activeDsars', format: 'count' }, position: { x: 0, y: 0, w: 1, h: 1 } },
      { type: 'METRIC_CARD', title: 'Pending DPIAs', config: { metric: 'pendingDpias', format: 'count' }, position: { x: 1, y: 0, w: 1, h: 1 } },
      { type: 'METRIC_CARD', title: 'Consent Rate', config: { metric: 'consentRate', format: 'percentage' }, position: { x: 2, y: 0, w: 1, h: 1 } },
      { type: 'BAR_CHART', title: 'DSARs by Type', config: { metric: 'dsarsByType' }, position: { x: 0, y: 1, w: 2, h: 2 } },
      { type: 'LIST', title: 'Upcoming DPIA Reviews', config: { metric: 'upcomingDpiaReviews', limit: 5 }, position: { x: 2, y: 1, w: 1, h: 2 } },
      { type: 'TABLE', title: 'Data Processing Activities', config: { metric: 'processingActivities', limit: 10 }, position: { x: 0, y: 3, w: 3, h: 1 } },
    ],
  },
  {
    id: 'tpl-audit',
    name: 'Audit Readiness Dashboard',
    description: 'Audit preparation view with evidence collection status and control testing results',
    persona: 'Audit',
    layout: { columns: 3, rows: 4 },
    widgets: [
      { type: 'METRIC_CARD', title: 'Controls Tested', config: { metric: 'controlsTested', format: 'fraction' }, position: { x: 0, y: 0, w: 1, h: 1 } },
      { type: 'METRIC_CARD', title: 'Evidence Collected', config: { metric: 'evidenceCollected', format: 'percentage' }, position: { x: 1, y: 0, w: 1, h: 1 } },
      { type: 'METRIC_CARD', title: 'Open Findings', config: { metric: 'openFindings', format: 'count' }, position: { x: 2, y: 0, w: 1, h: 1 } },
      { type: 'STACKED_BAR', title: 'Control Status by Framework', config: { metric: 'controlStatusByFramework' }, position: { x: 0, y: 1, w: 2, h: 2 } },
      { type: 'DONUT_CHART', title: 'Findings by Severity', config: { metric: 'findingsBySeverity' }, position: { x: 2, y: 1, w: 1, h: 2 } },
      { type: 'TABLE', title: 'Upcoming Deadlines', config: { metric: 'auditDeadlines', limit: 10 }, position: { x: 0, y: 3, w: 3, h: 1 } },
    ],
  },
  {
    id: 'tpl-board',
    name: 'Board Report Dashboard',
    description: 'Executive summary for board-level reporting with key compliance and risk indicators',
    persona: 'Board',
    layout: { columns: 3, rows: 3 },
    widgets: [
      { type: 'METRIC_CARD', title: 'Compliance Maturity', config: { metric: 'complianceMaturity', format: 'level' }, position: { x: 0, y: 0, w: 1, h: 1 } },
      { type: 'METRIC_CARD', title: 'Vendor Risk Exposure', config: { metric: 'vendorRiskExposure', format: 'score' }, position: { x: 1, y: 0, w: 1, h: 1 } },
      { type: 'METRIC_CARD', title: 'Policy Compliance', config: { metric: 'policyCompliance', format: 'percentage' }, position: { x: 2, y: 0, w: 1, h: 1 } },
      { type: 'LINE_CHART', title: 'Compliance Trend (12 Months)', config: { metric: 'complianceTrend', period: '12m' }, position: { x: 0, y: 1, w: 2, h: 1 } },
      { type: 'HEATMAP', title: 'Risk Heatmap', config: { metric: 'riskHeatmap' }, position: { x: 2, y: 1, w: 1, h: 1 } },
      { type: 'TABLE', title: 'Key Risk Indicators', config: { metric: 'keyRiskIndicators', limit: 5 }, position: { x: 0, y: 2, w: 3, h: 1 } },
    ],
  },
];

router.get(
  '/templates',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ status: 'success', data: DASHBOARD_TEMPLATES });
  })
);

// ============================================================================
// LIST DASHBOARDS
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;
    const { skip, take, page, limit } = paginate(req.query);

    try {
      const where: any = {
        organizationId: orgId,
        OR: [
          { createdBy: userId },
          { isShared: true },
        ],
      };

      const [dashboards, total] = await Promise.all([
        prisma.customDashboard.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take,
          include: {
            _count: { select: { widgets: true } },
          },
        }),
        prisma.customDashboard.count({ where }),
      ]);

      // Enrich with creator names
      const creatorIds = [...new Set(dashboards.map((d) => d.createdBy))];
      const creators = await prisma.user.findMany({
        where: { id: { in: creatorIds } },
        select: { id: true, name: true, email: true },
      });
      const creatorMap = new Map(creators.map((c) => [c.id, c]));

      const enriched = dashboards.map((d) => ({
        ...d,
        creator: creatorMap.get(d.createdBy) || { id: d.createdBy, name: 'Unknown' },
        isOwner: d.createdBy === userId,
      }));

      res.json({
        status: 'success',
        data: enriched,
        meta: {
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching dashboards:', error);
      throw new AppError('Failed to fetch dashboards', 500);
    }
  })
);

// ============================================================================
// GET DASHBOARD BY ID (with widgets)
// ============================================================================

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;

    try {
      const dashboard = await prisma.customDashboard.findFirst({
        where: {
          id: req.params.id,
          organizationId: orgId,
          OR: [
            { createdBy: userId },
            { isShared: true },
          ],
        },
        include: {
          widgets: {
            orderBy: { id: 'asc' },
          },
        },
      });

      if (!dashboard) {
        throw new AppError('Dashboard not found', 404);
      }

      // Get creator info
      const creator = await prisma.user.findUnique({
        where: { id: dashboard.createdBy },
        select: { id: true, name: true, email: true },
      });

      res.json({
        status: 'success',
        data: {
          ...dashboard,
          creator: creator || { id: dashboard.createdBy, name: 'Unknown' },
          isOwner: dashboard.createdBy === userId,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching dashboard:', error);
      throw new AppError('Failed to fetch dashboard', 500);
    }
  })
);

// ============================================================================
// CREATE DASHBOARD
// ============================================================================

router.post(
  '/',
  validateBody(createDashboardSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;

    try {
      const { name, description, isShared, layout } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new AppError('name is required', 400);
      }

      // Enforce per-org dashboard limit
      const existingCount = await prisma.customDashboard.count({
        where: { organizationId: orgId },
      });

      if (existingCount >= 50) {
        throw new AppError('Maximum of 50 dashboards per organization reached', 400);
      }

      const dashboard = await prisma.customDashboard.create({
        data: {
          organizationId: orgId,
          createdBy: userId,
          name: name.trim(),
          description: description || null,
          isShared: isShared ?? false,
          layout: layout || { columns: 3, rows: 4 },
        },
      });

      res.status(201).json({ status: 'success', data: dashboard });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating dashboard:', error);
      throw new AppError('Failed to create dashboard', 500);
    }
  })
);

// ============================================================================
// UPDATE DASHBOARD
// ============================================================================

router.patch(
  '/:id',
  validateBody(updateDashboardSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    try {
      const existing = await prisma.customDashboard.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!existing) {
        throw new AppError('Dashboard not found', 404);
      }

      // Only owner or admin can update
      if (existing.createdBy !== userId && userRole !== 'admin') {
        throw new AppError('Only the dashboard owner or an admin can update this dashboard', 403);
      }

      const { name, description, isShared, layout, isDefault } = req.body;
      const updateData: any = {};

      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description;
      if (typeof isShared === 'boolean') updateData.isShared = isShared;
      if (layout !== undefined) updateData.layout = layout;
      if (typeof isDefault === 'boolean') updateData.isDefault = isDefault;

      // If setting as default, unset other defaults for this user
      if (isDefault === true) {
        await prisma.customDashboard.updateMany({
          where: {
            organizationId: orgId,
            createdBy: userId,
            isDefault: true,
            id: { not: req.params.id },
          },
          data: { isDefault: false },
        });
      }

      const dashboard = await prisma.customDashboard.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({ status: 'success', data: dashboard });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating dashboard:', error);
      throw new AppError('Failed to update dashboard', 500);
    }
  })
);

// ============================================================================
// DELETE DASHBOARD (owner or admin only)
// ============================================================================

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    try {
      const existing = await prisma.customDashboard.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!existing) {
        throw new AppError('Dashboard not found', 404);
      }

      if (existing.createdBy !== userId && userRole !== 'admin') {
        throw new AppError('Only the dashboard owner or an admin can delete this dashboard', 403);
      }

      // Cascade delete handles widgets via DB constraint
      await prisma.customDashboard.delete({
        where: { id: req.params.id },
      });

      res.json({ status: 'success', data: { id: req.params.id, deleted: true } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting dashboard:', error);
      throw new AppError('Failed to delete dashboard', 500);
    }
  })
);

// ============================================================================
// ADD WIDGET TO DASHBOARD
// ============================================================================

router.post(
  '/:id/widgets',
  validateBody(createWidgetSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    try {
      const dashboard = await prisma.customDashboard.findFirst({
        where: { id: req.params.id, organizationId: orgId },
        include: { _count: { select: { widgets: true } } },
      });

      if (!dashboard) {
        throw new AppError('Dashboard not found', 404);
      }

      if (dashboard.createdBy !== userId && userRole !== 'admin') {
        throw new AppError('Only the dashboard owner or an admin can add widgets', 403);
      }

      // Enforce widget limit per dashboard
      if (dashboard._count.widgets >= 30) {
        throw new AppError('Maximum of 30 widgets per dashboard reached', 400);
      }

      const { type, title, config, position } = req.body;

      if (!type || !title) {
        throw new AppError('type and title are required', 400);
      }

      const validTypes = [
        'METRIC_CARD', 'LINE_CHART', 'BAR_CHART', 'PIE_CHART',
        'DONUT_CHART', 'STACKED_BAR', 'TABLE', 'LIST', 'HEATMAP',
        'GAUGE', 'SCATTER', 'AREA_CHART', 'TEXT', 'IFRAME',
      ];

      if (!validTypes.includes(type)) {
        throw new AppError(`type must be one of: ${validTypes.join(', ')}`, 400);
      }

      const widget = await prisma.dashboardWidget.create({
        data: {
          dashboardId: req.params.id,
          type,
          title: title.trim(),
          config: config || {},
          position: position || { x: 0, y: 0, w: 1, h: 1 },
        },
      });

      res.status(201).json({ status: 'success', data: widget });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error adding widget to dashboard:', error);
      throw new AppError('Failed to add widget', 500);
    }
  })
);

// ============================================================================
// UPDATE WIDGET
// ============================================================================

router.patch(
  '/:id/widgets/:widgetId',
  validateBody(updateWidgetSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    try {
      const dashboard = await prisma.customDashboard.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!dashboard) {
        throw new AppError('Dashboard not found', 404);
      }

      if (dashboard.createdBy !== userId && userRole !== 'admin') {
        throw new AppError('Only the dashboard owner or an admin can update widgets', 403);
      }

      const widget = await prisma.dashboardWidget.findFirst({
        where: { id: req.params.widgetId, dashboardId: req.params.id },
      });

      if (!widget) {
        throw new AppError('Widget not found', 404);
      }

      const { title, type, config, position } = req.body;
      const updateData: any = {};

      if (title !== undefined) updateData.title = title.trim();
      if (type !== undefined) updateData.type = type;
      if (config !== undefined) updateData.config = config;
      if (position !== undefined) updateData.position = position;

      const updated = await prisma.dashboardWidget.update({
        where: { id: req.params.widgetId },
        data: updateData,
      });

      res.json({ status: 'success', data: updated });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating widget:', error);
      throw new AppError('Failed to update widget', 500);
    }
  })
);

// ============================================================================
// DELETE WIDGET
// ============================================================================

router.delete(
  '/:id/widgets/:widgetId',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    try {
      const dashboard = await prisma.customDashboard.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!dashboard) {
        throw new AppError('Dashboard not found', 404);
      }

      if (dashboard.createdBy !== userId && userRole !== 'admin') {
        throw new AppError('Only the dashboard owner or an admin can remove widgets', 403);
      }

      const widget = await prisma.dashboardWidget.findFirst({
        where: { id: req.params.widgetId, dashboardId: req.params.id },
      });

      if (!widget) {
        throw new AppError('Widget not found', 404);
      }

      await prisma.dashboardWidget.delete({
        where: { id: req.params.widgetId },
      });

      res.json({ status: 'success', data: { id: req.params.widgetId, deleted: true } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting widget:', error);
      throw new AppError('Failed to delete widget', 500);
    }
  })
);

// ============================================================================
// CLONE DASHBOARD
// ============================================================================

router.post(
  '/:id/clone',
  validateBody(cloneDashboardSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;

    try {
      const source = await prisma.customDashboard.findFirst({
        where: {
          id: req.params.id,
          organizationId: orgId,
          OR: [
            { createdBy: userId },
            { isShared: true },
          ],
        },
        include: { widgets: true },
      });

      if (!source) {
        throw new AppError('Dashboard not found or not accessible', 404);
      }

      const { name } = req.body;
      const cloneName = name ? name.trim() : `${source.name} (Copy)`;

      // Create the cloned dashboard with its widgets in a transaction
      const cloned = await prisma.$transaction(async (tx) => {
        const newDashboard = await tx.customDashboard.create({
          data: {
            organizationId: orgId,
            createdBy: userId,
            name: cloneName,
            description: source.description,
            isShared: false,
            isDefault: false,
            layout: source.layout as any,
          },
        });

        if (source.widgets.length > 0) {
          await tx.dashboardWidget.createMany({
            data: source.widgets.map((w) => ({
              dashboardId: newDashboard.id,
              type: w.type,
              title: w.title,
              config: w.config as any,
              position: w.position as any,
            })),
          });
        }

        return tx.customDashboard.findUnique({
          where: { id: newDashboard.id },
          include: { widgets: true },
        });
      });

      res.status(201).json({ status: 'success', data: cloned });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error cloning dashboard:', error);
      throw new AppError('Failed to clone dashboard', 500);
    }
  })
);

export default router;
