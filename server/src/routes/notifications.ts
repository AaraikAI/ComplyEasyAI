/**
 * Notification Routes — Real-time notification management
 *
 * Endpoints for listing, reading, deleting notifications and
 * managing notification preferences per user. Notifications are
 * scoped to both organization AND user.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import { updateNotificationPreferencesSchema } from '../validators/notificationSchemas';
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

const DEFAULT_NOTIFICATION_PREFERENCES = {
  email: true,
  slack: true,
  websocket: true,
  sms: false,
  categories: {
    compliance: { email: true, slack: true, websocket: true, sms: false },
    risk: { email: true, slack: true, websocket: true, sms: false },
    audit: { email: true, slack: false, websocket: true, sms: false },
    incident: { email: true, slack: true, websocket: true, sms: true },
    system: { email: false, slack: false, websocket: true, sms: false },
    workflow: { email: true, slack: true, websocket: true, sms: false },
  },
};

// ============================================================================
// GET UNREAD COUNT (before /:id to avoid route conflicts)
// ============================================================================

router.get(
  '/unread-count',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;

    try {
      const count = await prisma.notification.count({
        where: {
          organizationId: orgId,
          userId: userId,
          readAt: null,
        },
      });

      res.json({ status: 'success', data: { unreadCount: count } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching unread notification count:', error);
      throw new AppError('Failed to fetch unread count', 500);
    }
  })
);

// ============================================================================
// GET NOTIFICATION PREFERENCES (before /:id)
// ============================================================================

router.get(
  '/preferences',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    try {
      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId },
      });

      if (!prefs) {
        // Return default preferences when none exist yet
        res.json({
          status: 'success',
          data: {
            userId,
            ...DEFAULT_NOTIFICATION_PREFERENCES,
            isDefault: true,
          },
        });
        return;
      }

      res.json({ status: 'success', data: prefs });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching notification preferences:', error);
      throw new AppError('Failed to fetch notification preferences', 500);
    }
  })
);

// ============================================================================
// UPDATE NOTIFICATION PREFERENCES
// ============================================================================

router.patch(
  '/preferences',
  validateBody(updateNotificationPreferencesSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    try {
      const { email, slack, websocket, sms, categories } = req.body;

      const updateData: any = {};
      if (typeof email === 'boolean') updateData.email = email;
      if (typeof slack === 'boolean') updateData.slack = slack;
      if (typeof websocket === 'boolean') updateData.websocket = websocket;
      if (typeof sms === 'boolean') updateData.sms = sms;
      if (categories !== undefined) updateData.categories = categories;

      const prefs = await prisma.notificationPreference.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          email: email ?? DEFAULT_NOTIFICATION_PREFERENCES.email,
          slack: slack ?? DEFAULT_NOTIFICATION_PREFERENCES.slack,
          websocket: websocket ?? DEFAULT_NOTIFICATION_PREFERENCES.websocket,
          sms: sms ?? DEFAULT_NOTIFICATION_PREFERENCES.sms,
          categories: categories ?? DEFAULT_NOTIFICATION_PREFERENCES.categories,
        },
      });

      res.json({ status: 'success', data: prefs });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating notification preferences:', error);
      throw new AppError('Failed to update notification preferences', 500);
    }
  })
);

// ============================================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================================

router.post(
  '/mark-all-read',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;

    try {
      const result = await prisma.notification.updateMany({
        where: {
          organizationId: orgId,
          userId: userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
          status: 'read',
        },
      });

      res.json({
        status: 'success',
        data: { markedRead: result.count },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error marking all notifications as read:', error);
      throw new AppError('Failed to mark all notifications as read', 500);
    }
  })
);

// ============================================================================
// LIST NOTIFICATIONS
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;
    const { skip, take, page, limit } = paginate(req.query);

    const type = req.query.type as string | undefined;
    const category = req.query.category as string | undefined;
    const readStatus = req.query.read as string | undefined;
    const search = req.query.search as string | undefined;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    try {
      const where: any = {
        organizationId: orgId,
        userId: userId,
      };

      if (type) {
        where.type = type;
      }

      if (category) {
        where.category = category;
      }

      if (readStatus === 'true') {
        where.readAt = { not: null };
      } else if (readStatus === 'false') {
        where.readAt = null;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Validate sort field
      const allowedSortFields = ['createdAt', 'type', 'category', 'readAt', 'sentAt'];
      const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { [safeSortBy]: safeSortOrder },
          skip,
          take,
        }),
        prisma.notification.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: notifications,
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
      logger.error('Error fetching notifications:', error);
      throw new AppError('Failed to fetch notifications', 500);
    }
  })
);

// ============================================================================
// MARK NOTIFICATION AS READ
// ============================================================================

router.patch(
  '/:id/read',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;

    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id: req.params.id,
          organizationId: orgId,
          userId: userId,
        },
      });

      if (!notification) {
        throw new AppError('Notification not found', 404);
      }

      const updated = await prisma.notification.update({
        where: { id: req.params.id },
        data: {
          readAt: new Date(),
          status: 'read',
        },
      });

      res.json({ status: 'success', data: updated });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error marking notification as read:', error);
      throw new AppError('Failed to mark notification as read', 500);
    }
  })
);

// ============================================================================
// DELETE NOTIFICATION
// ============================================================================

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;

    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id: req.params.id,
          organizationId: orgId,
          userId: userId,
        },
      });

      if (!notification) {
        throw new AppError('Notification not found', 404);
      }

      await prisma.notification.delete({
        where: { id: req.params.id },
      });

      res.json({ status: 'success', data: { id: req.params.id, deleted: true } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting notification:', error);
      throw new AppError('Failed to delete notification', 500);
    }
  })
);

export default router;
