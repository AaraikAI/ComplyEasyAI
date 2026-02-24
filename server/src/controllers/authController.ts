import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';
import emailService from '../services/emailService';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';
import tokenBlacklist from '../services/tokenBlacklistService';

// Cookie configuration for httpOnly secure token storage
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  // Access token cookie — shorter max-age aligned with JWT expiry (default 7d)
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  // Refresh token cookie — longer max-age aligned with refresh JWT expiry (default 30d)
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...COOKIE_OPTIONS });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { ...COOKIE_OPTIONS });
}

class AuthController {
  async requestMagicLink(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError('Email is required', 400);
      }

      // Check if user exists
      // Select only needed organization fields to avoid schema mismatch issues
      // Excluding plan field to avoid enum mismatch (database may have 'Pro' which isn't in enum)
      let user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          organizationId: true,
          twoFactorEnabled: true,
          organization: {
            select: {
              id: true,
              name: true,
              // plan: true, // Excluded to avoid enum mismatch with 'Pro' value
            },
          },
        },
      });

      // If user doesn't exist, create a new one (auto-registration)
      if (!user) {
        // Create organization
        const organization = await prisma.organization.create({
          data: {
            name: `${email.split('@')[0]}'s Organization`,
            plan: 'Foundation',
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
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatar: true,
            organizationId: true,
            twoFactorEnabled: true,
            organization: {
              select: {
                id: true,
                name: true,
                plan: true,
              },
            },
          },
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

      const response: any = {
        message: 'Magic link sent to your email',
        email,
      };

      // Log token to server console only in development (never include in response)
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`[DEV] Magic link token for ${response.email || 'user'}: ${token}`);
      }

      res.json(response);
    } catch (error: any) {
      logger.error('Request magic link error', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        meta: error?.meta,
        email: req.body?.email,
      });
      if (error instanceof AppError) throw error;
      
      // Provide more specific error message
      let errorMessage = 'Failed to send magic link';
      if (error?.code === 'P2002') {
        errorMessage = 'A magic link was already sent recently. Please check your email or wait a few minutes.';
      } else if (error?.code === 'P2003') {
        errorMessage = 'Database constraint error. Please contact support.';
      } else if (error?.message) {
        errorMessage = `Failed to send magic link: ${error.message}`;
      }
      
      throw new AppError(errorMessage, 500);
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
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          organizationId: true,
          twoFactorEnabled: true,
          organization: {
            select: {
              id: true,
              name: true,
              plan: true,
            },
          },
        },
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

      // Generate JWT tokens first (critical path)
      const accessToken = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      });

      const refreshToken = generateRefreshToken(user.id);

      // Update last login (non-blocking - login succeeds even if this fails)
      try {
        await prisma.$executeRaw`UPDATE "User" SET "lastLogin" = NOW() WHERE id = ${user.id}`;
      } catch (updateErr: any) {
        logger.warn('Failed to update lastLogin, continuing with login', updateErr?.message);
      }

      // Log authentication (non-blocking)
      try {
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
      } catch (auditErr: any) {
        logger.warn('Failed to create audit log, continuing with login', auditErr?.message);
      }

      // Set httpOnly secure cookies for token storage
      setAuthCookies(res, accessToken, refreshToken);

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
      // Accept refresh token from body (legacy) or httpOnly cookie
      const refreshToken = req.body.refreshToken || req.cookies?.refresh_token;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      // Check if the refresh token has been revoked
      const isRevoked = await tokenBlacklist.isRevoked(refreshToken);
      if (isRevoked) {
        throw new AppError('Refresh token has been revoked', 401);
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

      // Blacklist the old refresh token (rotation)
      await tokenBlacklist.revoke(refreshToken, 'token_rotation');

      // Generate new tokens
      const accessToken = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      });

      const newRefreshToken = generateRefreshToken(user.id);

      // Set httpOnly secure cookies for new tokens
      setAuthCookies(res, accessToken, newRefreshToken);

      res.json({ accessToken, refreshToken: newRefreshToken });
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
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          organizationId: true,
          passwordHash: true,
          twoFactorEnabled: true,
          twoFactorVerified: true,
          organization: {
            select: {
              id: true,
              name: true,
              plan: true,
            },
          },
        },
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

      // Update last login (non-blocking on failure)
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });
      } catch (err: any) {
        logger.warn('[Auth] Failed to update lastLogin', err?.message);
      }

      // Generate JWT tokens
      const accessToken = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      });

      const refreshToken = generateRefreshToken(user.id);

      // Create session with session management (ENHANCED) — non-blocking
      let sessionInfo: { existingSessionsTerminated?: number } = {};
      try {
        const sessionManagement = await import('../services/sessionManagementService');
        if (sessionManagement.default) {
          const result = await sessionManagement.default.createSession(
            user.id,
            user.organizationId,
            accessToken,
            refreshToken,
            {
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
              deviceInfo: this.extractDeviceInfo(req.headers['user-agent'] || ''),
            }
          );
          sessionInfo = { existingSessionsTerminated: result.existingSessionsTerminated };
        }
      } catch (error: any) {
        logger.warn('[Auth] Session management not available, continuing without it', error?.message);
      }

      // Log authentication — non-blocking so login still succeeds if audit fails
      try {
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
      } catch (auditErr: any) {
        logger.warn('[Auth] Failed to write audit log', auditErr?.message);
      }

      // Set httpOnly secure cookies for token storage
      setAuthCookies(res, accessToken, refreshToken);

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
        ...sessionInfo, // Include session info if sessions were terminated
      });
    } catch (error: any) {
      logger.error('Login error', error);
      if (error instanceof AppError) throw error;
      const message = error?.message || 'Failed to login';
      throw new AppError(message, 500);
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { 
        email, 
        name, 
        organizationName, 
        password,
        industry,
        companySize,
        primaryComplianceGoal,
        howDidYouHear
      } = req.body;

      if (!email || !name) {
        throw new AppError('Email and name are required', 400);
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
              plan: true,
            },
          },
        },
      });

      if (existingUser) {
        // User already exists - send them a magic link instead of error
        logger.info(`User ${email} already exists, sending magic link for login`);
        
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
          }
        } catch (error: any) {
          logger.error(`Failed to send magic link email to ${email}:`, error.message);
          if (process.env.NODE_ENV !== 'development') {
            throw new AppError(`Failed to send email: ${error.message}`, 500);
          }
        }

        // In development, also return the token for testing
        const response: any = {
          message: 'An account with this email already exists. A magic link has been sent to your email for login.',
          email,
          existingUser: true,
        };

        // Log token in development mode for testing (never expose in HTTP response)
        if (process.env.NODE_ENV === 'development') {
          logger.debug(`[Dev] Magic link token for existing user ${email}: ${token}`);
        }

        res.status(200).json(response);
        return;
      }

      // Create organization with signup details
      const organization = await prisma.organization.create({
        data: {
          name: organizationName || `${name}'s Organization`,
          plan: 'Foundation',
          industry: industry || null,
          companySize: companySize || null,
          primaryComplianceGoal: primaryComplianceGoal || null,
          howDidYouHear: howDidYouHear || null,
          onboardingCompleted: false,
          onboardingStep: 0,
        },
      });

      // Hash password if provided
      const passwordHash = password ? await bcrypt.hash(password, 12) : null;

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

      // Generate magic link for instant login (create before sending so we can return token even if email fails)
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.magicLink.create({
        data: {
          email,
          token,
          expiresAt,
        },
      });

      // Send welcome email and magic link; in development allow registration to succeed if email is not configured
      try {
        await emailService.sendWelcomeEmail(email, name);
        await emailService.sendMagicLink(email, token);
      } catch (emailError: any) {
        logger.warn('Registration: email send failed', { email, error: emailError?.message });
        if (process.env.NODE_ENV !== 'development') {
          throw new AppError('Failed to send welcome email. Please try again or contact support.', 500);
        }
      }

      const response: any = {
        message: 'Registration successful. Check your email for login link.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };

      // Log token to server console only in development (never include in response)
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`[DEV] Magic link token for ${response.email || 'user'}: ${token}`);
      }

      res.status(201).json(response);

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
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          organizationId: true,
          twoFactorEnabled: true,
          organization: {
            select: {
              id: true,
              name: true,
              plan: true,
            },
          },
        },
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

      // Set httpOnly secure cookies for token storage
      setAuthCookies(res, accessToken, refreshToken);

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
          await emailService.sendEmail({
            to: currentUser.email,
            subject: 'Email Change Notification',
            html: `Your email address for ComplyEasy AI has been changed from ${currentUser.email} to ${email}. If you did not make this change, please contact support immediately.`,
          });
          
          // Send confirmation email to new address
          await emailService.sendEmail({
            to: email,
            subject: 'Email Change Confirmation',
            html: `Your email address for ComplyEasy AI has been successfully changed to ${email}. Please verify this is correct.`,
          });
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
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

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

  async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as any;
      const userId = authReq.user!.id;
      const organizationId = authReq.user!.organizationId;

      // File should be in req.file (from multer middleware)
      const file = (req as any).file;
      if (!file) {
        throw new AppError('No file uploaded', 400);
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new AppError('Invalid file type. Only JPG, PNG, and GIF are allowed.', 400);
      }

      // Validate file size (max 1MB)
      if (file.size > 1024 * 1024) {
        throw new AppError('File size must be less than 1MB', 400);
      }

      // Upload to S3
      const s3Service = (await import('../services/s3Service')).default;
      const uploadResult = await s3Service.uploadFile({
        file,
        userId,
        organizationId,
        folder: 'avatars',
      });

      // Update user with avatar URL
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatar: uploadResult.url },
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
          action: 'Avatar Uploaded',
          userId,
          organizationId,
          hash: uuidv4(),
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'] || undefined,
        },
      });

      res.json({ user: updatedUser, avatarUrl: uploadResult.url });
      logger.info(`Avatar uploaded for user: ${userId}`);
    } catch (error) {
      logger.error('Upload avatar error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to upload avatar', 500);
    }
  }

  /**
   * Extract device info from user agent
   */
  private extractDeviceInfo(userAgent: string): { type: string; os: string; browser: string } {
    const ua = userAgent.toLowerCase();
    
    // Detect device type
    let type = 'desktop';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      type = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      type = 'tablet';
    }

    // Detect OS
    let os = 'unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    // Detect browser
    let browser = 'unknown';
    if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('edg')) browser = 'Edge';
    else if (ua.includes('opera')) browser = 'Opera';

    return { type, os, browser };
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Read access token from header or httpOnly cookie
      const accessToken = req.headers.authorization?.substring(7) || req.cookies?.access_token;

      // Blacklist the access token so it cannot be reused
      if (accessToken) {
        await tokenBlacklist.revoke(accessToken, 'logout');
      }

      // Blacklist the refresh token from body or httpOnly cookie
      const refreshToken = req.body?.refreshToken || req.cookies?.refresh_token;
      if (refreshToken) {
        await tokenBlacklist.revoke(refreshToken, 'logout');
      }

      // Terminate session if session management is enabled
      try {
        const authReq = req as any;
        if (authReq.user) {
          const sessionManagement = await import('../services/sessionManagementService');
          if (sessionManagement.default) {
            if (accessToken) {
              const sessionId = require('crypto').createHash('sha256').update(accessToken).digest('hex');
              await sessionManagement.default.terminateSession(sessionId, 'logout');
            }
          }
        }
      } catch (error) {
        logger.warn('[Auth] Session termination not available', error);
      }

      // Clear httpOnly auth cookies
      clearAuthCookies(res);

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error', error);
      throw new AppError('Failed to logout', 500);
    }
  }
}

export default new AuthController();
