import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import geminiService from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

class RisksController {
  list: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { status, severity, assignedTo } = req.query;

      const risks = await prisma.riskItem.findMany({
        where: {
          organizationId,
          ...(status && { status: status as any }),
          ...(severity && { severity: severity as any }),
          ...(assignedTo && { assignedToId: assignedTo as string }),
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: [
          { severity: 'desc' },
          { detectedAt: 'desc' },
        ],
      });

      res.json(risks);
    } catch (error) {
      logger.error('List risks error', error);
      throw new AppError('Failed to fetch risks', 500);
    }
  };

  getById: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const organizationId = authReq.user!.organizationId;

      const risk = await prisma.riskItem.findFirst({
        where: {
          id,
          organizationId,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      if (!risk) {
        throw new AppError('Risk not found', 404);
      }

      res.json(risk);
    } catch (error) {
      logger.error('Get risk error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch risk', 500);
    }
  };

  create: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { title, severity, description, category, assignedToId } = req.body;

      if (!severity || !description || !category) {
        throw new AppError('Severity, description, and category are required', 400);
      }

      const risk = await prisma.riskItem.create({
        data: {
          title: title || description.substring(0, 100),
          severity,
          description,
          category,
          organizationId,
          assignedToId: assignedToId || null,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: `Risk Created: ${description.substring(0, 50)}`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(201).json(risk);
      logger.info(`Risk created: ${risk.id}`);
    } catch (error) {
      logger.error('Create risk error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create risk', 500);
    }
  };

  update: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const organizationId = authReq.user!.organizationId;
      const updateData = req.body;

      // Verify risk exists and belongs to organization
      const existingRisk = await prisma.riskItem.findFirst({
        where: { id, organizationId },
      });

      if (!existingRisk) {
        throw new AppError('Risk not found', 404);
      }

      // Update risk
      const risk = await prisma.riskItem.update({
        where: { id },
        data: {
          ...updateData,
          ...(updateData.status === 'Resolved' && !existingRisk.resolvedAt && {
            resolvedAt: new Date(),
          }),
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: `Risk Updated: ${risk.description.substring(0, 50)}`,
          details: JSON.stringify(updateData),
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json(risk);
      logger.info(`Risk updated: ${risk.id}`);
    } catch (error) {
      logger.error('Update risk error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update risk', 500);
    }
  };

  delete: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const organizationId = authReq.user!.organizationId;

      const risk = await prisma.riskItem.findFirst({
        where: { id, organizationId },
      });

      if (!risk) {
        throw new AppError('Risk not found', 404);
      }

      await prisma.riskItem.delete({
        where: { id },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: `Risk Deleted: ${risk.description.substring(0, 50)}`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json({ message: 'Risk deleted successfully' });
      logger.info(`Risk deleted: ${id}`);
    } catch (error) {
      logger.error('Delete risk error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete risk', 500);
    }
  };

  prioritize: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const risks = await prisma.riskItem.findMany({
        where: {
          organizationId,
          status: { not: 'Resolved' },
        },
      });

      if (risks.length === 0) {
        res.json([]);
        return;
      }

      // Use Gemini AI to prioritize
      const prioritized = await geminiService.prioritizeRisks(risks, authReq.user!.id);

      // Update risks with AI scores
      for (const item of prioritized) {
        await prisma.riskItem.update({
          where: { id: item.id },
          data: {
            aiPriorityScore: item.score,
            aiRationale: item.rationale,
          },
        });
      }

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: `AI Risk Prioritization Completed (${risks.length} risks)`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json(prioritized);
      logger.info(`Risks prioritized: ${prioritized.length}`);
    } catch (error) {
      logger.error('Prioritize risks error', error);
      throw new AppError('Failed to prioritize risks', 500);
    }
  };

  generateRemediation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const organizationId = authReq.user!.organizationId;

      const risk = await prisma.riskItem.findFirst({
        where: { id, organizationId },
      });

      if (!risk) {
        throw new AppError('Risk not found', 404);
      }

      // Generate remediation plan using Gemini
      const plan = await geminiService.generateRemediationPlan(
        risk.description,
        authReq.user!.id
      );

      // Update risk with remediation plan
      await prisma.riskItem.update({
        where: { id },
        data: { mitigationPlan: plan },
      });

      res.json({ plan });
      logger.info(`Remediation plan generated for risk: ${id}`);
    } catch (error) {
      logger.error('Generate remediation error', error);
      throw new AppError('Failed to generate remediation plan', 500);
    }
  };

  scan: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      // Simulate automated risk scanning
      // In production, this would integrate with actual security tools
      const simulatedRisk = await prisma.riskItem.create({
        data: {
          title: 'Publicly accessible database instance without encryption',
          severity: 'High',
          description: 'Automated scan detected: Publicly accessible database instance without encryption',
          category: 'Infrastructure',
          organizationId,
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: 'Automated Risk Scan Completed',
          details: `New risk detected: ${simulatedRisk.id}`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json({
        message: 'Risk scan completed',
        newRisks: [simulatedRisk],
      });

      logger.info(`Risk scan completed for organization: ${organizationId}`);
    } catch (error) {
      logger.error('Risk scan error', error);
      throw new AppError('Failed to complete risk scan', 500);
    }
  };
}

export default new RisksController();
