/**
 * Session Management Service
 * 
 * Features:
 * - Concurrent session limit enforcement
 * - Session timeout with warnings
 * - Session tracking and cleanup
 * - Active session monitoring
 */

import prisma from '../config/database';
import logger from '../config/logger';
import crypto from 'crypto';
import { EventEmitter } from 'events';

export interface UserSession {
  id: string;
  userId: string;
  organizationId: string;
  token: string;
  refreshToken?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  timeoutWarningSent: boolean;
  deviceInfo?: {
    type: string;
    os: string;
    browser: string;
  };
}

interface SessionConfig {
  maxConcurrentSessions: number;
  sessionTimeout: number; // milliseconds
  warningTimeBeforeTimeout: number; // milliseconds before timeout to send warning
  cleanupInterval: number; // milliseconds
}

class SessionManagementService extends EventEmitter {
  private activeSessions: Map<string, UserSession> = new Map(); // sessionId -> session
  private userSessions: Map<string, Set<string>> = new Map(); // userId -> Set<sessionId>
  private config: SessionConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private warningInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.config = {
      maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '5', 10),
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000', 10), // 1 hour default
      warningTimeBeforeTimeout: parseInt(process.env.SESSION_WARNING_TIME || '300000', 10), // 5 minutes before timeout
      cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL || '60000', 10), // 1 minute
    };
  }

  /**
   * Initialize session management
   */
  async initialize(): Promise<void> {
    try {
      // Start cleanup interval
      this.cleanupInterval = setInterval(() => {
        this.cleanupExpiredSessions().catch(error => {
          logger.error('[Session Management] Cleanup error', error);
        });
      }, this.config.cleanupInterval);

      // Start warning interval
      this.warningInterval = setInterval(() => {
        this.checkAndSendTimeoutWarnings().catch(error => {
          logger.error('[Session Management] Warning check error', error);
        });
      }, 30000); // Check every 30 seconds

      logger.info('[Session Management] Service initialized');
    } catch (error) {
      logger.error('[Session Management] Initialization error', error);
      throw error;
    }
  }

  /**
   * Create a new session (ENHANCED with concurrent limit enforcement)
   */
  async createSession(
    userId: string,
    organizationId: string,
    token: string,
    refreshToken?: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceInfo?: { type: string; os: string; browser: string };
    }
  ): Promise<{ session: UserSession; existingSessionsTerminated?: number }> {
    try {
      // Check concurrent session limit
      const userSessionIds = this.userSessions.get(userId) || new Set();
      const activeUserSessions = Array.from(userSessionIds)
        .map(sessionId => this.activeSessions.get(sessionId))
        .filter(session => session && session.expiresAt > new Date()) as UserSession[];

      let existingSessionsTerminated = 0;

      // Enforce concurrent session limit
      if (activeUserSessions.length >= this.config.maxConcurrentSessions) {
        // Terminate oldest sessions (FIFO)
        const sortedSessions = activeUserSessions.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );

        const sessionsToTerminate = sortedSessions.slice(
          0,
          activeUserSessions.length - this.config.maxConcurrentSessions + 1
        );

        for (const session of sessionsToTerminate) {
          await this.terminateSession(session.id, 'concurrent_limit_exceeded');
          existingSessionsTerminated++;
        }

        logger.info(
          `[Session Management] Terminated ${existingSessionsTerminated} sessions for user ${userId} due to concurrent limit`
        );
      }

      // Create new session
      const sessionId = `session_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.config.sessionTimeout);

      const session: UserSession = {
        id: sessionId,
        userId,
        organizationId,
        token,
        refreshToken,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        createdAt: now,
        lastActivityAt: now,
        expiresAt,
        timeoutWarningSent: false,
        deviceInfo: metadata?.deviceInfo,
      };

      // Store session
      this.activeSessions.set(sessionId, session);

      // Track user sessions
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, new Set());
      }
      this.userSessions.get(userId)!.add(sessionId);

      // Store in database
      await this.storeSessionInDatabase(session);

      // Emit event
      this.emit('sessionCreated', session);

      logger.info(`[Session Management] Session created: ${sessionId} for user ${userId}`);

      return {
        session,
        existingSessionsTerminated: existingSessionsTerminated > 0 ? existingSessionsTerminated : undefined,
      };
    } catch (error) {
      logger.error('[Session Management] Error creating session', error);
      throw error;
    }
  }

  /**
   * Update session activity (refresh lastActivityAt)
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return;
      }

      // Check if session is expired
      if (session.expiresAt <= new Date()) {
        await this.terminateSession(sessionId, 'expired');
        return;
      }

      // Update last activity
      session.lastActivityAt = new Date();
      
      // Extend expiration if needed (sliding window)
      const timeSinceLastActivity = Date.now() - session.lastActivityAt.getTime();
      if (timeSinceLastActivity < this.config.sessionTimeout / 2) {
        // Extend expiration if less than half timeout has passed
        session.expiresAt = new Date(Date.now() + this.config.sessionTimeout);
        session.timeoutWarningSent = false; // Reset warning flag
      }

      // Update in database
      await this.updateSessionInDatabase(session);
    } catch (error) {
      logger.error('[Session Management] Error updating session activity', error);
    }
  }

  /**
   * Get active sessions for a user
   */
  getActiveSessions(userId: string): UserSession[] {
    const userSessionIds = this.userSessions.get(userId) || new Set();
    return Array.from(userSessionIds)
      .map(sessionId => this.activeSessions.get(sessionId))
      .filter(session => session && session.expiresAt > new Date()) as UserSession[];
  }

  /**
   * Terminate a session
   */
  async terminateSession(sessionId: string, reason: string = 'manual'): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return;
      }

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      // Remove from user sessions
      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }

      // Mark as terminated in database
      await this.markSessionTerminated(sessionId, reason);

      // Emit event
      this.emit('sessionTerminated', { session, reason });

      logger.info(`[Session Management] Session terminated: ${sessionId} (reason: ${reason})`);
    } catch (error) {
      logger.error('[Session Management] Error terminating session', error);
    }
  }

  /**
   * Terminate all sessions for a user
   */
  async terminateAllUserSessions(userId: string, reason: string = 'manual'): Promise<number> {
    try {
      const userSessionIds = this.userSessions.get(userId) || new Set();
      let terminatedCount = 0;

      for (const sessionId of userSessionIds) {
        await this.terminateSession(sessionId, reason);
        terminatedCount++;
      }

      logger.info(`[Session Management] Terminated ${terminatedCount} sessions for user ${userId}`);
      return terminatedCount;
    } catch (error) {
      logger.error('[Session Management] Error terminating user sessions', error);
      throw error;
    }
  }

  /**
   * Check and send timeout warnings (ENHANCED)
   */
  private async checkAndSendTimeoutWarnings(): Promise<void> {
    try {
      const now = Date.now();

      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.timeoutWarningSent) {
          continue; // Warning already sent
        }

        const timeUntilExpiry = session.expiresAt.getTime() - now;

        // Send warning if within warning time window
        if (timeUntilExpiry > 0 && timeUntilExpiry <= this.config.warningTimeBeforeTimeout) {
          await this.sendTimeoutWarning(session);
          session.timeoutWarningSent = true;
        }
      }
    } catch (error) {
      logger.error('[Session Management] Error checking timeout warnings', error);
    }
  }

  /**
   * Send timeout warning to user
   */
  private async sendTimeoutWarning(session: UserSession): Promise<void> {
    try {
      // Emit warning event (frontend can listen and show notification)
      this.emit('sessionTimeoutWarning', {
        sessionId: session.id,
        userId: session.userId,
        timeRemaining: session.expiresAt.getTime() - Date.now(),
        message: `Your session will expire in ${Math.round((session.expiresAt.getTime() - Date.now()) / 1000 / 60)} minutes. Please save your work.`,
      });

      // Store warning in database
      await prisma.auditLog.create({
        data: {
          action: 'session.timeout_warning_sent',
          details: JSON.stringify({
            sessionId: session.id,
            userId: session.userId,
            timeRemaining: session.expiresAt.getTime() - Date.now(),
          }),
          userId: session.userId,
          organizationId: session.organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[Session Management] Timeout warning sent for session ${session.id}`);
    } catch (error) {
      logger.error('[Session Management] Error sending timeout warning', error);
    }
  }

  /**
   * Cleanup expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = new Date();
      const expiredSessions: string[] = [];

      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.expiresAt <= now) {
          expiredSessions.push(sessionId);
        }
      }

      for (const sessionId of expiredSessions) {
        await this.terminateSession(sessionId, 'expired');
      }

      if (expiredSessions.length > 0) {
        logger.info(`[Session Management] Cleaned up ${expiredSessions.length} expired sessions`);
      }
    } catch (error) {
      logger.error('[Session Management] Error cleaning up sessions', error);
    }
  }

  /**
   * Store session in database
   */
  private async storeSessionInDatabase(session: UserSession): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: 'session.created',
          details: JSON.stringify({
            sessionId: session.id,
            userId: session.userId,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            deviceInfo: session.deviceInfo,
            expiresAt: session.expiresAt,
          }),
          userId: session.userId,
          organizationId: session.organizationId,
          hash: session.id,
        },
      });
    } catch (error) {
      logger.error('[Session Management] Error storing session in database', error);
    }
  }

  /**
   * Update session in database
   */
  private async updateSessionInDatabase(session: UserSession): Promise<void> {
    try {
      await prisma.auditLog.updateMany({
        where: {
          hash: session.id,
          action: 'session.created',
        },
        data: {
          details: JSON.stringify({
            sessionId: session.id,
            userId: session.userId,
            lastActivityAt: session.lastActivityAt,
            expiresAt: session.expiresAt,
            timeoutWarningSent: session.timeoutWarningSent,
          }),
        },
      });
    } catch (error) {
      logger.error('[Session Management] Error updating session in database', error);
    }
  }

  /**
   * Mark session as terminated in database
   */
  private async markSessionTerminated(sessionId: string, reason: string): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: 'session.terminated',
          details: JSON.stringify({
            sessionId,
            reason,
            terminatedAt: new Date(),
          }),
          userId: 'system',
          organizationId: 'system',
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });
    } catch (error) {
      logger.error('[Session Management] Error marking session terminated', error);
    }
  }

  /**
   * Get session statistics
   */
  getSessionStatistics(organizationId?: string): {
    totalActiveSessions: number;
    sessionsByUser: number;
    sessionsExpiringSoon: number;
    averageSessionDuration: number;
  } {
    const now = Date.now();
    const activeSessions = Array.from(this.activeSessions.values()).filter(
      session => session.expiresAt > new Date() && (!organizationId || session.organizationId === organizationId)
    );

    const sessionsExpiringSoon = activeSessions.filter(
      session => session.expiresAt.getTime() - now <= this.config.warningTimeBeforeTimeout
    ).length;

    const sessionsByUser = this.userSessions.size;

    // Calculate average session duration
    const durations = activeSessions.map(
      session => now - session.createdAt.getTime()
    );
    const averageSessionDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return {
      totalActiveSessions: activeSessions.length,
      sessionsByUser,
      sessionsExpiringSoon,
      averageSessionDuration,
    };
  }

  /**
   * Shutdown service
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.warningInterval) {
      clearInterval(this.warningInterval);
    }
    logger.info('[Session Management] Service shutdown');
  }
}

export default new SessionManagementService();

