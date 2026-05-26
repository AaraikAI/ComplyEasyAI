/**
 * Just-In-Time (JIT) Admin Access Service
 * Temporary privilege escalation with time-based access control
 * Implements zero standing privileges principle
 */

import crypto from 'crypto';
import logger from '../../config/logger';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

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
  // In-memory session store — sessions are lost on server restart.
  // For production deployments with persistence requirements,
  // sessions should be stored in Redis or PostgreSQL.
  private activeSessions: Map<string, JITSession> = new Map();
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    logger.warn('[JITAccess] Service initialized — in-memory session store cleared on restart. ' +
      'Any previously active JIT sessions have been invalidated.');
    this.startSessionMonitoring();
  }

  /**
   * Returns the number of currently active JIT sessions (for monitoring).
   */
  getActiveSessionCount(): number {
    return this.activeSessions.size;
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

      if (!policy) {
        throw new AppError(`No access policy found for privilege level: ${privilege}`, 404);
      }

      if (!policy.allowedReasons.includes(reason)) {
        throw new AppError(`Reason '${reason}' not allowed for privilege '${privilege}'. Allowed reasons: ${policy.allowedReasons.join(', ')}`, 400);
      }

      if (durationMinutes > policy.maxDuration) {
        throw new AppError(`Duration ${durationMinutes} minutes exceeds maximum of ${policy.maxDuration} minutes for privilege '${privilege}'`, 400);
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
    } catch (error: any) {
      logger.error('Error requesting JIT access', {
        error: error.message || error,
        stack: error.stack,
        userId,
        privilege,
        reason,
      });
      throw new AppError(error.message || 'JIT access request failed', 500);
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
        throw new AppError('Access request not found', 404);
      }

      if (request.status !== 'pending') {
        throw new AppError('Access request is not pending', 400);
      }

      // Verify approver has sufficient privileges
      const approver = await prisma.user.findUnique({
        where: { id: approverId },
      });

      if (!approver || approver.role !== 'admin') {
        throw new AppError('Insufficient privileges to approve request', 403);
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
      throw new AppError('JIT access approval failed', 500);
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
        throw new AppError('Access request not found', 404);
      }

      if (request.status !== 'pending') {
        throw new AppError('Access request is not pending', 400);
      }

      // Verify approver has sufficient privileges
      const approver = await prisma.user.findUnique({
        where: { id: approverId },
      });

      if (!approver || approver.role !== 'admin') {
        throw new AppError('Insufficient privileges to deny request', 403);
      }

      request.status = 'denied';
      request.approvedBy = approverId;
      await this.updateAccessRequest(request);

      // Store denial reason in audit log
      await prisma.auditLog.create({
        data: {
          action: `JIT Access Request Denied: ${request.requestedPrivilege}`,
          userId: request.userId,
          organizationId: request.organizationId,
          hash: crypto.randomBytes(32).toString('hex'),
          details: JSON.stringify({
            requestId: request.id,
            deniedBy: approverId,
            denialReason: reason,
            timestamp: new Date(),
          }),
        },
      });

      logger.info(`JIT access denied: ${request.userId} -> ${request.requestedPrivilege} by ${approverId} (reason: ${reason})`);
    } catch (error) {
      logger.error('Error denying JIT access', error);
      throw new AppError('JIT access denial failed', 500);
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

      // Grant temporary privilege to user — scoped to request.organizationId
      await this.grantTemporaryPrivilege(request.userId, request.requestedPrivilege, request.organizationId);

      // Store session in database
      await this.storeSession(session);

      logger.info(`[JITAccess] Session created: ${sessionId} for user=${request.userId} ` +
        `privilege=${request.requestedPrivilege} org=${request.organizationId} ` +
        `expires=${endTime.toISOString()} activeSessions=${this.activeSessions.size}`);

      return session;
    } catch (error) {
      logger.error('Error creating JIT session', error);
      throw new AppError('JIT session creation failed', 500);
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
        throw new AppError('Session not found or inactive', 404);
      }

      // Get policy
      const policy = await this.getAccessPolicy(session.privilege);
      const currentDuration = Math.floor(
        (session.endTime.getTime() - session.startTime.getTime()) / (60 * 1000)
      );

      if (currentDuration + additionalMinutes > policy.maxDuration) {
        throw new AppError('Extension would exceed maximum duration', 400);
      }

      // Extend session
      session.endTime = new Date(session.endTime.getTime() + additionalMinutes * 60 * 1000);
      session.extendedCount += 1;

      await this.updateSession(session);

      logger.info(`JIT session extended: ${sessionId} (+${additionalMinutes}min)`);

      return session;
    } catch (error) {
      logger.error('Error extending JIT session', error);
      throw new AppError('JIT session extension failed', 500);
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
        throw new AppError('Session not found', 404);
      }

      // Revoke privilege immediately — scoped to session.organizationId
      await this.revokeTemporaryPrivilege(session.userId, session.privilege, session.organizationId);

      session.active = false;
      session.endTime = new Date();

      await this.updateSession(session);
      this.activeSessions.delete(sessionId);

      logger.info(`[JITAccess] Session revoked: ${sessionId} user=${session.userId} ` +
        `privilege=${session.privilege} reason=${reason} activeSessions=${this.activeSessions.size}`);
    } catch (error) {
      logger.error('Error revoking JIT session', error);
      throw new AppError('JIT session revocation failed', 500);
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
        throw new AppError('Session not found or inactive', 404);
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
   * Get all pending access requests for an organization (admin only)
   */
  async getPendingAccessRequests(organizationId: string): Promise<JITAccessRequest[]> {
    try {
      const pendingRequests: JITAccessRequest[] = [];
      
      // Get all pending requests from audit logs
      const logs = await prisma.auditLog.findMany({
        where: {
          organizationId,
          action: {
            startsWith: 'JIT Access Request:',
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 1000, // Get a large number to find all requests
      });

      // Group logs by requestId to find the latest status for each request
      const requestMap = new Map<string, any>();

      for (const log of logs) {
        try {
          const details = JSON.parse(log.details || '{}');
          const requestId = details.requestId || log.id;
          
          // Only process if we haven't seen a more recent entry for this request
          if (!requestMap.has(requestId) || log.timestamp > requestMap.get(requestId).timestamp) {
            let status = details.status || 'pending';
            
            // Check if request has expired
            if (details.expiresAt) {
              const expiresAt = new Date(details.expiresAt);
              if (expiresAt < new Date() && (status === 'approved' || status === 'pending')) {
                status = 'expired';
              }
            }
            
            requestMap.set(requestId, {
              id: requestId,
              userId: log.userId || '',
              organizationId: log.organizationId || organizationId,
              requestedPrivilege: details.privilege || 'admin',
              reason: details.reason || 'incident_response',
              justification: details.justification || '',
              duration: details.duration || 30,
              status: status,
              createdAt: log.timestamp,
              approvedAt: details.approvedAt ? new Date(details.approvedAt) : undefined,
              expiresAt: details.expiresAt ? new Date(details.expiresAt) : undefined,
              approvedBy: details.approvedBy,
              timestamp: log.timestamp,
            });
          }
        } catch (parseError) {
          // Skip invalid log entries
          continue;
        }
      }

      // Get updated statuses from update logs
      const updateLogs = await prisma.auditLog.findMany({
        where: {
          organizationId,
          action: {
            startsWith: 'JIT Access Request Updated:',
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 1000,
      });

      for (const log of updateLogs) {
        try {
          const details = JSON.parse(log.details || '{}');
          const requestId = details.requestId;
          
          if (requestId && requestMap.has(requestId)) {
            const existing = requestMap.get(requestId);
            // Update if this is a more recent entry
            if (log.timestamp > existing.timestamp) {
              existing.status = details.status || existing.status;
              existing.approvedBy = details.approvedBy || existing.approvedBy;
              existing.approvedAt = details.approvedAt ? new Date(details.approvedAt) : existing.approvedAt;
              existing.expiresAt = details.expiresAt ? new Date(details.expiresAt) : existing.expiresAt;
              existing.timestamp = log.timestamp;
            }
          }
        } catch (parseError) {
          continue;
        }
      }

      // Filter to only pending requests and convert to array
      for (const requestData of requestMap.values()) {
        if (requestData.status === 'pending') {
          // Check if it hasn't expired
          if (!requestData.expiresAt || requestData.expiresAt > new Date()) {
            const request: JITAccessRequest = {
              id: requestData.id,
              userId: requestData.userId,
              organizationId: requestData.organizationId,
              requestedPrivilege: requestData.requestedPrivilege,
              reason: requestData.reason,
              justification: requestData.justification,
              duration: requestData.duration,
              status: requestData.status,
              createdAt: requestData.createdAt,
              approvedAt: requestData.approvedAt,
              expiresAt: requestData.expiresAt,
              approvedBy: requestData.approvedBy,
            };
            pendingRequests.push(request);
          }
        }
      }

      // Sort by creation time (newest first)
      pendingRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return pendingRequests;
    } catch (error) {
      logger.error('Error fetching pending access requests', error);
      throw error;
    }
  }

  /**
   * Get all access requests for an organization (admin only)
   */
  async getAllAccessRequests(organizationId: string, status?: string): Promise<JITAccessRequest[]> {
    try {
      const allRequests: JITAccessRequest[] = [];
      
      // Get all requests from audit logs
      const logs = await prisma.auditLog.findMany({
        where: {
          organizationId,
          OR: [
            {
              action: {
                startsWith: 'JIT Access Request:',
              },
            },
            {
              action: {
                startsWith: 'JIT Access Request Updated:',
              },
            },
          ],
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 1000,
      });

      // Group logs by requestId to find the latest status for each request
      const requestMap = new Map<string, any>();

      for (const log of logs) {
        try {
          const details = JSON.parse(log.details || '{}');
          const requestId = details.requestId || log.id;
          
          // Only process if we haven't seen a more recent entry for this request
          if (!requestMap.has(requestId) || log.timestamp > requestMap.get(requestId).timestamp) {
            let statusValue = details.status || 'pending';
            
            // Check if request has expired
            if (details.expiresAt) {
              const expiresAt = new Date(details.expiresAt);
              if (expiresAt < new Date() && (statusValue === 'approved' || statusValue === 'pending')) {
                statusValue = 'expired';
              }
            }
            
            requestMap.set(requestId, {
              id: requestId,
              userId: log.userId || '',
              organizationId: log.organizationId || organizationId,
              requestedPrivilege: details.privilege || 'admin',
              reason: details.reason || 'incident_response',
              justification: details.justification || '',
              duration: details.duration || 30,
              status: statusValue,
              createdAt: log.timestamp,
              approvedAt: details.approvedAt ? new Date(details.approvedAt) : undefined,
              expiresAt: details.expiresAt ? new Date(details.expiresAt) : undefined,
              approvedBy: details.approvedBy,
              timestamp: log.timestamp,
            });
          }
        } catch (parseError) {
          continue;
        }
      }

      // Convert to array and filter by status if provided
      for (const requestData of requestMap.values()) {
        if (!status || requestData.status === status) {
          const request: JITAccessRequest = {
            id: requestData.id,
            userId: requestData.userId,
            organizationId: requestData.organizationId,
            requestedPrivilege: requestData.requestedPrivilege,
            reason: requestData.reason,
            justification: requestData.justification,
            duration: requestData.duration,
            status: requestData.status,
            createdAt: requestData.createdAt,
            approvedAt: requestData.approvedAt,
            expiresAt: requestData.expiresAt,
            approvedBy: requestData.approvedBy,
          };
          allRequests.push(request);
        }
      }

      // Sort by creation time (newest first)
      allRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return allRequests;
    } catch (error) {
      logger.error('Error fetching all access requests', error);
      throw error;
    }
  }

  /**
   * Get all user sessions and requests (for display purposes)
   */
  async getUserSessionsAndRequests(userId: string): Promise<Array<JITSession | JITAccessRequest>> {
    const results: Array<JITSession | JITAccessRequest> = [];

    // Get active sessions
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId && session.active) {
        results.push(session);
      }
    }

    // Get pending/approved requests from audit logs
    // We need to get both original requests and updates, then find the latest status for each request
    try {
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId,
          OR: [
            {
              action: {
                startsWith: 'JIT Access Request:',
              },
            },
            {
              action: {
                startsWith: 'JIT Access Request Updated:',
              },
            },
          ],
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 100, // Get more entries to find all requests and their updates
      });

      // Group logs by requestId to find the latest status for each request
      const requestMap = new Map<string, any>();

      for (const log of auditLogs) {
        try {
          const details = JSON.parse(log.details || '{}');
          const requestId = details.requestId || log.id;
          
          // Only process if we haven't seen a more recent entry for this request
          if (!requestMap.has(requestId) || log.timestamp > requestMap.get(requestId).timestamp) {
            let status = details.status || 'pending';
            let expiresAt = details.expiresAt ? new Date(details.expiresAt) : undefined;
            
            // Check if request has expired
            if (expiresAt && expiresAt < new Date() && (status === 'approved' || status === 'pending')) {
              status = 'expired';
              // Update the status in the audit log (async, don't wait)
              this.updateAccessRequestStatus(requestId, 'expired', log.organizationId).catch(err => {
                logger.error('Error updating expired request status', err);
              });
            }
            
            requestMap.set(requestId, {
              id: requestId,
              userId: log.userId || userId,
              organizationId: log.organizationId || '',
              requestedPrivilege: details.privilege || 'admin',
              reason: details.reason || 'incident_response',
              justification: details.justification || '',
              duration: details.duration || 30,
              status: status,
              createdAt: log.timestamp,
              approvedAt: details.approvedAt ? new Date(details.approvedAt) : undefined,
              expiresAt: expiresAt,
              timestamp: log.timestamp,
            });
          }
        } catch (parseError) {
          // Skip invalid log entries
          continue;
        }
      }

      // Convert map values to array and add to results
      for (const requestData of requestMap.values()) {
        const request: JITAccessRequest = {
          id: requestData.id,
          userId: requestData.userId,
          organizationId: requestData.organizationId,
          requestedPrivilege: requestData.requestedPrivilege,
          reason: requestData.reason,
          justification: requestData.justification,
          duration: requestData.duration,
          status: requestData.status,
          createdAt: requestData.createdAt,
          approvedAt: requestData.approvedAt,
          expiresAt: requestData.expiresAt,
        };

        // Only include if not already in active sessions
        const hasActiveSession = results.some(
          (r) => {
            if ('requestId' in r) {
              // This is a session, check if it matches this request
              return (r as JITSession).requestId === request.id;
            }
            return false;
          }
        );

        // Include all requests (pending, approved, expired, revoked) that don't have active sessions
        if (!hasActiveSession) {
          results.push(request);
        }
      }
    } catch (error) {
      logger.error('Error fetching requests from audit logs', error);
    }

    // Sort by creation time (newest first)
    results.sort((a, b) => {
      const aTime = 'createdAt' in a ? a.createdAt.getTime() : ('startTime' in a ? a.startTime.getTime() : 0);
      const bTime = 'createdAt' in b ? b.createdAt.getTime() : ('startTime' in b ? b.startTime.getTime() : 0);
      return bTime - aTime;
    });

    return results;
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

    const policy = policies[privilege];
    if (!policy) {
      logger.error(`No access policy found for privilege level: ${privilege}`);
      throw new AppError(`Invalid privilege level: ${privilege}`, 400);
    }
    return policy;
  }

  /**
   * Grant temporary privilege to user — multi-tenant safe.
   * Verifies the target user belongs to the requesting organizationId before mutation.
   */
  private async grantTemporaryPrivilege(
    userId: string,
    privilege: PrivilegeLevel,
    organizationId: string
  ): Promise<void> {
    try {
      // Multi-tenant guard: ensure target user is in the same org as the access request.
      const targetUser = await prisma.user.findFirst({
        where: { id: userId, organizationId },
        select: { id: true },
      });
      if (!targetUser) {
        throw new AppError('Target user not found in organization', 404);
      }

      // Map PrivilegeLevel to database Role values
      const roleMap: Record<string, string> = {
        viewer: 'viewer',
        editor: 'editor',
        admin: 'admin',
        super_admin: 'admin',
        security_admin: 'security_admin',
        compliance_admin: 'compliance_admin',
      };

      const targetRole = roleMap[privilege] || 'viewer';

      await prisma.user.update({
        where: { id: userId },
        data: { role: targetRole as any },
      });

      logger.info(
        `Granted temporary ${privilege} (role: ${targetRole}) to user ${userId} in org ${organizationId}`
      );
    } catch (error) {
      logger.error(
        `Failed to grant temporary ${privilege} to user ${userId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Revoke temporary privilege from user — multi-tenant safe.
   * Verifies the target user belongs to the session's organizationId before mutation.
   */
  private async revokeTemporaryPrivilege(
    userId: string,
    privilege: PrivilegeLevel,
    organizationId: string
  ): Promise<void> {
    try {
      // Multi-tenant guard: ensure target user is in the same org as the session.
      const targetUser = await prisma.user.findFirst({
        where: { id: userId, organizationId },
        select: { id: true },
      });
      if (!targetUser) {
        throw new AppError('Target user not found in organization', 404);
      }

      // Revert to default base role
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'viewer' as any },
      });

      logger.info(
        `Revoked temporary ${privilege} from user ${userId} in org ${organizationId}, reverted to base role`
      );
    } catch (error) {
      logger.error(
        `Failed to revoke temporary ${privilege} from user ${userId}`,
        error
      );
      throw error;
    }
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
   * Get access request by ID (finds the most recent entry including updates)
   */
  private async getAccessRequest(requestId: string): Promise<JITAccessRequest | null> {
    try {
      // Search for both original requests and updates
      const logs = await prisma.auditLog.findMany({
        where: {
          OR: [
            {
              action: {
                startsWith: 'JIT Access Request:',
              },
            },
            {
              action: {
                startsWith: 'JIT Access Request Updated:',
              },
            },
          ],
          details: {
            contains: requestId,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 10, // Get recent entries to find the latest status
      });

      if (logs.length === 0) return null;

      // Find the log entry with the matching requestId
      for (const log of logs) {
        try {
          const details = JSON.parse(log.details || '{}');
          if (details.requestId === requestId) {
            return {
              id: details.requestId || log.id,
              userId: log.userId || '',
              organizationId: log.organizationId || '',
              requestedPrivilege: details.privilege || 'admin',
              reason: details.reason || 'incident_response',
              justification: details.justification || '',
              duration: details.duration || 30,
              status: details.status || 'pending',
              createdAt: log.timestamp,
              approvedAt: details.approvedAt ? new Date(details.approvedAt) : undefined,
              expiresAt: details.expiresAt ? new Date(details.expiresAt) : undefined,
              approvedBy: details.approvedBy,
            };
          }
        } catch (parseError) {
          continue;
        }
      }

      return null;
    } catch (error) {
      logger.error('Error getting access request', error);
      return null;
    }
  }

  /**
   * Update access request
   */
  private async updateAccessRequest(request: JITAccessRequest): Promise<void> {
    try {
      // Get the original request to preserve all original data if needed
      const originalRequest = await this.getAccessRequest(request.id);
      
      // Use original request data if available, otherwise use the passed request
      const baseRequest = originalRequest || request;

      // Update the details with new status and other fields
      const updatedDetails = {
        requestId: request.id,
        privilege: request.requestedPrivilege,
        reason: request.reason,
        justification: request.justification,
        duration: request.duration,
        status: request.status,
        approvedBy: request.approvedBy || baseRequest.approvedBy,
        approvedAt: request.approvedAt ? request.approvedAt.toISOString() : (baseRequest.approvedAt ? baseRequest.approvedAt.toISOString() : undefined),
        expiresAt: request.expiresAt ? request.expiresAt.toISOString() : (baseRequest.expiresAt ? baseRequest.expiresAt.toISOString() : undefined),
      };

      // Create a new audit log entry for the update
      await prisma.auditLog.create({
        data: {
          action: `JIT Access Request Updated: ${request.requestedPrivilege}`,
          userId: request.userId,
          organizationId: request.organizationId,
          hash: crypto.randomBytes(32).toString('hex'),
          details: JSON.stringify(updatedDetails),
        },
      });

      logger.info(`Updated access request: ${request.id} - ${request.status}`);
    } catch (error) {
      logger.error('Error updating access request', error);
      throw error;
    }
  }

  /**
   * Update access request status only
   */
  private async updateAccessRequestStatus(requestId: string, status: string, organizationId: string): Promise<void> {
    try {
      const request = await this.getAccessRequest(requestId);
      if (request) {
        request.status = status as any;
        await this.updateAccessRequest(request);
      }
    } catch (error) {
      logger.error('Error updating access request status', error);
    }
  }

  /**
   * Cancel access request
   */
  async cancelAccessRequest(requestId: string, userId: string): Promise<void> {
    try {
      const request = await this.getAccessRequest(requestId);
      if (!request) {
        throw new AppError('Access request not found', 404);
      }

      if (request.userId !== userId) {
        throw new AppError('Unauthorized to cancel this request', 403);
      }

      if (request.status !== 'pending') {
        throw new AppError(`Cannot cancel request with status: ${request.status}`, 400);
      }

      request.status = 'revoked';
      await this.updateAccessRequest(request);

      logger.info(`JIT access request cancelled: ${requestId} by ${userId}`);
    } catch (error) {
      logger.error('Error cancelling access request', error);
      throw error;
    }
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
    try {
      await prisma.auditLog.create({
        data: {
          action: `JIT Access Session Updated: ${session.privilege}`,
          userId: session.userId,
          organizationId: session.organizationId,
          hash: crypto.randomBytes(32).toString('hex'),
          details: JSON.stringify({
            sessionId: session.id,
            userId: session.userId,
            privilege: session.privilege,
            status: session.active ? 'active' : 'inactive',
            startTime: session.startTime,
            endTime: session.endTime,
          }),
        },
      });

      logger.info(`Updated JIT session: ${session.id}`);
    } catch (error) {
      logger.error(`Failed to update JIT session: ${session.id}`, error);
    }
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
