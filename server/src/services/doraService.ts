/**
 * DORA (Digital Operational Resilience Act) Service
 *
 * Implements Regulation (EU) 2022/2554 covering:
 * - ICT Risk Management (Articles 6-16)
 * - ICT-related Incident Management (Articles 17-23)
 * - Digital Operational Resilience Testing (Articles 24-27)
 * - Managing ICT Third-Party Risk (Articles 28-44)
 * - Information Sharing (Article 45)
 * - Information Register (Article 28(3))
 *
 * Applicable to: financial entities including banks, insurance companies,
 * investment firms, payment institutions, crypto-asset service providers,
 * and ICT third-party service providers.
 */

import prisma from '../config/database';
import logger from '../config/logger';

// =============================================================================
// Type Definitions
// =============================================================================

export type ICTRiskAssessmentType =
  | 'ict_risk'
  | 'cyber_risk'
  | 'operational_risk'
  | 'third_party_risk'
  | 'change_risk';

export type ICTRiskLevel = 'critical' | 'high' | 'medium' | 'low';

export type ICTRiskStatus =
  | 'draft'
  | 'in_progress'
  | 'completed'
  | 'approved'
  | 'archived';

export type ICTIncidentType =
  | 'cyber_attack'
  | 'system_failure'
  | 'data_breach'
  | 'service_disruption'
  | 'third_party_failure'
  | 'human_error';

export type ICTIncidentSeverity = 'critical' | 'major' | 'significant' | 'minor';

export type ICTIncidentStatus =
  | 'detected'
  | 'assessed'
  | 'contained'
  | 'eradicated'
  | 'recovered'
  | 'closed'
  | 'reported';

export type ICTIncidentClassification =
  | 'major_ict_incident'
  | 'significant_cyber_threat'
  | 'minor_incident';

export type ThirdPartyProviderType =
  | 'cloud_service'
  | 'ict_service'
  | 'data_analytics'
  | 'security_service'
  | 'network_infrastructure'
  | 'software_provider';

export type ThirdPartyCriticality = 'critical' | 'important' | 'standard' | 'low';

export type ResilienceTestType =
  | 'tlpt'
  | 'vulnerability_assessment'
  | 'penetration_test'
  | 'scenario_based'
  | 'tabletop_exercise'
  | 'red_team'
  | 'network_security'
  | 'open_source_analysis';

export type ResilienceTestStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'reviewed'
  | 'remediation';

export type AssetType =
  | 'application'
  | 'database'
  | 'network_device'
  | 'server'
  | 'cloud_service'
  | 'api'
  | 'middleware'
  | 'storage'
  | 'endpoint';

// =============================================================================
// DORA Pillar Weights for Compliance Scoring
// DORA has five core pillars; weights reflect regulatory emphasis.
// =============================================================================
const DORA_PILLAR_WEIGHTS = {
  ictRiskManagement: 0.25,       // Articles 6-16
  incidentManagement: 0.20,      // Articles 17-23
  resilienceTesting: 0.20,       // Articles 24-27
  thirdPartyRisk: 0.20,          // Articles 28-44
  informationRegister: 0.15,     // Article 28(3) + Article 45
} as const;

// =============================================================================
// ICT Risk Assessment — Articles 6-16
// =============================================================================

/**
 * Create a new ICT risk assessment
 */
export async function createICTRiskAssessment(data: {
  organizationId: string;
  title: string;
  description?: string;
  assessmentType: ICTRiskAssessmentType;
  scope?: string;
  methodology?: string;
  assessedBy?: string;
  ictAssets?: any;
  threats?: any;
  vulnerabilities?: any;
  controls?: any;
  riskTolerance?: any;
}) {
  try {
    const assessment = await prisma.dORAICTRiskAssessment.create({
      data: {
        organizationId: data.organizationId,
        title: data.title,
        description: data.description,
        assessmentType: data.assessmentType,
        scope: data.scope || 'organization_wide',
        methodology: data.methodology || 'hybrid',
        status: 'draft',
        assessedBy: data.assessedBy,
        ictAssets: data.ictAssets || [],
        threats: data.threats || [],
        vulnerabilities: data.vulnerabilities || [],
        controls: data.controls || [],
        riskTolerance: data.riskTolerance || {
          acceptableRiskLevel: 'medium',
          riskAppetite: 'moderate',
          thresholds: { critical: 20, high: 12, medium: 6, low: 1 },
        },
        assessmentDate: new Date(),
      },
    });

    logger.info('DORA ICT risk assessment created', {
      assessmentId: assessment.id,
      organizationId: data.organizationId,
      assessmentType: data.assessmentType,
    });

    return assessment;
  } catch (error: any) {
    logger.error('Failed to create ICT risk assessment', {
      error: error.message,
      organizationId: data.organizationId,
    });
    throw error;
  }
}

/**
 * List ICT risk assessments with filtering and pagination
 */
export async function listICTRiskAssessments(
  organizationId: string,
  filters?: {
    status?: ICTRiskStatus;
    assessmentType?: ICTRiskAssessmentType;
    riskLevel?: ICTRiskLevel;
    page?: number;
    limit?: number;
  }
) {
  const page = filters?.page || 1;
  const limit = Math.min(filters?.limit || 50, 100);
  const skip = (page - 1) * limit;

  const where: any = { organizationId };
  if (filters?.status) where.status = filters.status;
  if (filters?.assessmentType) where.assessmentType = filters.assessmentType;
  if (filters?.riskLevel) where.riskLevel = filters.riskLevel;

  const [assessments, total] = await Promise.all([
    prisma.dORAICTRiskAssessment.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.dORAICTRiskAssessment.count({ where }),
  ]);

  return {
    data: assessments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single ICT risk assessment by ID
 */
export async function getICTRiskAssessment(
  organizationId: string,
  assessmentId: string
) {
  const assessment = await prisma.dORAICTRiskAssessment.findFirst({
    where: { id: assessmentId, organizationId },
  });

  if (!assessment) {
    throw new Error('ICT risk assessment not found');
  }

  return assessment;
}

/**
 * Update an ICT risk assessment
 */
export async function updateICTRiskAssessment(
  organizationId: string,
  assessmentId: string,
  data: {
    title?: string;
    description?: string;
    status?: ICTRiskStatus;
    riskScore?: number;
    residualRiskScore?: number;
    riskLevel?: ICTRiskLevel;
    likelihood?: number;
    impact?: number;
    ictAssets?: any;
    threats?: any;
    vulnerabilities?: any;
    controls?: any;
    mitigationPlan?: any;
    findings?: any;
    riskTolerance?: any;
    approvedBy?: string;
    nextReviewDate?: string | Date;
  }
) {
  const existing = await prisma.dORAICTRiskAssessment.findFirst({
    where: { id: assessmentId, organizationId },
  });

  if (!existing) {
    throw new Error('ICT risk assessment not found');
  }

  // Auto-calculate risk score if likelihood and impact provided
  let riskScore = data.riskScore;
  let riskLevel = data.riskLevel;
  if (data.likelihood && data.impact) {
    riskScore = data.likelihood * data.impact;
    riskLevel = calculateICTRiskLevel(riskScore);
  }

  const updateData: any = { ...data };
  if (riskScore !== undefined) updateData.riskScore = riskScore;
  if (riskLevel !== undefined) updateData.riskLevel = riskLevel;
  if (data.nextReviewDate) {
    updateData.nextReviewDate = new Date(data.nextReviewDate);
  }
  if (data.status === 'completed' && !existing.completedAt) {
    updateData.completedAt = new Date();
  }

  const assessment = await prisma.dORAICTRiskAssessment.update({
    where: { id: assessmentId },
    data: updateData,
  });

  logger.info('DORA ICT risk assessment updated', {
    assessmentId,
    organizationId,
    status: assessment.status,
    riskLevel: assessment.riskLevel,
  });

  return assessment;
}

/**
 * Delete an ICT risk assessment
 */
export async function deleteICTRiskAssessment(
  organizationId: string,
  assessmentId: string
) {
  const existing = await prisma.dORAICTRiskAssessment.findFirst({
    where: { id: assessmentId, organizationId },
  });

  if (!existing) {
    throw new Error('ICT risk assessment not found');
  }

  await prisma.dORAICTRiskAssessment.delete({
    where: { id: assessmentId },
  });

  logger.info('DORA ICT risk assessment deleted', {
    assessmentId,
    organizationId,
  });

  return { success: true };
}

/**
 * Calculate a risk score for an ICT assessment based on threats, vulnerabilities, and controls
 */
export async function scoreICTRiskAssessment(
  organizationId: string,
  assessmentId: string
) {
  const assessment = await prisma.dORAICTRiskAssessment.findFirst({
    where: { id: assessmentId, organizationId },
  });

  if (!assessment) {
    throw new Error('ICT risk assessment not found');
  }

  const threats = (assessment.threats as any[]) || [];
  const vulnerabilities = (assessment.vulnerabilities as any[]) || [];
  const controls = (assessment.controls as any[]) || [];

  // Threat score: average of threat likelihoods (1-5 scale)
  const threatScore =
    threats.length > 0
      ? threats.reduce((sum: number, t: any) => sum + (t.likelihood || 3), 0) /
        threats.length
      : 3;

  // Vulnerability score: count severity-weighted vulns
  const vulnScore =
    vulnerabilities.length > 0
      ? vulnerabilities.reduce((sum: number, v: any) => {
          const severityMap: Record<string, number> = {
            critical: 5,
            high: 4,
            medium: 3,
            low: 2,
            info: 1,
          };
          return sum + (severityMap[v.severity] || 3);
        }, 0) / vulnerabilities.length
      : 2;

  // Control effectiveness: higher = better mitigation
  const controlEffectiveness =
    controls.length > 0
      ? controls.reduce((sum: number, c: any) => {
          const effectivenessMap: Record<string, number> = {
            effective: 0.8,
            partially_effective: 0.5,
            ineffective: 0.2,
            not_tested: 0.1,
          };
          return sum + (effectivenessMap[c.effectiveness] || 0.3);
        }, 0) / controls.length
      : 0.3;

  // Composite risk score: threat * vulnerability * (1 - control effectiveness), scaled 0-25
  const rawScore = threatScore * vulnScore * (1 - controlEffectiveness);
  const normalizedScore = Math.min(Math.round(rawScore * 2), 25);
  const riskLevel = calculateICTRiskLevel(normalizedScore);

  // Residual risk = raw risk minus control mitigation
  const residualRiskScore = Math.max(
    Math.round(normalizedScore * (1 - controlEffectiveness)),
    0
  );

  const updated = await prisma.dORAICTRiskAssessment.update({
    where: { id: assessmentId },
    data: {
      riskScore: normalizedScore,
      residualRiskScore,
      riskLevel,
    },
  });

  logger.info('DORA ICT risk assessment scored', {
    assessmentId,
    organizationId,
    riskScore: normalizedScore,
    residualRiskScore,
    riskLevel,
  });

  return {
    ...updated,
    scoring: {
      threatScore: Math.round(threatScore * 100) / 100,
      vulnerabilityScore: Math.round(vulnScore * 100) / 100,
      controlEffectiveness: Math.round(controlEffectiveness * 100) / 100,
      rawScore: Math.round(rawScore * 100) / 100,
      normalizedScore,
      residualRiskScore,
      riskLevel,
    },
  };
}

// =============================================================================
// ICT Incident Management — Articles 17-23
// =============================================================================

/**
 * Create a new ICT incident
 */
export async function createICTIncident(data: {
  organizationId: string;
  title: string;
  description?: string;
  incidentType: ICTIncidentType;
  severity?: ICTIncidentSeverity;
  affectedSystems?: any;
  affectedServices?: any;
  reportedBy?: string;
  assignedTo?: string;
}) {
  try {
    // Auto-classify based on severity per DORA Article 18
    const severity = data.severity || 'minor';
    const classification = classifyIncident(severity);

    const incident = await prisma.dORAICTIncident.create({
      data: {
        organizationId: data.organizationId,
        title: data.title,
        description: data.description,
        incidentType: data.incidentType,
        severity,
        status: 'detected',
        classification,
        affectedSystems: data.affectedSystems || [],
        affectedServices: data.affectedServices || [],
        reportedBy: data.reportedBy,
        assignedTo: data.assignedTo,
        escalationLevel: severity === 'critical' ? 2 : severity === 'major' ? 1 : 0,
        timeline: [
          {
            event: 'Incident detected',
            timestamp: new Date().toISOString(),
            actor: data.reportedBy || 'system',
            details: `${data.incidentType} incident reported`,
          },
        ],
        detectedAt: new Date(),
      },
    });

    logger.info('DORA ICT incident created', {
      incidentId: incident.id,
      organizationId: data.organizationId,
      incidentType: data.incidentType,
      severity,
      classification,
    });

    return incident;
  } catch (error: any) {
    logger.error('Failed to create ICT incident', {
      error: error.message,
      organizationId: data.organizationId,
    });
    throw error;
  }
}

/**
 * List ICT incidents with filtering and pagination
 */
export async function listICTIncidents(
  organizationId: string,
  filters?: {
    status?: ICTIncidentStatus;
    severity?: ICTIncidentSeverity;
    classification?: ICTIncidentClassification;
    incidentType?: ICTIncidentType;
    page?: number;
    limit?: number;
  }
) {
  const page = filters?.page || 1;
  const limit = Math.min(filters?.limit || 50, 100);
  const skip = (page - 1) * limit;

  const where: any = { organizationId };
  if (filters?.status) where.status = filters.status;
  if (filters?.severity) where.severity = filters.severity;
  if (filters?.classification) where.classification = filters.classification;
  if (filters?.incidentType) where.incidentType = filters.incidentType;

  const [incidents, total] = await Promise.all([
    prisma.dORAICTIncident.findMany({
      where,
      orderBy: [{ detectedAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.dORAICTIncident.count({ where }),
  ]);

  return {
    data: incidents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single ICT incident by ID
 */
export async function getICTIncident(
  organizationId: string,
  incidentId: string
) {
  const incident = await prisma.dORAICTIncident.findFirst({
    where: { id: incidentId, organizationId },
  });

  if (!incident) {
    throw new Error('ICT incident not found');
  }

  return incident;
}

/**
 * Update an ICT incident (status transitions, enrichment, etc.)
 */
export async function updateICTIncident(
  organizationId: string,
  incidentId: string,
  data: {
    title?: string;
    description?: string;
    severity?: ICTIncidentSeverity;
    status?: ICTIncidentStatus;
    classification?: ICTIncidentClassification;
    affectedSystems?: any;
    affectedServices?: any;
    impactAssessment?: any;
    rootCause?: string;
    rootCauseCategory?: string;
    containmentActions?: any;
    remediationActions?: any;
    lessonsLearned?: any;
    assignedTo?: string;
    reportedToAuthority?: boolean;
    authorityReportDate?: string | Date;
    authorityReference?: string;
    initialNotification?: any;
    intermediateReport?: any;
    finalReport?: any;
  }
) {
  const existing = await prisma.dORAICTIncident.findFirst({
    where: { id: incidentId, organizationId },
  });

  if (!existing) {
    throw new Error('ICT incident not found');
  }

  const updateData: any = { ...data };

  // Track status transitions in timeline
  if (data.status && data.status !== existing.status) {
    const currentTimeline = (existing.timeline as any[]) || [];
    currentTimeline.push({
      event: `Status changed to ${data.status}`,
      timestamp: new Date().toISOString(),
      actor: 'system',
      details: `Transitioned from ${existing.status} to ${data.status}`,
    });
    updateData.timeline = currentTimeline;

    // Set timestamp fields based on status
    if (data.status === 'contained' && !existing.containedAt) {
      updateData.containedAt = new Date();
    }
    if (
      (data.status === 'recovered' || data.status === 'closed') &&
      !existing.resolvedAt
    ) {
      updateData.resolvedAt = new Date();
    }
    if (data.status === 'closed' && !existing.closedAt) {
      updateData.closedAt = new Date();
    }
  }

  // Re-classify if severity changed
  if (data.severity && data.severity !== existing.severity) {
    updateData.classification = classifyIncident(data.severity);
  }

  if (data.authorityReportDate) {
    updateData.authorityReportDate = new Date(data.authorityReportDate);
  }

  const incident = await prisma.dORAICTIncident.update({
    where: { id: incidentId },
    data: updateData,
  });

  logger.info('DORA ICT incident updated', {
    incidentId,
    organizationId,
    status: incident.status,
    severity: incident.severity,
  });

  return incident;
}

/**
 * Escalate an ICT incident per DORA Article 19 reporting obligations
 *
 * Major ICT incidents must be reported to the competent authority:
 * - Initial notification: within 4 hours of classification as major
 * - Intermediate report: within 72 hours
 * - Final report: within 1 month
 */
export async function escalateIncident(
  organizationId: string,
  incidentId: string,
  data: {
    escalationLevel: number;
    reason: string;
    escalatedBy: string;
  }
) {
  const existing = await prisma.dORAICTIncident.findFirst({
    where: { id: incidentId, organizationId },
  });

  if (!existing) {
    throw new Error('ICT incident not found');
  }

  const currentTimeline = (existing.timeline as any[]) || [];
  currentTimeline.push({
    event: `Escalated to level ${data.escalationLevel}`,
    timestamp: new Date().toISOString(),
    actor: data.escalatedBy,
    details: data.reason,
  });

  const updateData: any = {
    escalationLevel: data.escalationLevel,
    timeline: currentTimeline,
  };

  // If escalated to regulator level (4), mark as needing authority report
  if (data.escalationLevel >= 4) {
    updateData.reportedToAuthority = true;
    updateData.authorityReportDate = new Date();
    updateData.status = 'reported';
    updateData.initialNotification = {
      notifiedAt: new Date().toISOString(),
      notifiedBy: data.escalatedBy,
      channel: 'regulatory_portal',
      recipients: ['competent_authority'],
    };
  }

  const incident = await prisma.dORAICTIncident.update({
    where: { id: incidentId },
    data: updateData,
  });

  logger.info('DORA ICT incident escalated', {
    incidentId,
    organizationId,
    escalationLevel: data.escalationLevel,
    reportedToAuthority: updateData.reportedToAuthority || false,
  });

  return incident;
}

// =============================================================================
// Third-Party ICT Providers — Articles 28-44
// =============================================================================

/**
 * Create a new third-party ICT provider record
 */
export async function createThirdPartyProvider(data: {
  organizationId: string;
  providerName: string;
  providerType: ThirdPartyProviderType;
  criticality?: ThirdPartyCriticality;
  contractDetails?: any;
  servicesProvided?: any;
  complianceCertifications?: any;
  dataLocations?: any;
  contactDetails?: any;
  jurisdiction?: string;
  exitStrategy?: any;
  auditRights?: any;
}) {
  try {
    const provider = await prisma.dORAThirdPartyProvider.create({
      data: {
        organizationId: data.organizationId,
        providerName: data.providerName,
        providerType: data.providerType,
        criticality: data.criticality || 'standard',
        status: 'onboarding',
        contractDetails: data.contractDetails || {},
        servicesProvided: data.servicesProvided || [],
        complianceCertifications: data.complianceCertifications || [],
        dataLocations: data.dataLocations || [],
        contactDetails: data.contactDetails || {},
        jurisdiction: data.jurisdiction,
        exitStrategy: data.exitStrategy || {
          plan: '',
          transitionPeriod: '',
          dataPortability: false,
          alternativeProviders: [],
        },
        auditRights: data.auditRights || {
          rightToAudit: false,
          lastAuditDate: null,
          nextAuditDate: null,
          findings: [],
        },
        onboardingDate: new Date(),
      },
    });

    logger.info('DORA third-party provider created', {
      providerId: provider.id,
      organizationId: data.organizationId,
      providerName: data.providerName,
      providerType: data.providerType,
      criticality: provider.criticality,
    });

    return provider;
  } catch (error: any) {
    logger.error('Failed to create third-party provider', {
      error: error.message,
      organizationId: data.organizationId,
    });
    throw error;
  }
}

/**
 * List third-party providers with filtering and pagination
 */
export async function listThirdPartyProviders(
  organizationId: string,
  filters?: {
    criticality?: ThirdPartyCriticality;
    providerType?: ThirdPartyProviderType;
    status?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = filters?.page || 1;
  const limit = Math.min(filters?.limit || 50, 100);
  const skip = (page - 1) * limit;

  const where: any = { organizationId };
  if (filters?.criticality) where.criticality = filters.criticality;
  if (filters?.providerType) where.providerType = filters.providerType;
  if (filters?.status) where.status = filters.status;

  const [providers, total] = await Promise.all([
    prisma.dORAThirdPartyProvider.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.dORAThirdPartyProvider.count({ where }),
  ]);

  return {
    data: providers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single third-party provider by ID
 */
export async function getThirdPartyProvider(
  organizationId: string,
  providerId: string
) {
  const provider = await prisma.dORAThirdPartyProvider.findFirst({
    where: { id: providerId, organizationId },
  });

  if (!provider) {
    throw new Error('Third-party provider not found');
  }

  return provider;
}

/**
 * Update a third-party provider
 */
export async function updateThirdPartyProvider(
  organizationId: string,
  providerId: string,
  data: {
    providerName?: string;
    providerType?: ThirdPartyProviderType;
    criticality?: ThirdPartyCriticality;
    status?: string;
    contractDetails?: any;
    servicesProvided?: any;
    riskAssessment?: any;
    concentrationRisk?: any;
    subcontractors?: any;
    complianceCertifications?: any;
    dataLocations?: any;
    exitStrategy?: any;
    auditRights?: any;
    incidentHistory?: any;
    performanceMetrics?: any;
    contactDetails?: any;
    jurisdiction?: string;
    nextReviewDate?: string | Date;
  }
) {
  const existing = await prisma.dORAThirdPartyProvider.findFirst({
    where: { id: providerId, organizationId },
  });

  if (!existing) {
    throw new Error('Third-party provider not found');
  }

  const updateData: any = { ...data };
  if (data.nextReviewDate) {
    updateData.nextReviewDate = new Date(data.nextReviewDate);
  }

  const provider = await prisma.dORAThirdPartyProvider.update({
    where: { id: providerId },
    data: updateData,
  });

  logger.info('DORA third-party provider updated', {
    providerId,
    organizationId,
    providerName: provider.providerName,
  });

  return provider;
}

/**
 * Delete a third-party provider record
 */
export async function deleteThirdPartyProvider(
  organizationId: string,
  providerId: string
) {
  const existing = await prisma.dORAThirdPartyProvider.findFirst({
    where: { id: providerId, organizationId },
  });

  if (!existing) {
    throw new Error('Third-party provider not found');
  }

  await prisma.dORAThirdPartyProvider.delete({
    where: { id: providerId },
  });

  logger.info('DORA third-party provider deleted', {
    providerId,
    organizationId,
  });

  return { success: true };
}

/**
 * Assess concentration risk across all third-party ICT providers
 *
 * DORA Article 29 requires financial entities to identify and assess
 * concentration risks arising from dependency on a limited number of
 * ICT third-party service providers.
 */
export async function assessConcentrationRisk(organizationId: string) {
  const providers = await prisma.dORAThirdPartyProvider.findMany({
    where: { organizationId, status: { not: 'terminated' } },
  });

  if (providers.length === 0) {
    return {
      overallConcentrationRisk: 'low',
      score: 0,
      totalProviders: 0,
      findings: [],
      recommendations: [
        'No active ICT third-party providers registered. Register all ICT providers per DORA Article 28(3).',
      ],
    };
  }

  const findings: any[] = [];
  let concentrationScore = 0;

  // 1. Analyze criticality distribution
  const criticalProviders = providers.filter(
    (p) => p.criticality === 'critical'
  );
  const importantProviders = providers.filter(
    (p) => p.criticality === 'important'
  );
  const criticalRatio = criticalProviders.length / providers.length;

  if (criticalRatio > 0.3) {
    concentrationScore += 20;
    findings.push({
      type: 'high_critical_ratio',
      severity: 'high',
      description: `${Math.round(criticalRatio * 100)}% of providers are classified as critical (${criticalProviders.length}/${providers.length})`,
      recommendation:
        'Review critical provider classifications and develop fallback arrangements',
    });
  }

  // 2. Analyze provider type concentration
  const typeDistribution: Record<string, number> = {};
  providers.forEach((p) => {
    typeDistribution[p.providerType] =
      (typeDistribution[p.providerType] || 0) + 1;
  });

  Object.entries(typeDistribution).forEach(([type, count]) => {
    if (count === 1 && criticalProviders.some((p) => p.providerType === type)) {
      concentrationScore += 15;
      findings.push({
        type: 'single_point_of_failure',
        severity: 'critical',
        description: `Single critical provider for ${type} services`,
        recommendation: `Identify alternative ${type} providers to reduce single point of failure risk`,
      });
    }
  });

  // 3. Analyze jurisdictional concentration
  const jurisdictionDistribution: Record<string, number> = {};
  providers.forEach((p) => {
    const jurisdiction = p.jurisdiction || 'unknown';
    jurisdictionDistribution[jurisdiction] =
      (jurisdictionDistribution[jurisdiction] || 0) + 1;
  });

  const dominantJurisdiction = Object.entries(jurisdictionDistribution).sort(
    (a, b) => b[1] - a[1]
  )[0];
  if (
    dominantJurisdiction &&
    dominantJurisdiction[1] / providers.length > 0.7
  ) {
    concentrationScore += 10;
    findings.push({
      type: 'jurisdictional_concentration',
      severity: 'medium',
      description: `${Math.round((dominantJurisdiction[1] / providers.length) * 100)}% of providers operate from ${dominantJurisdiction[0]}`,
      recommendation:
        'Consider geographic diversification of ICT service providers',
    });
  }

  // 4. Check for exit strategy completeness
  const providersWithoutExitStrategy = providers.filter((p) => {
    const exit = p.exitStrategy as any;
    return (
      !exit ||
      !exit.plan ||
      exit.plan === '' ||
      (exit.alternativeProviders && exit.alternativeProviders.length === 0)
    );
  });

  if (providersWithoutExitStrategy.length > 0) {
    const ratio = providersWithoutExitStrategy.length / providers.length;
    concentrationScore += Math.round(ratio * 15);
    findings.push({
      type: 'missing_exit_strategies',
      severity: ratio > 0.5 ? 'high' : 'medium',
      description: `${providersWithoutExitStrategy.length} provider(s) lack complete exit strategies`,
      recommendation:
        'Develop exit strategies for all ICT third-party providers per DORA Article 28(8)',
    });
  }

  // 5. Check subcontractor chains
  const providersWithSubcontractors = providers.filter((p) => {
    const subs = p.subcontractors as any[];
    return subs && subs.length > 0;
  });

  if (providersWithSubcontractors.length > 0) {
    const totalSubs = providersWithSubcontractors.reduce((sum, p) => {
      const subs = p.subcontractors as any[];
      return sum + (subs ? subs.length : 0);
    }, 0);

    if (totalSubs > providers.length * 2) {
      concentrationScore += 10;
      findings.push({
        type: 'subcontractor_chain_risk',
        severity: 'medium',
        description: `${totalSubs} subcontractors identified across ${providersWithSubcontractors.length} providers`,
        recommendation:
          'Assess risks from subcontracting chains and ensure contractual flow-down per DORA Article 29',
      });
    }
  }

  // Determine overall concentration risk level
  const overallRisk =
    concentrationScore >= 50
      ? 'critical'
      : concentrationScore >= 30
        ? 'high'
        : concentrationScore >= 15
          ? 'medium'
          : 'low';

  const recommendations: string[] = [];
  if (overallRisk === 'critical' || overallRisk === 'high') {
    recommendations.push(
      'Develop a comprehensive ICT third-party provider diversification strategy'
    );
    recommendations.push(
      'Ensure all critical and important providers have documented exit strategies'
    );
    recommendations.push(
      'Conduct annual concentration risk assessments per DORA Article 29'
    );
  }
  if (criticalProviders.length > 0) {
    recommendations.push(
      'Implement enhanced monitoring for all critical ICT third-party service providers'
    );
  }

  logger.info('DORA concentration risk assessment completed', {
    organizationId,
    overallRisk,
    concentrationScore,
    totalProviders: providers.length,
    criticalProviders: criticalProviders.length,
  });

  return {
    overallConcentrationRisk: overallRisk,
    score: concentrationScore,
    totalProviders: providers.length,
    criticalProviders: criticalProviders.length,
    importantProviders: importantProviders.length,
    distribution: {
      byType: typeDistribution,
      byJurisdiction: jurisdictionDistribution,
      byCriticality: {
        critical: criticalProviders.length,
        important: importantProviders.length,
        standard: providers.filter((p) => p.criticality === 'standard').length,
        low: providers.filter((p) => p.criticality === 'low').length,
      },
    },
    findings,
    recommendations,
  };
}

// =============================================================================
// Resilience Testing — Articles 24-27
// =============================================================================

/**
 * Create a new resilience test
 */
export async function createResilienceTest(data: {
  organizationId: string;
  testName: string;
  testType: ResilienceTestType;
  scope?: string;
  methodology?: string;
  priority?: string;
  targetSystems?: any;
  testScenarios?: any;
  testPlan?: any;
  threatIntelligence?: any;
  conductedBy?: string;
  externalTesters?: any;
  plannedDate?: string | Date;
}) {
  try {
    const test = await prisma.dORAResilienceTest.create({
      data: {
        organizationId: data.organizationId,
        testName: data.testName,
        testType: data.testType,
        scope: data.scope,
        methodology: data.methodology || (data.testType === 'tlpt' ? 'TIBER_EU' : 'custom'),
        status: 'planned',
        priority: data.priority || 'medium',
        targetSystems: data.targetSystems || [],
        testScenarios: data.testScenarios || [],
        testPlan: data.testPlan || {
          objectives: [],
          prerequisites: [],
          timeline: [],
          resources: [],
          constraints: [],
        },
        threatIntelligence: data.threatIntelligence || {},
        conductedBy: data.conductedBy,
        externalTesters: data.externalTesters || [],
        plannedDate: data.plannedDate ? new Date(data.plannedDate) : null,
      },
    });

    logger.info('DORA resilience test created', {
      testId: test.id,
      organizationId: data.organizationId,
      testType: data.testType,
    });

    return test;
  } catch (error: any) {
    logger.error('Failed to create resilience test', {
      error: error.message,
      organizationId: data.organizationId,
    });
    throw error;
  }
}

/**
 * List resilience tests with filtering and pagination
 */
export async function listResilienceTests(
  organizationId: string,
  filters?: {
    testType?: ResilienceTestType;
    status?: ResilienceTestStatus;
    priority?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = filters?.page || 1;
  const limit = Math.min(filters?.limit || 50, 100);
  const skip = (page - 1) * limit;

  const where: any = { organizationId };
  if (filters?.testType) where.testType = filters.testType;
  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;

  const [tests, total] = await Promise.all([
    prisma.dORAResilienceTest.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.dORAResilienceTest.count({ where }),
  ]);

  return {
    data: tests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single resilience test by ID
 */
export async function getResilienceTest(
  organizationId: string,
  testId: string
) {
  const test = await prisma.dORAResilienceTest.findFirst({
    where: { id: testId, organizationId },
  });

  if (!test) {
    throw new Error('Resilience test not found');
  }

  return test;
}

/**
 * Update a resilience test
 */
export async function updateResilienceTest(
  organizationId: string,
  testId: string,
  data: {
    testName?: string;
    scope?: string;
    methodology?: string;
    status?: ResilienceTestStatus;
    priority?: string;
    targetSystems?: any;
    testScenarios?: any;
    testPlan?: any;
    findings?: any;
    results?: any;
    remediationPlan?: any;
    threatIntelligence?: any;
    conductedBy?: string;
    reviewedBy?: string;
    externalTesters?: any;
    nextTestDate?: string | Date;
  }
) {
  const existing = await prisma.dORAResilienceTest.findFirst({
    where: { id: testId, organizationId },
  });

  if (!existing) {
    throw new Error('Resilience test not found');
  }

  const updateData: any = { ...data };
  if (data.nextTestDate) {
    updateData.nextTestDate = new Date(data.nextTestDate);
  }
  if (data.status === 'in_progress' && !existing.startedAt) {
    updateData.startedAt = new Date();
  }
  if (data.status === 'completed' && !existing.completedAt) {
    updateData.completedAt = new Date();
  }

  const test = await prisma.dORAResilienceTest.update({
    where: { id: testId },
    data: updateData,
  });

  logger.info('DORA resilience test updated', {
    testId,
    organizationId,
    status: test.status,
  });

  return test;
}

/**
 * Delete a resilience test
 */
export async function deleteResilienceTest(
  organizationId: string,
  testId: string
) {
  const existing = await prisma.dORAResilienceTest.findFirst({
    where: { id: testId, organizationId },
  });

  if (!existing) {
    throw new Error('Resilience test not found');
  }

  await prisma.dORAResilienceTest.delete({
    where: { id: testId },
  });

  logger.info('DORA resilience test deleted', {
    testId,
    organizationId,
  });

  return { success: true };
}

/**
 * Execute a resilience test — transition to in_progress and generate initial findings
 *
 * For TLPT (Threat-Led Penetration Testing), DORA Article 26 requires:
 * - Tests performed at least every 3 years
 * - Conducted by qualified external testers
 * - Based on real threat intelligence
 * - Covers critical functions and services
 */
export async function executeResilienceTest(
  organizationId: string,
  testId: string,
  executionData: {
    executedBy: string;
    threatIntelligence?: any;
    testScenarios?: any;
  }
) {
  const existing = await prisma.dORAResilienceTest.findFirst({
    where: { id: testId, organizationId },
  });

  if (!existing) {
    throw new Error('Resilience test not found');
  }

  if (existing.status !== 'planned') {
    throw new Error(
      `Cannot execute test in status "${existing.status}". Test must be in "planned" status.`
    );
  }

  // Validate TLPT-specific requirements
  if (existing.testType === 'tlpt') {
    const externalTesters = (existing.externalTesters as any[]) || [];
    if (externalTesters.length === 0) {
      throw new Error(
        'TLPT requires qualified external testers per DORA Article 26(8). Add external testers before execution.'
      );
    }
  }

  const scenarios = executionData.testScenarios ||
    (existing.testScenarios as any[]) || [];
  const targetSystems = (existing.targetSystems as any[]) || [];

  // Generate preliminary findings structure based on test type
  const findings = generateTestFindings(existing.testType, scenarios, targetSystems);

  const test = await prisma.dORAResilienceTest.update({
    where: { id: testId },
    data: {
      status: 'in_progress',
      startedAt: new Date(),
      conductedBy: executionData.executedBy,
      threatIntelligence:
        executionData.threatIntelligence || existing.threatIntelligence,
      testScenarios: scenarios.length > 0 ? scenarios : existing.testScenarios,
      findings,
    },
  });

  logger.info('DORA resilience test execution started', {
    testId,
    organizationId,
    testType: test.testType,
    executedBy: executionData.executedBy,
  });

  return test;
}

// =============================================================================
// Information Register — Article 28(3)
// =============================================================================

/**
 * Create a new ICT asset entry in the information register
 */
export async function createInformationRegisterEntry(data: {
  organizationId: string;
  assetName: string;
  assetType: AssetType;
  description?: string;
  criticality?: string;
  owner?: string;
  department?: string;
  classification?: string;
  thirdPartyProvider?: string;
  thirdPartyProviderId?: string;
  contractualArrangement?: any;
  dataProcessed?: any;
  dependencies?: any;
  networkConnections?: any;
  location?: string;
  businessFunction?: string;
  recoveryTimeObjective?: number;
  recoveryPointObjective?: number;
}) {
  try {
    const entry = await prisma.dORAInformationRegister.create({
      data: {
        organizationId: data.organizationId,
        assetName: data.assetName,
        assetType: data.assetType,
        description: data.description,
        criticality: data.criticality || 'medium',
        owner: data.owner,
        department: data.department,
        classification: data.classification || 'internal',
        thirdPartyProvider: data.thirdPartyProvider,
        thirdPartyProviderId: data.thirdPartyProviderId,
        contractualArrangement: data.contractualArrangement || {},
        dataProcessed: data.dataProcessed || [],
        dependencies: data.dependencies || [],
        networkConnections: data.networkConnections || [],
        complianceStatus: 'not_assessed',
        location: data.location,
        businessFunction: data.businessFunction,
        recoveryTimeObjective: data.recoveryTimeObjective,
        recoveryPointObjective: data.recoveryPointObjective,
        status: 'active',
      },
    });

    logger.info('DORA information register entry created', {
      entryId: entry.id,
      organizationId: data.organizationId,
      assetType: data.assetType,
      criticality: entry.criticality,
    });

    return entry;
  } catch (error: any) {
    logger.error('Failed to create information register entry', {
      error: error.message,
      organizationId: data.organizationId,
    });
    throw error;
  }
}

/**
 * List information register entries with filtering and pagination
 */
export async function listInformationRegister(
  organizationId: string,
  filters?: {
    assetType?: AssetType;
    criticality?: string;
    status?: string;
    classification?: string;
    complianceStatus?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = filters?.page || 1;
  const limit = Math.min(filters?.limit || 50, 100);
  const skip = (page - 1) * limit;

  const where: any = { organizationId };
  if (filters?.assetType) where.assetType = filters.assetType;
  if (filters?.criticality) where.criticality = filters.criticality;
  if (filters?.status) where.status = filters.status;
  if (filters?.classification) where.classification = filters.classification;
  if (filters?.complianceStatus) where.complianceStatus = filters.complianceStatus;

  const [entries, total] = await Promise.all([
    prisma.dORAInformationRegister.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.dORAInformationRegister.count({ where }),
  ]);

  return {
    data: entries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single information register entry by ID
 */
export async function getInformationRegisterEntry(
  organizationId: string,
  entryId: string
) {
  const entry = await prisma.dORAInformationRegister.findFirst({
    where: { id: entryId, organizationId },
  });

  if (!entry) {
    throw new Error('Information register entry not found');
  }

  return entry;
}

/**
 * Update an information register entry
 */
export async function updateInformationRegisterEntry(
  organizationId: string,
  entryId: string,
  data: {
    assetName?: string;
    assetType?: AssetType;
    description?: string;
    criticality?: string;
    owner?: string;
    department?: string;
    classification?: string;
    thirdPartyProvider?: string;
    thirdPartyProviderId?: string;
    contractualArrangement?: any;
    dataProcessed?: any;
    dependencies?: any;
    networkConnections?: any;
    complianceStatus?: string;
    riskScore?: number;
    location?: string;
    businessFunction?: string;
    recoveryTimeObjective?: number;
    recoveryPointObjective?: number;
    status?: string;
  }
) {
  const existing = await prisma.dORAInformationRegister.findFirst({
    where: { id: entryId, organizationId },
  });

  if (!existing) {
    throw new Error('Information register entry not found');
  }

  const updateData: any = { ...data };
  if (data.complianceStatus && data.complianceStatus !== 'not_assessed') {
    updateData.lastAssessmentDate = new Date();
  }

  const entry = await prisma.dORAInformationRegister.update({
    where: { id: entryId },
    data: updateData,
  });

  logger.info('DORA information register entry updated', {
    entryId,
    organizationId,
    assetName: entry.assetName,
  });

  return entry;
}

/**
 * Delete an information register entry
 */
export async function deleteInformationRegisterEntry(
  organizationId: string,
  entryId: string
) {
  const existing = await prisma.dORAInformationRegister.findFirst({
    where: { id: entryId, organizationId },
  });

  if (!existing) {
    throw new Error('Information register entry not found');
  }

  await prisma.dORAInformationRegister.delete({
    where: { id: entryId },
  });

  logger.info('DORA information register entry deleted', {
    entryId,
    organizationId,
  });

  return { success: true };
}

// =============================================================================
// DORA Dashboard & Compliance Scoring
// =============================================================================

/**
 * Get a comprehensive DORA compliance dashboard
 */
export async function getDORADashboard(organizationId: string) {
  const [
    // Risk assessments
    totalRiskAssessments,
    draftRiskAssessments,
    completedRiskAssessments,
    criticalRiskAssessments,
    highRiskAssessments,

    // Incidents
    totalIncidents,
    openIncidents,
    criticalIncidents,
    majorIncidents,
    reportedIncidents,

    // Third-party providers
    totalProviders,
    criticalProviders,
    importantProviders,
    activeProviders,

    // Resilience tests
    totalTests,
    plannedTests,
    completedTests,
    tlptTests,

    // Information register
    totalAssets,
    criticalAssets,
    compliantAssets,
    nonCompliantAssets,
  ] = await Promise.all([
    // Risk assessments
    prisma.dORAICTRiskAssessment.count({ where: { organizationId } }),
    prisma.dORAICTRiskAssessment.count({
      where: { organizationId, status: 'draft' },
    }),
    prisma.dORAICTRiskAssessment.count({
      where: { organizationId, status: 'completed' },
    }),
    prisma.dORAICTRiskAssessment.count({
      where: { organizationId, riskLevel: 'critical' },
    }),
    prisma.dORAICTRiskAssessment.count({
      where: { organizationId, riskLevel: 'high' },
    }),

    // Incidents
    prisma.dORAICTIncident.count({ where: { organizationId } }),
    prisma.dORAICTIncident.count({
      where: {
        organizationId,
        status: { in: ['detected', 'assessed', 'contained'] },
      },
    }),
    prisma.dORAICTIncident.count({
      where: { organizationId, severity: 'critical' },
    }),
    prisma.dORAICTIncident.count({
      where: { organizationId, severity: 'major' },
    }),
    prisma.dORAICTIncident.count({
      where: { organizationId, reportedToAuthority: true },
    }),

    // Third-party providers
    prisma.dORAThirdPartyProvider.count({ where: { organizationId } }),
    prisma.dORAThirdPartyProvider.count({
      where: { organizationId, criticality: 'critical' },
    }),
    prisma.dORAThirdPartyProvider.count({
      where: { organizationId, criticality: 'important' },
    }),
    prisma.dORAThirdPartyProvider.count({
      where: { organizationId, status: 'active' },
    }),

    // Resilience tests
    prisma.dORAResilienceTest.count({ where: { organizationId } }),
    prisma.dORAResilienceTest.count({
      where: { organizationId, status: 'planned' },
    }),
    prisma.dORAResilienceTest.count({
      where: { organizationId, status: 'completed' },
    }),
    prisma.dORAResilienceTest.count({
      where: { organizationId, testType: 'tlpt' },
    }),

    // Information register
    prisma.dORAInformationRegister.count({ where: { organizationId } }),
    prisma.dORAInformationRegister.count({
      where: { organizationId, criticality: 'critical' },
    }),
    prisma.dORAInformationRegister.count({
      where: { organizationId, complianceStatus: 'compliant' },
    }),
    prisma.dORAInformationRegister.count({
      where: { organizationId, complianceStatus: 'non_compliant' },
    }),
  ]);

  // Calculate compliance score
  const complianceScore = await calculateDORAComplianceScore(organizationId);

  // Get recent incidents for timeline
  const recentIncidents = await prisma.dORAICTIncident.findMany({
    where: { organizationId },
    orderBy: { detectedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      severity: true,
      status: true,
      detectedAt: true,
    },
  });

  // Get upcoming test deadlines
  const upcomingTests = await prisma.dORAResilienceTest.findMany({
    where: {
      organizationId,
      status: 'planned',
      plannedDate: { not: null },
    },
    orderBy: { plannedDate: 'asc' },
    take: 5,
    select: {
      id: true,
      testName: true,
      testType: true,
      plannedDate: true,
      priority: true,
    },
  });

  // Get overdue review dates for providers
  const now = new Date();
  const overdueProviderReviews = await prisma.dORAThirdPartyProvider.count({
    where: {
      organizationId,
      status: 'active',
      nextReviewDate: { lt: now },
    },
  });

  // Get overdue risk assessment reviews
  const overdueRiskReviews = await prisma.dORAICTRiskAssessment.count({
    where: {
      organizationId,
      status: { in: ['completed', 'approved'] },
      nextReviewDate: { lt: now },
    },
  });

  return {
    complianceScore,
    ictRiskManagement: {
      totalAssessments: totalRiskAssessments,
      draftAssessments: draftRiskAssessments,
      completedAssessments: completedRiskAssessments,
      riskDistribution: {
        critical: criticalRiskAssessments,
        high: highRiskAssessments,
      },
      overdueReviews: overdueRiskReviews,
    },
    incidentManagement: {
      totalIncidents,
      openIncidents,
      criticalIncidents,
      majorIncidents,
      reportedToAuthority: reportedIncidents,
      recentIncidents,
    },
    thirdPartyRisk: {
      totalProviders,
      criticalProviders,
      importantProviders,
      activeProviders,
      overdueReviews: overdueProviderReviews,
    },
    resilienceTesting: {
      totalTests,
      plannedTests,
      completedTests,
      tlptTests,
      upcomingTests,
    },
    informationRegister: {
      totalAssets,
      criticalAssets,
      compliantAssets,
      nonCompliantAssets,
    },
  };
}

/**
 * Calculate overall DORA compliance score (0-100)
 *
 * Scoring methodology based on DORA's five pillars:
 * 1. ICT Risk Management (25%) - Articles 6-16
 * 2. ICT Incident Management (20%) - Articles 17-23
 * 3. Resilience Testing (20%) - Articles 24-27
 * 4. Third-Party Risk (20%) - Articles 28-44
 * 5. Information Register (15%) - Article 28(3)
 */
export async function calculateDORAComplianceScore(organizationId: string) {
  const [
    riskAssessments,
    incidents,
    providers,
    tests,
    assets,
  ] = await Promise.all([
    prisma.dORAICTRiskAssessment.findMany({
      where: { organizationId },
      select: {
        status: true,
        riskLevel: true,
        riskScore: true,
        residualRiskScore: true,
        mitigationPlan: true,
        nextReviewDate: true,
        controls: true,
      },
    }),
    prisma.dORAICTIncident.findMany({
      where: { organizationId },
      select: {
        status: true,
        severity: true,
        classification: true,
        reportedToAuthority: true,
        containmentActions: true,
        remediationActions: true,
        lessonsLearned: true,
        rootCause: true,
        closedAt: true,
        detectedAt: true,
        containedAt: true,
      },
    }),
    prisma.dORAThirdPartyProvider.findMany({
      where: { organizationId, status: { not: 'terminated' } },
      select: {
        criticality: true,
        exitStrategy: true,
        auditRights: true,
        riskAssessment: true,
        complianceCertifications: true,
        nextReviewDate: true,
        concentrationRisk: true,
      },
    }),
    prisma.dORAResilienceTest.findMany({
      where: { organizationId },
      select: {
        testType: true,
        status: true,
        findings: true,
        results: true,
        remediationPlan: true,
        completedAt: true,
      },
    }),
    prisma.dORAInformationRegister.findMany({
      where: { organizationId, status: 'active' },
      select: {
        criticality: true,
        complianceStatus: true,
        thirdPartyProvider: true,
        dependencies: true,
        recoveryTimeObjective: true,
        recoveryPointObjective: true,
      },
    }),
  ]);

  const now = new Date();
  const pillarScores: Record<string, { score: number; maxScore: number; details: string[] }> = {
    ictRiskManagement: { score: 0, maxScore: 100, details: [] },
    incidentManagement: { score: 0, maxScore: 100, details: [] },
    resilienceTesting: { score: 0, maxScore: 100, details: [] },
    thirdPartyRisk: { score: 0, maxScore: 100, details: [] },
    informationRegister: { score: 0, maxScore: 100, details: [] },
  };

  // --- Pillar 1: ICT Risk Management ---
  if (riskAssessments.length === 0) {
    pillarScores.ictRiskManagement.details.push(
      'No ICT risk assessments found. At least one comprehensive assessment is required.'
    );
  } else {
    // Completed assessments ratio (0-30 pts)
    const completedRatio =
      riskAssessments.filter((r) => r.status === 'completed' || r.status === 'approved').length /
      riskAssessments.length;
    pillarScores.ictRiskManagement.score += Math.round(completedRatio * 30);

    // Assessments with mitigation plans (0-25 pts)
    const withMitigation = riskAssessments.filter((r) => {
      const plan = r.mitigationPlan as any[];
      return plan && plan.length > 0;
    }).length;
    pillarScores.ictRiskManagement.score += Math.round(
      (withMitigation / riskAssessments.length) * 25
    );

    // Controls documented (0-25 pts)
    const withControls = riskAssessments.filter((r) => {
      const ctrls = r.controls as any[];
      return ctrls && ctrls.length > 0;
    }).length;
    pillarScores.ictRiskManagement.score += Math.round(
      (withControls / riskAssessments.length) * 25
    );

    // Review dates current (0-20 pts)
    const upToDate = riskAssessments.filter(
      (r) => r.nextReviewDate && r.nextReviewDate >= now
    ).length;
    pillarScores.ictRiskManagement.score += Math.round(
      (upToDate / riskAssessments.length) * 20
    );

    if (completedRatio < 0.5) {
      pillarScores.ictRiskManagement.details.push(
        'Less than 50% of risk assessments are completed. Prioritize completing assessments.'
      );
    }
  }

  // --- Pillar 2: ICT Incident Management ---
  if (incidents.length === 0) {
    // No incidents could be good; give partial credit for readiness
    pillarScores.incidentManagement.score = 60;
    pillarScores.incidentManagement.details.push(
      'No incidents recorded. Ensure incident detection and reporting processes are in place.'
    );
  } else {
    // Incidents with root cause analysis (0-25 pts)
    const withRCA = incidents.filter((i) => i.rootCause).length;
    pillarScores.incidentManagement.score += Math.round(
      (withRCA / incidents.length) * 25
    );

    // Major incidents reported to authority (0-25 pts)
    const majorIncidents = incidents.filter(
      (i) =>
        i.classification === 'major_ict_incident' ||
        i.severity === 'critical' ||
        i.severity === 'major'
    );
    if (majorIncidents.length > 0) {
      const reportedMajor = majorIncidents.filter(
        (i) => i.reportedToAuthority
      ).length;
      pillarScores.incidentManagement.score += Math.round(
        (reportedMajor / majorIncidents.length) * 25
      );
      if (reportedMajor < majorIncidents.length) {
        pillarScores.incidentManagement.details.push(
          `${majorIncidents.length - reportedMajor} major incident(s) not reported to authority. DORA requires reporting within 4 hours.`
        );
      }
    } else {
      pillarScores.incidentManagement.score += 25;
    }

    // Closed/resolved ratio (0-25 pts)
    const closedRatio =
      incidents.filter((i) => i.status === 'closed' || i.status === 'recovered').length /
      incidents.length;
    pillarScores.incidentManagement.score += Math.round(closedRatio * 25);

    // Lessons learned documented (0-25 pts)
    const withLessons = incidents.filter((i) => {
      const lessons = i.lessonsLearned as any[];
      return lessons && lessons.length > 0;
    }).length;
    pillarScores.incidentManagement.score += Math.round(
      (withLessons / incidents.length) * 25
    );
  }

  // --- Pillar 3: Resilience Testing ---
  if (tests.length === 0) {
    pillarScores.resilienceTesting.details.push(
      'No resilience tests found. DORA requires regular testing of ICT systems.'
    );
  } else {
    // Completed tests ratio (0-30 pts)
    const completedTests = tests.filter(
      (t) => t.status === 'completed' || t.status === 'reviewed'
    ).length;
    pillarScores.resilienceTesting.score += Math.round(
      (completedTests / tests.length) * 30
    );

    // TLPT presence (0-25 pts) - required for significant financial entities
    const hasTLPT = tests.some(
      (t) => t.testType === 'tlpt' && (t.status === 'completed' || t.status === 'reviewed')
    );
    if (hasTLPT) {
      pillarScores.resilienceTesting.score += 25;
    } else {
      pillarScores.resilienceTesting.details.push(
        'No completed TLPT found. DORA Article 26 requires TLPT at least every 3 years.'
      );
    }

    // Tests with documented findings (0-25 pts)
    const withFindings = tests.filter((t) => {
      const findings = t.findings as any[];
      return findings && findings.length > 0;
    }).length;
    pillarScores.resilienceTesting.score += Math.round(
      (withFindings / tests.length) * 25
    );

    // Remediation follow-up (0-20 pts)
    const withRemediation = tests.filter((t) => {
      const plan = t.remediationPlan as any[];
      return plan && plan.length > 0;
    }).length;
    pillarScores.resilienceTesting.score += Math.round(
      (withRemediation / tests.length) * 20
    );
  }

  // --- Pillar 4: Third-Party Risk ---
  if (providers.length === 0) {
    pillarScores.thirdPartyRisk.details.push(
      'No third-party ICT providers registered. All providers must be documented per DORA Article 28(3).'
    );
  } else {
    // Providers with risk assessment (0-25 pts)
    const withRiskAssessment = providers.filter((p) => {
      const ra = p.riskAssessment as any;
      return ra && ra.riskScore !== undefined;
    }).length;
    pillarScores.thirdPartyRisk.score += Math.round(
      (withRiskAssessment / providers.length) * 25
    );

    // Providers with exit strategies (0-25 pts)
    const withExitStrategy = providers.filter((p) => {
      const exit = p.exitStrategy as any;
      return exit && exit.plan && exit.plan !== '';
    }).length;
    pillarScores.thirdPartyRisk.score += Math.round(
      (withExitStrategy / providers.length) * 25
    );

    // Providers with audit rights (0-25 pts)
    const withAuditRights = providers.filter((p) => {
      const audit = p.auditRights as any;
      return audit && audit.rightToAudit === true;
    }).length;
    pillarScores.thirdPartyRisk.score += Math.round(
      (withAuditRights / providers.length) * 25
    );

    // Review dates current (0-25 pts)
    const upToDate = providers.filter(
      (p) => p.nextReviewDate && p.nextReviewDate >= now
    ).length;
    pillarScores.thirdPartyRisk.score += Math.round(
      (upToDate / providers.length) * 25
    );

    // Critical providers without exit strategies
    const criticalWithoutExit = providers.filter((p) => {
      const exit = p.exitStrategy as any;
      return (
        p.criticality === 'critical' &&
        (!exit || !exit.plan || exit.plan === '')
      );
    }).length;
    if (criticalWithoutExit > 0) {
      pillarScores.thirdPartyRisk.details.push(
        `${criticalWithoutExit} critical provider(s) lack exit strategies. This is required under DORA Article 28(8).`
      );
    }
  }

  // --- Pillar 5: Information Register ---
  if (assets.length === 0) {
    pillarScores.informationRegister.details.push(
      'Information register is empty. All ICT assets must be catalogued per DORA Article 28(3).'
    );
  } else {
    // Compliant assets ratio (0-30 pts)
    const compliantRatio =
      assets.filter((a) => a.complianceStatus === 'compliant').length /
      assets.length;
    pillarScores.informationRegister.score += Math.round(compliantRatio * 30);

    // Assets with RTO/RPO defined (0-25 pts)
    const withRecovery = assets.filter(
      (a) =>
        a.recoveryTimeObjective !== null && a.recoveryPointObjective !== null
    ).length;
    pillarScores.informationRegister.score += Math.round(
      (withRecovery / assets.length) * 25
    );

    // Critical assets with third-party mappings (0-25 pts)
    const criticalAssets = assets.filter((a) => a.criticality === 'critical');
    if (criticalAssets.length > 0) {
      const critWithProvider = criticalAssets.filter(
        (a) => a.thirdPartyProvider
      ).length;
      // Having provider mapping documented = good (even if self-managed)
      pillarScores.informationRegister.score += 25;
    } else {
      pillarScores.informationRegister.score += 15;
    }

    // Dependencies documented (0-20 pts)
    const withDependencies = assets.filter((a) => {
      const deps = a.dependencies as any[];
      return deps && deps.length > 0;
    }).length;
    pillarScores.informationRegister.score += Math.round(
      (withDependencies / assets.length) * 20
    );

    const nonCompliant = assets.filter(
      (a) => a.complianceStatus === 'non_compliant'
    ).length;
    if (nonCompliant > 0) {
      pillarScores.informationRegister.details.push(
        `${nonCompliant} asset(s) marked non-compliant. Review and remediate.`
      );
    }
  }

  // Cap each pillar score at 100
  Object.keys(pillarScores).forEach((key) => {
    pillarScores[key].score = Math.min(pillarScores[key].score, 100);
  });

  // Calculate weighted overall score
  const overallScore = Math.round(
    pillarScores.ictRiskManagement.score * DORA_PILLAR_WEIGHTS.ictRiskManagement +
    pillarScores.incidentManagement.score * DORA_PILLAR_WEIGHTS.incidentManagement +
    pillarScores.resilienceTesting.score * DORA_PILLAR_WEIGHTS.resilienceTesting +
    pillarScores.thirdPartyRisk.score * DORA_PILLAR_WEIGHTS.thirdPartyRisk +
    pillarScores.informationRegister.score * DORA_PILLAR_WEIGHTS.informationRegister
  );

  const complianceLevel =
    overallScore >= 80
      ? 'compliant'
      : overallScore >= 60
        ? 'partially_compliant'
        : overallScore >= 40
          ? 'at_risk'
          : 'non_compliant';

  return {
    overallScore,
    complianceLevel,
    pillarScores: {
      ictRiskManagement: {
        score: pillarScores.ictRiskManagement.score,
        weight: DORA_PILLAR_WEIGHTS.ictRiskManagement,
        weightedScore: Math.round(
          pillarScores.ictRiskManagement.score * DORA_PILLAR_WEIGHTS.ictRiskManagement
        ),
        details: pillarScores.ictRiskManagement.details,
      },
      incidentManagement: {
        score: pillarScores.incidentManagement.score,
        weight: DORA_PILLAR_WEIGHTS.incidentManagement,
        weightedScore: Math.round(
          pillarScores.incidentManagement.score * DORA_PILLAR_WEIGHTS.incidentManagement
        ),
        details: pillarScores.incidentManagement.details,
      },
      resilienceTesting: {
        score: pillarScores.resilienceTesting.score,
        weight: DORA_PILLAR_WEIGHTS.resilienceTesting,
        weightedScore: Math.round(
          pillarScores.resilienceTesting.score * DORA_PILLAR_WEIGHTS.resilienceTesting
        ),
        details: pillarScores.resilienceTesting.details,
      },
      thirdPartyRisk: {
        score: pillarScores.thirdPartyRisk.score,
        weight: DORA_PILLAR_WEIGHTS.thirdPartyRisk,
        weightedScore: Math.round(
          pillarScores.thirdPartyRisk.score * DORA_PILLAR_WEIGHTS.thirdPartyRisk
        ),
        details: pillarScores.thirdPartyRisk.details,
      },
      informationRegister: {
        score: pillarScores.informationRegister.score,
        weight: DORA_PILLAR_WEIGHTS.informationRegister,
        weightedScore: Math.round(
          pillarScores.informationRegister.score * DORA_PILLAR_WEIGHTS.informationRegister
        ),
        details: pillarScores.informationRegister.details,
      },
    },
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate ICT risk level from numeric score
 */
function calculateICTRiskLevel(riskScore: number): ICTRiskLevel {
  if (riskScore >= 20) return 'critical';
  if (riskScore >= 12) return 'high';
  if (riskScore >= 6) return 'medium';
  return 'low';
}

/**
 * Classify incident per DORA Article 18 criteria
 *
 * Major ICT-related incidents are determined by:
 * - Number of clients/counterparties affected
 * - Duration of the incident
 * - Geographical spread
 * - Data losses involved
 * - Criticality of services affected
 * - Economic impact
 */
function classifyIncident(severity: ICTIncidentSeverity): ICTIncidentClassification {
  switch (severity) {
    case 'critical':
    case 'major':
      return 'major_ict_incident';
    case 'significant':
      return 'significant_cyber_threat';
    case 'minor':
    default:
      return 'minor_incident';
  }
}

/**
 * Generate preliminary test findings structure based on test type
 */
function generateTestFindings(
  testType: string,
  scenarios: any[],
  targetSystems: any[]
): any[] {
  const findings: any[] = [];

  // Generate a finding template per scenario
  scenarios.forEach((scenario: any, index: number) => {
    findings.push({
      findingId: `F-${Date.now()}-${index}`,
      severity: 'pending',
      description: `Finding for scenario: ${scenario.name || `Scenario ${index + 1}`}`,
      affectedSystem: targetSystems[0]?.systemName || 'TBD',
      recommendation: 'Pending test execution',
      status: 'pending',
    });
  });

  // Add standard findings based on test type
  switch (testType) {
    case 'tlpt':
      findings.push({
        findingId: `F-${Date.now()}-tlpt-scope`,
        severity: 'info',
        description: 'TLPT scope coverage assessment',
        affectedSystem: 'All critical functions',
        recommendation: 'Validate coverage of all critical business functions per TIBER-EU framework',
        status: 'pending',
      });
      break;
    case 'vulnerability_assessment':
      findings.push({
        findingId: `F-${Date.now()}-vuln-base`,
        severity: 'info',
        description: 'Vulnerability scan baseline',
        affectedSystem: 'All target systems',
        recommendation: 'Compare results against previous scan baselines',
        status: 'pending',
      });
      break;
    case 'scenario_based':
      findings.push({
        findingId: `F-${Date.now()}-scenario-base`,
        severity: 'info',
        description: 'Scenario response effectiveness assessment',
        affectedSystem: 'Incident response processes',
        recommendation: 'Evaluate response time, communication effectiveness, and escalation procedures',
        status: 'pending',
      });
      break;
    case 'tabletop_exercise':
      findings.push({
        findingId: `F-${Date.now()}-tabletop-base`,
        severity: 'info',
        description: 'Tabletop exercise participation and outcomes',
        affectedSystem: 'Business continuity processes',
        recommendation: 'Document key decisions, gaps identified, and improvement actions',
        status: 'pending',
      });
      break;
    default:
      break;
  }

  return findings;
}
