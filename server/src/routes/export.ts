/**
 * CSV Export Routes
 * Provides CSV export endpoints for all major entities
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../config/database';
import { exportToCsv, validateExportData } from '../utils/csvExport';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

const router = Router();

/**
 * Export vendors to CSV
 * GET /api/export/vendors
 */
router.get('/vendors', authenticate, async (req: any, res) => {
  try {
    const organizationId = req.user.organizationId;

    const vendors = await prisma.vendor.findMany({
      where: { organizationId },
      include: {
        assessments: {
          orderBy: { assessedDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Validate before export
    const validation = validateExportData(vendors, { maxRows: 10000 });
    if (!validation.valid) {
      throw new AppError(validation.error || 'Validation failed', 400);
    }

    exportToCsv(res, vendors, {
      filename: 'vendors',
      excludeFields: ['organizationId'],
    });
    return;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Vendor export error:', error);
    throw new AppError('Export failed', 500);
  }
});

/**
 * Export policies to CSV
 * GET /api/export/policies
 */
router.get('/policies', authenticate, async (req: any, res) => {
  try {
    const organizationId = req.user.organizationId;

    const policies = await prisma.policy.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
    });

    const validation = validateExportData(policies, { maxRows: 10000 });
    if (!validation.valid) {
      throw new AppError(validation.error || 'Validation failed', 400);
    }

    exportToCsv(res, policies, {
      filename: 'policies',
      excludeFields: ['organizationId', 'content'], // Exclude large content field
    });
    return;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Policy export error:', error);
    throw new AppError('Export failed', 500);
  }
});

/**
 * Export issues to CSV
 * GET /api/export/issues
 */
router.get('/issues', authenticate, async (req: any, res) => {
  try {
    const organizationId = req.user.organizationId;

    const issues = await prisma.issue.findMany({
      where: { organizationId },
      include: {
        assignedTo: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const validation = validateExportData(issues, { maxRows: 10000 });
    if (!validation.valid) {
      throw new AppError(validation.error || 'Validation failed', 400);
    }

    exportToCsv(res, issues, {
      filename: 'issues',
      excludeFields: ['organizationId'],
    });
    return;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Issue export error:', error);
    throw new AppError('Export failed', 500);
  }
});

/**
 * Export risks to CSV
 * GET /api/export/risks
 */
router.get('/risks', authenticate, async (req: any, res) => {
  try {
    const organizationId = req.user.organizationId;

    const risks = await prisma.riskItem.findMany({
      where: { organizationId },
      include: {
        assignedTo: {
          select: { name: true, email: true },
        },
      },
      orderBy: { detectedAt: 'desc' },
    });

    const validation = validateExportData(risks, { maxRows: 10000 });
    if (!validation.valid) {
      throw new AppError(validation.error || 'Validation failed', 400);
    }

    exportToCsv(res, risks, {
      filename: 'risks',
      excludeFields: ['organizationId'],
    });
    return;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Risk export error:', error);
    throw new AppError('Export failed', 500);
  }
});

/**
 * Export frameworks to CSV
 * GET /api/export/frameworks
 */
router.get('/frameworks', authenticate, async (req: any, res) => {
  try {
    const organizationId = req.user.organizationId;

    const frameworks = await prisma.complianceFramework.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { controls: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const validation = validateExportData(frameworks, { maxRows: 10000 });
    if (!validation.valid) {
      throw new AppError(validation.error || 'Validation failed', 400);
    }

    exportToCsv(res, frameworks, {
      filename: 'frameworks',
      excludeFields: ['organizationId'],
    });
    return;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Framework export error:', error);
    throw new AppError('Export failed', 500);
  }
});

/**
 * Export audit logs to CSV (admin only)
 * GET /api/export/audit-logs
 */
router.get('/audit-logs', authenticate, async (req: any, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new AppError('Admin access required', 403);
    }

    const organizationId = req.user.organizationId;

    // Get audit logs from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        organizationId,
        timestamp: { gte: ninetyDaysAgo },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    const validation = validateExportData(auditLogs, { maxRows: 50000 });
    if (!validation.valid) {
      throw new AppError(validation.error || 'Validation failed', 400);
    }

    exportToCsv(res, auditLogs, {
      filename: 'audit-logs',
      excludeFields: ['organizationId'],
    });
    return;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Audit log export error:', error);
    throw new AppError('Export failed', 500);
  }
});

/**
 * Export monitors to CSV
 * GET /api/export/monitors
 */
router.get('/monitors', authenticate, async (req: any, res) => {
  try {
    const organizationId = req.user.organizationId;

    const monitors = await prisma.continuousMonitor.findMany({
      where: { organizationId },
      include: {
        results: {
          orderBy: { runDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const validation = validateExportData(monitors, { maxRows: 10000 });
    if (!validation.valid) {
      throw new AppError(validation.error || 'Validation failed', 400);
    }

    exportToCsv(res, monitors, {
      filename: 'monitors',
      excludeFields: ['organizationId'],
    });
    return;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Monitor export error:', error);
    throw new AppError('Export failed', 500);
  }
});

export default router;
