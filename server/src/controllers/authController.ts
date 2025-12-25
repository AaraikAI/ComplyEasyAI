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
      try {
        const emailSent = await emailService.sendMagicLink(email, token);
        if (!emailSent) {
          logger.warn(`Failed to send magic link email to ${email}, but continuing with token generation`);
          // In development, we still return the token even if email fails
        }
      } catch (error: any) {
        logger.error(`Failed to send magic link email to ${email}:`, error.message);
        // In development mode, we still return the token for testing
        if (process.env.NODE_ENV !== 'development') {
          throw new AppError(`Failed to send email: ${error.message}`, 500);
        }
      }

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

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true },
      });

      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if user has a password set
      if (!user.passwordHash) {
        throw new AppError('Password not set. Please use magic link login or set a password first.', 401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled && !user.twoFactorVerified) {
        // Return user ID for 2FA verification
        res.json({
          requires2FA: true,
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
          action: 'Password Login Success',
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
          },
        },
      });
    } catch (error) {
      logger.error('Login error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to login', 500);
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, name, organizationName, password } = req.body;

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

      // Hash password if provided
      const passwordHash = password ? await bcrypt.hash(password, 10) : null;

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          role: 'admin',
          organizationId: organization.id,
          passwordHash,
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

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as any;
      const userId = authReq.user!.id;
      const organizationId = authReq.user!.organizationId;
      const { name, email } = req.body;

      if (!name || name.trim().length === 0) {
        throw new AppError('Name is required', 400);
      }

      if (name.length > 100) {
        throw new AppError('Name is too long. Maximum 100 characters.', 400);
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        throw new AppError('Invalid email format', 400);
      }

      // Check for duplicate email (if changed)
      const currentUser = await prisma.user.findUnique({ where: { id: userId } });
      const emailChanged = email !== currentUser?.email;
      
      if (emailChanged) {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          throw new AppError('Email already in use', 409);
        }
      }

      // If email changed, send confirmation emails
      if (emailChanged && currentUser?.email) {
        try {
          const emailService = (await import('../services/emailService')).default;
          
          // Send email to old address
          await emailService.sendEmail(
            currentUser.email,
            'Email Change Notification',
            `Your email address for ComplyEasy AI has been changed from ${currentUser.email} to ${email}. If you did not make this change, please contact support immediately.`
          );
          
          // Send confirmation email to new address
          await emailService.sendEmail(
            email,
            'Email Change Confirmation',
            `Your email address for ComplyEasy AI has been successfully changed to ${email}. Please verify this is correct.`
          );
        } catch (emailError) {
          logger.warn('Failed to send email confirmation, but profile was updated', emailError);
          // Continue with update even if email fails
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: name.trim(),
          email: email.trim(),
          emailVerified: emailChanged ? false : currentUser?.emailVerified, // Reset verification if email changed
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          organizationId: true,
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: emailChanged ? `Profile Updated - Email Changed from ${currentUser?.email} to ${email}` : 'Profile Updated',
          details: `Name: ${name}, Email: ${email}`,
          userId,
          organizationId,
          hash: uuidv4(),
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'] || undefined,
        },
      });

      res.json(updatedUser);
      logger.info(`User profile updated: ${userId}`);
    } catch (error) {
      logger.error('Update profile error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update profile', 500);
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as any;
      const userId = authReq.user!.id;
      const organizationId = authReq.user!.organizationId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new AppError('Current password and new password are required', 400);
      }

      if (newPassword.length < 8) {
        throw new AppError('New password must be at least 8 characters', 400);
      }

      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true, twoFactorEnabled: true },
      });

      if (!user || !user.passwordHash) {
        throw new AppError('Password change not available for this account', 400);
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new AppError('Current password is incorrect', 401);
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: 'Password Changed',
          userId,
          organizationId,
          hash: uuidv4(),
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'] || undefined,
        },
      });

      res.json({ message: 'Password changed successfully' });
      logger.info(`Password changed for user: ${userId}`);
    } catch (error) {
      logger.error('Change password error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to change password', 500);
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
