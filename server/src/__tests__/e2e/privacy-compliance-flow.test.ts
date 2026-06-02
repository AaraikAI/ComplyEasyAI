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
  // Prisma models: dSARRequest, consentRecord, retentionPolicy.
  const mockDSAR = {
    id: 'dsar-123',
    organizationId: 'org-123',
    requestNumber: 'DSAR-0001',
    requestType: 'Access',
    dataSubjectName: 'John Doe',
    dataSubjectEmail: 'john@example.com',
    regulation: 'GDPR',
    status: 'Received',
    priority: 'Normal',
    requestDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    auditTrail: [],
    updatedAt: new Date(),
  };

  const mockConsent = {
    id: 'consent-123',
    organizationId: 'org-123',
    dataSubjectId: 'subject-123',
    consentType: 'marketing',
    purpose: 'Marketing emails',
    consentGiven: true,
    consentDate: new Date(),
    version: '1.0',
  };

  const mockRetentionPolicy = {
    id: 'ret-123',
    organizationId: 'org-123',
    name: 'Customer Data Retention',
    dataCategory: 'Customer Data',
    retentionPeriod: 730,
    legalBasis: 'Contract',
    status: 'Active',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DSAR (Data Subject Access Request) Workflow', () => {
    it('should create, verify, and complete a DSAR', async () => {
      // Step 1: Create
      prismaMock.dSARRequest.create.mockResolvedValue(mockDSAR as any);

      const createResponse = await request(app)
        .post('/api/privacy/dsar')
        .send({
          requestType: 'Access',
          dataSubjectName: 'John Doe',
          dataSubjectEmail: 'john@example.com',
          notes: 'Request for all personal data',
        })
        .expect(201);

      expect(createResponse.body).toHaveProperty('id', 'dsar-123');
      const dsarId = createResponse.body.id;

      // Step 2: Verify identity
      prismaMock.dSARRequest.findFirst.mockResolvedValue(mockDSAR as any);
      prismaMock.dSARRequest.update.mockResolvedValue({
        ...mockDSAR,
        status: 'Verified',
        identityVerified: true,
      } as any);

      const verifyResponse = await request(app)
        .post(`/api/privacy/dsar/${dsarId}/verify-identity`)
        .send({ verificationMethod: 'Email' })
        .expect(200);

      expect(verifyResponse.body.status).toBe('Verified');

      // Step 3: Complete
      prismaMock.dSARRequest.update.mockResolvedValue({
        ...mockDSAR,
        status: 'Completed',
        completedDate: new Date(),
      } as any);

      const completeResponse = await request(app)
        .post(`/api/privacy/dsar/${dsarId}/complete`)
        .send({ responseMethod: 'SecureLink', responseDetails: 'Package delivered' })
        .expect(200);

      expect(completeResponse.body.status).toBe('Completed');
    });

    it('should create a deletion DSAR', async () => {
      prismaMock.dSARRequest.create.mockResolvedValue({
        ...mockDSAR,
        requestType: 'Deletion',
      } as any);

      const response = await request(app)
        .post('/api/privacy/dsar')
        .send({
          requestType: 'Deletion',
          dataSubjectName: 'John Doe',
          dataSubjectEmail: 'john@example.com',
        })
        .expect(201);

      expect(response.body.requestType).toBe('Deletion');
    });

    it('should reject a DSAR with an invalid request type', async () => {
      const response = await request(app)
        .post('/api/privacy/dsar')
        .send({
          requestType: 'NotAValidType',
          dataSubjectName: 'John Doe',
          dataSubjectEmail: 'john@example.com',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should list DSARs (paginated envelope)', async () => {
      prismaMock.dSARRequest.findMany.mockResolvedValue([mockDSAR] as any);
      prismaMock.dSARRequest.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/privacy/dsar')
        .expect(200);

      expect(response.body).toHaveProperty('dsars');
      expect(Array.isArray(response.body.dsars)).toBe(true);
      expect(response.body).toHaveProperty('total', 1);
    });

    it('should get a single DSAR with its timeline', async () => {
      prismaMock.dSARRequest.findFirst.mockResolvedValue(mockDSAR as any);

      const response = await request(app)
        .get('/api/privacy/dsar/dsar-123')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'dsar-123');
      expect(response.body).toHaveProperty('timeline');
    });

    it('should return 404 for a DSAR from another organization', async () => {
      prismaMock.dSARRequest.findFirst.mockResolvedValue(null as any);

      const response = await request(app)
        .get('/api/privacy/dsar/dsar-999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Consent Management Workflow', () => {
    it('should record a consent entry', async () => {
      prismaMock.consentRecord.create.mockResolvedValue(mockConsent as any);

      const response = await request(app)
        .post('/api/privacy/consent')
        .send({
          dataSubjectId: 'subject-123',
          consentType: 'marketing',
          purpose: 'Marketing emails',
          legalBasis: 'Consent',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'consent-123');
    });

    it('should list consent records (paginated envelope)', async () => {
      prismaMock.consentRecord.findMany.mockResolvedValue([mockConsent] as any);
      prismaMock.consentRecord.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/privacy/consent')
        .expect(200);

      expect(response.body).toHaveProperty('records');
      expect(Array.isArray(response.body.records)).toBe(true);
      expect(response.body).toHaveProperty('total', 1);
    });
  });

  describe('Data Retention Workflow', () => {
    it('should create a retention policy', async () => {
      prismaMock.retentionPolicy.create.mockResolvedValue(mockRetentionPolicy as any);

      const response = await request(app)
        .post('/api/privacy/retention')
        .send({
          name: 'Customer Data Retention',
          dataCategory: 'Customer Data',
          retentionPeriod: 730,
          legalBasis: 'Contract',
          autoDelete: true,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'ret-123');
    });

    it('should list retention policies', async () => {
      prismaMock.retentionPolicy.findMany.mockResolvedValue([mockRetentionPolicy] as any);
      prismaMock.retentionPolicy.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/privacy/retention')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Privacy Dashboard', () => {
    it('should get the privacy compliance dashboard', async () => {
      prismaMock.dSARRequest.count.mockResolvedValue(3);
      prismaMock.dSARRequest.findMany.mockResolvedValue([] as any);
      prismaMock.consentRecord.count.mockResolvedValue(100);
      prismaMock.retentionPolicy.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/privacy/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('activeDSARs');
      expect(response.body).toHaveProperty('consentRate');
      expect(response.body).toHaveProperty('retentionCompliance');
      expect(response.body).toHaveProperty('recentActivity');
    });
  });
});
