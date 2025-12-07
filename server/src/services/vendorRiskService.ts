import { PrismaClient, VendorRiskLevel, VendorStatus } from '@prisma/client';
import { AuditLogger } from '../utils/auditLogger';

const prisma = new PrismaClient();

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
    dataTypes?: any;
    userId: string;
  }) {
    const vendor = await prisma.vendor.create({
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
        dataTypes: data.dataTypes || {},
        status: 'Onboarding',
        riskLevel: 'Medium',
        riskScore: 0,
      },
    });

    // Create initial assessment
    await this.createVendorAssessment({
      vendorId: vendor.id,
      assessmentType: 'Initial_Onboarding',
      organizationId: data.organizationId,
      userId: data.userId,
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
  }

  /**
   * Create vendor assessment
   */
  async createVendorAssessment(data: {
    vendorId: string;
    assessmentType: string;
    organizationId: string;
    userId: string;
    dueDate?: Date;
  }) {
    const assessment = await prisma.vendorAssessment.create({
      data: {
        vendorId: data.vendorId,
        assessmentType: data.assessmentType,
        status: 'In_Progress',
        dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        questions: this.getAssessmentQuestions(data.assessmentType),
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
      responses: any;
      findings: any;
      riskScore: number;
      riskLevel: VendorRiskLevel;
    },
    userId: string,
    organizationId: string
  ) {
    const assessment = await prisma.vendorAssessment.update({
      where: { id: assessmentId },
      data: {
        status: 'Completed',
        completedAt: new Date(),
        responses: data.responses,
        findings: data.findings,
        riskScore: data.riskScore,
        riskLevel: data.riskLevel,
      },
      include: {
        vendor: true,
      },
    });

    // Update vendor risk score
    await prisma.vendor.update({
      where: { id: assessment.vendorId },
      data: {
        riskScore: data.riskScore,
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
        riskScore: data.riskScore,
        riskLevel: data.riskLevel,
      },
    });

    return assessment;
  }

  /**
   * Create vendor security review
   */
  async createVendorReview(data: {
    vendorId: string;
    reviewType: string;
    reviewerId: string;
    organizationId: string;
    scope?: any;
    dueDate?: Date;
  }) {
    const review = await prisma.vendorReview.create({
      data: {
        vendorId: data.vendorId,
        reviewType: data.reviewType,
        reviewerId: data.reviewerId,
        status: 'Scheduled',
        scheduledDate: new Date(),
        scope: data.scope || {},
        dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: {
        vendor: true,
      },
    });

    await AuditLogger.log({
      userId: data.reviewerId,
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
      findings: any;
      recommendations: any;
      passed: boolean;
      nextReviewDate?: Date;
    },
    userId: string,
    organizationId: string
  ) {
    const review = await prisma.vendorReview.update({
      where: { id: reviewId },
      data: {
        status: 'Completed',
        completedDate: new Date(),
        findings: data.findings,
        recommendations: data.recommendations,
        nextReviewDate: data.nextReviewDate,
      },
      include: {
        vendor: true,
      },
    });

    // Update vendor's last security review date
    await prisma.vendor.update({
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
        findingsCount: data.findings?.length || 0,
      },
    });

    return review;
  }

  /**
   * Create continuous monitoring for vendor
   */
  async createVendorMonitor(data: {
    vendorId: string;
    monitorType: string;
    configuration: any;
    organizationId: string;
    userId: string;
  }) {
    const monitor = await prisma.vendorMonitor.create({
      data: {
        vendorId: data.vendorId,
        monitorType: data.monitorType,
        configuration: data.configuration,
        frequency: 'Daily',
        active: true,
        status: 'Active',
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
      status: string;
      lastCheckDate: Date;
      findings?: any;
      alerts?: any;
    },
    userId: string,
    organizationId: string
  ) {
    const monitor = await prisma.vendorMonitor.update({
      where: { id: monitorId },
      data: {
        status: data.status,
        lastCheckDate: data.lastCheckDate,
        findings: data.findings,
        alerts: data.alerts,
      },
      include: {
        vendor: true,
      },
    });

    // If critical findings, create an issue
    if (data.alerts && data.alerts.critical > 0) {
      await AuditLogger.log({
        userId,
        organizationId,
        action: 'vendor.monitor.critical_alert',
        resourceType: 'VendorMonitor',
        resourceId: monitorId,
        metadata: { alerts: data.alerts },
      });
    }

    return monitor;
  }

  /**
   * Get vendor scorecard
   */
  async getVendorScorecard(vendorId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        assessments: {
          orderBy: { completedAt: 'desc' },
          take: 5,
        },
        reviews: {
          orderBy: { completedDate: 'desc' },
          take: 5,
        },
        monitors: {
          where: { active: true },
        },
      },
    });

    if (!vendor) {
      throw new Error('Vendor not found');
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
        date: a.completedAt,
        type: a.assessmentType,
        riskScore: a.riskScore,
        riskLevel: a.riskLevel,
      })),
      recentReviews: vendor.reviews.map((r) => ({
        date: r.completedDate,
        type: r.reviewType,
        status: r.status,
      })),
      activeMonitors: vendor.monitors.length,
      monitoringStatus:
        vendor.monitors.filter((m) => m.status === 'Active').length ===
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
   */
  async getVendorRiskDashboard(organizationId: string) {
    const vendors = await prisma.vendor.findMany({
      where: { organizationId },
      include: {
        assessments: true,
        reviews: true,
        monitors: true,
      },
    });

    const dashboard = {
      totalVendors: vendors.length,
      riskDistribution: {
        critical: vendors.filter((v) => v.riskLevel === 'Critical').length,
        high: vendors.filter((v) => v.riskLevel === 'High').length,
        medium: vendors.filter((v) => v.riskLevel === 'Medium').length,
        low: vendors.filter((v) => v.riskLevel === 'Low').length,
      },
      statusDistribution: {
        active: vendors.filter((v) => v.status === 'Active').length,
        onboarding: vendors.filter((v) => v.status === 'Onboarding').length,
        offboarding: vendors.filter((v) => v.status === 'Offboarding').length,
        suspended: vendors.filter((v) => v.status === 'Suspended').length,
      },
      assessmentMetrics: {
        totalAssessments: vendors.reduce(
          (sum, v) => sum + v.assessments.length,
          0
        ),
        pendingAssessments: vendors.reduce(
          (sum, v) =>
            sum +
            v.assessments.filter((a) => a.status === 'In_Progress').length,
          0
        ),
      },
      reviewMetrics: {
        totalReviews: vendors.reduce((sum, v) => sum + v.reviews.length, 0),
        pendingReviews: vendors.reduce(
          (sum, v) =>
            sum + v.reviews.filter((r) => r.status === 'Scheduled').length,
          0
        ),
        overdueReviews: vendors.reduce(
          (sum, v) =>
            sum +
            v.reviews.filter(
              (r) =>
                r.status === 'Scheduled' &&
                r.dueDate &&
                r.dueDate < new Date()
            ).length,
          0
        ),
      },
      monitoringMetrics: {
        activeMonitors: vendors.reduce(
          (sum, v) => sum + v.monitors.filter((m) => m.active).length,
          0
        ),
        alertsDetected: vendors.reduce(
          (sum, v) =>
            sum + v.monitors.filter((m) => m.alerts && m.alerts.count > 0).length,
          0
        ),
      },
      complianceCertifications: {
        soc2: vendors.filter((v) => v.soc2Report).length,
        iso27001: vendors.filter((v) => v.iso27001Certified).length,
        gdpr: vendors.filter((v) => v.gdprCompliant).length,
        hipaa: vendors.filter((v) => v.hipaaBaa).length,
      },
      topRiskVendors: vendors
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10)
        .map((v) => ({
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
   * Get vendors by organization
   */
  async getVendorsByOrganization(
    organizationId: string,
    filters?: {
      riskLevel?: VendorRiskLevel;
      status?: VendorStatus;
      hasDataAccess?: boolean;
    }
  ) {
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
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
        reviews: {
          orderBy: { completedDate: 'desc' },
          take: 1,
        },
        monitors: {
          where: { active: true },
        },
      },
      orderBy: { riskScore: 'desc' },
    });
  }

  /**
   * Private helper: Get assessment questions
   */
  private getAssessmentQuestions(assessmentType: string) {
    const questions = {
      Initial_Onboarding: [
        'Does the vendor have SOC 2 Type II certification?',
        'Does the vendor have ISO 27001 certification?',
        'What is the vendor\'s data breach history?',
        'Does the vendor have a documented SDLC?',
        'What encryption methods are used for data at rest and in transit?',
        'Does the vendor perform regular penetration testing?',
        'What is the vendor\'s incident response process?',
        'Does the vendor have cyber insurance?',
      ],
      Annual_Review: [
        'Have there been any security incidents in the past year?',
        'Are all certifications still current?',
        'Has the vendor\'s risk profile changed?',
        'Are SLAs being met?',
        'Have there been any changes to data processing?',
      ],
      Security_Assessment: [
        'What authentication methods are supported?',
        'Is MFA enforced for all users?',
        'What is the password policy?',
        'How often are security patches applied?',
        'What logging and monitoring capabilities exist?',
      ],
    };

    return questions[assessmentType as keyof typeof questions] || [];
  }

  /**
   * Private helper: Calculate compliance score
   */
  private calculateComplianceScore(vendor: any): number {
    let score = 0;
    let maxScore = 4;

    if (vendor.soc2Report) score += 1;
    if (vendor.iso27001Certified) score += 1;
    if (vendor.gdprCompliant) score += 1;
    if (vendor.hipaaBaa) score += 1;

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Private helper: Calculate security score
   */
  private calculateSecurityScore(vendor: any): number {
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

    // Deduct if active monitors show issues
    const activeMonitors = vendor.monitors?.filter((m: any) => m.active) || [];
    const issueMonitors =
      activeMonitors.filter((m: any) => m.status !== 'Active') || [];
    if (issueMonitors.length > 0) {
      score -= Math.min(issueMonitors.length * 10, 30);
    }

    return Math.max(score, 0);
  }
}

export default new VendorRiskService();
