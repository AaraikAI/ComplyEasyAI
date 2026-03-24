/**
 * Bulk Operations Routes
 *
 * Endpoints for bulk updating, exporting, deleting, and assigning
 * resources across multiple Prisma models (risks, controls, policies,
 * vendors, incidents, assets).
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  bulkUpdateSchema, bulkExportSchema, bulkDeleteSchema, bulkAssignSchema,
} from '../validators/coreModulesSchemas';
import { asyncHandler } from '../types/express';
import prisma from '../config/database';
import logger from '../config/logger';

const router = Router();
router.use(authenticate);

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const SUPPORTED_RESOURCE_TYPES = ['risks', 'policies', 'vendors', 'incidents', 'assets'] as const;
type ResourceType = (typeof SUPPORTED_RESOURCE_TYPES)[number];

const MAX_BULK_IDS = 500;

/**
 * Validate and parse shared bulk request fields.
 * Returns null + sends a 400 response on validation failure.
 */
function validateBulkRequest(
  req: Request,
  res: Response
): { orgId: string; userId: string; resourceType: ResourceType; resourceIds: string[] } | null {
  const orgId = (req as any).user.organizationId;
  const userId = (req as any).user.id;

  const { resourceType, resourceIds } = req.body;

  if (!resourceType || !SUPPORTED_RESOURCE_TYPES.includes(resourceType)) {
    res.status(400).json({
      status: 'error',
      message: `resourceType is required and must be one of: ${SUPPORTED_RESOURCE_TYPES.join(', ')}`,
    });
    return null;
  }

  if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
    res.status(400).json({
      status: 'error',
      message: 'resourceIds must be a non-empty array of UUIDs',
    });
    return null;
  }

  if (resourceIds.length > MAX_BULK_IDS) {
    res.status(400).json({
      status: 'error',
      message: `Maximum of ${MAX_BULK_IDS} resource IDs per bulk operation`,
    });
    return null;
  }

  // Ensure all IDs are strings
  const sanitizedIds = resourceIds.filter((id: any) => typeof id === 'string' && id.length > 0);
  if (sanitizedIds.length === 0) {
    res.status(400).json({
      status: 'error',
      message: 'resourceIds must contain at least one valid string ID',
    });
    return null;
  }

  return { orgId, userId, resourceType, resourceIds: sanitizedIds };
}

/**
 * Returns the Prisma delegate (model accessor) for a given resource type,
 * along with field-name mappings for status and assignee.
 */
function getModelConfig(resourceType: ResourceType) {
  switch (resourceType) {
    case 'risks':
      return {
        model: prisma.riskItem,
        statusField: 'status',
        assigneeField: 'assignedToId',
        selectFields: { id: true, title: true, status: true, severity: true, assignedToId: true, organizationId: true, updatedAt: true },
      };
    case 'policies':
      return {
        model: prisma.policy,
        statusField: 'status',
        assigneeField: 'owner',
        selectFields: { id: true, title: true, status: true, category: true, owner: true, organizationId: true, updatedAt: true },
      };
    case 'vendors':
      return {
        model: prisma.vendor,
        statusField: 'status',
        assigneeField: 'securityContact',
        selectFields: { id: true, name: true, status: true, riskLevel: true, securityContact: true, organizationId: true, updatedAt: true },
      };
    case 'incidents':
      return {
        model: prisma.grcIncident,
        statusField: 'status',
        assigneeField: 'assignedTo',
        selectFields: { id: true, title: true, status: true, severity: true, assignedTo: true, organizationId: true, updatedAt: true },
      };
    case 'assets':
      return {
        model: prisma.asset,
        statusField: 'status',
        assigneeField: 'owner',
        selectFields: { id: true, name: true, status: true, type: true, owner: true, organizationId: true, updatedAt: true },
      };
  }
}

// ============================================================================
// BULK UPDATE
// ============================================================================

router.post(
  '/update',
  authorize('admin', 'editor'),
  validateBody(bulkUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = validateBulkRequest(req, res);
    if (!parsed) return;

    const { orgId, userId, resourceType, resourceIds } = parsed;
    const { updates } = req.body;

    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'updates object is required and must contain at least one field to update',
      });
      return;
    }

    try {
      const config = getModelConfig(resourceType);
      const model = config.model as any;

      // Verify all resources belong to this org
      const existing = await model.findMany({
        where: {
          id: { in: resourceIds },
          organizationId: orgId,
        },
        select: { id: true },
      });

      const existingIds = existing.map((r: any) => r.id);
      const missingIds = resourceIds.filter((id) => !existingIds.includes(id));

      if (existingIds.length === 0) {
        res.status(404).json({
          status: 'error',
          message: 'No matching resources found in this organization',
        });
        return;
      }

      // Build safe update payload — only allow known fields
      const safeUpdates: any = {};

      if (updates.status !== undefined) {
        safeUpdates[config.statusField] = updates.status;
      }

      if (updates.assignee !== undefined) {
        // Verify assignee belongs to the org if not null
        if (updates.assignee !== null) {
          const assignee = await prisma.user.findFirst({
            where: { id: updates.assignee, organizationId: orgId, active: true },
            select: { id: true },
          });
          if (!assignee) {
            res.status(400).json({
              status: 'error',
              message: 'Assignee user not found or not active in this organization',
            });
            return;
          }
        }
        safeUpdates[config.assigneeField] = updates.assignee;
      }

      // Allow additional safe fields depending on resource type
      if (updates.category !== undefined && ['risks', 'policies', 'incidents'].includes(resourceType)) {
        safeUpdates.category = updates.category;
      }

      if (updates.severity !== undefined && ['risks', 'incidents'].includes(resourceType)) {
        safeUpdates.severity = updates.severity;
      }

      if (updates.riskLevel !== undefined && resourceType === 'vendors') {
        safeUpdates.riskLevel = updates.riskLevel;
      }

      if (Object.keys(safeUpdates).length === 0) {
        res.status(400).json({
          status: 'error',
          message: 'No valid update fields provided. Supported: status, assignee, category, severity, riskLevel',
        });
        return;
      }

      const result = await model.updateMany({
        where: {
          id: { in: existingIds },
          organizationId: orgId,
        },
        data: safeUpdates,
      });

      logger.info(`Bulk update: ${result.count} ${resourceType} updated by user ${userId} in org ${orgId}`);

      res.json({
        status: 'success',
        data: {
          resourceType,
          updated: result.count,
          requested: resourceIds.length,
          skipped: missingIds.length,
          missingIds: missingIds.length > 0 ? missingIds : undefined,
          appliedUpdates: safeUpdates,
        },
      });
    } catch (error) {
      logger.error('Error in bulk update:', error);
      res.status(500).json({ status: 'error', message: 'Failed to perform bulk update' });
    }
  })
);

// ============================================================================
// BULK EXPORT
// ============================================================================

router.post(
  '/export',
  validateBody(bulkExportSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = validateBulkRequest(req, res);
    if (!parsed) return;

    const { orgId, userId, resourceType, resourceIds } = parsed;
    const { fields } = req.body; // Optional: limit which fields to export

    try {
      const config = getModelConfig(resourceType);
      const model = config.model as any;

      // Build select clause: use requested fields or all available
      let selectClause: any = undefined;
      if (fields && Array.isArray(fields) && fields.length > 0) {
        selectClause = { id: true }; // Always include id
        for (const field of fields) {
          if (typeof field === 'string') {
            selectClause[field] = true;
          }
        }
      }

      const resources = await model.findMany({
        where: {
          id: { in: resourceIds },
          organizationId: orgId,
        },
        ...(selectClause ? { select: selectClause } : {}),
        orderBy: { updatedAt: 'desc' },
      });

      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: userId,
          resourceType,
          totalExported: resources.length,
          totalRequested: resourceIds.length,
          organizationId: orgId,
        },
        data: resources,
      };

      logger.info(`Bulk export: ${resources.length} ${resourceType} exported by user ${userId} in org ${orgId}`);

      res.setHeader('Content-Disposition', `attachment; filename="bulk-export-${resourceType}-${Date.now()}.json"`);
      res.setHeader('Content-Type', 'application/json');
      res.json({ status: 'success', data: exportData });
    } catch (error) {
      logger.error('Error in bulk export:', error);
      res.status(500).json({ status: 'error', message: 'Failed to perform bulk export' });
    }
  })
);

// ============================================================================
// BULK DELETE (soft-delete, admin only)
// ============================================================================

router.post(
  '/delete',
  authorize('admin'),
  validateBody(bulkDeleteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = validateBulkRequest(req, res);
    if (!parsed) return;

    const { orgId, userId, resourceType, resourceIds } = parsed;

    try {
      const config = getModelConfig(resourceType);
      const model = config.model as any;

      // Verify all resources belong to this org
      const existing = await model.findMany({
        where: {
          id: { in: resourceIds },
          organizationId: orgId,
        },
        select: { id: true },
      });

      const existingIds = existing.map((r: any) => r.id);

      if (existingIds.length === 0) {
        res.status(404).json({
          status: 'error',
          message: 'No matching resources found in this organization',
        });
        return;
      }

      // Soft-delete by setting status to a deleted/archived state
      const deletedStatusMap: Record<ResourceType, string> = {
        risks: 'Closed',
        policies: 'Archived',
        vendors: 'Terminated',
        incidents: 'CLOSED',
        assets: 'DECOMMISSIONED',
      };

      const result = await model.updateMany({
        where: {
          id: { in: existingIds },
          organizationId: orgId,
        },
        data: {
          [config.statusField]: deletedStatusMap[resourceType],
        },
      });

      logger.info(`Bulk soft-delete: ${result.count} ${resourceType} archived by admin ${userId} in org ${orgId}`);

      res.json({
        status: 'success',
        data: {
          resourceType,
          deleted: result.count,
          requested: resourceIds.length,
          notFound: resourceIds.length - existingIds.length,
          softDeleteStatus: deletedStatusMap[resourceType],
        },
      });
    } catch (error) {
      logger.error('Error in bulk delete:', error);
      res.status(500).json({ status: 'error', message: 'Failed to perform bulk delete' });
    }
  })
);

// ============================================================================
// BULK ASSIGN
// ============================================================================

router.post(
  '/assign',
  authorize('admin', 'editor'),
  validateBody(bulkAssignSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = validateBulkRequest(req, res);
    if (!parsed) return;

    const { orgId, userId, resourceType, resourceIds } = parsed;
    const { assigneeId } = req.body;

    if (!assigneeId || typeof assigneeId !== 'string') {
      res.status(400).json({
        status: 'error',
        message: 'assigneeId is required and must be a valid user ID',
      });
      return;
    }

    try {
      // Verify assignee exists in the organization
      const assignee = await prisma.user.findFirst({
        where: { id: assigneeId, organizationId: orgId, active: true },
        select: { id: true, name: true, email: true },
      });

      if (!assignee) {
        res.status(400).json({
          status: 'error',
          message: 'Assignee user not found or not active in this organization',
        });
        return;
      }

      const config = getModelConfig(resourceType);
      const model = config.model as any;

      // Verify all resources belong to this org
      const existing = await model.findMany({
        where: {
          id: { in: resourceIds },
          organizationId: orgId,
        },
        select: { id: true },
      });

      const existingIds = existing.map((r: any) => r.id);

      if (existingIds.length === 0) {
        res.status(404).json({
          status: 'error',
          message: 'No matching resources found in this organization',
        });
        return;
      }

      const result = await model.updateMany({
        where: {
          id: { in: existingIds },
          organizationId: orgId,
        },
        data: {
          [config.assigneeField]: assigneeId,
        },
      });

      logger.info(
        `Bulk assign: ${result.count} ${resourceType} assigned to ${assignee.name} (${assigneeId}) by user ${userId} in org ${orgId}`
      );

      res.json({
        status: 'success',
        data: {
          resourceType,
          assigned: result.count,
          requested: resourceIds.length,
          notFound: resourceIds.length - existingIds.length,
          assignee: {
            id: assignee.id,
            name: assignee.name,
            email: assignee.email,
          },
        },
      });
    } catch (error) {
      logger.error('Error in bulk assign:', error);
      res.status(500).json({ status: 'error', message: 'Failed to perform bulk assign' });
    }
  })
);

export default router;
