import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';
import emailService from '../services/emailService';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';

class AuthController {
  async requestMagicLink(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError('Email is required', 400);
      }

      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true },
      });

      // If user doesn't exist, create a new one (auto-registration)
      if (!user) {
        // Create organization
        const organization = await prisma.organization.create({
          data: {
            name: `${email.split('@')[0]}'s Organization`,
            plan: 'Basic',
          },
        });

        // Create user
        user = await prisma.user.create({
          data: {
            email,
            name: email.split('@')[0],
            role: 'admin', // First user is admin
            organizationId: organization.id,
          },
          include: { organization: true },
        });

        logger.info(`New user registered: ${email}`);
      }

      // Generate magic link token
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store magic link token
      await prisma.magicLink.create({
        data: {
          email,
          token,
          expiresAt,
        },
      });

      // Send magic link email
      await emailService.sendMagicLink(email, token);

      // In development, also return the token for testing (remove in production!)
      const response: any = {
        message: 'Magic link sent to your email',
        email,
      };

      // Only return token in development mode for testing
      if (process.env.NODE_ENV === 'development') {
        response.devToken = token;
        response.devMessage = 'Development mode: Use this token to verify the magic link';
      }

      res.json(response);
    } catch (error) {
      logger.error('Request magic link error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send magic link', 500);
    }
  }

  async verifyMagicLink(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        throw new AppError('Token is required', 400);
      }

      // Find and validate magic link
      const magicLink = await prisma.magicLink.findUnique({
        where: { token },
      });

      if (!magicLink || magicLink.used) {
        throw new AppError('Invalid or expired token', 401);
      }

      if (new Date() > magicLink.expiresAt) {
        throw new AppError('Token has expired', 401);
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { email: magicLink.email },
        include: { organization: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Mark magic link as used
      await prisma.magicLink.update({
        where: { token },
        data: { used: true },
      });

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // Return pending 2FA response
        res.json({
          twoFactorRequired: true,
          userId: user.id,
          message: 'Two-factor authentication required',
        });
        return;
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Generate JWT tokens
      const accessToken = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      });

      const refreshToken = generateRefreshToken(user.id);

      // Log authentication
      await prisma.auditLog.create({
        data: {
          action: 'User Login',
          userId: user.id,
          organizationId: user.organizationId,
          hash: uuidv4(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json({
        twoFactorRequired: false,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          organization: {
            id: user.organization.id,
            name: user.organization.name,
            plan: user.organization.plan,
          },
        },
      });

      logger.info(`User logged in: ${user.email}`);
    } catch (error) {
      logger.error('Verify magic link error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to verify token', 500);
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      const userId = verifyRefreshToken(refreshToken);

      if (!userId) {
        throw new AppError('Invalid refresh token', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate new access token
      const accessToken = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      });

      res.json({ accessToken });
    } catch (error) {
      logger.error('Refresh token error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to refresh token', 500);
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, name, organizationName } = req.body;

      if (!email || !name) {
        throw new AppError('Email and name are required', 400);
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new AppError('User already exists', 409);
      }

      // Create organization
      const organization = await prisma.organization.create({
        data: {
          name: organizationName || `${name}'s Organization`,
          plan: 'Basic',
        },
      });

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          role: 'admin',
          organizationId: organization.id,
        },
      });

      // Send welcome email
      await emailService.sendWelcomeEmail(email, name);

      // Generate magic link for instant login
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.magicLink.create({
        data: {
          email,
          token,
          expiresAt,
        },
      });

      // Send magic link
      await emailService.sendMagicLink(email, token);

      res.status(201).json({
        message: 'Registration successful. Check your email for login link.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });

      logger.info(`New user registered: ${email}`);
    } catch (error) {
      logger.error('Registration error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to register user', 500);
    }
  }

  async completeTwoFactorLogin(req: Request, res: Response): Promise<void> {
    try {
      const { userId, token } = req.body;

      if (!userId || !token) {
        throw new AppError('User ID and 2FA token are required', 400);
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.twoFactorEnabled) {
        throw new AppError('2FA is not enabled for this user', 400);
      }

      // Verify 2FA token (either TOTP or backup code)
      const twoFactorService = (await import('../services/twoFactorService')).default;
      const isValidToken = await twoFactorService.verifyTwoFactorToken(userId, token);
      const isValidBackup = !isValidToken
        ? await twoFactorService.verifyBackupCode(userId, token)
        : false;

      if (!isValidToken && !isValidBackup) {
        throw new AppError('Invalid authentication code', 401);
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Generate JWT tokens
      const accessToken = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      });

      const refreshToken = generateRefreshToken(user.id);

      // Log authentication
      await prisma.auditLog.create({
        data: {
          action: '2FA Login Success',
          userId: user.id,
          organizationId: user.organizationId,
          hash: uuidv4(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          organization: {
            id: user.organization.id,
            name: user.organization.name,
            plan: user.organization.plan,
          },
        },
      });

      logger.info(`User completed 2FA login: ${user.email}`);
    } catch (error) {
      logger.error('Complete 2FA login error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to complete 2FA login', 500);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      // In a more complex setup, you might invalidate the refresh token here
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error', error);
      throw new AppError('Failed to logout', 500);
    }
  }
}

export default new AuthController();
