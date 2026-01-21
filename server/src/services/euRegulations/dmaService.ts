/**
 * Digital Markets Act (DMA) Compliance Service
 * 
 * Implements Regulation (EU) 2022/1925 - Digital Markets Act
 * 
 * Key Requirements:
 * - Gatekeeper designation criteria
 * - Core Platform Services (CPS) obligations
 * - Fair competition requirements
 * - Data portability and interoperability
 * - Prohibition of unfair practices
 * - Compliance reporting to European Commission
 * 
 * Reference: https://digital-markets-act.ec.europa.eu/index_en
 */

import prisma from '../../config/database';
import logger from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';

export type CorePlatformService = 
  | 'online_search_engines'
  | 'online_intermediation_services'
  | 'online_social_networking_services'
  | 'video_sharing_platforms'
  | 'number_independent_interpersonal_communication_services'
  | 'operating_systems'
  | 'cloud_computing_services'
  | 'advertising_services'
  | 'web_browsers';

export type DMAObligation = 
  | 'data_portability'
  | 'interoperability'
  | 'fair_access'
  | 'prohibition_self_preferencing'
  | 'prohibition_bundling'
  | 'prohibition_tying'
  | 'transparency_ranking'
  | 'transparency_advertising'
  | 'prohibition_most_favored_nation'
  | 'prohibition_restrictive_contracts'
  | 'data_access_for_business_users'
  | 'transparency_measurement';

export interface Gatekeeper {
  id: string;
  organizationId: string;
  platformName: string;
  corePlatformServices: CorePlatformService[];
  designationDate?: Date;
  designationStatus: 'not_designated' | 'designated' | 'under_review';
  annualRevenue?: number;
  marketCapitalization?: number;
  monthlyActiveUsers?: number;
  obligations: DMAObligation[];
  complianceStatus: 'compliant' | 'non_compliant' | 'in_review';
  lastReviewDate?: Date;
  nextReviewDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DMAComplianceReport {
  id: string;
  gatekeeperId: string;
  organizationId: string;
  reportingPeriod: { start: Date; end: Date };
  obligationsStatus: Record<DMAObligation, {
    status: 'compliant' | 'non_compliant' | 'in_progress';
    evidence: string[];
    violations?: string[];
  }>;
  violations?: Array<{
    obligation: DMAObligation;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    detectedAt: Date;
  }>;
  remediation?: Array<{
    violationId: string;
    action: string;
    status: 'planned' | 'in_progress' | 'completed';
    targetDate?: Date;
  }>;
  submittedToCommission: boolean;
  submittedAt?: Date;
}

class DMAService {
  /**
   * Check if organization qualifies as gatekeeper
   */
  async checkGatekeeperStatus(
    organizationId: string,
    criteria: {
      annualRevenue?: number;
      marketCapitalization?: number;
      monthlyActiveUsers?: number;
      corePlatformServices: CorePlatformService[];
    }
  ): Promise<{ isGatekeeper: boolean; reasons: string[] }> {
    const reasons: string[] = [];
    let isGatekeeper = false;

    // Criteria 1: Significant impact on internal market
    const hasSignificantImpact = 
      (criteria.annualRevenue && criteria.annualRevenue >= 75000000000) || // €75B revenue
      (criteria.marketCapitalization && criteria.marketCapitalization >= 750000000000); // €750B market cap

    if (hasSignificantImpact) {
      reasons.push('Meets revenue/market cap threshold (€75B revenue or €750B market cap)');
    }

    // Criteria 2: Operates core platform service
    if (criteria.corePlatformServices.length > 0) {
      reasons.push(`Operates ${criteria.corePlatformServices.length} core platform service(s)`);
    }

    // Criteria 3: Strong and entrenched position
    const hasStrongPosition = 
      criteria.monthlyActiveUsers && criteria.monthlyActiveUsers >= 45000000; // 45M users in EU

    if (hasStrongPosition) {
      reasons.push('Meets user threshold (45M+ monthly active users in EU)');
    }

    // All three criteria must be met
    isGatekeeper = hasSignificantImpact && 
                   criteria.corePlatformServices.length > 0 && 
                   hasStrongPosition;

    if (isGatekeeper) {
      reasons.push('Organization qualifies as gatekeeper under DMA');
    }

    return { isGatekeeper, reasons };
  }

  /**
   * Register or update gatekeeper designation
   */
  async registerGatekeeper(
    organizationId: string,
    gatekeeperData: {
      platformName: string;
      corePlatformServices: CorePlatformService[];
      annualRevenue?: number;
      marketCapitalization?: number;
      monthlyActiveUsers?: number;
    }
  ): Promise<Gatekeeper> {
    const statusCheck = await this.checkGatekeeperStatus(organizationId, {
      annualRevenue: gatekeeperData.annualRevenue,
      marketCapitalization: gatekeeperData.marketCapitalization,
      monthlyActiveUsers: gatekeeperData.monthlyActiveUsers,
      corePlatformServices: gatekeeperData.corePlatformServices,
    });

    // Determine default obligations based on CPS types
    const obligations = this.getDefaultObligations(gatekeeperData.corePlatformServices);

    const gatekeeper = await prisma.dMAGatekeeper.create({
      data: {
        organizationId,
        platformName: gatekeeperData.platformName,
        corePlatformServices: gatekeeperData.corePlatformServices,
        annualRevenue: gatekeeperData.annualRevenue,
        marketCapitalization: gatekeeperData.marketCapitalization,
        monthlyActiveUsers: gatekeeperData.monthlyActiveUsers,
        designationStatus: statusCheck.isGatekeeper ? 'designated' : 'under_review',
        designationDate: statusCheck.isGatekeeper ? new Date() : undefined,
        obligations: obligations,
        complianceStatus: 'in_review',
      },
    });

    // Create initial obligation tracking records
    if (statusCheck.isGatekeeper) {
        await Promise.all(
        obligations.map(obligation =>
          prisma.dMAObligationTracking.create({
            data: {
              gatekeeperId: gatekeeper.id,
              organizationId,
              obligationType: obligation,
              obligationDescription: this.getObligationDescription(obligation),
              complianceStatus: 'pending',
            },
          })
        )
      );
    }

    logger.info(`Gatekeeper registered: ${gatekeeper.id}`, { 
      organizationId, 
      isGatekeeper: statusCheck.isGatekeeper 
    });

    return this.mapToGatekeeper(gatekeeper);
  }

  /**
   * Get default obligations for core platform services
   */
  private getDefaultObligations(cps: CorePlatformService[]): DMAObligation[] {
    const obligations: DMAObligation[] = [];

    // Common obligations for all gatekeepers
    obligations.push('data_portability');
    obligations.push('interoperability');
    obligations.push('fair_access');
    obligations.push('transparency_ranking');
    obligations.push('transparency_advertising');

    // Specific obligations based on CPS type
    if (cps.includes('online_intermediation_services') || 
        cps.includes('online_social_networking_services')) {
      obligations.push('data_access_for_business_users');
      obligations.push('prohibition_self_preferencing');
    }

    if (cps.includes('online_search_engines')) {
      obligations.push('prohibition_self_preferencing');
      obligations.push('transparency_measurement');
    }

    if (cps.includes('advertising_services')) {
      obligations.push('transparency_advertising');
      obligations.push('prohibition_most_favored_nation');
    }

    // Prohibited practices apply to all
    obligations.push('prohibition_bundling');
    obligations.push('prohibition_tying');
    obligations.push('prohibition_restrictive_contracts');

    return [...new Set(obligations)]; // Remove duplicates
  }

  /**
   * Get obligation description
   *
   * Note: This is intentionally public so that seed/migration scripts can
   * reuse the same canonical descriptions when creating DMAObligationTracking
   * rows for existing gatekeepers.
   */
  getObligationDescription(obligation: DMAObligation): string {
    const descriptions: Record<DMAObligation, string> = {
      data_portability: 'Enable end users and business users to easily port their data to other services',
      interoperability: 'Ensure interoperability with complementary services and hardware',
      fair_access: 'Provide fair, reasonable, and non-discriminatory access to platform services',
      prohibition_self_preferencing: 'Prohibit self-preferencing of own services over third-party services',
      prohibition_bundling: 'Prohibit bundling of services without user consent',
      prohibition_tying: 'Prohibit tying of services that are not necessary for the functioning of the platform',
      transparency_ranking: 'Provide transparency on ranking parameters and criteria',
      transparency_advertising: 'Provide transparency on advertising services and pricing',
      prohibition_most_favored_nation: 'Prohibit most-favored-nation clauses in contracts',
      prohibition_restrictive_contracts: 'Prohibit restrictive contractual terms',
      data_access_for_business_users: 'Provide business users with access to data generated through their use of the platform',
      transparency_measurement: 'Provide transparency on measurement tools and methodologies',
    };

    return descriptions[obligation] || 'DMA obligation';
  }

  /**
   * Update obligation compliance status
   */
  async updateObligationCompliance(
    organizationId: string,
    gatekeeperId: string,
    obligationType: DMAObligation,
    complianceData: {
      status: 'pending' | 'compliant' | 'non_compliant' | 'in_progress';
      evidence?: any;
      lastVerified?: Date;
      nextReviewDate?: Date;
    }
  ): Promise<void> {
    const gatekeeper = await prisma.dMAGatekeeper.findFirst({
      where: { id: gatekeeperId, organizationId },
    });

    if (!gatekeeper) {
      throw new AppError('Gatekeeper not found', 404);
    }

    // Check if tracking record exists
    const existingTracking = await prisma.dMAObligationTracking.findFirst({
      where: {
        gatekeeperId,
        obligationType: obligationType as string,
      },
    });

    const obligationDescription = this.getObligationDescription(obligationType);

    if (existingTracking) {
      // Update existing record
      await prisma.dMAObligationTracking.update({
        where: { id: existingTracking.id },
        data: {
          complianceStatus: complianceData.status,
          evidence: complianceData.evidence,
          lastVerified: complianceData.lastVerified,
          nextReviewDate: complianceData.nextReviewDate,
        },
      });
    } else {
      // Create new tracking record
      await prisma.dMAObligationTracking.create({
        data: {
          gatekeeperId,
          organizationId,
          obligationType: obligationType as string,
          obligationDescription,
          complianceStatus: complianceData.status,
          evidence: complianceData.evidence,
          lastVerified: complianceData.lastVerified,
          nextReviewDate: complianceData.nextReviewDate,
        },
      });
    }

    logger.info(`Obligation compliance updated: ${obligationType}`, { 
      organizationId, 
      gatekeeperId 
    });
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    organizationId: string,
    gatekeeperId: string,
    reportingPeriod: { start: Date; end: Date }
  ): Promise<DMAComplianceReport> {
    const gatekeeper = await prisma.dMAGatekeeper.findFirst({
      where: { id: gatekeeperId, organizationId },
      include: {
        obligationsTracking: true,
      },
    });

    if (!gatekeeper) {
      throw new AppError('Gatekeeper not found', 404);
    }

    // Build obligations status from ALL obligations (not just those with tracking records)
    const obligationsStatus: Record<string, any> = {};
    const obligations: string[] = Array.isArray(gatekeeper.obligations)
      ? (gatekeeper.obligations as string[])
      : [];

    for (const obligationType of obligations) {
      const tracking = gatekeeper.obligationsTracking.find(t => t.obligationType === obligationType);
      obligationsStatus[obligationType] = {
        status: tracking?.complianceStatus || 'pending',
        evidence: tracking?.evidence || [],
        violations: [],
      };
    }

    const report = await prisma.dMAComplianceReport.create({
      data: {
        gatekeeperId,
        organizationId,
        reportingPeriod: reportingPeriod,
        obligationsStatus,
        violations: [],
        remediation: [],
        submittedToCommission: false,
      },
    });

    return this.mapToComplianceReport(report);
  }

  /**
   * Get gatekeeper by ID
   */
  async getGatekeeper(organizationId: string, gatekeeperId: string): Promise<Gatekeeper> {
    const gatekeeper = await prisma.dMAGatekeeper.findFirst({
      where: { id: gatekeeperId, organizationId },
    });

    if (!gatekeeper) {
      throw new AppError('Gatekeeper not found', 404);
    }

    return this.mapToGatekeeper(gatekeeper);
  }

  /**
   * Get all gatekeepers for organization
   */
  async getGatekeepers(organizationId: string): Promise<Gatekeeper[]> {
    const gatekeepers = await prisma.dMAGatekeeper.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return gatekeepers.map(g => this.mapToGatekeeper(g));
  }

  /**
   * Update gatekeeper
   */
  async updateGatekeeper(
    organizationId: string,
    gatekeeperId: string,
    updates: Partial<{
      platformName: string;
      designationStatus: 'not_designated' | 'designated' | 'under_review';
      complianceStatus: 'compliant' | 'non_compliant' | 'in_review';
    }>
  ): Promise<Gatekeeper> {
    const gatekeeper = await prisma.dMAGatekeeper.findFirst({
      where: { id: gatekeeperId, organizationId },
    });

    if (!gatekeeper) {
      throw new AppError('Gatekeeper not found', 404);
    }

    const updated = await prisma.dMAGatekeeper.update({
      where: { id: gatekeeperId },
      data: updates,
    });

    return this.mapToGatekeeper(updated);
  }

  /**
   * Get obligations for a gatekeeper
   */
  async getObligations(organizationId: string, gatekeeperId: string): Promise<any[]> {
    const gatekeeper = await prisma.dMAGatekeeper.findFirst({
      where: { id: gatekeeperId, organizationId },
      include: {
        obligationsTracking: true,
      },
    });

    if (!gatekeeper) {
      throw new AppError('Gatekeeper not found', 404);
    }

    // Return obligations with their tracking status
    return gatekeeper.obligations.map(obligation => {
      const tracking = gatekeeper.obligationsTracking.find(t => t.obligationType === obligation);
      return {
        obligationType: obligation,
        description: this.getObligationDescription(obligation),
        complianceStatus: tracking?.complianceStatus || 'pending',
        evidence: tracking?.evidence || [],
        lastVerified: tracking?.lastVerified,
        nextReviewDate: tracking?.nextReviewDate,
      };
    });
  }

  /**
   * Get compliance reports for a gatekeeper
   */
  async getComplianceReports(organizationId: string, gatekeeperId: string): Promise<DMAComplianceReport[]> {
    const reports = await prisma.dMAComplianceReport.findMany({
      where: { gatekeeperId, organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return reports.map(r => this.mapToComplianceReport(r));
  }

  /**
   * Get latest compliance report for a gatekeeper
   */
  async getLatestComplianceReport(organizationId: string, gatekeeperId: string): Promise<DMAComplianceReport | null> {
    const report = await prisma.dMAComplianceReport.findFirst({
      where: { gatekeeperId, organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return report ? this.mapToComplianceReport(report) : null;
  }

  /**
   * Delete gatekeeper
   */
  async deleteGatekeeper(organizationId: string, gatekeeperId: string): Promise<void> {
    const gatekeeper = await prisma.dMAGatekeeper.findFirst({
      where: { id: gatekeeperId, organizationId },
    });

    if (!gatekeeper) {
      throw new AppError('Gatekeeper not found', 404);
    }

    await prisma.dMAGatekeeper.delete({
      where: { id: gatekeeperId },
    });

    logger.info(`Gatekeeper deleted: ${gatekeeperId}`, { organizationId });
  }

  // Helper methods
  private mapToGatekeeper(gatekeeper: any): Gatekeeper {
    return {
      id: gatekeeper.id,
      organizationId: gatekeeper.organizationId,
      platformName: gatekeeper.platformName,
      corePlatformServices: gatekeeper.corePlatformServices as CorePlatformService[],
      designationDate: gatekeeper.designationDate,
      designationStatus: gatekeeper.designationStatus,
      annualRevenue: gatekeeper.annualRevenue ? Number(gatekeeper.annualRevenue) : undefined,
      marketCapitalization: gatekeeper.marketCapitalization ? Number(gatekeeper.marketCapitalization) : undefined,
      monthlyActiveUsers: gatekeeper.monthlyActiveUsers,
      obligations: gatekeeper.obligations as DMAObligation[],
      complianceStatus: gatekeeper.complianceStatus,
      lastReviewDate: gatekeeper.lastReviewDate,
      nextReviewDate: gatekeeper.nextReviewDate,
      createdAt: gatekeeper.createdAt,
      updatedAt: gatekeeper.updatedAt,
    };
  }

  private mapToComplianceReport(report: any): DMAComplianceReport {
    return {
      id: report.id,
      gatekeeperId: report.gatekeeperId,
      organizationId: report.organizationId,
      reportingPeriod: report.reportingPeriod,
      obligationsStatus: report.obligationsStatus,
      violations: report.violations || [],
      remediation: report.remediation || [],
      submittedToCommission: report.submittedToCommission || false,
      submittedAt: report.submittedAt,
    };
  }
}

export default new DMAService();

