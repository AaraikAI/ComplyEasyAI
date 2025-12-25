import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

class OrganizationController {
  get: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          name: true,
          plan: true,
          subscriptionStatus: true,
          stripeCustomerId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!organization) {
        throw new AppError('Organization not found', 404);
      }

      res.json(organization);
    } catch (error) {
      logger.error('Get organization error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch organization', 500);
    }
  };

  update: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { name, plan } = req.body;

      // Validation
      if (name !== undefined) {
        if (!name || name.trim().length === 0) {
          throw new AppError('Organization name is required', 400);
        }
        if (name.length > 100) {
          throw new AppError('Organization name is too long. Maximum 100 characters.', 400);
        }
      }

      if (plan !== undefined) {
        const validPlans = ['Basic', 'Pro', 'Enterprise'];
        if (!validPlans.includes(plan)) {
          throw new AppError(`Invalid plan. Must be one of: ${validPlans.join(', ')}`, 400);
        }
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (plan !== undefined) updateData.plan = plan;

      const organization = await prisma.organization.update({
        where: { id: organizationId },
        data: updateData,
        select: {
          id: true,
          name: true,
          plan: true,
          subscriptionStatus: true,
          stripeCustomerId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: 'Organization Settings Updated',
          details: JSON.stringify({ name, plan }),
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'] || undefined,
        },
      });

      res.json(organization);
      logger.info(`Organization updated: ${organizationId}`);
    } catch (error) {
      logger.error('Update organization error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update organization', 500);
    }
  };
}

export default new OrganizationController();

