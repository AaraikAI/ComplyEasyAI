/**
 * E2E Tests - Security Settings Flow
 * Tests security configuration workflows including 2FA setup/verify/disable,
 * Zero Trust device verification, and BYOK configuration.
 * Tests only routes that actually exist in the application.
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

jest.mock('../../config/monitoring', () => ({
  __esModule: true,
  default: { setUserContext: jest.fn(), captureException: jest.fn() },
}));

jest.mock('../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

jest.mock('../../utils/securityEventLogger', () => ({
  logSecurityEvent: jest.fn(),
  SecurityEventType: {
    AUTHENTICATION_FAILURE: 'AUTHENTICATION_FAILURE',
    AUTHORIZATION_FAILURE: 'AUTHORIZATION_FAILURE',
  },
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

jest.mock('../../middleware/tierMiddleware', () => ({
  requireVisionaryFeature: () => [(req: any, res: any, next: any) => next()],
}));

// Mock twoFactorService (used by 2FA controller)
const mockTwoFactorService = {
  setupTwoFactor: jest.fn<any>().mockResolvedValue({
    secret: 'TESTSECRET123456',
    qrCodeUrl: 'otpauth://totp/App:user@example.com?secret=TESTSECRET123456',
    backupCodes: ['code1', 'code2', 'code3', 'code4', 'code5', 'code6', 'code7', 'code8', 'code9', 'code10'],
  }),
  verifyAndEnableTwoFactor: jest.fn<any>().mockResolvedValue(true),
  verifyTwoFactorToken: jest.fn<any>().mockResolvedValue(true),
  verifyBackupCode: jest.fn<any>().mockResolvedValue(true),
  disableTwoFactor: jest.fn<any>().mockResolvedValue(true),
  regenerateBackupCodes: jest.fn<any>().mockResolvedValue(['new1', 'new2', 'new3', 'new4', 'new5', 'new6', 'new7', 'new8', 'new9', 'new10']),
  isTwoFactorEnabled: jest.fn<any>().mockResolvedValue(true),
  getRemainingBackupCodesCount: jest.fn<any>().mockResolvedValue(8),
  verifyToken: jest.fn<any>().mockResolvedValue(true),
};

jest.mock('../../services/twoFactorService', () => ({
  __esModule: true,
  default: mockTwoFactorService,
}));

// Mock security services (used by security controller)
const mockZeroTrustService = {
  initialize: jest.fn<any>().mockResolvedValue(undefined),
  generateDeviceFingerprint: jest.fn().mockReturnValue('fp-123'),
  verifyDeviceTrust: jest.fn<any>().mockResolvedValue({ trusted: true, trustScore: 95 }),
  evaluateAccessRequest: jest.fn<any>().mockResolvedValue({ allowed: true, reason: 'Access granted' }),
  createPolicy: jest.fn<any>().mockResolvedValue({ id: 'policy-123', name: 'Test Policy' }),
  getPolicies: jest.fn<any>().mockResolvedValue([{ id: 'policy-123', name: 'Test Policy' }]),
  getAllDeviceTrusts: jest.fn<any>().mockResolvedValue([{ deviceId: 'dev-1', trusted: true }]),
  getDeviceTrust: jest.fn<any>().mockResolvedValue({ deviceId: 'dev-1', trusted: true }),
  continuousVerification: jest.fn<any>().mockResolvedValue(true),
};

jest.mock('../../services/advanced/zeroTrustService', () => ({
  __esModule: true,
  default: mockZeroTrustService,
}));

jest.mock('../../services/advanced/zeroKnowledgeService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn<any>().mockResolvedValue(undefined),
    generateComplianceProof: jest.fn<any>().mockResolvedValue({ proofId: 'proof-1' }),
    verifyComplianceProof: jest.fn<any>().mockResolvedValue({ isValid: true }),
    generateCredentialProof: jest.fn<any>().mockResolvedValue({ proofId: 'proof-1' }),
    verifyCredentialProof: jest.fn<any>().mockResolvedValue(true),
    generateOwnershipProof: jest.fn<any>().mockResolvedValue({ proofId: 'proof-1' }),
    verifyOwnershipProof: jest.fn<any>().mockResolvedValue(true),
    getAllProofs: jest.fn<any>().mockResolvedValue([]),
  },
}));

jest.mock('../../services/advanced/byokService', () => ({
  __esModule: true,
  default: {
    createAWSKey: jest.fn<any>().mockResolvedValue('key-123'),
    createAzureKey: jest.fn<any>().mockResolvedValue('key-123'),
    createGCPKey: jest.fn<any>().mockResolvedValue('key-123'),
    createVaultKey: jest.fn<any>().mockResolvedValue('key-123'),
    verifyKeyAccess: jest.fn<any>().mockResolvedValue(true),
    rotateKey: jest.fn<any>().mockResolvedValue([]),
    scheduleKeyDeletion: jest.fn<any>().mockResolvedValue(undefined),
    encryptData: jest.fn<any>().mockResolvedValue({ ciphertext: 'encrypted' }),
    decryptData: jest.fn<any>().mockResolvedValue(Buffer.from('decrypted')),
  },
}));

jest.mock('../../services/advanced/complianceAsCodeService', () => ({
  __esModule: true,
  default: {
    createPolicy: jest.fn<any>().mockResolvedValue({ policyId: 'p-1' }),
    getPoliciesByFramework: jest.fn<any>().mockResolvedValue([]),
    getPolicy: jest.fn<any>().mockResolvedValue({ policyId: 'p-1' }),
    updatePolicy: jest.fn<any>().mockResolvedValue({ policyId: 'p-1' }),
    deletePolicy: jest.fn<any>().mockResolvedValue({ success: true }),
    evaluatePolicy: jest.fn<any>().mockResolvedValue({ passed: true }),
    evaluateMultiplePolicies: jest.fn<any>().mockResolvedValue({ results: [] }),
    generateComplianceReport: jest.fn<any>().mockResolvedValue({ reportId: 'r-1' }),
    handleCIWebhook: jest.fn<any>().mockResolvedValue({ processed: true }),
    setupCIIntegration: jest.fn<any>().mockResolvedValue('wh-1'),
    detectDrift: jest.fn<any>().mockResolvedValue({ hasDrift: false }),
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
  beforeEach(() => {
    jest.clearAllMocks();

    // Re-establish mock implementations after clearAllMocks/resetMocks
    mockTwoFactorService.setupTwoFactor.mockResolvedValue({
      secret: 'TESTSECRET123456',
      qrCodeUrl: 'otpauth://totp/App:user@example.com?secret=TESTSECRET123456',
      backupCodes: ['code1', 'code2', 'code3', 'code4', 'code5', 'code6', 'code7', 'code8', 'code9', 'code10'],
    });
    mockTwoFactorService.verifyAndEnableTwoFactor.mockResolvedValue(true);
    mockTwoFactorService.verifyTwoFactorToken.mockResolvedValue(true);
    mockTwoFactorService.verifyBackupCode.mockResolvedValue(true);
    mockTwoFactorService.disableTwoFactor.mockResolvedValue(true);
    mockTwoFactorService.regenerateBackupCodes.mockResolvedValue(
      ['new1', 'new2', 'new3', 'new4', 'new5', 'new6', 'new7', 'new8', 'new9', 'new10']
    );
    mockTwoFactorService.isTwoFactorEnabled.mockResolvedValue(true);
    mockTwoFactorService.getRemainingBackupCodesCount.mockResolvedValue(8);

    mockZeroTrustService.initialize.mockResolvedValue(undefined);
    mockZeroTrustService.generateDeviceFingerprint.mockReturnValue('fp-123');
    mockZeroTrustService.verifyDeviceTrust.mockResolvedValue({ trusted: true, trustScore: 95 });
    mockZeroTrustService.evaluateAccessRequest.mockResolvedValue({ allowed: true, reason: 'Access granted' });
    mockZeroTrustService.createPolicy.mockResolvedValue({ id: 'policy-123', name: 'Test Policy' });
    mockZeroTrustService.getPolicies.mockResolvedValue([{ id: 'policy-123', name: 'Test Policy' }]);
    mockZeroTrustService.getAllDeviceTrusts.mockResolvedValue([{ deviceId: 'dev-1', trusted: true }]);
    mockZeroTrustService.getDeviceTrust.mockResolvedValue({ deviceId: 'dev-1', trusted: true });
    mockZeroTrustService.continuousVerification.mockResolvedValue(true);

    // Prisma mocks for audit log operations
    prismaMock.auditLog.create.mockResolvedValue({} as any);
    prismaMock.auditLog.findMany.mockResolvedValue([] as any);
    prismaMock.auditLog.findFirst.mockResolvedValue(null as any);
  });

  // =========================================================================
  // Two-Factor Authentication Flow
  // =========================================================================
  describe('Two-Factor Authentication Flow', () => {
    it('should setup 2FA for user', async () => {
      const response = await request(app)
        .post('/api/2fa/setup')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('secret');
      expect(response.body.data).toHaveProperty('qrCode');
      expect(response.body.data).toHaveProperty('backupCodes');
    });

    it('should verify and enable 2FA', async () => {
      const response = await request(app)
        .post('/api/2fa/verify-enable')
        .send({ token: '123456' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockTwoFactorService.verifyAndEnableTwoFactor).toHaveBeenCalledWith('user-123', '123456');
    });

    it('should verify 2FA token during login', async () => {
      const response = await request(app)
        .post('/api/2fa/verify')
        .send({ userId: 'user-123', token: '123456' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockTwoFactorService.verifyTwoFactorToken).toHaveBeenCalledWith('user-123', '123456');
    });

    it('should verify backup code', async () => {
      const response = await request(app)
        .post('/api/2fa/verify-backup')
        .send({ userId: 'user-123', code: 'backup-code-1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockTwoFactorService.verifyBackupCode).toHaveBeenCalledWith('user-123', 'backup-code-1');
    });

    it('should disable 2FA', async () => {
      const response = await request(app)
        .post('/api/2fa/disable')
        .send({ token: '123456' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockTwoFactorService.disableTwoFactor).toHaveBeenCalledWith('user-123', '123456');
    });

    it('should regenerate backup codes', async () => {
      const response = await request(app)
        .post('/api/2fa/regenerate-codes')
        .send({ token: '123456' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('backupCodes');
      expect(response.body.data.backupCodes).toHaveLength(10);
    });

    it('should get 2FA status', async () => {
      const response = await request(app)
        .get('/api/2fa/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('enabled', true);
      expect(response.body.data).toHaveProperty('remainingBackupCodes', 8);
    });
  });

  // =========================================================================
  // Zero Trust Security Flow
  // =========================================================================
  describe('Zero Trust Security Flow', () => {
    it('should verify device trust', async () => {
      const response = await request(app)
        .post('/api/security/zero-trust/verify-device')
        .send({ deviceId: 'device-123' });

      expect([200, 201]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it('should evaluate access request', async () => {
      const response = await request(app)
        .post('/api/security/zero-trust/evaluate-access')
        .send({ resource: 'res-1', deviceId: 'dev-1', action: 'read' });

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('allowed');
    });

    it('should create and list zero trust policies', async () => {
      // Create
      const createRes = await request(app)
        .post('/api/security/zero-trust/policies')
        .send({ name: 'Test Policy', rules: [] });

      expect([200, 201]).toContain(createRes.status);

      // List
      const listRes = await request(app)
        .get('/api/security/zero-trust/policies')
        .expect(200);

      expect(Array.isArray(listRes.body)).toBe(true);
    });

    it('should list trusted devices', async () => {
      const response = await request(app)
        .get('/api/security/zero-trust/devices')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should perform continuous verification', async () => {
      const response = await request(app)
        .post('/api/security/zero-trust/continuous-verify')
        .send({ deviceId: 'device-123' });

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('isTrusted');
    });
  });

  // =========================================================================
  // BYOK Configuration Flow
  // =========================================================================
  describe('BYOK Configuration Flow', () => {
    it('should get BYOK configuration', async () => {
      const response = await request(app)
        .get('/api/security/byok/config')
        .expect(200);

      // Returns default config when none exists
      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('enabled');
    });

    it('should update BYOK configuration', async () => {
      const response = await request(app)
        .post('/api/security/byok/config')
        .send({
          defaultKeyId: 'key-123',
          autoRotation: true,
          rotationInterval: 60,
        });

      expect([200, 201]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it('should generate a local BYOK key', async () => {
      const response = await request(app)
        .post('/api/security/byok/keys/generate')
        // Schema requires keyType + label; provider defaults to 'local' server-side.
        .send({ keyType: 'AES-256', label: 'Local Key' });

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('keyId');
      expect(response.body).toHaveProperty('provider', 'local');
    });

    it('should list BYOK keys', async () => {
      const response = await request(app)
        .get('/api/security/byok/keys')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
