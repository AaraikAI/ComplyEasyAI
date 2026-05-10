/**
 * PCI-DSS v4.0 Compliance Workflow Service
 *
 * Four responsibilities, all org-scoped:
 *   1. Cardholder Data Environment (CDE) Inventory + Scoping — every system
 *      that stores, processes, or transmits CHD/SAD; segmentation boundaries;
 *      PAN storage justification per §3.3; SAQ type determination
 *      (A, A-EP, B, B-IP, C-VT, C, D-Merchant, D-SP, P2PE).
 *   2. Control Implementation per the 12 PCI requirements — track each
 *      sub-requirement, control owner, implementation status, applicability,
 *      compensating-control linkage.
 *   3. QSA Workflow Tooling — Qualified Security Assessor engagement: ROC
 *      (Report on Compliance) drafting, AOC (Attestation of Compliance)
 *      generation, evidence approval, finding tracking, gap remediation,
 *      Compensating Control Worksheet workflow per Appendix B.
 *   4. Evidence Collection (PCI-scoped) — evidence is tagged to a specific
 *      requirement (e.g. 1.2.1, 8.3.6) and one of the five required types:
 *      configuration screenshots, log samples, policy documents, scan
 *      reports (ASV quarterly + internal), interview records.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuditLogger } from '../utils/auditLogger';
import logger from '../config/logger';
import realTimeComplianceService from './realTimeComplianceService';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type SAQType =
  | 'A'
  | 'A-EP'
  | 'B'
  | 'B-IP'
  | 'C-VT'
  | 'C'
  | 'D-Merchant'
  | 'D-SP'
  | 'P2PE';

export type PCIScopeStatus = 'Draft' | 'Active' | 'UnderReview' | 'Archived';

export type ImplementationStatus =
  | 'NotImplemented'
  | 'PartiallyImplemented'
  | 'Implemented'
  | 'InPlace'
  | 'InPlaceWithCCW'
  | 'NotApplicable';

export type Applicability = 'Applicable' | 'NotApplicable';

export type TestingMethod =
  | 'Observation'
  | 'Documentation'
  | 'Interview'
  | 'SystemConfig';

export type EvidenceType =
  | 'ConfigScreenshot'
  | 'LogSample'
  | 'PolicyDoc'
  | 'ScanReport'
  | 'InterviewRecord'
  | 'PenTestReport'
  | 'ASVScan';

export type EvidenceStatus =
  | 'Pending'
  | 'Collected'
  | 'Reviewed'
  | 'Approved'
  | 'Rejected';

export type QSAApproval = 'Pending' | 'Approved' | 'RequiresMore';

export type FindingType =
  | 'Gap'
  | 'Observation'
  | 'CompensatingControl'
  | 'Recommendation';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export type FindingStatus =
  | 'Open'
  | 'InRemediation'
  | 'AwaitingValidation'
  | 'Closed'
  | 'Accepted';

export type CCWStatus = 'Draft' | 'Approved' | 'Rejected';

export type ROCStatus = 'Draft' | 'InReview' | 'Final';

export type AttestationType =
  | 'Compliant'
  | 'NonCompliant'
  | 'CompliantWithLegalException';

export type MerchantLevel = 1 | 2 | 3 | 4;
export type ServiceProviderLevel = 1 | 2;

export interface PCIDSSDashboard {
  organizationId: string;
  scope: {
    activeScopes: number;
    saqTypeDistribution: Record<string, number>;
    totalConnectedSystems: number;
  };
  requirementsByStatus: Record<ImplementationStatus, number>;
  evidenceByStatus: Record<EvidenceStatus, number>;
  openFindingsBySeverity: Record<Severity, number>;
  overdueRemediations: number;
  daysUntilQuarterlyASV: number | null;
  complianceScore: number; // 0-100
  generatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// PCI-DSS v4.0 Requirement Catalog (representative subset)
// ─────────────────────────────────────────────────────────────────────────────
//
// Canonical sub-requirements drawn from PCI-DSS v4.0 across all 12 high-level
// requirements. Used by bulkSeedRequirements() to bootstrap a new scope's
// PCIRequirement rows. Not exhaustive — operators may add missing sub-reqs
// via upsertRequirement.
// ─────────────────────────────────────────────────────────────────────────────

const PCI_V4_REQUIREMENT_CATALOG: ReadonlyArray<{
  ref: string;
  title: string;
  description: string;
}> = [
  // Req 1 — Install and maintain network security controls
  { ref: '1.2.1', title: 'NSC configuration standards', description: 'Configuration standards for NSC rulesets are defined, implemented, and maintained.' },
  { ref: '1.2.5', title: 'Permitted services and ports documented', description: 'All services, protocols, and ports allowed are identified, approved, and have a defined business need.' },
  { ref: '1.3.1', title: 'Inbound CDE traffic restricted', description: 'Inbound traffic to the CDE is restricted to that which is necessary.' },
  { ref: '1.4.2', title: 'Inbound trusted network traffic', description: 'Inbound traffic from untrusted networks to trusted networks is restricted to communications with system components authorized to provide publicly accessible services.' },

  // Req 2 — Apply secure configurations to all system components
  { ref: '2.2.1', title: 'Configuration standards developed', description: 'Configuration standards are developed, implemented, and maintained for all system components.' },
  { ref: '2.2.2', title: 'Vendor default accounts managed', description: 'Vendor default accounts are managed: removed, disabled, or the default password changed.' },
  { ref: '2.3.1', title: 'Wireless vendor defaults changed', description: 'Wireless vendor defaults are changed prior to or upon deployment to the CDE.' },

  // Req 3 — Protect stored account data
  { ref: '3.2.1', title: 'Account data storage minimized', description: 'Account data storage is kept to a minimum through retention and disposal policies.' },
  { ref: '3.3.1', title: 'SAD not stored after authorization', description: 'SAD is not retained after authorization, even if encrypted.' },
  { ref: '3.4.1', title: 'PAN masked when displayed', description: 'PAN is masked when displayed; only personnel with a legitimate business need can see more than the BIN/last four.' },
  { ref: '3.5.1', title: 'PAN rendered unreadable', description: 'PAN is rendered unreadable anywhere it is stored using strong cryptography.' },

  // Req 4 — Protect cardholder data with strong cryptography during transmission
  { ref: '4.2.1', title: 'Strong cryptography for transmission', description: 'Strong cryptography and security protocols are implemented to safeguard PAN during transmission over open, public networks.' },
  { ref: '4.2.2', title: 'PAN never sent unprotected via end-user messaging', description: 'PAN is secured with strong cryptography whenever it is sent via end-user messaging technologies.' },

  // Req 5 — Protect all systems and networks from malicious software
  { ref: '5.2.1', title: 'Anti-malware deployed', description: 'An anti-malware solution is deployed on all system components, except those identified as not commonly affected.' },
  { ref: '5.3.2', title: 'Anti-malware kept current', description: 'The anti-malware solution is kept current via automatic updates and performs periodic scans.' },

  // Req 6 — Develop and maintain secure systems and software
  { ref: '6.2.1', title: 'Secure software development', description: 'Bespoke and custom software is developed securely.' },
  { ref: '6.3.1', title: 'Vulnerabilities identified and ranked', description: 'Security vulnerabilities are identified and managed via reputable sources and risk-ranked.' },
  { ref: '6.3.3', title: 'System components patched', description: 'All system components are protected from known vulnerabilities by installing applicable security patches/updates.' },
  { ref: '6.4.3', title: 'Public-facing web app protections', description: 'Public-facing web applications are protected against attacks via automated technical solution(s) or manual review.' },

  // Req 7 — Restrict access to system components and cardholder data by business need to know
  { ref: '7.2.1', title: 'Access control model defined', description: 'An access control model is defined and includes granting access based on job classification and function.' },
  { ref: '7.2.4', title: 'User accounts reviewed periodically', description: 'All user accounts and related access privileges are reviewed at least once every six months.' },

  // Req 8 — Identify users and authenticate access to system components
  { ref: '8.2.1', title: 'Unique IDs assigned', description: 'All users are assigned a unique ID before access to system components or cardholder data is allowed.' },
  { ref: '8.3.1', title: 'Strong authentication factors', description: 'All user access to system components is authenticated via at least one of: knowledge factor, possession factor, or inherence factor.' },
  { ref: '8.3.6', title: 'Password complexity enforced', description: 'Passwords/passphrases are at least 12 characters and contain both numeric and alphabetic characters.' },
  { ref: '8.4.2', title: 'MFA for all non-console CDE access', description: 'MFA is implemented for all non-console access into the CDE.' },
  { ref: '8.4.3', title: 'MFA for remote network access', description: 'MFA is implemented for all remote network access originating from outside the entity\'s network.' },

  // Req 9 — Restrict physical access to cardholder data
  { ref: '9.2.1', title: 'Physical access controls', description: 'Appropriate facility entry controls are in place to restrict physical access to systems in the CDE.' },
  { ref: '9.4.1', title: 'Media physically secured', description: 'All media with cardholder data is physically secured.' },

  // Req 10 — Log and monitor all access to system components and cardholder data
  { ref: '10.2.1', title: 'Audit logs enabled', description: 'Audit logs are enabled and active for all system components and cardholder data.' },
  { ref: '10.2.2', title: 'Audit log content', description: 'Audit logs record specified details: user identification, type of event, date and time, success/failure indication, origination, identity of affected resource.' },
  { ref: '10.4.1', title: 'Daily log review', description: 'Audit logs of system components in scope are reviewed at least once daily.' },
  { ref: '10.6.1', title: 'Time synchronization', description: 'System clocks and time are synchronized using time-synchronization technology.' },

  // Req 11 — Test security of systems and networks regularly
  { ref: '11.3.1', title: 'Internal vulnerability scans', description: 'Internal vulnerability scans are performed at least once every three months.' },
  { ref: '11.3.2', title: 'External ASV scans', description: 'External vulnerability scans are performed at least once every three months by a PCI SSC Approved Scanning Vendor (ASV).' },
  { ref: '11.4.1', title: 'Penetration testing methodology', description: 'A penetration testing methodology is defined, documented, and implemented.' },
  { ref: '11.4.3', title: 'External penetration testing', description: 'External penetration testing is performed at least once every 12 months and after any significant change.' },

  // Req 12 — Support information security with organizational policies and programs
  { ref: '12.1.1', title: 'Information security policy', description: 'An overall information security policy is established, published, maintained, and disseminated to all relevant personnel.' },
  { ref: '12.3.1', title: 'Targeted risk analysis', description: 'For each PCI DSS requirement that provides flexibility, a targeted risk analysis is documented.' },
  { ref: '12.6.1', title: 'Security awareness program', description: 'A formal security awareness program is implemented for all personnel.' },
  { ref: '12.8.1', title: 'TPSP inventory maintained', description: 'A list of all third-party service providers (TPSPs) with which account data is shared, or that could affect security of account data, is maintained.' },
  { ref: '12.10.1', title: 'Incident response plan', description: 'An incident response plan exists and is ready to be activated in the event of a suspected or confirmed security incident.' },
  { ref: '12.10.7', title: 'Stored PAN incident response', description: 'Incident response procedures are in place to be initiated upon the detection of stored PAN anywhere it is not expected.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export class PCIDSSService {

  // ═══════════════════════════════════════════════════════════════════════
  //  CDE SCOPE & SAQ DETERMINATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Create a PCI-DSS scope record. The scope statement defines the boundary
   * of the CDE; segmentation evidence and SAQ type drive the assessment plan.
   */
  async createScope(data: {
    organizationId: string;
    userId: string;
    name: string;
    scopeStatement: string;
    saqType: SAQType;
    segmentationDescription?: string;
    cdeBoundaries?: Record<string, unknown>;
    connectedSystemsCount?: number;
    networkDiagramRef?: string;
    dataFlowDiagramRef?: string;
    assessmentYear: number;
    qsaCompany?: string;
    qsaContactName?: string;
    qsaContactEmail?: string;
    leadAssessor?: string;
    status?: PCIScopeStatus;
  }) {
    if (data.assessmentYear < 2020 || data.assessmentYear > 2100) {
      throw new AppError('assessmentYear is out of range', 400);
    }

    const scope = await (prisma as any).pCIScope.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        scopeStatement: data.scopeStatement,
        saqType: data.saqType,
        segmentationDescription: data.segmentationDescription,
        cdeBoundaries: (data.cdeBoundaries ?? null) as never,
        connectedSystemsCount: data.connectedSystemsCount ?? 0,
        networkDiagramRef: data.networkDiagramRef,
        dataFlowDiagramRef: data.dataFlowDiagramRef,
        status: data.status ?? 'Draft',
        assessmentYear: data.assessmentYear,
        qsaCompany: data.qsaCompany,
        qsaContactName: data.qsaContactName,
        qsaContactEmail: data.qsaContactEmail,
        leadAssessor: data.leadAssessor,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'pcidss.scope.created',
      resourceType: 'PCIScope',
      resourceId: scope.id,
      metadata: { name: data.name, saqType: data.saqType, assessmentYear: data.assessmentYear },
    });

    realTimeComplianceService.publishComplianceEvent(data.organizationId, {
      type: 'pcidss.scope.created',
      severity: 'Medium',
      payload: { scopeId: scope.id, saqType: data.saqType },
    });

    return scope;
  }

  async updateScope(
    id: string,
    organizationId: string,
    userId: string,
    patch: Partial<{
      name: string;
      scopeStatement: string;
      saqType: SAQType;
      segmentationDescription: string;
      cdeBoundaries: Record<string, unknown>;
      connectedSystemsCount: number;
      networkDiagramRef: string;
      dataFlowDiagramRef: string;
      status: PCIScopeStatus;
      qsaCompany: string;
      qsaContactName: string;
      qsaContactEmail: string;
      leadAssessor: string;
    }>
  ) {
    const existing = await (prisma as any).pCIScope.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError('PCI scope not found', 404);

    const updated = await (prisma as any).pCIScope.update({
      where: { id },
      data: {
        ...patch,
        cdeBoundaries: patch.cdeBoundaries as never,
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'pcidss.scope.updated',
      resourceType: 'PCIScope',
      resourceId: id,
      metadata: { changedKeys: Object.keys(patch) },
    });

    return updated;
  }

  async listScopes(
    organizationId: string,
    filters?: { status?: PCIScopeStatus; saqType?: SAQType; assessmentYear?: number }
  ) {
    return (prisma as any).pCIScope.findMany({
      where: {
        organizationId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.saqType && { saqType: filters.saqType }),
        ...(filters?.assessmentYear && { assessmentYear: filters.assessmentYear }),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getScope(id: string, organizationId: string) {
    const scope = await (prisma as any).pCIScope.findFirst({
      where: { id, organizationId },
    });
    if (!scope) throw new AppError('PCI scope not found', 404);
    return scope;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  REQUIREMENTS  (control implementation tracking)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Idempotent upsert keyed on (scopeId, requirementRef). Used both by the
   * bulk seeder and by interactive editing of an individual sub-requirement.
   */
  async upsertRequirement(data: {
    organizationId: string;
    userId: string;
    scopeId: string;
    requirementRef: string;
    title: string;
    description: string;
    controlOwner?: string;
    implementationStatus?: ImplementationStatus;
    applicability?: Applicability;
    notApplicableJustification?: string;
    compensatingControlRef?: string;
    lastTestedAt?: Date;
    testingMethod?: TestingMethod;
    testingNotes?: string;
    evidenceRefs?: unknown[];
  }) {
    const scope = await (prisma as any).pCIScope.findFirst({
      where: { id: data.scopeId, organizationId: data.organizationId },
      select: { id: true },
    });
    if (!scope) throw new AppError('PCI scope not found', 404);

    if (data.applicability === 'NotApplicable' && !data.notApplicableJustification) {
      throw new AppError('notApplicableJustification is required when applicability is NotApplicable', 400);
    }
    if (data.implementationStatus === 'InPlaceWithCCW' && !data.compensatingControlRef) {
      throw new AppError('compensatingControlRef is required for InPlaceWithCCW status', 400);
    }

    const existing = await (prisma as any).pCIRequirement.findFirst({
      where: {
        organizationId: data.organizationId,
        scopeId: data.scopeId,
        requirementRef: data.requirementRef,
      },
      select: { id: true },
    });

    const payload = {
      organizationId: data.organizationId,
      scopeId: data.scopeId,
      requirementRef: data.requirementRef,
      title: data.title,
      description: data.description,
      controlOwner: data.controlOwner,
      implementationStatus: data.implementationStatus ?? 'NotImplemented',
      applicability: data.applicability ?? 'Applicable',
      notApplicableJustification: data.notApplicableJustification,
      compensatingControlRef: data.compensatingControlRef,
      lastTestedAt: data.lastTestedAt,
      testingMethod: data.testingMethod,
      testingNotes: data.testingNotes,
      evidenceRefs: (data.evidenceRefs ?? []) as never,
    };

    const requirement = existing
      ? await (prisma as any).pCIRequirement.update({ where: { id: existing.id }, data: payload })
      : await (prisma as any).pCIRequirement.create({ data: payload });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: existing ? 'pcidss.requirement.updated' : 'pcidss.requirement.created',
      resourceType: 'PCIRequirement',
      resourceId: requirement.id,
      metadata: {
        scopeId: data.scopeId,
        requirementRef: data.requirementRef,
        implementationStatus: payload.implementationStatus,
      },
    });

    return requirement;
  }

  async listRequirements(
    organizationId: string,
    scopeId: string,
    filters?: {
      implementationStatus?: ImplementationStatus;
      applicability?: Applicability;
      controlOwner?: string;
    }
  ) {
    const scope = await (prisma as any).pCIScope.findFirst({
      where: { id: scopeId, organizationId },
      select: { id: true },
    });
    if (!scope) throw new AppError('PCI scope not found', 404);

    return (prisma as any).pCIRequirement.findMany({
      where: {
        organizationId,
        scopeId,
        ...(filters?.implementationStatus && { implementationStatus: filters.implementationStatus }),
        ...(filters?.applicability && { applicability: filters.applicability }),
        ...(filters?.controlOwner && { controlOwner: filters.controlOwner }),
      },
      orderBy: { requirementRef: 'asc' },
    });
  }

  async getRequirement(id: string, organizationId: string) {
    const requirement = await (prisma as any).pCIRequirement.findFirst({
      where: { id, organizationId },
    });
    if (!requirement) throw new AppError('PCI requirement not found', 404);
    return requirement;
  }

  /**
   * Bulk-seed the representative PCI-DSS v4.0 requirement catalog into a scope
   * in one transaction. Skips refs that already exist for the scope so the
   * operation is safe to re-run.
   */
  async bulkSeedRequirements(scopeId: string, organizationId: string, userId: string) {
    const scope = await (prisma as any).pCIScope.findFirst({
      where: { id: scopeId, organizationId },
      select: { id: true },
    });
    if (!scope) throw new AppError('PCI scope not found', 404);

    const existing = await (prisma as any).pCIRequirement.findMany({
      where: { organizationId, scopeId },
      select: { requirementRef: true },
    });
    const existingRefs = new Set<string>(existing.map((e: { requirementRef: string }) => e.requirementRef));

    const toCreate = PCI_V4_REQUIREMENT_CATALOG.filter((r) => !existingRefs.has(r.ref));
    if (toCreate.length === 0) {
      return { created: 0, skipped: existingRefs.size, total: PCI_V4_REQUIREMENT_CATALOG.length };
    }

    await prisma.$transaction(
      toCreate.map((entry) =>
        (prisma as any).pCIRequirement.create({
          data: {
            organizationId,
            scopeId,
            requirementRef: entry.ref,
            title: entry.title,
            description: entry.description,
            implementationStatus: 'NotImplemented',
            applicability: 'Applicable',
            evidenceRefs: [] as never,
          },
        })
      )
    );

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'pcidss.requirements.bulk_seeded',
      resourceType: 'PCIScope',
      resourceId: scopeId,
      metadata: { created: toCreate.length, skipped: existingRefs.size },
    });

    return { created: toCreate.length, skipped: existingRefs.size, total: PCI_V4_REQUIREMENT_CATALOG.length };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  EVIDENCE COLLECTION  (PCI-scoped)
  // ═══════════════════════════════════════════════════════════════════════

  async createEvidence(data: {
    organizationId: string;
    userId: string;
    scopeId: string;
    requirementId: string;
    evidenceType: EvidenceType;
    title: string;
    description?: string;
    fileUrl?: string;
    fileSha256?: string;
    collectedBy: string;
    collectedAt?: Date;
    validUntil?: Date;
    retentionUntil?: Date;
    status?: EvidenceStatus;
  }) {
    const requirement = await (prisma as any).pCIRequirement.findFirst({
      where: {
        id: data.requirementId,
        organizationId: data.organizationId,
        scopeId: data.scopeId,
      },
      select: { id: true },
    });
    if (!requirement) {
      throw new AppError('Requirement not found in the specified scope', 404);
    }

    const evidence = await (prisma as any).pCIEvidence.create({
      data: {
        organizationId: data.organizationId,
        scopeId: data.scopeId,
        requirementId: data.requirementId,
        evidenceType: data.evidenceType,
        title: data.title,
        description: data.description,
        fileUrl: data.fileUrl,
        fileSha256: data.fileSha256,
        collectedBy: data.collectedBy,
        collectedAt: data.collectedAt ?? new Date(),
        validUntil: data.validUntil,
        retentionUntil: data.retentionUntil,
        status: data.status ?? 'Collected',
        qsaApproval: 'Pending',
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'pcidss.evidence.created',
      resourceType: 'PCIEvidence',
      resourceId: evidence.id,
      metadata: {
        requirementId: data.requirementId,
        evidenceType: data.evidenceType,
        fileSha256: data.fileSha256,
      },
    });

    return evidence;
  }

  async listEvidence(
    organizationId: string,
    filters?: {
      scopeId?: string;
      requirementId?: string;
      evidenceType?: EvidenceType;
      status?: EvidenceStatus;
      qsaApproval?: QSAApproval;
    }
  ) {
    return (prisma as any).pCIEvidence.findMany({
      where: {
        organizationId,
        ...(filters?.scopeId && { scopeId: filters.scopeId }),
        ...(filters?.requirementId && { requirementId: filters.requirementId }),
        ...(filters?.evidenceType && { evidenceType: filters.evidenceType }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.qsaApproval && { qsaApproval: filters.qsaApproval }),
      },
      orderBy: { collectedAt: 'desc' },
    });
  }

  async approveEvidence(id: string, organizationId: string, reviewerId: string) {
    const existing = await (prisma as any).pCIEvidence.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError('Evidence not found', 404);

    const updated = await (prisma as any).pCIEvidence.update({
      where: { id },
      data: {
        status: 'Approved',
        qsaApproval: 'Approved',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    await AuditLogger.log({
      userId: reviewerId,
      organizationId,
      action: 'pcidss.evidence.approved',
      resourceType: 'PCIEvidence',
      resourceId: id,
      metadata: { previousStatus: existing.status },
    });

    return updated;
  }

  async rejectEvidence(id: string, organizationId: string, reviewerId: string, reason: string) {
    if (!reason || reason.trim().length < 5) {
      throw new AppError('Rejection reason must be at least 5 characters', 400);
    }

    const existing = await (prisma as any).pCIEvidence.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError('Evidence not found', 404);

    const updated = await (prisma as any).pCIEvidence.update({
      where: { id },
      data: {
        status: 'Rejected',
        qsaApproval: 'RequiresMore',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    await AuditLogger.log({
      userId: reviewerId,
      organizationId,
      action: 'pcidss.evidence.rejected',
      resourceType: 'PCIEvidence',
      resourceId: id,
      metadata: { reason, previousStatus: existing.status },
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  QSA FINDINGS
  // ═══════════════════════════════════════════════════════════════════════

  async createQSAFinding(data: {
    organizationId: string;
    userId: string;
    scopeId: string;
    requirementId?: string;
    findingType: FindingType;
    severity: Severity;
    title: string;
    description: string;
    qsaName: string;
    identifiedAt?: Date;
    remediationOwner?: string;
    remediationDueDate?: Date;
  }) {
    const scope = await (prisma as any).pCIScope.findFirst({
      where: { id: data.scopeId, organizationId: data.organizationId },
      select: { id: true },
    });
    if (!scope) throw new AppError('PCI scope not found', 404);

    if (data.requirementId) {
      const req = await (prisma as any).pCIRequirement.findFirst({
        where: {
          id: data.requirementId,
          organizationId: data.organizationId,
          scopeId: data.scopeId,
        },
        select: { id: true },
      });
      if (!req) throw new AppError('Requirement not found in the specified scope', 404);
    }

    const finding = await (prisma as any).qSAFinding.create({
      data: {
        organizationId: data.organizationId,
        scopeId: data.scopeId,
        requirementId: data.requirementId,
        findingType: data.findingType,
        severity: data.severity,
        title: data.title,
        description: data.description,
        qsaName: data.qsaName,
        identifiedAt: data.identifiedAt ?? new Date(),
        status: 'Open',
        remediationOwner: data.remediationOwner,
        remediationDueDate: data.remediationDueDate,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'pcidss.qsa_finding.created',
      resourceType: 'QSAFinding',
      resourceId: finding.id,
      metadata: {
        findingType: data.findingType,
        severity: data.severity,
        scopeId: data.scopeId,
        requirementId: data.requirementId,
      },
    });

    if (data.severity === 'Critical' || data.severity === 'High') {
      realTimeComplianceService.publishComplianceEvent(data.organizationId, {
        type: 'pcidss.qsa_finding.high_severity',
        severity: data.severity,
        payload: {
          findingId: finding.id,
          title: data.title,
          findingType: data.findingType,
          requirementId: data.requirementId,
        },
      });

      void realTimeComplianceService
        .notifyOrgAdmins(data.organizationId, {
          title: `PCI-DSS QSA finding (${data.severity}): ${data.title}`,
          message: data.description.slice(0, 280),
          type: data.severity === 'Critical' ? 'error' : 'warning',
          link: `/pci-dss/findings/${finding.id}`,
        })
        .catch((err) => logger.warn('notifyOrgAdmins failed for PCI finding', err));
    }

    return finding;
  }

  async updateQSAFindingStatus(
    id: string,
    organizationId: string,
    userId: string,
    status: FindingStatus,
    remediationEvidence?: Record<string, unknown>
  ) {
    const existing = await (prisma as any).qSAFinding.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true, severity: true },
    });
    if (!existing) throw new AppError('QSA finding not found', 404);

    const data: Record<string, unknown> = {
      status,
      remediationEvidence: (remediationEvidence ?? null) as never,
    };
    if (status === 'Closed' || status === 'Accepted') {
      data.remediationCompletedAt = new Date();
    }

    const updated = await (prisma as any).qSAFinding.update({
      where: { id },
      data,
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'pcidss.qsa_finding.status_changed',
      resourceType: 'QSAFinding',
      resourceId: id,
      metadata: { previousStatus: existing.status, newStatus: status, severity: existing.severity },
    });

    return updated;
  }

  async listQSAFindings(
    organizationId: string,
    filters?: {
      scopeId?: string;
      requirementId?: string;
      severity?: Severity;
      status?: FindingStatus;
      findingType?: FindingType;
    }
  ) {
    return (prisma as any).qSAFinding.findMany({
      where: {
        organizationId,
        ...(filters?.scopeId && { scopeId: filters.scopeId }),
        ...(filters?.requirementId && { requirementId: filters.requirementId }),
        ...(filters?.severity && { severity: filters.severity }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.findingType && { findingType: filters.findingType }),
      },
      orderBy: [{ severity: 'asc' }, { identifiedAt: 'desc' }],
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  COMPENSATING CONTROL WORKSHEET  (Appendix B)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Create a Compensating Control Worksheet per PCI-DSS Appendix B. Required
   * sections: original requirement, constraint, objective, identified risk,
   * definition of compensating control, validation, maintenance.
   */
  async createCCW(data: {
    organizationId: string;
    userId: string;
    requirementId: string;
    originalRequirement: string;
    constraint: string;
    objective: string;
    identifiedRisk: string;
    definitionOfCompensatingControl: string;
    validationOfControl: string;
    maintenance: string;
  }) {
    const requirement = await (prisma as any).pCIRequirement.findFirst({
      where: { id: data.requirementId, organizationId: data.organizationId },
      select: { id: true },
    });
    if (!requirement) throw new AppError('PCI requirement not found', 404);

    const minLen = (s: string) => s && s.trim().length >= 10;
    if (![data.constraint, data.objective, data.identifiedRisk, data.definitionOfCompensatingControl, data.validationOfControl, data.maintenance].every(minLen)) {
      throw new AppError('Each CCW section must be at least 10 characters per PCI-DSS Appendix B', 400);
    }

    const ccw = await (prisma as any).compensatingControlWorksheet.create({
      data: {
        organizationId: data.organizationId,
        requirementId: data.requirementId,
        originalRequirement: data.originalRequirement,
        constraint: data.constraint,
        objective: data.objective,
        identifiedRisk: data.identifiedRisk,
        definitionOfCompensatingControl: data.definitionOfCompensatingControl,
        validationOfControl: data.validationOfControl,
        maintenance: data.maintenance,
        status: 'Draft',
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'pcidss.ccw.created',
      resourceType: 'CompensatingControlWorksheet',
      resourceId: ccw.id,
      metadata: { requirementId: data.requirementId },
    });

    return ccw;
  }

  async approveCCW(id: string, organizationId: string, approverId: string) {
    const existing = await (prisma as any).compensatingControlWorksheet.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true, requirementId: true },
    });
    if (!existing) throw new AppError('Compensating Control Worksheet not found', 404);
    if (existing.status === 'Approved') return existing;

    const [updated] = await prisma.$transaction([
      (prisma as any).compensatingControlWorksheet.update({
        where: { id },
        data: { status: 'Approved', approvedBy: approverId, approvedAt: new Date() },
      }),
      (prisma as any).pCIRequirement.update({
        where: { id: existing.requirementId },
        data: { implementationStatus: 'InPlaceWithCCW', compensatingControlRef: id },
      }),
    ]);

    await AuditLogger.log({
      userId: approverId,
      organizationId,
      action: 'pcidss.ccw.approved',
      resourceType: 'CompensatingControlWorksheet',
      resourceId: id,
      metadata: { requirementId: existing.requirementId },
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  ROC / AOC
  // ═══════════════════════════════════════════════════════════════════════

  async createROC(data: {
    organizationId: string;
    userId: string;
    scopeId: string;
    version: string;
    coveragePeriodStart: Date;
    coveragePeriodEnd: Date;
    qsaCompany: string;
    leadAssessor: string;
    executiveSummary?: string;
    scopeDescription?: string;
    networkSegmentation?: string;
    samplingMethodology?: string;
  }) {
    if (data.coveragePeriodEnd <= data.coveragePeriodStart) {
      throw new AppError('coveragePeriodEnd must be after coveragePeriodStart', 400);
    }

    const scope = await (prisma as any).pCIScope.findFirst({
      where: { id: data.scopeId, organizationId: data.organizationId },
      select: { id: true },
    });
    if (!scope) throw new AppError('PCI scope not found', 404);

    const findingsCount = await (prisma as any).qSAFinding.count({
      where: { organizationId: data.organizationId, scopeId: data.scopeId },
    });

    const roc = await (prisma as any).pCIROC.create({
      data: {
        organizationId: data.organizationId,
        scopeId: data.scopeId,
        version: data.version,
        status: 'Draft',
        coveragePeriodStart: data.coveragePeriodStart,
        coveragePeriodEnd: data.coveragePeriodEnd,
        qsaCompany: data.qsaCompany,
        leadAssessor: data.leadAssessor,
        executiveSummary: data.executiveSummary,
        scopeDescription: data.scopeDescription,
        networkSegmentation: data.networkSegmentation,
        samplingMethodology: data.samplingMethodology,
        findingsCount,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'pcidss.roc.created',
      resourceType: 'PCIROC',
      resourceId: roc.id,
      metadata: { scopeId: data.scopeId, version: data.version, findingsCount },
    });

    return roc;
  }

  async finalizeROC(id: string, organizationId: string, userId: string) {
    const existing = await (prisma as any).pCIROC.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true, scopeId: true },
    });
    if (!existing) throw new AppError('ROC not found', 404);
    if (existing.status === 'Final') {
      throw new AppError('ROC is already finalized', 400);
    }

    const openCriticalOrHigh = await (prisma as any).qSAFinding.count({
      where: {
        organizationId,
        scopeId: existing.scopeId,
        severity: { in: ['Critical', 'High'] },
        status: { in: ['Open', 'InRemediation'] },
      },
    });
    if (openCriticalOrHigh > 0) {
      throw new AppError(
        `Cannot finalize ROC: ${openCriticalOrHigh} unresolved Critical/High finding(s) exist`,
        409
      );
    }

    const updated = await (prisma as any).pCIROC.update({
      where: { id },
      data: { status: 'Final', finalizedAt: new Date() },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'pcidss.roc.finalized',
      resourceType: 'PCIROC',
      resourceId: id,
      metadata: { scopeId: existing.scopeId },
    });

    realTimeComplianceService.publishComplianceEvent(organizationId, {
      type: 'pcidss.roc.finalized',
      severity: 'Medium',
      payload: { rocId: id, scopeId: existing.scopeId },
    });

    return updated;
  }

  async generateAOC(
    rocId: string,
    organizationId: string,
    userId: string,
    data: {
      attestationType: AttestationType;
      merchantLevel?: MerchantLevel;
      serviceProviderLevel?: ServiceProviderLevel;
      assessmentEndDate: Date;
      signedByMerchantOfficer: string;
      signedByQSA: string;
      validUntil?: Date;
      documentUrl?: string;
    }
  ) {
    const roc = await (prisma as any).pCIROC.findFirst({
      where: { id: rocId, organizationId },
      select: { id: true, status: true },
    });
    if (!roc) throw new AppError('ROC not found', 404);
    if (roc.status !== 'Final') {
      throw new AppError('AOC can only be generated from a finalized ROC', 400);
    }
    if (!data.merchantLevel && !data.serviceProviderLevel) {
      throw new AppError('Either merchantLevel or serviceProviderLevel is required', 400);
    }

    const aoc = await (prisma as any).pCIAOC.create({
      data: {
        organizationId,
        rocId,
        attestationType: data.attestationType,
        merchantLevel: data.merchantLevel,
        serviceProviderLevel: data.serviceProviderLevel,
        assessmentEndDate: data.assessmentEndDate,
        signedByMerchantOfficer: data.signedByMerchantOfficer,
        signedByQSA: data.signedByQSA,
        validUntil: data.validUntil ?? new Date(data.assessmentEndDate.getTime() + 365 * 24 * 60 * 60 * 1000),
        documentUrl: data.documentUrl,
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'pcidss.aoc.generated',
      resourceType: 'PCIAOC',
      resourceId: aoc.id,
      metadata: {
        rocId,
        attestationType: data.attestationType,
        merchantLevel: data.merchantLevel,
        serviceProviderLevel: data.serviceProviderLevel,
      },
    });

    realTimeComplianceService.publishComplianceEvent(organizationId, {
      type: 'pcidss.aoc.generated',
      severity: data.attestationType === 'Compliant' ? 'Low' : 'High',
      payload: { aocId: aoc.id, rocId, attestationType: data.attestationType },
    });

    return aoc;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════

  async getDashboard(organizationId: string): Promise<PCIDSSDashboard> {
    const now = new Date();

    const [scopes, requirements, evidence, findings] = await Promise.all([
      (prisma as any).pCIScope.findMany({
        where: { organizationId },
        select: { id: true, status: true, saqType: true, connectedSystemsCount: true },
      }),
      (prisma as any).pCIRequirement.findMany({
        where: { organizationId },
        select: { implementationStatus: true, applicability: true },
      }),
      (prisma as any).pCIEvidence.findMany({
        where: { organizationId },
        select: { status: true, evidenceType: true, collectedAt: true },
      }),
      (prisma as any).qSAFinding.findMany({
        where: { organizationId },
        select: { severity: true, status: true, remediationDueDate: true },
      }),
    ]);

    const activeScopes = scopes.filter((s: any) => s.status === 'Active').length;
    const saqTypeDistribution: Record<string, number> = {};
    let totalConnectedSystems = 0;
    for (const s of scopes as Array<{ saqType: string; connectedSystemsCount: number | null }>) {
      saqTypeDistribution[s.saqType] = (saqTypeDistribution[s.saqType] ?? 0) + 1;
      totalConnectedSystems += s.connectedSystemsCount ?? 0;
    }

    const requirementsByStatus: Record<ImplementationStatus, number> = {
      NotImplemented: 0,
      PartiallyImplemented: 0,
      Implemented: 0,
      InPlace: 0,
      InPlaceWithCCW: 0,
      NotApplicable: 0,
    };
    for (const r of requirements as Array<{ implementationStatus: ImplementationStatus }>) {
      requirementsByStatus[r.implementationStatus] = (requirementsByStatus[r.implementationStatus] ?? 0) + 1;
    }

    const evidenceByStatus: Record<EvidenceStatus, number> = {
      Pending: 0, Collected: 0, Reviewed: 0, Approved: 0, Rejected: 0,
    };
    let lastASVScan: Date | null = null;
    for (const e of evidence as Array<{ status: EvidenceStatus; evidenceType: EvidenceType; collectedAt: Date | null }>) {
      evidenceByStatus[e.status] = (evidenceByStatus[e.status] ?? 0) + 1;
      if (e.evidenceType === 'ASVScan' && e.collectedAt) {
        if (!lastASVScan || e.collectedAt > lastASVScan) lastASVScan = e.collectedAt;
      }
    }

    const openFindingsBySeverity: Record<Severity, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    let overdueRemediations = 0;
    for (const f of findings as Array<{ severity: Severity; status: FindingStatus; remediationDueDate: Date | null }>) {
      if (f.status === 'Open' || f.status === 'InRemediation' || f.status === 'AwaitingValidation') {
        openFindingsBySeverity[f.severity] = (openFindingsBySeverity[f.severity] ?? 0) + 1;
        if (f.remediationDueDate && f.remediationDueDate < now) overdueRemediations++;
      }
    }

    // ASV scans must be quarterly per Req 11.3.2 — flag days-until-next.
    const daysUntilQuarterlyASV = lastASVScan
      ? Math.max(0, Math.ceil((lastASVScan.getTime() + 90 * 24 * 60 * 60 * 1000 - now.getTime()) / (24 * 60 * 60 * 1000)))
      : null;

    const complianceScore = this.computeComplianceScore(requirementsByStatus, openFindingsBySeverity);

    return {
      organizationId,
      scope: {
        activeScopes,
        saqTypeDistribution,
        totalConnectedSystems,
      },
      requirementsByStatus,
      evidenceByStatus,
      openFindingsBySeverity,
      overdueRemediations,
      daysUntilQuarterlyASV,
      complianceScore,
      generatedAt: now,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Internals
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Compute a 0-100 compliance score from requirement implementation
   * distribution and open finding counts. Implemented/InPlace count fully;
   * InPlaceWithCCW counts at 0.85; PartiallyImplemented at 0.5; NotApplicable
   * is removed from the denominator. Each open finding deducts a severity-
   * weighted penalty.
   */
  private computeComplianceScore(
    reqByStatus: Record<ImplementationStatus, number>,
    openBySeverity: Record<Severity, number>
  ): number {
    const total =
      reqByStatus.NotImplemented +
      reqByStatus.PartiallyImplemented +
      reqByStatus.Implemented +
      reqByStatus.InPlace +
      reqByStatus.InPlaceWithCCW;

    if (total === 0) return 0;

    const credit =
      reqByStatus.Implemented * 1.0 +
      reqByStatus.InPlace * 1.0 +
      reqByStatus.InPlaceWithCCW * 0.85 +
      reqByStatus.PartiallyImplemented * 0.5;

    let score = Math.round((credit / total) * 100);

    score -= openBySeverity.Critical * 10;
    score -= openBySeverity.High * 5;
    score -= openBySeverity.Medium * 2;
    score -= openBySeverity.Low * 1;

    if (score < 0) score = 0;
    if (score > 100) score = 100;
    return score;
  }
}

const pciDssService = new PCIDSSService();
export default pciDssService;
