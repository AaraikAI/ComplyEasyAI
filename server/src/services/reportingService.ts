import { PrismaClient } from '@prisma/client';
import { AuditLogger } from '../utils/auditLogger';

const prisma = new PrismaClient();

/**
 * Customizable Reporting Service
 * Generates audit-ready reports with scheduling and export capabilities
 */
export class ReportingService {
  /**
   * Create custom report
   */
  async createReport(data: {
    organizationId: string;
    reportName: string;
    reportType: string;
    parameters: any;
    schedule?: string;
    recipients?: any;
    userId: string;
  }) {
    const report = await prisma.customReport.create({
      data: {
        organizationId: data.organizationId,
        reportName: data.reportName,
        reportType: data.reportType,
        parameters: data.parameters,
        schedule: data.schedule,
        recipients: data.recipients || [],
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'report.created',
      resourceType: 'CustomReport',
      resourceId: report.id,
      metadata: { reportType: data.reportType },
    });

    return report;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    organizationId: string,
    frameworkId?: string
  ) {
    const frameworks = await prisma.framework.findMany({
      where: {
        organizationId,
        ...(frameworkId && { id: frameworkId }),
      },
      include: {
        controls: true,
      },
    });

    const report = {
      organizationId,
      reportType: 'Compliance Status',
      generatedAt: new Date(),
      frameworks: frameworks.map((f) => ({
        name: f.name,
        version: f.version,
        totalControls: f.controls.length,
        implementedControls: f.controls.filter(
          (c) => c.status === 'Implemented'
        ).length,
        inProgressControls: f.controls.filter(
          (c) => c.status === 'In_Progress'
        ).length,
        pendingControls: f.controls.filter((c) => c.status === 'Pending')
          .length,
        complianceRate:
          f.controls.length > 0
            ? Math.round(
                (f.controls.filter((c) => c.status === 'Implemented').length /
                  f.controls.length) *
                  100
              )
            : 0,
        controlsByCategory: this.groupByCategory(f.controls),
      })),
      summary: {
        totalFrameworks: frameworks.length,
        totalControls: frameworks.reduce(
          (sum, f) => sum + f.controls.length,
          0
        ),
        implementedControls: frameworks.reduce(
          (sum, f) =>
            sum + f.controls.filter((c) => c.status === 'Implemented').length,
          0
        ),
        overallComplianceRate:
          frameworks.reduce((sum, f) => sum + f.controls.length, 0) > 0
            ? Math.round(
                (frameworks.reduce(
                  (sum, f) =>
                    sum +
                    f.controls.filter((c) => c.status === 'Implemented').length,
                  0
                ) /
                  frameworks.reduce((sum, f) => sum + f.controls.length, 0)) *
                  100
              )
            : 0,
      },
    };

    return report;
  }

  /**
   * Generate risk report
   */
  async generateRiskReport(organizationId: string, timeRange?: any) {
    const where: any = { organizationId };

    if (timeRange) {
      where.detectedAt = {
        gte: timeRange.start,
        lte: timeRange.end,
      };
    }

    const risks = await prisma.riskItem.findMany({
      where,
      include: {
        assignedTo: true,
      },
    });

    const report = {
      organizationId,
      reportType: 'Risk Assessment',
      generatedAt: new Date(),
      timeRange,
      summary: {
        totalRisks: risks.length,
        criticalRisks: risks.filter((r) => r.severity === 'Critical').length,
        highRisks: risks.filter((r) => r.severity === 'High').length,
        mediumRisks: risks.filter((r) => r.severity === 'Medium').length,
        lowRisks: risks.filter((r) => r.severity === 'Low').length,
        openRisks: risks.filter((r) => r.status === 'Open').length,
        resolvedRisks: risks.filter((r) => r.status === 'Resolved').length,
      },
      risksByCategory: this.groupByCategory(risks),
      topRisks: risks
        .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
        .slice(0, 10)
        .map((r) => ({
          title: r.title,
          severity: r.severity,
          riskScore: r.riskScore,
          status: r.status,
          assignedTo: r.assignedTo?.name,
        })),
    };

    return report;
  }

  /**
   * Generate vendor risk report
   */
  async generateVendorRiskReport(organizationId: string) {
    const vendors = await prisma.vendor.findMany({
      where: { organizationId },
      include: {
        assessments: true,
        reviews: true,
      },
    });

    const report = {
      organizationId,
      reportType: 'Vendor Risk Assessment',
      generatedAt: new Date(),
      summary: {
        totalVendors: vendors.length,
        criticalRisk: vendors.filter((v) => v.riskLevel === 'Critical').length,
        highRisk: vendors.filter((v) => v.riskLevel === 'High').length,
        mediumRisk: vendors.filter((v) => v.riskLevel === 'Medium').length,
        lowRisk: vendors.filter((v) => v.riskLevel === 'Low').length,
        withDataAccess: vendors.filter((v) => v.hasDataAccess).length,
      },
      vendors: vendors.map((v) => ({
        name: v.name,
        riskLevel: v.riskLevel,
        riskScore: v.riskScore,
        status: v.status,
        hasDataAccess: v.hasDataAccess,
        assessmentsCount: v.assessments.length,
        lastReview: v.lastSecurityReview,
        certifications: {
          soc2: v.soc2Report,
          iso27001: v.iso27001Certified,
          gdpr: v.gdprCompliant,
          hipaa: v.hipaaBaa,
        },
      })),
    };

    return report;
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(
    organizationId: string,
    timeRange: { start: Date; end: Date }
  ) {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        organizationId,
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
      include: {
        user: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    const report = {
      organizationId,
      reportType: 'Audit Trail',
      generatedAt: new Date(),
      timeRange,
      summary: {
        totalEvents: auditLogs.length,
        uniqueUsers: new Set(auditLogs.map((log) => log.userId)).size,
        eventsByAction: this.groupByAction(auditLogs),
      },
      recentEvents: auditLogs.slice(0, 100).map((log) => ({
        timestamp: log.timestamp,
        user: log.user.name,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
      })),
    };

    return report;
  }

  /**
   * Generate executive summary report
   */
  async generateExecutiveSummary(organizationId: string) {
    // Get all data
    const [
      frameworks,
      risks,
      vendors,
      personnel,
      questionnaires,
      policies,
    ] = await Promise.all([
      prisma.framework.findMany({
        where: { organizationId },
        include: { controls: true },
      }),
      prisma.riskItem.findMany({ where: { organizationId } }),
      prisma.vendor.findMany({ where: { organizationId } }),
      prisma.personnel.findMany({ where: { organizationId } }),
      prisma.questionnaire.findMany({ where: { organizationId } }),
      prisma.policy.findMany({ where: { organizationId } }),
    ]);

    const report = {
      organizationId,
      reportType: 'Executive Summary',
      generatedAt: new Date(),
      compliance: {
        frameworks: frameworks.length,
        totalControls: frameworks.reduce(
          (sum, f) => sum + f.controls.length,
          0
        ),
        implementedControls: frameworks.reduce(
          (sum, f) =>
            sum + f.controls.filter((c) => c.status === 'Implemented').length,
          0
        ),
        overallComplianceRate:
          frameworks.reduce((sum, f) => sum + f.controls.length, 0) > 0
            ? Math.round(
                (frameworks.reduce(
                  (sum, f) =>
                    sum +
                    f.controls.filter((c) => c.status === 'Implemented').length,
                  0
                ) /
                  frameworks.reduce((sum, f) => sum + f.controls.length, 0)) *
                  100
              )
            : 0,
      },
      risks: {
        total: risks.length,
        critical: risks.filter((r) => r.severity === 'Critical').length,
        open: risks.filter((r) => r.status === 'Open').length,
      },
      vendors: {
        total: vendors.length,
        highRisk: vendors.filter((v) => v.riskLevel === 'High' || v.riskLevel === 'Critical').length,
        withDataAccess: vendors.filter((v) => v.hasDataAccess).length,
      },
      personnel: {
        total: personnel.length,
        active: personnel.filter(
          (p) => p.onboardingStatus === 'Completed'
        ).length,
        trainingCompliant: personnel.filter((p) => p.securityTraining).length,
      },
      questionnaires: {
        total: questionnaires.length,
        completed: questionnaires.filter((q) => q.status === 'Completed')
          .length,
        aiAssisted: questionnaires.filter((q) => q.aiAssisted).length,
      },
      policies: {
        total: policies.length,
        approved: policies.filter((p) => p.status === 'Approved').length,
      },
    };

    return report;
  }

  /**
   * Schedule report
   */
  async scheduleReport(
    reportId: string,
    schedule: string,
    userId: string,
    organizationId: string
  ) {
    const report = await prisma.customReport.update({
      where: { id: reportId },
      data: {
        schedule,
        lastRun: null,
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'report.scheduled',
      resourceType: 'CustomReport',
      resourceId: reportId,
      metadata: { schedule },
    });

    return report;
  }

  /**
   * Export report (placeholder for PDF/Excel generation)
   */
  async exportReport(reportData: any, format: 'json' | 'pdf' | 'xlsx') {
    // For now, return JSON
    // PDF/Excel generation would require additional libraries
    return {
      data: reportData,
      format,
      exportedAt: new Date(),
    };
  }

  /**
   * Private helpers
   */
  private groupByCategory(items: any[]) {
    const grouped: Record<string, number> = {};
    items.forEach((item) => {
      const category = item.category || 'Uncategorized';
      grouped[category] = (grouped[category] || 0) + 1;
    });
    return grouped;
  }

  private groupByAction(logs: any[]) {
    const grouped: Record<string, number> = {};
    logs.forEach((log) => {
      grouped[log.action] = (grouped[log.action] || 0) + 1;
    });
    return grouped;
  }
}

export default new ReportingService();
