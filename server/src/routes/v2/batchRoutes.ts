/**
 * V2 Batch Operations Routes
 *
 * Provides batch create/update operations for v2 API endpoints.
 * Each batch operation runs inside a Prisma transaction to ensure
 * atomicity — either all items succeed or the entire batch rolls back.
 */

import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { AppError } from '../../middleware/errorHandler';
import prisma from '../../config/database';
import logger from '../../config/logger';

// ============================================================================
// BATCH SCHEMAS
// ============================================================================

const batchVendorsSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    name: Joi.string().min(1).max(255).required(),
    website: Joi.string().uri().allow(null, '').optional(),
    contactName: Joi.string().max(255).allow(null, '').optional(),
    contactEmail: Joi.string().email().allow(null, '').optional(),
    category: Joi.string().max(100).optional(),
    riskLevel: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
    status: Joi.string().valid('Active', 'Inactive', 'Under Review').optional(),
  })).min(1).max(100).required(),
});

const batchRisksSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    title: Joi.string().min(1).max(500).required(),
    description: Joi.string().max(5000).allow('').optional(),
    category: Joi.string().max(100).optional(),
    severity: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
    likelihood: Joi.number().integer().min(1).max(5).optional(),
    impact: Joi.number().integer().min(1).max(5).optional(),
    status: Joi.string().valid('Open', 'In Progress', 'Mitigated', 'Closed').optional(),
    mitigationPlan: Joi.string().max(5000).allow(null, '').optional(),
  })).min(1).max(100).required(),
});

const batchPoliciesSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    title: Joi.string().min(1).max(500).required(),
    content: Joi.string().max(50000).allow('').optional(),
    category: Joi.string().max(100).optional(),
    status: Joi.string().valid('Draft', 'Under Review', 'Approved', 'Archived').optional(),
    version: Joi.string().max(20).optional(),
  })).min(1).max(100).required(),
});

const batchRouter = Router();

// All batch operations require authentication
batchRouter.use(authenticate);

// ============================================================================
// TYPES
// ============================================================================

interface BatchResult<T> {
  success: boolean;
  total: number;
  created: number;
  failed: number;
  items: T[];
  errors: Array<{ index: number; error: string }>;
}

// ============================================================================
// HELPERS
// ============================================================================

const MAX_BATCH_SIZE = 100;

function validateBatchPayload(items: any[], entityName: string): string | null {
  if (!Array.isArray(items)) {
    return `"items" must be an array of ${entityName} objects`;
  }
  if (items.length === 0) {
    return `"items" array must not be empty`;
  }
  if (items.length > MAX_BATCH_SIZE) {
    return `Batch size exceeds maximum of ${MAX_BATCH_SIZE}. Received ${items.length}`;
  }
  return null;
}

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============================================================================
// BATCH VENDORS
// ============================================================================

/**
 * POST /api/v2/batch/vendors
 * Create multiple vendors in a single transaction.
 *
 * Body: { items: Array<{ name, website?, contactEmail?, category?, ... }> }
 */
batchRouter.post('/vendors', validateBody(batchVendorsSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { items } = req.body;
  const user = (req as any).user;
  const organizationId = user.organizationId;

  const validationError = validateBatchPayload(items, 'vendor');
  if (validationError) {
    throw new AppError(validationError, 400);
    return;
  }

  const result: BatchResult<any> = {
    success: true,
    total: items.length,
    created: 0,
    failed: 0,
    items: [],
    errors: [],
  };

  try {
    const created = await prisma.$transaction(async (tx) => {
      const vendors: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.name || typeof item.name !== 'string') {
          throw new Error(`Item at index ${i}: "name" is required and must be a string`);
        }
        const vendor = await tx.vendor.create({
          data: {
            name: item.name,
            website: item.website || null,
            contactName: item.contactName || null,
            contactEmail: item.contactEmail || null,
            category: item.category || 'Other',
            riskLevel: item.riskLevel || 'Medium',
            status: item.status || 'Active',
            organizationId,
          },
        });
        vendors.push(vendor);
      }
      return vendors;
    });

    result.created = created.length;
    result.items = created;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    logger.error('[BatchRoutes] Vendor batch creation failed', error);
    throw new AppError(error.message || 'Vendor batch creation failed', 400);
  }

  logger.info(`[BatchRoutes] Created ${result.created} vendors for org ${organizationId}`);
  res.status(201).json(result);
}));

// ============================================================================
// BATCH RISKS
// ============================================================================

/**
 * POST /api/v2/batch/risks
 * Create multiple risk items in a single transaction.
 *
 * Body: { items: Array<{ title, description?, likelihood?, impact?, ... }> }
 */
batchRouter.post('/risks', validateBody(batchRisksSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { items } = req.body;
  const user = (req as any).user;
  const organizationId = user.organizationId;

  const validationError = validateBatchPayload(items, 'risk');
  if (validationError) {
    throw new AppError(validationError, 400);
    return;
  }

  const result: BatchResult<any> = {
    success: true,
    total: items.length,
    created: 0,
    failed: 0,
    items: [],
    errors: [],
  };

  try {
    const created = await prisma.$transaction(async (tx) => {
      const risks: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.title || typeof item.title !== 'string') {
          throw new Error(`Item at index ${i}: "title" is required and must be a string`);
        }
        const risk = await tx.riskItem.create({
          data: {
            title: item.title,
            description: item.description || '',
            category: item.category || 'Operational',
            severity: item.severity || 'Medium',
            likelihood: item.likelihood || 3,
            impact: item.impact || 3,
            riskScore: (item.likelihood || 3) * (item.impact || 3),
            status: item.status || 'Open',
            mitigationPlan: item.mitigationPlan || null,
            organizationId,
          },
        });
        risks.push(risk);
      }
      return risks;
    });

    result.created = created.length;
    result.items = created;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    logger.error('[BatchRoutes] Risk batch creation failed', error);
    throw new AppError(error.message || 'Risk batch creation failed', 400);
  }

  logger.info(`[BatchRoutes] Created ${result.created} risks for org ${organizationId}`);
  res.status(201).json(result);
}));

// ============================================================================
// BATCH POLICIES
// ============================================================================

/**
 * POST /api/v2/batch/policies
 * Create multiple policies in a single transaction.
 *
 * Body: { items: Array<{ title, content?, category?, ... }> }
 */
batchRouter.post('/policies', validateBody(batchPoliciesSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { items } = req.body;
  const user = (req as any).user;
  const organizationId = user.organizationId;

  const validationError = validateBatchPayload(items, 'policy');
  if (validationError) {
    throw new AppError(validationError, 400);
    return;
  }

  const result: BatchResult<any> = {
    success: true,
    total: items.length,
    created: 0,
    failed: 0,
    items: [],
    errors: [],
  };

  try {
    const created = await prisma.$transaction(async (tx) => {
      const policies: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.title || typeof item.title !== 'string') {
          throw new Error(`Item at index ${i}: "title" is required and must be a string`);
        }
        const policy = await tx.policy.create({
          data: {
            title: item.title,
            content: item.content || '',
            category: item.category || 'General',
            status: item.status || 'Draft',
            version: item.version || '1.0',
            owner: user.email || null,
            organizationId,
          },
        });
        policies.push(policy);
      }
      return policies;
    });

    result.created = created.length;
    result.items = created;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    logger.error('[BatchRoutes] Policy batch creation failed', error);
    throw new AppError(error.message || 'Policy batch creation failed', 400);
  }

  logger.info(`[BatchRoutes] Created ${result.created} policies for org ${organizationId}`);
  res.status(201).json(result);
}));

// ============================================================================
// BATCH FRAMEWORKS
// ============================================================================

/**
 * POST /api/v2/batch/frameworks
 * Create multiple compliance frameworks in a single transaction.
 *
 * Body: { items: Array<{ name, type?, description?, region?, ... }> }
 */
batchRouter.post('/frameworks', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { items } = req.body;
  const user = (req as any).user;
  const organizationId = user.organizationId;

  const validationError = validateBatchPayload(items, 'framework');
  if (validationError) {
    throw new AppError(validationError, 400);
    return;
  }

  const result: BatchResult<any> = {
    success: true,
    total: items.length,
    created: 0,
    failed: 0,
    items: [],
    errors: [],
  };

  try {
    const created = await prisma.$transaction(async (tx) => {
      const frameworks: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.name || typeof item.name !== 'string') {
          throw new Error(`Item at index ${i}: "name" is required and must be a string`);
        }
        const framework = await tx.complianceFramework.create({
          data: {
            name: item.name,
            notes: item.description || null,
            version: item.version || 1,
            region: item.region || 'US',
            status: item.status || 'In_Review',
            nextAuditDate: item.nextAuditDate ? new Date(item.nextAuditDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            organizationId,
          },
        });
        frameworks.push(framework);
      }
      return frameworks;
    });

    result.created = created.length;
    result.items = created;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    logger.error('[BatchRoutes] Framework batch creation failed', error);
    throw new AppError(error.message || 'Framework batch creation failed', 400);
  }

  logger.info(`[BatchRoutes] Created ${result.created} frameworks for org ${organizationId}`);
  res.status(201).json(result);
}));

export default batchRouter;
