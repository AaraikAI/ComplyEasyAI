import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import geminiService from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { ComplianceStatus } from '../generated/prisma/client';

class RisksController {
  list: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { status, severity, assignedTo, category, search, sortBy, sortOrder } = req.query;

      // Build where clause with all filters
      const where: any = {
        organizationId,
        ...(status && status !== 'All' && { status: status as any }),
        ...(severity && severity !== 'All' && { severity: severity as any }),
        ...(assignedTo && assignedTo !== 'All' && { assignedToId: assignedTo as string }),
        ...(category && category !== 'All' && { category: category as string }),
        ...(search && {
          OR: [
            { title: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } },
            { category: { contains: search as string, mode: 'insensitive' } },
          ],
        }),
      };

      // Build orderBy clause
      let orderBy: any[] = [];
      if (sortBy === 'severity') {
        orderBy = [{ severity: (sortOrder === 'asc' ? 'asc' : 'desc') }];
      } else if (sortBy === 'detectedAt') {
        orderBy = [{ detectedAt: (sortOrder === 'asc' ? 'asc' : 'desc') }];
      } else if (sortBy === 'riskScore') {
        orderBy = [{ riskScore: (sortOrder === 'asc' ? 'asc' : 'desc') }];
      } else {
        // Default sorting
        orderBy = [
          { severity: 'desc' },
          { detectedAt: 'desc' },
        ];
      }

      const risks = await prisma.riskItem.findMany({
        where,
        orderBy,
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
      const { title, severity, description, category, assignedToId, likelihood, impact, mitigationPlan, targetDate } = req.body;

      if (!severity || !description || !category) {
        throw new AppError('Severity, description, and category are required', 400);
      }

      // Calculate risk score: likelihood × impact
      const riskLikelihood = likelihood !== undefined ? parseInt(likelihood) : 3;
      const riskImpact = impact !== undefined ? parseInt(impact) : 3;
      const calculatedRiskScore = riskLikelihood * riskImpact;

      const risk = await prisma.riskItem.create({
        data: {
          title: title || description.substring(0, 100),
          severity,
          description,
          category,
          organizationId,
          assignedToId: assignedToId || null,
          likelihood: riskLikelihood,
          impact: riskImpact,
          riskScore: calculatedRiskScore,
          mitigationPlan: mitigationPlan || null,
          targetDate: targetDate ? new Date(targetDate) : null,
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

      // Log audit with risk description and user name
      const riskDescription = description.length > 50 
        ? description.substring(0, 50) + '...' 
        : description;
      const userName = authReq.user!.name || authReq.user!.email || 'User';
      
      await prisma.auditLog.create({
        data: {
          action: `Risk "${riskDescription}" created (by ${userName})`,
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

      // Filter and prepare only updatable fields
      const allowedFields = [
        'status',
        'severity',
        'description',
        'category',
        'likelihood',
        'impact',
        'riskScore',
        'aiPriorityScore',
        'aiRationale',
        'mitigationPlan',
        'remediationOwner',
        'targetDate',
        'assignedToId',
      ];

      const filteredData: any = {};
      
      // Only include allowed fields
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          // Handle null/empty string for mitigationPlan - allow clearing it
          if (field === 'mitigationPlan' && (updateData[field] === null || updateData[field] === '')) {
            filteredData[field] = null;
          } else {
            filteredData[field] = updateData[field];
          }
        }
      }

      // Handle status mapping (frontend may send "In Progress" but backend expects "In_Progress")
      if (filteredData.status) {
        const statusMap: Record<string, string> = {
          'Open': 'Open',
          'In Progress': 'In_Progress',
          'In_Progress': 'In_Progress',
          'Resolved': 'Resolved',
          'Ignored': 'Ignored',
          'Accepted': 'Accepted'
        };
        filteredData.status = statusMap[filteredData.status] || filteredData.status;
      }

      // Update risk
      const risk = await prisma.riskItem.update({
        where: { id },
        data: {
          ...filteredData,
          ...(filteredData.status === 'Resolved' && !existingRisk.resolvedAt && {
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

      // Log audit with risk description and status change
      const riskDescription = risk.description 
        ? (risk.description.length > 50 
            ? risk.description.substring(0, 50) + '...' 
            : risk.description)
        : `Risk ${risk.id}`;
      
      // Include status change in audit message if status was updated
      const statusChange = updateData.status && updateData.status !== existingRisk.status
        ? ` updated to ${updateData.status}`
        : '';
      
      const userName = authReq.user!.name || authReq.user!.email || 'User';
      await prisma.auditLog.create({
        data: {
          action: `Risk "${riskDescription}"${statusChange} (by ${userName})`,
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
    } catch (error: any) {
      logger.error('Generate remediation error', error);
      if (error instanceof AppError) throw error;
      const msg = error?.message || 'Unknown error';
      if (msg.includes('Rate limit')) {
        throw new AppError('AI rate limit exceeded. Please try again in a moment.', 429);
      }
      if (msg.includes('API key') || msg.includes('authentication') || msg.includes('GEMINI_API_KEY')) {
        throw new AppError('AI service not configured. Please check GEMINI_API_KEY.', 503);
      }
      throw new AppError(`Failed to generate remediation plan: ${msg}`, 500);
    }
  };

  scan: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const newRisks: any[] = [];

      // 1. Scan frameworks for non-compliant controls
      const frameworks = await prisma.complianceFramework.findMany({
        where: { organizationId },
        include: { controls: true },
      });

      for (const framework of frameworks) {
        // Find controls that are at risk or failed
        const atRiskControls = framework.controls.filter(
          (c) => c.status === 'At Risk' || c.status === 'Failed' || c.status === 'Non-Compliant'
        );

        for (const control of atRiskControls) {
          // Check if risk already exists for this control
          const existingRisk = await prisma.riskItem.findFirst({
            where: {
              organizationId,
              description: { contains: control.name },
              status: { in: ['Open', 'In_Progress'] },
            },
          });

          if (!existingRisk) {
            const risk = await prisma.riskItem.create({
              data: {
                title: `Non-Compliant Control: ${control.name}`,
                severity: control.status === 'Failed' ? 'High' : 'Medium',
                description: `Framework: ${framework.name}\nControl: ${control.name}\nStatus: ${control.status}\n${control.description || ''}`,
                category: 'Compliance',
                organizationId,
                status: 'Open',
              },
            });
            newRisks.push(risk);
          }
        }

        // Check for controls without evidence
        const controlsWithoutEvidence = framework.controls.filter(
          (c) => !c.evidence && (c.status === 'Implemented' || c.status === 'Compliant')
        );

        if (controlsWithoutEvidence.length > 0) {
          const existingRisk = await prisma.riskItem.findFirst({
            where: {
              organizationId,
              description: { contains: `${framework.name} controls without evidence` },
              status: { in: ['Open', 'In_Progress'] },
            },
          });

          if (!existingRisk) {
            const risk = await prisma.riskItem.create({
              data: {
                title: `Missing Evidence for ${framework.name} Controls`,
                severity: 'Medium',
                description: `${controlsWithoutEvidence.length} controls in ${framework.name} are marked as compliant but lack supporting evidence. Evidence is required for audit purposes.`,
                category: 'Compliance',
                organizationId,
                status: 'Open',
              },
            });
            newRisks.push(risk);
          }
        }

        // Check for overdue audit dates
        const now = new Date();
        if (new Date(framework.nextAuditDate) < now) {
          const daysOverdue = Math.floor((now.getTime() - new Date(framework.nextAuditDate).getTime()) / (1000 * 60 * 60 * 24));
          const existingRisk = await prisma.riskItem.findFirst({
            where: {
              organizationId,
              description: { contains: `${framework.name} audit overdue` },
              status: { in: ['Open', 'In_Progress'] },
            },
          });

          if (!existingRisk) {
            const risk = await prisma.riskItem.create({
              data: {
                title: `Overdue Audit: ${framework.name}`,
                severity: daysOverdue > 30 ? 'High' : 'Medium',
                description: `The audit for ${framework.name} is ${daysOverdue} days overdue. Scheduled audit date: ${framework.nextAuditDate.toISOString().split('T')[0]}`,
                category: 'Compliance',
                organizationId,
                status: 'Open',
              },
            });
            newRisks.push(risk);
          }
        }
      }

      // 2. Scan integrations for security issues
      const integrations = await prisma.integration.findMany({
        where: { organizationId, connected: true },
      });

      // Check for integrations that haven't synced recently (potential connection issues)
      const staleIntegrations = integrations.filter((int) => {
        if (!int.lastSync) return true;
        const lastSyncDate = new Date(int.lastSync);
        const daysSinceSync = (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceSync > 7; // More than 7 days since last sync
      });

      for (const integration of staleIntegrations) {
        const existingRisk = await prisma.riskItem.findFirst({
          where: {
            organizationId,
            description: { contains: `${integration.name || integration.provider} integration stale` },
            status: { in: ['Open', 'In_Progress'] },
          },
        });

        if (!existingRisk) {
          const risk = await prisma.riskItem.create({
            data: {
              title: `Stale Integration: ${integration.name || integration.provider}`,
              severity: 'Low',
              description: `The ${integration.name || integration.provider} integration has not synced in over 7 days. This may indicate connection issues or authentication problems.`,
              category: 'Integration',
              organizationId,
              status: 'Open',
            },
          });
          newRisks.push(risk);
        }
      }

      // 3. Check for low compliance scores
      for (const framework of frameworks) {
        if (framework.progress < 50 && framework.status !== ComplianceStatus.In_Review) {
          const existingRisk = await prisma.riskItem.findFirst({
            where: {
              organizationId,
              description: { contains: `${framework.name} low compliance score` },
              status: { in: ['Open', 'In_Progress'] },
            },
          });

          if (!existingRisk) {
            const risk = await prisma.riskItem.create({
              data: {
                title: `Low Compliance Score: ${framework.name}`,
                severity: framework.progress < 25 ? 'High' : 'Medium',
                description: `${framework.name} has a compliance readiness score of ${framework.progress}%, which is below acceptable thresholds. Immediate action required.`,
                category: 'Compliance',
                organizationId,
                status: 'Open',
              },
            });
            newRisks.push(risk);
          }
        }
      }

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: 'Automated Risk Scan Completed',
          details: `${newRisks.length} new risk(s) detected`,
          userId: authReq.user!.id,
          organizationId,
          hash: uuidv4(),
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json({
        message: 'Risk scan completed',
        newRisks,
        totalScanned: {
          frameworks: frameworks.length,
          integrations: integrations.length,
        },
      });

      logger.info(`Risk scan completed for organization: ${organizationId}, found ${newRisks.length} new risks`);
    } catch (error) {
      logger.error('Risk scan error', error);
      throw new AppError('Failed to complete risk scan', 500);
    }
  };
}

export default new RisksController();
