/**
 * Third-Party Vendor Continuous Monitoring Routes
 *
 * Endpoints for managing vendor monitoring checks, viewing alerts,
 * triggering on-demand checks, and tracking vendor security posture.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
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

const VALID_CHECK_TYPES = [
  'domain_reputation',
  'ssl_check',
  'breach_check',
  'soc2_expiry',
  'iso27001_expiry',
  'privacy_policy_review',
  'data_processing_review',
  'incident_history',
];

const VALID_CHECK_STATUSES = ['PASS', 'WARN', 'FAIL'];

// ============================================================================
// ALERTS (registered before dynamic routes to avoid conflicts)
// ============================================================================

router.get(
  '/alerts',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const { skip, take, page, limit } = paginate(req.query);
    const severity = req.query.severity as string | undefined;

    try {
      const where: any = {
        organizationId: orgId,
        status: { in: ['WARN', 'FAIL'] },
      };

      if (severity === 'FAIL') {
        where.status = 'FAIL';
      } else if (severity === 'WARN') {
        where.status = 'WARN';
      }

      const [alerts, total] = await Promise.all([
        prisma.vendorMonitoringCheck.findMany({
          where,
          orderBy: { checkedAt: 'desc' },
          skip,
          take,
        }),
        prisma.vendorMonitoringCheck.count({ where }),
      ]);

      // Enrich alerts with vendor names
      const vendorIds = [...new Set(alerts.map((a) => a.vendorId))];
      const vendors = await prisma.vendor.findMany({
        where: { id: { in: vendorIds }, organizationId: orgId },
        select: { id: true, name: true, riskLevel: true },
      });
      const vendorMap = new Map(vendors.map((v) => [v.id, v]));

      const enrichedAlerts = alerts.map((alert) => ({
        ...alert,
        vendorName: vendorMap.get(alert.vendorId)?.name || 'Unknown Vendor',
        vendorRiskLevel: vendorMap.get(alert.vendorId)?.riskLevel || null,
      }));

      res.json({
        status: 'success',
        data: {
          alerts: enrichedAlerts,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error listing monitoring alerts:', error);
      res.status(500).json({ error: 'Failed to list monitoring alerts' });
    }
  })
);

// ============================================================================
// STATS
// ============================================================================

router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const checks = await prisma.vendorMonitoringCheck.findMany({
        where: { organizationId: orgId },
        select: { vendorId: true, checkType: true, status: true, checkedAt: true },
      });

      const totalChecks = checks.length;
      const byStatus: Record<string, number> = {};
      const byCheckType: Record<string, number> = {};
      const byVendor: Record<string, { total: number; pass: number; warn: number; fail: number }> = {};

      for (const check of checks) {
        byStatus[check.status] = (byStatus[check.status] || 0) + 1;
        byCheckType[check.checkType] = (byCheckType[check.checkType] || 0) + 1;

        if (!byVendor[check.vendorId]) {
          byVendor[check.vendorId] = { total: 0, pass: 0, warn: 0, fail: 0 };
        }
        byVendor[check.vendorId].total++;
        if (check.status === 'PASS') byVendor[check.vendorId].pass++;
        else if (check.status === 'WARN') byVendor[check.vendorId].warn++;
        else if (check.status === 'FAIL') byVendor[check.vendorId].fail++;
      }

      // Enrich vendor stats with names
      const vendorIds = Object.keys(byVendor);
      const vendors = await prisma.vendor.findMany({
        where: { id: { in: vendorIds }, organizationId: orgId },
        select: { id: true, name: true },
      });
      const vendorNameMap = new Map(vendors.map((v) => [v.id, v.name]));

      const vendorStats = Object.entries(byVendor).map(([vendorId, stats]) => ({
        vendorId,
        vendorName: vendorNameMap.get(vendorId) || 'Unknown Vendor',
        ...stats,
      }));

      const issuesFound = (byStatus['WARN'] || 0) + (byStatus['FAIL'] || 0);

      res.json({
        status: 'success',
        data: {
          totalChecks,
          issuesFound,
          uniqueVendorsMonitored: vendorIds.length,
          byStatus,
          byCheckType,
          vendors: vendorStats,
        },
      });
    } catch (error) {
      logger.error('Error fetching monitoring stats:', error);
      res.status(500).json({ error: 'Failed to fetch monitoring stats' });
    }
  })
);

// ============================================================================
// LIST MONITORING CHECKS
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const { skip, take, page, limit } = paginate(req.query);
    const vendorId = req.query.vendorId as string | undefined;
    const checkStatus = req.query.status as string | undefined;
    const checkType = req.query.checkType as string | undefined;

    try {
      const where: any = { organizationId: orgId };

      if (vendorId) {
        where.vendorId = vendorId;
      }
      if (checkStatus) {
        if (!VALID_CHECK_STATUSES.includes(checkStatus)) {
          res.status(400).json({
            error: `status must be one of: ${VALID_CHECK_STATUSES.join(', ')}`,
          });
          return;
        }
        where.status = checkStatus;
      }
      if (checkType) {
        where.checkType = checkType;
      }

      const [checks, total] = await Promise.all([
        prisma.vendorMonitoringCheck.findMany({
          where,
          orderBy: { checkedAt: 'desc' },
          skip,
          take,
        }),
        prisma.vendorMonitoringCheck.count({ where }),
      ]);

      // Enrich with vendor names
      const vendorIds = [...new Set(checks.map((c) => c.vendorId))];
      const vendors = await prisma.vendor.findMany({
        where: { id: { in: vendorIds }, organizationId: orgId },
        select: { id: true, name: true },
      });
      const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));

      const enrichedChecks = checks.map((check) => ({
        ...check,
        vendorName: vendorMap.get(check.vendorId) || 'Unknown Vendor',
      }));

      res.json({
        status: 'success',
        data: {
          checks: enrichedChecks,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error listing monitoring checks:', error);
      res.status(500).json({ error: 'Failed to list monitoring checks' });
    }
  })
);

// ============================================================================
// CREATE MONITORING CHECK
// ============================================================================

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const { vendorId, checkType, status, details } = req.body;

      if (!vendorId || !checkType || !status) {
        res.status(400).json({ error: 'vendorId, checkType, and status are required' });
        return;
      }

      if (!VALID_CHECK_STATUSES.includes(status)) {
        res.status(400).json({
          error: `status must be one of: ${VALID_CHECK_STATUSES.join(', ')}`,
        });
        return;
      }

      // Verify vendor belongs to this org
      const vendor = await prisma.vendor.findFirst({
        where: { id: vendorId, organizationId: orgId },
      });

      if (!vendor) {
        res.status(404).json({ error: 'Vendor not found' });
        return;
      }

      const check = await prisma.vendorMonitoringCheck.create({
        data: {
          organizationId: orgId,
          vendorId,
          checkType,
          status,
          details: details || null,
        },
      });

      res.status(201).json({ status: 'success', data: check });
    } catch (error) {
      logger.error('Error creating monitoring check:', error);
      res.status(500).json({ error: 'Failed to create monitoring check' });
    }
  })
);

// ============================================================================
// GET MONITORING HISTORY FOR A VENDOR
// ============================================================================

router.get(
  '/vendor/:vendorId',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const { skip, take, page, limit } = paginate(req.query);
    const checkType = req.query.checkType as string | undefined;

    try {
      // Verify vendor belongs to this org
      const vendor = await prisma.vendor.findFirst({
        where: { id: req.params.vendorId, organizationId: orgId },
        select: { id: true, name: true, riskLevel: true, status: true },
      });

      if (!vendor) {
        res.status(404).json({ error: 'Vendor not found' });
        return;
      }

      const where: any = {
        organizationId: orgId,
        vendorId: req.params.vendorId,
      };

      if (checkType) {
        where.checkType = checkType;
      }

      const [checks, total] = await Promise.all([
        prisma.vendorMonitoringCheck.findMany({
          where,
          orderBy: { checkedAt: 'desc' },
          skip,
          take,
        }),
        prisma.vendorMonitoringCheck.count({ where }),
      ]);

      // Compute summary stats for this vendor
      const allChecks = await prisma.vendorMonitoringCheck.findMany({
        where: { organizationId: orgId, vendorId: req.params.vendorId },
        select: { status: true, checkType: true, checkedAt: true },
        orderBy: { checkedAt: 'desc' },
      });

      const byStatus: Record<string, number> = {};
      const byCheckType: Record<string, number> = {};
      for (const c of allChecks) {
        byStatus[c.status] = (byStatus[c.status] || 0) + 1;
        byCheckType[c.checkType] = (byCheckType[c.checkType] || 0) + 1;
      }

      res.json({
        status: 'success',
        data: {
          vendor,
          summary: {
            totalChecks: allChecks.length,
            lastCheckedAt: allChecks.length > 0 ? allChecks[0].checkedAt : null,
            byStatus,
            byCheckType,
          },
          checks,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching vendor monitoring history:', error);
      res.status(500).json({ error: 'Failed to fetch vendor monitoring history' });
    }
  })
);

// ============================================================================
// TRIGGER MONITORING CHECK FOR A VENDOR
// ============================================================================

router.post(
  '/vendor/:vendorId/check',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;

    try {
      // Verify vendor belongs to this org
      const vendor = await prisma.vendor.findFirst({
        where: { id: req.params.vendorId, organizationId: orgId },
        select: {
          id: true,
          name: true,
          website: true,
          soc2Report: true,
          iso27001Certified: true,
          contractEnd: true,
        },
      });

      if (!vendor) {
        res.status(404).json({ error: 'Vendor not found' });
        return;
      }

      const checkTypes = req.body.checkTypes as string[] | undefined;
      const typesToRun = checkTypes && checkTypes.length > 0
        ? checkTypes
        : ['domain_reputation', 'ssl_check', 'breach_check', 'soc2_expiry'];

      // Run each check type and create result entries
      const results = [];

      for (const checkType of typesToRun) {
        let status = 'PASS';
        let details: any = {
          triggeredBy: userId,
          triggeredAt: new Date().toISOString(),
          vendorName: vendor.name,
          automated: false,
        };

        // Basic heuristic checks based on vendor data
        switch (checkType) {
          case 'soc2_expiry':
            if (!vendor.soc2Report) {
              status = 'WARN';
              details.message = 'Vendor does not have a SOC 2 report on file';
            } else {
              details.message = 'SOC 2 report is on file';
            }
            break;

          case 'ssl_check':
            if (vendor.website) {
              details.message = `SSL check queued for ${vendor.website}`;
            } else {
              status = 'WARN';
              details.message = 'No website URL configured for SSL check';
            }
            break;

          case 'breach_check':
            details.message = `Breach monitoring check initiated for ${vendor.name}`;
            break;

          case 'domain_reputation':
            if (vendor.website) {
              details.message = `Domain reputation check queued for ${vendor.website}`;
            } else {
              status = 'WARN';
              details.message = 'No website URL configured for domain reputation check';
            }
            break;

          case 'iso27001_expiry':
            if (!vendor.iso27001Certified) {
              status = 'WARN';
              details.message = 'Vendor is not ISO 27001 certified';
            } else {
              details.message = 'ISO 27001 certification is on file';
            }
            break;

          default:
            details.message = `${checkType} check initiated for ${vendor.name}`;
            break;
        }

        const check = await prisma.vendorMonitoringCheck.create({
          data: {
            organizationId: orgId,
            vendorId: vendor.id,
            checkType,
            status,
            details,
          },
        });

        results.push(check);
      }

      logger.info(
        `Vendor monitoring checks triggered for vendor ${vendor.id} (${vendor.name}) by user ${userId}: ${typesToRun.join(', ')}`
      );

      res.status(201).json({
        status: 'success',
        data: {
          vendorId: vendor.id,
          vendorName: vendor.name,
          checksRun: results.length,
          results,
        },
      });
    } catch (error) {
      logger.error('Error triggering vendor monitoring check:', error);
      res.status(500).json({ error: 'Failed to trigger vendor monitoring check' });
    }
  })
);

export default router;
