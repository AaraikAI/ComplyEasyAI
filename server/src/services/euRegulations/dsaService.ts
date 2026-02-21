/**
 * Digital Services Act (DSA) Compliance Service
 * 
 * Implements Regulation (EU) 2022/2065 - Digital Services Act
 * 
 * Key Requirements:
 * - Content moderation transparency
 * - Illegal content reporting mechanisms
 * - User rights and appeals
 * - Ad transparency and repositories
 * - Protection of minors
 * - Dark patterns prohibition
 * - Very Large Online Platform (VLOP) obligations
 * - Transparency reporting
 * 
 * Reference: https://digital-strategy.ec.europa.eu/en/policies/digital-services-act
 */

import prisma from '../../config/database';
import logger from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';

export type DSAPlatformType = 
  | 'online_platform'
  | 'very_large_online_platform' // VLOP: >45M users
  | 'very_large_search_engine' // VLOSE: >45M users
  | 'intermediary_service';

export type ContentModerationAction = 
  | 'removal'
  | 'suspension'
  | 'restriction'
  | 'appeal'
  | 'restoration';

export interface DSAPlatform {
  id: string;
  organizationId: string;
  platformName: string;
  platformType: DSAPlatformType;
  monthlyActiveUsers?: number;
  isVLOP: boolean; // Very Large Online Platform
  isVLOSE: boolean; // Very Large Online Search Engine
  designationDate?: Date;
  complianceStatus: 'compliant' | 'non_compliant' | 'in_review';
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentModerationRecord {
  id: string;
  platformId: string;
  organizationId: string;
  actionType: ContentModerationAction;
  contentType: string;
  reason: string;
  automatedDecision: boolean;
  appealAvailable: boolean;
  appealStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface IllegalContentReport {
  id: string;
  platformId: string;
  organizationId: string;
  reportedBy: string;
  isTrustedFlagger: boolean;
  contentType: string;
  contentUrl?: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  actionTaken?: string;
  responseTime?: number; // Hours
  createdAt: Date;
  updatedAt: Date;
}

export interface DSATransparencyReport {
  id: string;
  platformId: string;
  organizationId: string;
  reportingPeriod: { start: Date; end: Date };
  contentModerationStats: {
    totalRemovals: number;
    totalSuspensions: number;
    totalRestrictions: number;
    automatedRemovals: number;
    manualRemovals: number;
    appealsReceived: number;
    appealsApproved: number;
    appealsRejected: number;
  };
  userReports: {
    totalReports: number;
    reportsFromTrustedFlaggers: number;
    reportsActioned: number;
    averageResponseTime: number; // Hours
  };
  trustedFlaggerReports?: {
    totalReports: number;
    actionedReports: number;
    averageResponseTime: number;
  };
  automatedDetection?: {
    contentScanned: number;
    contentFlagged: number;
    falsePositiveRate: number;
  };
  appealsProcessed?: {
    totalAppeals: number;
    approved: number;
    rejected: number;
    averageProcessingTime: number; // Hours
  };
  submittedToCommission: boolean;
  submittedAt?: Date;
  createdAt?: Date;
}

export interface AdRepositoryEntry {
  id: string;
  platformId: string;
  organizationId: string;
  adId: string;
  advertiserName: string;
  adContent: {
    text?: string;
    images?: string[];
    video?: string;
    targetAudience?: string[];
  };
  targetingCriteria?: {
    demographics?: string[];
    interests?: string[];
    location?: string[];
    customAudiences?: string[];
  };
  displayPeriod: { start: Date; end: Date };
  impressions?: number;
  clicks?: number;
  isPoliticalAd: boolean;
  isTargetedToMinors: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class DSAService {
  /**
   * Check if platform qualifies as VLOP or VLOSE
   */
  async checkVLOPStatus(
    monthlyActiveUsers?: number
  ): Promise<{ isVLOP: boolean; isVLOSE: boolean; reason: string }> {
    const threshold = 45000000; // 45 million users in EU

    if (!monthlyActiveUsers || monthlyActiveUsers < threshold) {
      return {
        isVLOP: false,
        isVLOSE: false,
        reason: `Platform has ${monthlyActiveUsers || 0} monthly active users, below the 45M threshold for VLOP/VLOSE designation`,
      };
    }

    return {
      isVLOP: true,
      isVLOSE: true,
      reason: `Platform has ${monthlyActiveUsers} monthly active users, exceeding the 45M threshold for VLOP/VLOSE designation`,
    };
  }

  /**
   * Register or update DSA platform
   */
  async registerPlatform(
    organizationId: string,
    platformData: {
      platformName: string;
      platformType: DSAPlatformType;
      monthlyActiveUsers?: number;
    }
  ): Promise<DSAPlatform> {
    const vlopStatus = await this.checkVLOPStatus(platformData.monthlyActiveUsers);

    // Determine if platform is VLOP/VLOSE
    // If platform type explicitly indicates VLOP/VLOSE, set flag accordingly
    // Otherwise, check user count threshold
    let isVLOP = false;
    let isVLOSE = false;

    if (platformData.platformType === 'very_large_online_platform') {
      // Platform type explicitly indicates VLOP
      isVLOP = true;
    } else if (platformData.platformType === 'very_large_search_engine') {
      // Platform type explicitly indicates VLOSE
      isVLOSE = true;
    } else {
      // For other platform types, check user count threshold
      if (vlopStatus.isVLOP && 
          (platformData.platformType === 'online_platform')) {
        isVLOP = true;
      }
      if (vlopStatus.isVLOSE && 
          platformData.platformType === 'online_platform') {
        // Note: VLOSE typically applies to search engines, but we check user count
        // This would need to be refined based on business logic
      }
    }

    const platform = await prisma.dSAPlatform.create({
      data: {
        organizationId,
        platformName: platformData.platformName,
        platformType: isVLOP ? 'very_large_online_platform' : 
                     isVLOSE ? 'very_large_search_engine' : 
                     platformData.platformType,
        monthlyActiveUsers: platformData.monthlyActiveUsers,
        isVLOP,
        isVLOSE,
        designationDate: (isVLOP || isVLOSE) ? new Date() : undefined,
        complianceStatus: 'in_review',
      },
    });

    logger.info(`DSA platform registered: ${platform.id}`, { 
      organizationId, 
      isVLOP, 
      isVLOSE 
    });

    return this.mapToDSAPlatform(platform);
  }

  /**
   * Record content moderation action
   */
  async recordContentModeration(
    organizationId: string,
    platformId: string,
    moderationData: {
      actionType: ContentModerationAction;
      contentType: string;
      reason: string;
      automatedDecision: boolean;
    }
  ): Promise<ContentModerationRecord> {
    const platform = await prisma.dSAPlatform.findFirst({
      where: { id: platformId, organizationId },
    });

    if (!platform) {
      throw new AppError('Platform not found', 404);
    }

    const moderation = await prisma.dSAContentModeration.create({
      data: {
        platformId,
        organizationId,
        actionType: moderationData.actionType,
        contentType: moderationData.contentType,
        reason: moderationData.reason,
        automatedDecision: moderationData.automatedDecision,
        appealAvailable: true, // DSA requires appeals for all moderation actions
      },
    });

    logger.info(`Content moderation recorded: ${moderation.id}`, { 
      organizationId, 
      platformId 
    });

    return this.mapToContentModeration(moderation);
  }

  /**
   * Get content moderation history for a platform
   */
  async getContentModerationHistory(
    organizationId: string,
    platformId: string,
  ): Promise<ContentModerationRecord[]> {
    const platform = await prisma.dSAPlatform.findFirst({
      where: { id: platformId, organizationId },
    });

    if (!platform) {
      throw new AppError('Platform not found', 404);
    }

    const records = await prisma.dSAContentModeration.findMany({
      where: { platformId, organizationId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return records.map((r) => this.mapToContentModeration(r));
  }

  /**
   * Report illegal content
   */
  async reportIllegalContent(
    organizationId: string,
    platformId: string,
    reportData: {
      reportedBy: string;
      isTrustedFlagger: boolean;
      contentType: string;
      contentUrl?: string;
      reason: string;
    }
  ): Promise<IllegalContentReport> {
    const platform = await prisma.dSAPlatform.findFirst({
      where: { id: platformId, organizationId },
    });

    if (!platform) {
      throw new AppError('Platform not found', 404);
    }

    const report = await prisma.dSAIllegalContentReport.create({
      data: {
        platformId,
        organizationId,
        reportedBy: reportData.reportedBy,
        isTrustedFlagger: reportData.isTrustedFlagger,
        contentType: reportData.contentType,
        contentUrl: reportData.contentUrl,
        reason: reportData.reason,
        status: 'pending',
      },
    });

    // If from trusted flagger, prioritize
    if (reportData.isTrustedFlagger) {
      logger.info(`Trusted flagger report received: ${report.id}`, { 
        organizationId, 
        platformId 
      });
    }

    return this.mapToIllegalContentReport(report);
  }

  /**
   * Process illegal content report
   */
  async processIllegalContentReport(
    organizationId: string,
    reportId: string,
    action: {
      status: 'reviewed' | 'action_taken' | 'dismissed';
      actionTaken?: string;
      responseTime?: number; // Hours
    }
  ): Promise<IllegalContentReport> {
    const report = await prisma.dSAIllegalContentReport.findFirst({
      where: { id: reportId, organizationId },
    });

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    const updated = await prisma.dSAIllegalContentReport.update({
      where: { id: reportId },
      data: {
        status: action.status,
        actionTaken: action.actionTaken,
        responseTime: action.responseTime,
      },
    });

    // DSA requires response within reasonable time (typically 24-48 hours)
    if (action.responseTime && action.responseTime > 48) {
      logger.warn(`Illegal content report response time exceeds 48 hours: ${reportId}`, {
        organizationId,
        responseTime: action.responseTime,
      });
    }

    return this.mapToIllegalContentReport(updated);
  }

  /**
   * Add ad to repository (required for VLOPs)
   */
  async addAdToRepository(
    organizationId: string,
    platformId: string,
    adData: {
      adId: string;
      advertiserName: string;
      adContent: {
        text?: string;
        images?: string[];
        video?: string;
        targetAudience?: string[];
      };
      targetingCriteria?: {
        demographics?: string[];
        interests?: string[];
        location?: string[];
        customAudiences?: string[];
      };
      displayPeriod: { start: Date; end: Date };
      impressions?: number;
      clicks?: number;
      isPoliticalAd: boolean;
      isTargetedToMinors: boolean;
    }
  ): Promise<AdRepositoryEntry> {
    const platform = await prisma.dSAPlatform.findFirst({
      where: { id: platformId, organizationId },
    });

    if (!platform) {
      throw new AppError('Platform not found', 404);
    }

    if (!platform.isVLOP) {
      throw new AppError('Ad repositories are only required for Very Large Online Platforms (VLOPs)', 400);
    }

    // DSA prohibits targeted ads to minors
    if (adData.isTargetedToMinors && adData.targetingCriteria) {
      throw new AppError('Targeted advertising to minors is prohibited under the DSA', 400);
    }

    const adEntry = await prisma.dSAAdRepository.create({
      data: {
        platformId,
        organizationId,
        adId: adData.adId,
        advertiserName: adData.advertiserName,
        adContent: adData.adContent,
        targetingCriteria: adData.targetingCriteria,
        displayPeriod: adData.displayPeriod,
        impressions: adData.impressions,
        clicks: adData.clicks,
        isPoliticalAd: adData.isPoliticalAd,
        isTargetedToMinors: false, // Always false as targeting minors is prohibited
      },
    });

    logger.info(`Ad added to repository: ${adEntry.id}`, { 
      organizationId, 
      platformId 
    });

    return this.mapToAdRepositoryEntry(adEntry);
  }

  /**
   * Get ads from repository for a platform
   */
  async getAdsFromRepository(
    organizationId: string,
    platformId: string
  ): Promise<AdRepositoryEntry[]> {
    const platform = await prisma.dSAPlatform.findFirst({
      where: { id: platformId, organizationId },
    });

    if (!platform) {
      throw new AppError('Platform not found', 404);
    }

    const ads = await prisma.dSAAdRepository.findMany({
      where: { platformId, organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return ads.map(ad => this.mapToAdRepositoryEntry(ad));
  }

  /**
   * Generate transparency report (required for VLOPs/VLOSE)
   */
  async generateTransparencyReport(
    organizationId: string,
    platformId: string,
    reportingPeriod: { start: Date; end: Date }
  ): Promise<DSATransparencyReport> {
    const platform = await prisma.dSAPlatform.findFirst({
      where: { id: platformId, organizationId },
      include: {
        contentModeration: {
          where: {
            createdAt: {
              gte: reportingPeriod.start,
              lte: reportingPeriod.end,
            },
          },
        },
        illegalContentReports: {
          where: {
            createdAt: {
              gte: reportingPeriod.start,
              lte: reportingPeriod.end,
            },
          },
        },
      },
    });

    if (!platform) {
      throw new AppError('Platform not found', 404);
    }

    if (!platform.isVLOP && !platform.isVLOSE) {
      throw new AppError('Transparency reports are only required for VLOPs and VLOSE', 400);
    }

    // Calculate statistics
    const allAppeals = platform.contentModeration.filter(m => m.appealStatus && m.appealStatus !== 'none');
    const appealsApproved = platform.contentModeration.filter(m => m.appealStatus === 'approved').length;
    const appealsRejected = platform.contentModeration.filter(m => m.appealStatus === 'rejected').length;
    const moderationStats = {
      totalReviewed: platform.contentModeration.length,
      totalRemovals: platform.contentModeration.filter(m => m.actionType === 'removal').length,
      totalSuspensions: platform.contentModeration.filter(m => m.actionType === 'suspension').length,
      totalRestrictions: platform.contentModeration.filter(m => m.actionType === 'restriction').length,
      automatedRemovals: platform.contentModeration.filter(m => m.actionType === 'removal' && m.automatedDecision).length,
      manualRemovals: platform.contentModeration.filter(m => m.actionType === 'removal' && !m.automatedDecision).length,
      appealsReceived: allAppeals.length, // Total appeals (pending + approved + rejected)
      appealsApproved,
      appealsRejected,
      averageAppealTime: allAppeals.length > 0
        ? allAppeals.reduce((sum, a) => sum + (a.updatedAt.getTime() - a.createdAt.getTime()), 0) / allAppeals.length / (1000 * 60 * 60)
        : null,
    };

    const userReports = {
      totalReports: platform.illegalContentReports.length,
      reportsFromTrustedFlaggers: platform.illegalContentReports.filter(r => r.isTrustedFlagger).length,
      reportsActioned: platform.illegalContentReports.filter(r => r.status === 'action_taken').length,
      averageResponseTime: platform.illegalContentReports
        .filter(r => r.responseTime)
        .reduce((sum, r) => sum + (r.responseTime || 0), 0) / 
        (platform.illegalContentReports.filter(r => r.responseTime).length || 1),
    };

    const report = await prisma.dSATransparencyReport.create({
      data: {
        platformId,
        organizationId,
        reportingPeriodStart: reportingPeriod.start,
        reportingPeriodEnd: reportingPeriod.end,
        contentModerationStats: moderationStats,
        userReports,
        trustedFlaggerReports: {
          totalReports: userReports.reportsFromTrustedFlaggers,
          actionedReports: platform.illegalContentReports.filter(r => r.isTrustedFlagger && r.status === 'action_taken').length,
          averageResponseTime: userReports.averageResponseTime,
        },
        automatedDetection: {
          contentScanned: moderationStats.totalReviewed ?? null,
          contentFlagged: moderationStats.automatedRemovals,
          falsePositiveRate: moderationStats.appealsApproved > 0 && moderationStats.automatedRemovals > 0
            ? Math.round((moderationStats.appealsApproved / moderationStats.automatedRemovals) * 100) / 100
            : null,
        },
        appealsProcessed: {
          totalAppeals: moderationStats.appealsReceived,
          approved: moderationStats.appealsApproved,
          rejected: moderationStats.appealsRejected,
          averageProcessingTime: moderationStats.averageAppealTime ?? null,
        },
        submittedToCommission: false,
      },
    });

    return this.mapToTransparencyReport(report);
  }

  /**
   * Get transparency reports for a platform
   */
  async getTransparencyReports(
    organizationId: string,
    platformId: string,
  ): Promise<DSATransparencyReport[]> {
    const platform = await prisma.dSAPlatform.findFirst({
      where: { id: platformId, organizationId },
    });

    if (!platform) {
      throw new AppError('Platform not found', 404);
    }

    const reports = await prisma.dSATransparencyReport.findMany({
      where: { platformId, organizationId },
      orderBy: { reportingPeriodStart: 'desc' },
      take: 20,
    });

    return reports.map((r) => this.mapToTransparencyReport(r));
  }

  /**
   * Get platform by ID
   */
  async getPlatform(organizationId: string, platformId: string): Promise<DSAPlatform> {
    const platform = await prisma.dSAPlatform.findFirst({
      where: { id: platformId, organizationId },
    });

    if (!platform) {
      throw new AppError('Platform not found', 404);
    }

    return this.mapToDSAPlatform(platform);
  }

  /**
   * Get all platforms for organization
   */
  async getPlatforms(organizationId: string): Promise<DSAPlatform[]> {
    const platforms = await prisma.dSAPlatform.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return platforms.map(p => this.mapToDSAPlatform(p));
  }

  /**
   * Update platform
   */
  async updatePlatform(
    organizationId: string,
    platformId: string,
    updates: Partial<{
      platformName: string;
      monthlyActiveUsers: number;
      complianceStatus: 'compliant' | 'non_compliant' | 'in_review';
    }>
  ): Promise<DSAPlatform> {
    const platform = await prisma.dSAPlatform.findFirst({
      where: { id: platformId, organizationId },
    });

    if (!platform) {
      throw new AppError('Platform not found', 404);
    }

    // Re-check VLOP status if monthly active users changed
    if (updates.monthlyActiveUsers !== undefined) {
      const vlopStatus = await this.checkVLOPStatus(updates.monthlyActiveUsers);
      updates = {
        ...updates,
        ...(vlopStatus.isVLOP ? { isVLOP: true } : {}),
        ...(vlopStatus.isVLOSE ? { isVLOSE: true } : {}),
      };
    }

    const updated = await prisma.dSAPlatform.update({
      where: { id: platformId },
      data: updates,
    });

    return this.mapToDSAPlatform(updated);
  }

  /**
   * Delete platform
   */
  async deletePlatform(organizationId: string, platformId: string): Promise<void> {
    const platform = await prisma.dSAPlatform.findFirst({
      where: { id: platformId, organizationId },
    });

    if (!platform) {
      throw new AppError('Platform not found', 404);
    }

    await prisma.dSAPlatform.delete({
      where: { id: platformId },
    });

    logger.info(`DSA platform deleted: ${platformId}`, { organizationId });
  }

  // Helper methods
  private mapToDSAPlatform(platform: any): DSAPlatform {
    return {
      id: platform.id,
      organizationId: platform.organizationId,
      platformName: platform.platformName,
      platformType: platform.platformType as DSAPlatformType,
      monthlyActiveUsers: platform.monthlyActiveUsers,
      isVLOP: platform.isVLOP,
      isVLOSE: platform.isVLOSE,
      designationDate: platform.designationDate,
      complianceStatus: platform.complianceStatus,
      createdAt: platform.createdAt,
      updatedAt: platform.updatedAt,
    };
  }

  private mapToContentModeration(moderation: any): ContentModerationRecord {
    return {
      id: moderation.id,
      platformId: moderation.platformId,
      organizationId: moderation.organizationId,
      actionType: moderation.actionType as ContentModerationAction,
      contentType: moderation.contentType,
      reason: moderation.reason,
      automatedDecision: moderation.automatedDecision,
      appealAvailable: moderation.appealAvailable,
      appealStatus: moderation.appealStatus,
      createdAt: moderation.createdAt,
      updatedAt: moderation.updatedAt,
    };
  }

  private mapToIllegalContentReport(report: any): IllegalContentReport {
    return {
      id: report.id,
      platformId: report.platformId,
      organizationId: report.organizationId,
      reportedBy: report.reportedBy,
      isTrustedFlagger: report.isTrustedFlagger,
      contentType: report.contentType,
      contentUrl: report.contentUrl,
      reason: report.reason,
      status: report.status,
      actionTaken: report.actionTaken,
      responseTime: report.responseTime,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }

  private mapToTransparencyReport(report: any): DSATransparencyReport {
    return {
      id: report.id,
      platformId: report.platformId,
      organizationId: report.organizationId,
      reportingPeriod: {
        start: report.reportingPeriodStart,
        end: report.reportingPeriodEnd,
      },
      contentModerationStats: report.contentModerationStats,
      userReports: report.userReports,
      trustedFlaggerReports: report.trustedFlaggerReports,
      automatedDetection: report.automatedDetection,
      appealsProcessed: report.appealsProcessed,
      submittedToCommission: report.submittedToCommission || false,
      submittedAt: report.submittedAt,
      createdAt: report.createdAt, // Add createdAt for display
    };
  }

  /**
   * Conduct risk assessment for VLOP/VLOSE platform (Article 34)
   */
  async conductRiskAssessment(
    organizationId: string,
    platformId: string,
    userId: string,
    assessmentData: {
      riskCategory: 'illegal_content' | 'fundamental_rights' | 'public_security' | 'protection_of_minors';
      illegalContentRisks?: {
        risks: string[];
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
      };
      fundamentalRightsRisks?: {
        risks: string[];
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
      };
      publicSecurityRisks?: {
        risks: string[];
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
      };
      protectionOfMinorsRisks?: {
        risks: string[];
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
      };
      mitigationMeasures: Array<{
        measure: string;
        status: 'planned' | 'in_progress' | 'implemented' | 'verified';
        targetDate?: Date;
        responsibleParty?: string;
      }>;
      nextReviewDate?: Date;
    }
  ): Promise<any> {
    const platform = await prisma.dSAPlatform.findFirst({
      where: { id: platformId, organizationId },
    });

    if (!platform) {
      throw new AppError('Platform not found', 404);
    }

    if (!platform.isVLOP && !platform.isVLOSE) {
      throw new AppError('Risk assessments are only required for Very Large Online Platforms (VLOPs) and Very Large Online Search Engines (VLOSE)', 400);
    }

    // Calculate overall risk level based on highest severity
    const riskSeverities: Array<'low' | 'medium' | 'high' | 'critical'> = [];
    if (assessmentData.illegalContentRisks) riskSeverities.push(assessmentData.illegalContentRisks.severity);
    if (assessmentData.fundamentalRightsRisks) riskSeverities.push(assessmentData.fundamentalRightsRisks.severity);
    if (assessmentData.publicSecurityRisks) riskSeverities.push(assessmentData.publicSecurityRisks.severity);
    if (assessmentData.protectionOfMinorsRisks) riskSeverities.push(assessmentData.protectionOfMinorsRisks.severity);

    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const overallRiskLevel = riskSeverities.length > 0
      ? riskSeverities.reduce((max, current) => 
          severityOrder[current] > severityOrder[max] ? current : max, riskSeverities[0])
      : 'low';

    // Build systemic risks object
    const systemicRisks = {
      illegalContent: assessmentData.illegalContentRisks || null,
      fundamentalRights: assessmentData.fundamentalRightsRisks || null,
      publicSecurity: assessmentData.publicSecurityRisks || null,
      protectionOfMinors: assessmentData.protectionOfMinorsRisks || null,
    };

    const assessment = await prisma.dSARiskAssessment.create({
      data: {
        platformId,
        organizationId,
        assessedBy: userId,
        riskCategory: assessmentData.riskCategory,
        systemicRisks,
        illegalContentRisks: assessmentData.illegalContentRisks || undefined,
        fundamentalRightsRisks: assessmentData.fundamentalRightsRisks || undefined,
        publicSecurityRisks: assessmentData.publicSecurityRisks || undefined,
        protectionOfMinorsRisks: assessmentData.protectionOfMinorsRisks || undefined,
        overallRiskLevel,
        mitigationMeasures: assessmentData.mitigationMeasures,
        nextReviewDate: assessmentData.nextReviewDate,
        status: 'draft',
      },
    });

    logger.info(`DSA risk assessment created: ${assessment.id}`, { 
      organizationId, 
      platformId,
      riskCategory: assessmentData.riskCategory,
      overallRiskLevel,
    });

    return this.mapToRiskAssessment(assessment);
  }

  /**
   * Get risk assessments for a platform
   */
  async getRiskAssessments(
    organizationId: string,
    platformId: string,
  ): Promise<any[]> {
    const platform = await prisma.dSAPlatform.findFirst({
      where: { id: platformId, organizationId },
    });

    if (!platform) {
      throw new AppError('Platform not found', 404);
    }

    const assessments = await prisma.dSARiskAssessment.findMany({
      where: { platformId, organizationId },
      orderBy: { assessmentDate: 'desc' },
    });

    return assessments.map(a => this.mapToRiskAssessment(a));
  }

  /**
   * Get latest risk assessment for a platform
   */
  async getLatestRiskAssessment(
    organizationId: string,
    platformId: string,
  ): Promise<any | null> {
    const assessment = await prisma.dSARiskAssessment.findFirst({
      where: { platformId, organizationId },
      orderBy: { assessmentDate: 'desc' },
    });

    return assessment ? this.mapToRiskAssessment(assessment) : null;
  }

  /**
   * Update risk assessment
   */
  async updateRiskAssessment(
    organizationId: string,
    assessmentId: string,
    updates: {
      status?: 'draft' | 'in_review' | 'approved' | 'requires_action';
      mitigationMeasures?: Array<{
        measure: string;
        status: 'planned' | 'in_progress' | 'implemented' | 'verified';
        targetDate?: Date;
        responsibleParty?: string;
      }>;
      nextReviewDate?: Date;
      notes?: string;
    }
  ): Promise<any> {
    const assessment = await prisma.dSARiskAssessment.findFirst({
      where: { id: assessmentId, organizationId },
    });

    if (!assessment) {
      throw new AppError('Risk assessment not found', 404);
    }

    const updated = await prisma.dSARiskAssessment.update({
      where: { id: assessmentId },
      data: {
        ...(updates.status && { status: updates.status }),
        ...(updates.mitigationMeasures && { mitigationMeasures: updates.mitigationMeasures }),
        ...(updates.nextReviewDate && { nextReviewDate: updates.nextReviewDate }),
      },
    });

    return this.mapToRiskAssessment(updated);
  }

  /**
   * Configure non-personalized feed option for VLOP (Article 27)
   */
  async configureNonPersonalizedFeed(
    organizationId: string,
    platformId: string,
    configData: {
      isEnabled: boolean;
      userOptInMethod: 'toggle' | 'settings_page' | 'onboarding';
      feedAlgorithmType: 'chronological' | 'popularity' | 'random';
      description?: string;
      userDocumentationUrl?: string;
      technicalSpecs?: any;
      implementationDate?: Date;
      notes?: string;
    }
  ): Promise<any> {
    const platform = await prisma.dSAPlatform.findFirst({
      where: { id: platformId, organizationId },
    });

    if (!platform) {
      throw new AppError('Platform not found', 404);
    }

    if (!platform.isVLOP) {
      throw new AppError('Non-personalized feed option is only required for Very Large Online Platforms (VLOPs)', 400);
    }

    // Determine compliance status
    let complianceStatus = 'not_implemented';
    if (configData.isEnabled) {
      complianceStatus = configData.implementationDate ? 'implemented' : 'in_progress';
    }

    const feedConfig = await prisma.dSANonPersonalizedFeed.upsert({
      where: { platformId },
      update: {
        isEnabled: configData.isEnabled,
        userOptInMethod: configData.userOptInMethod,
        feedAlgorithmType: configData.feedAlgorithmType,
        description: configData.description,
        userDocumentationUrl: configData.userDocumentationUrl,
        technicalSpecs: configData.technicalSpecs,
        implementationDate: configData.implementationDate || (configData.isEnabled ? new Date() : null),
        complianceStatus,
        notes: configData.notes,
      },
      create: {
        platformId,
        organizationId,
        isEnabled: configData.isEnabled,
        userOptInMethod: configData.userOptInMethod,
        feedAlgorithmType: configData.feedAlgorithmType,
        description: configData.description,
        userDocumentationUrl: configData.userDocumentationUrl,
        technicalSpecs: configData.technicalSpecs,
        implementationDate: configData.implementationDate || (configData.isEnabled ? new Date() : null),
        complianceStatus,
        notes: configData.notes,
      },
    });

    logger.info(`Non-personalized feed configured: ${feedConfig.id}`, { 
      organizationId, 
      platformId,
      isEnabled: configData.isEnabled,
    });

    return this.mapToNonPersonalizedFeed(feedConfig);
  }

  /**
   * Get non-personalized feed configuration for a platform
   */
  async getNonPersonalizedFeed(
    organizationId: string,
    platformId: string,
  ): Promise<any | null> {
    const feedConfig = await prisma.dSANonPersonalizedFeed.findUnique({
      where: { platformId },
    });

    if (!feedConfig || feedConfig.organizationId !== organizationId) {
      return null;
    }

    return this.mapToNonPersonalizedFeed(feedConfig);
  }

  /**
   * Update non-personalized feed compliance status
   */
  async updateNonPersonalizedFeedStatus(
    organizationId: string,
    platformId: string,
    updates: {
      complianceStatus?: 'not_implemented' | 'in_progress' | 'implemented' | 'compliant';
      lastAuditDate?: Date;
      notes?: string;
    }
  ): Promise<any> {
    const feedConfig = await prisma.dSANonPersonalizedFeed.findUnique({
      where: { platformId },
    });

    if (!feedConfig || feedConfig.organizationId !== organizationId) {
      throw new AppError('Non-personalized feed configuration not found', 404);
    }

    const updated = await prisma.dSANonPersonalizedFeed.update({
      where: { platformId },
      data: {
        ...(updates.complianceStatus && { complianceStatus: updates.complianceStatus }),
        ...(updates.lastAuditDate && { lastAuditDate: updates.lastAuditDate }),
        ...(updates.notes && { notes: updates.notes }),
      },
    });

    return this.mapToNonPersonalizedFeed(updated);
  }

  private mapToAdRepositoryEntry(entry: any): AdRepositoryEntry {
    return {
      id: entry.id,
      platformId: entry.platformId,
      organizationId: entry.organizationId,
      adId: entry.adId,
      advertiserName: entry.advertiserName,
      adContent: entry.adContent,
      targetingCriteria: entry.targetingCriteria,
      displayPeriod: entry.displayPeriod,
      impressions: entry.impressions,
      clicks: entry.clicks,
      isPoliticalAd: entry.isPoliticalAd,
      isTargetedToMinors: entry.isTargetedToMinors,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  private mapToRiskAssessment(assessment: any): any {
    return {
      id: assessment.id,
      platformId: assessment.platformId,
      organizationId: assessment.organizationId,
      assessmentDate: assessment.assessmentDate,
      assessedBy: assessment.assessedBy,
      riskCategory: assessment.riskCategory,
      systemicRisks: assessment.systemicRisks,
      illegalContentRisks: assessment.illegalContentRisks,
      fundamentalRightsRisks: assessment.fundamentalRightsRisks,
      publicSecurityRisks: assessment.publicSecurityRisks,
      protectionOfMinorsRisks: assessment.protectionOfMinorsRisks,
      overallRiskLevel: assessment.overallRiskLevel,
      mitigationMeasures: assessment.mitigationMeasures,
      nextReviewDate: assessment.nextReviewDate,
      status: assessment.status,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
    };
  }

  private mapToNonPersonalizedFeed(feed: any): any {
    return {
      id: feed.id,
      platformId: feed.platformId,
      organizationId: feed.organizationId,
      isEnabled: feed.isEnabled,
      implementationDate: feed.implementationDate,
      userOptInMethod: feed.userOptInMethod,
      feedAlgorithmType: feed.feedAlgorithmType,
      description: feed.description,
      userDocumentationUrl: feed.userDocumentationUrl,
      technicalSpecs: feed.technicalSpecs,
      complianceStatus: feed.complianceStatus,
      lastAuditDate: feed.lastAuditDate,
      notes: feed.notes,
      createdAt: feed.createdAt,
      updatedAt: feed.updatedAt,
    };
  }
}

export default new DSAService();

