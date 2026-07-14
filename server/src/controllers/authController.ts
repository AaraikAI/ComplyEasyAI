import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, verifyPassword, needsRehash } from '../utils/fipsPasswordHashing';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { Prisma } from '../generated/prisma/client';
import config from '../config';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';
import type { VersionedRequest } from '../middleware/apiVersioning';
import emailService from '../services/emailService';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';
import tokenBlacklist from '../services/tokenBlacklistService';
import { logSecurityEvent, SecurityEventType } from '../utils/securityEventLogger';
import { logControllerAction } from '../services/auditLogService';
import DOMPurify from 'isomorphic-dompurify';

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
  // Access token cookie — max-age aligned with JWT expiry (default 15m)
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000, // 15 minutes in ms
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

/**
 * Token fields to merge into an auth response BODY for Bearer/API clients only.
 *
 * The mobile app authenticates via `Authorization: Bearer` (hardcoded to the v2
 * API) and cannot use the httpOnly auth cookies — a React Native `fetch` will not
 * attach a `sameSite:'strict'; secure` cookie — so it reads the JWTs from the
 * response body. Web clients use the unversioned `/api` cookie flow and must NEVER
 * receive tokens in the body: doing so would expose them to page JavaScript and
 * defeat the httpOnly-cookie XSS protection.
 *
 * We therefore include body tokens ONLY when the resolved API version is `v2`
 * (set by apiVersioningMiddleware from the `/api/v2` mount or the `X-API-Version: v2`
 * header). The web `/api/auth` mount does not run that middleware, so `apiVersion`
 * is undefined there and this returns `{}` — cookies remain the sole delivery for web.
 *
 * The access JWT is exposed under both `token` and `accessToken` because the mobile
 * client reads it inconsistently (`data.token` in the auth context, `data.token ??
 * data.accessToken` in the api service); providing both keeps every read path working.
 */
function bearerAuthTokens(req: Request, accessToken: string, refreshToken: string): Record<string, string> {
  if ((req as VersionedRequest).apiVersion !== 'v2') {
    return {};
  }
  return { token: accessToken, accessToken, refreshToken };
}

class AuthController {
  /**
   * Verify CAPTCHA token with the configured provider (hCaptcha or reCAPTCHA).
   * Skipped in development/test to avoid needing CAPTCHA keys locally.
   */
  private async verifyCaptcha(captchaToken: string | undefined, remoteIp: string | undefined): Promise<void> {
    // Skip CAPTCHA verification in development and test environments
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return;
    }

    const captchaSecret = process.env.HCAPTCHA_SECRET || process.env.RECAPTCHA_SECRET;
    if (!captchaSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('CAPTCHA verification unavailable', 503);
      }
      logger.warn('[Auth] No CAPTCHA secret configured (dev mode)');
      return;
    }

    if (!captchaToken) {
      throw new AppError('CAPTCHA verification is required', 400);
    }

    const isHCaptcha = !!process.env.HCAPTCHA_SECRET;
    const verifyUrl = isHCaptcha
      ? 'https://api.hcaptcha.com/siteverify'
      : 'https://www.google.com/recaptcha/api/siteverify';

    try {
      const params = new URLSearchParams({
        secret: captchaSecret,
        response: captchaToken,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      });

      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      const result = await response.json() as { success: boolean; 'error-codes'?: string[] };
      if (!result.success) {
        logger.warn('[Auth] CAPTCHA verification failed', { errors: result['error-codes'] });
        throw new AppError('CAPTCHA verification failed. Please try again.', 400);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('[Auth] CAPTCHA verification service error', error);
      throw new AppError('CAPTCHA verification service unavailable. Please try again later.', 503);
    }
  }

  async requestMagicLink(req: Request, res: Response): Promise<void> {
    try {
      const { email, captchaToken } = req.body;

      if (!email) {
        throw new AppError('Email is required', 400);
      }

      // Verify CAPTCHA for new user registrations (auto-registration via magic link)
      const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!existingUser) {
        await this.verifyCaptcha(captchaToken, req.ip);
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
      // Wrapped in a transaction to ensure org + user are created atomically
      if (!user) {
        user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          // Create organization
          const organization = await tx.organization.create({
            data: {
              name: `${email.split('@')[0]}'s Organization`,
              plan: 'Foundation',
            },
          });

          // Create user
          const newUser = await tx.user.create({
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

          return newUser;
        });

        logger.info('New user registered');
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
          logger.warn('Failed to send magic link email, but continuing with token generation');
          // In development, we still return the token even if email fails
        }
      } catch (error: any) {
        logger.error('Failed to send magic link email', error.message);
        // In development mode, we still return the token for testing
        if (process.env.NODE_ENV !== 'development') {
          throw new AppError(`Failed to send email: ${error.message}`, 500);
        }
      }

      const response: any = {
        message: 'Magic link sent to your email',
        email,
      };

      // In development mode, include the token in response for testing
      // This allows the "Simulate Click" button to work without checking emails
      if (process.env.NODE_ENV === 'development') {
        response.devToken = token;
      }

      res.json(response);
    } catch (error: any) {
      logger.error('Request magic link error', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        meta: error?.meta,
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
        logSecurityEvent({
          type: SecurityEventType.AUTHENTICATION_FAILURE,
          severity: 'medium',
          message: `Magic link verification failed (${!magicLink ? 'not found' : 'already used'})`,
          ip: req.ip,
          method: req.method,
          path: req.originalUrl,
        });
        throw new AppError('Invalid or expired token', 401);
      }

      if (new Date() > magicLink.expiresAt) {
        logSecurityEvent({
          type: SecurityEventType.TOKEN_EXPIRED,
          severity: 'low',
          message: 'Magic link token expired',
          ip: req.ip,
          method: req.method,
          path: req.originalUrl,
        });
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
        // Issue a short-lived signed JWT encoding the userId for the 2FA step
        const twoFactorToken = jwt.sign(
          { userId: user.id, purpose: '2fa_pending' },
          config.jwt.secret,
          { expiresIn: '5m' }
        );
        res.json({
          twoFactorRequired: true,
          twoFactorToken,
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
        ...bearerAuthTokens(req, accessToken, refreshToken), // v2/Bearer clients only
      });

      logSecurityEvent({
        type: SecurityEventType.AUTHENTICATION_SUCCESS,
        severity: 'low',
        message: 'Magic link login successful',
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
        userId: user.id,
        userEmail: user.email,
        organizationId: user.organizationId,
      });

      logger.info('User logged in');
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
        try {
          const revokedUserId = verifyRefreshToken(refreshToken);
          if (revokedUserId) {
            const revokedUser = await prisma.user.findUnique({
              where: { id: revokedUserId },
              select: { id: true, organizationId: true },
            });
            if (revokedUser) {
              await prisma.auditLog.create({
                data: {
                  action: 'auth.refresh_denied_revoked',
                  userId: revokedUser.id,
                  organizationId: revokedUser.organizationId,
                  hash: uuidv4(),
                  details: JSON.stringify({ reason: 'refresh_token_revoked' }),
                  ipAddress: req.ip || undefined,
                  userAgent: req.headers['user-agent'] || undefined,
                },
              });
            }
          }
        } catch (auditErr) {
          logger.warn('[Auth] Failed to write refresh-denied audit log', auditErr);
        }
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

      try {
        await prisma.auditLog.create({
          data: {
            action: 'auth.refresh_rotated',
            userId: user.id,
            organizationId: user.organizationId,
            hash: uuidv4(),
            details: JSON.stringify({ reason: 'token_rotation' }),
            ipAddress: req.ip || undefined,
            userAgent: req.headers['user-agent'] || undefined,
          },
        });
      } catch (auditErr) {
        logger.warn('[Auth] Failed to write refresh-rotated audit log', auditErr);
      }

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

      res.json({
        message: 'Token refreshed successfully',
        ...bearerAuthTokens(req, accessToken, newRefreshToken), // v2/Bearer clients only
      });
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
        logSecurityEvent({
          type: SecurityEventType.AUTHENTICATION_FAILURE,
          severity: 'medium',
          message: 'Login attempt for non-existent email',
          ip: req.ip,
          method: req.method,
          path: req.originalUrl,
          details: { emailDomain: email.split('@')[1] },
        });
        throw new AppError('Invalid email or password', 401);
      }

      // Check if user has a password set
      if (!user.passwordHash) {
        logSecurityEvent({
          type: SecurityEventType.AUTHENTICATION_FAILURE,
          severity: 'low',
          message: 'Password login attempted on passwordless account',
          ip: req.ip,
          method: req.method,
          path: req.originalUrl,
          userId: user.id,
        });
        throw new AppError('Password not set. Please use magic link login or set a password first.', 401);
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        logSecurityEvent({
          type: SecurityEventType.AUTHENTICATION_FAILURE,
          severity: 'high',
          message: 'Invalid password during login',
          ip: req.ip,
          method: req.method,
          path: req.originalUrl,
          userId: user.id,
          userEmail: user.email,
          organizationId: user.organizationId,
        });
        throw new AppError('Invalid email or password', 401);
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled && !user.twoFactorVerified) {
        // Return a short-lived signed JWT for 2FA verification instead of raw userId
        const twoFactorToken = jwt.sign(
          { userId: user.id, purpose: '2fa_pending' },
          config.jwt.secret,
          { expiresIn: '5m' }
        );
        res.json({
          requires2FA: true,
          twoFactorToken,
          message: 'Two-factor authentication required',
        });
        return;
      }

      // FIPS migration: rehash legacy bcrypt passwords with PBKDF2-SHA256 on successful login
      if (needsRehash(user.passwordHash)) {
        try {
          const newHash = await hashPassword(password);
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash },
          });
          logger.info('[Auth] Migrated password hash to PBKDF2-SHA256');
        } catch (err: any) {
          logger.warn('[Auth] Failed to rehash password during login', err?.message);
        }
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

      // Log successful login as security event
      logSecurityEvent({
        type: SecurityEventType.AUTHENTICATION_SUCCESS,
        severity: 'low',
        message: 'Password login successful',
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
        userId: user.id,
        userEmail: user.email,
        organizationId: user.organizationId,
      });

      // Set httpOnly secure cookies for token storage
      setAuthCookies(res, accessToken, refreshToken);

      res.json({
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
        ...bearerAuthTokens(req, accessToken, refreshToken), // v2/Bearer clients only
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
        howDidYouHear,
        captchaToken
      } = req.body;

      if (!email || !name) {
        throw new AppError('Email and name are required', 400);
      }

      // Sanitize user input to prevent stored XSS
      const sanitizedName = DOMPurify.sanitize(name, { ALLOWED_TAGS: [] }).trim();
      if (!sanitizedName) {
        throw new AppError('Name contains invalid characters', 400);
      }

      // Verify CAPTCHA before allowing registration
      await this.verifyCaptcha(captchaToken, req.ip);

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
        logger.info('User already exists, sending magic link for login');
        
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
            logger.warn('Failed to send magic link email, but continuing with token generation');
          }
        } catch (error: any) {
          logger.error('Failed to send magic link email', error.message);
          if (process.env.NODE_ENV !== 'development') {
            throw new AppError(`Failed to send email: ${error.message}`, 500);
          }
        }

        // Build response
        const response: any = {
          message: 'An account with this email already exists. A magic link has been sent to your email for login.',
          email,
          existingUser: true,
        };

        // In development mode, include the token for testing
        if (process.env.NODE_ENV === 'development') {
          response.devToken = token;
        }

        res.status(200).json(response);
        return;
      }

      // Hash password if provided (before transaction to avoid holding DB lock during hashing)
      const passwordHash = password ? await hashPassword(password) : null;

      // Create organization + user + magic link atomically
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const { user } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Create organization with signup details
        const organization = await tx.organization.create({
          data: {
            name: organizationName || `${sanitizedName}'s Organization`,
            plan: 'Foundation',
            industry: industry || null,
            companySize: companySize || null,
            primaryComplianceGoal: primaryComplianceGoal || null,
            howDidYouHear: howDidYouHear || null,
            onboardingCompleted: false,
            onboardingStep: 0,
          },
        });

        // Create user
        const newUser = await tx.user.create({
          data: {
            email,
            name: sanitizedName,
            role: 'admin',
            organizationId: organization.id,
            passwordHash,
          },
        });

        // Generate magic link for instant login
        await tx.magicLink.create({
          data: {
            email,
            token,
            expiresAt,
          },
        });

        // Audit log: account creation (inside transaction so it rolls back with the user)
        await tx.auditLog.create({
          data: {
            action: 'auth.user_registered',
            userId: newUser.id,
            organizationId: organization.id,
            hash: uuidv4(),
            details: JSON.stringify({ role: newUser.role, organizationName: organization.name }),
            ipAddress: req.ip || undefined,
            userAgent: req.headers['user-agent'] || undefined,
          },
        });

        return { user: newUser };
      });

      // Send welcome email + magic link on a BEST-EFFORT basis. The account is
      // already committed in the transaction above; a transactional-email
      // failure (SendGrid outage / misconfigured key) must NOT fail registration
      // and leave the user with a persisted account but a 500 response — that
      // produced a "created but 500" state where the retry then hit
      // "email already registered". Log it and continue; the user can sign in
      // with their password or request a fresh magic link.
      let emailDelivered = true;
      try {
        await emailService.sendWelcomeEmail(email, name);
        await emailService.sendMagicLink(email, token);
      } catch (emailError: any) {
        emailDelivered = false;
        logger.warn('Registration: email send failed', { userId: user.id, error: emailError?.message });
      }

      const response: any = {
        message: emailDelivered
          ? 'Registration successful. Check your email for login link.'
          : 'Registration successful. We could not send your login email — sign in with your password or request a new login link.',
        emailDelivered,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };

      // In development mode, include the token for testing
      if (process.env.NODE_ENV === 'development') {
        response.devToken = token;
      }

      res.status(201).json(response);

      logger.info('New user registered');
    } catch (error) {
      logger.error('Registration error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to register user', 500);
    }
  }

  async completeTwoFactorLogin(req: Request, res: Response): Promise<void> {
    try {
      const { twoFactorToken, token } = req.body;

      if (!twoFactorToken || !token) {
        throw new AppError('Two-factor token and verification code are required', 400);
      }

      // Verify the short-lived 2FA pending JWT to extract userId securely
      let userId: string;
      try {
        const decoded = jwt.verify(twoFactorToken, config.jwt.secret, { algorithms: ['HS256'] }) as {
          userId: string;
          purpose: string;
        };
        if (decoded.purpose !== '2fa_pending') {
          throw new AppError('Invalid two-factor token', 401);
        }
        userId = decoded.userId;
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError('Two-factor token expired or invalid', 401);
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
        logSecurityEvent({
          type: SecurityEventType.TWO_FACTOR_FAILURE,
          severity: 'high',
          message: 'Invalid 2FA code during login',
          ip: req.ip,
          method: req.method,
          path: req.originalUrl,
          userId,
        });
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
        ...bearerAuthTokens(req, accessToken, refreshToken), // v2/Bearer clients only
      });

      logSecurityEvent({
        type: SecurityEventType.TWO_FACTOR_SUCCESS,
        severity: 'low',
        message: `2FA login successful (method: ${isValidToken ? 'TOTP' : 'backup_code'})`,
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
        userId: user.id,
        userEmail: user.email,
        organizationId: user.organizationId,
      });

      logger.info('User completed 2FA login');
    } catch (error) {
      logger.error('Complete 2FA login error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to complete 2FA login', 500);
    }
  }

  /**
   * GET /auth/me — return the authenticated user's current profile.
   *
   * Requires the `authenticate` guard (so `req.user` is set from the Bearer token
   * or the httpOnly cookie). Re-queries the user + organization fresh from the DB
   * (authoritative, not stale JWT claims). The user fields are returned at the TOP
   * level of the body — the response envelope places this whole object under `data`,
   * and clients read the current user directly from `data` (the mobile app calls
   * this for session hydration via `normalizeUser(meResult.data)`).
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as any;
      const userId = authReq.user?.id;
      if (!userId) {
        throw new AppError('Not authenticated', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          organizationId: true,
          organization: { select: { id: true, name: true, plan: true } },
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        organizationId: user.organizationId,
        organization: user.organization
          ? { id: user.organization.id, name: user.organization.name, plan: user.organization.plan }
          : undefined,
      });
    } catch (error: any) {
      logger.error('Get current user error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch current user', 500);
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
      if (typeof email !== 'string' || email.length > 254 || !emailRegex.test(email)) {
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
      logger.info('User profile updated');
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
      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        logSecurityEvent({
          type: SecurityEventType.AUTHENTICATION_FAILURE,
          severity: 'high',
          message: 'Incorrect current password during password change',
          ip: req.ip,
          method: req.method,
          path: req.originalUrl,
          userId,
          organizationId,
        });
        throw new AppError('Current password is incorrect', 401);
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      // Revoke all existing tokens and sessions issued before the password change.
      // Without this step, tokens minted before the change remain valid until they expire.
      await tokenBlacklist.revokeAllForUser(userId);
      await prisma.userSession.updateMany({ where: { userId, terminatedAt: null }, data: { terminatedAt: new Date(), terminationReason: 'password_change' } }).catch((err) => {
        logger.warn('[Auth] Failed to purge sessions after password change', err);
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

      logSecurityEvent({
        type: SecurityEventType.PASSWORD_CHANGED,
        severity: 'medium',
        message: 'User password changed successfully',
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
        userId,
        organizationId,
      });

      // Clear cookies so the caller is forced to re-authenticate with the new password.
      clearAuthCookies(res);

      res.json({ message: 'Password changed successfully' });
      logger.info('Password changed');
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
      logger.info('Avatar uploaded');
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

      // Capture user context BEFORE token revocation for the audit log entry
      const authReq = req as any;
      const actorUserId: string | undefined = authReq.user?.id;
      const actorOrgId: string | undefined = authReq.user?.organizationId;

      // Blacklist the access token so it cannot be reused
      if (accessToken) {
        await tokenBlacklist.revoke(accessToken, 'logout');
      }

      // Blacklist the refresh token from body or httpOnly cookie
      const refreshToken = req.body?.refreshToken || req.cookies?.refresh_token;
      if (refreshToken) {
        await tokenBlacklist.revoke(refreshToken, 'logout');
      }

      // Audit log: emit one entry summarising which tokens were revoked
      if (actorUserId && actorOrgId && (accessToken || refreshToken)) {
        try {
          await prisma.auditLog.create({
            data: {
              action: 'auth.logout',
              userId: actorUserId,
              organizationId: actorOrgId,
              hash: uuidv4(),
              details: JSON.stringify({
                accessTokenRevoked: !!accessToken,
                refreshTokenRevoked: !!refreshToken,
              }),
              ipAddress: req.ip || undefined,
              userAgent: req.headers['user-agent'] || undefined,
            },
          });
        } catch (auditErr) {
          logger.warn('[Auth] Failed to write logout audit log', auditErr);
        }
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
  /**
   * POST /forgot-password
   * Generates a password reset token and sends email.
   * Always returns 200 to prevent email enumeration.
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (user && user.active) {
        const crypto = await import('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        // Store only the SHA-256 digest at rest; the raw token is emailed to the user
        // and never persisted, so a DB read cannot be used to reset another user's password.
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.user.update({
          where: { id: user.id },
          data: { resetToken: resetTokenHash, resetTokenExpiry },
        });

        await emailService.sendPasswordReset(email, resetToken);
        logger.info('[Auth] Password reset requested');
      } else {
        logger.info('[Auth] Password reset requested for unknown/inactive account');
      }
    } catch (error) {
      logger.error('[Auth] Error processing forgot password', error);
    }

    // Always return success to prevent email enumeration
    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  }

  /**
   * POST /reset-password
   * Resets password using token from email.
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, password } = req.body;
    if (!token || !password) {
      throw new AppError('Token and new password are required', 400);
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    // The DB stores the SHA-256 digest of the reset token, so hash the incoming
    // raw token before the lookup to match what was persisted.
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Revoke all existing tokens and sessions after a reset. The user's credentials
    // may have been compromised, so any previously-issued token must stop working.
    await tokenBlacklist.revokeAllForUser(user.id);
    await prisma.userSession.updateMany({
      where: { userId: user.id, terminatedAt: null },
      data: { terminatedAt: new Date(), terminationReason: 'password_reset' },
    }).catch((err) => {
      logger.warn('[Auth] Failed to purge sessions after password reset', err);
    });

    try {
      await prisma.auditLog.create({
        data: {
          action: 'auth.password_reset',
          userId: user.id,
          organizationId: user.organizationId,
          hash: uuidv4(),
          details: JSON.stringify({ sessionsTerminated: true, tokensRevoked: true }),
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'] || undefined,
        },
      });
    } catch (auditErr) {
      logger.warn('[Auth] Failed to write password-reset audit log', auditErr);
    }

    logger.info('[Auth] Password reset completed');
    res.json({ message: 'Password has been reset successfully' });
  }
}

export default new AuthController();
