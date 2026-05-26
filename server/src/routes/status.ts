/**
 * Public Status Routes
 *
 * Endpoints for the public StatusPage component. These are
 * intentionally NOT authenticated and NOT tenant-scoped — they
 * surface globally-relevant operational data (incidents and
 * maintenance windows) for any visitor of /status.
 *
 * Only records with isPublic = true are returned for incidents.
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../types/express';
import prisma from '../config/database';
import logger from '../config/logger';

const router = Router();

// GET /status/incidents - last N public incidents with their updates
router.get(
  '/incidents',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

    const incidents = await prisma.incident.findMany({
      where: { isPublic: true },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        updates: {
          where: { isInternal: false },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const shaped = incidents.map((inc) => ({
      id: inc.id,
      title: inc.title,
      status: inc.status,
      severity: inc.severity,
      affectedServices: inc.affectedServices,
      createdAt: inc.startedAt.toISOString(),
      updatedAt: (inc.resolvedAt ?? inc.identifiedAt ?? inc.startedAt).toISOString(),
      updates: inc.updates.map((u) => ({
        timestamp: u.createdAt.toISOString(),
        status: u.status,
        message: u.message,
      })),
    }));

    logger.debug('status.incidents fetched', { count: shaped.length });

    res.json({
      status: 'success',
      data: shaped,
    });
  })
);

// GET /status/maintenance - upcoming and in-progress maintenance windows
router.get(
  '/maintenance',
  asyncHandler(async (_req: Request, res: Response) => {
    const now = new Date();

    const windows = await prisma.maintenanceWindow.findMany({
      where: {
        OR: [
          { status: 'scheduled', scheduledEnd: { gte: now } },
          { status: 'in_progress' },
        ],
      },
      orderBy: { scheduledStart: 'asc' },
      take: 20,
    });

    const shaped = windows.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description ?? '',
      scheduledStart: m.scheduledStart.toISOString(),
      scheduledEnd: m.scheduledEnd.toISOString(),
      affectedServices: m.affectedServices,
      status: m.status,
    }));

    res.json({
      status: 'success',
      data: shaped,
    });
  })
);

export default router;
