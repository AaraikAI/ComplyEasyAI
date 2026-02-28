/**
 * E2E Tests - Privacy Compliance Flow
 * Tests complete privacy workflows including DSAR, consent management,
 * data retention, cross-border transfers, and privacy impact assessments.
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

jest.mock('../../services/emailService', () => ({
  __esModule: true,
  default: {
    sendDSARConfirmation: jest.fn().mockResolvedValue(true),
    sendDSARComplete: jest.fn().mockResolvedValue(true),
  },
}));

import privacyRoutes from '../../routes/privacy';
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
app.use('/api/privacy', privacyRoutes);
app.use(errorHandler);

describe('E2E: Privacy Compliance Flow', () => {
  const mockDSAR = {
    id: 'dsar-123',
    type: 'Access',
    subjectName: 'John Doe',
    subjectEmail: 'john@example.com',
    status: 'Received',
    organizationId: 'org-123',
    receivedAt: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };

  const mockConsent = {
    id: 'consent-123',
    subjectId: 'subject-123',
    purpose: 'Marketing',
    status: 'Active',
    givenAt: new Date(),
    organizationId: 'org-123',
  };

  const mockRetentionPolicy = {
    id: 'ret-123',
    dataCategory: 'Customer Data',
    retentionPeriod: 730, // days
    legalBasis: 'Contract',
    status: 'Active',
    organizationId: 'org-123',
  };

  const mockPIA = {
    id: 'pia-123',
    name: 'New Marketing System PIA',
    status: 'In Progress',
    riskLevel: 'High',
    organizationId: 'org-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DSAR (Data Subject Access Request) Workflow', () => {
    it('should complete full DSAR lifecycle', async () => {
      // Step 1: Receive DSAR
      prismaMock.dsar.create.mockResolvedValue(mockDSAR as any);

      const receiveResponse = await request(app)
        .post('/api/privacy/dsar')
        .send({
          type: 'Access',
          subjectName: 'John Doe',
          subjectEmail: 'john@example.com',
          description: 'Request for all personal data',
        })
        .expect(201);

      expect(receiveResponse.body).toHaveProperty('id');
      const dsarId = receiveResponse.body.id;

      // Step 2: Verify identity
      prismaMock.dsar.findFirst.mockResolvedValue(mockDSAR as any);
      prismaMock.dsar.update.mockResolvedValue({
        ...mockDSAR,
        status: 'Identity Verified',
        identityVerifiedAt: new Date(),
      } as any);

      const verifyResponse = await request(app)
        .post(`/api/privacy/dsar/${dsarId}/verify-identity`)
        .send({
          verificationMethod: 'Email',
          verified: true,
        })
        .expect(200);

      expect(verifyResponse.body.status).toBe('Identity Verified');

      // Step 3: Collect data from systems
      prismaMock.dsarDataCollection.create.mockResolvedValue({
        id: 'collect-123',
        dsarId,
        system: 'CRM',
        status: 'Completed',
        data: { records: 50 },
      } as any);

      const collectResponse = await request(app)
        .post(`/api/privacy/dsar/${dsarId}/collect`)
        .send({
          systems: ['CRM', 'Marketing', 'Support'],
        })
        .expect(200);

      expect(collectResponse.body).toHaveProperty('collections');

      // Step 4: Generate response
      prismaMock.dsar.update.mockResolvedValue({
        ...mockDSAR,
        status: 'Response Ready',
        responseData: { dataPackage: 'url' },
      } as any);

      const generateResponse = await request(app)
        .post(`/api/privacy/dsar/${dsarId}/generate-response`)
        .expect(200);

      expect(generateResponse.body).toHaveProperty('responseData');

      // Step 5: Complete DSAR
      prismaMock.dsar.update.mockResolvedValue({
        ...mockDSAR,
        status: 'Completed',
        completedAt: new Date(),
      } as any);

      const completeResponse = await request(app)
        .post(`/api/privacy/dsar/${dsarId}/complete`)
        .send({ deliveryMethod: 'SecureLink' })
        .expect(200);

      expect(completeResponse.body.status).toBe('Completed');
    });

    it('should handle deletion request', async () => {
      const deletionDSAR = { ...mockDSAR, type: 'Deletion' };
      prismaMock.dsar.create.mockResolvedValue(deletionDSAR as any);

      const response = await request(app)
        .post('/api/privacy/dsar')
        .send({
          type: 'Deletion',
          subjectName: 'John Doe',
          subjectEmail: 'john@example.com',
          scope: 'All personal data',
        })
        .expect(201);

      expect(response.body.type).toBe('Deletion');
    });

    it('should extend DSAR deadline', async () => {
      prismaMock.dsar.findFirst.mockResolvedValue(mockDSAR as any);
      prismaMock.dsar.update.mockResolvedValue({
        ...mockDSAR,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        extensionReason: 'Complex request',
      } as any);

      const response = await request(app)
        .post('/api/privacy/dsar/dsar-123/extend')
        .send({
          extensionDays: 30,
          reason: 'Complex request requiring additional time',
        })
        .expect(200);

      expect(response.body).toHaveProperty('extensionReason');
    });
  });

  describe('Consent Management Workflow', () => {
    it('should manage consent lifecycle', async () => {
      // Record consent
      prismaMock.consent.create.mockResolvedValue(mockConsent as any);

      const giveResponse = await request(app)
        .post('/api/privacy/consent')
        .send({
          subjectId: 'subject-123',
          purpose: 'Marketing',
          legalBasis: 'Consent',
          evidence: 'Web form submission',
        })
        .expect(201);

      expect(giveResponse.body).toHaveProperty('id');

      // Check consent status
      prismaMock.consent.findMany.mockResolvedValue([mockConsent] as any);

      const checkResponse = await request(app)
        .get('/api/privacy/consent')
        .query({ subjectId: 'subject-123' })
        .expect(200);

      expect(Array.isArray(checkResponse.body)).toBe(true);

      // Withdraw consent
      prismaMock.consent.findFirst.mockResolvedValue(mockConsent as any);
      prismaMock.consent.update.mockResolvedValue({
        ...mockConsent,
        status: 'Withdrawn',
        withdrawnAt: new Date(),
      } as any);

      const withdrawResponse = await request(app)
        .post('/api/privacy/consent/consent-123/withdraw')
        .expect(200);

      expect(withdrawResponse.body.status).toBe('Withdrawn');
    });

    it('should track consent preferences', async () => {
      prismaMock.consentPreference.findMany.mockResolvedValue([
        { purpose: 'Marketing', consented: true },
        { purpose: 'Analytics', consented: false },
        { purpose: 'Personalization', consented: true },
      ] as any);

      const response = await request(app)
        .get('/api/privacy/consent/preferences')
        .query({ subjectId: 'subject-123' })
        .expect(200);

      expect(response.body).toHaveProperty('preferences');
    });
  });

  describe('Data Retention Workflow', () => {
    it('should manage retention policies', async () => {
      prismaMock.retentionPolicy.create.mockResolvedValue(mockRetentionPolicy as any);

      const response = await request(app)
        .post('/api/privacy/retention-policies')
        .send({
          dataCategory: 'Customer Data',
          retentionPeriod: 730,
          legalBasis: 'Contract',
          automaticDeletion: true,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should identify data for deletion', async () => {
      prismaMock.retentionPolicy.findMany.mockResolvedValue([mockRetentionPolicy] as any);

      const response = await request(app)
        .get('/api/privacy/retention/due-for-deletion')
        .expect(200);

      expect(response.body).toHaveProperty('records');
    });

    it('should execute retention cleanup', async () => {
      prismaMock.retentionPolicy.findMany.mockResolvedValue([mockRetentionPolicy] as any);

      const response = await request(app)
        .post('/api/privacy/retention/execute')
        .send({
          dryRun: false,
          categories: ['Customer Data'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('deletedCount');
    });
  });

  describe('Cross-Border Transfer Workflow', () => {
    const mockSCC = {
      id: 'scc-123',
      exporterName: 'Company A',
      importerName: 'Company B',
      importerCountry: 'US',
      mechanism: 'SCC',
      status: 'Active',
    };

    const mockTIA = {
      id: 'tia-123',
      transferId: 'scc-123',
      status: 'Completed',
      riskAssessment: { overallRisk: 'Medium' },
    };

    it('should manage cross-border transfers', async () => {
      prismaMock.crossBorderTransfer.create.mockResolvedValue(mockSCC as any);

      const response = await request(app)
        .post('/api/privacy/cross-border')
        .send({
          exporterName: 'Company A',
          importerName: 'Company B',
          importerCountry: 'US',
          mechanism: 'SCC',
          dataCategories: ['Customer Data'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should perform Transfer Impact Assessment', async () => {
      prismaMock.crossBorderTransfer.findFirst.mockResolvedValue(mockSCC as any);
      prismaMock.tia.create.mockResolvedValue(mockTIA as any);

      const response = await request(app)
        .post('/api/privacy/cross-border/scc-123/tia')
        .send({
          assessmentDate: new Date(),
          factors: {
            localLaws: 'Medium',
            dataProtection: 'High',
            accessByAuthorities: 'Low',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('riskAssessment');
    });

    it('should manage BCR program', async () => {
      prismaMock.bcr.create.mockResolvedValue({
        id: 'bcr-123',
        type: 'Controller',
        status: 'Approved',
        approvedBy: 'DPA',
        organizationId: 'org-123',
      } as any);

      const response = await request(app)
        .post('/api/privacy/bcr')
        .send({
          type: 'Controller',
          groupEntities: ['Entity A', 'Entity B'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Privacy Impact Assessment Workflow', () => {
    it('should conduct PIA', async () => {
      // Create PIA
      prismaMock.pia.create.mockResolvedValue(mockPIA as any);

      const createResponse = await request(app)
        .post('/api/privacy/pia')
        .send({
          name: 'New Marketing System PIA',
          projectDescription: 'Implementing new marketing automation',
          dataTypes: ['Customer Data', 'Behavioral Data'],
        })
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      const piaId = createResponse.body.id;

      // Add risk assessment
      prismaMock.pia.findFirst.mockResolvedValue(mockPIA as any);
      prismaMock.pia.update.mockResolvedValue({
        ...mockPIA,
        risks: [
          { type: 'Data Breach', likelihood: 'Low', impact: 'High', mitigation: 'Encryption' },
        ],
      } as any);

      const assessResponse = await request(app)
        .post(`/api/privacy/pia/${piaId}/assess`)
        .send({
          risks: [
            { type: 'Data Breach', likelihood: 'Low', impact: 'High', mitigation: 'Encryption' },
          ],
        })
        .expect(200);

      expect(assessResponse.body).toHaveProperty('risks');

      // Complete PIA
      prismaMock.pia.update.mockResolvedValue({
        ...mockPIA,
        status: 'Completed',
        recommendation: 'Proceed with mitigations',
      } as any);

      const completeResponse = await request(app)
        .post(`/api/privacy/pia/${piaId}/complete`)
        .send({
          recommendation: 'Proceed with mitigations',
          approvedBy: 'DPO',
        })
        .expect(200);

      expect(completeResponse.body.status).toBe('Completed');
    });

    it('should require DPIA for high-risk processing', async () => {
      const response = await request(app)
        .post('/api/privacy/pia/check-requirement')
        .send({
          processingActivities: ['Profiling', 'Automated Decision Making'],
          dataCategories: ['Special Category'],
          scale: 'Large',
        })
        .expect(200);

      expect(response.body).toHaveProperty('dpiaRequired');
      expect(response.body.dpiaRequired).toBe(true);
    });
  });

  describe('Privacy Dashboard', () => {
    it('should get privacy compliance dashboard', async () => {
      prismaMock.dsar.count.mockResolvedValue(10);
      prismaMock.consent.count.mockResolvedValue(1000);
      prismaMock.pia.findMany.mockResolvedValue([mockPIA] as any);

      const response = await request(app)
        .get('/api/privacy/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('dsarMetrics');
      expect(response.body).toHaveProperty('consentMetrics');
      expect(response.body).toHaveProperty('piaStatus');
    });

    it('should get GDPR compliance score', async () => {
      const response = await request(app)
        .get('/api/privacy/compliance-score')
        .expect(200);

      expect(response.body).toHaveProperty('overallScore');
      expect(response.body).toHaveProperty('categories');
    });
  });
});
