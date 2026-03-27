/**
 * Custom Report Builder Routes
 *
 * Endpoints for creating, managing, and generating reports from
 * configurable templates. Includes pre-built report templates for
 * SOC 2 Readiness, GDPR Compliance, Risk Summary, and more.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import {
  createReportTemplateSchema,
  updateReportTemplateSchema,
  generateReportSchema,
} from '../validators/reportSchemas';
import { AppError } from '../middleware/errorHandler';
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
// PRE-BUILT REPORT TEMPLATES (before /:id to avoid route conflicts)
// ============================================================================

const REPORT_LIBRARY = [
  {
    id: 'lib-soc2-readiness',
    name: 'SOC 2 Readiness Assessment',
    description: 'Comprehensive SOC 2 Type I/II readiness report covering all Trust Service Criteria',
    category: 'Audit',
    format: 'PDF',
    sections: [
      { id: 's1', title: 'Executive Summary', type: 'summary', dataSources: ['complianceScore', 'controlStatus'] },
      { id: 's2', title: 'Security (CC6)', type: 'controlStatus', dataSources: ['controls'], filters: { framework: 'SOC2', category: 'CC6' } },
      { id: 's3', title: 'Availability (A1)', type: 'controlStatus', dataSources: ['controls'], filters: { framework: 'SOC2', category: 'A1' } },
      { id: 's4', title: 'Processing Integrity (PI1)', type: 'controlStatus', dataSources: ['controls'], filters: { framework: 'SOC2', category: 'PI1' } },
      { id: 's5', title: 'Confidentiality (C1)', type: 'controlStatus', dataSources: ['controls'], filters: { framework: 'SOC2', category: 'C1' } },
      { id: 's6', title: 'Privacy (P1)', type: 'controlStatus', dataSources: ['controls'], filters: { framework: 'SOC2', category: 'P1' } },
      { id: 's7', title: 'Gap Analysis', type: 'gaps', dataSources: ['gapAnalysis'] },
      { id: 's8', title: 'Evidence Collection Status', type: 'evidenceStatus', dataSources: ['evidence'] },
      { id: 's9', title: 'Remediation Plan', type: 'remediation', dataSources: ['risks', 'issues'] },
    ],
  },
  {
    id: 'lib-gdpr-compliance',
    name: 'GDPR Compliance Report',
    description: 'Data protection compliance report covering Articles 5-49 of the GDPR',
    category: 'Privacy',
    format: 'PDF',
    sections: [
      { id: 's1', title: 'Executive Summary', type: 'summary', dataSources: ['complianceScore'] },
      { id: 's2', title: 'Data Processing Activities (Art. 30)', type: 'table', dataSources: ['processingActivities'] },
      { id: 's3', title: 'Lawful Basis Assessment', type: 'table', dataSources: ['consentRecords'] },
      { id: 's4', title: 'DPIA Summary (Art. 35)', type: 'table', dataSources: ['dpias'] },
      { id: 's5', title: 'Data Subject Rights (Art. 15-22)', type: 'metrics', dataSources: ['dsarRequests'] },
      { id: 's6', title: 'International Transfers (Art. 44-49)', type: 'table', dataSources: ['transfers'] },
      { id: 's7', title: 'Breach Notification Log (Art. 33-34)', type: 'table', dataSources: ['breachIncidents'] },
      { id: 's8', title: 'DPO Report', type: 'narrative', dataSources: ['dpoProfile'] },
    ],
  },
  {
    id: 'lib-risk-summary',
    name: 'Risk Summary Report',
    description: 'Organization-wide risk landscape with severity distribution and mitigation progress',
    category: 'Risk',
    format: 'PDF',
    sections: [
      { id: 's1', title: 'Risk Overview', type: 'summary', dataSources: ['risks'] },
      { id: 's2', title: 'Risk Heatmap', type: 'heatmap', dataSources: ['risks'] },
      { id: 's3', title: 'Critical & High Risks', type: 'table', dataSources: ['risks'], filters: { severity: ['Critical', 'High'] } },
      { id: 's4', title: 'Mitigation Progress', type: 'chart', dataSources: ['risks'] },
      { id: 's5', title: 'Risk Trend Analysis', type: 'trend', dataSources: ['risks'] },
      { id: 's6', title: 'Risk by Category', type: 'breakdown', dataSources: ['risks'] },
    ],
  },
  {
    id: 'lib-vendor-risk',
    name: 'Vendor Risk Assessment Report',
    description: 'Third-party vendor risk assessment with scoring and compliance status',
    category: 'Vendor',
    format: 'PDF',
    sections: [
      { id: 's1', title: 'Vendor Portfolio Overview', type: 'summary', dataSources: ['vendors'] },
      { id: 's2', title: 'High-Risk Vendors', type: 'table', dataSources: ['vendors'], filters: { riskLevel: ['Critical', 'High'] } },
      { id: 's3', title: 'Vendor Compliance Status', type: 'table', dataSources: ['vendors'] },
      { id: 's4', title: 'Contract Expiration Timeline', type: 'timeline', dataSources: ['vendors'] },
      { id: 's5', title: 'Vendor Risk Distribution', type: 'chart', dataSources: ['vendors'] },
    ],
  },
  {
    id: 'lib-incident-response',
    name: 'Incident Response Report',
    description: 'Security incident summary with timeline, response metrics, and lessons learned',
    category: 'Security',
    format: 'PDF',
    sections: [
      { id: 's1', title: 'Incident Overview', type: 'summary', dataSources: ['incidents'] },
      { id: 's2', title: 'Incident Timeline', type: 'timeline', dataSources: ['incidents'] },
      { id: 's3', title: 'Severity Distribution', type: 'chart', dataSources: ['incidents'] },
      { id: 's4', title: 'Mean Time to Resolution', type: 'metrics', dataSources: ['incidents'] },
      { id: 's5', title: 'Open Incidents', type: 'table', dataSources: ['incidents'], filters: { status: 'open' } },
    ],
  },
  {
    id: 'lib-board-executive',
    name: 'Board Executive Summary',
    description: 'High-level compliance and risk posture report for board presentation',
    category: 'Executive',
    format: 'PDF',
    sections: [
      { id: 's1', title: 'Compliance Scorecard', type: 'scorecard', dataSources: ['complianceScore'] },
      { id: 's2', title: 'Key Risk Indicators', type: 'metrics', dataSources: ['risks'] },
      { id: 's3', title: 'Regulatory Changes', type: 'table', dataSources: ['regulatoryChanges'] },
      { id: 's4', title: 'Budget & Cost Analysis', type: 'chart', dataSources: ['complianceCosts'] },
      { id: 's5', title: 'Recommendations', type: 'narrative', dataSources: [] },
    ],
  },
];

router.get(
  '/library',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ status: 'success', data: REPORT_LIBRARY });
  })
);

// ============================================================================
// LIST REPORT TEMPLATES
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const { skip, take, page, limit } = paginate(req.query);

    const search = req.query.search as string | undefined;
    const format = req.query.format as string | undefined;
    const sortBy = (req.query.sortBy as string) || 'updatedAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    try {
      const where: any = { organizationId: orgId };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (format) {
        where.format = format;
      }

      const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'lastGeneratedAt'];
      const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'updatedAt';
      const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

      const [templates, total] = await Promise.all([
        prisma.reportTemplate.findMany({
          where,
          orderBy: { [safeSortBy]: safeSortOrder },
          skip,
          take,
        }),
        prisma.reportTemplate.count({ where }),
      ]);

      // Enrich with creator names
      const creatorIds = [...new Set(templates.map((t) => t.createdBy))];
      const creators = await prisma.user.findMany({
        where: { id: { in: creatorIds } },
        select: { id: true, name: true, email: true },
      });
      const creatorMap = new Map(creators.map((c) => [c.id, c]));

      const enriched = templates.map((t) => ({
        ...t,
        creator: creatorMap.get(t.createdBy) || { id: t.createdBy, name: 'Unknown' },
      }));

      res.json({
        status: 'success',
        data: enriched,
        meta: {
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching report templates:', error);
      throw new AppError('Failed to fetch report templates', 500);
    }
  })
);

// ============================================================================
// GET REPORT TEMPLATE BY ID
// ============================================================================

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const template = await prisma.reportTemplate.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!template) {
        throw new AppError('Report template not found', 404);
      }

      const creator = await prisma.user.findUnique({
        where: { id: template.createdBy },
        select: { id: true, name: true, email: true },
      });

      res.json({
        status: 'success',
        data: {
          ...template,
          creator: creator || { id: template.createdBy, name: 'Unknown' },
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching report template:', error);
      throw new AppError('Failed to fetch report template', 500);
    }
  })
);

// ============================================================================
// CREATE REPORT TEMPLATE
// ============================================================================

router.post(
  '/',
  validateBody(createReportTemplateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;

    try {
      const { name, description, sections, filters, schedule, recipients, format } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new AppError('name is required', 400);
      }

      const validFormats = ['PDF', 'CSV', 'JSON', 'XLSX'];
      const reportFormat = format && validFormats.includes(format) ? format : 'PDF';

      const template = await prisma.reportTemplate.create({
        data: {
          organizationId: orgId,
          createdBy: userId,
          name: name.trim(),
          description: description || null,
          sections: sections || [],
          filters: filters || {},
          schedule: schedule || null,
          recipients: recipients || [],
          format: reportFormat,
        },
      });

      res.status(201).json({ status: 'success', data: template });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating report template:', error);
      throw new AppError('Failed to create report template', 500);
    }
  })
);

// ============================================================================
// UPDATE REPORT TEMPLATE
// ============================================================================

router.patch(
  '/:id',
  validateBody(updateReportTemplateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const existing = await prisma.reportTemplate.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!existing) {
        throw new AppError('Report template not found', 404);
      }

      const { name, description, sections, filters, schedule, recipients, format } = req.body;
      const updateData: any = {};

      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description;
      if (sections !== undefined) updateData.sections = sections;
      if (filters !== undefined) updateData.filters = filters;
      if (schedule !== undefined) updateData.schedule = schedule;
      if (recipients !== undefined) updateData.recipients = recipients;
      if (format !== undefined) {
        const validFormats = ['PDF', 'CSV', 'JSON', 'XLSX'];
        if (validFormats.includes(format)) {
          updateData.format = format;
        }
      }

      const template = await prisma.reportTemplate.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({ status: 'success', data: template });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating report template:', error);
      throw new AppError('Failed to update report template', 500);
    }
  })
);

// ============================================================================
// DELETE REPORT TEMPLATE
// ============================================================================

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;

    try {
      const existing = await prisma.reportTemplate.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!existing) {
        throw new AppError('Report template not found', 404);
      }

      await prisma.reportTemplate.delete({
        where: { id: req.params.id },
      });

      res.json({ status: 'success', data: { id: req.params.id, deleted: true } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting report template:', error);
      throw new AppError('Failed to delete report template', 500);
    }
  })
);

// ============================================================================
// GENERATE REPORT
// ============================================================================

router.post(
  '/:id/generate',
  validateBody(generateReportSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user.organizationId;
    const userId = (req as any).user.id;

    try {
      const template = await prisma.reportTemplate.findFirst({
        where: { id: req.params.id, organizationId: orgId },
      });

      if (!template) {
        throw new AppError('Report template not found', 404);
      }

      const { overrideFilters } = req.body;
      const effectiveFilters = overrideFilters || template.filters || {};

      // Build report data based on template sections
      const sections = (template.sections as any[]) || [];
      const reportData: any[] = [];

      for (const section of sections) {
        const sectionData: any = {
          id: section.id,
          title: section.title,
          type: section.type,
          generatedAt: new Date().toISOString(),
          data: null,
        };

        const dataSources = section.dataSources || [];
        const sectionFilters = { ...effectiveFilters, ...(section.filters || {}) };

        try {
          for (const source of dataSources) {
            switch (source) {
              case 'risks': {
                const riskWhere: any = { organizationId: orgId };
                if (sectionFilters.severity) {
                  riskWhere.severity = Array.isArray(sectionFilters.severity)
                    ? { in: sectionFilters.severity }
                    : sectionFilters.severity;
                }
                if (sectionFilters.status) {
                  riskWhere.status = sectionFilters.status;
                }
                const risks = await prisma.riskItem.findMany({
                  where: riskWhere,
                  orderBy: { detectedAt: 'desc' },
                  take: 100,
                });
                sectionData.data = {
                  ...(sectionData.data || {}),
                  risks,
                  totalCount: await prisma.riskItem.count({ where: { organizationId: orgId } }),
                  bySeverity: await prisma.riskItem.groupBy({
                    by: ['severity'],
                    where: { organizationId: orgId },
                    _count: { id: true },
                  }),
                };
                break;
              }

              case 'vendors': {
                const vendorWhere: any = { organizationId: orgId };
                if (sectionFilters.riskLevel) {
                  vendorWhere.riskLevel = Array.isArray(sectionFilters.riskLevel)
                    ? { in: sectionFilters.riskLevel }
                    : sectionFilters.riskLevel;
                }
                const vendors = await prisma.vendor.findMany({
                  where: vendorWhere,
                  orderBy: { updatedAt: 'desc' },
                  take: 100,
                });
                sectionData.data = {
                  ...(sectionData.data || {}),
                  vendors,
                  totalCount: await prisma.vendor.count({ where: { organizationId: orgId } }),
                };
                break;
              }

              case 'incidents': {
                const incidentWhere: any = { organizationId: orgId };
                if (sectionFilters.status) {
                  incidentWhere.status = sectionFilters.status;
                }
                const incidents = await prisma.grcIncident.findMany({
                  where: incidentWhere,
                  orderBy: { detectedAt: 'desc' },
                  take: 100,
                });
                sectionData.data = {
                  ...(sectionData.data || {}),
                  incidents,
                  totalCount: await prisma.grcIncident.count({ where: { organizationId: orgId } }),
                };
                break;
              }

              case 'policies': {
                const policies = await prisma.policy.findMany({
                  where: { organizationId: orgId },
                  orderBy: { updatedAt: 'desc' },
                  take: 100,
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    category: true,
                    version: true,
                    effectiveDate: true,
                    reviewDate: true,
                  },
                });
                sectionData.data = {
                  ...(sectionData.data || {}),
                  policies,
                  totalCount: await prisma.policy.count({ where: { organizationId: orgId } }),
                };
                break;
              }

              case 'dpias': {
                const dpias = await prisma.dataProtectionImpactAssessment.findMany({
                  where: { organizationId: orgId },
                  orderBy: { updatedAt: 'desc' },
                  take: 50,
                });
                sectionData.data = {
                  ...(sectionData.data || {}),
                  dpias,
                  totalCount: await prisma.dataProtectionImpactAssessment.count({ where: { organizationId: orgId } }),
                };
                break;
              }

              case 'dsarRequests': {
                const dsars = await prisma.dSARRequest.findMany({
                  where: { organizationId: orgId },
                  orderBy: { createdAt: 'desc' },
                  take: 50,
                });
                sectionData.data = {
                  ...(sectionData.data || {}),
                  dsarRequests: dsars,
                  totalCount: await prisma.dSARRequest.count({ where: { organizationId: orgId } }),
                };
                break;
              }

              case 'breachIncidents': {
                const breaches = await prisma.breachIncident.findMany({
                  where: { organizationId: orgId },
                  orderBy: { discoveryDate: 'desc' },
                  take: 50,
                });
                sectionData.data = {
                  ...(sectionData.data || {}),
                  breachIncidents: breaches,
                  totalCount: await prisma.breachIncident.count({ where: { organizationId: orgId } }),
                };
                break;
              }

              case 'complianceCosts': {
                const costs = await prisma.complianceCost.findMany({
                  where: { organizationId: orgId },
                  orderBy: { createdAt: 'desc' },
                  take: 50,
                });
                sectionData.data = {
                  ...(sectionData.data || {}),
                  complianceCosts: costs,
                };
                break;
              }

              case 'regulatoryChanges': {
                const changes = await prisma.regulatoryChange.findMany({
                  where: { organizationId: orgId },
                  orderBy: { createdAt: 'desc' },
                  take: 50,
                });
                sectionData.data = {
                  ...(sectionData.data || {}),
                  regulatoryChanges: changes,
                };
                break;
              }

              case 'consentRecords': {
                const consents = await prisma.consentRecord.findMany({
                  where: { organizationId: orgId },
                  orderBy: { createdAt: 'desc' },
                  take: 50,
                });
                sectionData.data = {
                  ...(sectionData.data || {}),
                  consentRecords: consents,
                };
                break;
              }

              case 'processingActivities': {
                const activities = await prisma.processingActivityRecord.findMany({
                  where: { organizationId: orgId },
                  orderBy: { updatedAt: 'desc' },
                  take: 50,
                });
                sectionData.data = {
                  ...(sectionData.data || {}),
                  processingActivities: activities,
                };
                break;
              }

              default:
                // Unknown data source — log warning and omit from output
                logger.warn(`Report generation: unhandled data source '${source}' in section '${section.title}'`);
                break;
            }
          }
        } catch (sectionError) {
          logger.warn(`Error generating section "${section.title}":`, sectionError);
          sectionData.data = { error: 'Failed to generate section data' };
        }

        reportData.push(sectionData);
      }

      // Update lastGeneratedAt on the template
      await prisma.reportTemplate.update({
        where: { id: req.params.id },
        data: { lastGeneratedAt: new Date() },
      });

      const report = {
        metadata: {
          templateId: template.id,
          templateName: template.name,
          organizationId: orgId,
          generatedBy: userId,
          generatedAt: new Date().toISOString(),
          format: template.format,
          filters: effectiveFilters,
        },
        sections: reportData,
      };

      res.json({ status: 'success', data: report });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error generating report:', error);
      throw new AppError('Failed to generate report', 500);
    }
  })
);

export default router;
