/**
 * Auditor Collaboration Hub Service
 *
 * Manages auditor profiles, audit engagements, findings, workpapers,
 * audit requests, dashboard statistics, and bundled auditor matching.
 *
 * Uses dedicated Prisma models: AuditorProfile, AuditEngagement,
 * AuditFinding, AuditWorkpaper, AuditRequest.
 */

import prisma from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';
import { AuditLogger } from '../utils/auditLogger';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// AUDITOR SERVICE CLASS
// ============================================================================

class AuditorService {

  // ==========================================================================
  // DASHBOARD STATS
  // ==========================================================================

  /**
   * Get auditor collaboration hub dashboard statistics.
   * Returns aggregated counts from dedicated Prisma models.
   */
  async getDashboardStats(organizationId: string) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalAuditors,
      activeEngagements,
      openFindings,
      pendingRequests,
      findingsBySeverityRaw,
      engagementsByStatusRaw,
      upcomingEngagementDeadlines,
      upcomingFindingDeadlines,
      upcomingRequestDeadlines,
    ] = await Promise.all([
      // Total auditors
      prisma.auditorProfile.count({
        where: { organizationId, status: 'Active' },
      }),

      // Active engagements (not Completed)
      prisma.auditEngagement.count({
        where: {
          organizationId,
          status: { not: 'Completed' },
        },
      }),

      // Open findings
      prisma.auditFinding.count({
        where: {
          organizationId,
          status: { in: ['Open', 'InProgress'] },
        },
      }),

      // Pending requests
      prisma.auditRequest.count({
        where: {
          engagement: { organizationId },
          status: { in: ['Open', 'InProgress'] },
        },
      }),

      // Findings grouped by severity (only open/in-progress)
      prisma.auditFinding.groupBy({
        by: ['severity'],
        where: {
          organizationId,
          status: { in: ['Open', 'InProgress'] },
        },
        _count: { id: true },
      }),

      // Engagements grouped by status
      prisma.auditEngagement.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { id: true },
      }),

      // Upcoming engagement deadlines (endDate within 30 days)
      prisma.auditEngagement.findMany({
        where: {
          organizationId,
          status: { not: 'Completed' },
          endDate: { gte: now, lte: thirtyDaysFromNow },
        },
        select: { id: true, title: true, endDate: true },
        orderBy: { endDate: 'asc' },
      }),

      // Upcoming finding remediation deadlines
      prisma.auditFinding.findMany({
        where: {
          organizationId,
          status: { in: ['Open', 'InProgress'] },
          targetRemediationDate: { gte: now, lte: thirtyDaysFromNow },
        },
        select: { id: true, title: true, targetRemediationDate: true },
        orderBy: { targetRemediationDate: 'asc' },
      }),

      // Upcoming request due dates
      prisma.auditRequest.findMany({
        where: {
          engagement: { organizationId },
          status: { in: ['Open', 'InProgress'] },
          dueDate: { gte: now, lte: thirtyDaysFromNow },
        },
        select: { id: true, title: true, dueDate: true },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    // Build findingsBySeverity map
    const findingsBySeverity: Record<string, number> = {};
    for (const row of findingsBySeverityRaw) {
      findingsBySeverity[row.severity] = row._count.id;
    }

    // Build engagementsByStatus map
    const engagementsByStatus: Record<string, number> = {};
    for (const row of engagementsByStatusRaw) {
      engagementsByStatus[row.status] = row._count.id;
    }

    // Merge upcoming deadlines
    const upcomingDeadlines: Array<{ id: string; title: string; type: string; dueDate: string }> = [];

    for (const e of upcomingEngagementDeadlines) {
      if (e.endDate) {
        upcomingDeadlines.push({
          id: e.id,
          title: e.title,
          type: 'engagement',
          dueDate: e.endDate.toISOString(),
        });
      }
    }
    for (const f of upcomingFindingDeadlines) {
      if (f.targetRemediationDate) {
        upcomingDeadlines.push({
          id: f.id,
          title: f.title,
          type: 'finding',
          dueDate: f.targetRemediationDate.toISOString(),
        });
      }
    }
    for (const r of upcomingRequestDeadlines) {
      if (r.dueDate) {
        upcomingDeadlines.push({
          id: r.id,
          title: r.title,
          type: 'request',
          dueDate: r.dueDate.toISOString(),
        });
      }
    }

    upcomingDeadlines.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    return {
      totalAuditors,
      activeEngagements,
      openFindings,
      pendingRequests,
      findingsBySeverity,
      engagementsByStatus,
      upcomingDeadlines,
    };
  }

  // ==========================================================================
  // AUDITOR MATCHING
  // ==========================================================================

  /**
   * Match auditors to requirements based on specializations, certifications,
   * engagementType, and rating.
   */
  async matchAuditors(
    organizationId: string,
    criteria: {
      specializations?: string[];
      certifications?: string[];
      engagementType?: string;
      rating?: number;
      maxHourlyRate?: number;
    }
  ) {
    // Build a base where clause
    const where: any = {
      organizationId,
      status: 'Active',
    };

    if (criteria.engagementType) {
      where.engagementType = criteria.engagementType;
    }

    if (criteria.rating) {
      where.rating = { gte: criteria.rating };
    }

    if (criteria.maxHourlyRate) {
      where.OR = [
        { hourlyRate: { lte: criteria.maxHourlyRate } },
        { hourlyRate: null },
      ];
    }

    const auditors = await prisma.auditorProfile.findMany({
      where,
      include: {
        engagements: {
          select: { id: true, status: true, framework: true },
        },
      },
      orderBy: [
        { rating: 'desc' },
        { completedAudits: 'desc' },
      ],
    });

    // Score and filter by specializations/certifications overlap
    const scored = auditors.map((auditor) => {
      let matchScore = 0;
      const matchReasons: string[] = [];

      // Specialization match (highest weight - 40 pts)
      if (criteria.specializations && criteria.specializations.length > 0) {
        const specMatches = criteria.specializations.filter((s) =>
          auditor.specializations.includes(s)
        );
        if (specMatches.length > 0) {
          const specScore = (specMatches.length / criteria.specializations.length) * 40;
          matchScore += specScore;
          matchReasons.push(`Specializations: ${specMatches.join(', ')}`);
        }
      }

      // Certification match (25 pts)
      if (criteria.certifications && criteria.certifications.length > 0) {
        const certMatches = criteria.certifications.filter((c) =>
          auditor.certification.includes(c)
        );
        if (certMatches.length > 0) {
          const certScore = (certMatches.length / criteria.certifications.length) * 25;
          matchScore += certScore;
          matchReasons.push(`Certifications: ${certMatches.join(', ')}`);
        }
      }

      // Rating bonus (up to 20 pts)
      if (auditor.rating) {
        const ratingScore = (auditor.rating / 5) * 20;
        matchScore += ratingScore;
        matchReasons.push(`Rating: ${auditor.rating}/5`);
      }

      // Experience bonus (up to 15 pts)
      if (auditor.completedAudits > 0) {
        const expScore = Math.min(auditor.completedAudits / 10, 1) * 15;
        matchScore += expScore;
        matchReasons.push(`Completed audits: ${auditor.completedAudits}`);
      }

      return {
        ...auditor,
        matchScore: Math.round(matchScore * 100) / 100,
        matchReasons,
      };
    });

    // Filter out zero-score matches if filtering criteria were provided
    const hasFilterCriteria =
      (criteria.specializations && criteria.specializations.length > 0) ||
      (criteria.certifications && criteria.certifications.length > 0);

    const results = hasFilterCriteria
      ? scored.filter((a) => a.matchScore > 0)
      : scored;

    return results.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
      return b.completedAudits - a.completedAudits;
    });
  }

  // ==========================================================================
  // AUDITOR PROFILE CRUD
  // ==========================================================================

  async listAuditorProfiles(
    organizationId: string,
    filters?: {
      status?: string;
      engagementType?: string;
      specialization?: string;
      certification?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 25;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.engagementType) {
      where.engagementType = filters.engagementType;
    }
    if (filters?.specialization) {
      where.specializations = { has: filters.specialization };
    }
    if (filters?.certification) {
      where.certification = { has: filters.certification };
    }

    const [data, total] = await Promise.all([
      prisma.auditorProfile.findMany({
        where,
        include: {
          engagements: {
            select: { id: true, title: true, status: true, framework: true },
            orderBy: { updatedAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditorProfile.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async createAuditorProfile(organizationId: string, data: {
    name: string;
    email: string;
    firm?: string;
    certification?: string[];
    specializations?: string[];
    yearsExperience?: number;
    engagementType?: string;
    status?: string;
    rating?: number;
    hourlyRate?: number;
    contractUrl?: string;
    ndaSigned?: boolean;
    ndaSignedDate?: Date;
    notes?: string;
  }) {
    const id = uuidv4();

    const profile = await prisma.auditorProfile.create({
      data: {
        id,
        organizationId,
        name: data.name,
        email: data.email,
        firm: data.firm,
        certification: data.certification || [],
        specializations: data.specializations || [],
        yearsExperience: data.yearsExperience,
        engagementType: data.engagementType || 'External',
        status: data.status || 'Active',
        rating: data.rating,
        hourlyRate: data.hourlyRate,
        contractUrl: data.contractUrl,
        ndaSigned: data.ndaSigned || false,
        ndaSignedDate: data.ndaSignedDate,
        notes: data.notes,
      },
    });

    logger.info(`Auditor profile created: ${profile.id} for org ${organizationId}`);

    AuditLogger.log({
      userId: 'system',
      organizationId,
      action: 'auditor_profile.create',
      resourceType: 'AuditorProfile',
      resourceId: profile.id,
      metadata: { name: data.name, email: data.email },
    });

    return profile;
  }

  async getAuditorProfile(organizationId: string, profileId: string) {
    const profile = await prisma.auditorProfile.findFirst({
      where: { id: profileId, organizationId },
      include: {
        engagements: {
          orderBy: { updatedAt: 'desc' },
          include: { findings: { select: { id: true, severity: true, status: true } } },
        },
        findings: {
          orderBy: { updatedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!profile) {
      throw new AppError('Auditor profile not found', 404);
    }

    return profile;
  }

  async updateAuditorProfile(
    organizationId: string,
    profileId: string,
    data: {
      name?: string;
      email?: string;
      firm?: string;
      certification?: string[];
      specializations?: string[];
      yearsExperience?: number;
      engagementType?: string;
      status?: string;
      rating?: number;
      completedAudits?: number;
      hourlyRate?: number;
      contractUrl?: string;
      ndaSigned?: boolean;
      ndaSignedDate?: Date;
      lastEngagement?: Date;
      notes?: string;
    }
  ) {
    // Verify the profile belongs to this org
    const existing = await prisma.auditorProfile.findFirst({
      where: { id: profileId, organizationId },
    });
    if (!existing) {
      throw new AppError('Auditor profile not found', 404);
    }

    const profile = await prisma.auditorProfile.update({
      where: { id: profileId },
      data,
    });

    logger.info(`Auditor profile updated: ${profileId}`);

    AuditLogger.log({
      userId: 'system',
      organizationId,
      action: 'auditor_profile.update',
      resourceType: 'AuditorProfile',
      resourceId: profileId,
      metadata: { updatedFields: Object.keys(data) },
    });

    return profile;
  }

  async deleteAuditorProfile(organizationId: string, profileId: string) {
    const existing = await prisma.auditorProfile.findFirst({
      where: { id: profileId, organizationId },
    });
    if (!existing) {
      throw new AppError('Auditor profile not found', 404);
    }

    await prisma.auditorProfile.delete({
      where: { id: profileId },
    });

    logger.info(`Auditor profile deleted: ${profileId}`);

    AuditLogger.log({
      userId: 'system',
      organizationId,
      action: 'auditor_profile.delete',
      resourceType: 'AuditorProfile',
      resourceId: profileId,
      metadata: { name: existing.name },
    });
  }

  // ==========================================================================
  // AUDIT ENGAGEMENT CRUD
  // ==========================================================================

  async listEngagements(
    organizationId: string,
    filters?: {
      status?: string;
      auditorId?: string;
      framework?: string;
      engagementType?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 25;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (filters?.status) where.status = filters.status;
    if (filters?.auditorId) where.auditorId = filters.auditorId;
    if (filters?.framework) where.framework = filters.framework;
    if (filters?.engagementType) where.engagementType = filters.engagementType;

    const [data, total] = await Promise.all([
      prisma.auditEngagement.findMany({
        where,
        include: {
          auditor: {
            select: { id: true, name: true, email: true, firm: true },
          },
          findings: {
            select: { id: true, severity: true, status: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditEngagement.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async createEngagement(organizationId: string, data: {
    auditorId: string;
    title: string;
    engagementType: string;
    framework: string;
    scope?: string;
    startDate: Date;
    endDate?: Date;
    status?: string;
    objectives?: any;
    deliverables?: any;
    timeline?: any;
    budget?: number;
    riskAssessment?: any;
    managementResponse?: string;
  }) {
    // Validate auditor belongs to this org
    const auditor = await prisma.auditorProfile.findFirst({
      where: { id: data.auditorId, organizationId },
    });
    if (!auditor) {
      throw new AppError('Auditor profile not found', 404);
    }

    const id = uuidv4();

    const engagement = await prisma.auditEngagement.create({
      data: {
        id,
        organizationId,
        auditorId: data.auditorId,
        title: data.title,
        engagementType: data.engagementType,
        framework: data.framework,
        scope: data.scope,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status || 'Planning',
        objectives: data.objectives,
        deliverables: data.deliverables,
        timeline: data.timeline,
        budget: data.budget,
        riskAssessment: data.riskAssessment,
        managementResponse: data.managementResponse,
      },
      include: {
        auditor: { select: { id: true, name: true, email: true, firm: true } },
      },
    });

    logger.info(`Audit engagement created: ${engagement.id} for org ${organizationId}`);

    AuditLogger.log({
      userId: 'system',
      organizationId,
      action: 'audit_engagement.create',
      resourceType: 'AuditEngagement',
      resourceId: engagement.id,
      metadata: { title: data.title, framework: data.framework, auditorId: data.auditorId },
    });

    return engagement;
  }

  async getEngagement(organizationId: string, engagementId: string) {
    const engagement = await prisma.auditEngagement.findFirst({
      where: { id: engagementId, organizationId },
      include: {
        auditor: true,
        findings: { orderBy: { updatedAt: 'desc' } },
        workpapers: { orderBy: { updatedAt: 'desc' } },
        requests: { orderBy: { updatedAt: 'desc' } },
      },
    });

    if (!engagement) {
      throw new AppError('Audit engagement not found', 404);
    }

    return engagement;
  }

  async updateEngagement(
    organizationId: string,
    engagementId: string,
    data: {
      title?: string;
      engagementType?: string;
      framework?: string;
      scope?: string;
      startDate?: Date;
      endDate?: Date;
      status?: string;
      objectives?: any;
      deliverables?: any;
      timeline?: any;
      budget?: number;
      actualCost?: number;
      riskAssessment?: any;
      managementResponse?: string;
      finalReportUrl?: string;
      overallOpinion?: string;
    }
  ) {
    const existing = await prisma.auditEngagement.findFirst({
      where: { id: engagementId, organizationId },
    });
    if (!existing) {
      throw new AppError('Audit engagement not found', 404);
    }

    const engagement = await prisma.$transaction(async (tx) => {
      const updated = await tx.auditEngagement.update({
        where: { id: engagementId },
        data,
        include: {
          auditor: { select: { id: true, name: true, email: true, firm: true } },
        },
      });

      // If status changed to Completed, increment auditor's completedAudits
      if (data.status === 'Completed' && existing.status !== 'Completed') {
        await tx.auditorProfile.update({
          where: { id: existing.auditorId },
          data: {
            completedAudits: { increment: 1 },
            lastEngagement: new Date(),
          },
        });
      }

      await AuditLogger.log({
        userId: 'system',
        organizationId,
        action: 'audit_engagement.update',
        resourceType: 'AuditEngagement',
        resourceId: engagementId,
        metadata: { updatedFields: Object.keys(data) },
      });

      return updated;
    });

    logger.info(`Audit engagement updated: ${engagementId}`);

    return engagement;
  }

  async deleteEngagement(organizationId: string, engagementId: string) {
    const existing = await prisma.auditEngagement.findFirst({
      where: { id: engagementId, organizationId },
    });
    if (!existing) {
      throw new AppError('Audit engagement not found', 404);
    }

    await prisma.auditEngagement.delete({
      where: { id: engagementId },
    });

    logger.info(`Audit engagement deleted: ${engagementId}`);

    AuditLogger.log({
      userId: 'system',
      organizationId,
      action: 'audit_engagement.delete',
      resourceType: 'AuditEngagement',
      resourceId: engagementId,
      metadata: { title: existing.title },
    });
  }

  // ==========================================================================
  // AUDIT FINDING CRUD
  // ==========================================================================

  async listFindings(
    organizationId: string,
    filters?: {
      engagementId?: string;
      auditorId?: string;
      status?: string;
      severity?: string;
      findingType?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 25;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (filters?.engagementId) where.engagementId = filters.engagementId;
    if (filters?.auditorId) where.auditorId = filters.auditorId;
    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.findingType) where.findingType = filters.findingType;

    const [data, total] = await Promise.all([
      prisma.auditFinding.findMany({
        where,
        include: {
          auditor: { select: { id: true, name: true, email: true } },
          engagement: { select: { id: true, title: true, framework: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditFinding.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async createFinding(organizationId: string, data: {
    engagementId: string;
    auditorId: string;
    title: string;
    description: string;
    findingType: string;
    severity?: string;
    controlRef?: string;
    evidence?: any;
    recommendation?: string;
    managementResponse?: string;
    responsibleParty?: string;
    targetRemediationDate?: Date;
    status?: string;
  }) {
    // Validate engagement belongs to this org
    const engagement = await prisma.auditEngagement.findFirst({
      where: { id: data.engagementId, organizationId },
    });
    if (!engagement) {
      throw new AppError('Audit engagement not found', 404);
    }

    const id = uuidv4();

    const finding = await prisma.auditFinding.create({
      data: {
        id,
        organizationId,
        engagementId: data.engagementId,
        auditorId: data.auditorId,
        title: data.title,
        description: data.description,
        findingType: data.findingType,
        severity: data.severity || 'Medium',
        controlRef: data.controlRef,
        evidence: data.evidence,
        recommendation: data.recommendation,
        managementResponse: data.managementResponse,
        responsibleParty: data.responsibleParty,
        targetRemediationDate: data.targetRemediationDate,
        status: data.status || 'Open',
      },
      include: {
        auditor: { select: { id: true, name: true, email: true } },
        engagement: { select: { id: true, title: true, framework: true } },
      },
    });

    logger.info(`Audit finding created: ${finding.id} for engagement ${data.engagementId}`);

    AuditLogger.log({
      userId: 'system',
      organizationId,
      action: 'audit_finding.create',
      resourceType: 'AuditFinding',
      resourceId: finding.id,
      metadata: { title: data.title, severity: data.severity || 'Medium', engagementId: data.engagementId },
    });

    return finding;
  }

  async getFinding(organizationId: string, findingId: string) {
    const finding = await prisma.auditFinding.findFirst({
      where: { id: findingId, organizationId },
      include: {
        auditor: true,
        engagement: {
          select: { id: true, title: true, framework: true, status: true },
        },
      },
    });

    if (!finding) {
      throw new AppError('Audit finding not found', 404);
    }

    return finding;
  }

  async updateFinding(
    organizationId: string,
    findingId: string,
    data: {
      title?: string;
      description?: string;
      findingType?: string;
      severity?: string;
      controlRef?: string;
      evidence?: any;
      recommendation?: string;
      managementResponse?: string;
      responsibleParty?: string;
      targetRemediationDate?: Date;
      actualRemediationDate?: Date;
      status?: string;
      retestResult?: string;
      retestDate?: Date;
    }
  ) {
    const existing = await prisma.auditFinding.findFirst({
      where: { id: findingId, organizationId },
    });
    if (!existing) {
      throw new AppError('Audit finding not found', 404);
    }

    const finding = await prisma.auditFinding.update({
      where: { id: findingId },
      data,
      include: {
        auditor: { select: { id: true, name: true, email: true } },
        engagement: { select: { id: true, title: true, framework: true } },
      },
    });

    logger.info(`Audit finding updated: ${findingId}`);

    AuditLogger.log({
      userId: 'system',
      organizationId,
      action: 'audit_finding.update',
      resourceType: 'AuditFinding',
      resourceId: findingId,
      metadata: { updatedFields: Object.keys(data) },
    });

    return finding;
  }

  async deleteFinding(organizationId: string, findingId: string) {
    const existing = await prisma.auditFinding.findFirst({
      where: { id: findingId, organizationId },
    });
    if (!existing) {
      throw new AppError('Audit finding not found', 404);
    }

    await prisma.auditFinding.delete({
      where: { id: findingId },
    });

    logger.info(`Audit finding deleted: ${findingId}`);

    AuditLogger.log({
      userId: 'system',
      organizationId,
      action: 'audit_finding.delete',
      resourceType: 'AuditFinding',
      resourceId: findingId,
      metadata: { title: existing.title },
    });
  }

  // ==========================================================================
  // AUDIT WORKPAPER CRUD
  // ==========================================================================

  async listWorkpapers(
    organizationId: string,
    filters?: {
      engagementId?: string;
      workpaperType?: string;
      status?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 25;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Workpapers don't have a direct organizationId; filter through engagement
    if (filters?.engagementId) {
      where.engagementId = filters.engagementId;
    } else {
      // Scope to org via engagement relation
      where.engagement = { organizationId };
    }

    if (filters?.workpaperType) where.workpaperType = filters.workpaperType;
    if (filters?.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      prisma.auditWorkpaper.findMany({
        where,
        include: {
          engagement: {
            select: { id: true, title: true, framework: true, organizationId: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditWorkpaper.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async createWorkpaper(organizationId: string, data: {
    engagementId: string;
    title: string;
    description?: string;
    workpaperType: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    uploadedBy: string;
    status?: string;
    comments?: any;
    crossReference?: string;
  }) {
    // Validate engagement belongs to this org
    const engagement = await prisma.auditEngagement.findFirst({
      where: { id: data.engagementId, organizationId },
    });
    if (!engagement) {
      throw new AppError('Audit engagement not found', 404);
    }

    const id = uuidv4();

    const workpaper = await prisma.auditWorkpaper.create({
      data: {
        id,
        engagementId: data.engagementId,
        title: data.title,
        description: data.description,
        workpaperType: data.workpaperType,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        uploadedBy: data.uploadedBy,
        status: data.status || 'Draft',
        comments: data.comments,
        crossReference: data.crossReference,
      },
      include: {
        engagement: {
          select: { id: true, title: true, framework: true, organizationId: true },
        },
      },
    });

    logger.info(`Workpaper created: ${workpaper.id} for engagement ${data.engagementId}`);

    AuditLogger.log({
      userId: data.uploadedBy,
      organizationId,
      action: 'audit_workpaper.create',
      resourceType: 'AuditWorkpaper',
      resourceId: workpaper.id,
      metadata: { title: data.title, workpaperType: data.workpaperType, engagementId: data.engagementId },
    });

    return workpaper;
  }

  async getWorkpaper(organizationId: string, workpaperId: string) {
    const workpaper = await prisma.auditWorkpaper.findFirst({
      where: {
        id: workpaperId,
        engagement: { organizationId },
      },
      include: {
        engagement: {
          select: { id: true, title: true, framework: true, organizationId: true },
        },
      },
    });

    if (!workpaper) {
      throw new AppError('Workpaper not found', 404);
    }

    return workpaper;
  }

  async updateWorkpaper(
    organizationId: string,
    workpaperId: string,
    data: {
      title?: string;
      description?: string;
      workpaperType?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      reviewedBy?: string;
      reviewDate?: Date;
      status?: string;
      comments?: any;
      crossReference?: string;
    }
  ) {
    const existing = await prisma.auditWorkpaper.findFirst({
      where: {
        id: workpaperId,
        engagement: { organizationId },
      },
    });
    if (!existing) {
      throw new AppError('Workpaper not found', 404);
    }

    const workpaper = await prisma.auditWorkpaper.update({
      where: { id: workpaperId },
      data,
      include: {
        engagement: {
          select: { id: true, title: true, framework: true, organizationId: true },
        },
      },
    });

    logger.info(`Workpaper updated: ${workpaperId}`);

    AuditLogger.log({
      userId: 'system',
      organizationId,
      action: 'audit_workpaper.update',
      resourceType: 'AuditWorkpaper',
      resourceId: workpaperId,
      metadata: { updatedFields: Object.keys(data) },
    });

    return workpaper;
  }

  async deleteWorkpaper(organizationId: string, workpaperId: string) {
    const existing = await prisma.auditWorkpaper.findFirst({
      where: {
        id: workpaperId,
        engagement: { organizationId },
      },
    });
    if (!existing) {
      throw new AppError('Workpaper not found', 404);
    }

    await prisma.auditWorkpaper.delete({
      where: { id: workpaperId },
    });

    logger.info(`Workpaper deleted: ${workpaperId}`);

    AuditLogger.log({
      userId: 'system',
      organizationId,
      action: 'audit_workpaper.delete',
      resourceType: 'AuditWorkpaper',
      resourceId: workpaperId,
      metadata: { title: existing.title },
    });
  }

  // ==========================================================================
  // AUDIT REQUEST CRUD
  // ==========================================================================

  async listRequests(
    organizationId: string,
    filters?: {
      engagementId?: string;
      status?: string;
      category?: string;
      priority?: string;
      assignedTo?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 25;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.engagementId) {
      where.engagementId = filters.engagementId;
    } else {
      // Scope to org via engagement relation
      where.engagement = { organizationId };
    }

    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;

    const [data, total] = await Promise.all([
      prisma.auditRequest.findMany({
        where,
        include: {
          engagement: {
            select: { id: true, title: true, framework: true, organizationId: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditRequest.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async createRequest(organizationId: string, data: {
    engagementId: string;
    requestedBy: string;
    assignedTo?: string;
    title: string;
    description: string;
    category: string;
    priority?: string;
    dueDate?: Date;
    status?: string;
    attachments?: any;
  }) {
    // Validate engagement belongs to this org
    const engagement = await prisma.auditEngagement.findFirst({
      where: { id: data.engagementId, organizationId },
    });
    if (!engagement) {
      throw new AppError('Audit engagement not found', 404);
    }

    const id = uuidv4();

    const request = await prisma.auditRequest.create({
      data: {
        id,
        engagementId: data.engagementId,
        requestedBy: data.requestedBy,
        assignedTo: data.assignedTo,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority || 'Medium',
        dueDate: data.dueDate,
        status: data.status || 'Open',
        attachments: data.attachments,
      },
      include: {
        engagement: {
          select: { id: true, title: true, framework: true, organizationId: true },
        },
      },
    });

    logger.info(`Audit request created: ${request.id} for org ${organizationId}`);

    AuditLogger.log({
      userId: data.requestedBy,
      organizationId,
      action: 'audit_request.create',
      resourceType: 'AuditRequest',
      resourceId: request.id,
      metadata: { title: data.title, category: data.category, engagementId: data.engagementId },
    });

    return request;
  }

  async getRequest(organizationId: string, requestId: string) {
    const request = await prisma.auditRequest.findFirst({
      where: {
        id: requestId,
        engagement: { organizationId },
      },
      include: {
        engagement: {
          select: { id: true, title: true, framework: true, organizationId: true },
        },
      },
    });

    if (!request) {
      throw new AppError('Audit request not found', 404);
    }

    return request;
  }

  async updateRequest(
    organizationId: string,
    requestId: string,
    data: {
      assignedTo?: string;
      title?: string;
      description?: string;
      category?: string;
      priority?: string;
      dueDate?: Date;
      status?: string;
      response?: string;
      attachments?: any;
    }
  ) {
    const existing = await prisma.auditRequest.findFirst({
      where: {
        id: requestId,
        engagement: { organizationId },
      },
    });
    if (!existing) {
      throw new AppError('Audit request not found', 404);
    }

    const request = await prisma.auditRequest.update({
      where: { id: requestId },
      data,
      include: {
        engagement: {
          select: { id: true, title: true, framework: true, organizationId: true },
        },
      },
    });

    logger.info(`Audit request updated: ${requestId}`);

    AuditLogger.log({
      userId: 'system',
      organizationId,
      action: 'audit_request.update',
      resourceType: 'AuditRequest',
      resourceId: requestId,
      metadata: { updatedFields: Object.keys(data) },
    });

    return request;
  }

  async deleteRequest(organizationId: string, requestId: string) {
    const existing = await prisma.auditRequest.findFirst({
      where: {
        id: requestId,
        engagement: { organizationId },
      },
    });
    if (!existing) {
      throw new AppError('Audit request not found', 404);
    }

    await prisma.auditRequest.delete({
      where: { id: requestId },
    });

    logger.info(`Audit request deleted: ${requestId}`);

    AuditLogger.log({
      userId: 'system',
      organizationId,
      action: 'audit_request.delete',
      resourceType: 'AuditRequest',
      resourceId: requestId,
      metadata: { title: existing.title },
    });
  }
}

export default new AuditorService();
