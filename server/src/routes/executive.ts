/**
 * Executive Reporting Routes — Board-Level Dashboards
 *
 * Aggregates data from frameworks, risks, incidents, controls,
 * certifications, and exceptions to produce executive summaries,
 * RAG status, board packs, and period-over-period trend comparisons.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import prisma from '../config/database';
import logger from '../config/logger';

const router = Router();
router.use(authenticate);

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Compute a RAG (Red/Amber/Green) status from a compliance framework
 * based on progress percentage and status.
 */
function computeRAG(progress: number, status: string): 'RED' | 'AMBER' | 'GREEN' {
  if (status === 'Non_Compliant' || progress < 30) return 'RED';
  if (status === 'At_Risk' || progress < 70) return 'AMBER';
  return 'GREEN';
}

/**
 * Map risk severity to a numeric score for aggregation.
 */
function severityScore(severity: string): number {
  const scores: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  return scores[severity] || 0;
}

// ============================================================================
// GET /dashboard — Aggregated executive dashboard
// ============================================================================

router.get(
  '/dashboard',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;

    try {
      // Fetch all key data in parallel
      const [
        frameworks,
        risks,
        incidents,
        certifications,
        exceptions,
        controlEffectiveness,
        maturityAssessment,
      ] = await Promise.all([
        prisma.complianceFramework.findMany({
          where: { organizationId: orgId },
          include: { controls: { select: { id: true, status: true } } },
        }),
        prisma.riskItem.findMany({
          where: { organizationId: orgId },
          select: { id: true, severity: true, status: true, createdAt: true },
        }),
        prisma.incident.findMany({
          where: { organizationId: orgId },
          select: { id: true, severity: true, status: true, detectedAt: true },
        }),
        prisma.certification.findMany({
          where: { organizationId: orgId },
          select: { id: true, status: true, expiryDate: true, name: true },
        }),
        prisma.complianceException.findMany({
          where: { organizationId: orgId },
          select: { id: true, status: true, expiryDate: true },
        }),
        prisma.controlEffectivenessRecord.findMany({
          where: { organizationId: orgId },
          select: { rating: true, controlId: true, assessmentDate: true },
          orderBy: { assessmentDate: 'desc' },
        }),
        prisma.maturityAssessment.findFirst({
          where: { organizationId: orgId },
          orderBy: { assessmentDate: 'desc' },
          include: { domains: true },
        }),
      ]);

      // -- Compliance scores per framework --
      const frameworkScores = frameworks.map((f) => {
        const totalControls = f.controls.length;
        const implementedControls = f.controls.filter(
          (c) => c.status === 'Implemented' || c.status === 'Verified'
        ).length;
        return {
          id: f.id,
          name: f.name,
          progress: f.progress,
          status: f.status,
          rag: computeRAG(f.progress, f.status),
          totalControls,
          implementedControls,
          controlCoverage: totalControls > 0
            ? Math.round((implementedControls / totalControls) * 100)
            : 0,
        };
      });

      // -- Overall compliance score (weighted average) --
      const overallCompliance = frameworkScores.length > 0
        ? Math.round(
            frameworkScores.reduce((sum, f) => sum + f.progress, 0) / frameworkScores.length
          )
        : 0;

      // -- Risk posture --
      const openRisks = risks.filter((r) => r.status === 'Open' || r.status === 'In_Progress');
      const riskBySeverity: Record<string, number> = {};
      for (const r of openRisks) {
        riskBySeverity[r.severity] = (riskBySeverity[r.severity] || 0) + 1;
      }
      const avgRiskScore = openRisks.length > 0
        ? Math.round(
            (openRisks.reduce((sum, r) => sum + severityScore(r.severity), 0) / openRisks.length) * 100
          ) / 100
        : 0;

      // -- Top risks --
      const topRisks = openRisks
        .sort((a, b) => severityScore(b.severity) - severityScore(a.severity))
        .slice(0, 5)
        .map((r) => ({ id: r.id, severity: r.severity, status: r.status }));

      // -- Incident summary --
      const openIncidents = incidents.filter(
        (i) => i.status !== 'CLOSED' && i.status !== 'POST_MORTEM'
      );
      const incidentBySeverity: Record<string, number> = {};
      for (const i of openIncidents) {
        incidentBySeverity[i.severity] = (incidentBySeverity[i.severity] || 0) + 1;
      }

      // -- Certification health --
      const activeCerts = certifications.filter(
        (c) => c.status === 'CERT_ACTIVE' || c.status === 'EXPIRING_SOON'
      ).length;
      const expiredCerts = certifications.filter((c) => c.status === 'CERT_EXPIRED').length;

      // -- Exception summary --
      const activeExceptions = exceptions.filter((e) => e.status === 'APPROVED').length;
      const pendingExceptions = exceptions.filter((e) => e.status === 'REQUESTED').length;

      // -- Audit readiness (based on latest control effectiveness) --
      const latestByControl = new Map<string, string>();
      for (const ce of controlEffectiveness) {
        if (!latestByControl.has(ce.controlId)) {
          latestByControl.set(ce.controlId, ce.rating);
        }
      }
      const totalAssessed = latestByControl.size;
      const effectiveCount = Array.from(latestByControl.values()).filter(
        (r) => r === 'EFFECTIVE'
      ).length;
      const auditReadiness = totalAssessed > 0
        ? Math.round((effectiveCount / totalAssessed) * 100)
        : 0;

      res.json({
        status: 'success',
        data: {
          overallCompliance,
          frameworkScores,
          riskPosture: {
            totalOpen: openRisks.length,
            bySeverity: riskBySeverity,
            averageScore: avgRiskScore,
            topRisks,
          },
          incidents: {
            totalOpen: openIncidents.length,
            totalAll: incidents.length,
            bySeverity: incidentBySeverity,
          },
          certifications: {
            total: certifications.length,
            active: activeCerts,
            expired: expiredCerts,
          },
          exceptions: {
            active: activeExceptions,
            pending: pendingExceptions,
            total: exceptions.length,
          },
          auditReadiness: {
            score: auditReadiness,
            totalControlsAssessed: totalAssessed,
            effectiveControls: effectiveCount,
          },
          maturityLevel: maturityAssessment
            ? {
                overallLevel: maturityAssessment.overallLevel,
                assessmentDate: maturityAssessment.assessmentDate,
                domains: maturityAssessment.domains.map((d) => ({
                  domain: d.domain,
                  currentLevel: d.currentLevel,
                  targetLevel: d.targetLevel,
                })),
              }
            : null,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error building executive dashboard:', error);
      res.status(500).json({ status: 'error', message: 'Failed to build executive dashboard' });
    }
  })
);

// ============================================================================
// GET /rag-status — RAG (Red/Amber/Green) status per framework
// ============================================================================

router.get(
  '/rag-status',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;

    try {
      const frameworks = await prisma.complianceFramework.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true, progress: true, status: true, nextAuditDate: true },
      });

      const ragStatuses = frameworks.map((f) => ({
        frameworkId: f.id,
        frameworkName: f.name,
        rag: computeRAG(f.progress, f.status),
        progress: f.progress,
        status: f.status,
        nextAuditDate: f.nextAuditDate,
      }));

      // Overall RAG
      const ragCounts = { RED: 0, AMBER: 0, GREEN: 0 };
      for (const r of ragStatuses) {
        ragCounts[r.rag]++;
      }
      const overallRAG: 'RED' | 'AMBER' | 'GREEN' =
        ragCounts.RED > 0 ? 'RED' : ragCounts.AMBER > 0 ? 'AMBER' : 'GREEN';

      res.json({
        status: 'success',
        data: {
          overall: overallRAG,
          summary: ragCounts,
          frameworks: ragStatuses,
        },
      });
    } catch (error) {
      logger.error('Error fetching RAG status:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch RAG status' });
    }
  })
);

// ============================================================================
// POST /board-pack — Generate board pack data (JSON export)
// ============================================================================

router.post(
  '/board-pack',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;

    try {
      const [
        frameworks,
        risks,
        incidents,
        certifications,
        exceptions,
        costs,
        controlEffectiveness,
        maturityAssessment,
      ] = await Promise.all([
        prisma.complianceFramework.findMany({
          where: { organizationId: orgId },
          include: {
            controls: { select: { id: true, name: true, status: true } },
          },
        }),
        prisma.riskItem.findMany({
          where: { organizationId: orgId },
          select: {
            id: true, title: true, severity: true, status: true,
            likelihood: true, impact: true, createdAt: true,
          },
        }),
        prisma.incident.findMany({
          where: { organizationId: orgId },
          select: {
            id: true, title: true, severity: true, status: true,
            category: true, detectedAt: true, resolvedAt: true,
          },
        }),
        prisma.certification.findMany({
          where: { organizationId: orgId },
          select: {
            id: true, name: true, certBody: true, status: true,
            issueDate: true, expiryDate: true,
          },
        }),
        prisma.complianceException.findMany({
          where: { organizationId: orgId },
          select: {
            id: true, title: true, status: true, controlId: true,
            expiryDate: true, requestedBy: true, approvedBy: true,
          },
        }),
        prisma.complianceCost.aggregate({
          where: { organizationId: orgId },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.controlEffectivenessRecord.groupBy({
          by: ['rating'],
          where: { organizationId: orgId },
          _count: true,
        }),
        prisma.maturityAssessment.findFirst({
          where: { organizationId: orgId },
          orderBy: { assessmentDate: 'desc' },
          include: { domains: true },
        }),
      ]);

      // Build comprehensive board pack
      const boardPack = {
        metadata: {
          generatedAt: new Date().toISOString(),
          organizationId: orgId,
          generatedBy: user.id,
          format: 'ComplyEasyAI Board Pack v1.0',
        },
        executiveSummary: {
          totalFrameworks: frameworks.length,
          averageCompliance: frameworks.length > 0
            ? Math.round(frameworks.reduce((s, f) => s + f.progress, 0) / frameworks.length)
            : 0,
          openRisks: risks.filter((r) => r.status === 'Open' || r.status === 'In_Progress').length,
          criticalRisks: risks.filter((r) => r.severity === 'Critical' && r.status === 'Open').length,
          openIncidents: incidents.filter((i) => i.status !== 'CLOSED' && i.status !== 'POST_MORTEM').length,
          activeCertifications: certifications.filter((c) => c.status === 'CERT_ACTIVE' || c.status === 'EXPIRING_SOON').length,
          activeExceptions: exceptions.filter((e) => e.status === 'APPROVED').length,
          totalComplianceSpend: costs._sum.amount || 0,
        },
        frameworkCompliance: frameworks.map((f) => ({
          id: f.id,
          name: f.name,
          progress: f.progress,
          status: f.status,
          rag: computeRAG(f.progress, f.status),
          totalControls: f.controls.length,
          controlsByStatus: f.controls.reduce(
            (acc, c) => {
              acc[c.status] = (acc[c.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
        })),
        riskRegister: {
          total: risks.length,
          bySeverity: risks.reduce(
            (acc, r) => {
              acc[r.severity] = (acc[r.severity] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
          byStatus: risks.reduce(
            (acc, r) => {
              acc[r.status] = (acc[r.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
          topRisks: risks
            .filter((r) => r.status === 'Open')
            .sort((a, b) => severityScore(b.severity) - severityScore(a.severity))
            .slice(0, 10),
        },
        incidentSummary: {
          total: incidents.length,
          bySeverity: incidents.reduce(
            (acc, i) => {
              acc[i.severity] = (acc[i.severity] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
          byStatus: incidents.reduce(
            (acc, i) => {
              acc[i.status] = (acc[i.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
        },
        certificationHealth: certifications,
        exceptionRegister: exceptions,
        controlEffectiveness: controlEffectiveness.map((g) => ({
          rating: g.rating,
          count: g._count,
        })),
        maturityLevel: maturityAssessment
          ? {
              overallLevel: maturityAssessment.overallLevel,
              assessmentDate: maturityAssessment.assessmentDate,
              domains: maturityAssessment.domains,
            }
          : null,
        financials: {
          totalSpend: costs._sum.amount || 0,
          totalEntries: costs._count,
        },
      };

      res.setHeader('Content-Disposition', `attachment; filename="board-pack-${new Date().toISOString().slice(0, 10)}.json"`);
      res.setHeader('Content-Type', 'application/json');
      res.json({ status: 'success', data: boardPack });
    } catch (error) {
      logger.error('Error generating board pack:', error);
      res.status(500).json({ status: 'error', message: 'Failed to generate board pack' });
    }
  })
);

// ============================================================================
// GET /trends — Period-over-period comparison
// ============================================================================

router.get(
  '/trends',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const orgId = user.organizationId;
    const periodDays = Math.max(7, parseInt(req.query.periodDays as string, 10) || 30);

    try {
      const now = new Date();
      const currentPeriodStart = new Date(now);
      currentPeriodStart.setDate(currentPeriodStart.getDate() - periodDays);
      const previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);

      // Risks created in each period
      const [currentRisks, previousRisks] = await Promise.all([
        prisma.riskItem.count({
          where: {
            organizationId: orgId,
            createdAt: { gte: currentPeriodStart, lte: now },
          },
        }),
        prisma.riskItem.count({
          where: {
            organizationId: orgId,
            createdAt: { gte: previousPeriodStart, lt: currentPeriodStart },
          },
        }),
      ]);

      // Incidents detected in each period
      const [currentIncidents, previousIncidents] = await Promise.all([
        prisma.incident.count({
          where: {
            organizationId: orgId,
            detectedAt: { gte: currentPeriodStart, lte: now },
          },
        }),
        prisma.incident.count({
          where: {
            organizationId: orgId,
            detectedAt: { gte: previousPeriodStart, lt: currentPeriodStart },
          },
        }),
      ]);

      // Framework progress snapshots (current state)
      const frameworks = await prisma.complianceFramework.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true, progress: true, status: true, updatedAt: true },
      });

      // Exceptions created in each period
      const [currentExceptions, previousExceptions] = await Promise.all([
        prisma.complianceException.count({
          where: {
            organizationId: orgId,
            createdAt: { gte: currentPeriodStart, lte: now },
          },
        }),
        prisma.complianceException.count({
          where: {
            organizationId: orgId,
            createdAt: { gte: previousPeriodStart, lt: currentPeriodStart },
          },
        }),
      ]);

      // Cost comparison
      const [currentCosts, previousCosts] = await Promise.all([
        prisma.complianceCost.aggregate({
          where: {
            organizationId: orgId,
            createdAt: { gte: currentPeriodStart, lte: now },
          },
          _sum: { amount: true },
        }),
        prisma.complianceCost.aggregate({
          where: {
            organizationId: orgId,
            createdAt: { gte: previousPeriodStart, lt: currentPeriodStart },
          },
          _sum: { amount: true },
        }),
      ]);

      function percentChange(current: number, previous: number): number | null {
        if (previous === 0) return current > 0 ? 100 : null;
        return Math.round(((current - previous) / previous) * 100 * 100) / 100;
      }

      res.json({
        status: 'success',
        data: {
          periodDays,
          currentPeriod: {
            start: currentPeriodStart.toISOString(),
            end: now.toISOString(),
          },
          previousPeriod: {
            start: previousPeriodStart.toISOString(),
            end: currentPeriodStart.toISOString(),
          },
          comparison: {
            newRisks: {
              current: currentRisks,
              previous: previousRisks,
              change: percentChange(currentRisks, previousRisks),
            },
            newIncidents: {
              current: currentIncidents,
              previous: previousIncidents,
              change: percentChange(currentIncidents, previousIncidents),
            },
            newExceptions: {
              current: currentExceptions,
              previous: previousExceptions,
              change: percentChange(currentExceptions, previousExceptions),
            },
            complianceSpend: {
              current: currentCosts._sum.amount || 0,
              previous: previousCosts._sum.amount || 0,
              change: percentChange(
                currentCosts._sum.amount || 0,
                previousCosts._sum.amount || 0
              ),
            },
          },
          frameworkProgress: frameworks.map((f) => ({
            id: f.id,
            name: f.name,
            currentProgress: f.progress,
            status: f.status,
            rag: computeRAG(f.progress, f.status),
          })),
        },
      });
    } catch (error) {
      logger.error('Error fetching executive trends:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch executive trends' });
    }
  })
);

export default router;
