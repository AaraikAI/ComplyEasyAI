/**
 * E2E Tests - Security Settings Flow
 * Tests complete security configuration workflows including 2FA,
 * SSO, IP restrictions, session management, and security policies.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock } from '../mocks/prisma';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
  testConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => next(),
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
  aiLimiter: (req: any, res: any, next: any) => next(),
  frameworkLimiter: (req: any, res: any, next: any) => next(),
}));

jest.mock('speakeasy', () => ({
  generateSecret: jest.fn().mockReturnValue({
    base32: 'TESTSECRET123456',
    otpauth_url: 'otpauth://totp/App:user@example.com?secret=TESTSECRET123456',
  }),
  totp: {
    verify: jest.fn().mockReturnValue(true),
  },
}));

import securityRoutes from '../../routes/security';
import twoFactorRoutes from '../../routes/twoFactor';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'Admin',
    email: 'admin@example.com',
  };
  next();
});
app.use('/api/security', securityRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use(errorHandler);

describe('E2E: Security Settings Flow', () => {
  const mockOrganization = {
    id: 'org-123',
    name: 'Test Company',
    securitySettings: {
      mfaRequired: false,
      sessionTimeout: 3600,
      ipRestrictions: [],
      passwordPolicy: { minLength: 8, requireUppercase: true },
    },
  };

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    twoFactorEnabled: false,
    twoFactorSecret: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Two-Factor Authentication Flow', () => {
    it('should setup 2FA for user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any);

      const setupResponse = await request(app)
        .post('/api/2fa/setup')
        .expect(200);

      expect(setupResponse.body).toHaveProperty('secret');
      expect(setupResponse.body).toHaveProperty('qrCode');
    });

    it('should verify and enable 2FA', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: 'TESTSECRET123456',
      } as any);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
      } as any);

      const response = await request(app)
        .post('/api/2fa/verify')
        .send({ code: '123456' })
        .expect(200);

      expect(response.body.twoFactorEnabled).toBe(true);
    });

    it('should generate backup codes', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
      } as any);
      prismaMock.backupCode.createMany.mockResolvedValue({ count: 10 } as any);

      const response = await request(app)
        .post('/api/2fa/backup-codes')
        .expect(200);

      expect(response.body).toHaveProperty('codes');
      expect(response.body.codes).toHaveLength(10);
    });

    it('should disable 2FA', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
      } as any);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      } as any);

      const response = await request(app)
        .post('/api/2fa/disable')
        .send({ code: '123456', password: 'currentPassword' })
        .expect(200);

      expect(response.body.twoFactorEnabled).toBe(false);
    });
  });

  describe('Organization Security Settings', () => {
    it('should get security settings', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);

      const response = await request(app)
        .get('/api/security/settings')
        .expect(200);

      expect(response.body).toHaveProperty('mfaRequired');
      expect(response.body).toHaveProperty('sessionTimeout');
      expect(response.body).toHaveProperty('passwordPolicy');
    });

    it('should enforce MFA for organization', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);
      prismaMock.organization.update.mockResolvedValue({
        ...mockOrganization,
        securitySettings: {
          ...mockOrganization.securitySettings,
          mfaRequired: true,
        },
      } as any);

      const response = await request(app)
        .patch('/api/security/settings')
        .send({ mfaRequired: true })
        .expect(200);

      expect(response.body.mfaRequired).toBe(true);
    });

    it('should configure password policy', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);
      prismaMock.organization.update.mockResolvedValue({
        ...mockOrganization,
        securitySettings: {
          ...mockOrganization.securitySettings,
          passwordPolicy: {
            minLength: 12,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            maxAge: 90,
            preventReuse: 5,
          },
        },
      } as any);

      const response = await request(app)
        .patch('/api/security/password-policy')
        .send({
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          maxAge: 90,
          preventReuse: 5,
        })
        .expect(200);

      expect(response.body.passwordPolicy.minLength).toBe(12);
    });

    it('should configure session settings', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);
      prismaMock.organization.update.mockResolvedValue({
        ...mockOrganization,
        securitySettings: {
          ...mockOrganization.securitySettings,
          sessionTimeout: 1800,
          maxConcurrentSessions: 3,
          rememberMeEnabled: false,
        },
      } as any);

      const response = await request(app)
        .patch('/api/security/session-settings')
        .send({
          sessionTimeout: 1800,
          maxConcurrentSessions: 3,
          rememberMeEnabled: false,
        })
        .expect(200);

      expect(response.body.sessionTimeout).toBe(1800);
    });
  });

  describe('IP Restrictions', () => {
    it('should add IP whitelist', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);
      prismaMock.ipRestriction.create.mockResolvedValue({
        id: 'ip-123',
        type: 'whitelist',
        ip: '192.168.1.0/24',
        description: 'Office network',
      } as any);

      const response = await request(app)
        .post('/api/security/ip-restrictions')
        .send({
          type: 'whitelist',
          ip: '192.168.1.0/24',
          description: 'Office network',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should list IP restrictions', async () => {
      prismaMock.ipRestriction.findMany.mockResolvedValue([
        { id: 'ip-1', type: 'whitelist', ip: '192.168.1.0/24' },
        { id: 'ip-2', type: 'blacklist', ip: '10.0.0.5' },
      ] as any);

      const response = await request(app)
        .get('/api/security/ip-restrictions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should remove IP restriction', async () => {
      prismaMock.ipRestriction.delete.mockResolvedValue({ id: 'ip-123' } as any);

      const response = await request(app)
        .delete('/api/security/ip-restrictions/ip-123')
        .expect(200);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Session Management', () => {
    it('should list active sessions', async () => {
      prismaMock.session.findMany.mockResolvedValue([
        {
          id: 'sess-1',
          userId: 'user-123',
          ipAddress: '192.168.1.100',
          userAgent: 'Chrome/120',
          createdAt: new Date(),
          lastActiveAt: new Date(),
        },
      ] as any);

      const response = await request(app)
        .get('/api/security/sessions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should revoke specific session', async () => {
      prismaMock.session.delete.mockResolvedValue({ id: 'sess-123' } as any);

      const response = await request(app)
        .delete('/api/security/sessions/sess-123')
        .expect(200);

      expect(response.body).toHaveProperty('revoked', true);
    });

    it('should revoke all other sessions', async () => {
      prismaMock.session.deleteMany.mockResolvedValue({ count: 3 } as any);

      const response = await request(app)
        .post('/api/security/sessions/revoke-all')
        .expect(200);

      expect(response.body).toHaveProperty('revokedCount');
    });
  });

  describe('SSO Configuration', () => {
    it('should configure SAML SSO', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);
      prismaMock.organization.update.mockResolvedValue({
        ...mockOrganization,
        ssoConfig: {
          enabled: true,
          provider: 'saml',
          entityId: 'https://app.example.com',
          ssoUrl: 'https://idp.example.com/sso',
          certificate: 'CERT_DATA',
        },
      } as any);

      const response = await request(app)
        .post('/api/security/sso/saml')
        .send({
          entityId: 'https://app.example.com',
          ssoUrl: 'https://idp.example.com/sso',
          certificate: 'CERT_DATA',
        })
        .expect(200);

      expect(response.body.ssoConfig.provider).toBe('saml');
    });

    it('should configure OIDC SSO', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);
      prismaMock.organization.update.mockResolvedValue({
        ...mockOrganization,
        ssoConfig: {
          enabled: true,
          provider: 'oidc',
          clientId: 'client_123',
          issuer: 'https://auth.example.com',
        },
      } as any);

      const response = await request(app)
        .post('/api/security/sso/oidc')
        .send({
          clientId: 'client_123',
          clientSecret: 'secret_456',
          issuer: 'https://auth.example.com',
        })
        .expect(200);

      expect(response.body.ssoConfig.provider).toBe('oidc');
    });

    it('should test SSO configuration', async () => {
      const response = await request(app)
        .post('/api/security/sso/test')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('should disable SSO', async () => {
      prismaMock.organization.findUnique.mockResolvedValue({
        ...mockOrganization,
        ssoConfig: { enabled: true },
      } as any);
      prismaMock.organization.update.mockResolvedValue({
        ...mockOrganization,
        ssoConfig: { enabled: false },
      } as any);

      const response = await request(app)
        .post('/api/security/sso/disable')
        .expect(200);

      expect(response.body.ssoConfig.enabled).toBe(false);
    });
  });

  describe('Security Audit Log', () => {
    it('should get security events', async () => {
      prismaMock.securityEvent.findMany.mockResolvedValue([
        { id: 'ev-1', type: 'login_success', userId: 'user-123', timestamp: new Date() },
        { id: 'ev-2', type: 'login_failed', ip: '10.0.0.5', timestamp: new Date() },
      ] as any);

      const response = await request(app)
        .get('/api/security/events')
        .query({ days: 7 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should export security report', async () => {
      prismaMock.securityEvent.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/security/events/export')
        .query({ format: 'csv', days: 30 })
        .expect(200);

      expect(response.body).toHaveProperty('downloadUrl');
    });
  });

  describe('Security Compliance Check', () => {
    it('should run security compliance check', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);
      prismaMock.user.findMany.mockResolvedValue([
        { ...mockUser, twoFactorEnabled: false },
      ] as any);

      const response = await request(app)
        .get('/api/security/compliance-check')
        .expect(200);

      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('findings');
    });
  });
});
