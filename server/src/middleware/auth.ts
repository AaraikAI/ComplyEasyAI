import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config';
import prisma from '../config/database';
import logger from '../config/logger';
import monitoring from '../config/monitoring';
import { User, Organization } from '@prisma/client';
import crypto from 'crypto';

export interface AuthUser extends User {
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

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: string;
        email: string;
        role: string;
        organizationId: string;
      };

      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { organization: true },
      });

      if (!user) {
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
      
      next();
    } catch (error) {
      logger.error('Token verification failed', error);
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
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as { userId: string };
    return decoded.userId;
  } catch (error) {
    logger.error('Refresh token verification failed', error);
    return null;
  }
};
