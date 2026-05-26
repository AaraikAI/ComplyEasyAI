/**
 * ISO 27001 Guided Workflow Service
 *
 * Wraps the ISO 27001:2022 Annex A control catalog (already pre-loaded in
 * data/frameworks/iso27001Controls.ts) with the workflow artifacts an external
 * auditor expects:
 *   - Statement of Applicability (SoA) — required Annex A justification record
 *   - ISMS risk register (threat × vulnerability × asset, with treatment plan)
 *   - Internal audit + management review evidence
 *   - Corrective action tracking through certification + surveillance audits
 *
 * Modelled after soxService.ts / doraService.ts: dedicated Prisma models, full
 * CRUD, multi-tenant org scoping enforced at every query, every state-change
 * audit-logged. Score-impacting writes notify realTimeComplianceService so
 * dashboards refresh in real time.
 */

import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuditLogger } from '../utils/auditLogger';
import realTimeComplianceService from './realTimeComplianceService';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type ISO27001AssessmentStatus =
  | 'InProgress'
  | 'InternalAudit'
  | 'ManagementReview'
  | 'Stage1Audit'
  | 'Stage2Audit'
  | 'Certified'
  | 'SurveillanceAudit'
  | 'RecertificationDue'
  | 'Completed';

export type SoAApplicability = 'Applicable' | 'NotApplicable';
export type SoAImplementationStatus =
  | 'NotImplemented'
  | 'PartiallyImplemented'
  | 'Implemented'
  | 'Operating';

export type RiskTreatmentDecision = 'Mitigate' | 'Transfer' | 'Avoid' | 'Accept';
export type RiskScenarioStatus = 'Open' | 'Treated' | 'Accepted' | 'Closed';

export type CorrectiveActionSource =
  | 'InternalAudit'
  | 'Stage1Audit'
  | 'Stage2Audit'
  | 'ManagementReview'
  | 'SurveillanceAudit'
  | 'IncidentReview';
export type CorrectiveActionStatus =
  | 'Open'
  | 'InProgress'
  | 'AwaitingVerification'
  | 'Verified'
  | 'Closed';

export type WorkflowStepKey =
  | 'define-scope'
  | 'risk-assessment'
  | 'soa-completion'
  | 'control-implementation'
  | 'internal-audit'
  | 'management-review'
  | 'stage1-audit'
  | 'stage2-audit'
  | 'certification'
  | 'surveillance';

export interface WorkflowStep {
  key: WorkflowStepKey;
  title: string;
  description: string;
  prerequisite: WorkflowStepKey | null;
  blockedBy: string[];
  completed: boolean;
  current: boolean;
  metadata: Record<string, unknown>;
}

export interface ISO27001Dashboard {
  organizationId: string;
  activeAssessment: {
    id: string;
    assessmentYear: number;
    status: ISO27001AssessmentStatus;
    scope: string;
    certificationDate: Date | null;
    certificateExpiresAt: Date | null;
  } | null;
  soaCoverage: {
    totalControls: number;
    applicable: number;
    notApplicable: number;
    implementedOrOperating: number;
    coveragePercent: number;
  };
  riskRegister: {
    open: number;
    treated: number;
    highInherent: number;
    averageResidual: number | null;
  };
  correctiveActions: {
    open: number;
    overdue: number;
    awaitingVerification: number;
  };
  certificateExpiringInDays: number | null;
  generatedAt: Date;
}

const WORKFLOW_STEPS: ReadonlyArray<{
  key: WorkflowStepKey;
  title: string;
  description: string;
  prerequisite: WorkflowStepKey | null;
}> = [
  { key: 'define-scope', title: 'Define ISMS Scope', description: 'Document ISMS scope: people, processes, technology, locations, exclusions.', prerequisite: null },
  { key: 'risk-assessment', title: 'Risk Assessment', description: 'Build the risk register: threats, vulnerabilities, assets, likelihood, impact.', prerequisite: 'define-scope' },
  { key: 'soa-completion', title: 'Statement of Applicability', description: 'Mark each Annex A control Applicable / Not Applicable with justification.', prerequisite: 'risk-assessment' },
  { key: 'control-implementation', title: 'Control Implementation', description: 'Implement controls flagged Applicable; record evidence and owner.', prerequisite: 'soa-completion' },
  { key: 'internal-audit', title: 'Internal Audit', description: 'Conduct internal ISMS audit; capture findings as corrective actions.', prerequisite: 'control-implementation' },
  { key: 'management-review', title: 'Management Review', description: 'Senior management reviews ISMS performance and accepts residual risk.', prerequisite: 'internal-audit' },
  { key: 'stage1-audit', title: 'Stage 1 Audit', description: 'Certification body reviews documentation readiness.', prerequisite: 'management-review' },
  { key: 'stage2-audit', title: 'Stage 2 Audit', description: 'On-site certification audit verifying implementation.', prerequisite: 'stage1-audit' },
  { key: 'certification', title: 'Certification', description: 'Certificate issued; valid for 3 years subject to surveillance.', prerequisite: 'stage2-audit' },
  { key: 'surveillance', title: 'Surveillance Audit', description: 'Annual surveillance until recertification.', prerequisite: 'certification' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export class ISO27001Service {

  // ─── Assessments ────────────────────────────────────────────────────────

  async createAssessment(data: {
    organizationId: string;
    userId: string;
    assessmentYear: number;
    scope: string;
    scopeBoundaries?: Record<string, unknown>;
    certificationBody?: string;
    leadAuditor?: string;
    isms_owner?: string;
    notes?: string;
    frameworkId?: string;
  }) {
    const assessment = await prisma.iSO27001Assessment.create({
      data: {
        organizationId: data.organizationId,
        assessmentYear: data.assessmentYear,
        scope: data.scope,
        scopeBoundaries: data.scopeBoundaries as never,
        certificationBody: data.certificationBody,
        leadAuditor: data.leadAuditor,
        isms_owner: data.isms_owner,
        notes: data.notes,
        frameworkId: data.frameworkId,
        status: 'InProgress',
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'iso27001.assessment.created',
      resourceType: 'ISO27001Assessment',
      resourceId: assessment.id,
      metadata: { assessmentYear: data.assessmentYear },
    });

    realTimeComplianceService.publishComplianceEvent(data.organizationId, {
      type: 'iso27001.assessment.created',
      severity: 'Medium',
      payload: { assessmentId: assessment.id, assessmentYear: data.assessmentYear },
    });

    return assessment;
  }

  async listAssessments(organizationId: string) {
    return prisma.iSO27001Assessment.findMany({
      where: { organizationId },
      orderBy: { assessmentYear: 'desc' },
    });
  }

  async getAssessment(id: string, organizationId: string) {
    const assessment = await prisma.iSO27001Assessment.findFirst({
      where: { id, organizationId },
      include: {
        soaEntries: { orderBy: { controlRef: 'asc' } },
        riskScenarios: { orderBy: { inherentRisk: 'desc' } },
        correctiveActions: { orderBy: { dueDate: 'asc' } },
      },
    });
    if (!assessment) throw new AppError('ISO 27001 assessment not found', 404);
    return assessment;
  }

  async updateAssessmentStatus(
    id: string,
    organizationId: string,
    userId: string,
    status: ISO27001AssessmentStatus,
    extra?: {
      stage1AuditDate?: Date;
      stage2AuditDate?: Date;
      certificationDate?: Date;
      certificateExpiresAt?: Date;
      internalAuditDate?: Date;
      managementReviewDate?: Date;
    }
  ) {
    const existing = await prisma.iSO27001Assessment.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError('ISO 27001 assessment not found', 404);

    const updated = await prisma.iSO27001Assessment.update({
      where: { id },
      data: { status, ...(extra ?? {}) },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'iso27001.assessment.status_changed',
      resourceType: 'ISO27001Assessment',
      resourceId: id,
      metadata: { previousStatus: existing.status, newStatus: status },
    });

    realTimeComplianceService.publishComplianceEvent(organizationId, {
      type: 'iso27001.assessment.status_changed',
      severity: status === 'Certified' || status === 'Completed' ? 'High' : 'Medium',
      payload: { assessmentId: id, previousStatus: existing.status, newStatus: status },
    });

    return updated;
  }

  // ─── Statement of Applicability ─────────────────────────────────────────

  async upsertSoAEntry(data: {
    organizationId: string;
    userId: string;
    assessmentId: string;
    controlRef: string;
    controlTitle: string;
    applicability: SoAApplicability;
    justification: string;
    implementationStatus?: SoAImplementationStatus;
    implementationNotes?: string;
    evidenceRefs?: string[];
    controlOwner?: string;
  }) {
    await this.assertAssessmentBelongsToOrg(data.assessmentId, data.organizationId);

    const entry = await prisma.iSO27001SoA.upsert({
      where: {
        assessmentId_controlRef: { assessmentId: data.assessmentId, controlRef: data.controlRef },
      },
      create: {
        organizationId: data.organizationId,
        assessmentId: data.assessmentId,
        controlRef: data.controlRef,
        controlTitle: data.controlTitle,
        applicability: data.applicability,
        justification: data.justification,
        implementationStatus: data.implementationStatus ?? 'NotImplemented',
        implementationNotes: data.implementationNotes,
        evidenceRefs: data.evidenceRefs as never,
        controlOwner: data.controlOwner,
        lastReviewedAt: new Date(),
      },
      update: {
        controlTitle: data.controlTitle,
        applicability: data.applicability,
        justification: data.justification,
        implementationStatus: data.implementationStatus ?? undefined,
        implementationNotes: data.implementationNotes,
        evidenceRefs: data.evidenceRefs as never,
        controlOwner: data.controlOwner,
        lastReviewedAt: new Date(),
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'iso27001.soa.upserted',
      resourceType: 'ISO27001SoA',
      resourceId: entry.id,
      metadata: { controlRef: data.controlRef, applicability: data.applicability },
    });

    realTimeComplianceService.publishControlChange(data.organizationId, 'updated', {
      id: entry.id,
      status: entry.implementationStatus,
    });

    return entry;
  }

  async listSoAEntries(assessmentId: string, organizationId: string) {
    await this.assertAssessmentBelongsToOrg(assessmentId, organizationId);
    return prisma.iSO27001SoA.findMany({
      where: { assessmentId, organizationId },
      orderBy: { controlRef: 'asc' },
    });
  }

  // ─── Risk Register ──────────────────────────────────────────────────────

  async createRiskScenario(data: {
    organizationId: string;
    userId: string;
    assessmentId: string;
    threat: string;
    vulnerability: string;
    affectedAsset: string;
    likelihood: number;
    impact: number;
    treatmentDecision: RiskTreatmentDecision;
    treatmentPlan?: string;
    residualRisk?: number;
    riskOwner?: string;
    controlRefs?: string[];
    reviewDate?: Date;
  }) {
    if (data.likelihood < 1 || data.likelihood > 5) throw new AppError('likelihood must be 1-5', 400);
    if (data.impact < 1 || data.impact > 5) throw new AppError('impact must be 1-5', 400);
    await this.assertAssessmentBelongsToOrg(data.assessmentId, data.organizationId);

    const inherentRisk = data.likelihood * data.impact;
    const scenario = await prisma.iSO27001RiskScenario.create({
      data: {
        organizationId: data.organizationId,
        assessmentId: data.assessmentId,
        threat: data.threat,
        vulnerability: data.vulnerability,
        affectedAsset: data.affectedAsset,
        likelihood: data.likelihood,
        impact: data.impact,
        inherentRisk,
        treatmentDecision: data.treatmentDecision,
        treatmentPlan: data.treatmentPlan,
        residualRisk: data.residualRisk ?? null,
        riskOwner: data.riskOwner,
        controlRefs: data.controlRefs as never,
        reviewDate: data.reviewDate,
        status: 'Open',
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'iso27001.risk_scenario.created',
      resourceType: 'ISO27001RiskScenario',
      resourceId: scenario.id,
      metadata: { inherentRisk, treatmentDecision: data.treatmentDecision },
    });

    if (inherentRisk >= 16) {
      realTimeComplianceService.publishRiskChange(data.organizationId, 'created', {
        id: scenario.id,
        title: `${data.threat} → ${data.affectedAsset}`,
        severity: 'High',
        status: 'Open',
      });
    }

    return scenario;
  }

  async updateRiskScenario(
    id: string,
    organizationId: string,
    userId: string,
    patch: Partial<{
      treatmentDecision: RiskTreatmentDecision;
      treatmentPlan: string;
      residualRisk: number;
      status: RiskScenarioStatus;
      riskOwner: string;
      reviewDate: Date;
    }>
  ) {
    const existing = await prisma.iSO27001RiskScenario.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });
    if (!existing) throw new AppError('Risk scenario not found', 404);

    const updated = await prisma.iSO27001RiskScenario.update({
      where: { id },
      data: patch,
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'iso27001.risk_scenario.updated',
      resourceType: 'ISO27001RiskScenario',
      resourceId: id,
      metadata: { fields: Object.keys(patch) },
    });

    return updated;
  }

  async listRiskScenarios(assessmentId: string, organizationId: string) {
    await this.assertAssessmentBelongsToOrg(assessmentId, organizationId);
    return prisma.iSO27001RiskScenario.findMany({
      where: { assessmentId, organizationId },
      orderBy: [{ status: 'asc' }, { inherentRisk: 'desc' }],
    });
  }

  // ─── Corrective Actions (CAPA) ──────────────────────────────────────────

  async createCorrectiveAction(data: {
    organizationId: string;
    userId: string;
    assessmentId: string;
    source: CorrectiveActionSource;
    finding: string;
    rootCause?: string;
    containment?: string;
    correctiveAction: string;
    preventiveAction?: string;
    owner: string;
    dueDate: Date;
  }) {
    await this.assertAssessmentBelongsToOrg(data.assessmentId, data.organizationId);

    const action = await prisma.iSO27001CorrectiveAction.create({
      data: {
        organizationId: data.organizationId,
        assessmentId: data.assessmentId,
        source: data.source,
        finding: data.finding,
        rootCause: data.rootCause,
        containment: data.containment,
        correctiveAction: data.correctiveAction,
        preventiveAction: data.preventiveAction,
        owner: data.owner,
        dueDate: data.dueDate,
        status: 'Open',
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'iso27001.corrective_action.created',
      resourceType: 'ISO27001CorrectiveAction',
      resourceId: action.id,
      metadata: { source: data.source, dueDate: data.dueDate.toISOString() },
    });

    return action;
  }

  async updateCorrectiveActionStatus(
    id: string,
    organizationId: string,
    userId: string,
    status: CorrectiveActionStatus,
    verifiedBy?: string,
    evidenceRefs?: string[]
  ) {
    const existing = await prisma.iSO27001CorrectiveAction.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError('Corrective action not found', 404);

    const updated = await prisma.iSO27001CorrectiveAction.update({
      where: { id },
      data: {
        status,
        ...(status === 'Verified' || status === 'Closed'
          ? { verifiedBy, verifiedAt: new Date() }
          : {}),
        ...(evidenceRefs ? { evidenceRefs: evidenceRefs as never } : {}),
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'iso27001.corrective_action.status_changed',
      resourceType: 'ISO27001CorrectiveAction',
      resourceId: id,
      metadata: { previousStatus: existing.status, newStatus: status },
    });

    return updated;
  }

  // ─── Workflow + Dashboard ───────────────────────────────────────────────

  async getWorkflow(assessmentId: string, organizationId: string): Promise<{
    steps: WorkflowStep[];
    nextStep: WorkflowStep | null;
    progressPercent: number;
  }> {
    const assessment = await this.getAssessment(assessmentId, organizationId);

    const totalSoA = assessment.soaEntries.length;
    const applicableSoA = assessment.soaEntries.filter((e) => e.applicability === 'Applicable').length;
    const implementedSoA = assessment.soaEntries.filter(
      (e) => e.applicability === 'Applicable' && (e.implementationStatus === 'Implemented' || e.implementationStatus === 'Operating')
    ).length;
    const openCorrective = assessment.correctiveActions.filter((a) => a.status !== 'Verified' && a.status !== 'Closed').length;
    const openRisks = assessment.riskScenarios.filter((r) => r.status === 'Open').length;

    const completion: Record<WorkflowStepKey, { done: boolean; blockers: string[]; metadata: Record<string, unknown> }> = {
      'define-scope': {
        done: assessment.scope.trim().length > 0,
        blockers: assessment.scope.trim().length === 0 ? ['Scope statement is empty'] : [],
        metadata: { scopeLength: assessment.scope.length },
      },
      'risk-assessment': {
        done: assessment.riskScenarios.length >= 5,
        blockers: assessment.riskScenarios.length < 5 ? [`Only ${assessment.riskScenarios.length}/5 minimum risk scenarios documented`] : [],
        metadata: { totalScenarios: assessment.riskScenarios.length, openScenarios: openRisks },
      },
      'soa-completion': {
        done: totalSoA >= 93, // ISO 27001:2022 has 93 Annex A controls
        blockers: totalSoA < 93 ? [`SoA covers ${totalSoA}/93 Annex A controls`] : [],
        metadata: { totalSoA, applicableSoA },
      },
      'control-implementation': {
        done: applicableSoA > 0 && implementedSoA === applicableSoA,
        blockers: implementedSoA < applicableSoA ? [`${applicableSoA - implementedSoA} applicable controls not yet implemented or operating`] : [],
        metadata: { applicableSoA, implementedSoA },
      },
      'internal-audit': {
        done: assessment.internalAuditDate !== null,
        blockers: assessment.internalAuditDate === null ? ['Internal audit date not recorded'] : [],
        metadata: { internalAuditDate: assessment.internalAuditDate },
      },
      'management-review': {
        done: assessment.managementReviewDate !== null,
        blockers: assessment.managementReviewDate === null ? ['Management review date not recorded'] : [],
        metadata: { managementReviewDate: assessment.managementReviewDate },
      },
      'stage1-audit': {
        done: assessment.stage1AuditDate !== null,
        blockers: openCorrective > 0 ? [`${openCorrective} unresolved corrective actions block Stage 1`] : [],
        metadata: { stage1AuditDate: assessment.stage1AuditDate },
      },
      'stage2-audit': {
        done: assessment.stage2AuditDate !== null,
        blockers: assessment.stage1AuditDate === null ? ['Stage 1 audit must complete first'] : [],
        metadata: { stage2AuditDate: assessment.stage2AuditDate },
      },
      'certification': {
        done: assessment.certificationDate !== null,
        blockers: assessment.stage2AuditDate === null ? ['Stage 2 audit must complete first'] : [],
        metadata: { certificationDate: assessment.certificationDate, expiresAt: assessment.certificateExpiresAt },
      },
      'surveillance': {
        done: false, // surveillance is recurring; never "done" while certificate is active
        blockers: assessment.certificationDate === null ? ['Certification must be issued first'] : [],
        metadata: { certificateExpiresAt: assessment.certificateExpiresAt },
      },
    };

    const steps: WorkflowStep[] = WORKFLOW_STEPS.map((s) => {
      const c = completion[s.key];
      return {
        ...s,
        completed: c.done,
        current: false,
        blockedBy: c.blockers,
        metadata: c.metadata,
      };
    });

    const firstIncomplete = steps.find((s) => !s.completed) ?? null;
    if (firstIncomplete) firstIncomplete.current = true;

    const completedCount = steps.filter((s) => s.completed).length;
    const progressPercent = Math.round((completedCount / steps.length) * 100);

    return { steps, nextStep: firstIncomplete, progressPercent };
  }

  async getDashboard(organizationId: string): Promise<ISO27001Dashboard> {
    const [activeAssessment, soaEntries, scenarios, openActions] = await Promise.all([
      prisma.iSO27001Assessment.findFirst({
        where: { organizationId, status: { notIn: ['Completed'] } },
        orderBy: { assessmentYear: 'desc' },
      }),
      prisma.iSO27001SoA.findMany({
        where: { organizationId },
        select: { applicability: true, implementationStatus: true },
      }),
      prisma.iSO27001RiskScenario.findMany({
        where: { organizationId },
        select: { status: true, inherentRisk: true, residualRisk: true },
      }),
      prisma.iSO27001CorrectiveAction.findMany({
        where: { organizationId, status: { notIn: ['Verified', 'Closed'] } },
        select: { status: true, dueDate: true },
      }),
    ]);

    const totalSoA = soaEntries.length;
    const applicable = soaEntries.filter((e) => e.applicability === 'Applicable').length;
    const notApplicable = soaEntries.filter((e) => e.applicability === 'NotApplicable').length;
    const implementedOrOperating = soaEntries.filter(
      (e) => e.applicability === 'Applicable' && (e.implementationStatus === 'Implemented' || e.implementationStatus === 'Operating')
    ).length;
    const coveragePercent = applicable > 0 ? Math.round((implementedOrOperating / applicable) * 100) : 0;

    const openRisks = scenarios.filter((s) => s.status === 'Open').length;
    const treatedRisks = scenarios.filter((s) => s.status === 'Treated').length;
    const highInherent = scenarios.filter((s) => s.inherentRisk >= 16).length;
    const residualValues = scenarios.map((s) => s.residualRisk).filter((v): v is number => v !== null);
    const averageResidual = residualValues.length > 0
      ? Math.round((residualValues.reduce((a, b) => a + b, 0) / residualValues.length) * 10) / 10
      : null;

    const now = Date.now();
    const overdue = openActions.filter((a) => a.dueDate.getTime() < now).length;
    const awaitingVerification = openActions.filter((a) => a.status === 'AwaitingVerification').length;

    let certificateExpiringInDays: number | null = null;
    if (activeAssessment?.certificateExpiresAt) {
      certificateExpiringInDays = Math.max(
        0,
        Math.ceil((activeAssessment.certificateExpiresAt.getTime() - now) / (24 * 60 * 60 * 1000))
      );
    }

    return {
      organizationId,
      activeAssessment: activeAssessment
        ? {
            id: activeAssessment.id,
            assessmentYear: activeAssessment.assessmentYear,
            status: activeAssessment.status as ISO27001AssessmentStatus,
            scope: activeAssessment.scope,
            certificationDate: activeAssessment.certificationDate,
            certificateExpiresAt: activeAssessment.certificateExpiresAt,
          }
        : null,
      soaCoverage: { totalControls: totalSoA, applicable, notApplicable, implementedOrOperating, coveragePercent },
      riskRegister: { open: openRisks, treated: treatedRisks, highInherent, averageResidual },
      correctiveActions: { open: openActions.length, overdue, awaitingVerification },
      certificateExpiringInDays,
      generatedAt: new Date(),
    };
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  private async assertAssessmentBelongsToOrg(assessmentId: string, organizationId: string): Promise<void> {
    const found = await prisma.iSO27001Assessment.findFirst({
      where: { id: assessmentId, organizationId },
      select: { id: true },
    });
    if (!found) throw new AppError('ISO 27001 assessment not found', 404);
  }
}

const iso27001Service = new ISO27001Service();
export default iso27001Service;
