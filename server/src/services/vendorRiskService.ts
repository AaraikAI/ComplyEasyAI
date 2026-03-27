import { VendorRiskLevel, VendorStatus, Vendor, Prisma, MonitorStatus } from '../generated/prisma/client';
import prisma from '../config/database';
import { AuditLogger } from '../utils/auditLogger';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';


/**
 * Vendor & Third-Party Risk Management Service
 * Handles vendor inventory, risk assessments, continuous monitoring, and scorecards
 */
export class VendorRiskService {
  /**
   * Create new vendor
   */
  async createVendor(data: {
    name: string;
    organizationId: string;
    website?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    category?: string;
    serviceDescription?: string;
    contractStart?: Date;
    contractEnd?: Date;
    annualSpend?: number;
    hasDataAccess?: boolean;
    dataTypes?: Prisma.InputJsonValue;
    securityContact?: string;
    soc2Report?: boolean;
    iso27001Certified?: boolean;
    gdprCompliant?: boolean;
    hipaaBaa?: boolean;
    userId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.create({
        data: {
          name: data.name,
          organizationId: data.organizationId,
          website: data.website,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          category: data.category,
          serviceDescription: data.serviceDescription,
          contractStart: data.contractStart,
          contractEnd: data.contractEnd,
          annualSpend: data.annualSpend,
          hasDataAccess: data.hasDataAccess || false,
          dataTypes: data.dataTypes,
          securityContact: data.securityContact,
          soc2Report: data.soc2Report ?? false,
          iso27001Certified: data.iso27001Certified ?? false,
          gdprCompliant: data.gdprCompliant ?? false,
          hipaaBaa: data.hipaaBaa ?? false,
          status: 'Onboarding',
          riskLevel: 'Medium',
          riskScore: 0,
        },
      });

      // Create initial assessment within transaction
      await tx.vendorAssessment.create({
        data: {
          vendorId: vendor.id,
          assessmentType: 'Initial',
          status: 'In_Progress',
          assessedBy: data.userId,
        },
      });

      await AuditLogger.log({
        userId: data.userId,
        organizationId: data.organizationId,
        action: 'vendor.created',
        resourceType: 'Vendor',
        resourceId: vendor.id,
        metadata: { vendorName: data.name },
      });

      return vendor;
    });
  }

  /**
   * Create vendor assessment
   */
  async createVendorAssessment(data: {
    vendorId: string;
    assessmentType: string;
    organizationId: string;
    userId: string;
  }) {
    // Verify the vendor belongs to the calling organization
    const vendor = await prisma.vendor.findFirst({
      where: { id: data.vendorId, organizationId: data.organizationId },
    });
    if (!vendor) {
      throw new AppError('Vendor not found', 404);
    }

    const assessment = await prisma.vendorAssessment.create({
      data: {
        vendorId: data.vendorId,
        assessmentType: data.assessmentType,
        status: 'In_Progress',
        assessedBy: data.userId,
      },
      include: {
        vendor: true,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'vendor.assessment.created',
      resourceType: 'VendorAssessment',
      resourceId: assessment.id,
      metadata: { assessmentType: data.assessmentType },
    });

    return assessment;
  }

  /**
   * Complete vendor assessment
   */
  async completeVendorAssessment(
    assessmentId: string,
    data: {
      findings: Prisma.InputJsonValue;
      score: number;
      riskLevel: VendorRiskLevel;
      recommendations?: string;
    },
    userId: string,
    organizationId: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Verify the assessment's vendor belongs to the calling organization
      const existing = await tx.vendorAssessment.findFirst({
        where: { id: assessmentId },
        include: { vendor: { select: { organizationId: true } } },
      });
      if (!existing || existing.vendor.organizationId !== organizationId) {
        throw new AppError('Assessment not found', 404);
      }

      const assessment = await tx.vendorAssessment.update({
        where: { id: assessmentId },
        data: {
          status: 'Completed',
          assessedDate: new Date(),
          findings: data.findings,
          score: data.score,
          riskLevel: data.riskLevel,
          recommendations: data.recommendations,
        },
        include: {
          vendor: true,
        },
      });

      // Update vendor risk score
      await tx.vendor.update({
        where: { id: assessment.vendorId },
        data: {
          riskScore: data.score,
          riskLevel: data.riskLevel,
          status: 'Active',
        },
      });

      await AuditLogger.log({
        userId,
        organizationId,
        action: 'vendor.assessment.completed',
        resourceType: 'VendorAssessment',
        resourceId: assessmentId,
        metadata: {
          score: data.score,
          riskLevel: data.riskLevel,
        },
      });

      return assessment;
    });
  }

  /**
   * Create vendor security review
   */
  async createVendorReview(data: {
    vendorId: string;
    reviewType: string;
    reviewer: string;
    organizationId: string;
    nextReviewDate?: Date;
  }) {
    const review = await prisma.vendorReview.create({
      data: {
        vendorId: data.vendorId,
        reviewType: data.reviewType,
        reviewer: data.reviewer,
        reviewDate: new Date(),
        nextReviewDate: data.nextReviewDate,
      },
      include: {
        vendor: true,
      },
    });

    await AuditLogger.log({
      userId: data.reviewer,
      organizationId: data.organizationId,
      action: 'vendor.review.created',
      resourceType: 'VendorReview',
      resourceId: review.id,
      metadata: { reviewType: data.reviewType },
    });

    return review;
  }

  /**
   * Complete vendor review
   */
  async completeVendorReview(
    reviewId: string,
    data: {
      findings: Prisma.InputJsonValue;
      actionItems: Prisma.InputJsonValue;
      passed: boolean;
      nextReviewDate?: Date;
    },
    userId: string,
    organizationId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const review = await tx.vendorReview.update({
        where: { id: reviewId },
        data: {
          findings: data.findings,
          actionItems: data.actionItems,
          nextReviewDate: data.nextReviewDate,
        },
        include: {
          vendor: true,
        },
      });

      // Update vendor's last security review date
      await tx.vendor.update({
        where: { id: review.vendorId },
        data: {
          lastSecurityReview: new Date(),
          nextSecurityReview: data.nextReviewDate,
        },
      });

      await AuditLogger.log({
        userId,
        organizationId,
        action: 'vendor.review.completed',
        resourceType: 'VendorReview',
        resourceId: reviewId,
        metadata: {
          passed: data.passed,
        },
      });

      return review;
    });
  }

  /**
   * Create continuous monitoring for vendor
   */
  async createVendorMonitor(data: {
    vendorId: string;
    monitorType: string;
    configuration?: Prisma.InputJsonValue;
    organizationId: string;
    userId: string;
  }) {
    const monitor = await prisma.vendorMonitor.create({
      data: {
        vendorId: data.vendorId,
        monitorType: data.monitorType,
        findings: data.configuration || {},
        status: MonitorStatus.Unknown,
      },
      include: {
        vendor: true,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'vendor.monitor.created',
      resourceType: 'VendorMonitor',
      resourceId: monitor.id,
      metadata: { monitorType: data.monitorType },
    });

    return monitor;
  }

  /**
   * Update vendor monitor results
   */
  async updateVendorMonitorResults(
    monitorId: string,
    data: {
      status: MonitorStatus;
      lastCheckDate: Date;
      findings?: Prisma.InputJsonValue;
    },
    userId: string,
    organizationId: string
  ) {
    const monitor = await prisma.vendorMonitor.update({
      where: { id: monitorId },
      data: {
        status: data.status,
        lastCheck: data.lastCheckDate,
        findings: data.findings,
      },
      include: {
        vendor: true,
      },
    });

    // If status is Failing, log an audit event
    if (data.status === MonitorStatus.Failing) {
      await AuditLogger.log({
        userId,
        organizationId,
        action: 'vendor.monitor.critical_alert',
        resourceType: 'VendorMonitor',
        resourceId: monitorId,
        metadata: { status: data.status, findings: data.findings },
      });
    }

    return monitor;
  }

  /**
   * Get vendor scorecard
   */
  async getVendorScorecard(vendorId: string, organizationId: string) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, organizationId },
      include: {
        assessments: {
          orderBy: { assessedDate: 'desc' },
          take: 5,
        },
        reviews: {
          orderBy: { reviewDate: 'desc' },
          take: 5,
        },
        monitors: true,
      },
    });

    if (!vendor) {
      throw new AppError('Vendor not found', 404);
    }

    // Calculate scorecard metrics
    const scorecard = {
      vendorId: vendor.id,
      vendorName: vendor.name,
      riskLevel: vendor.riskLevel,
      riskScore: vendor.riskScore,
      status: vendor.status,
      complianceScore: this.calculateComplianceScore(vendor),
      securityScore: this.calculateSecurityScore(vendor),
      assessmentHistory: vendor.assessments.map((a) => ({
        date: a.assessedDate,
        type: a.assessmentType,
        score: a.score,
        riskLevel: a.riskLevel,
      })),
      recentReviews: vendor.reviews.map((r) => ({
        date: r.reviewDate,
        type: r.reviewType,
      })),
      activeMonitors: vendor.monitors.length,
      monitoringStatus:
        vendor.monitors.filter((m) => m.status === MonitorStatus.Passing).length ===
        vendor.monitors.length
          ? 'Healthy'
          : 'Issues_Detected',
      certifications: {
        soc2: vendor.soc2Report,
        iso27001: vendor.iso27001Certified,
        gdpr: vendor.gdprCompliant,
        hipaa: vendor.hipaaBaa,
      },
      contractDetails: {
        start: vendor.contractStart,
        end: vendor.contractEnd,
        annualSpend: vendor.annualSpend,
      },
      dataAccess: {
        hasAccess: vendor.hasDataAccess,
        dataTypes: vendor.dataTypes,
      },
    };

    return scorecard;
  }

  /**
   * Get vendor risk dashboard
   * Optimized with aggregation queries instead of fetching all vendors
   */
  async getVendorRiskDashboard(organizationId: string) {
    const where = { organizationId };
    // Parallel: counts + aggregation counts + top 10 vendors for list
    const [
      totalVendors,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      activeCount,
      onboardingCount,
      offboardingCount,
      suspendedCount,
      totalAssessments,
      pendingAssessments,
      totalReviews,
      activeMonitorsCount,
      alertsDetectedCount,
      soc2Count,
      iso27001Count,
      gdprCount,
      hipaaCount,
      topRiskVendors,
    ] = await Promise.all([
      prisma.vendor.count({ where }),
      prisma.vendor.count({ where: { ...where, riskLevel: 'Critical' } }),
      prisma.vendor.count({ where: { ...where, riskLevel: 'High' } }),
      prisma.vendor.count({ where: { ...where, riskLevel: 'Medium' } }),
      prisma.vendor.count({ where: { ...where, riskLevel: 'Low' } }),
      prisma.vendor.count({ where: { ...where, status: 'Active' } }),
      prisma.vendor.count({ where: { ...where, status: 'Onboarding' } }),
      prisma.vendor.count({ where: { ...where, status: 'Offboarding' } }),
      prisma.vendor.count({ where: { ...where, status: 'Suspended' } }),
      prisma.vendorAssessment.count({ where: { vendor: { organizationId } } }),
      prisma.vendorAssessment.count({
        where: { vendor: { organizationId }, status: 'In_Progress' },
      }),
      prisma.vendorReview.count({ where: { vendor: { organizationId } } }),
      prisma.vendorMonitor.count({
        where: { vendor: { organizationId }, status: MonitorStatus.Passing },
      }),
      prisma.vendorMonitor.count({
        where: {
          vendor: { organizationId },
          status: { in: [MonitorStatus.Failing, MonitorStatus.Warning] },
        },
      }),
      prisma.vendor.count({ where: { ...where, soc2Report: true } }),
      prisma.vendor.count({ where: { ...where, iso27001Certified: true } }),
      prisma.vendor.count({ where: { ...where, gdprCompliant: true } }),
      prisma.vendor.count({ where: { ...where, hipaaBaa: true } }),
      prisma.vendor.findMany({
        where,
        orderBy: { riskScore: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          riskScore: true,
          riskLevel: true,
          hasDataAccess: true,
        },
      }),
    ]);

    const dashboard = {
      totalVendors,
      riskDistribution: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
      },
      statusDistribution: {
        active: activeCount,
        onboarding: onboardingCount,
        offboarding: offboardingCount,
        suspended: suspendedCount,
      },
      assessmentMetrics: {
        totalAssessments,
        pendingAssessments,
      },
      reviewMetrics: {
        totalReviews,
      },
      monitoringMetrics: {
        activeMonitors: activeMonitorsCount,
        alertsDetected: alertsDetectedCount,
      },
      complianceCertifications: {
        soc2: soc2Count,
        iso27001: iso27001Count,
        gdpr: gdprCount,
        hipaa: hipaaCount,
      },
      topRiskVendors: topRiskVendors.map((v) => ({
        id: v.id,
        name: v.name,
        riskScore: v.riskScore,
        riskLevel: v.riskLevel,
        hasDataAccess: v.hasDataAccess,
      })),
    };

    return dashboard;
  }

  /**
   * Get single vendor by ID
   */
  async getVendorById(vendorId: string, organizationId: string) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, organizationId },
      include: {
        assessments: { orderBy: { createdAt: 'desc' } },
        reviews: { orderBy: { reviewDate: 'desc' } },
        monitors: true,
      },
    });
    if (!vendor) throw new AppError('Vendor not found', 404);
    return vendor;
  }

  /**
   * Update vendor
   */
  async updateVendor(
    vendorId: string,
    data: Partial<{
      name: string;
      website: string;
      contactName: string;
      contactEmail: string;
      contactPhone: string;
      category: string;
      serviceDescription: string;
      contractStart: Date;
      contractEnd: Date;
      annualSpend: number;
      hasDataAccess: boolean;
      dataTypes: Prisma.InputJsonValue;
      riskLevel: VendorRiskLevel;
      riskScore: number;
      status: VendorStatus;
      securityContact: string;
      soc2Report: boolean;
      iso27001Certified: boolean;
      gdprCompliant: boolean;
      hipaaBaa: boolean;
    }>,
    userId: string,
    organizationId: string
  ) {
    // Verify vendor belongs to org
    const existing = await prisma.vendor.findFirst({
      where: { id: vendorId, organizationId },
    });
    if (!existing) throw new AppError('Vendor not found', 404);

    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data,
    });

    try {
      await AuditLogger.log({
        userId,
        organizationId,
        action: 'vendor.updated',
        resourceType: 'Vendor',
        resourceId: vendorId,
        metadata: { vendorName: vendor.name, updatedFields: Object.keys(data) },
      });
    } catch (auditErr) {
      logger.error('Vendor audit log failed', { vendorId, error: auditErr });
    }

    return vendor;
  }

  /**
   * Archive (soft-delete) vendor by setting status to Inactive
   */
  async archiveVendor(vendorId: string, userId: string, organizationId: string) {
    const existing = await prisma.vendor.findFirst({
      where: { id: vendorId, organizationId },
    });
    if (!existing) throw new AppError('Vendor not found', 404);

    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'Inactive' },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'vendor.archived',
      resourceType: 'Vendor',
      resourceId: vendorId,
      metadata: { vendorName: vendor.name },
    });

    return vendor;
  }

  /**
   * Get vendors by organization (with pagination)
   */
  async getVendorsByOrganization(
    organizationId: string,
    filters?: {
      riskLevel?: VendorRiskLevel;
      status?: VendorStatus;
      hasDataAccess?: boolean;
    },
    queryParams?: any
  ) {
    // Use pagination utilities if query params provided
    if (queryParams) {
      const { paginatedQuery } = require('../utils/pagination');
      return await paginatedQuery(
        prisma.vendor.findMany.bind(prisma.vendor),
        prisma.vendor.count.bind(prisma.vendor),
        {
          where: {
            organizationId,
            ...(filters?.riskLevel && { riskLevel: filters.riskLevel }),
            ...(filters?.status && { status: filters.status }),
            ...(filters?.hasDataAccess !== undefined && {
              hasDataAccess: filters.hasDataAccess,
            }),
          },
          include: {
            assessments: {
              orderBy: { assessedDate: 'desc' },
              take: 1,
            },
            reviews: {
              orderBy: { reviewDate: 'desc' },
              take: 1,
            },
            monitors: true,
          },
          orderBy: { riskScore: 'desc' },
        },
        queryParams
      );
    }

    // Fallback for backward compatibility (limit to 100 for safety)
    return await prisma.vendor.findMany({
      where: {
        organizationId,
        ...(filters?.riskLevel && { riskLevel: filters.riskLevel }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.hasDataAccess !== undefined && {
          hasDataAccess: filters.hasDataAccess,
        }),
      },
      include: {
        assessments: {
          orderBy: { assessedDate: 'desc' },
          take: 1,
        },
        reviews: {
          orderBy: { reviewDate: 'desc' },
          take: 1,
        },
        monitors: true,
      },
      orderBy: { riskScore: 'desc' },
      take: 100, // Safety limit
    });
  }

  /**
   * Private helper: Calculate compliance score
   */
  private calculateComplianceScore(vendor: Vendor): number {
    let score = 0;
    const maxScore = 4;

    if (vendor.soc2Report) score += 1;
    if (vendor.iso27001Certified) score += 1;
    if (vendor.gdprCompliant) score += 1;
    if (vendor.hipaaBaa) score += 1;

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Private helper: Calculate security score
   */
  private calculateSecurityScore(vendor: Vendor & { monitors?: Array<{ status: MonitorStatus }> }): number {
    let score = 100;

    // Deduct points based on risk level
    if (vendor.riskLevel === 'Critical') score -= 40;
    else if (vendor.riskLevel === 'High') score -= 30;
    else if (vendor.riskLevel === 'Medium') score -= 15;

    // Deduct if no recent security review
    if (
      !vendor.lastSecurityReview ||
      new Date().getTime() - vendor.lastSecurityReview.getTime() >
        365 * 24 * 60 * 60 * 1000
    ) {
      score -= 20;
    }

    // Deduct if monitors show issues
    const monitors = vendor.monitors || [];
    const issueMonitors = monitors.filter(
      (m) => m.status === MonitorStatus.Failing || m.status === MonitorStatus.Warning
    );
    if (issueMonitors.length > 0) {
      score -= Math.min(issueMonitors.length * 10, 30);
    }

    return Math.max(score, 0);
  }
}

export default new VendorRiskService();
