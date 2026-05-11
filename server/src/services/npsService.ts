/**
 * NPS (Net Promoter Score) Survey Service
 *
 * Three responsibilities:
 *   1. Schedule invitations (triggered by lifecycle events: 30-day activity,
 *      onboarding completion, audit completion, manual admin push).
 *   2. Send invitations via SendGrid, tracking the SendGrid message ID for
 *      delivery audit and respecting per-user snooze / dismiss state.
 *   3. Persist responses (0-10 score + optional comment), categorize as
 *      Detractor / Passive / Promoter, and surface aggregate stats per org.
 *
 * NPS = % Promoters - % Detractors, on a -100..+100 scale.
 *
 * Multi-tenant: every read and write filters by organizationId in the actual
 * Prisma query. Locally-generated invitation IDs become server UUIDs at
 * persist time.
 */

import { createHash } from 'crypto';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuditLogger } from '../utils/auditLogger';
import emailService from './emailService';
import logger from '../config/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type NPSTrigger =
  | 'post_30d_active'
  | 'post_onboarding'
  | 'post_audit_complete'
  | 'manual';

export type NPSCategory = 'Detractor' | 'Passive' | 'Promoter';

export type NPSInvitationStatus =
  | 'Scheduled'
  | 'Sent'
  | 'Responded'
  | 'Dismissed'
  | 'Snoozed'
  | 'Expired';

export interface CreateNPSResponseInput {
  organizationId: string;
  userId: string;
  invitationId?: string;
  score: number;
  comment?: string;
  source?: 'in_app' | 'email' | 'api';
  userAgent?: string;
  ipAddress?: string;
}

export interface NPSStats {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  responseCount: number;
  detractorCount: number;
  passiveCount: number;
  promoterCount: number;
  detractorPercent: number;
  passivePercent: number;
  promoterPercent: number;
  nps: number;                  // -100..+100
  averageScore: number | null;
  responseRate: number | null;  // 0..1, responses / invitations
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_INVITATION_TTL_DAYS = 14;
const DEFAULT_MIN_DAYS_BETWEEN_INVITATIONS = 90;

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

function categorize(score: number): NPSCategory {
  if (score <= 6) return 'Detractor';
  if (score <= 8) return 'Passive';
  return 'Promoter';
}

function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

export class NPSService {

  /**
   * Schedule an invitation for a user. Idempotent on (userId, trigger,
   * scheduledFor) — a duplicate schedule for the same trigger/day is a no-op.
   * Skips scheduling if the user has responded or dismissed within the
   * cooldown window.
   */
  async scheduleInvitation(input: {
    organizationId: string;
    userId: string;
    trigger: NPSTrigger;
    scheduledFor?: Date;
    cooldownDays?: number;
    ttlDays?: number;
  }) {
    const { organizationId, userId, trigger } = input;
    const scheduledFor = input.scheduledFor ?? new Date();
    const ttlDays = input.ttlDays ?? DEFAULT_INVITATION_TTL_DAYS;
    const cooldownDays = input.cooldownDays ?? DEFAULT_MIN_DAYS_BETWEEN_INVITATIONS;
    const expiresAt = new Date(scheduledFor.getTime() + ttlDays * 86400000);

    const cooldownStart = new Date(Date.now() - cooldownDays * 86400000);
    const recent = await prisma.nPSInvitation.findFirst({
      where: {
        organizationId,
        userId,
        OR: [
          { respondedAt: { gte: cooldownStart } },
          { dismissedAt: { gte: cooldownStart } },
        ],
      },
      orderBy: { scheduledFor: 'desc' },
    });
    if (recent) {
      return { skipped: true, reason: 'cooldown', recentInvitationId: recent.id };
    }

    try {
      const invitation = await prisma.nPSInvitation.create({
        data: {
          organizationId,
          userId,
          trigger,
          scheduledFor,
          expiresAt,
          status: 'Scheduled',
        },
      });
      await AuditLogger.log({
        userId,
        organizationId,
        action: 'nps.invitation.scheduled',
        resourceType: 'NPSInvitation',
        resourceId: invitation.id,
        metadata: { trigger, scheduledFor: scheduledFor.toISOString() },
      });
      return { skipped: false, invitation };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return { skipped: true, reason: 'duplicate' };
      }
      logger.error('Failed to schedule NPS invitation', err);
      throw new AppError('Failed to schedule NPS invitation', 500);
    }
  }

  /**
   * Sends a scheduled invitation. Records the SendGrid message ID for
   * delivery audit. Marks status=Sent. Caller (typically a scheduled job)
   * is expected to batch these.
   */
  async sendInvitation(invitationId: string, organizationId: string) {
    const invitation = await prisma.nPSInvitation.findFirst({
      where: { id: invitationId, organizationId },
      include: { user: true, organization: true },
    });
    if (!invitation) throw new AppError('NPS invitation not found', 404);
    if (invitation.status !== 'Scheduled') {
      throw new AppError(`Invitation cannot be sent in status ${invitation.status}`, 409);
    }
    if (invitation.expiresAt < new Date()) {
      await prisma.nPSInvitation.update({
        where: { id: invitationId },
        data: { status: 'Expired' },
      });
      throw new AppError('Invitation has expired', 410);
    }

    const surveyUrl = `${process.env.APP_URL || 'https://app.complyeasyai.com'}/nps?invitationId=${invitation.id}`;
    const firstName = (invitation.user.name?.split(' ')[0]) || 'there';
    const html = renderInvitationHtml({
      firstName,
      orgName: invitation.organization.name,
      surveyUrl,
    });
    const text = renderInvitationText({
      firstName,
      surveyUrl,
    });

    let messageId: string | null = null;
    try {
      const sent = await emailService.sendEmail({
        to: invitation.user.email,
        subject: 'How likely are you to recommend ComplyEasyAI?',
        html,
        text,
      });
      messageId = typeof sent === 'string' ? sent : null;
    } catch (err) {
      logger.error('Failed to send NPS invitation email', err);
      // Leave Scheduled so the worker can retry; do not flip to Sent.
      throw new AppError('Failed to send NPS invitation email', 502);
    }

    const updated = await prisma.nPSInvitation.update({
      where: { id: invitationId },
      data: {
        sentAt: new Date(),
        status: 'Sent',
        emailMessageId: messageId,
      },
    });
    await AuditLogger.log({
      userId: invitation.userId,
      organizationId,
      action: 'nps.invitation.sent',
      resourceType: 'NPSInvitation',
      resourceId: invitation.id,
      metadata: { trigger: invitation.trigger, emailMessageId: messageId },
    });
    return updated;
  }

  /**
   * Persist a response. If invitationId is provided, marks the invitation
   * Responded and links the response. Validates score 0-10 and computes the
   * category (Detractor / Passive / Promoter).
   */
  async createResponse(input: CreateNPSResponseInput) {
    const { organizationId, userId, invitationId, score, comment, source, userAgent, ipAddress } = input;
    if (!Number.isInteger(score) || score < 0 || score > 10) {
      throw new AppError('Score must be an integer between 0 and 10', 400);
    }
    if (comment && comment.length > 2000) {
      throw new AppError('Comment must be 2000 characters or fewer', 400);
    }

    if (invitationId) {
      const inv = await prisma.nPSInvitation.findFirst({
        where: { id: invitationId, organizationId, userId },
      });
      if (!inv) throw new AppError('NPS invitation not found for this user', 404);
      if (inv.expiresAt < new Date()) throw new AppError('NPS invitation has expired', 410);
    }

    const category = categorize(score);
    const ipHash = hashIp(ipAddress);

    const result = await prisma.$transaction(async (tx) => {
      const response = await tx.nPSResponse.create({
        data: {
          organizationId,
          userId,
          invitationId: invitationId ?? null,
          score,
          category,
          comment: comment?.trim() || null,
          source: source ?? 'in_app',
          userAgent: userAgent?.slice(0, 500) ?? null,
          ipHash,
        },
      });
      if (invitationId) {
        await tx.nPSInvitation.update({
          where: { id: invitationId },
          data: { respondedAt: new Date(), status: 'Responded' },
        });
      }
      return response;
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'nps.response.created',
      resourceType: 'NPSResponse',
      resourceId: result.id,
      metadata: { score, category, source: source ?? 'in_app' },
    });
    return result;
  }

  /**
   * User-initiated dismiss. Marks the invitation Dismissed so the in-app
   * prompt stops appearing immediately.
   */
  async dismissInvitation(invitationId: string, organizationId: string, userId: string) {
    const inv = await prisma.nPSInvitation.updateMany({
      where: { id: invitationId, organizationId, userId },
      data: { dismissedAt: new Date(), status: 'Dismissed' },
    });
    if (inv.count === 0) throw new AppError('NPS invitation not found', 404);
    await AuditLogger.log({
      userId,
      organizationId,
      action: 'nps.invitation.dismissed',
      resourceType: 'NPSInvitation',
      resourceId: invitationId,
    });
    return { dismissed: true };
  }

  /**
   * User-initiated snooze. Suppresses the prompt until snoozedUntil.
   */
  async snoozeInvitation(invitationId: string, organizationId: string, userId: string, untilDays: number) {
    if (!Number.isInteger(untilDays) || untilDays < 1 || untilDays > 90) {
      throw new AppError('Snooze must be between 1 and 90 days', 400);
    }
    const snoozedUntil = new Date(Date.now() + untilDays * 86400000);
    const inv = await prisma.nPSInvitation.updateMany({
      where: { id: invitationId, organizationId, userId },
      data: { snoozedUntil, status: 'Snoozed' },
    });
    if (inv.count === 0) throw new AppError('NPS invitation not found', 404);
    await AuditLogger.log({
      userId,
      organizationId,
      action: 'nps.invitation.snoozed',
      resourceType: 'NPSInvitation',
      resourceId: invitationId,
      metadata: { snoozedUntil: snoozedUntil.toISOString() },
    });
    return { snoozedUntil };
  }

  /**
   * Returns the currently-actionable invitation for the in-app prompt, or
   * null if none. Filters out expired, dismissed, responded, snoozed.
   */
  async getActiveInvitation(organizationId: string, userId: string) {
    const now = new Date();
    return prisma.nPSInvitation.findFirst({
      where: {
        organizationId,
        userId,
        status: { in: ['Scheduled', 'Sent'] },
        expiresAt: { gt: now },
        respondedAt: null,
        dismissedAt: null,
        OR: [
          { snoozedUntil: null },
          { snoozedUntil: { lt: now } },
        ],
      },
      orderBy: { scheduledFor: 'desc' },
    });
  }

  /**
   * Returns NPS aggregate for an org over a period. Default: last 90 days.
   */
  async getStats(organizationId: string, periodStart?: Date, periodEnd?: Date): Promise<NPSStats> {
    const end = periodEnd ?? new Date();
    const start = periodStart ?? new Date(end.getTime() - 90 * 86400000);

    const [responses, invitationCount] = await Promise.all([
      prisma.nPSResponse.findMany({
        where: {
          organizationId,
          createdAt: { gte: start, lte: end },
        },
        select: { score: true, category: true },
      }),
      prisma.nPSInvitation.count({
        where: {
          organizationId,
          OR: [
            { sentAt: { gte: start, lte: end } },
            { respondedAt: { gte: start, lte: end } },
          ],
        },
      }),
    ]);

    const responseCount = responses.length;
    const detractorCount = responses.filter(r => r.category === 'Detractor').length;
    const passiveCount = responses.filter(r => r.category === 'Passive').length;
    const promoterCount = responses.filter(r => r.category === 'Promoter').length;

    const pct = (n: number) => responseCount === 0 ? 0 : Math.round((n / responseCount) * 10000) / 100;
    const detractorPercent = pct(detractorCount);
    const passivePercent = pct(passiveCount);
    const promoterPercent = pct(promoterCount);
    const nps = responseCount === 0 ? 0 : Math.round((promoterPercent - detractorPercent) * 100) / 100;
    const averageScore = responseCount === 0
      ? null
      : Math.round((responses.reduce((s, r) => s + r.score, 0) / responseCount) * 100) / 100;
    const responseRate = invitationCount === 0 ? null : Math.round((responseCount / invitationCount) * 10000) / 10000;

    return {
      organizationId,
      periodStart: start,
      periodEnd: end,
      responseCount,
      detractorCount,
      passiveCount,
      promoterCount,
      detractorPercent,
      passivePercent,
      promoterPercent,
      nps,
      averageScore,
      responseRate,
    };
  }

  /**
   * Lists responses with optional filtering. Used by admin dashboards.
   */
  async listResponses(organizationId: string, filter?: {
    category?: NPSCategory;
    since?: Date;
    until?: Date;
    take?: number;
    skip?: number;
  }) {
    return prisma.nPSResponse.findMany({
      where: {
        organizationId,
        ...(filter?.category ? { category: filter.category } : {}),
        ...(filter?.since || filter?.until
          ? { createdAt: {
              ...(filter?.since ? { gte: filter.since } : {}),
              ...(filter?.until ? { lte: filter.until } : {}),
            } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(filter?.take ?? 50, 200),
      skip: filter?.skip ?? 0,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  /**
   * Background processor: sends every Scheduled invitation whose scheduledFor
   * is in the past. Used by a cron job (see scripts or BullMQ queue).
   */
  async processDueInvitations(limit = 100) {
    const due = await prisma.nPSInvitation.findMany({
      where: {
        status: 'Scheduled',
        scheduledFor: { lte: new Date() },
        expiresAt: { gt: new Date() },
      },
      take: limit,
      orderBy: { scheduledFor: 'asc' },
    });
    let sent = 0;
    let failed = 0;
    for (const inv of due) {
      try {
        await this.sendInvitation(inv.id, inv.organizationId);
        sent += 1;
      } catch (err) {
        logger.warn(`NPS invitation ${inv.id} failed to send`, err);
        failed += 1;
      }
    }
    return { processed: due.length, sent, failed };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Email body templates
// ─────────────────────────────────────────────────────────────────────────────

function renderInvitationHtml(opts: { firstName: string; orgName: string; surveyUrl: string }): string {
  const { firstName, orgName, surveyUrl } = opts;
  return `<!DOCTYPE html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
  <h1 style="font-size: 22px; margin: 0 0 16px;">Hi ${escapeHtml(firstName)},</h1>
  <p style="font-size: 16px; line-height: 1.6;">
    You've been using ComplyEasyAI at <strong>${escapeHtml(orgName)}</strong> for a while now, and we'd love your honest input.
  </p>
  <p style="font-size: 16px; line-height: 1.6;">
    <strong>How likely are you to recommend ComplyEasyAI to a friend or colleague?</strong>
  </p>
  <div style="margin: 32px 0; text-align: center;">
    <a href="${escapeAttr(surveyUrl)}" style="display: inline-block; padding: 14px 32px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
      Take the 30-second survey
    </a>
  </div>
  <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
    It takes 30 seconds. Your responses go directly to the product team and shape the roadmap.
  </p>
  <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">
    Don't want to be asked again? <a href="${escapeAttr(surveyUrl)}&action=dismiss" style="color: #9ca3af;">Unsubscribe from NPS</a>.
  </p>
</body></html>`;
}

function renderInvitationText(opts: { firstName: string; surveyUrl: string }): string {
  return `Hi ${opts.firstName},

How likely are you to recommend ComplyEasyAI to a friend or colleague?

Take the 30-second survey:
${opts.surveyUrl}

Don't want to be asked again? Add &action=dismiss to the link above.

— The ComplyEasyAI team
`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

export default new NPSService();
