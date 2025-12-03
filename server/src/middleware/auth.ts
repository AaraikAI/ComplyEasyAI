import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config';
import prisma from '../config/database';
import logger from '../config/logger';
import { User } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: User;
}

/**
 * Authenticate JWT token middleware
 */
export const authenticate = async (
  req: AuthRequest,
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

      req.user = user;
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

/**
 * Authorization middleware (role-based)
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
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
  return jwt.sign(payload, config.jwt.secret, config.jwt.expiresIn);
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwt.refreshSecret, config.jwt.refreshExpiresIn);
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
