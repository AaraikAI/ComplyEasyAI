/**
 * V2 Batch Operations Routes
 *
 * Provides batch create/update operations for v2 API endpoints.
 * Each batch operation runs inside a Prisma transaction to ensure
 * atomicity — either all items succeed or the entire batch rolls back.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import prisma from '../../config/database';
import logger from '../../config/logger';

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
batchRouter.post('/vendors', asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body;
  const user = (req as any).user;
  const organizationId = user.organizationId;

  const validationError = validateBatchPayload(items, 'vendor');
  if (validationError) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_BATCH', message: validationError } });
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
    result.success = false;
    result.failed = items.length;
    result.errors.push({ index: -1, error: error.message });
    logger.error('[BatchRoutes] Vendor batch creation failed', error);
    return res.status(400).json(result);
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
batchRouter.post('/risks', asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body;
  const user = (req as any).user;
  const organizationId = user.organizationId;

  const validationError = validateBatchPayload(items, 'risk');
  if (validationError) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_BATCH', message: validationError } });
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
    result.success = false;
    result.failed = items.length;
    result.errors.push({ index: -1, error: error.message });
    logger.error('[BatchRoutes] Risk batch creation failed', error);
    return res.status(400).json(result);
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
batchRouter.post('/policies', asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body;
  const user = (req as any).user;
  const organizationId = user.organizationId;

  const validationError = validateBatchPayload(items, 'policy');
  if (validationError) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_BATCH', message: validationError } });
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
            ownerId: user.id,
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
    result.success = false;
    result.failed = items.length;
    result.errors.push({ index: -1, error: error.message });
    logger.error('[BatchRoutes] Policy batch creation failed', error);
    return res.status(400).json(result);
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
batchRouter.post('/frameworks', asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body;
  const user = (req as any).user;
  const organizationId = user.organizationId;

  const validationError = validateBatchPayload(items, 'framework');
  if (validationError) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_BATCH', message: validationError } });
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
            type: item.type || item.name,
            description: item.description || '',
            version: item.version || '1.0',
            region: item.region || 'US',
            status: item.status || 'Active',
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
    result.success = false;
    result.failed = items.length;
    result.errors.push({ index: -1, error: error.message });
    logger.error('[BatchRoutes] Framework batch creation failed', error);
    return res.status(400).json(result);
  }

  logger.info(`[BatchRoutes] Created ${result.created} frameworks for org ${organizationId}`);
  res.status(201).json(result);
}));

export default batchRouter;
