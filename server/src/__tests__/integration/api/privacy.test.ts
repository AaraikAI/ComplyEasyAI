/**
 * Privacy Routes Integration Tests
 *
 * Tests for comprehensive privacy management including DSAR, consent,
 * retention, SCC/TIA, BCR, and more.
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
      email: 'test@example.com',
      name: 'Test User',
      organizationId: 'org-123',
      role: 'Admin',
    };
    next();
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../../middleware/tierMiddleware', () => ({
  requireVisionaryFeature: () => [(req: any, res: any, next: any) => next()],
}));

jest.mock('../../../config/monitoring', () => ({
  __esModule: true,
  default: { captureException: jest.fn() },
}));

jest.mock('../../../utils/securityEventLogger', () => ({
  logSecurityEvent: jest.fn(),
  SecurityEventType: { AUTHENTICATION_FAILURE: 'AUTHENTICATION_FAILURE', AUTHORIZATION_FAILURE: 'AUTHORIZATION_FAILURE' },
}));

// Mock data factories
const createMockDSARRequest = (overrides: Record<string, unknown> = {}) => ({
  id: 'dsar-123',
  organizationId: 'org-123',
  requestNumber: 'DSAR-ABC-1234',
  requestType: 'Access',
  dataSubjectEmail: 'user@example.com',
  dataSubjectName: 'John Doe',
  status: 'Received',
  requestDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  regulation: 'GDPR',
  priority: 'Normal',
  auditTrail: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockConsentRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'consent-123',
  organizationId: 'org-123',
  dataSubjectId: 'user-456',
  purpose: 'Marketing',
  consentGiven: true,
  consentDate: new Date(),
  status: 'Active',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockRetentionPolicy = (overrides: Record<string, unknown> = {}) => ({
  id: 'retention-123',
  organizationId: 'org-123',
  name: 'Customer Data Retention',
  dataCategory: 'Personal Data',
  retentionPeriod: 36,
  retentionUnit: 'months',
  legalBasis: 'Contract',
  status: 'Active',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Setup app
let app: Express;

beforeEach(async () => {
  jest.clearAllMocks();

  app = express();
  app.use(express.json());

  const privacyRoutes = (await import('../../../routes/privacy')).default;
  app.use('/api/privacy', privacyRoutes);

  // Add error handler so AppError responses are properly serialized
  const { errorHandler } = await import('../../../middleware/errorHandler');
  app.use(errorHandler);
});

describe('Privacy Routes Integration', () => {
  // ===========================================================================
  // Dashboard Tests
  // ===========================================================================
  describe('Dashboard', () => {
    describe('GET /api/privacy/dashboard', () => {
      it('should return privacy dashboard data', async () => {
        prismaMock.dSARRequest.count.mockResolvedValue(10);
        prismaMock.dSARRequest.findMany.mockResolvedValue([]);
        prismaMock.consentRecord.count.mockResolvedValue(1000);
        prismaMock.retentionPolicy.count.mockResolvedValue(5);

        const response = await request(app)
          .get('/api/privacy/dashboard')
          .expect(200);

        expect(response.body).toBeDefined();
      });
    });
  });

  // ===========================================================================
  // DSAR Tests
  // ===========================================================================
  describe('DSAR (Data Subject Access Requests)', () => {
    describe('GET /api/privacy/dsar', () => {
      it('should list DSAR requests with pagination', async () => {
        const mockRequests = [createMockDSARRequest(), createMockDSARRequest({ id: 'dsar-456' })];
        prismaMock.dSARRequest.findMany.mockResolvedValue(mockRequests as any);
        prismaMock.dSARRequest.count.mockResolvedValue(2);

        const response = await request(app)
          .get('/api/privacy/dsar')
          .expect(200);

        expect(response.body).toHaveProperty('dsars');
        expect(response.body).toHaveProperty('total');
      });

      it('should filter by status', async () => {
        prismaMock.dSARRequest.findMany.mockResolvedValue([]);
        prismaMock.dSARRequest.count.mockResolvedValue(0);

        await request(app)
          .get('/api/privacy/dsar?status=Pending')
          .expect(200);

        expect(prismaMock.dSARRequest.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'Pending',
            }),
          })
        );
      });

      it('should filter by request type', async () => {
        prismaMock.dSARRequest.findMany.mockResolvedValue([]);
        prismaMock.dSARRequest.count.mockResolvedValue(0);

        await request(app)
          .get('/api/privacy/dsar?type=Access')
          .expect(200);

        expect(prismaMock.dSARRequest.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              requestType: 'Access',
            }),
          })
        );
      });
    });

    describe('POST /api/privacy/dsar', () => {
      it('should create DSAR request', async () => {
        const mockRequest = createMockDSARRequest();
        prismaMock.dSARRequest.create.mockResolvedValue(mockRequest as any);

        const response = await request(app)
          .post('/api/privacy/dsar')
          .send({
            requestType: 'Access',
            dataSubjectEmail: 'user@example.com',
            dataSubjectName: 'John Doe',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });

    describe('GET /api/privacy/dsar/:id', () => {
      it('should get DSAR request by ID', async () => {
        const mockRequest = createMockDSARRequest();
        prismaMock.dSARRequest.findFirst.mockResolvedValue(mockRequest as any);

        const response = await request(app)
          .get('/api/privacy/dsar/dsar-123')
          .expect(200);

        expect(response.body.id).toBe('dsar-123');
      });

      it('should return 404 for non-existent request', async () => {
        prismaMock.dSARRequest.findFirst.mockResolvedValue(null);

        await request(app)
          .get('/api/privacy/dsar/nonexistent')
          .expect(404);
      });
    });

    describe('PATCH /api/privacy/dsar/:id', () => {
      it('should update DSAR request', async () => {
        const mockRequest = createMockDSARRequest();
        const updatedRequest = { ...mockRequest, status: 'In_Progress' };

        prismaMock.dSARRequest.findFirst.mockResolvedValue(mockRequest as any);
        prismaMock.dSARRequest.update.mockResolvedValue(updatedRequest as any);

        const response = await request(app)
          .patch('/api/privacy/dsar/dsar-123')
          .send({ status: 'In_Progress' })
          .expect(200);

        expect(response.body.status).toBe('In_Progress');
      });
    });
  });

  // ===========================================================================
  // Consent Management Tests
  // ===========================================================================
  describe('Consent Management', () => {
    describe('GET /api/privacy/consent', () => {
      it('should list consent records with pagination', async () => {
        const mockRecords = [createMockConsentRecord()];
        prismaMock.consentRecord.findMany.mockResolvedValue(mockRecords as any);
        prismaMock.consentRecord.count.mockResolvedValue(1);

        const response = await request(app)
          .get('/api/privacy/consent')
          .expect(200);

        expect(response.body).toHaveProperty('records');
        expect(response.body).toHaveProperty('total');
      });
    });

    describe('POST /api/privacy/consent', () => {
      it('should create consent record', async () => {
        const mockRecord = createMockConsentRecord();
        prismaMock.consentRecord.create.mockResolvedValue(mockRecord as any);

        const response = await request(app)
          .post('/api/privacy/consent')
          .send({
            dataSubjectId: 'user-456',
            consentType: 'Marketing',
            purpose: 'Email marketing communications',
            consentGiven: true,
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });

    describe('PATCH /api/privacy/consent/:id', () => {
      it('should withdraw consent', async () => {
        const mockRecord = createMockConsentRecord({ consentGiven: true });
        const withdrawnRecord = { ...mockRecord, consentGiven: false, withdrawnAt: new Date() };

        prismaMock.consentRecord.findFirst.mockResolvedValue(mockRecord as any);
        prismaMock.consentRecord.update.mockResolvedValue(withdrawnRecord as any);

        const response = await request(app)
          .patch('/api/privacy/consent/consent-123')
          .send({ consentGiven: false })
          .expect(200);

        expect(response.body.consentGiven).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Consent Preferences Tests
  // ===========================================================================
  describe('Consent Preferences', () => {
    describe('GET /api/privacy/consent/preferences', () => {
      it('should get consent preferences', async () => {
        prismaMock.consentPreference.findMany.mockResolvedValue([]);
        prismaMock.consentPreference.count.mockResolvedValue(0);

        const response = await request(app)
          .get('/api/privacy/consent/preferences')
          .expect(200);

        expect(response.body).toBeDefined();
      });
    });

    describe('PUT /api/privacy/consent/preferences/:dataSubjectId', () => {
      it('should update consent preferences', async () => {
        const updatedPreferences = {
          id: 'pref-123',
          dataSubjectId: 'user-456',
          marketing: false,
          analytics: true,
        };

        prismaMock.consentPreference.upsert.mockResolvedValue(updatedPreferences as any);

        const response = await request(app)
          .put('/api/privacy/consent/preferences/user-456')
          .send({
            preferences: { marketing: false, analytics: true },
            marketingOptOut: true,
          })
          .expect(200);

        expect(response.body.marketing).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Retention Policy Tests
  // ===========================================================================
  describe('Retention Policies', () => {
    describe('GET /api/privacy/retention', () => {
      it('should list retention policies with pagination', async () => {
        const mockPolicies = [createMockRetentionPolicy()];
        prismaMock.retentionPolicy.findMany.mockResolvedValue(mockPolicies as any);
        prismaMock.retentionPolicy.count.mockResolvedValue(1);

        const response = await request(app)
          .get('/api/privacy/retention')
          .expect(200);

        expect(response.body).toHaveProperty('policies');
        expect(response.body).toHaveProperty('total');
      });
    });

    describe('POST /api/privacy/retention', () => {
      it('should create retention policy', async () => {
        const mockPolicy = createMockRetentionPolicy();
        prismaMock.retentionPolicy.create.mockResolvedValue(mockPolicy as any);

        const response = await request(app)
          .post('/api/privacy/retention')
          .send({
            name: 'Customer Data Retention',
            dataCategory: 'Personal Data',
            retentionPeriod: 36,
            legalBasis: 'Contract',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });
  });

  // ===========================================================================
  // SCC/TIA Tests
  // ===========================================================================
  describe('SCC/TIA (Standard Contractual Clauses / Transfer Impact Assessment)', () => {
    describe('GET /api/privacy/scc-tia', () => {
      it('should list SCC templates with pagination', async () => {
        prismaMock.sCCTemplate.findMany.mockResolvedValue([]);
        prismaMock.sCCTemplate.count.mockResolvedValue(0);

        const response = await request(app)
          .get('/api/privacy/scc-tia')
          .expect(200);

        expect(response.body).toHaveProperty('templates');
        expect(response.body).toHaveProperty('total');
      });
    });

    describe('POST /api/privacy/scc-tia', () => {
      it('should create SCC template', async () => {
        const mockTemplate = {
          id: 'scc-123',
          name: 'EU SCC 2021',
          type: 'Controller-to-Processor',
        };

        prismaMock.sCCTemplate.create.mockResolvedValue(mockTemplate as any);

        const response = await request(app)
          .post('/api/privacy/scc-tia')
          .send({
            name: 'EU SCC 2021',
            type: 'Controller-to-Processor',
            content: 'SCC clauses...',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });
  });

  // ===========================================================================
  // BCR Tests
  // ===========================================================================
  describe('BCR (Binding Corporate Rules)', () => {
    describe('GET /api/privacy/bcr', () => {
      it('should list BCR programs with pagination', async () => {
        prismaMock.bCRProgram.findMany.mockResolvedValue([]);
        prismaMock.bCRProgram.count.mockResolvedValue(0);

        const response = await request(app)
          .get('/api/privacy/bcr')
          .expect(200);

        expect(response.body).toHaveProperty('programs');
        expect(response.body).toHaveProperty('total');
      });
    });

    describe('POST /api/privacy/bcr', () => {
      it('should create BCR program', async () => {
        const mockBCR = {
          id: 'bcr-123',
          name: 'Group BCR',
          bcrType: 'Controller',
          status: 'Draft',
        };

        prismaMock.bCRProgram.create.mockResolvedValue(mockBCR as any);

        const response = await request(app)
          .post('/api/privacy/bcr')
          .send({
            name: 'Group BCR',
            bcrType: 'Controller',
            entities: ['Entity A', 'Entity B'],
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });

    describe('PATCH /api/privacy/bcr/:id', () => {
      it('should update BCR program status', async () => {
        const mockBCR = { id: 'bcr-123', status: 'Draft' };
        const submittedBCR = { ...mockBCR, status: 'Submitted' };

        prismaMock.bCRProgram.findFirst.mockResolvedValue(mockBCR as any);
        prismaMock.bCRProgram.update.mockResolvedValue(submittedBCR as any);

        const response = await request(app)
          .patch('/api/privacy/bcr/bcr-123')
          .send({ status: 'Submitted' })
          .expect(200);

        expect(response.body.status).toBe('Submitted');
      });
    });
  });

  // ===========================================================================
  // Marketing Preferences Tests
  // ===========================================================================
  describe('Marketing Preferences', () => {
    describe('GET /api/privacy/marketing', () => {
      it('should list marketing preferences', async () => {
        prismaMock.consentPreference.findMany.mockResolvedValue([]);
        prismaMock.consentPreference.count.mockResolvedValue(0);

        const response = await request(app)
          .get('/api/privacy/marketing')
          .expect(200);

        expect(response.body).toHaveProperty('preferences');
        expect(response.body).toHaveProperty('total');
      });
    });

    describe('POST /api/privacy/marketing/opt-out', () => {
      it('should create marketing opt-out', async () => {
        const mockPreference = {
          id: 'pref-123',
          dataSubjectId: 'user-456',
          marketingOptOut: true,
        };

        prismaMock.consentPreference.upsert.mockResolvedValue(mockPreference as any);

        const response = await request(app)
          .post('/api/privacy/marketing/opt-out')
          .send({
            dataSubjectId: 'user-456',
            dataSubjectEmail: 'user@example.com',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });
  });

  // ===========================================================================
  // Account/Data Deletion Tests
  // ===========================================================================
  describe('Account/Data Deletion', () => {
    describe('GET /api/privacy/deletion', () => {
      it('should list deletion requests with pagination', async () => {
        prismaMock.dataDeletionRequest.findMany.mockResolvedValue([]);
        prismaMock.dataDeletionRequest.count.mockResolvedValue(0);

        const response = await request(app)
          .get('/api/privacy/deletion')
          .expect(200);

        expect(response.body).toHaveProperty('requests');
        expect(response.body).toHaveProperty('total');
      });
    });

    describe('POST /api/privacy/deletion', () => {
      it('should create deletion request', async () => {
        const mockRequest = {
          id: 'del-123',
          organizationId: 'org-123',
          requestType: 'Full_Deletion',
          status: 'Pending_Verification',
        };

        prismaMock.dataDeletionRequest.create.mockResolvedValue(mockRequest as any);

        const response = await request(app)
          .post('/api/privacy/deletion')
          .send({
            dataSubjectEmail: 'user@example.com',
            requestType: 'Full_Deletion',
            reason: 'User requested account deletion',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });

    describe('POST /api/privacy/deletion/:id/execute', () => {
      it('should execute deletion request', async () => {
        const mockRequest = { id: 'del-123', status: 'Approved', dataCategories: ['Personal Data'] };
        const executedRequest = { ...mockRequest, status: 'Completed', executedAt: new Date() };

        prismaMock.dataDeletionRequest.findFirst.mockResolvedValue(mockRequest as any);
        prismaMock.dataDeletionRequest.update.mockResolvedValue(executedRequest as any);

        const response = await request(app)
          .post('/api/privacy/deletion/del-123/execute')
          .expect(200);

        expect(response.body.status).toBe('Completed');
      });
    });
  });

  // ===========================================================================
  // Processing Restrictions Tests
  // ===========================================================================
  describe('Processing Restrictions', () => {
    describe('GET /api/privacy/restrictions', () => {
      it('should list processing restrictions with pagination', async () => {
        prismaMock.processingRestriction.findMany.mockResolvedValue([]);
        prismaMock.processingRestriction.count.mockResolvedValue(0);

        const response = await request(app)
          .get('/api/privacy/restrictions')
          .expect(200);

        expect(response.body).toHaveProperty('restrictions');
        expect(response.body).toHaveProperty('total');
      });
    });

    describe('POST /api/privacy/restrictions', () => {
      it('should create processing restriction', async () => {
        const mockRestriction = {
          id: 'restrict-123',
          organizationId: 'org-123',
          restrictionType: 'Processing_Limitation',
          status: 'Active',
        };

        prismaMock.processingRestriction.create.mockResolvedValue(mockRestriction as any);

        const response = await request(app)
          .post('/api/privacy/restrictions')
          .send({
            dataSubjectId: 'user-456',
            restrictionType: 'Processing_Limitation',
            reason: 'User objected to processing',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });

    describe('POST /api/privacy/restrictions/:id/lift', () => {
      it('should lift processing restriction', async () => {
        const mockRestriction = { id: 'restrict-123', status: 'Active' };
        const liftedRestriction = { ...mockRestriction, status: 'Lifted', liftedAt: new Date() };

        prismaMock.processingRestriction.findFirst.mockResolvedValue(mockRestriction as any);
        prismaMock.processingRestriction.update.mockResolvedValue(liftedRestriction as any);

        const response = await request(app)
          .post('/api/privacy/restrictions/restrict-123/lift')
          .send({ liftReason: 'No longer needed' })
          .expect(200);

        expect(response.body.status).toBe('Lifted');
      });
    });
  });

  // ===========================================================================
  // AI Transparency Tests
  // ===========================================================================
  describe('AI Transparency', () => {
    describe('GET /api/privacy/ai-transparency', () => {
      it('should list AI transparency notices with pagination', async () => {
        prismaMock.aITransparencyNotice.findMany.mockResolvedValue([]);
        prismaMock.aITransparencyNotice.count.mockResolvedValue(0);

        const response = await request(app)
          .get('/api/privacy/ai-transparency')
          .expect(200);

        expect(response.body).toHaveProperty('notices');
        expect(response.body).toHaveProperty('total');
      });
    });

    describe('POST /api/privacy/ai-transparency', () => {
      it('should create AI transparency notice', async () => {
        const mockNotice = {
          id: 'ai-trans-123',
          organizationId: 'org-123',
          systemName: 'Credit Scoring AI',
          purpose: 'Credit risk assessment',
        };

        prismaMock.aITransparencyNotice.create.mockResolvedValue(mockNotice as any);

        const response = await request(app)
          .post('/api/privacy/ai-transparency')
          .send({
            systemName: 'Credit Scoring AI',
            purpose: 'Credit risk assessment',
            dataUsed: ['Financial history', 'Employment data'],
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });
  });

  // ===========================================================================
  // JIT Privacy Notices Tests
  // ===========================================================================
  describe('JIT Privacy Notices', () => {
    describe('GET /api/privacy/jit-notices', () => {
      it('should list JIT privacy notices with pagination', async () => {
        prismaMock.jITPrivacyNotice.findMany.mockResolvedValue([]);
        prismaMock.jITPrivacyNotice.count.mockResolvedValue(0);

        const response = await request(app)
          .get('/api/privacy/jit-notices')
          .expect(200);

        expect(response.body).toHaveProperty('notices');
        expect(response.body).toHaveProperty('total');
      });
    });

    describe('POST /api/privacy/jit-notices', () => {
      it('should create JIT privacy notice', async () => {
        const mockNotice = {
          id: 'jit-123',
          name: 'Location Data Notice',
          trigger: 'location_access',
          content: 'We will use your location...',
        };

        prismaMock.jITPrivacyNotice.create.mockResolvedValue(mockNotice as any);

        const response = await request(app)
          .post('/api/privacy/jit-notices')
          .send({
            name: 'Location Data Notice',
            trigger: 'location_access',
            content: 'We will use your location...',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });

    describe('POST /api/privacy/jit-notices/:id/impression', () => {
      it('should record JIT notice impression', async () => {
        const mockNotice = { id: 'jit-123', impressions: 5 };
        const updatedNotice = { ...mockNotice, impressions: 6 };

        prismaMock.jITPrivacyNotice.findFirst.mockResolvedValue(mockNotice as any);
        prismaMock.jITPrivacyNotice.update.mockResolvedValue(updatedNotice as any);

        const response = await request(app)
          .post('/api/privacy/jit-notices/jit-123/impression')
          .expect(200);

        expect(response.body).toHaveProperty('id');
      });
    });
  });
});
