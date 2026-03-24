/**
 * GRC Maturity Assessment Routes
 *
 * Manage maturity assessments with domain-level scoring (1-5),
 * trend analysis over time, and AI-driven recommendations.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createMaturityAssessmentSchema, generateMaturityRecommendationsSchema,
} from '../validators/coreModulesSchemas';
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

// ============================================================================
// GET LATEST ASSESSMENT (before /:id to avoid route conflicts)
// ============================================================================

router.get(
  '/assessments/latest',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const assessment = await prisma.maturityAssessment.findFirst({
        where: { organizationId: user.organizationId },
        orderBy: { assessmentDate: 'desc' },
        include: {
          domains: { orderBy: { domain: 'asc' } },
        },
      });

      if (!assessment) {
        res.status(404).json({ error: 'No maturity assessments found' });
        return;
      }

      res.json({ status: 'success', data: assessment });
    } catch (error) {
      logger.error('Error fetching latest assessment:', error);
      res.status(500).json({ error: 'Failed to fetch latest assessment' });
    }
  })
);

// ============================================================================
// ASSESSMENT TREND OVER TIME
// ============================================================================

router.get(
  '/assessments/trend',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const months = Math.max(1, Math.min(60, parseInt(req.query.months as string, 10) || 12));

    try {
      const sinceDate = new Date();
      sinceDate.setMonth(sinceDate.getMonth() - months);

      const assessments = await prisma.maturityAssessment.findMany({
        where: {
          organizationId: user.organizationId,
          assessmentDate: { gte: sinceDate },
        },
        orderBy: { assessmentDate: 'asc' },
        include: {
          domains: { orderBy: { domain: 'asc' } },
        },
      });

      // Build trend data
      const trend = assessments.map((a) => ({
        id: a.id,
        date: a.assessmentDate,
        overallLevel: a.overallLevel,
        domains: a.domains.map((d) => ({
          domain: d.domain,
          currentLevel: d.currentLevel,
          targetLevel: d.targetLevel,
        })),
      }));

      // Calculate improvement metrics
      let overallImprovement = 0;
      if (assessments.length >= 2) {
        const first = assessments[0];
        const last = assessments[assessments.length - 1];
        overallImprovement = last.overallLevel - first.overallLevel;
      }

      res.json({
        status: 'success',
        data: {
          trend,
          totalAssessments: assessments.length,
          overallImprovement,
          periodMonths: months,
        },
      });
    } catch (error) {
      logger.error('Error fetching assessment trend:', error);
      res.status(500).json({ error: 'Failed to fetch assessment trend' });
    }
  })
);

// ============================================================================
// LIST ASSESSMENTS
// ============================================================================

router.get(
  '/assessments',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);

    try {
      const where = { organizationId: user.organizationId };

      const [assessments, total] = await Promise.all([
        prisma.maturityAssessment.findMany({
          where,
          orderBy: { assessmentDate: 'desc' },
          skip,
          take,
          include: {
            domains: { orderBy: { domain: 'asc' } },
          },
        }),
        prisma.maturityAssessment.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: assessments,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching assessments:', error);
      res.status(500).json({ error: 'Failed to fetch assessments' });
    }
  })
);

// ============================================================================
// GET ASSESSMENT BY ID
// ============================================================================

router.get(
  '/assessments/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const assessment = await prisma.maturityAssessment.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
        include: {
          domains: { orderBy: { domain: 'asc' } },
        },
      });

      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }

      res.json({ status: 'success', data: assessment });
    } catch (error) {
      logger.error('Error fetching assessment:', error);
      res.status(500).json({ error: 'Failed to fetch assessment' });
    }
  })
);

// ============================================================================
// CREATE ASSESSMENT WITH DOMAIN SCORES
// ============================================================================

router.post(
  '/assessments',
  authorize('admin', 'editor'),
  validateBody(createMaturityAssessmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const { domains, assessmentDate } = req.body;

      if (!domains || !Array.isArray(domains) || domains.length === 0) {
        res.status(400).json({ error: 'domains array is required with at least one domain score' });
        return;
      }

      // Validate each domain entry
      for (const domain of domains) {
        if (!domain.domain) {
          res.status(400).json({ error: 'Each domain entry must have a domain name' });
          return;
        }
        if (
          domain.currentLevel !== undefined &&
          (domain.currentLevel < 1 || domain.currentLevel > 5)
        ) {
          res.status(400).json({ error: 'currentLevel must be between 1 and 5' });
          return;
        }
        if (
          domain.targetLevel !== undefined &&
          (domain.targetLevel < 1 || domain.targetLevel > 5)
        ) {
          res.status(400).json({ error: 'targetLevel must be between 1 and 5' });
          return;
        }
      }

      // Calculate overall level as average of domain scores
      const totalScore = domains.reduce(
        (sum: number, d: any) => sum + (d.currentLevel || 1),
        0
      );
      const overallLevel = Math.round(totalScore / domains.length);

      const assessment = await prisma.maturityAssessment.create({
        data: {
          organizationId: user.organizationId,
          assessmentDate: assessmentDate ? new Date(assessmentDate) : new Date(),
          overallLevel,
          domains: {
            create: domains.map((d: any) => ({
              domain: d.domain,
              currentLevel: d.currentLevel || 1,
              targetLevel: d.targetLevel || 3,
              gaps: d.gaps || null,
            })),
          },
        },
        include: {
          domains: { orderBy: { domain: 'asc' } },
        },
      });

      res.status(201).json({ status: 'success', data: assessment });
    } catch (error) {
      logger.error('Error creating assessment:', error);
      res.status(500).json({ error: 'Failed to create assessment' });
    }
  })
);

// ============================================================================
// GENERATE AI RECOMMENDATIONS
// ============================================================================

router.post(
  '/assessments/:id/recommendations',
  authorize('admin', 'editor'),
  validateBody(generateMaturityRecommendationsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    try {
      const assessment = await prisma.maturityAssessment.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
        include: {
          domains: { orderBy: { domain: 'asc' } },
        },
      });

      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }

      const { additionalContext, priorityAreas } = req.body;

      // Generate recommendations based on domain gaps
      const recommendations: any[] = [];
      for (const domain of assessment.domains) {
        const gap = domain.targetLevel - domain.currentLevel;
        if (gap <= 0) continue;

        const priority = gap >= 3 ? 'CRITICAL' : gap >= 2 ? 'HIGH' : 'MEDIUM';
        recommendations.push({
          domain: domain.domain,
          currentLevel: domain.currentLevel,
          targetLevel: domain.targetLevel,
          gap,
          priority,
          recommendation: `Improve ${domain.domain} maturity from level ${domain.currentLevel} to ${domain.targetLevel}. Focus on closing the ${gap}-level gap through structured capability building.`,
          estimatedEffort: gap >= 3 ? '6-12 months' : gap >= 2 ? '3-6 months' : '1-3 months',
          suggestedActions: generateDomainActions(domain.domain, domain.currentLevel, domain.targetLevel),
        });
      }

      // Sort by gap size descending (biggest gaps first)
      recommendations.sort((a, b) => b.gap - a.gap);

      // Store recommendations on the assessment
      const updated = await prisma.maturityAssessment.update({
        where: { id: assessment.id },
        data: {
          recommendations: {
            generatedAt: new Date().toISOString(),
            generatedBy: user.id,
            additionalContext: additionalContext || null,
            priorityAreas: priorityAreas || [],
            items: recommendations,
          },
        },
        include: {
          domains: { orderBy: { domain: 'asc' } },
        },
      });

      res.json({
        status: 'success',
        data: {
          assessment: updated,
          recommendations,
        },
      });
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  })
);

// ============================================================================
// HELPER: Generate domain-specific improvement actions
// ============================================================================

function generateDomainActions(domain: string, current: number, target: number): string[] {
  const baseActions: Record<string, string[]> = {
    Governance: [
      'Establish a formal GRC steering committee',
      'Define and document governance policies',
      'Implement regular board-level compliance reporting',
      'Create accountability frameworks with clear RACI matrices',
    ],
    Risk: [
      'Implement quantitative risk assessment methodology',
      'Establish risk appetite and tolerance statements',
      'Deploy continuous risk monitoring tools',
      'Create risk treatment plans with measurable KRIs',
    ],
    Compliance: [
      'Map all applicable regulatory requirements',
      'Implement automated compliance monitoring',
      'Establish internal audit program',
      'Create compliance training and awareness programs',
    ],
    Technology: [
      'Deploy GRC technology platform',
      'Implement automated evidence collection',
      'Integrate security tools with compliance workflows',
      'Establish technology controls testing automation',
    ],
    People: [
      'Develop role-based compliance training programs',
      'Establish security awareness campaigns',
      'Implement competency-based hiring for GRC roles',
      'Create succession planning for key compliance positions',
    ],
  };

  const actions = baseActions[domain] || [
    `Define formal ${domain} processes and procedures`,
    `Establish metrics and KPIs for ${domain}`,
    `Implement continuous improvement for ${domain}`,
    `Create training programs for ${domain} capabilities`,
  ];

  // Return subset of actions based on the gap
  const gap = target - current;
  return actions.slice(0, Math.min(actions.length, gap + 1));
}

export default router;
