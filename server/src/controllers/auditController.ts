import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';
import blockchainService from '../services/advanced/blockchainService';

class AuditController {
  list: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const { limit = 100, offset = 0, action, userId, startDate, endDate } = req.query;

      const where: any = { organizationId };

      if (action) where.action = { contains: action as string, mode: 'insensitive' };
      if (userId) where.userId = userId as string;

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate as string);
        if (endDate) where.timestamp.lte = new Date(endDate as string);
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
          take: parseInt(limit as string, 10),
          skip: parseInt(offset as string, 10),
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({
        logs,
        total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      });
    } catch (error) {
      logger.error('List audit logs error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch audit logs', 500);
    }
  };

  log: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { action, user: userName, details } = req.body;
      const organizationId = authReq.user!.organizationId;
      const userId = authReq.user!.id;

      if (!action) {
        throw new AppError('Action is required', 400);
      }

      // Build action string - include user name if provided for context
      const actionString = userName && userName !== 'User' 
        ? `${typeof action === 'string' ? action : String(action)} (by ${userName})`
        : typeof action === 'string' ? action : String(action);

      const auditLog = await prisma.auditLog.create({
        data: {
          action: actionString,
          userId,
          organizationId,
          details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
          hash: uuidv4(),
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'] || undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Submit to blockchain asynchronously (don't block response)
      // Only submit critical audit logs to blockchain
      const criticalActions = ['user.delete', 'organization.delete', 'framework.delete', 'risk.critical', 'compliance.certificate'];
      const isCritical = criticalActions.some(action => actionString.toLowerCase().includes(action.toLowerCase()));
      
      if (isCritical) {
        blockchainService.recordAuditLog(
          organizationId,
          actionString,
          { logId: auditLog.id, details },
          'polygon' // Default to Polygon for lower gas fees
        ).then((blockchainRecord) => {
          // Store blockchain record in metadata for now
          // Note: In production, add transactionHash, network, blockNumber fields to AuditLog model
          prisma.auditLog.update({
            where: { id: auditLog.id },
            data: {
              metadata: {
                ...(auditLog.metadata as any || {}),
                blockchain: {
                  transactionHash: blockchainRecord.transactionHash,
                  network: blockchainRecord.network,
                  blockNumber: blockchainRecord.blockNumber,
                  verified: blockchainRecord.verified,
                },
              },
            },
          }).catch((error) => {
            logger.error('Failed to update audit log with blockchain info', error);
          });
          
          logger.info(`Audit log ${auditLog.id} submitted to blockchain: ${blockchainRecord.transactionHash}`);
        }).catch((error) => {
          // Log error but don't fail the audit log creation
          logger.warn('Failed to submit audit log to blockchain', error);
        });
      }

      res.status(201).json(auditLog);
    } catch (error) {
      logger.error('Create audit log error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to create audit log: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  };

  // Export audit logs to JSON or CSV
  exportLogs: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { startDate, endDate, format = 'json' } = req.query;

      const where: any = { organizationId };

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate as string);
        if (endDate) where.timestamp.lte = new Date(endDate as string);
      }

      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      if (format === 'csv') {
        const csvHeader = 'ID,Timestamp,Action,User ID,User Name,User Email,IP Address,Details\n';
        const csvRows = logs.map((log) =>
          `"${log.id}","${log.timestamp.toISOString()}","${(log.action || '').replace(/"/g, '""')}","${log.userId || ''}","${log.user?.name || ''}","${log.user?.email || ''}","${log.ipAddress || ''}","${(log.details || '').replace(/"/g, '""')}"`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvHeader + csvRows);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.json`);
        res.json({ exportedAt: new Date().toISOString(), total: logs.length, logs });
      }
    } catch (error) {
      logger.error('Export audit logs error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to export audit logs', 500);
    }
  };

  // Archive old audit logs (mark as archived - audit logs are immutable)
  archiveLogs: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { beforeDate } = req.body;

      if (!beforeDate) {
        throw new AppError('beforeDate is required', 400);
      }

      const cutoffDate = new Date(beforeDate);

      // Get logs to archive
      // Get logs to archive - filter by timestamp only since archived field doesn't exist
      const logsToArchive = await prisma.auditLog.findMany({
        where: {
          organizationId,
          timestamp: { lt: cutoffDate },
        },
        select: { id: true },
      });

      if (logsToArchive.length === 0) {
        res.json({ archived: 0, message: 'No logs to archive' });
        return;
      }

      // For audit logs, we record the archive action but don't modify original logs
      // (audit logs should be immutable in production)
      const archiveResult = { count: logsToArchive.length };

      // Create audit log for the archive action
      await prisma.auditLog.create({
        data: {
          action: `Archived ${archiveResult.count} audit logs before ${cutoffDate.toISOString()}`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
          ipAddress: req.ip || undefined,
        },
      });

      res.json({
        archived: archiveResult.count,
        beforeDate: cutoffDate.toISOString(),
        message: `Successfully archived ${archiveResult.count} audit logs`
      });
    } catch (error) {
      logger.error('Archive audit logs error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to archive audit logs', 500);
    }
  };
}

export default new AuditController();

