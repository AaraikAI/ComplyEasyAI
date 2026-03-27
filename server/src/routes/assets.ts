/**
 * IT Asset Management Routes
 *
 * Full CRUD for IT assets with classification, lifecycle tracking,
 * and statistics by type, classification, and status.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createAssetSchema, updateAssetSchema } from '../validators/coreModulesSchemas';
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
// ASSET STATISTICS (before /:id to avoid route conflicts)
// ============================================================================

router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;
    try {
      const assets = await prisma.asset.findMany({
        where: { organizationId: orgId },
        select: {
          type: true,
          classification: true,
          status: true,
          endOfLife: true,
        },
      });

      const byType: Record<string, number> = {};
      const byClassification: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      let approachingEol = 0;

      const now = new Date();
      const threeMonths = new Date(now);
      threeMonths.setMonth(threeMonths.getMonth() + 3);

      for (const asset of assets) {
        byType[asset.type] = (byType[asset.type] || 0) + 1;
        byClassification[asset.classification] = (byClassification[asset.classification] || 0) + 1;
        byStatus[asset.status] = (byStatus[asset.status] || 0) + 1;

        if (asset.endOfLife && new Date(asset.endOfLife) <= threeMonths && new Date(asset.endOfLife) > now) {
          approachingEol++;
        }
      }

      res.json({
        status: 'success',
        data: {
          total: assets.length,
          byType,
          byClassification,
          byStatus,
          approachingEol,
        },
      });
    } catch (error) {
      logger.error('Error fetching asset statistics:', error);
      throw error instanceof AppError ? error : new AppError('Failed to fetch asset statistics', 500);
    }
  })
);

// ============================================================================
// LIST ASSETS
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);
    const type = req.query.type as string | undefined;
    const category = req.query.category as string | undefined;
    const classification = req.query.classification as string | undefined;
    const status = req.query.status as string | undefined;
    const search = (req.query.search as string) || '';

    try {
      const where: any = { organizationId: user.organizationId };
      if (type) where.type = type;
      if (category) where.category = category;
      if (classification) where.classification = classification;
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { owner: { contains: search, mode: 'insensitive' } },
          { hostname: { contains: search, mode: 'insensitive' } },
          { vendor: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [assets, total] = await Promise.all([
        prisma.asset.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take,
        }),
        prisma.asset.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: assets,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching assets:', error);
      throw error instanceof AppError ? error : new AppError('Failed to fetch assets', 500);
    }
  })
);

// ============================================================================
// GET ASSET BY ID
// ============================================================================

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const asset = await prisma.asset.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!asset) {
        throw new AppError('Asset not found', 404);
      }

      // Fetch linked risks and controls via the asset's ID in affectedSystems arrays
      const [linkedRisks, linkedIncidents] = await Promise.all([
        prisma.riskItem.findMany({
          where: {
            organizationId: user.organizationId,
            OR: [
              { title: { contains: asset.name, mode: 'insensitive' } },
            ],
          },
          select: { id: true, title: true, severity: true, status: true },
          take: 20,
        }),
        prisma.grcIncident.findMany({
          where: {
            organizationId: user.organizationId,
            affectedSystems: { has: asset.name },
          },
          select: { id: true, title: true, severity: true, status: true },
          take: 20,
        }),
      ]);

      res.json({
        status: 'success',
        data: {
          ...asset,
          linkedRisks,
          linkedIncidents,
        },
      });
    } catch (error) {
      logger.error('Error fetching asset:', error);
      throw error instanceof AppError ? error : new AppError('Failed to fetch asset', 500);
    }
  })
);

// ============================================================================
// CREATE ASSET
// ============================================================================

router.post(
  '/',
  authorize('admin', 'editor'),
  validateBody(createAssetSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const {
        name,
        type,
        category,
        owner,
        department,
        location,
        classification,
        ipAddress,
        hostname,
        serialNumber,
        vendor,
        purchaseDate,
        endOfLife,
        metadata,
      } = req.body;

      const asset = await prisma.asset.create({
        data: {
          organizationId: user.organizationId,
          name,
          type,
          category: category || null,
          owner,
          department: department || null,
          location: location || null,
          classification: classification || 'INTERNAL',
          status: 'ACTIVE',
          ipAddress: ipAddress || null,
          hostname: hostname || null,
          serialNumber: serialNumber || null,
          vendor: vendor || null,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          endOfLife: endOfLife ? new Date(endOfLife) : null,
          metadata: metadata || null,
        },
      });

      res.status(201).json({ status: 'success', data: asset });
    } catch (error) {
      logger.error('Error creating asset:', error);
      throw error instanceof AppError ? error : new AppError('Failed to create asset', 500);
    }
  })
);

// ============================================================================
// UPDATE ASSET
// ============================================================================

router.patch(
  '/:id',
  authorize('admin', 'editor'),
  validateBody(updateAssetSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.asset.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Asset not found', 404);
      }

      // Joi schema already validates types, classifications, and statuses via .valid()
      // and strips unknown fields via .unknown(false)
      const updateData = { ...req.body };

      // Convert date strings
      if (updateData.purchaseDate) updateData.purchaseDate = new Date(updateData.purchaseDate);
      if (updateData.endOfLife) updateData.endOfLife = new Date(updateData.endOfLife);

      const asset = await prisma.asset.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({ status: 'success', data: asset });
    } catch (error) {
      logger.error('Error updating asset:', error);
      throw error instanceof AppError ? error : new AppError('Failed to update asset', 500);
    }
  })
);

// ============================================================================
// SOFT DELETE ASSET
// ============================================================================

router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const existing = await prisma.asset.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Asset not found', 404);
      }

      const asset = await prisma.asset.update({
        where: { id: req.params.id },
        data: { status: 'DECOMMISSIONED' },
      });

      res.json({ status: 'success', data: { message: 'Asset decommissioned', id: asset.id } });
    } catch (error) {
      logger.error('Error decommissioning asset:', error);
      throw error instanceof AppError ? error : new AppError('Failed to decommission asset', 500);
    }
  })
);

export default router;
