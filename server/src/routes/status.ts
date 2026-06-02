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

// GET /status/uptime?days=N - per-day uptime % derived from public incidents.
// Downtime is attributed only to major/critical incidents (minor = degraded, not down).
router.get(
  '/uptime',
  asyncHandler(async (req: Request, res: Response) => {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days as string, 10) || 90));
    const now = new Date();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const windowStart = new Date(now.getTime() - days * DAY_MS);

    const incidents = await prisma.incident.findMany({
      where: {
        isPublic: true,
        startedAt: { lte: now },
        OR: [{ resolvedAt: null }, { resolvedAt: { gte: windowStart } }],
      },
      select: { severity: true, startedAt: true, resolvedAt: true },
    });

    const isDown = (sev: unknown) => ['major', 'critical'].includes(String(sev).toLowerCase());
    const data: { date: string; uptime: number; incidents: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * DAY_MS);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + DAY_MS);
      let downMs = 0;
      let count = 0;
      for (const inc of incidents) {
        const incEnd = inc.resolvedAt ?? now;
        const overlapStart = Math.max(dayStart.getTime(), inc.startedAt.getTime());
        const overlapEnd = Math.min(dayEnd.getTime(), incEnd.getTime());
        if (overlapEnd > overlapStart) {
          count++;
          if (isDown(inc.severity)) downMs += overlapEnd - overlapStart;
        }
      }
      const uptime = Math.max(0, Math.min(100, ((DAY_MS - downMs) / DAY_MS) * 100));
      data.push({
        date: dayStart.toISOString().slice(0, 10),
        uptime: Math.round(uptime * 100) / 100,
        incidents: count,
      });
    }

    res.json({ status: 'success', data });
  })
);

export default router;
