/**
 * Real-Time Compliance Service
 *
 * Orchestration layer over MonitoringService and WebSocketService that turns
 * compliance state changes into a coherent, broadcastable, multi-tenant event
 * stream. All mutations are organization-scoped, audit-logged, and fan out via
 * three channels:
 *   1. Socket.IO room `org:${organizationId}` — browser clients
 *   2. In-process Node.js EventEmitter — other backend services
 *   3. Targeted user notifications — for HIGH/CRITICAL severity events
 *
 * The service also runs an internal scheduler that polls due monitors
 * (`ContinuousMonitor.nextRun <= now`) and executes them with a per-monitor
 * mutex so the same monitor never runs twice concurrently.
 */

import { EventEmitter } from 'events';
import prisma from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';
import { AuditLogger } from '../utils/auditLogger';
import websocketService from './websocketService';
import monitoringService from './monitoringService';
import type { MonitorResult, MonitorStatus } from '../generated/prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type RealTimeEventName =
  | 'monitor:executed'
  | 'monitor:status:changed'
  | 'monitor:alert'
  | 'risk:changed'
  | 'framework:changed'
  | 'control:changed'
  | 'evidence:changed'
  | 'compliance:score:updated'
  | 'compliance:event';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface MonitorAlertPayload {
  monitorId: string;
  monitorName: string;
  monitorType: string;
  status: MonitorStatus;
  failedTests: number;
  passedTests: number;
  severity: Severity;
  findings: unknown;
}

export interface ScoreSnapshot {
  organizationId: string;
  overall: number;
  frameworkCount: number;
  monitorPassRate: number;
  openHighRisks: number;
  recordedAt: Date;
}

export interface OrgSnapshot {
  score: ScoreSnapshot;
  monitors: {
    total: number;
    active: number;
    passing: number;
    warning: number;
    failing: number;
    unknown: number;
    failingMonitors: Array<{ id: string; name: string; monitorType: string; lastRun: Date | null }>;
  };
  frameworks: Array<{ id: string; name: string; status: string; progress: number; nextAuditDate: Date }>;
  recentAlerts: Array<{ monitorId: string; monitorName: string; runDate: Date; failedTests: number; status: MonitorStatus }>;
  connectedUsers: number;
  generatedAt: Date;
}

export interface RealTimeHealth {
  initialized: boolean;
  schedulerRunning: boolean;
  lastTickAt: Date | null;
  lastTickDurationMs: number | null;
  consecutiveErrors: number;
  inFlightMonitors: number;
  totalMonitorsExecuted: number;
  totalScoresRecomputed: number;
  totalErrors: number;
}

export interface RealTimeServiceOptions {
  /** Scheduler tick interval in ms. Set 0 to disable. Default: 60000. */
  schedulerIntervalMs?: number;
  /** Score-recompute debounce window per org in ms. Default: 5000. */
  scoreDebounceMs?: number;
  /** System user id used when audit-logging scheduler-triggered actions. */
  systemUserId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_USER_FALLBACK = 'system';

function deriveSeverity(status: MonitorStatus, failedTests: number, totalTests: number): Severity {
  if (status === 'Failing' && failedTests >= Math.max(1, Math.ceil(totalTests * 0.5))) return 'Critical';
  if (status === 'Failing') return 'High';
  if (status === 'Warning') return 'Medium';
  return 'Low';
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

class RealTimeComplianceService {
  private readonly emitter = new EventEmitter();
  private readonly monitorMutexes = new Map<string, Promise<MonitorResult>>();
  private readonly scoreDebounceTimers = new Map<string, NodeJS.Timeout>();

  private schedulerTimer: NodeJS.Timeout | null = null;
  private schedulerIntervalMs = 60_000;
  private scoreDebounceMs = 5_000;
  private systemUserId: string = SYSTEM_USER_FALLBACK;

  private initialized = false;
  private lastTickAt: Date | null = null;
  private lastTickDurationMs: number | null = null;
  private consecutiveErrors = 0;
  private totalMonitorsExecuted = 0;
  private totalScoresRecomputed = 0;
  private totalErrors = 0;

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  // ───── Lifecycle ──────────────────────────────────────────────────────────

  async initialize(options: RealTimeServiceOptions = {}): Promise<void> {
    if (this.initialized) {
      logger.warn('RealTimeComplianceService.initialize called twice — ignoring');
      return;
    }

    this.schedulerIntervalMs = options.schedulerIntervalMs ?? this.schedulerIntervalMs;
    this.scoreDebounceMs = options.scoreDebounceMs ?? this.scoreDebounceMs;
    this.systemUserId = options.systemUserId ?? SYSTEM_USER_FALLBACK;

    this.initialized = true;

    if (this.schedulerIntervalMs > 0) {
      this.schedulerTimer = setInterval(() => {
        this.runSchedulerTick().catch((error) => {
          this.consecutiveErrors++;
          this.totalErrors++;
          logger.error('RealTimeComplianceService scheduler tick failed', error);
        });
      }, this.schedulerIntervalMs);
      this.schedulerTimer.unref?.();
      logger.info(`RealTimeComplianceService scheduler started (${this.schedulerIntervalMs}ms interval)`);
    }
  }

  async shutdown(): Promise<void> {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    for (const t of this.scoreDebounceTimers.values()) clearTimeout(t);
    this.scoreDebounceTimers.clear();

    // Drain any in-flight monitor executions before closing.
    const pending = Array.from(this.monitorMutexes.values());
    if (pending.length > 0) {
      logger.info(`Draining ${pending.length} in-flight monitor executions`);
      await Promise.allSettled(pending);
    }

    this.emitter.removeAllListeners();
    this.initialized = false;
    logger.info('RealTimeComplianceService shut down');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getHealth(): RealTimeHealth {
    return {
      initialized: this.initialized,
      schedulerRunning: this.schedulerTimer !== null,
      lastTickAt: this.lastTickAt,
      lastTickDurationMs: this.lastTickDurationMs,
      consecutiveErrors: this.consecutiveErrors,
      inFlightMonitors: this.monitorMutexes.size,
      totalMonitorsExecuted: this.totalMonitorsExecuted,
      totalScoresRecomputed: this.totalScoresRecomputed,
      totalErrors: this.totalErrors,
    };
  }

  // ───── In-process event subscription ──────────────────────────────────────

  on<T = unknown>(event: RealTimeEventName, handler: (payload: T) => void): this {
    this.emitter.on(event, handler as (...args: unknown[]) => void);
    return this;
  }

  off<T = unknown>(event: RealTimeEventName, handler: (payload: T) => void): this {
    this.emitter.off(event, handler as (...args: unknown[]) => void);
    return this;
  }

  // ───── Snapshot APIs ──────────────────────────────────────────────────────

  async getOrgSnapshot(organizationId: string): Promise<OrgSnapshot> {
    if (!organizationId) throw new AppError('organizationId is required', 400);

    const [monitors, frameworks, recentResults, openHighRisks] = await Promise.all([
      prisma.continuousMonitor.findMany({
        where: { organizationId },
        select: { id: true, name: true, monitorType: true, status: true, active: true, lastRun: true },
      }),
      prisma.complianceFramework.findMany({
        where: { organizationId },
        select: { id: true, name: true, status: true, progress: true, nextAuditDate: true },
        orderBy: { nextAuditDate: 'asc' },
      }),
      prisma.monitorResult.findMany({
        where: { monitor: { organizationId }, status: { in: ['Failing', 'Warning'] } },
        orderBy: { runDate: 'desc' },
        take: 25,
        select: {
          monitorId: true,
          status: true,
          failedTests: true,
          runDate: true,
          monitor: { select: { name: true } },
        },
      }),
      prisma.riskItem.count({
        where: {
          organizationId,
          status: { in: ['Open', 'In_Progress'] },
          severity: { in: ['High', 'Critical'] },
        },
      }),
    ]);

    const totalMonitors = monitors.length;
    const passing = monitors.filter((m) => m.status === 'Passing').length;
    const warning = monitors.filter((m) => m.status === 'Warning').length;
    const failing = monitors.filter((m) => m.status === 'Failing').length;
    const unknown = monitors.filter((m) => m.status === 'Unknown').length;
    const monitorPassRate = totalMonitors > 0 ? Math.round((passing / totalMonitors) * 1000) / 10 : 0;

    const overall =
      frameworks.length > 0
        ? Math.round((frameworks.reduce((s, f) => s + (f.progress ?? 0), 0) / frameworks.length) * 10) / 10
        : 0;

    return {
      score: {
        organizationId,
        overall,
        frameworkCount: frameworks.length,
        monitorPassRate,
        openHighRisks,
        recordedAt: new Date(),
      },
      monitors: {
        total: totalMonitors,
        active: monitors.filter((m) => m.active).length,
        passing,
        warning,
        failing,
        unknown,
        failingMonitors: monitors
          .filter((m) => m.status === 'Failing')
          .map((m) => ({ id: m.id, name: m.name, monitorType: m.monitorType, lastRun: m.lastRun })),
      },
      frameworks: frameworks.map((f) => ({
        id: f.id,
        name: f.name,
        status: f.status,
        progress: f.progress,
        nextAuditDate: f.nextAuditDate,
      })),
      recentAlerts: recentResults.map((r) => ({
        monitorId: r.monitorId,
        monitorName: r.monitor.name,
        runDate: r.runDate,
        failedTests: r.failedTests,
        status: r.status,
      })),
      connectedUsers: websocketService.getConnectedUsersCount(organizationId),
      generatedAt: new Date(),
    };
  }

  async getMonitorStream(
    organizationId: string,
    since?: Date,
    limit = 100
  ): Promise<Array<MonitorResult & { monitorName: string; monitorType: string }>> {
    if (!organizationId) throw new AppError('organizationId is required', 400);

    const results = await prisma.monitorResult.findMany({
      where: {
        monitor: { organizationId },
        ...(since && { runDate: { gte: since } }),
      },
      include: { monitor: { select: { name: true, monitorType: true } } },
      orderBy: { runDate: 'desc' },
      take: Math.min(500, Math.max(1, limit)),
    });

    return results.map(({ monitor, ...rest }) => ({
      ...rest,
      monitorName: monitor.name,
      monitorType: monitor.monitorType,
    }));
  }

  // ───── Orchestrated mutations ─────────────────────────────────────────────

  /**
   * Execute a monitor and broadcast the resulting event payload. Per-monitor
   * mutex prevents two concurrent runs of the same monitor (which would race
   * on `lastRun` / `nextRun` writes).
   */
  async executeMonitorAndBroadcast(
    monitorId: string,
    userId: string,
    organizationId: string
  ): Promise<MonitorResult> {
    if (!monitorId) throw new AppError('monitorId is required', 400);
    if (!organizationId) throw new AppError('organizationId is required', 400);

    const inflight = this.monitorMutexes.get(monitorId);
    if (inflight) return inflight;

    const promise = (async () => {
      const previous = await prisma.continuousMonitor.findFirst({
        where: { id: monitorId, organizationId },
        select: { id: true, name: true, monitorType: true, status: true },
      });
      if (!previous) throw new AppError('Monitor not found', 404);

      const result = await monitoringService.executeMonitor(monitorId, userId, organizationId);
      this.totalMonitorsExecuted++;

      const totalTests = (result.passedTests ?? 0) + (result.failedTests ?? 0);
      const severity = deriveSeverity(result.status, result.failedTests ?? 0, totalTests);

      // Always: monitor:executed
      const executedPayload = {
        monitorId,
        monitorName: previous.name,
        monitorType: previous.monitorType,
        status: result.status,
        passedTests: result.passedTests,
        failedTests: result.failedTests,
        autoRemediated: result.autoRemediated,
        runDate: result.runDate,
      };
      this.broadcast(organizationId, 'monitor:executed', executedPayload);

      // Conditional: monitor:status:changed
      if (previous.status !== result.status) {
        const statusPayload = {
          monitorId,
          monitorName: previous.name,
          previousStatus: previous.status,
          newStatus: result.status,
        };
        this.broadcast(organizationId, 'monitor:status:changed', statusPayload);
      }

      // Conditional: monitor:alert (Failing or Warning)
      if (result.status === 'Failing' || result.status === 'Warning') {
        const alert: MonitorAlertPayload = {
          monitorId,
          monitorName: previous.name,
          monitorType: previous.monitorType,
          status: result.status,
          failedTests: result.failedTests ?? 0,
          passedTests: result.passedTests ?? 0,
          severity,
          findings: result.findings,
        };
        this.broadcast(organizationId, 'monitor:alert', alert);

        if (severity === 'High' || severity === 'Critical') {
          // Fanout to org admins; failures here are non-fatal.
          this.notifyOrgAdmins(organizationId, {
            title: `Monitor ${result.status}: ${previous.name}`,
            message: `${result.failedTests} of ${totalTests} tests failed.`,
            type: result.status === 'Failing' ? 'error' : 'warning',
            link: `/monitoring/${monitorId}`,
          }).catch((error) => logger.warn('notifyOrgAdmins failed', error));
        }
      }

      // Score implications: scheduler-debounced recompute
      this.scheduleScoreRecompute(organizationId, `monitor:${monitorId}:${result.status}`);

      return result;
    })();

    this.monitorMutexes.set(monitorId, promise);
    try {
      return await promise;
    } finally {
      this.monitorMutexes.delete(monitorId);
    }
  }

  /**
   * Scheduler tick: find every active monitor whose `nextRun` is past-due and
   * execute them. Errors on individual monitors do not abort the batch.
   */
  async runSchedulerTick(): Promise<{ executed: number; failed: number }> {
    const startedAt = Date.now();
    const dueMonitors = await prisma.continuousMonitor.findMany({
      where: {
        active: true,
        OR: [{ nextRun: null }, { nextRun: { lte: new Date() } }],
      },
      select: { id: true, organizationId: true },
      take: 100,
    });

    let executed = 0;
    let failed = 0;

    await Promise.all(
      dueMonitors.map(async (m) => {
        try {
          await this.executeMonitorAndBroadcast(m.id, this.systemUserId, m.organizationId);
          executed++;
        } catch (error) {
          failed++;
          this.totalErrors++;
          logger.error(`Scheduled monitor execution failed [monitor=${m.id}]`, error);
        }
      })
    );

    this.lastTickAt = new Date();
    this.lastTickDurationMs = Date.now() - startedAt;
    this.consecutiveErrors = failed > 0 && executed === 0 ? this.consecutiveErrors + 1 : 0;

    if (dueMonitors.length > 0) {
      logger.info(
        `RealTimeComplianceService tick complete: ${executed} executed, ${failed} failed, ${this.lastTickDurationMs}ms`
      );
    }

    return { executed, failed };
  }

  /**
   * Recompute the org's compliance score, persist to MetricsHistory, broadcast
   * `compliance:score:updated`. Called explicitly or via debounced scheduler.
   */
  async recomputeAndBroadcastScore(
    organizationId: string,
    reason = 'manual'
  ): Promise<ScoreSnapshot> {
    if (!organizationId) throw new AppError('organizationId is required', 400);

    const [frameworks, monitorAgg, openHighRisks] = await Promise.all([
      prisma.complianceFramework.findMany({
        where: { organizationId },
        select: { progress: true },
      }),
      prisma.continuousMonitor.findMany({
        where: { organizationId },
        select: { status: true },
      }),
      prisma.riskItem.count({
        where: {
          organizationId,
          status: { in: ['Open', 'In_Progress'] },
          severity: { in: ['High', 'Critical'] },
        },
      }),
    ]);

    const overall =
      frameworks.length > 0
        ? Math.round((frameworks.reduce((s, f) => s + (f.progress ?? 0), 0) / frameworks.length) * 10) / 10
        : 0;

    const monitorPassRate =
      monitorAgg.length > 0
        ? Math.round((monitorAgg.filter((m) => m.status === 'Passing').length / monitorAgg.length) * 1000) /
          10
        : 0;

    const snapshot: ScoreSnapshot = {
      organizationId,
      overall,
      frameworkCount: frameworks.length,
      monitorPassRate,
      openHighRisks,
      recordedAt: new Date(),
    };

    await prisma.metricsHistory.create({
      data: {
        organizationId,
        metricType: 'compliance-score',
        value: overall,
        metadata: {
          reason,
          frameworkCount: frameworks.length,
          monitorPassRate,
          openHighRisks,
        },
      },
    });

    this.totalScoresRecomputed++;
    this.broadcast(organizationId, 'compliance:score:updated', snapshot);
    return snapshot;
  }

  // ───── Publish helpers (called by other services) ─────────────────────────

  publishRiskChange(
    organizationId: string,
    action: 'created' | 'updated' | 'deleted',
    risk: { id: string; title?: string; severity?: string; status?: string }
  ): void {
    websocketService.broadcastRiskUpdate(organizationId, action, risk);
    this.emitter.emit('risk:changed', { organizationId, action, risk });
    if (
      risk.severity === 'High' ||
      risk.severity === 'Critical' ||
      action === 'created' ||
      action === 'deleted'
    ) {
      this.scheduleScoreRecompute(organizationId, `risk:${action}:${risk.id}`);
    }
  }

  publishFrameworkChange(
    organizationId: string,
    action: 'created' | 'updated' | 'deleted',
    framework: { id: string; name?: string; progress?: number; status?: string }
  ): void {
    websocketService.broadcastFrameworkUpdate(organizationId, action, framework);
    this.emitter.emit('framework:changed', { organizationId, action, framework });
    this.scheduleScoreRecompute(organizationId, `framework:${action}:${framework.id}`);
  }

  publishControlChange(
    organizationId: string,
    action: 'created' | 'updated' | 'deleted',
    control: { id: string; frameworkId?: string; status?: string }
  ): void {
    this.broadcast(organizationId, 'control:changed', { action, control });
    this.scheduleScoreRecompute(organizationId, `control:${action}:${control.id}`);
  }

  publishEvidenceChange(
    organizationId: string,
    action: 'created' | 'updated' | 'deleted' | 'verified',
    evidence: { id: string; controlId?: string }
  ): void {
    this.broadcast(organizationId, 'evidence:changed', { action, evidence });
    if (action === 'verified' || action === 'created') {
      this.scheduleScoreRecompute(organizationId, `evidence:${action}:${evidence.id}`);
    }
  }

  async publishMonitorAlert(organizationId: string, alert: MonitorAlertPayload): Promise<void> {
    this.broadcast(organizationId, 'monitor:alert', alert);
    if (alert.severity === 'High' || alert.severity === 'Critical') {
      await this.notifyOrgAdmins(organizationId, {
        title: `Monitor ${alert.status}: ${alert.monitorName}`,
        message: `${alert.failedTests} of ${alert.passedTests + alert.failedTests} tests failed.`,
        type: alert.status === 'Failing' ? 'error' : 'warning',
        link: `/monitoring/${alert.monitorId}`,
      });
    }
  }

  publishComplianceEvent(
    organizationId: string,
    event: { type: string; severity?: Severity; payload?: unknown }
  ): void {
    this.broadcast(organizationId, 'compliance:event', event);
  }

  // ───── User-targeted notifications ────────────────────────────────────────

  async notifyOrgAdmins(
    organizationId: string,
    notification: {
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
      link?: string;
    }
  ): Promise<number> {
    const admins = await prisma.user.findMany({
      where: {
        organizationId,
        active: true,
        role: { in: ['admin', 'compliance_admin', 'security_admin'] },
      },
      select: { id: true },
    });

    for (const admin of admins) {
      websocketService.sendNotification(admin.id, notification);
    }

    if (admins.length === 0) {
      logger.debug(`notifyOrgAdmins: no admin recipients for org ${organizationId}`);
    }
    return admins.length;
  }

  // ───── Internals ──────────────────────────────────────────────────────────

  /**
   * Broadcast on the WebSocket org room AND emit on the in-process bus.
   * Centralized so every event payload gets the same shape and timestamp
   * semantics, and so listeners on the bus see the exact same payload that
   * went over the wire.
   */
  private broadcast(organizationId: string, event: RealTimeEventName, payload: unknown): void {
    websocketService.broadcastToOrganization(organizationId, event, payload as Record<string, unknown>);
    this.emitter.emit(event, { organizationId, payload, emittedAt: new Date() });
  }

  /**
   * Coalesce score recomputes per org to avoid recomputing once per control
   * mutation in a large bulk operation.
   */
  private scheduleScoreRecompute(organizationId: string, reason: string): void {
    const existing = this.scoreDebounceTimers.get(organizationId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.scoreDebounceTimers.delete(organizationId);
      this.recomputeAndBroadcastScore(organizationId, reason).catch((error) => {
        this.totalErrors++;
        logger.error(`recomputeAndBroadcastScore failed [org=${organizationId}]`, error);
      });
    }, this.scoreDebounceMs);
    timer.unref?.();
    this.scoreDebounceTimers.set(organizationId, timer);
  }
}

const realTimeComplianceService = new RealTimeComplianceService();
export default realTimeComplianceService;
export { RealTimeComplianceService };
