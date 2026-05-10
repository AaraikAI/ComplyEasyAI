/**
 * HIPAA Compliance Workflow Service
 *
 * Three responsibilities, all org-scoped:
 *   1. PHI Inventory + Segmentation — track every system that holds PHI/ePHI,
 *      its custodian, encryption posture, and minimum-necessary access grants
 *      per 45 CFR §164.502(b) / §164.514(d).
 *   2. Business Associate Agreement (BAA) tracking per §164.504(e) — counter-
 *      party, scope, expiry, sub-contractor coverage, breach-notification SLA.
 *   3. Breach Rule automation per §164.400-414:
 *        - Four-factor risk assessment per §164.402(2) — defaults to "breach
 *          must be notified" unless documented analysis rebuts the presumption.
 *        - Notification deadlines computed deterministically:
 *            individuals: discoveryDate + 60 days (§164.404(b))
 *            HHS:         discoveryDate + 60 days if affected ≥ 500
 *                         else next-year Mar 1                  (§164.408)
 *            media:       discoveryDate + 60 days if any state hits ≥ 500
 *                                                                (§164.406)
 */

import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuditLogger } from '../utils/auditLogger';
import realTimeComplianceService from './realTimeComplianceService';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type PHIClassification =
  | 'PHI'
  | 'ePHI'
  | 'DesignatedRecordSet'
  | 'LimitedDataSet'
  | 'DeIdentified';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type AccessLevel = 'Read' | 'Write' | 'Admin' | 'Delete';
export type LegalBasis = 'Treatment' | 'Payment' | 'Operations' | 'Authorization';

export type BAAStatus = 'Draft' | 'PendingSignature' | 'Active' | 'Expired' | 'Terminated';
export type BAARiskTier = 'Low' | 'Standard' | 'High' | 'Critical';

export type BreachConclusion = 'LowProbabilityOfCompromise' | 'BreachConfirmed';

export interface BreachRiskAssessmentInput {
  organizationId: string;
  userId: string;
  breachIncidentId?: string;
  natureExtentScore: number;       // 1-5
  recipientScore: number;          // 1-5
  acquisitionScore: number;        // 1-5
  mitigationScore: number;         // 1-5
  natureExtentNotes?: string;
  recipientNotes?: string;
  acquisitionNotes?: string;
  mitigationNotes?: string;
  presumptionRebutted: boolean;
  affectedIndividuals: number;
  affectedStates?: string[];
  discoveryDate: Date;
  preparedBy: string;
}

export interface HIPAADashboard {
  organizationId: string;
  phi: {
    totalRecords: number;
    encryptedAtRest: number;
    encryptedInTransit: number;
    unencryptedHighRisk: number;
    classification: Record<PHIClassification, number>;
  };
  access: {
    activeGrants: number;
    expiringIn30Days: number;
    revokedLast30Days: number;
  };
  baa: {
    active: number;
    pending: number;
    expired: number;
    expiringIn90Days: number;
    highRiskActive: number;
  };
  breach: {
    last12Months: number;
    pendingNotifications: number;
    overdueNotifications: number;
  };
  generatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export class HIPAAService {

  // ═══════════════════════════════════════════════════════════════════════
  //  PHI INVENTORY  +  SEGMENTATION
  // ═══════════════════════════════════════════════════════════════════════

  async createPHIRecord(data: {
    organizationId: string;
    userId: string;
    systemName: string;
    dataLocation: string;
    custodian: string;
    recordCount?: number;
    classification?: PHIClassification;
    dataElements: string[];
    encryptionAtRest?: boolean;
    encryptionInTransit?: boolean;
    retentionDays?: number;
    legalBasis?: LegalBasis;
    riskLevel?: RiskLevel;
    segmentationId?: string;
  }) {
    const record = await prisma.pHIRecord.create({
      data: {
        organizationId: data.organizationId,
        systemName: data.systemName,
        dataLocation: data.dataLocation,
        custodian: data.custodian,
        recordCount: data.recordCount,
        classification: data.classification ?? 'PHI',
        dataElements: data.dataElements as never,
        encryptionAtRest: data.encryptionAtRest ?? false,
        encryptionInTransit: data.encryptionInTransit ?? false,
        retentionDays: data.retentionDays,
        legalBasis: data.legalBasis,
        riskLevel: data.riskLevel ?? this.deriveRiskLevel(data.classification, data.encryptionAtRest, data.recordCount),
        segmentationId: data.segmentationId,
        lastReviewedAt: new Date(),
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'hipaa.phi_record.created',
      resourceType: 'PHIRecord',
      resourceId: record.id,
      metadata: { systemName: data.systemName, classification: record.classification, riskLevel: record.riskLevel },
    });

    if (record.riskLevel === 'High' || record.riskLevel === 'Critical') {
      realTimeComplianceService.publishComplianceEvent(data.organizationId, {
        type: 'hipaa.phi_record.high_risk_added',
        severity: record.riskLevel,
        payload: { recordId: record.id, systemName: data.systemName, encryptionAtRest: record.encryptionAtRest },
      });
    }

    return record;
  }

  async listPHIRecords(organizationId: string, filters?: { classification?: PHIClassification; riskLevel?: RiskLevel }) {
    return prisma.pHIRecord.findMany({
      where: {
        organizationId,
        ...(filters?.classification && { classification: filters.classification }),
        ...(filters?.riskLevel && { riskLevel: filters.riskLevel }),
      },
      orderBy: { riskLevel: 'desc' },
    });
  }

  async getPHIRecord(id: string, organizationId: string) {
    const record = await prisma.pHIRecord.findFirst({
      where: { id, organizationId },
      include: { accessGrants: { where: { revokedAt: null } } },
    });
    if (!record) throw new AppError('PHI record not found', 404);
    return record;
  }

  async grantPHIAccess(data: {
    organizationId: string;
    userId: string;
    phiRecordId: string;
    grantedToUserId?: string;
    grantedToParty?: string;
    accessLevel: AccessLevel;
    justification: string;
    scopeFilters?: Record<string, unknown>;
    approvedBy: string;
    expiresAt?: Date;
  }) {
    if (!data.grantedToUserId && !data.grantedToParty) {
      throw new AppError('Either grantedToUserId or grantedToParty is required', 400);
    }
    if (!data.justification || data.justification.trim().length < 10) {
      throw new AppError('Minimum-necessary justification must be at least 10 characters per §164.502(b)', 400);
    }

    const phi = await prisma.pHIRecord.findFirst({
      where: { id: data.phiRecordId, organizationId: data.organizationId },
      select: { id: true },
    });
    if (!phi) throw new AppError('PHI record not found', 404);

    const grant = await prisma.pHIAccessGrant.create({
      data: {
        organizationId: data.organizationId,
        phiRecordId: data.phiRecordId,
        grantedToUserId: data.grantedToUserId,
        grantedToParty: data.grantedToParty,
        accessLevel: data.accessLevel,
        justification: data.justification,
        scopeFilters: data.scopeFilters as never,
        approvedBy: data.approvedBy,
        expiresAt: data.expiresAt,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'hipaa.phi_access.granted',
      resourceType: 'PHIAccessGrant',
      resourceId: grant.id,
      metadata: {
        phiRecordId: data.phiRecordId,
        accessLevel: data.accessLevel,
        grantedToUserId: data.grantedToUserId,
        grantedToParty: data.grantedToParty,
      },
    });

    return grant;
  }

  async revokePHIAccess(grantId: string, organizationId: string, userId: string, reason: string) {
    const existing = await prisma.pHIAccessGrant.findFirst({
      where: { id: grantId, organizationId, revokedAt: null },
      select: { id: true },
    });
    if (!existing) throw new AppError('Active access grant not found', 404);

    const updated = await prisma.pHIAccessGrant.update({
      where: { id: grantId },
      data: { revokedAt: new Date(), revokedReason: reason },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'hipaa.phi_access.revoked',
      resourceType: 'PHIAccessGrant',
      resourceId: grantId,
      metadata: { reason },
    });

    return updated;
  }

  async listExpiringAccessGrants(organizationId: string, withinDays = 30) {
    const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);
    return prisma.pHIAccessGrant.findMany({
      where: {
        organizationId,
        revokedAt: null,
        expiresAt: { not: null, lte: cutoff },
      },
      include: { phiRecord: { select: { systemName: true, classification: true } } },
      orderBy: { expiresAt: 'asc' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  BUSINESS ASSOCIATE AGREEMENT (BAA) TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  async createBAA(data: {
    organizationId: string;
    userId: string;
    businessAssociate: string;
    contactName?: string;
    contactEmail?: string;
    servicesProvided: string;
    phiCategoriesShared: string[];
    signedAt: Date;
    effectiveAt: Date;
    expiresAt?: Date;
    documentUrl?: string;
    subContractorsAllowed?: boolean;
    breachNotificationDays?: number;
    riskTier?: BAARiskTier;
    status?: BAAStatus;
  }) {
    if (data.signedAt > new Date()) throw new AppError('signedAt cannot be in the future', 400);
    if (data.expiresAt && data.expiresAt < data.effectiveAt) {
      throw new AppError('expiresAt must be after effectiveAt', 400);
    }

    const baa = await prisma.businessAssociateAgreement.create({
      data: {
        organizationId: data.organizationId,
        businessAssociate: data.businessAssociate,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        servicesProvided: data.servicesProvided,
        phiCategoriesShared: data.phiCategoriesShared as never,
        signedAt: data.signedAt,
        effectiveAt: data.effectiveAt,
        expiresAt: data.expiresAt,
        documentUrl: data.documentUrl,
        subContractorsAllowed: data.subContractorsAllowed ?? false,
        breachNotificationDays: data.breachNotificationDays ?? 60,
        riskTier: data.riskTier ?? 'Standard',
        status: data.status ?? 'Active',
        lastReviewedAt: new Date(),
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'hipaa.baa.created',
      resourceType: 'BusinessAssociateAgreement',
      resourceId: baa.id,
      metadata: { businessAssociate: data.businessAssociate, riskTier: baa.riskTier },
    });

    return baa;
  }

  async listBAAs(organizationId: string, filters?: { status?: BAAStatus; riskTier?: BAARiskTier }) {
    return prisma.businessAssociateAgreement.findMany({
      where: {
        organizationId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.riskTier && { riskTier: filters.riskTier }),
      },
      orderBy: { expiresAt: 'asc' },
    });
  }

  async updateBAAStatus(id: string, organizationId: string, userId: string, status: BAAStatus) {
    const existing = await prisma.businessAssociateAgreement.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError('BAA not found', 404);

    const updated = await prisma.businessAssociateAgreement.update({
      where: { id },
      data: { status, lastReviewedAt: new Date() },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'hipaa.baa.status_changed',
      resourceType: 'BusinessAssociateAgreement',
      resourceId: id,
      metadata: { previousStatus: existing.status, newStatus: status },
    });

    if (status === 'Expired' || status === 'Terminated') {
      realTimeComplianceService.publishComplianceEvent(organizationId, {
        type: 'hipaa.baa.coverage_lost',
        severity: 'High',
        payload: { baaId: id, previousStatus: existing.status, newStatus: status },
      });
    }

    return updated;
  }

  async listExpiringBAAs(organizationId: string, withinDays = 90) {
    const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);
    return prisma.businessAssociateAgreement.findMany({
      where: {
        organizationId,
        status: 'Active',
        expiresAt: { not: null, lte: cutoff },
      },
      orderBy: { expiresAt: 'asc' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  BREACH RULE AUTOMATION  (45 CFR §164.400-414)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Run the four-factor breach risk analysis required by §164.402(2). Defaults
   * to BreachConfirmed (notification required) unless presumptionRebutted is
   * set to true with documented analysis. Notification deadlines are computed
   * up-front so the org can see exactly when each clock expires.
   */
  async assessBreachRisk(data: BreachRiskAssessmentInput) {
    for (const [name, score] of Object.entries({
      natureExtentScore: data.natureExtentScore,
      recipientScore: data.recipientScore,
      acquisitionScore: data.acquisitionScore,
      mitigationScore: data.mitigationScore,
    })) {
      if (score < 1 || score > 5) throw new AppError(`${name} must be between 1 and 5`, 400);
    }
    if (data.affectedIndividuals < 0) throw new AppError('affectedIndividuals must be ≥ 0', 400);

    const conclusion: BreachConclusion = data.presumptionRebutted
      ? 'LowProbabilityOfCompromise'
      : 'BreachConfirmed';

    const deadlines = this.computeBreachNotificationDeadlines(
      data.discoveryDate,
      data.affectedIndividuals,
      data.affectedStates ?? [],
      conclusion
    );

    const assessment = await prisma.hIPAABreachRiskAssessment.create({
      data: {
        organizationId: data.organizationId,
        breachIncidentId: data.breachIncidentId,
        natureExtentScore: data.natureExtentScore,
        recipientScore: data.recipientScore,
        acquisitionScore: data.acquisitionScore,
        mitigationScore: data.mitigationScore,
        natureExtentNotes: data.natureExtentNotes,
        recipientNotes: data.recipientNotes,
        acquisitionNotes: data.acquisitionNotes,
        mitigationNotes: data.mitigationNotes,
        presumptionRebutted: data.presumptionRebutted,
        conclusion,
        affectedIndividuals: data.affectedIndividuals,
        affectedStates: data.affectedStates as never,
        discoveryDate: data.discoveryDate,
        individualNoticeDueAt: deadlines.individualDueAt,
        hhsNoticeDueAt: deadlines.hhsDueAt,
        mediaNoticeDueAt: deadlines.mediaDueAt,
        preparedBy: data.preparedBy,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'hipaa.breach_risk_assessment.created',
      resourceType: 'HIPAABreachRiskAssessment',
      resourceId: assessment.id,
      metadata: {
        conclusion,
        affectedIndividuals: data.affectedIndividuals,
        breachIncidentId: data.breachIncidentId,
      },
    });

    if (conclusion === 'BreachConfirmed') {
      realTimeComplianceService.publishComplianceEvent(data.organizationId, {
        type: 'hipaa.breach.notification_required',
        severity: data.affectedIndividuals >= 500 ? 'Critical' : 'High',
        payload: {
          assessmentId: assessment.id,
          affectedIndividuals: data.affectedIndividuals,
          individualDueAt: deadlines.individualDueAt,
          hhsDueAt: deadlines.hhsDueAt,
          mediaDueAt: deadlines.mediaDueAt,
        },
      });

      // Org admins get a direct notification because of the legal-deadline implications.
      const indDue = deadlines.individualDueAt;
      void realTimeComplianceService
        .notifyOrgAdmins(data.organizationId, {
          title: `HIPAA breach notification required (${data.affectedIndividuals} individuals)`,
          message: indDue
            ? `Individual notice due ${indDue.toISOString().slice(0, 10)} per 45 CFR §164.404.`
            : 'Individual notice required per 45 CFR §164.404.',
          type: data.affectedIndividuals >= 500 ? 'error' : 'warning',
          link: `/hipaa/breach/${assessment.id}`,
        })
        .catch(() => undefined);
    }

    return assessment;
  }

  async listBreachRiskAssessments(organizationId: string, filters?: { conclusion?: BreachConclusion }) {
    return prisma.hIPAABreachRiskAssessment.findMany({
      where: {
        organizationId,
        ...(filters?.conclusion && { conclusion: filters.conclusion }),
      },
      orderBy: { discoveryDate: 'desc' },
    });
  }

  async markBreachNotificationSent(
    id: string,
    organizationId: string,
    userId: string,
    channel: 'individual' | 'hhs' | 'media',
    sentAt: Date = new Date()
  ) {
    const existing = await prisma.hIPAABreachRiskAssessment.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });
    if (!existing) throw new AppError('Breach risk assessment not found', 404);

    const field =
      channel === 'individual' ? 'individualNoticedAt'
      : channel === 'hhs' ? 'hhsNoticedAt'
      : 'mediaNoticedAt';

    const updated = await prisma.hIPAABreachRiskAssessment.update({
      where: { id },
      data: { [field]: sentAt } as never,
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'hipaa.breach_notification.sent',
      resourceType: 'HIPAABreachRiskAssessment',
      resourceId: id,
      metadata: { channel, sentAt: sentAt.toISOString() },
    });

    return updated;
  }

  /**
   * Find breach risk assessments where any required notification deadline has
   * passed without the corresponding *NoticedAt being recorded. Used by the
   * dashboard and by a periodic reminder job (out of scope here).
   */
  async listOverdueBreachNotifications(organizationId: string) {
    const now = new Date();
    const all = await prisma.hIPAABreachRiskAssessment.findMany({
      where: { organizationId, conclusion: 'BreachConfirmed' },
    });
    return all
      .map((a) => {
        const overdue: Array<'individual' | 'hhs' | 'media'> = [];
        if (a.individualNoticeDueAt && a.individualNoticeDueAt < now && !a.individualNoticedAt) overdue.push('individual');
        if (a.hhsNoticeDueAt && a.hhsNoticeDueAt < now && !a.hhsNoticedAt) overdue.push('hhs');
        if (a.mediaNoticeDueAt && a.mediaNoticeDueAt < now && !a.mediaNoticedAt) overdue.push('media');
        return { assessment: a, overdueChannels: overdue };
      })
      .filter((x) => x.overdueChannels.length > 0);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════

  async getDashboard(organizationId: string): Promise<HIPAADashboard> {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last12Months = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [phiRecords, accessGrants, baas, recentBreachAssessments] = await Promise.all([
      prisma.pHIRecord.findMany({
        where: { organizationId },
        select: { classification: true, encryptionAtRest: true, encryptionInTransit: true, riskLevel: true },
      }),
      prisma.pHIAccessGrant.findMany({
        where: { organizationId },
        select: { revokedAt: true, expiresAt: true },
      }),
      prisma.businessAssociateAgreement.findMany({
        where: { organizationId },
        select: { status: true, expiresAt: true, riskTier: true },
      }),
      prisma.hIPAABreachRiskAssessment.findMany({
        where: { organizationId, discoveryDate: { gte: last12Months } },
        select: { conclusion: true, individualNoticeDueAt: true, individualNoticedAt: true, hhsNoticeDueAt: true, hhsNoticedAt: true, mediaNoticeDueAt: true, mediaNoticedAt: true },
      }),
    ]);

    const classification: Record<PHIClassification, number> = {
      PHI: 0, ePHI: 0, DesignatedRecordSet: 0, LimitedDataSet: 0, DeIdentified: 0,
    };
    for (const r of phiRecords) {
      classification[r.classification as PHIClassification] = (classification[r.classification as PHIClassification] ?? 0) + 1;
    }

    const activeGrants = accessGrants.filter((g) => !g.revokedAt).length;
    const expiringIn30 = accessGrants.filter((g) => !g.revokedAt && g.expiresAt && g.expiresAt > now && g.expiresAt <= in30Days).length;
    const revokedLast30 = accessGrants.filter((g) => g.revokedAt && g.revokedAt >= last30Days).length;

    const activeBAAs = baas.filter((b) => b.status === 'Active');
    const pendingBAAs = baas.filter((b) => b.status === 'Draft' || b.status === 'PendingSignature').length;
    const expiredBAAs = baas.filter((b) => b.status === 'Expired' || b.status === 'Terminated').length;
    const expiringIn90 = activeBAAs.filter((b) => b.expiresAt && b.expiresAt > now && b.expiresAt <= in90Days).length;
    const highRiskActive = activeBAAs.filter((b) => b.riskTier === 'High' || b.riskTier === 'Critical').length;

    const breachConfirmed = recentBreachAssessments.filter((a) => a.conclusion === 'BreachConfirmed');
    let pendingNotifications = 0;
    let overdueNotifications = 0;
    for (const a of breachConfirmed) {
      if (a.individualNoticeDueAt && !a.individualNoticedAt) {
        if (a.individualNoticeDueAt < now) overdueNotifications++; else pendingNotifications++;
      }
      if (a.hhsNoticeDueAt && !a.hhsNoticedAt) {
        if (a.hhsNoticeDueAt < now) overdueNotifications++; else pendingNotifications++;
      }
      if (a.mediaNoticeDueAt && !a.mediaNoticedAt) {
        if (a.mediaNoticeDueAt < now) overdueNotifications++; else pendingNotifications++;
      }
    }

    return {
      organizationId,
      phi: {
        totalRecords: phiRecords.length,
        encryptedAtRest: phiRecords.filter((r) => r.encryptionAtRest).length,
        encryptedInTransit: phiRecords.filter((r) => r.encryptionInTransit).length,
        unencryptedHighRisk: phiRecords.filter((r) => !r.encryptionAtRest && (r.riskLevel === 'High' || r.riskLevel === 'Critical')).length,
        classification,
      },
      access: { activeGrants, expiringIn30Days: expiringIn30, revokedLast30Days: revokedLast30 },
      baa: { active: activeBAAs.length, pending: pendingBAAs, expired: expiredBAAs, expiringIn90Days: expiringIn90, highRiskActive },
      breach: { last12Months: recentBreachAssessments.length, pendingNotifications, overdueNotifications },
      generatedAt: now,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Internals
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Default risk derivation if none supplied. ePHI without encryption-at-rest
   * is High; large unencrypted records are Critical. Mirrors common HIPAA-
   * Security-Rule risk-analysis heuristics.
   */
  private deriveRiskLevel(
    classification?: PHIClassification,
    encryptedAtRest?: boolean,
    recordCount?: number
  ): RiskLevel {
    const isPHI = !classification || classification === 'PHI' || classification === 'ePHI' || classification === 'DesignatedRecordSet';
    if (!isPHI) return 'Low';
    if (encryptedAtRest === false && (recordCount ?? 0) >= 500) return 'Critical';
    if (encryptedAtRest === false) return 'High';
    if ((recordCount ?? 0) >= 10000) return 'High';
    return 'Medium';
  }

  /**
   * 45 CFR §164.404 / §164.406 / §164.408 deadlines:
   *   Individuals: discovery + 60 days (always, when breach is confirmed)
   *   HHS:         discovery + 60 days if affected ≥ 500
   *                else next-calendar-year March 1
   *   Media:       discovery + 60 days if any single state has ≥ 500 affected
   * If conclusion is LowProbabilityOfCompromise, no deadlines apply.
   */
  private computeBreachNotificationDeadlines(
    discoveryDate: Date,
    affectedIndividuals: number,
    affectedStates: string[],
    conclusion: BreachConclusion
  ): { individualDueAt: Date | null; hhsDueAt: Date | null; mediaDueAt: Date | null } {
    if (conclusion === 'LowProbabilityOfCompromise') {
      return { individualDueAt: null, hhsDueAt: null, mediaDueAt: null };
    }

    const sixtyDays = (d: Date) => new Date(d.getTime() + 60 * 24 * 60 * 60 * 1000);
    const individualDueAt = sixtyDays(discoveryDate);

    const hhsDueAt = affectedIndividuals >= 500
      ? sixtyDays(discoveryDate)
      : new Date(Date.UTC(discoveryDate.getUTCFullYear() + 1, 2, 1)); // March 1 of next year

    // Media notice required if any single state has ≥ 500 affected. If we don't
    // have per-state breakdown we conservatively assume the threshold is hit
    // when total ≥ 500 and at least one state is named.
    const mediaDueAt = affectedIndividuals >= 500 && affectedStates.length > 0
      ? sixtyDays(discoveryDate)
      : null;

    return { individualDueAt, hhsDueAt, mediaDueAt };
  }
}

const hipaaService = new HIPAAService();
export default hipaaService;
