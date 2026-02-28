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

// Mock security services
jest.mock('../../../services/advanced/zeroTrustService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue(undefined),
    generateDeviceFingerprint: jest.fn().mockReturnValue('fp-123'),
    verifyDeviceTrust: jest.fn().mockResolvedValue({ trusted: true, trustScore: 95 }),
    evaluateAccessRequest: jest.fn().mockResolvedValue({ allowed: true, reason: 'Access granted' }),
    createPolicy: jest.fn().mockResolvedValue({ id: 'policy-123', name: 'Default Policy' }),
    getPolicies: jest.fn().mockResolvedValue([]),
    getPolicy: jest.fn().mockResolvedValue({ id: 'policy-123' }),
    updatePolicy: jest.fn().mockResolvedValue({ id: 'policy-123', updated: true }),
    deletePolicy: jest.fn().mockResolvedValue({ success: true }),
    getDeviceTrusts: jest.fn().mockResolvedValue([]),
    getDeviceTrust: jest.fn().mockResolvedValue({ deviceId: 'device-123', trustScore: 95 }),
    createNetworkSegment: jest.fn().mockResolvedValue({ segmentId: 'segment-123' }),
    getNetworkSegments: jest.fn().mockResolvedValue([]),
    continuousVerification: jest.fn().mockResolvedValue({ verified: true }),
  },
}));

jest.mock('../../../services/advanced/zeroKnowledgeService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue(undefined),
    generateComplianceProof: jest.fn().mockResolvedValue({ proofId: 'proof-123', proof: 'zkproof' }),
    verifyComplianceProof: jest.fn().mockResolvedValue({ valid: true }),
    generateCredentialProof: jest.fn().mockResolvedValue({ proofId: 'proof-123' }),
    verifyCredentialProof: jest.fn().mockResolvedValue({ valid: true }),
    generateOwnershipProof: jest.fn().mockResolvedValue({ proofId: 'proof-123' }),
    verifyOwnershipProof: jest.fn().mockResolvedValue({ valid: true }),
    getProofs: jest.fn().mockResolvedValue([]),
    getProof: jest.fn().mockResolvedValue({ proofId: 'proof-123' }),
  },
}));

jest.mock('../../../services/advanced/byokService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue(undefined),
    generateKey: jest.fn().mockResolvedValue({ keyId: 'key-123', publicKey: 'pk' }),
    importKey: jest.fn().mockResolvedValue({ keyId: 'key-123' }),
    getKeys: jest.fn().mockResolvedValue([]),
    getKey: jest.fn().mockResolvedValue({ keyId: 'key-123' }),
    rotateKey: jest.fn().mockResolvedValue({ keyId: 'key-123', rotated: true }),
    deleteKey: jest.fn().mockResolvedValue({ success: true }),
    encrypt: jest.fn().mockResolvedValue({ ciphertext: 'encrypted' }),
    decrypt: jest.fn().mockResolvedValue({ plaintext: 'decrypted' }),
    getConfig: jest.fn().mockResolvedValue({ algorithm: 'AES-256-GCM' }),
    updateConfig: jest.fn().mockResolvedValue({ updated: true }),
  },
}));

jest.mock('../../../services/advanced/complianceAsCodeService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue(undefined),
    createPolicy: jest.fn().mockResolvedValue({ policyId: 'policy-123' }),
    getPolicies: jest.fn().mockResolvedValue([]),
    getPolicy: jest.fn().mockResolvedValue({ policyId: 'policy-123' }),
    updatePolicy: jest.fn().mockResolvedValue({ policyId: 'policy-123', updated: true }),
    deletePolicy: jest.fn().mockResolvedValue({ success: true }),
    evaluatePolicy: jest.fn().mockResolvedValue({ passed: true, violations: [] }),
    evaluateBatch: jest.fn().mockResolvedValue({ results: [] }),
    generateReport: jest.fn().mockResolvedValue({ reportId: 'report-123' }),
    getReports: jest.fn().mockResolvedValue([]),
    getReport: jest.fn().mockResolvedValue({ reportId: 'report-123' }),
    handleCICDWebhook: jest.fn().mockResolvedValue({ processed: true }),
    getCICDIntegrations: jest.fn().mockResolvedValue([]),
    createCICDIntegration: jest.fn().mockResolvedValue({ integrationId: 'int-123' }),
    deleteCICDIntegration: jest.fn().mockResolvedValue({ success: true }),
    detectDrift: jest.fn().mockResolvedValue({ drifts: [] }),
  },
}));

// Setup app
let app: Express;

beforeEach(async () => {
  jest.clearAllMocks();

  app = express();
  app.use(express.json());

  const securityRoutes = (await import('../../../routes/security')).default;
  app.use('/api/security', securityRoutes);
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
            deviceFingerprint: 'fp-abc123',
          })
          .expect(200);

        expect(response.body).toHaveProperty('trusted');
        expect(response.body).toHaveProperty('trustScore');
      });
    });

    describe('POST /api/security/zero-trust/evaluate-access', () => {
      it('should evaluate access request', async () => {
        const response = await request(app)
          .post('/api/security/zero-trust/evaluate-access')
          .send({
            resource: 'sensitive-data',
            action: 'read',
            context: { deviceId: 'device-123' },
          })
          .expect(200);

        expect(response.body).toHaveProperty('allowed');
        expect(response.body).toHaveProperty('reason');
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
          })
          .expect(200);

        expect(response.body).toHaveProperty('id');
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
          .send({ enforcement: 'lenient' })
          .expect(200);

        expect(response.body).toHaveProperty('updated');
      });
    });

    describe('DELETE /api/security/zero-trust/policies/:policyId', () => {
      it('should delete zero trust policy', async () => {
        const response = await request(app)
          .delete('/api/security/zero-trust/policies/policy-123')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
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
          })
          .expect(200);

        expect(response.body).toHaveProperty('segmentId');
      });
    });

    describe('POST /api/security/zero-trust/continuous-verify', () => {
      it('should perform continuous verification', async () => {
        const response = await request(app)
          .post('/api/security/zero-trust/continuous-verify')
          .send({ sessionId: 'session-123' })
          .expect(200);

        expect(response.body).toHaveProperty('verified');
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
            claims: ['compliant', 'certified'],
          })
          .expect(200);

        expect(response.body).toHaveProperty('proofId');
        expect(response.body).toHaveProperty('proof');
      });
    });

    describe('POST /api/security/zkp/compliance-proof/verify', () => {
      it('should verify compliance proof', async () => {
        const response = await request(app)
          .post('/api/security/zkp/compliance-proof/verify')
          .send({
            proofId: 'proof-123',
            proof: 'zkproof',
          })
          .expect(200);

        expect(response.body).toHaveProperty('valid');
      });
    });

    describe('POST /api/security/zkp/credential-proof/generate', () => {
      it('should generate credential proof', async () => {
        const response = await request(app)
          .post('/api/security/zkp/credential-proof/generate')
          .send({
            credentialType: 'certification',
            attributes: ['name', 'expiry'],
          })
          .expect(200);

        expect(response.body).toHaveProperty('proofId');
      });
    });

    describe('POST /api/security/zkp/ownership-proof/generate', () => {
      it('should generate ownership proof', async () => {
        const response = await request(app)
          .post('/api/security/zkp/ownership-proof/generate')
          .send({
            assetId: 'asset-123',
            ownershipClaim: 'full',
          })
          .expect(200);

        expect(response.body).toHaveProperty('proofId');
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
      it('should generate BYOK key', async () => {
        const response = await request(app)
          .post('/api/security/byok/keys/generate')
          .send({
            algorithm: 'AES-256-GCM',
            keySize: 256,
          })
          .expect(200);

        expect(response.body).toHaveProperty('keyId');
      });
    });

    describe('POST /api/security/byok/keys/import', () => {
      it('should import BYOK key', async () => {
        const response = await request(app)
          .post('/api/security/byok/keys/import')
          .send({
            keyMaterial: 'base64-encoded-key',
            algorithm: 'AES-256-GCM',
          })
          .expect(200);

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
          .expect(200);

        expect(response.body).toHaveProperty('rotated', true);
      });
    });

    describe('DELETE /api/security/byok/keys/:keyId', () => {
      it('should delete BYOK key', async () => {
        const response = await request(app)
          .delete('/api/security/byok/keys/key-123')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('POST /api/security/byok/encrypt', () => {
      it('should encrypt data with BYOK', async () => {
        const response = await request(app)
          .post('/api/security/byok/encrypt')
          .send({
            keyId: 'key-123',
            plaintext: 'sensitive data',
          })
          .expect(200);

        expect(response.body).toHaveProperty('ciphertext');
      });
    });

    describe('POST /api/security/byok/decrypt', () => {
      it('should decrypt data with BYOK', async () => {
        const response = await request(app)
          .post('/api/security/byok/decrypt')
          .send({
            keyId: 'key-123',
            ciphertext: 'encrypted-data',
          })
          .expect(200);

        expect(response.body).toHaveProperty('plaintext');
      });
    });

    describe('GET /api/security/byok/config', () => {
      it('should get BYOK configuration', async () => {
        const response = await request(app)
          .get('/api/security/byok/config')
          .expect(200);

        expect(response.body).toHaveProperty('algorithm');
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
          })
          .expect(200);

        expect(response.body).toHaveProperty('policyId');
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
            target: 'infrastructure',
            context: {},
          })
          .expect(200);

        expect(response.body).toHaveProperty('passed');
        expect(response.body).toHaveProperty('violations');
      });
    });

    describe('POST /api/security/compliance-as-code/policies/evaluate-batch', () => {
      it('should evaluate policies in batch', async () => {
        const response = await request(app)
          .post('/api/security/compliance-as-code/policies/evaluate-batch')
          .send({
            policyIds: ['policy-1', 'policy-2'],
            target: 'all',
          })
          .expect(200);

        expect(response.body).toHaveProperty('results');
      });
    });

    describe('POST /api/security/compliance-as-code/reports/generate', () => {
      it('should generate compliance report', async () => {
        const response = await request(app)
          .post('/api/security/compliance-as-code/reports/generate')
          .send({
            scope: 'all',
            format: 'pdf',
          })
          .expect(200);

        expect(response.body).toHaveProperty('reportId');
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
            event: 'deployment',
            payload: { commit: 'abc123' },
          })
          .expect(200);

        expect(response.body).toHaveProperty('processed');
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
            type: 'github-actions',
            config: { repoUrl: 'https://github.com/org/repo' },
          })
          .expect(200);

        expect(response.body).toHaveProperty('integrationId');
      });
    });

    describe('POST /api/security/compliance-as-code/drift/detect', () => {
      it('should detect configuration drift', async () => {
        const response = await request(app)
          .post('/api/security/compliance-as-code/drift/detect')
          .send({
            scope: 'infrastructure',
          })
          .expect(200);

        expect(response.body).toHaveProperty('drifts');
      });
    });
  });
});
