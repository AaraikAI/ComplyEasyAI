import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

class FrameworksController {
  list: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const frameworks = await prisma.complianceFramework.findMany({
        where: { organizationId },
        include: {
          controls: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(frameworks);
    } catch (error) {
      logger.error('List frameworks error', error);
      throw new AppError('Failed to fetch frameworks', 500);
    }
  };

  getById: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const organizationId = authReq.user!.organizationId;

      const framework = await prisma.complianceFramework.findFirst({
        where: { id, organizationId },
        include: { controls: true },
      });

      if (!framework) {
        throw new AppError('Framework not found', 404);
      }

      res.json(framework);
    } catch (error) {
      logger.error('Get framework error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch framework', 500);
    }
  };

  create: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { name, region, nextAuditDate } = req.body;

      if (!name || !nextAuditDate) {
        throw new AppError('Name and next audit date are required', 400);
      }

      const framework = await prisma.complianceFramework.create({
        data: {
          name,
          region,
          nextAuditDate: new Date(nextAuditDate),
          organizationId,
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: `Framework Added: ${name}`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.status(201).json(framework);
      logger.info(`Framework created: ${framework.id}`);
    } catch (error) {
      logger.error('Create framework error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create framework', 500);
    }
  };

  update: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const organizationId = authReq.user!.organizationId;
      const updateData = req.body;

      const existingFramework = await prisma.complianceFramework.findFirst({
        where: { id, organizationId },
      });

      if (!existingFramework) {
        throw new AppError('Framework not found', 404);
      }

      const framework = await prisma.complianceFramework.update({
        where: { id },
        data: updateData,
      });

      await prisma.auditLog.create({
        data: {
          action: `Framework Updated: ${framework.name}`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.json(framework);
    } catch (error) {
      logger.error('Update framework error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update framework', 500);
    }
  };

  delete: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const organizationId = authReq.user!.organizationId;

      const framework = await prisma.complianceFramework.findFirst({
        where: { id, organizationId },
      });

      if (!framework) {
        throw new AppError('Framework not found', 404);
      }

      await prisma.complianceFramework.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          action: `Framework Deleted: ${framework.name}`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
        },
      });

      res.json({ message: 'Framework deleted successfully' });
    } catch (error) {
      logger.error('Delete framework error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete framework', 500);
    }
  };
}

export default new FrameworksController();
