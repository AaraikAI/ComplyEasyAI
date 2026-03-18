/**
 * Security Routes Integration Tests
 *
 * Tests for Zero Trust, Zero-Knowledge Proofs, BYOK, and Compliance-as-Code.
 * All features require Visionary tier.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock dependencies
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../config/monitoring', () => ({
  __esModule: true,
  default: { setUserContext: jest.fn(), captureException: jest.fn() },
}));

jest.mock('../../../utils/securityEventLogger', () => ({
  logSecurityEvent: jest.fn(),
  SecurityEventType: {
    AUTHENTICATION_FAILURE: 'AUTHENTICATION_FAILURE',
    AUTHORIZATION_FAILURE: 'AUTHORIZATION_FAILURE',
  },
}));

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'admin@example.com',
      organizationId: 'org-123',
      role: 'Admin',
    };
    next();
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
}));

jest.mock('../../../middleware/tierMiddleware', () => ({
  requireVisionaryFeature: () => [(req: any, res: any, next: any) => next()],
}));

// ---------------------------------------------------------------------------
// Mock security services – method names must match what the CONTROLLER calls
// ---------------------------------------------------------------------------

const mockZeroTrustService = {
  initialize: jest.fn<any>().mockResolvedValue(undefined),
  generateDeviceFingerprint: jest.fn().mockReturnValue('fp-123'),
  verifyDeviceTrust: jest.fn<any>().mockResolvedValue({ trusted: true, trustScore: 95 }),
  evaluateAccessRequest: jest.fn<any>().mockResolvedValue({ allowed: true, reason: 'Access granted' }),
  createPolicy: jest.fn<any>().mockResolvedValue({ id: 'policy-123', name: 'Default Policy' }),
  getPolicies: jest.fn<any>().mockResolvedValue([{ id: 'policy-123', name: 'Default Policy' }]),
  getAllDeviceTrusts: jest.fn<any>().mockResolvedValue([]),
  getDeviceTrust: jest.fn<any>().mockResolvedValue({ deviceId: 'device-123', trustScore: 95 }),
  continuousVerification: jest.fn<any>().mockResolvedValue(true),
};

jest.mock('../../../services/advanced/zeroTrustService', () => ({
  __esModule: true,
  default: mockZeroTrustService,
}));

const mockZeroKnowledgeService = {
  initialize: jest.fn<any>().mockResolvedValue(undefined),
  generateComplianceProof: jest.fn<any>().mockResolvedValue({ proofId: 'proof-123', proof: 'zkproof', publicSignals: ['sig1'] }),
  verifyComplianceProof: jest.fn<any>().mockResolvedValue({ isValid: true }),
  generateCredentialProof: jest.fn<any>().mockResolvedValue({ proofId: 'proof-123', publicSignals: ['sig1'] }),
  verifyCredentialProof: jest.fn<any>().mockResolvedValue(true),
  generateOwnershipProof: jest.fn<any>().mockResolvedValue({ proofId: 'proof-123', publicSignals: ['sig1'] }),
  verifyOwnershipProof: jest.fn<any>().mockResolvedValue(true),
  getAllProofs: jest.fn<any>().mockResolvedValue([]),
};

jest.mock('../../../services/advanced/zeroKnowledgeService', () => ({
  __esModule: true,
  default: mockZeroKnowledgeService,
}));

const mockByokService = {
  createAWSKey: jest.fn<any>().mockResolvedValue('key-123'),
  createAzureKey: jest.fn<any>().mockResolvedValue('key-123'),
  createGCPKey: jest.fn<any>().mockResolvedValue('key-123'),
  createVaultKey: jest.fn<any>().mockResolvedValue('key-123'),
  verifyKeyAccess: jest.fn<any>().mockResolvedValue(true),
  rotateKey: jest.fn<any>().mockResolvedValue([]),
  scheduleKeyDeletion: jest.fn<any>().mockResolvedValue(undefined),
  encryptData: jest.fn<any>().mockResolvedValue({ ciphertext: 'encrypted', iv: 'abc', encryptedDataKey: 'edk' }),
  decryptData: jest.fn<any>().mockResolvedValue(Buffer.from('decrypted')),
};

jest.mock('../../../services/advanced/byokService', () => ({
  __esModule: true,
  default: mockByokService,
}));

const mockCacService = {
  createPolicy: jest.fn<any>().mockResolvedValue({ policyId: 'policy-123' }),
  getPoliciesByFramework: jest.fn<any>().mockResolvedValue([]),
  getPolicy: jest.fn<any>().mockResolvedValue({ policyId: 'policy-123' }),
  updatePolicy: jest.fn<any>().mockResolvedValue({ policyId: 'policy-123', updated: true }),
  deletePolicy: jest.fn<any>().mockResolvedValue({ success: true }),
  evaluatePolicy: jest.fn<any>().mockResolvedValue({ passed: true, violations: [] }),
  evaluateMultiplePolicies: jest.fn<any>().mockResolvedValue({ results: [] }),
  generateComplianceReport: jest.fn<any>().mockResolvedValue({ reportId: 'report-123', framework: 'SOC2' }),
  handleCIWebhook: jest.fn<any>().mockResolvedValue({ processed: true }),
  setupCIIntegration: jest.fn<any>().mockResolvedValue('webhook-id-123'),
  detectDrift: jest.fn<any>().mockResolvedValue({ hasDrift: false, drifts: [] }),
};

jest.mock('../../../services/advanced/complianceAsCodeService', () => ({
  __esModule: true,
  default: mockCacService,
}));

// Setup app
let app: Express;

beforeEach(async () => {
  jest.clearAllMocks();

  // Re-setup all mock implementations after clearAllMocks/resetMocks
  mockZeroTrustService.initialize.mockResolvedValue(undefined);
  mockZeroTrustService.generateDeviceFingerprint.mockReturnValue('fp-123');
  mockZeroTrustService.verifyDeviceTrust.mockResolvedValue({ trusted: true, trustScore: 95 });
  mockZeroTrustService.evaluateAccessRequest.mockResolvedValue({ allowed: true, reason: 'Access granted' });
  mockZeroTrustService.createPolicy.mockResolvedValue({ id: 'policy-123', name: 'Default Policy' });
  mockZeroTrustService.getPolicies.mockResolvedValue([{ id: 'policy-123', name: 'Default Policy' }]);
  mockZeroTrustService.getAllDeviceTrusts.mockResolvedValue([]);
  mockZeroTrustService.getDeviceTrust.mockResolvedValue({ deviceId: 'device-123', trustScore: 95 });
  mockZeroTrustService.continuousVerification.mockResolvedValue(true);

  mockZeroKnowledgeService.initialize.mockResolvedValue(undefined);
  mockZeroKnowledgeService.generateComplianceProof.mockResolvedValue({ proofId: 'proof-123', proof: 'zkproof', publicSignals: ['sig1'] });
  mockZeroKnowledgeService.verifyComplianceProof.mockResolvedValue({ isValid: true });
  mockZeroKnowledgeService.generateCredentialProof.mockResolvedValue({ proofId: 'proof-123', publicSignals: ['sig1'] });
  mockZeroKnowledgeService.verifyCredentialProof.mockResolvedValue(true);
  mockZeroKnowledgeService.generateOwnershipProof.mockResolvedValue({ proofId: 'proof-123', publicSignals: ['sig1'] });
  mockZeroKnowledgeService.verifyOwnershipProof.mockResolvedValue(true);
  mockZeroKnowledgeService.getAllProofs.mockResolvedValue([]);

  mockByokService.createAWSKey.mockResolvedValue('key-123');
  mockByokService.createAzureKey.mockResolvedValue('key-123');
  mockByokService.createGCPKey.mockResolvedValue('key-123');
  mockByokService.createVaultKey.mockResolvedValue('key-123');
  mockByokService.verifyKeyAccess.mockResolvedValue(true);
  mockByokService.rotateKey.mockResolvedValue([]);
  mockByokService.scheduleKeyDeletion.mockResolvedValue(undefined);
  mockByokService.encryptData.mockResolvedValue({ ciphertext: 'encrypted', iv: 'abc', encryptedDataKey: 'edk' });
  mockByokService.decryptData.mockResolvedValue(Buffer.from('decrypted'));

  mockCacService.createPolicy.mockResolvedValue({ policyId: 'policy-123' });
  mockCacService.getPoliciesByFramework.mockResolvedValue([]);
  mockCacService.getPolicy.mockResolvedValue({ policyId: 'policy-123' });
  mockCacService.updatePolicy.mockResolvedValue({ policyId: 'policy-123', updated: true });
  mockCacService.deletePolicy.mockResolvedValue({ success: true });
  mockCacService.evaluatePolicy.mockResolvedValue({ passed: true, violations: [] });
  mockCacService.evaluateMultiplePolicies.mockResolvedValue({ results: [] });
  mockCacService.generateComplianceReport.mockResolvedValue({ reportId: 'report-123', framework: 'SOC2' });
  mockCacService.handleCIWebhook.mockResolvedValue({ processed: true });
  mockCacService.setupCIIntegration.mockResolvedValue('webhook-id-123');
  mockCacService.detectDrift.mockResolvedValue({ hasDrift: false, drifts: [] });

  // Mock prisma auditLog for operations that store/read data there
  prismaMock.auditLog.create.mockResolvedValue({} as any);
  prismaMock.auditLog.findMany.mockResolvedValue([] as any);
  prismaMock.auditLog.findFirst.mockResolvedValue(null as any);
  prismaMock.auditLog.update.mockResolvedValue({} as any);

  app = express();
  app.use(express.json());

  const securityRoutes = (await import('../../../routes/security')).default;
  const { errorHandler } = await import('../../../middleware/errorHandler');
  app.use('/api/security', securityRoutes);
  app.use(errorHandler);
});

describe('Security Routes Integration', () => {
  // ===========================================================================
  // Zero Trust Security Tests
  // ===========================================================================
  describe('Zero Trust Security', () => {
    describe('POST /api/security/zero-trust/verify-device', () => {
      it('should verify device trust', async () => {
        const response = await request(app)
          .post('/api/security/zero-trust/verify-device')
          .send({
            deviceId: 'device-123',
            fingerprint: 'fp-abc123',
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    describe('POST /api/security/zero-trust/evaluate-access', () => {
      it('should evaluate access request', async () => {
        const response = await request(app)
          .post('/api/security/zero-trust/evaluate-access')
          .send({
            resourceId: 'sensitive-data',
            deviceId: 'device-123',
            action: 'read',
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toHaveProperty('allowed');
      });
    });

    describe('POST /api/security/zero-trust/policies', () => {
      it('should create zero trust policy', async () => {
        const response = await request(app)
          .post('/api/security/zero-trust/policies')
          .send({
            name: 'Default Access Policy',
            rules: [],
            enforcement: 'strict',
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    describe('GET /api/security/zero-trust/policies', () => {
      it('should list zero trust policies', async () => {
        const response = await request(app)
          .get('/api/security/zero-trust/policies')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('PATCH /api/security/zero-trust/policies/:policyId', () => {
      it('should update zero trust policy', async () => {
        const response = await request(app)
          .patch('/api/security/zero-trust/policies/policy-123')
          .send({ enforcement: 'lenient' });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    describe('DELETE /api/security/zero-trust/policies/:policyId', () => {
      it('should delete zero trust policy', async () => {
        const response = await request(app)
          .delete('/api/security/zero-trust/policies/policy-123');

        expect([200, 204]).toContain(response.status);
      });
    });

    describe('GET /api/security/zero-trust/devices', () => {
      it('should list trusted devices', async () => {
        const response = await request(app)
          .get('/api/security/zero-trust/devices')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/security/zero-trust/network-segments', () => {
      it('should create network segment', async () => {
        const response = await request(app)
          .post('/api/security/zero-trust/network-segments')
          .send({
            name: 'Production Segment',
            cidr: '10.0.0.0/24',
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toHaveProperty('name', 'Production Segment');
        expect(response.body).toHaveProperty('cidr', '10.0.0.0/24');
      });
    });

    describe('POST /api/security/zero-trust/continuous-verify', () => {
      it('should perform continuous verification', async () => {
        const response = await request(app)
          .post('/api/security/zero-trust/continuous-verify')
          .send({ deviceId: 'device-123' });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toHaveProperty('isTrusted');
      });
    });
  });

  // ===========================================================================
  // Zero-Knowledge Proofs Tests
  // ===========================================================================
  describe('Zero-Knowledge Proofs', () => {
    describe('POST /api/security/zkp/compliance-proof/generate', () => {
      it('should generate compliance proof', async () => {
        const response = await request(app)
          .post('/api/security/zkp/compliance-proof/generate')
          .send({
            frameworkId: 'fw-123',
            privateData: { controlsImplemented: 10, totalControls: 15 },
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    describe('POST /api/security/zkp/compliance-proof/verify', () => {
      it('should verify compliance proof', async () => {
        const response = await request(app)
          .post('/api/security/zkp/compliance-proof/verify')
          .send({
            proof: 'zkproof-data',
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    describe('POST /api/security/zkp/credential-proof/generate', () => {
      it('should generate credential proof', async () => {
        const response = await request(app)
          .post('/api/security/zkp/credential-proof/generate')
          .send({
            credential: { type: 'certification', role: 'auditor' },
            secret: 'credential-secret-123',
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    describe('POST /api/security/zkp/ownership-proof/generate', () => {
      it('should generate ownership proof', async () => {
        const response = await request(app)
          .post('/api/security/zkp/ownership-proof/generate')
          .send({
            dataHash: 'abc123hash',
            secret: 'ownership-secret',
            assetId: 'asset-123',
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    describe('GET /api/security/zkp/proofs', () => {
      it('should list ZK proofs', async () => {
        const response = await request(app)
          .get('/api/security/zkp/proofs')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });
  });

  // ===========================================================================
  // BYOK (Bring Your Own Key) Tests
  // ===========================================================================
  describe('BYOK (Bring Your Own Key)', () => {
    describe('POST /api/security/byok/keys/generate', () => {
      it('should generate BYOK key with local provider', async () => {
        const response = await request(app)
          .post('/api/security/byok/keys/generate')
          .send({
            provider: 'local',
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toHaveProperty('keyId');
        expect(response.body).toHaveProperty('provider', 'local');
      });
    });

    describe('POST /api/security/byok/keys/import', () => {
      it('should import BYOK key', async () => {
        const response = await request(app)
          .post('/api/security/byok/keys/import')
          .send({
            provider: 'aws_kms',
            keyId: 'key-123',
            region: 'us-east-1',
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toHaveProperty('keyId');
      });
    });

    describe('GET /api/security/byok/keys', () => {
      it('should list BYOK keys', async () => {
        const response = await request(app)
          .get('/api/security/byok/keys')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/security/byok/keys/:keyId/rotate', () => {
      it('should rotate BYOK key', async () => {
        const response = await request(app)
          .post('/api/security/byok/keys/key-123/rotate')
          .send({
            oldConfig: { provider: 'aws_kms', keyId: 'key-old', region: 'us-east-1' },
            newConfig: { provider: 'aws_kms', keyId: 'key-new', region: 'us-east-1' },
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('DELETE /api/security/byok/keys/:keyId', () => {
      it('should delete BYOK key', async () => {
        const response = await request(app)
          .delete('/api/security/byok/keys/key-123')
          .send({ provider: 'local' });

        expect([200, 204]).toContain(response.status);
        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('POST /api/security/byok/encrypt', () => {
      it('should encrypt data with BYOK', async () => {
        const response = await request(app)
          .post('/api/security/byok/encrypt')
          .send({
            data: 'sensitive data',
            config: { provider: 'aws_kms', keyId: 'key-123', region: 'us-east-1' },
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    describe('POST /api/security/byok/decrypt', () => {
      it('should decrypt data with BYOK', async () => {
        const response = await request(app)
          .post('/api/security/byok/decrypt')
          .send({
            encryptedPayload: { ciphertext: 'encrypted', iv: 'abc', encryptedDataKey: 'edk' },
            config: { provider: 'aws_kms', keyId: 'key-123', region: 'us-east-1' },
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    describe('GET /api/security/byok/config', () => {
      it('should get BYOK configuration', async () => {
        const response = await request(app)
          .get('/api/security/byok/config')
          .expect(200);

        expect(response.body).toBeDefined();
      });
    });
  });

  // ===========================================================================
  // Compliance-as-Code Tests
  // ===========================================================================
  describe('Compliance-as-Code', () => {
    describe('POST /api/security/compliance-as-code/policies', () => {
      it('should create compliance policy', async () => {
        const response = await request(app)
          .post('/api/security/compliance-as-code/policies')
          .send({
            name: 'Data Encryption Policy',
            rules: [{ type: 'require', field: 'encryption', value: 'AES-256' }],
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    describe('GET /api/security/compliance-as-code/policies', () => {
      it('should list compliance policies', async () => {
        const response = await request(app)
          .get('/api/security/compliance-as-code/policies')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/security/compliance-as-code/policies/:policyId/evaluate', () => {
      it('should evaluate compliance policy', async () => {
        const response = await request(app)
          .post('/api/security/compliance-as-code/policies/policy-123/evaluate')
          .send({
            input: { target: 'infrastructure' },
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    describe('POST /api/security/compliance-as-code/policies/evaluate-batch', () => {
      it('should evaluate policies in batch', async () => {
        const response = await request(app)
          .post('/api/security/compliance-as-code/policies/evaluate-batch')
          .send({
            policyIds: ['policy-1', 'policy-2'],
            input: {},
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    describe('POST /api/security/compliance-as-code/reports/generate', () => {
      it('should generate compliance report', async () => {
        const response = await request(app)
          .post('/api/security/compliance-as-code/reports/generate')
          .send({
            framework: 'SOC2',
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    describe('GET /api/security/compliance-as-code/reports', () => {
      it('should list compliance reports', async () => {
        const response = await request(app)
          .get('/api/security/compliance-as-code/reports')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/security/compliance-as-code/ci-cd/webhook', () => {
      it('should handle CI/CD webhook', async () => {
        const response = await request(app)
          .post('/api/security/compliance-as-code/ci-cd/webhook')
          .send({
            provider: 'github',
            event: 'deployment',
            payload: { commit: 'abc123' },
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    describe('GET /api/security/compliance-as-code/ci-cd/integrations', () => {
      it('should list CI/CD integrations', async () => {
        const response = await request(app)
          .get('/api/security/compliance-as-code/ci-cd/integrations')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/security/compliance-as-code/ci-cd/integrations', () => {
      it('should create CI/CD integration', async () => {
        const response = await request(app)
          .post('/api/security/compliance-as-code/ci-cd/integrations')
          .send({
            provider: 'github',
            repository: 'org/repo',
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    describe('POST /api/security/compliance-as-code/drift/detect', () => {
      it('should detect configuration drift', async () => {
        const response = await request(app)
          .post('/api/security/compliance-as-code/drift/detect')
          .send({
            policyId: 'policy-123',
          });

        expect([200, 201]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });
  });
});
