/**
 * Just-In-Time (JIT) Admin Access Service
 * Temporary privilege escalation with time-based access control
 * Implements zero standing privileges principle
 */

import crypto from 'crypto';
import logger from '../config/logger';
import prisma from '../config/database';

type PrivilegeLevel =
  | 'viewer'
  | 'editor'
  | 'admin'
  | 'super_admin'
  | 'security_admin'
  | 'compliance_admin';

type AccessReason =
  | 'incident_response'
  | 'compliance_audit'
  | 'security_investigation'
  | 'emergency_fix'
  | 'scheduled_maintenance'
  | 'data_access_request';

interface JITAccessRequest {
  id: string;
  userId: string;
  organizationId: string;
  requestedPrivilege: PrivilegeLevel;
  reason: AccessReason;
  justification: string;
  duration: number; // in minutes
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'revoked';
  approvedBy?: string;
  approvedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

interface JITSession {
  id: string;
  requestId: string;
  userId: string;
  organizationId: string;
  privilege: PrivilegeLevel;
  startTime: Date;
  endTime: Date;
  extendedCount: number;
  actionsPerformed: string[];
  active: boolean;
}

interface AccessApprovalPolicy {
  privilegeLevel: PrivilegeLevel;
  requiresApproval: boolean;
  approverCount: number;
  maxDuration: number; // in minutes
  allowedReasons: AccessReason[];
  autoApprove: boolean;
}

/**
 * JIT Access Service for zero standing privileges
 *
 * Features:
 * 1. Time-bound privilege escalation
 * 2. Multi-level approval workflows
 * 3. Automatic privilege revocation
 * 4. Audit trail for all privilege usage
 * 5. Session monitoring and extension
 */
class JITAccessService {
  private activeSessions: Map<string, JITSession> = new Map();
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startSessionMonitoring();
  }

  /**
   * Request temporary elevated privileges
   */
  async requestAccess(
    userId: string,
    organizationId: string,
    privilege: PrivilegeLevel,
    reason: AccessReason,
    justification: string,
    durationMinutes: number = 30
  ): Promise<JITAccessRequest> {
    try {
      // Validate request
      const policy = await this.getAccessPolicy(privilege);

      if (!policy.allowedReasons.includes(reason)) {
        throw new Error(`Reason '${reason}' not allowed for privilege '${privilege}'`);
      }

      if (durationMinutes > policy.maxDuration) {
        throw new Error(`Duration exceeds maximum of ${policy.maxDuration} minutes`);
      }

      // Create access request
      const requestId = crypto.randomBytes(16).toString('hex');

      const request: JITAccessRequest = {
        id: requestId,
        userId,
        organizationId,
        requestedPrivilege: privilege,
        reason,
        justification,
        duration: durationMinutes,
        status: policy.autoApprove ? 'approved' : 'pending',
        createdAt: new Date(),
      };

      if (policy.autoApprove) {
        request.approvedAt = new Date();
        request.expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

        // Automatically create session
        await this.createSession(request);
      }

      // Store request in database
      await this.storeAccessRequest(request);

      logger.info(`JIT access requested: ${userId} -> ${privilege} (${durationMinutes}min)`);

      return request;
    } catch (error) {
      logger.error('Error requesting JIT access', error);
      throw new Error('JIT access request failed');
    }
  }

  /**
   * Approve access request
   */
  async approveAccess(
    requestId: string,
    approverId: string,
    organizationId: string
  ): Promise<JITSession> {
    try {
      const request = await this.getAccessRequest(requestId);

      if (!request) {
        throw new Error('Access request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Access request is not pending');
      }

      // Verify approver has sufficient privileges
      const approver = await prisma.user.findUnique({
        where: { id: approverId },
      });

      if (!approver || approver.role !== 'admin') {
        throw new Error('Insufficient privileges to approve request');
      }

      // Update request status
      request.status = 'approved';
      request.approvedBy = approverId;
      request.approvedAt = new Date();
      request.expiresAt = new Date(Date.now() + request.duration * 60 * 1000);

      await this.updateAccessRequest(request);

      // Create active session
      const session = await this.createSession(request);

      logger.info(`JIT access approved: ${request.userId} -> ${request.requestedPrivilege} by ${approverId}`);

      return session;
    } catch (error) {
      logger.error('Error approving JIT access', error);
      throw new Error('JIT access approval failed');
    }
  }

  /**
   * Deny access request
   */
  async denyAccess(
    requestId: string,
    approverId: string,
    reason: string
  ): Promise<void> {
    try {
      const request = await this.getAccessRequest(requestId);

      if (!request) {
        throw new Error('Access request not found');
      }

      request.status = 'denied';
      await this.updateAccessRequest(request);

      logger.info(`JIT access denied: ${request.userId} -> ${request.requestedPrivilege} by ${approverId}`);
    } catch (error) {
      logger.error('Error denying JIT access', error);
      throw new Error('JIT access denial failed');
    }
  }

  /**
   * Create active JIT session
   */
  private async createSession(request: JITAccessRequest): Promise<JITSession> {
    try {
      const sessionId = crypto.randomBytes(16).toString('hex');
      const endTime = new Date(Date.now() + request.duration * 60 * 1000);

      const session: JITSession = {
        id: sessionId,
        requestId: request.id,
        userId: request.userId,
        organizationId: request.organizationId,
        privilege: request.requestedPrivilege,
        startTime: new Date(),
        endTime,
        extendedCount: 0,
        actionsPerformed: [],
        active: true,
      };

      this.activeSessions.set(sessionId, session);

      // Grant temporary privilege to user
      await this.grantTemporaryPrivilege(request.userId, request.requestedPrivilege);

      // Store session in database
      await this.storeSession(session);

      logger.info(`JIT session created: ${sessionId} (expires ${endTime.toISOString()})`);

      return session;
    } catch (error) {
      logger.error('Error creating JIT session', error);
      throw new Error('JIT session creation failed');
    }
  }

  /**
   * Extend active session
   */
  async extendSession(
    sessionId: string,
    additionalMinutes: number,
    justification: string
  ): Promise<JITSession> {
    try {
      const session = this.activeSessions.get(sessionId);

      if (!session || !session.active) {
        throw new Error('Session not found or inactive');
      }

      // Get policy
      const policy = await this.getAccessPolicy(session.privilege);
      const currentDuration = Math.floor(
        (session.endTime.getTime() - session.startTime.getTime()) / (60 * 1000)
      );

      if (currentDuration + additionalMinutes > policy.maxDuration) {
        throw new Error('Extension would exceed maximum duration');
      }

      // Extend session
      session.endTime = new Date(session.endTime.getTime() + additionalMinutes * 60 * 1000);
      session.extendedCount += 1;

      await this.updateSession(session);

      logger.info(`JIT session extended: ${sessionId} (+${additionalMinutes}min)`);

      return session;
    } catch (error) {
      logger.error('Error extending JIT session', error);
      throw new Error('JIT session extension failed');
    }
  }

  /**
   * Revoke active session immediately
   */
  async revokeSession(
    sessionId: string,
    reason: string
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      // Revoke privilege immediately
      await this.revokeTemporaryPrivilege(session.userId, session.privilege);

      session.active = false;
      session.endTime = new Date();

      await this.updateSession(session);
      this.activeSessions.delete(sessionId);

      logger.info(`JIT session revoked: ${sessionId} (reason: ${reason})`);
    } catch (error) {
      logger.error('Error revoking JIT session', error);
      throw new Error('JIT session revocation failed');
    }
  }

  /**
   * Log action performed during JIT session
   */
  async logSessionAction(
    sessionId: string,
    action: string,
    details?: any
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);

      if (!session || !session.active) {
        throw new Error('Session not found or inactive');
      }

      session.actionsPerformed.push(action);

      // Log to audit trail
      await prisma.auditLog.create({
        data: {
          action: `JIT Action: ${action}`,
          userId: session.userId,
          organizationId: session.organizationId,
          hash: crypto.randomBytes(32).toString('hex'),
          details: JSON.stringify({
            sessionId,
            privilege: session.privilege,
            action,
            timestamp: new Date(),
            ...details,
          }),
        },
      });

      logger.info(`JIT action logged: ${sessionId} - ${action}`);
    } catch (error) {
      logger.error('Error logging JIT session action', error);
    }
  }

  /**
   * Get active sessions for user
   */
  async getUserActiveSessions(userId: string): Promise<JITSession[]> {
    const sessions: JITSession[] = [];

    for (const session of this.activeSessions.values()) {
      if (session.userId === userId && session.active) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Check if user has specific privilege (including JIT)
   */
  async hasPrivilege(userId: string, privilege: PrivilegeLevel): Promise<boolean> {
    try {
      // Check permanent role
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (this.comparePrivileges(user?.role || 'viewer', privilege)) {
        return true;
      }

      // Check active JIT sessions
      const sessions = await this.getUserActiveSessions(userId);
      return sessions.some((s) => this.comparePrivileges(s.privilege, privilege));
    } catch (error) {
      logger.error('Error checking privilege', error);
      return false;
    }
  }

  /**
   * Compare privilege levels
   */
  private comparePrivileges(userPrivilege: string, requiredPrivilege: PrivilegeLevel): boolean {
    const levels: PrivilegeLevel[] = [
      'viewer',
      'editor',
      'admin',
      'compliance_admin',
      'security_admin',
      'super_admin',
    ];

    const userLevel = levels.indexOf(userPrivilege as PrivilegeLevel);
    const requiredLevel = levels.indexOf(requiredPrivilege);

    return userLevel >= requiredLevel;
  }

  /**
   * Start monitoring active sessions
   */
  private startSessionMonitoring(): void {
    // Check for expired sessions every 30 seconds
    this.sessionCheckInterval = setInterval(async () => {
      const now = new Date();

      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.active && session.endTime <= now) {
          logger.info(`JIT session expired: ${sessionId}`);
          await this.revokeSession(sessionId, 'Session expired');
        }
      }
    }, 30000);
  }

  /**
   * Get access policy for privilege level
   */
  private async getAccessPolicy(privilege: PrivilegeLevel): Promise<AccessApprovalPolicy> {
    // Define policies for each privilege level
    const policies: Record<PrivilegeLevel, AccessApprovalPolicy> = {
      viewer: {
        privilegeLevel: 'viewer',
        requiresApproval: false,
        approverCount: 0,
        maxDuration: 480, // 8 hours
        allowedReasons: ['scheduled_maintenance', 'data_access_request'],
        autoApprove: true,
      },
      editor: {
        privilegeLevel: 'editor',
        requiresApproval: false,
        approverCount: 0,
        maxDuration: 240, // 4 hours
        allowedReasons: ['scheduled_maintenance', 'emergency_fix', 'data_access_request'],
        autoApprove: true,
      },
      admin: {
        privilegeLevel: 'admin',
        requiresApproval: true,
        approverCount: 1,
        maxDuration: 120, // 2 hours
        allowedReasons: [
          'incident_response',
          'emergency_fix',
          'scheduled_maintenance',
          'compliance_audit',
        ],
        autoApprove: false,
      },
      compliance_admin: {
        privilegeLevel: 'compliance_admin',
        requiresApproval: true,
        approverCount: 1,
        maxDuration: 180, // 3 hours
        allowedReasons: ['compliance_audit', 'security_investigation', 'data_access_request'],
        autoApprove: false,
      },
      security_admin: {
        privilegeLevel: 'security_admin',
        requiresApproval: true,
        approverCount: 1,
        maxDuration: 120, // 2 hours
        allowedReasons: ['incident_response', 'security_investigation', 'emergency_fix'],
        autoApprove: false,
      },
      super_admin: {
        privilegeLevel: 'super_admin',
        requiresApproval: true,
        approverCount: 2,
        maxDuration: 60, // 1 hour
        allowedReasons: ['incident_response', 'emergency_fix'],
        autoApprove: false,
      },
    };

    return policies[privilege];
  }

  /**
   * Grant temporary privilege to user
   */
  private async grantTemporaryPrivilege(
    userId: string,
    privilege: PrivilegeLevel
  ): Promise<void> {
    // In production, this would update user permissions temporarily
    logger.info(`Granted temporary ${privilege} to user ${userId}`);
  }

  /**
   * Revoke temporary privilege from user
   */
  private async revokeTemporaryPrivilege(
    userId: string,
    privilege: PrivilegeLevel
  ): Promise<void> {
    // In production, this would remove temporary permissions
    logger.info(`Revoked temporary ${privilege} from user ${userId}`);
  }

  /**
   * Store access request in database
   */
  private async storeAccessRequest(request: JITAccessRequest): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: `JIT Access Request: ${request.requestedPrivilege}`,
          userId: request.userId,
          organizationId: request.organizationId,
          hash: crypto.randomBytes(32).toString('hex'),
          details: JSON.stringify({
            requestId: request.id,
            privilege: request.requestedPrivilege,
            reason: request.reason,
            justification: request.justification,
            duration: request.duration,
            status: request.status,
          }),
        },
      });
    } catch (error) {
      logger.error('Error storing access request', error);
    }
  }

  /**
   * Get access request by ID
   */
  private async getAccessRequest(requestId: string): Promise<JITAccessRequest | null> {
    // In production, retrieve from database
    // For now, return mock data
    return null;
  }

  /**
   * Update access request
   */
  private async updateAccessRequest(request: JITAccessRequest): Promise<void> {
    // In production, update in database
    logger.info(`Updated access request: ${request.id} - ${request.status}`);
  }

  /**
   * Store session in database
   */
  private async storeSession(session: JITSession): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: `JIT Session Created: ${session.privilege}`,
          userId: session.userId,
          organizationId: session.organizationId,
          hash: crypto.randomBytes(32).toString('hex'),
          details: JSON.stringify({
            sessionId: session.id,
            privilege: session.privilege,
            startTime: session.startTime,
            endTime: session.endTime,
          }),
        },
      });
    } catch (error) {
      logger.error('Error storing session', error);
    }
  }

  /**
   * Update session in database
   */
  private async updateSession(session: JITSession): Promise<void> {
    // In production, update in database
    logger.info(`Updated JIT session: ${session.id}`);
  }

  /**
   * Cleanup on service shutdown
   */
  async shutdown(): Promise<void> {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    // Revoke all active sessions
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.active) {
        await this.revokeSession(sessionId, 'Service shutdown');
      }
    }

    logger.info('JIT Access Service shutdown complete');
  }
}

export default new JITAccessService();
