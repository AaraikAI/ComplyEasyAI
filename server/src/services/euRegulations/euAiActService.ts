/**
 * EU AI Act Compliance Service
 * 
 * Implements Regulation (EU) 2024/1689 - The Artificial Intelligence Act
 * 
 * Key Requirements:
 * - Risk-based classification system (Unacceptable, High, Limited, Minimal)
 * - Transparency requirements for generative AI
 * - High-risk AI system assessments
 * - Prohibited AI practices
 * - General-purpose AI model obligations
 * - Compliance timeline management
 * 
 * Reference: https://www.europarl.europa.eu/topics/en/article/20230601STO93804/eu-ai-act-first-regulation-on-artificial-intelligence
 */

import prisma from '../../config/database';
import logger from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';
import euAiDatabaseClient from './euAiDatabaseClient';

export type AIRiskLevel = 'unacceptable' | 'high' | 'limited' | 'minimal';
export type AIProhibitedPractice = 
  | 'cognitive_manipulation'
  | 'social_scoring'
  | 'biometric_identification'
  | 'real_time_biometric_identification'
  | 'emotion_recognition_workplace'
  | 'predictive_policing';

export type AIHighRiskCategory =
  | 'critical_infrastructure'
  | 'education_training'
  | 'employment_worker_management'
  | 'essential_services'
  | 'law_enforcement'
  | 'migration_asylum_border'
  | 'legal_interpretation'
  | 'biometric_identification'
  | 'product_safety';

export interface AISystem {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  riskLevel: AIRiskLevel;
  highRiskCategory?: AIHighRiskCategory;
  isGeneralPurpose: boolean;
  isGenerative: boolean;
  prohibitedPractices: AIProhibitedPractice[];
  transparencyRequirements: {
    aiGeneratedContentLabeling: boolean;
    copyrightDataSummary: boolean;
    illegalContentPrevention: boolean;
  };
  complianceStatus: 'compliant' | 'non_compliant' | 'in_review' | 'at_risk';
  lastAssessmentDate?: Date;
  nextAssessmentDate?: Date;
  registeredInEUDatabase: boolean;
  euDatabaseRegistrationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIRiskAssessment {
  id: string;
  systemId: string;
  organizationId: string;
  assessedBy: string;
  assessmentDate: Date;
  riskLevel: AIRiskLevel;
  findings: {
    safetyRisks: string[];
    fundamentalRightsRisks: string[];
    discriminationRisks: string[];
    privacyRisks: string[];
  };
  mitigationMeasures: string[];
  complianceScore: number; // 0-100
  recommendations: string[];
  status: 'pending' | 'approved' | 'rejected' | 'requires_action';
}

export interface AITransparencyReport {
  id: string;
  organizationId: string;
  reportingPeriod: {
    start: Date;
    end: Date;
  };
  generativeAISystems: {
    systemId: string;
    systemName: string;
    contentGenerated: number;
    aiLabelingCompliance: number; // percentage
    copyrightCompliance: number; // percentage
    illegalContentPrevented: number;
  }[];
  highRiskSystems: {
    systemId: string;
    systemName: string;
    assessmentsCompleted: number;
    incidentsReported: number;
    complianceStatus: string;
  }[];
  prohibitedPracticesDetected: number;
  complaintsReceived: number;
  complaintsResolved: number;
  submittedToCommission: boolean;
  submittedAt?: Date;
}

class EUAIActService {
  /**
   * Classify AI system risk level
   */
  async classifyAIRiskLevel(
    organizationId: string,
    systemData: {
      name: string;
      description: string;
      useCase: string;
      targetUsers: string[];
      dataTypes: string[];
      decisionMaking: boolean;
      biometricProcessing: boolean;
      realTimeProcessing: boolean;
      affectsFundamentalRights: boolean;
    }
  ): Promise<{ riskLevel: AIRiskLevel; category?: AIHighRiskCategory; prohibitedPractices: AIProhibitedPractice[] }> {
    const prohibitedPractices: AIProhibitedPractice[] = [];
    let riskLevel: AIRiskLevel = 'minimal';
    let category: AIHighRiskCategory | undefined;

    // Check for prohibited practices (unacceptable risk)
    if (systemData.useCase.includes('cognitive manipulation') || 
        systemData.useCase.includes('vulnerable groups') ||
        systemData.targetUsers.includes('children')) {
      prohibitedPractices.push('cognitive_manipulation');
      riskLevel = 'unacceptable';
    }

    if (systemData.useCase.includes('social scoring') || 
        systemData.useCase.includes('behavior classification')) {
      prohibitedPractices.push('social_scoring');
      riskLevel = 'unacceptable';
    }

    if (systemData.biometricProcessing && systemData.useCase.includes('identification')) {
      prohibitedPractices.push('biometric_identification');
      if (systemData.realTimeProcessing) {
        prohibitedPractices.push('real_time_biometric_identification');
      }
      riskLevel = 'unacceptable';
    }

    if (systemData.useCase.includes('emotion recognition') && 
        systemData.useCase.includes('workplace')) {
      prohibitedPractices.push('emotion_recognition_workplace');
      riskLevel = 'unacceptable';
    }

    if (systemData.useCase.includes('predictive policing')) {
      prohibitedPractices.push('predictive_policing');
      riskLevel = 'unacceptable';
    }

    // If not prohibited, check for high-risk categories
    if (riskLevel !== 'unacceptable') {
      if (systemData.useCase.includes('critical infrastructure') ||
          systemData.useCase.includes('energy') ||
          systemData.useCase.includes('transport')) {
        riskLevel = 'high';
        category = 'critical_infrastructure';
      } else if (systemData.useCase.includes('education') ||
                 systemData.useCase.includes('training') ||
                 systemData.useCase.includes('vocational')) {
        riskLevel = 'high';
        category = 'education_training';
      } else if (systemData.useCase.includes('employment') ||
                 systemData.useCase.includes('recruitment') ||
                 systemData.useCase.includes('worker management')) {
        riskLevel = 'high';
        category = 'employment_worker_management';
      } else if (systemData.useCase.includes('essential services') ||
                 systemData.useCase.includes('public services') ||
                 systemData.useCase.includes('benefits')) {
        riskLevel = 'high';
        category = 'essential_services';
      } else if (systemData.useCase.includes('law enforcement') ||
                 systemData.useCase.includes('policing')) {
        riskLevel = 'high';
        category = 'law_enforcement';
      } else if (systemData.useCase.includes('migration') ||
                 systemData.useCase.includes('asylum') ||
                 systemData.useCase.includes('border control')) {
        riskLevel = 'high';
        category = 'migration_asylum_border';
      } else if (systemData.useCase.includes('legal interpretation') ||
                 systemData.useCase.includes('law application')) {
        riskLevel = 'high';
        category = 'legal_interpretation';
      } else if (systemData.biometricProcessing) {
        riskLevel = 'high';
        category = 'biometric_identification';
      } else if (systemData.affectsFundamentalRights || systemData.decisionMaking) {
        riskLevel = 'limited';
      }
    }

    return { riskLevel, category, prohibitedPractices };
  }

  /**
   * Register AI system
   */
  async registerAISystem(
    organizationId: string,
    userId: string,
    systemData: {
      name: string;
      description: string;
      useCase: string;
      targetUsers: string[];
      dataTypes: string[];
      decisionMaking: boolean;
      biometricProcessing: boolean;
      realTimeProcessing: boolean;
      affectsFundamentalRights: boolean;
      isGeneralPurpose: boolean;
      isGenerative: boolean;
    }
  ): Promise<AISystem> {
    const classification = await this.classifyAIRiskLevel(organizationId, systemData);

    // Check if system uses prohibited practices
    if (classification.prohibitedPractices.length > 0 && classification.riskLevel === 'unacceptable') {
      throw new AppError(
        `AI system uses prohibited practices: ${classification.prohibitedPractices.join(', ')}. These practices are banned under the EU AI Act.`,
        400
      );
    }

    // Determine if registration in EU database is required
    const requiresDatabaseRegistration = 
      classification.riskLevel === 'high' && classification.category !== undefined;

    const system = await prisma.$transaction(async (tx) => {
      // Create AI system record
      const aiSystem = await tx.eUAIActSystem.create({
        data: {
          organizationId,
          name: systemData.name,
          description: systemData.description,
          riskLevel: classification.riskLevel,
          highRiskCategory: classification.category,
          isGeneralPurpose: systemData.isGeneralPurpose,
          isGenerative: systemData.isGenerative,
          prohibitedPractices: classification.prohibitedPractices,
          transparencyRequirements: {
            aiGeneratedContentLabeling: systemData.isGenerative,
            copyrightDataSummary: systemData.isGenerative,
            illegalContentPrevention: systemData.isGenerative,
          },
          complianceStatus: 'in_review',
          registeredInEUDatabase: requiresDatabaseRegistration,
          createdBy: userId,
        },
      });

      // If high-risk, create initial assessment requirement
      if (classification.riskLevel === 'high') {
        await tx.eUAIActRiskAssessment.create({
          data: {
            systemId: aiSystem.id,
            organizationId,
            assessedBy: userId,
            assessmentDate: new Date(),
            riskLevel: classification.riskLevel,
            findings: {
              safetyRisks: [],
              fundamentalRightsRisks: [],
              discriminationRisks: [],
              privacyRisks: [],
            },
            mitigationMeasures: [],
            complianceScore: 0,
            recommendations: [],
            status: 'pending',
          },
        });
      }

      return aiSystem;
    });

    logger.info(`AI system registered: ${system.id}`, {
      organizationId,
      riskLevel: classification.riskLevel,
      highRiskCategory: classification.category,
      requiresDatabaseRegistration,
    });

    // If registration in the external EU database is required, attempt to register
    // the system and persist the returned registration ID. This call is best‑effort:
    // any failure is logged, but does not block normal system operation.
    let finalSystem = system;

    if (requiresDatabaseRegistration) {
      try {
        const registrationId = await euAiDatabaseClient.registerSystem({
          organizationId,
          systemName: systemData.name,
          riskLevel: classification.riskLevel,
          highRiskCategory: classification.category,
          isGeneralPurpose: systemData.isGeneralPurpose,
          isGenerative: systemData.isGenerative,
        });

        if (registrationId) {
          finalSystem = await prisma.eUAIActSystem.update({
            where: { id: system.id },
            data: {
              euDatabaseRegistrationId: registrationId,
            },
          });
        }
      } catch (error: any) {
        logger.error('Failed to persist EU database registration ID', {
          systemId: system.id,
          organizationId,
          message: error.message,
        });
      }
    }

    return this.mapToAISystem(finalSystem);
  }

  /**
   * Conduct risk assessment for high-risk AI system
   */
  async conductRiskAssessment(
    organizationId: string,
    systemId: string,
    userId: string,
    assessmentData: {
      safetyRisks: string[];
      fundamentalRightsRisks: string[];
      discriminationRisks: string[];
      privacyRisks: string[];
      mitigationMeasures: string[];
      recommendations: string[];
    }
  ): Promise<AIRiskAssessment> {
    const system = await prisma.eUAIActSystem.findFirst({
      where: { id: systemId, organizationId },
    });

    if (!system) {
      throw new AppError('AI system not found', 404);
    }

    if (system.riskLevel !== 'high') {
      throw new AppError('Risk assessments are only required for high-risk AI systems', 400);
    }

    // Calculate compliance score
    const totalRisks = 
      assessmentData.safetyRisks.length +
      assessmentData.fundamentalRightsRisks.length +
      assessmentData.discriminationRisks.length +
      assessmentData.privacyRisks.length;

    const complianceScore = totalRisks === 0 
      ? 100 
      : Math.max(0, 100 - (totalRisks * 10) + (assessmentData.mitigationMeasures.length * 5));

    const assessment = await prisma.eUAIActRiskAssessment.create({
      data: {
        systemId,
        organizationId,
        assessedBy: userId,
        assessmentDate: new Date(),
        riskLevel: system.riskLevel as AIRiskLevel,
        findings: {
          safetyRisks: assessmentData.safetyRisks,
          fundamentalRightsRisks: assessmentData.fundamentalRightsRisks,
          discriminationRisks: assessmentData.discriminationRisks,
          privacyRisks: assessmentData.privacyRisks,
        },
        mitigationMeasures: assessmentData.mitigationMeasures,
        complianceScore,
        recommendations: assessmentData.recommendations,
        status: complianceScore >= 70 ? 'approved' : 'requires_action',
      },
    });

    // Update system compliance status
    await prisma.eUAIActSystem.update({
      where: { id: systemId },
      data: {
        complianceStatus: complianceScore >= 70 ? 'compliant' : 'at_risk',
        lastAssessmentDate: new Date(),
        nextAssessmentDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    logger.info(`Risk assessment completed: ${assessment.id}`, { 
      organizationId, 
      systemId, 
      complianceScore 
    });

    return this.mapToAIRiskAssessment(assessment);
  }

  /**
   * Generate transparency report for generative AI systems
   */
  async generateTransparencyReport(
    organizationId: string,
    reportingPeriod: { start: Date; end: Date }
  ): Promise<AITransparencyReport> {
    // Get ALL systems first
    const allSystems = await prisma.eUAIActSystem.findMany({
      where: {
        organizationId,
        createdAt: { lte: reportingPeriod.end },
      },
      include: {
        riskAssessments: {
          where: {
            assessmentDate: {
              gte: reportingPeriod.start,
              lte: reportingPeriod.end,
            },
          },
        },
      },
    });

    // Filter generative systems
    const generativeSystems = allSystems.filter(sys => sys.isGenerative === true);

    // Filter high-risk systems
    const highRiskSystems = allSystems.filter(sys => sys.riskLevel === 'high');

    // Include ALL systems in the report, categorized
    const allSystemsList = allSystems.map(sys => ({
      systemId: sys.id,
      systemName: sys.name,
      riskLevel: sys.riskLevel,
      isGenerative: sys.isGenerative,
      complianceStatus: sys.complianceStatus,
    }));

    // Count actual systems for the report
    const totalGenerativeSystems = generativeSystems.length;
    const totalHighRiskSystems = highRiskSystems.length;
    const totalAssessments = highRiskSystems.reduce((sum, sys) => sum + (sys.riskAssessments?.length || 0), 0);
    
    // Generate report data with actual system counts
    const report = await prisma.eUAIActTransparencyReport.create({
      data: {
        organizationId,
        reportingPeriodStart: reportingPeriod.start,
        reportingPeriodEnd: reportingPeriod.end,
        generativeAISystems: generativeSystems.map(sys => ({
          systemId: sys.id,
          systemName: sys.name,
          contentGenerated: 0, // Would be tracked separately
          aiLabelingCompliance: 100, // Would be calculated from actual data
          copyrightCompliance: 100,
          illegalContentPrevented: 0,
        })),
        highRiskSystems: highRiskSystems.map(sys => ({
          systemId: sys.id,
          systemName: sys.name,
          assessmentsCompleted: sys.riskAssessments?.length || 0,
          incidentsReported: 0, // Would be tracked separately
          complianceStatus: sys.complianceStatus,
        })),
        prohibitedPracticesDetected: 0,
        complaintsReceived: 0,
        complaintsResolved: 0,
        submittedToCommission: false,
        eUAIActSystemId: null, // This is an organization-level report, not tied to a specific system
      },
    });

    const mappedReport = this.mapToAITransparencyReport(report);
    // Add all systems list to the report
    (mappedReport as any).allSystems = allSystemsList;
    return mappedReport;
  }

  /**
   * Get all transparency reports for organization
   */
  async getTransparencyReports(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AITransparencyReport[]> {
    const where: any = { organizationId };
    
    if (startDate || endDate) {
      where.OR = [];
      if (startDate) {
        where.OR.push({ reportingPeriodEnd: { gte: startDate } });
      }
      if (endDate) {
        where.OR.push({ reportingPeriodStart: { lte: endDate } });
      }
    }

    const reports = await prisma.eUAIActTransparencyReport.findMany({
      where,
      orderBy: { reportingPeriodStart: 'desc' },
    });

    return reports.map(r => this.mapToAITransparencyReport(r));
  }

  /**
   * Get all AI systems for organization
   */
  async getAISystems(organizationId: string): Promise<AISystem[]> {
    const systems = await prisma.eUAIActSystem.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return systems.map(s => this.mapToAISystem(s));
  }

  /**
   * Get AI system by ID
   */
  async getAISystem(organizationId: string, systemId: string): Promise<AISystem> {
    const system = await prisma.eUAIActSystem.findFirst({
      where: { id: systemId, organizationId },
      include: {
        assessments: {
          orderBy: { assessmentDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!system) {
      throw new AppError('AI system not found', 404);
    }

    return this.mapToAISystem(system);
  }

  /**
   * Update AI system
   */
  async updateAISystem(
    organizationId: string,
    systemId: string,
    updates: Partial<{
      name: string;
      description: string;
      complianceStatus: 'compliant' | 'non_compliant' | 'in_review' | 'at_risk';
      euDatabaseRegistrationId: string;
    }>
  ): Promise<AISystem> {
    const system = await prisma.eUAIActSystem.findFirst({
      where: { id: systemId, organizationId },
    });

    if (!system) {
      throw new AppError('AI system not found', 404);
    }

    const updated = await prisma.eUAIActSystem.update({
      where: { id: systemId },
      data: updates,
    });

    return this.mapToAISystem(updated);
  }

  /**
   * Get risk assessments for a system
   */
  async getRiskAssessments(organizationId: string, systemId: string): Promise<AIRiskAssessment[]> {
    const system = await prisma.eUAIActSystem.findFirst({
      where: { id: systemId, organizationId },
    });

    if (!system) {
      throw new AppError('AI system not found', 404);
    }

    const assessments = await prisma.eUAIActRiskAssessment.findMany({
      where: { systemId, organizationId },
      orderBy: { assessmentDate: 'desc' },
    });

    return assessments.map(a => this.mapToAIRiskAssessment(a));
  }

  /**
   * Get latest risk assessment for a system
   */
  async getLatestRiskAssessment(organizationId: string, systemId: string): Promise<AIRiskAssessment | null> {
    const assessment = await prisma.eUAIActRiskAssessment.findFirst({
      where: { systemId, organizationId },
      orderBy: { assessmentDate: 'desc' },
    });

    return assessment ? this.mapToAIRiskAssessment(assessment) : null;
  }

  /**
   * Delete AI system
   */
  async deleteAISystem(organizationId: string, systemId: string): Promise<void> {
    const system = await prisma.eUAIActSystem.findFirst({
      where: { id: systemId, organizationId },
    });

    if (!system) {
      throw new AppError('AI system not found', 404);
    }

    await prisma.eUAIActSystem.delete({
      where: { id: systemId },
    });

    logger.info(`AI system deleted: ${systemId}`, { organizationId });
  }

  // Helper methods
  private mapToAISystem(system: any): AISystem {
    return {
      id: system.id,
      organizationId: system.organizationId,
      name: system.name,
      description: system.description,
      riskLevel: system.riskLevel as AIRiskLevel,
      highRiskCategory: system.highRiskCategory as AIHighRiskCategory | undefined,
      isGeneralPurpose: system.isGeneralPurpose,
      isGenerative: system.isGenerative,
      prohibitedPractices: (system.prohibitedPractices || []) as AIProhibitedPractice[],
      transparencyRequirements: system.transparencyRequirements || {
        aiGeneratedContentLabeling: false,
        copyrightDataSummary: false,
        illegalContentPrevention: false,
      },
      complianceStatus: system.complianceStatus,
      lastAssessmentDate: system.lastAssessmentDate,
      nextAssessmentDate: system.nextAssessmentDate,
      registeredInEUDatabase: system.registeredInEUDatabase,
      euDatabaseRegistrationId: system.euDatabaseRegistrationId,
      createdAt: system.createdAt,
      updatedAt: system.updatedAt,
    };
  }

  private mapToAIRiskAssessment(assessment: any): AIRiskAssessment {
    return {
      id: assessment.id,
      systemId: assessment.systemId,
      organizationId: assessment.organizationId,
      assessedBy: assessment.assessedBy,
      assessmentDate: assessment.assessmentDate,
      riskLevel: assessment.riskLevel as AIRiskLevel,
      findings: assessment.findings || {
        safetyRisks: [],
        fundamentalRightsRisks: [],
        discriminationRisks: [],
        privacyRisks: [],
      },
      mitigationMeasures: assessment.mitigationMeasures || [],
      complianceScore: assessment.complianceScore,
      recommendations: assessment.recommendations || [],
      status: assessment.status,
    };
  }

  private mapToAITransparencyReport(report: any): AITransparencyReport {
    return {
      id: report.id,
      organizationId: report.organizationId,
      reportingPeriod: {
        start: report.reportingPeriodStart,
        end: report.reportingPeriodEnd,
      },
      generativeAISystems: report.generativeAISystems || [],
      highRiskSystems: report.highRiskSystems || [],
      prohibitedPracticesDetected: report.prohibitedPracticesDetected || 0,
      complaintsReceived: report.complaintsReceived || 0,
      complaintsResolved: report.complaintsResolved || 0,
      submittedToCommission: report.submittedToCommission || false,
      submittedAt: report.submittedAt,
    };
  }
}

export default new EUAIActService();

