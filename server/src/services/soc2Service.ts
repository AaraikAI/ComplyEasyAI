/**
 * SOC 2 Compliance Workflow Service
 *
 * Wraps the AICPA Trust Services Criteria (TSC 2017 with 2022 points of focus)
 * with the workflow artifacts required for both Type I (point-in-time design
 * effectiveness) and Type II (operating effectiveness over a period) audit
 * lifecycles. Modelled after hipaaService.ts / iso27001Service.ts: dedicated
 * Prisma models, full CRUD, multi-tenant org scoping enforced at every query,
 * every state-change audit-logged. Score-impacting writes notify
 * realTimeComplianceService so dashboards refresh in real time.
 *
 * Five TSC categories — Security (Common Criteria, required for every SOC 2
 * engagement) plus four optional categories (Availability, Processing
 * Integrity, Confidentiality, Privacy). The optional categories are selected
 * per engagement via SOC2Engagement.trustServicesIncluded.
 */

import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuditLogger } from '../utils/auditLogger';
import realTimeComplianceService from './realTimeComplianceService';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type SOC2EngagementType = 'TypeI' | 'TypeII';
export type SOC2EngagementStatus = 'Planning' | 'Fieldwork' | 'Reporting' | 'Issued';
export type SOC2ReportType = 'Unqualified' | 'Qualified' | 'Adverse' | 'DisclaimerOfOpinion';

export type SOC2TrustService =
  | 'Security'
  | 'Availability'
  | 'ProcessingIntegrity'
  | 'Confidentiality'
  | 'Privacy';

export type SOC2ControlFrequency =
  | 'Continuous'
  | 'Daily'
  | 'Weekly'
  | 'Monthly'
  | 'Quarterly'
  | 'Annually'
  | 'AdHoc';
export type SOC2ControlType = 'Preventive' | 'Detective' | 'Corrective';
export type SOC2AutomationLevel = 'Manual' | 'Hybrid' | 'Automated';
export type SOC2RiskRating = 'Low' | 'Medium' | 'High';
export type SOC2ImplementationStatus =
  | 'NotImplemented'
  | 'Designed'
  | 'Implemented'
  | 'Operating';
export type SOC2DesignStatus = 'Effective' | 'Ineffective' | 'NotTested';
export type SOC2OperatingStatus =
  | 'Effective'
  | 'Ineffective'
  | 'NotTested'
  | 'InsufficientEvidence';

export type SOC2SamplingMethod = 'Random' | 'Haphazard' | 'Statistical' | 'Judgmental';
export type SOC2EvidenceType =
  | 'LogReview'
  | 'AccessReview'
  | 'ChangeRecord'
  | 'IncidentTicket'
  | 'PolicyAck'
  | 'TrainingRecord'
  | 'BackupTest'
  | 'VulnScan'
  | 'PenTest';
export type SOC2SampleStatus = 'Pending' | 'Collected' | 'Reviewed' | 'Approved' | 'Rejected';

export type SOC2ExceptionType =
  | 'DesignDeficiency'
  | 'OperatingDeficiency'
  | 'SignificantDeficiency'
  | 'MaterialWeakness';
export type SOC2ExceptionStatus = 'Open' | 'Remediated' | 'Accepted' | 'Closed';

export type SOC2AssertionType =
  | 'DescriptionOfSystem'
  | 'DesignOfControls'
  | 'OperatingEffectiveness';

export interface SOC2Dashboard {
  organizationId: string;
  activeEngagement: {
    id: string;
    engagementYear: number;
    engagementType: SOC2EngagementType;
    status: SOC2EngagementStatus;
    trustServicesIncluded: SOC2TrustService[];
    auditPeriodStart: Date | null;
    auditPeriodEnd: Date | null;
    asOfDate: Date | null;
  } | null;
  controlsByStatus: Record<SOC2ImplementationStatus, number>;
  controlsByCategory: Record<SOC2TrustService, number>;
  evidenceCollectionProgress: {
    totalSamples: number;
    pending: number;
    collected: number;
    reviewed: number;
    approved: number;
    rejected: number;
    completionPercent: number;
  };
  openExceptionsBySeverity: Record<SOC2ExceptionType, number>;
  daysUntilNextTest: number | null;
  readinessScore: number;
  generatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical TSC catalog
// ----------------------------------------------------------------------------
// Paraphrased from the AICPA TSC 2017 (revised 2022). Common Criteria CC1-CC9
// are required for every SOC 2 engagement; the remaining categories are seeded
// only when included in the engagement's trustServicesIncluded.
// ─────────────────────────────────────────────────────────────────────────────

interface SOC2ControlSeed {
  category: SOC2TrustService;
  ref: string;
  title: string;
  activity: string;
  controlType: SOC2ControlType;
  defaultFrequency: SOC2ControlFrequency;
}

const COMMON_CRITERIA_CATALOG: ReadonlyArray<SOC2ControlSeed> = [
  // CC1 — Control Environment
  { category: 'Security', ref: 'CC1.1', title: 'Integrity and Ethical Values', activity: 'The entity demonstrates a commitment to integrity and ethical values through documented codes of conduct, ethics training, and disciplinary procedures.', controlType: 'Preventive', defaultFrequency: 'Annually' },
  { category: 'Security', ref: 'CC1.2', title: 'Board Oversight', activity: 'The board of directors exercises oversight of the system of internal control by reviewing management reports, audit findings, and risk assessments at scheduled intervals.', controlType: 'Detective', defaultFrequency: 'Quarterly' },
  { category: 'Security', ref: 'CC1.3', title: 'Organizational Structure and Reporting Lines', activity: 'Management establishes structures, reporting lines, and authority to support the achievement of objectives, documented in an organization chart and role definitions.', controlType: 'Preventive', defaultFrequency: 'Annually' },
  { category: 'Security', ref: 'CC1.4', title: 'Commitment to Competence', activity: 'The entity attracts, develops, and retains competent personnel through hiring standards, security training, and ongoing competency evaluations.', controlType: 'Preventive', defaultFrequency: 'Annually' },
  { category: 'Security', ref: 'CC1.5', title: 'Accountability', activity: 'Individuals are held accountable for their internal-control responsibilities through performance reviews and consequence management.', controlType: 'Detective', defaultFrequency: 'Annually' },

  // CC2 — Communication and Information
  { category: 'Security', ref: 'CC2.1', title: 'Information Quality', activity: 'The entity obtains or generates relevant, quality information to support the functioning of internal control via security tooling, monitoring systems, and audit logs.', controlType: 'Detective', defaultFrequency: 'Continuous' },
  { category: 'Security', ref: 'CC2.2', title: 'Internal Communication', activity: 'Internal communication of objectives and responsibilities for internal control is provided through policies, training, and acknowledgement records.', controlType: 'Preventive', defaultFrequency: 'Annually' },
  { category: 'Security', ref: 'CC2.3', title: 'External Communication', activity: 'The entity communicates with external parties regarding matters affecting internal control via published commitments, breach notification procedures, and customer support channels.', controlType: 'Preventive', defaultFrequency: 'AdHoc' },

  // CC3 — Risk Assessment
  { category: 'Security', ref: 'CC3.1', title: 'Specifies Suitable Objectives', activity: 'The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks, documented in risk policies and statements of applicability.', controlType: 'Preventive', defaultFrequency: 'Annually' },
  { category: 'Security', ref: 'CC3.2', title: 'Risk Identification and Analysis', activity: 'Management identifies risks to the achievement of objectives across the entity and analyzes them as a basis for determining how risks should be managed.', controlType: 'Detective', defaultFrequency: 'Annually' },
  { category: 'Security', ref: 'CC3.3', title: 'Fraud Risk Assessment', activity: 'The entity considers the potential for fraud in assessing risks to the achievement of objectives.', controlType: 'Detective', defaultFrequency: 'Annually' },
  { category: 'Security', ref: 'CC3.4', title: 'Change Risk Assessment', activity: 'The entity identifies and assesses changes that could significantly impact the system of internal control prior to implementation.', controlType: 'Preventive', defaultFrequency: 'Continuous' },

  // CC4 — Monitoring Activities
  { category: 'Security', ref: 'CC4.1', title: 'Ongoing and Separate Evaluations', activity: 'The entity selects, develops, and performs ongoing and separate evaluations of controls including continuous monitoring tooling and periodic internal audits.', controlType: 'Detective', defaultFrequency: 'Continuous' },
  { category: 'Security', ref: 'CC4.2', title: 'Communication of Deficiencies', activity: 'Internal control deficiencies are evaluated and communicated to parties responsible for taking corrective action including senior management and the board.', controlType: 'Detective', defaultFrequency: 'Quarterly' },

  // CC5 — Control Activities
  { category: 'Security', ref: 'CC5.1', title: 'Selects and Develops Control Activities', activity: 'The entity selects and develops control activities that contribute to the mitigation of risks to acceptable levels.', controlType: 'Preventive', defaultFrequency: 'Annually' },
  { category: 'Security', ref: 'CC5.2', title: 'Technology Controls', activity: 'The entity selects and develops general control activities over technology to support the achievement of objectives, including access management, change management, and operations.', controlType: 'Preventive', defaultFrequency: 'Continuous' },
  { category: 'Security', ref: 'CC5.3', title: 'Policies and Procedures', activity: 'The entity deploys control activities through policies that establish what is expected and procedures that put policies into action.', controlType: 'Preventive', defaultFrequency: 'Annually' },

  // CC6 — Logical and Physical Access Controls
  { category: 'Security', ref: 'CC6.1', title: 'Logical Access Controls', activity: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from unauthorized access.', controlType: 'Preventive', defaultFrequency: 'Continuous' },
  { category: 'Security', ref: 'CC6.2', title: 'Access Provisioning and Authorization', activity: 'New internal and external user access requests are authorized, registered, and modified based on role responsibilities; access is removed upon termination.', controlType: 'Preventive', defaultFrequency: 'Continuous' },
  { category: 'Security', ref: 'CC6.3', title: 'Access Reviews and Removal', activity: 'The entity authorizes, modifies, or removes access to data, software, functions, and other protected resources based on roles, responsibilities, or system design and changes.', controlType: 'Detective', defaultFrequency: 'Quarterly' },
  { category: 'Security', ref: 'CC6.4', title: 'Physical Access Controls', activity: 'The entity restricts physical access to facilities and protected information assets to authorized personnel through badge systems, visitor logs, and CCTV.', controlType: 'Preventive', defaultFrequency: 'Continuous' },
  { category: 'Security', ref: 'CC6.5', title: 'Asset Disposal', activity: 'The entity discontinues logical and physical protections over physical assets only after such assets have been sanitized of sensitive information.', controlType: 'Preventive', defaultFrequency: 'AdHoc' },
  { category: 'Security', ref: 'CC6.6', title: 'External Boundaries', activity: 'The entity implements logical access security measures to protect against threats from sources outside its system boundaries (firewalls, IDS/IPS, DDoS protection).', controlType: 'Preventive', defaultFrequency: 'Continuous' },
  { category: 'Security', ref: 'CC6.7', title: 'Transmission Confidentiality', activity: 'The entity restricts the transmission, movement, and removal of information to authorized internal and external users using encryption in transit (TLS) and approved channels.', controlType: 'Preventive', defaultFrequency: 'Continuous' },
  { category: 'Security', ref: 'CC6.8', title: 'Malware Protection', activity: 'The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software through endpoint protection and integrity monitoring.', controlType: 'Detective', defaultFrequency: 'Continuous' },

  // CC7 — System Operations
  { category: 'Security', ref: 'CC7.1', title: 'Configuration Standards and Vulnerability Management', activity: 'The entity uses detection and monitoring procedures to identify changes to configurations and the introduction of new vulnerabilities.', controlType: 'Detective', defaultFrequency: 'Continuous' },
  { category: 'Security', ref: 'CC7.2', title: 'Security Event Monitoring', activity: 'The entity monitors system components and the operation of those components for anomalies that are indicative of malicious acts, natural disasters, and errors.', controlType: 'Detective', defaultFrequency: 'Continuous' },
  { category: 'Security', ref: 'CC7.3', title: 'Incident Identification and Evaluation', activity: 'The entity evaluates security events to determine whether they could or have resulted in a failure to meet its objectives, and triggers the incident response process.', controlType: 'Detective', defaultFrequency: 'Continuous' },
  { category: 'Security', ref: 'CC7.4', title: 'Incident Response', activity: 'The entity responds to identified security incidents by executing a defined incident response program to understand, contain, remediate, and communicate.', controlType: 'Corrective', defaultFrequency: 'AdHoc' },
  { category: 'Security', ref: 'CC7.5', title: 'Recovery and Lessons Learned', activity: 'The entity identifies, develops, and implements activities to recover from identified security incidents and conducts post-incident reviews to drive improvements.', controlType: 'Corrective', defaultFrequency: 'AdHoc' },

  // CC8 — Change Management
  { category: 'Security', ref: 'CC8.1', title: 'Change Management', activity: 'The entity authorizes, designs, develops, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures to meet its objectives.', controlType: 'Preventive', defaultFrequency: 'Continuous' },

  // CC9 — Risk Mitigation
  { category: 'Security', ref: 'CC9.1', title: 'Business Continuity Risk Mitigation', activity: 'The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions including business continuity and disaster recovery plans.', controlType: 'Corrective', defaultFrequency: 'Annually' },
  { category: 'Security', ref: 'CC9.2', title: 'Vendor and Business Partner Risk Management', activity: 'The entity assesses and manages risks associated with vendors and business partners through due-diligence reviews, contractual obligations, and ongoing monitoring.', controlType: 'Detective', defaultFrequency: 'Annually' },
];

const AVAILABILITY_CATALOG: ReadonlyArray<SOC2ControlSeed> = [
  { category: 'Availability', ref: 'A1.1', title: 'Capacity and Performance Monitoring', activity: 'The entity maintains, monitors, and evaluates current processing capacity and use of system components to manage capacity demand and enable the implementation of additional capacity.', controlType: 'Detective', defaultFrequency: 'Continuous' },
  { category: 'Availability', ref: 'A1.2', title: 'Environmental Protections, Backup, and Recovery', activity: 'The entity authorizes, designs, develops, implements, operates, approves, maintains, and monitors environmental protections, software, data backup processes, and recovery infrastructure to meet its availability commitments.', controlType: 'Preventive', defaultFrequency: 'Continuous' },
  { category: 'Availability', ref: 'A1.3', title: 'Disaster Recovery Plan Testing', activity: 'The entity tests recovery plan procedures supporting system recovery to meet its objectives, including periodic restore tests and full DR exercises.', controlType: 'Detective', defaultFrequency: 'Annually' },
];

const PROCESSING_INTEGRITY_CATALOG: ReadonlyArray<SOC2ControlSeed> = [
  { category: 'ProcessingIntegrity', ref: 'PI1.1', title: 'Data Quality Standards', activity: 'The entity obtains or generates, uses, and communicates relevant, quality information regarding processing inputs to support the use of products and services.', controlType: 'Preventive', defaultFrequency: 'Continuous' },
  { category: 'ProcessingIntegrity', ref: 'PI1.2', title: 'Input Authorization and Validation', activity: 'The entity implements policies and procedures over system inputs, including authorization and validation, to result in products and services that meet specifications.', controlType: 'Preventive', defaultFrequency: 'Continuous' },
  { category: 'ProcessingIntegrity', ref: 'PI1.3', title: 'Processing Integrity', activity: 'The entity implements policies and procedures over system processing to result in products and services that are accurate, complete, valid, and timely.', controlType: 'Detective', defaultFrequency: 'Continuous' },
  { category: 'ProcessingIntegrity', ref: 'PI1.4', title: 'Output Accuracy and Completeness', activity: 'The entity implements policies and procedures to make available or deliver output completely, accurately, and timely in accordance with specifications.', controlType: 'Detective', defaultFrequency: 'Continuous' },
  { category: 'ProcessingIntegrity', ref: 'PI1.5', title: 'Storage Completeness and Accuracy', activity: 'The entity implements policies and procedures to store inputs, items in processing, and outputs completely, accurately, and timely.', controlType: 'Preventive', defaultFrequency: 'Continuous' },
];

const CONFIDENTIALITY_CATALOG: ReadonlyArray<SOC2ControlSeed> = [
  { category: 'Confidentiality', ref: 'C1.1', title: 'Identification and Protection of Confidential Information', activity: 'The entity identifies and maintains confidential information to meet its objectives related to confidentiality, including data classification and handling procedures.', controlType: 'Preventive', defaultFrequency: 'Continuous' },
  { category: 'Confidentiality', ref: 'C1.2', title: 'Disposal of Confidential Information', activity: 'The entity disposes of confidential information to meet its objectives, using approved sanitization or destruction procedures.', controlType: 'Preventive', defaultFrequency: 'AdHoc' },
];

const PRIVACY_CATALOG: ReadonlyArray<SOC2ControlSeed> = [
  { category: 'Privacy', ref: 'P1.1', title: 'Notice', activity: 'The entity provides notice to data subjects about its privacy practices to meet the entity\'s objectives related to privacy, including a published privacy notice.', controlType: 'Preventive', defaultFrequency: 'Annually' },
  { category: 'Privacy', ref: 'P2.1', title: 'Choice and Consent', activity: 'The entity communicates choices available regarding the collection, use, retention, disclosure, and disposal of personal information and obtains consent where required.', controlType: 'Preventive', defaultFrequency: 'Continuous' },
  { category: 'Privacy', ref: 'P3.1', title: 'Collection Limitation', activity: 'Personal information is collected consistent with the entity\'s objectives related to privacy and limited to that necessary for the disclosed purposes.', controlType: 'Preventive', defaultFrequency: 'Continuous' },
  { category: 'Privacy', ref: 'P3.2', title: 'Explicit Consent for Sensitive Information', activity: 'For information requiring explicit consent, the entity communicates the need for and obtains the consent prior to the collection of the information.', controlType: 'Preventive', defaultFrequency: 'Continuous' },
  { category: 'Privacy', ref: 'P4.1', title: 'Use, Retention, and Disposal', activity: 'The entity limits the use of personal information to the purposes identified in the notice and for which the data subject provided consent.', controlType: 'Preventive', defaultFrequency: 'Continuous' },
  { category: 'Privacy', ref: 'P4.2', title: 'Retention Periods', activity: 'The entity retains personal information consistent with the entity\'s objectives related to privacy through documented retention schedules.', controlType: 'Preventive', defaultFrequency: 'Annually' },
  { category: 'Privacy', ref: 'P4.3', title: 'Secure Disposal', activity: 'The entity securely disposes of personal information to meet the entity\'s objectives related to privacy.', controlType: 'Preventive', defaultFrequency: 'AdHoc' },
  { category: 'Privacy', ref: 'P5.1', title: 'Access by Data Subjects', activity: 'The entity grants identified and authenticated data subjects the ability to access their stored personal information for review and, upon request, provides physical or electronic copies.', controlType: 'Preventive', defaultFrequency: 'AdHoc' },
  { category: 'Privacy', ref: 'P5.2', title: 'Correction by Data Subjects', activity: 'The entity corrects, amends, or appends personal information based on information provided by data subjects and communicates such information to third parties as committed or required.', controlType: 'Corrective', defaultFrequency: 'AdHoc' },
  { category: 'Privacy', ref: 'P6.1', title: 'Disclosure to Third Parties', activity: 'The entity discloses personal information to third parties with the explicit consent of data subjects and such consent is obtained prior to disclosure to meet the entity\'s objectives related to privacy.', controlType: 'Preventive', defaultFrequency: 'Continuous' },
  { category: 'Privacy', ref: 'P6.2', title: 'Authorized Disclosures Recorded', activity: 'The entity creates and retains a complete, accurate, and timely record of authorized disclosures of personal information.', controlType: 'Detective', defaultFrequency: 'Continuous' },
  { category: 'Privacy', ref: 'P6.3', title: 'Unauthorized Disclosures Recorded', activity: 'The entity creates and retains a complete, accurate, and timely record of detected or reported unauthorized disclosures of personal information.', controlType: 'Detective', defaultFrequency: 'Continuous' },
  { category: 'Privacy', ref: 'P6.4', title: 'Third-Party Compliance', activity: 'The entity obtains privacy commitments from vendors and other third parties who have access to personal information consistent with the entity\'s privacy commitments.', controlType: 'Preventive', defaultFrequency: 'Annually' },
  { category: 'Privacy', ref: 'P6.5', title: 'Third-Party Breach Reporting', activity: 'The entity obtains commitments from vendors and other third parties to notify the entity of any actual or suspected unauthorized disclosures of personal information.', controlType: 'Detective', defaultFrequency: 'Continuous' },
  { category: 'Privacy', ref: 'P6.6', title: 'Breach Notification', activity: 'The entity provides notification of breaches and incidents to affected data subjects, regulators, and others to meet the entity\'s objectives related to privacy.', controlType: 'Corrective', defaultFrequency: 'AdHoc' },
  { category: 'Privacy', ref: 'P6.7', title: 'Accountability for Disclosures', activity: 'The entity provides data subjects with an accounting of the personal information held and disclosure of the data subjects\' personal information, upon their request.', controlType: 'Detective', defaultFrequency: 'AdHoc' },
  { category: 'Privacy', ref: 'P7.1', title: 'Quality of Personal Information', activity: 'The entity collects and maintains accurate, up-to-date, complete, and relevant personal information to meet the entity\'s objectives related to privacy.', controlType: 'Detective', defaultFrequency: 'Continuous' },
  { category: 'Privacy', ref: 'P8.1', title: 'Privacy Inquiries, Complaints, and Disputes', activity: 'The entity implements a process for receiving, addressing, resolving, and communicating the resolution of inquiries, complaints, and disputes from data subjects and others.', controlType: 'Corrective', defaultFrequency: 'Continuous' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export class SOC2Service {

  // ═══════════════════════════════════════════════════════════════════════
  //  ENGAGEMENTS
  // ═══════════════════════════════════════════════════════════════════════

  async createEngagement(data: {
    organizationId: string;
    userId: string;
    engagementYear: number;
    engagementType: SOC2EngagementType;
    trustServicesIncluded: SOC2TrustService[];
    auditPeriodStart?: Date;
    auditPeriodEnd?: Date;
    asOfDate?: Date;
    cpaFirm?: string;
    leadAuditor?: string;
    scopeBoundaries?: Record<string, unknown>;
    subserviceOrganizations?: Array<Record<string, unknown>>;
    status?: SOC2EngagementStatus;
  }) {
    if (!data.trustServicesIncluded.includes('Security')) {
      throw new AppError('Security (Common Criteria) is required for every SOC 2 engagement', 400);
    }
    if (data.engagementType === 'TypeII') {
      if (!data.auditPeriodStart || !data.auditPeriodEnd) {
        throw new AppError('Type II engagements require auditPeriodStart and auditPeriodEnd', 400);
      }
      if (data.auditPeriodEnd <= data.auditPeriodStart) {
        throw new AppError('auditPeriodEnd must be after auditPeriodStart', 400);
      }
    }
    if (data.engagementType === 'TypeI' && !data.asOfDate) {
      throw new AppError('Type I engagements require asOfDate', 400);
    }

    const engagement = await prisma.sOC2Engagement.create({
      data: {
        organizationId: data.organizationId,
        engagementYear: data.engagementYear,
        engagementType: data.engagementType,
        trustServicesIncluded: data.trustServicesIncluded as never,
        auditPeriodStart: data.auditPeriodStart,
        auditPeriodEnd: data.auditPeriodEnd,
        asOfDate: data.asOfDate,
        cpaFirm: data.cpaFirm,
        leadAuditor: data.leadAuditor,
        scopeBoundaries: data.scopeBoundaries as never,
        subserviceOrganizations: data.subserviceOrganizations as never,
        status: data.status ?? 'Planning',
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'soc2.engagement.created',
      resourceType: 'SOC2Engagement',
      resourceId: engagement.id,
      metadata: {
        engagementYear: data.engagementYear,
        engagementType: data.engagementType,
        trustServices: data.trustServicesIncluded,
      },
    });

    realTimeComplianceService.publishComplianceEvent(data.organizationId, {
      type: 'soc2.engagement.created',
      severity: 'Medium',
      payload: {
        engagementId: engagement.id,
        engagementYear: data.engagementYear,
        engagementType: data.engagementType,
      },
    });

    return engagement;
  }

  async updateEngagement(
    id: string,
    organizationId: string,
    userId: string,
    patch: Partial<{
      engagementYear: number;
      engagementType: SOC2EngagementType;
      trustServicesIncluded: SOC2TrustService[];
      auditPeriodStart: Date;
      auditPeriodEnd: Date;
      asOfDate: Date;
      cpaFirm: string;
      leadAuditor: string;
      scopeBoundaries: Record<string, unknown>;
      subserviceOrganizations: Array<Record<string, unknown>>;
      status: SOC2EngagementStatus;
      reportType: SOC2ReportType;
      reportIssuedAt: Date;
      reportUrl: string;
    }>
  ) {
    const existing = await prisma.sOC2Engagement.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError('SOC 2 engagement not found', 404);

    if (patch.trustServicesIncluded && !patch.trustServicesIncluded.includes('Security')) {
      throw new AppError('Security (Common Criteria) is required for every SOC 2 engagement', 400);
    }

    const updated = await prisma.sOC2Engagement.update({
      where: { id },
      data: {
        ...(patch.engagementYear !== undefined && { engagementYear: patch.engagementYear }),
        ...(patch.engagementType !== undefined && { engagementType: patch.engagementType }),
        ...(patch.trustServicesIncluded !== undefined && { trustServicesIncluded: patch.trustServicesIncluded as never }),
        ...(patch.auditPeriodStart !== undefined && { auditPeriodStart: patch.auditPeriodStart }),
        ...(patch.auditPeriodEnd !== undefined && { auditPeriodEnd: patch.auditPeriodEnd }),
        ...(patch.asOfDate !== undefined && { asOfDate: patch.asOfDate }),
        ...(patch.cpaFirm !== undefined && { cpaFirm: patch.cpaFirm }),
        ...(patch.leadAuditor !== undefined && { leadAuditor: patch.leadAuditor }),
        ...(patch.scopeBoundaries !== undefined && { scopeBoundaries: patch.scopeBoundaries as never }),
        ...(patch.subserviceOrganizations !== undefined && { subserviceOrganizations: patch.subserviceOrganizations as never }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.reportType !== undefined && { reportType: patch.reportType }),
        ...(patch.reportIssuedAt !== undefined && { reportIssuedAt: patch.reportIssuedAt }),
        ...(patch.reportUrl !== undefined && { reportUrl: patch.reportUrl }),
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'soc2.engagement.updated',
      resourceType: 'SOC2Engagement',
      resourceId: id,
      metadata: { previousStatus: existing.status, newStatus: updated.status, patchKeys: Object.keys(patch) },
    });

    if (patch.status === 'Issued') {
      realTimeComplianceService.publishComplianceEvent(organizationId, {
        type: 'soc2.engagement.report_issued',
        severity: 'Medium',
        payload: { engagementId: id, reportType: updated.reportType ?? 'Unknown' },
      });
    }

    return updated;
  }

  async listEngagements(
    organizationId: string,
    filter?: {
      status?: SOC2EngagementStatus;
      engagementType?: SOC2EngagementType;
      engagementYear?: number;
    }
  ) {
    return prisma.sOC2Engagement.findMany({
      where: {
        organizationId,
        ...(filter?.status && { status: filter.status }),
        ...(filter?.engagementType && { engagementType: filter.engagementType }),
        ...(filter?.engagementYear && { engagementYear: filter.engagementYear }),
      },
      orderBy: [{ engagementYear: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getEngagement(id: string, organizationId: string) {
    const engagement = await prisma.sOC2Engagement.findFirst({
      where: { id, organizationId },
      include: {
        controls: { orderBy: { criteriaRef: 'asc' } },
        cuecs: true,
        managementAssertions: { orderBy: { signedAt: 'desc' } },
        exceptions: { orderBy: { identifiedAt: 'desc' } },
      },
    });
    if (!engagement) throw new AppError('SOC 2 engagement not found', 404);
    return engagement;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  CONTROLS
  // ═══════════════════════════════════════════════════════════════════════

  async upsertControl(data: {
    organizationId: string;
    userId: string;
    engagementId: string;
    criteriaCategory: SOC2TrustService;
    criteriaRef: string;
    criteriaTitle: string;
    controlActivity: string;
    controlObjective?: string;
    controlOwner?: string;
    controlFrequency?: SOC2ControlFrequency;
    controlType?: SOC2ControlType;
    automationLevel?: SOC2AutomationLevel;
    riskRating?: SOC2RiskRating;
    implementationStatus?: SOC2ImplementationStatus;
    nextTestDate?: Date;
    evidenceRefs?: string[];
  }) {
    const engagement = await prisma.sOC2Engagement.findFirst({
      where: { id: data.engagementId, organizationId: data.organizationId },
      select: { id: true, trustServicesIncluded: true },
    });
    if (!engagement) throw new AppError('SOC 2 engagement not found', 404);

    const includedServices = (engagement.trustServicesIncluded as unknown as SOC2TrustService[]) ?? [];
    if (!includedServices.includes(data.criteriaCategory)) {
      throw new AppError(
        `Trust services category ${data.criteriaCategory} is not included in this engagement`,
        400
      );
    }

    const control = await prisma.sOC2Control.upsert({
      where: {
        engagementId_criteriaRef: {
          engagementId: data.engagementId,
          criteriaRef: data.criteriaRef,
        },
      },
      create: {
        organizationId: data.organizationId,
        engagementId: data.engagementId,
        criteriaCategory: data.criteriaCategory,
        criteriaRef: data.criteriaRef,
        criteriaTitle: data.criteriaTitle,
        controlActivity: data.controlActivity,
        controlObjective: data.controlObjective,
        controlOwner: data.controlOwner,
        controlFrequency: data.controlFrequency ?? 'Continuous',
        controlType: data.controlType ?? 'Preventive',
        automationLevel: data.automationLevel ?? 'Manual',
        riskRating: data.riskRating ?? 'Medium',
        implementationStatus: data.implementationStatus ?? 'NotImplemented',
        nextTestDate: data.nextTestDate,
        evidenceRefs: data.evidenceRefs as never,
      },
      update: {
        criteriaCategory: data.criteriaCategory,
        criteriaTitle: data.criteriaTitle,
        controlActivity: data.controlActivity,
        ...(data.controlObjective !== undefined && { controlObjective: data.controlObjective }),
        ...(data.controlOwner !== undefined && { controlOwner: data.controlOwner }),
        ...(data.controlFrequency !== undefined && { controlFrequency: data.controlFrequency }),
        ...(data.controlType !== undefined && { controlType: data.controlType }),
        ...(data.automationLevel !== undefined && { automationLevel: data.automationLevel }),
        ...(data.riskRating !== undefined && { riskRating: data.riskRating }),
        ...(data.implementationStatus !== undefined && { implementationStatus: data.implementationStatus }),
        ...(data.nextTestDate !== undefined && { nextTestDate: data.nextTestDate }),
        ...(data.evidenceRefs !== undefined && { evidenceRefs: data.evidenceRefs as never }),
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'soc2.control.upserted',
      resourceType: 'SOC2Control',
      resourceId: control.id,
      metadata: { criteriaRef: data.criteriaRef, criteriaCategory: data.criteriaCategory },
    });

    return control;
  }

  /**
   * Seed the canonical TSC catalog into the engagement. Common Criteria
   * (CC1.1-CC9.2) are always seeded; the optional category seeds (Availability,
   * Processing Integrity, Confidentiality, Privacy) are added only if the
   * engagement's trustServicesIncluded array contains them. Wrapped in a
   * transaction so a partial failure rolls back cleanly.
   */
  async bulkSeedControls(engagementId: string, organizationId: string, userId: string) {
    const engagement = await prisma.sOC2Engagement.findFirst({
      where: { id: engagementId, organizationId },
      select: { id: true, trustServicesIncluded: true },
    });
    if (!engagement) throw new AppError('SOC 2 engagement not found', 404);

    const included = (engagement.trustServicesIncluded as unknown as SOC2TrustService[]) ?? [];
    const seeds: SOC2ControlSeed[] = [...COMMON_CRITERIA_CATALOG];
    if (included.includes('Availability')) seeds.push(...AVAILABILITY_CATALOG);
    if (included.includes('ProcessingIntegrity')) seeds.push(...PROCESSING_INTEGRITY_CATALOG);
    if (included.includes('Confidentiality')) seeds.push(...CONFIDENTIALITY_CATALOG);
    if (included.includes('Privacy')) seeds.push(...PRIVACY_CATALOG);

    const result = await prisma.$transaction(async (tx) => {
      let created = 0;
      let skipped = 0;
      for (const seed of seeds) {
        const existing = await tx.sOC2Control.findUnique({
          where: {
            engagementId_criteriaRef: {
              engagementId,
              criteriaRef: seed.ref,
            },
          },
          select: { id: true },
        });
        if (existing) {
          skipped++;
          continue;
        }
        await tx.sOC2Control.create({
          data: {
            organizationId,
            engagementId,
            criteriaCategory: seed.category,
            criteriaRef: seed.ref,
            criteriaTitle: seed.title,
            controlActivity: seed.activity,
            controlType: seed.controlType,
            controlFrequency: seed.defaultFrequency,
          },
        });
        created++;
      }
      return { created, skipped, total: seeds.length };
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'soc2.controls.bulk_seeded',
      resourceType: 'SOC2Engagement',
      resourceId: engagementId,
      metadata: result,
    });

    realTimeComplianceService.publishComplianceEvent(organizationId, {
      type: 'soc2.controls.seeded',
      severity: 'Low',
      payload: { engagementId, ...result },
    });

    return result;
  }

  async listControls(
    organizationId: string,
    engagementId: string,
    filter?: {
      criteriaCategory?: SOC2TrustService;
      implementationStatus?: SOC2ImplementationStatus;
      riskRating?: SOC2RiskRating;
    }
  ) {
    const engagement = await prisma.sOC2Engagement.findFirst({
      where: { id: engagementId, organizationId },
      select: { id: true },
    });
    if (!engagement) throw new AppError('SOC 2 engagement not found', 404);

    return prisma.sOC2Control.findMany({
      where: {
        organizationId,
        engagementId,
        ...(filter?.criteriaCategory && { criteriaCategory: filter.criteriaCategory }),
        ...(filter?.implementationStatus && { implementationStatus: filter.implementationStatus }),
        ...(filter?.riskRating && { riskRating: filter.riskRating }),
      },
      orderBy: { criteriaRef: 'asc' },
    });
  }

  async testControl(
    id: string,
    organizationId: string,
    userId: string,
    designStatus: SOC2DesignStatus,
    operatingStatus?: SOC2OperatingStatus,
    evidenceRefs?: string[]
  ) {
    const existing = await prisma.sOC2Control.findFirst({
      where: { id, organizationId },
      select: { id: true, criteriaRef: true, designStatus: true, operatingStatus: true, evidenceRefs: true },
    });
    if (!existing) throw new AppError('SOC 2 control not found', 404);

    const mergedEvidence = evidenceRefs && evidenceRefs.length > 0
      ? Array.from(new Set([...((existing.evidenceRefs as unknown as string[]) ?? []), ...evidenceRefs]))
      : undefined;

    const updated = await prisma.sOC2Control.update({
      where: { id },
      data: {
        designStatus,
        ...(operatingStatus !== undefined && { operatingStatus }),
        lastTestedAt: new Date(),
        ...(mergedEvidence !== undefined && { evidenceRefs: mergedEvidence as never }),
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'soc2.control.tested',
      resourceType: 'SOC2Control',
      resourceId: id,
      metadata: {
        criteriaRef: existing.criteriaRef,
        previousDesignStatus: existing.designStatus,
        newDesignStatus: designStatus,
        previousOperatingStatus: existing.operatingStatus,
        newOperatingStatus: operatingStatus ?? existing.operatingStatus,
      },
    });

    if (designStatus === 'Ineffective' || operatingStatus === 'Ineffective') {
      realTimeComplianceService.publishComplianceEvent(organizationId, {
        type: 'soc2.control.deficiency_detected',
        severity: 'High',
        payload: { controlId: id, criteriaRef: existing.criteriaRef, designStatus, operatingStatus },
      });
    }

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  EVIDENCE SAMPLING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Compute SOC 2 evidence sample size by control frequency, derived from
   * AICPA Audit Guide guidance for SOC engagements (sampling for tests of
   * controls). Frequency drives the upper bound; population size adjusts
   * within the stated band:
   *   Continuous → 25-40  (large populations test 40)
   *   Daily      → 25
   *   Weekly     → 5
   *   Monthly    → 2-5    (12 months: pick 2; mid-year extrapolations: 3-5)
   *   Quarterly  → 2
   *   Annually   → 1
   *   AdHoc      → max(1, populationSize)
   * Returns a deterministic value capped by populationSize.
   */
  computeSampleSize(populationSize: number, controlFrequency: SOC2ControlFrequency): number {
    if (populationSize < 0) {
      throw new AppError('populationSize must be ≥ 0', 400);
    }
    if (populationSize === 0) return 0;

    let target: number;
    switch (controlFrequency) {
      case 'Continuous':
        target = populationSize >= 250 ? 40 : 25;
        break;
      case 'Daily':
        target = 25;
        break;
      case 'Weekly':
        target = 5;
        break;
      case 'Monthly':
        target = populationSize >= 12 ? 2 : Math.min(5, populationSize);
        break;
      case 'Quarterly':
        target = 2;
        break;
      case 'Annually':
        target = 1;
        break;
      case 'AdHoc':
      default:
        target = Math.min(populationSize, Math.max(1, Math.ceil(populationSize * 0.1)));
        break;
    }
    return Math.min(target, populationSize);
  }

  async createEvidenceSample(data: {
    organizationId: string;
    userId: string;
    controlId: string;
    samplingPeriodStart: Date;
    samplingPeriodEnd: Date;
    populationSize: number;
    samplingMethod?: SOC2SamplingMethod;
    evidenceType: SOC2EvidenceType;
    evidenceUrl?: string;
    evidenceSha256?: string;
    exceptionsFound?: number;
    collectedBy?: string;
    collectedAt?: Date;
    status?: SOC2SampleStatus;
  }) {
    if (data.samplingPeriodEnd <= data.samplingPeriodStart) {
      throw new AppError('samplingPeriodEnd must be after samplingPeriodStart', 400);
    }
    if (data.populationSize < 0) throw new AppError('populationSize must be ≥ 0', 400);

    const control = await prisma.sOC2Control.findFirst({
      where: { id: data.controlId, organizationId: data.organizationId },
      select: { id: true, controlFrequency: true, criteriaRef: true },
    });
    if (!control) throw new AppError('SOC 2 control not found', 404);

    const sampleSize = this.computeSampleSize(
      data.populationSize,
      control.controlFrequency as SOC2ControlFrequency
    );

    const sample = await prisma.sOC2EvidenceSample.create({
      data: {
        organizationId: data.organizationId,
        controlId: data.controlId,
        samplingPeriodStart: data.samplingPeriodStart,
        samplingPeriodEnd: data.samplingPeriodEnd,
        populationSize: data.populationSize,
        sampleSize,
        samplingMethod: data.samplingMethod ?? 'Random',
        evidenceType: data.evidenceType,
        evidenceUrl: data.evidenceUrl,
        evidenceSha256: data.evidenceSha256,
        exceptionsFound: data.exceptionsFound ?? 0,
        collectedBy: data.collectedBy,
        collectedAt: data.collectedAt,
        status: data.status ?? 'Pending',
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'soc2.evidence_sample.created',
      resourceType: 'SOC2EvidenceSample',
      resourceId: sample.id,
      metadata: {
        controlId: data.controlId,
        criteriaRef: control.criteriaRef,
        populationSize: data.populationSize,
        sampleSize,
        evidenceType: data.evidenceType,
      },
    });

    return sample;
  }

  async listEvidenceSamples(
    organizationId: string,
    filter?: {
      controlId?: string;
      status?: SOC2SampleStatus;
      evidenceType?: SOC2EvidenceType;
    }
  ) {
    return prisma.sOC2EvidenceSample.findMany({
      where: {
        organizationId,
        ...(filter?.controlId && { controlId: filter.controlId }),
        ...(filter?.status && { status: filter.status }),
        ...(filter?.evidenceType && { evidenceType: filter.evidenceType }),
      },
      orderBy: { samplingPeriodEnd: 'desc' },
    });
  }

  async approveEvidenceSample(id: string, organizationId: string, reviewerId: string) {
    const existing = await prisma.sOC2EvidenceSample.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true, controlId: true },
    });
    if (!existing) throw new AppError('SOC 2 evidence sample not found', 404);
    if (existing.status === 'Approved') {
      throw new AppError('Evidence sample is already approved', 400);
    }

    const updated = await prisma.sOC2EvidenceSample.update({
      where: { id },
      data: {
        status: 'Approved',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    await AuditLogger.log({
      userId: reviewerId,
      organizationId,
      action: 'soc2.evidence_sample.approved',
      resourceType: 'SOC2EvidenceSample',
      resourceId: id,
      metadata: { controlId: existing.controlId, previousStatus: existing.status },
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  EXCEPTIONS
  // ═══════════════════════════════════════════════════════════════════════

  async createException(data: {
    organizationId: string;
    userId: string;
    engagementId: string;
    controlId: string;
    sampleId?: string;
    exceptionType: SOC2ExceptionType;
    description: string;
    identifiedBy: string;
    populationImpact?: string;
    rootCause?: string;
    remediation?: string;
    remediationOwner?: string;
    remediationDueDate?: Date;
    managementResponse?: string;
  }) {
    const engagement = await prisma.sOC2Engagement.findFirst({
      where: { id: data.engagementId, organizationId: data.organizationId },
      select: { id: true },
    });
    if (!engagement) throw new AppError('SOC 2 engagement not found', 404);

    const control = await prisma.sOC2Control.findFirst({
      where: { id: data.controlId, organizationId: data.organizationId, engagementId: data.engagementId },
      select: { id: true, criteriaRef: true },
    });
    if (!control) throw new AppError('SOC 2 control not found within this engagement', 404);

    if (data.sampleId) {
      const sample = await prisma.sOC2EvidenceSample.findFirst({
        where: { id: data.sampleId, organizationId: data.organizationId, controlId: data.controlId },
        select: { id: true },
      });
      if (!sample) throw new AppError('SOC 2 evidence sample not found for this control', 404);
    }

    const exception = await prisma.sOC2Exception.create({
      data: {
        organizationId: data.organizationId,
        engagementId: data.engagementId,
        controlId: data.controlId,
        sampleId: data.sampleId,
        exceptionType: data.exceptionType,
        description: data.description,
        identifiedBy: data.identifiedBy,
        populationImpact: data.populationImpact,
        rootCause: data.rootCause,
        remediation: data.remediation,
        remediationOwner: data.remediationOwner,
        remediationDueDate: data.remediationDueDate,
        managementResponse: data.managementResponse,
        status: 'Open',
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'soc2.exception.created',
      resourceType: 'SOC2Exception',
      resourceId: exception.id,
      metadata: {
        engagementId: data.engagementId,
        controlId: data.controlId,
        criteriaRef: control.criteriaRef,
        exceptionType: data.exceptionType,
      },
    });

    const severity =
      data.exceptionType === 'MaterialWeakness'
        ? 'Critical'
        : data.exceptionType === 'SignificantDeficiency'
          ? 'High'
          : 'Medium';

    realTimeComplianceService.publishComplianceEvent(data.organizationId, {
      type: 'soc2.exception.identified',
      severity,
      payload: {
        exceptionId: exception.id,
        controlId: data.controlId,
        criteriaRef: control.criteriaRef,
        exceptionType: data.exceptionType,
      },
    });

    if (data.exceptionType === 'MaterialWeakness' || data.exceptionType === 'SignificantDeficiency') {
      void realTimeComplianceService
        .notifyOrgAdmins(data.organizationId, {
          title: `SOC 2 ${data.exceptionType} on control ${control.criteriaRef}`,
          message: data.description.slice(0, 240),
          type: data.exceptionType === 'MaterialWeakness' ? 'error' : 'warning',
          link: `/soc2/exceptions/${exception.id}`,
        })
        .catch(() => undefined);
    }

    return exception;
  }

  async updateExceptionStatus(
    id: string,
    organizationId: string,
    userId: string,
    status: SOC2ExceptionStatus,
    extra?: {
      remediation?: string;
      remediationOwner?: string;
      remediationDueDate?: Date;
      remediationCompletedAt?: Date;
      managementResponse?: string;
    }
  ) {
    const existing = await prisma.sOC2Exception.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true, exceptionType: true, controlId: true },
    });
    if (!existing) throw new AppError('SOC 2 exception not found', 404);

    const updated = await prisma.sOC2Exception.update({
      where: { id },
      data: {
        status,
        ...(extra?.remediation !== undefined && { remediation: extra.remediation }),
        ...(extra?.remediationOwner !== undefined && { remediationOwner: extra.remediationOwner }),
        ...(extra?.remediationDueDate !== undefined && { remediationDueDate: extra.remediationDueDate }),
        ...(extra?.remediationCompletedAt !== undefined && { remediationCompletedAt: extra.remediationCompletedAt }),
        ...(extra?.managementResponse !== undefined && { managementResponse: extra.managementResponse }),
        ...(status === 'Remediated' && !extra?.remediationCompletedAt && { remediationCompletedAt: new Date() }),
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'soc2.exception.status_changed',
      resourceType: 'SOC2Exception',
      resourceId: id,
      metadata: {
        previousStatus: existing.status,
        newStatus: status,
        exceptionType: existing.exceptionType,
        controlId: existing.controlId,
      },
    });

    return updated;
  }

  async listExceptions(
    organizationId: string,
    filter?: {
      engagementId?: string;
      controlId?: string;
      status?: SOC2ExceptionStatus;
      exceptionType?: SOC2ExceptionType;
    }
  ) {
    return prisma.sOC2Exception.findMany({
      where: {
        organizationId,
        ...(filter?.engagementId && { engagementId: filter.engagementId }),
        ...(filter?.controlId && { controlId: filter.controlId }),
        ...(filter?.status && { status: filter.status }),
        ...(filter?.exceptionType && { exceptionType: filter.exceptionType }),
      },
      orderBy: { identifiedAt: 'desc' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  CUECs (Complementary User Entity Controls)
  // ═══════════════════════════════════════════════════════════════════════

  async createCUEC(data: {
    organizationId: string;
    userId: string;
    engagementId: string;
    criteriaCategory: SOC2TrustService;
    controlDescription: string;
    userResponsibility: string;
  }) {
    const engagement = await prisma.sOC2Engagement.findFirst({
      where: { id: data.engagementId, organizationId: data.organizationId },
      select: { id: true },
    });
    if (!engagement) throw new AppError('SOC 2 engagement not found', 404);

    const cuec = await prisma.sOC2CUEC.create({
      data: {
        organizationId: data.organizationId,
        engagementId: data.engagementId,
        criteriaCategory: data.criteriaCategory,
        controlDescription: data.controlDescription,
        userResponsibility: data.userResponsibility,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'soc2.cuec.created',
      resourceType: 'SOC2CUEC',
      resourceId: cuec.id,
      metadata: { engagementId: data.engagementId, criteriaCategory: data.criteriaCategory },
    });

    return cuec;
  }

  async listCUECs(organizationId: string, engagementId: string) {
    const engagement = await prisma.sOC2Engagement.findFirst({
      where: { id: engagementId, organizationId },
      select: { id: true },
    });
    if (!engagement) throw new AppError('SOC 2 engagement not found', 404);

    return prisma.sOC2CUEC.findMany({
      where: { organizationId, engagementId },
      orderBy: [{ criteriaCategory: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  MANAGEMENT ASSERTIONS
  // ═══════════════════════════════════════════════════════════════════════

  async createManagementAssertion(data: {
    organizationId: string;
    userId: string;
    engagementId: string;
    assertionType: SOC2AssertionType;
    assertionText: string;
    signedByOfficerName: string;
    signedByOfficerTitle: string;
    signedAt: Date;
    documentUrl?: string;
  }) {
    if (data.signedAt > new Date()) {
      throw new AppError('signedAt cannot be in the future', 400);
    }

    const engagement = await prisma.sOC2Engagement.findFirst({
      where: { id: data.engagementId, organizationId: data.organizationId },
      select: { id: true },
    });
    if (!engagement) throw new AppError('SOC 2 engagement not found', 404);

    const assertion = await prisma.sOC2ManagementAssertion.create({
      data: {
        organizationId: data.organizationId,
        engagementId: data.engagementId,
        assertionType: data.assertionType,
        assertionText: data.assertionText,
        signedByOfficerName: data.signedByOfficerName,
        signedByOfficerTitle: data.signedByOfficerTitle,
        signedAt: data.signedAt,
        documentUrl: data.documentUrl,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'soc2.management_assertion.signed',
      resourceType: 'SOC2ManagementAssertion',
      resourceId: assertion.id,
      metadata: {
        engagementId: data.engagementId,
        assertionType: data.assertionType,
        signedByOfficerTitle: data.signedByOfficerTitle,
      },
    });

    realTimeComplianceService.publishComplianceEvent(data.organizationId, {
      type: 'soc2.management_assertion.signed',
      severity: 'Medium',
      payload: {
        assertionId: assertion.id,
        engagementId: data.engagementId,
        assertionType: data.assertionType,
      },
    });

    return assertion;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════

  async getDashboard(organizationId: string): Promise<SOC2Dashboard> {
    const now = new Date();

    const activeEngagement = await prisma.sOC2Engagement.findFirst({
      where: {
        organizationId,
        status: { in: ['Planning', 'Fieldwork', 'Reporting'] },
      },
      orderBy: [{ engagementYear: 'desc' }, { createdAt: 'desc' }],
    });

    const controlsByStatus: Record<SOC2ImplementationStatus, number> = {
      NotImplemented: 0,
      Designed: 0,
      Implemented: 0,
      Operating: 0,
    };
    const controlsByCategory: Record<SOC2TrustService, number> = {
      Security: 0,
      Availability: 0,
      ProcessingIntegrity: 0,
      Confidentiality: 0,
      Privacy: 0,
    };
    const openExceptionsBySeverity: Record<SOC2ExceptionType, number> = {
      DesignDeficiency: 0,
      OperatingDeficiency: 0,
      SignificantDeficiency: 0,
      MaterialWeakness: 0,
    };

    let evidenceCollectionProgress = {
      totalSamples: 0,
      pending: 0,
      collected: 0,
      reviewed: 0,
      approved: 0,
      rejected: 0,
      completionPercent: 0,
    };
    let daysUntilNextTest: number | null = null;
    let readinessScore = 0;

    if (activeEngagement) {
      const [controls, samples, openExceptions] = await Promise.all([
        prisma.sOC2Control.findMany({
          where: { organizationId, engagementId: activeEngagement.id },
          select: {
            criteriaCategory: true,
            implementationStatus: true,
            designStatus: true,
            operatingStatus: true,
            nextTestDate: true,
          },
        }),
        prisma.sOC2EvidenceSample.findMany({
          where: {
            organizationId,
            control: { engagementId: activeEngagement.id },
          },
          select: { status: true },
        }),
        prisma.sOC2Exception.findMany({
          where: {
            organizationId,
            engagementId: activeEngagement.id,
            status: 'Open',
          },
          select: { exceptionType: true },
        }),
      ]);

      for (const c of controls) {
        controlsByStatus[c.implementationStatus as SOC2ImplementationStatus] =
          (controlsByStatus[c.implementationStatus as SOC2ImplementationStatus] ?? 0) + 1;
        controlsByCategory[c.criteriaCategory as SOC2TrustService] =
          (controlsByCategory[c.criteriaCategory as SOC2TrustService] ?? 0) + 1;
      }

      const totalSamples = samples.length;
      const pending = samples.filter((s) => s.status === 'Pending').length;
      const collected = samples.filter((s) => s.status === 'Collected').length;
      const reviewed = samples.filter((s) => s.status === 'Reviewed').length;
      const approved = samples.filter((s) => s.status === 'Approved').length;
      const rejected = samples.filter((s) => s.status === 'Rejected').length;
      const completionPercent = totalSamples === 0 ? 0 : Math.round((approved / totalSamples) * 100);
      evidenceCollectionProgress = {
        totalSamples,
        pending,
        collected,
        reviewed,
        approved,
        rejected,
        completionPercent,
      };

      for (const e of openExceptions) {
        openExceptionsBySeverity[e.exceptionType as SOC2ExceptionType] =
          (openExceptionsBySeverity[e.exceptionType as SOC2ExceptionType] ?? 0) + 1;
      }

      const upcoming = controls
        .map((c) => c.nextTestDate)
        .filter((d): d is Date => d instanceof Date && d > now)
        .sort((a, b) => a.getTime() - b.getTime())[0];
      if (upcoming) {
        daysUntilNextTest = Math.ceil((upcoming.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      }

      readinessScore = this.computeReadinessScore(controls, openExceptions, evidenceCollectionProgress);
    }

    return {
      organizationId,
      activeEngagement: activeEngagement
        ? {
            id: activeEngagement.id,
            engagementYear: activeEngagement.engagementYear,
            engagementType: activeEngagement.engagementType as SOC2EngagementType,
            status: activeEngagement.status as SOC2EngagementStatus,
            trustServicesIncluded: (activeEngagement.trustServicesIncluded as unknown as SOC2TrustService[]) ?? [],
            auditPeriodStart: activeEngagement.auditPeriodStart,
            auditPeriodEnd: activeEngagement.auditPeriodEnd,
            asOfDate: activeEngagement.asOfDate,
          }
        : null,
      controlsByStatus,
      controlsByCategory,
      evidenceCollectionProgress,
      openExceptionsBySeverity,
      daysUntilNextTest,
      readinessScore,
      generatedAt: now,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Internals
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Composite readiness score (0-100) blending control implementation,
   * design/operating effectiveness, evidence completion, and the deficiency
   * load. Material weaknesses and significant deficiencies apply heavier
   * penalties than routine deficiencies. Score is bounded to [0, 100].
   */
  private computeReadinessScore(
    controls: Array<{
      implementationStatus: string;
      designStatus: string;
      operatingStatus: string;
    }>,
    openExceptions: Array<{ exceptionType: string }>,
    evidence: { totalSamples: number; approved: number }
  ): number {
    if (controls.length === 0) return 0;

    const implementedOrOperating = controls.filter(
      (c) => c.implementationStatus === 'Implemented' || c.implementationStatus === 'Operating'
    ).length;
    const designEffective = controls.filter((c) => c.designStatus === 'Effective').length;
    const operatingEffective = controls.filter((c) => c.operatingStatus === 'Effective').length;

    const implementationPct = (implementedOrOperating / controls.length) * 100;
    const designPct = (designEffective / controls.length) * 100;
    const operatingPct = (operatingEffective / controls.length) * 100;
    const evidencePct = evidence.totalSamples === 0 ? 0 : (evidence.approved / evidence.totalSamples) * 100;

    let score = implementationPct * 0.3 + designPct * 0.25 + operatingPct * 0.25 + evidencePct * 0.2;

    for (const e of openExceptions) {
      if (e.exceptionType === 'MaterialWeakness') score -= 15;
      else if (e.exceptionType === 'SignificantDeficiency') score -= 7;
      else if (e.exceptionType === 'OperatingDeficiency') score -= 3;
      else if (e.exceptionType === 'DesignDeficiency') score -= 3;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

const soc2Service = new SOC2Service();
export default soc2Service;
