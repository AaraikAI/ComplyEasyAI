import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config';
import prisma from '../config/database';
import logger from '../config/logger';
import monitoring from '../config/monitoring';
import tokenBlacklist from '../services/tokenBlacklistService';
import { User, Organization } from '../generated/prisma/client';
import crypto from 'crypto';
import { logSecurityEvent, SecurityEventType } from '../utils/securityEventLogger';
import { runWithOrg } from '../config/orgContext';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string | null;
  emailVerified: boolean;
  lastLogin?: Date | null;
  employeeId?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  manager?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  active: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string | null;
  twoFactorVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  organization?: Organization;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// Type helper for route handlers
export type AuthRequestHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Authenticate JWT token middleware
 */
const authenticateMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // Extract token from Authorization header (legacy/API clients) or httpOnly cookie
    let token: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      logSecurityEvent({
        type: SecurityEventType.AUTHENTICATION_FAILURE,
        severity: 'low',
        message: 'Request without authentication token',
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
      });
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] }) as {
        userId: string;
        email: string;
        role: string;
        organizationId: string;
      };

      // Check if token has been revoked (individual or user-wide)
      const [revoked, revokedByReset] = await Promise.all([
        tokenBlacklist.isRevoked(token),
        tokenBlacklist.isRevokedByUserReset(token, decoded.userId),
      ]);
      if (revoked || revokedByReset) {
        logSecurityEvent({
          type: SecurityEventType.TOKEN_REVOKED,
          severity: 'high',
          message: `Attempt to use revoked token (${revokedByReset ? 'user-wide reset' : 'individual revocation'})`,
          ip: req.ip,
          method: req.method,
          path: req.originalUrl,
          userId: decoded.userId,
        });
        res.status(401).json({ error: 'Token has been revoked' });
        return;
      }

      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { organization: true },
      });

      if (!user) {
        logSecurityEvent({
          type: SecurityEventType.AUTHENTICATION_FAILURE,
          severity: 'high',
          message: 'Token references non-existent user (possible deleted account or forged token)',
          ip: req.ip,
          method: req.method,
          path: req.originalUrl,
          userId: decoded.userId,
        });
        res.status(401).json({ error: 'User not found' });
        return;
      }

      (req as AuthRequest).user = user;
      
      // Set user context for error tracking
      monitoring.setUserContext(user.id, user.email, user.organizationId);
      
      // Update session activity (if session management is enabled)
      try {
        const sessionManagement = await import('../services/sessionManagementService');
        if (sessionManagement.default) {
          // Extract session ID from token (use token hash as session ID)
          const sessionId = crypto.createHash('sha256').update(token).digest('hex');
          await sessionManagement.default.updateSessionActivity(sessionId);
        }
      } catch (error) {
        // Session management not available, continue without it
        logger.debug('[Auth] Session management not available');
      }

      // Bind the resolved organization to the async context for the rest of
      // this request so every downstream Prisma call can inject it into the
      // database session GUC for row-level security (see config/orgContext.ts
      // and config/database.ts).
      runWithOrg(user.organizationId, () => next());
    } catch (error) {
      logger.error('Token verification failed', error);
      logSecurityEvent({
        type: SecurityEventType.AUTHENTICATION_FAILURE,
        severity: 'high',
        message: 'JWT verification failed (invalid signature, expired, or malformed)',
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
      });
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    logger.error('Authentication error', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Export as RequestHandler for Express compatibility
export const authenticate: RequestHandler = authenticateMiddleware;

/**
 * Authorization middleware (role-based)
 */
export const authorize = (...allowedRoles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      logSecurityEvent({
        type: SecurityEventType.AUTHORIZATION_FAILURE,
        severity: 'high',
        message: `Role "${authReq.user.role}" denied access (required: ${allowedRoles.join(', ')})`,
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
        userId: authReq.user.id,
        userEmail: authReq.user.email,
        organizationId: authReq.user.organizationId,
        details: { userRole: authReq.user.role, allowedRoles },
      });
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const generateToken = (payload: {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}): string => {
  const options: SignOptions = { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, config.jwt.secret, options);
};

export const generateRefreshToken = (userId: string): string => {
  const options: SignOptions = { expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign({ userId }, config.jwt.refreshSecret, options);
};

export const verifyRefreshToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret, { algorithms: ['HS256'] }) as { userId: string };
    return decoded.userId;
  } catch (error) {
    logger.error('Refresh token verification failed', error);
    return null;
  }
};
