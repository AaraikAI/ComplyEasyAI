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

// Mock data factories
const createMockDSARRequest = (overrides: Record<string, unknown> = {}) => ({
  id: 'dsar-123',
  organizationId: 'org-123',
  requestType: 'Access',
  subjectEmail: 'user@example.com',
  subjectName: 'John Doe',
  status: 'Pending',
  submittedAt: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockConsentRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'consent-123',
  organizationId: 'org-123',
  userId: 'user-456',
  purpose: 'Marketing',
  status: 'Active',
  consentedAt: new Date(),
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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
      it('should list DSAR requests', async () => {
        const mockRequests = [createMockDSARRequest(), createMockDSARRequest({ id: 'dsar-456' })];
        prismaMock.dSARRequest.findMany.mockResolvedValue(mockRequests as any);

        const response = await request(app)
          .get('/api/privacy/dsar')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should filter by status', async () => {
        prismaMock.dSARRequest.findMany.mockResolvedValue([]);

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

        await request(app)
          .get('/api/privacy/dsar?requestType=Access')
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
            subjectEmail: 'user@example.com',
            subjectName: 'John Doe',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.status).toBe('Pending');
      });

      it('should require subject email', async () => {
        const response = await request(app)
          .post('/api/privacy/dsar')
          .send({
            requestType: 'Access',
            subjectName: 'John Doe',
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
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
        const updatedRequest = { ...mockRequest, status: 'In Progress' };

        prismaMock.dSARRequest.findFirst.mockResolvedValue(mockRequest as any);
        prismaMock.dSARRequest.update.mockResolvedValue(updatedRequest as any);

        const response = await request(app)
          .patch('/api/privacy/dsar/dsar-123')
          .send({ status: 'In Progress' })
          .expect(200);

        expect(response.body.status).toBe('In Progress');
      });
    });

    describe('POST /api/privacy/dsar/:id/complete', () => {
      it('should complete DSAR request', async () => {
        const mockRequest = createMockDSARRequest();
        const completedRequest = { ...mockRequest, status: 'Completed', completedAt: new Date() };

        prismaMock.dSARRequest.findFirst.mockResolvedValue(mockRequest as any);
        prismaMock.dSARRequest.update.mockResolvedValue(completedRequest as any);

        const response = await request(app)
          .post('/api/privacy/dsar/dsar-123/complete')
          .send({ response: 'Data provided to subject' })
          .expect(200);

        expect(response.body.status).toBe('Completed');
      });
    });
  });

  // ===========================================================================
  // Consent Management Tests
  // ===========================================================================
  describe('Consent Management', () => {
    describe('GET /api/privacy/consent', () => {
      it('should list consent records', async () => {
        const mockRecords = [createMockConsentRecord()];
        prismaMock.consentRecord.findMany.mockResolvedValue(mockRecords as any);

        const response = await request(app)
          .get('/api/privacy/consent')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should filter by purpose', async () => {
        prismaMock.consentRecord.findMany.mockResolvedValue([]);

        await request(app)
          .get('/api/privacy/consent?purpose=Marketing')
          .expect(200);

        expect(prismaMock.consentRecord.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              purpose: 'Marketing',
            }),
          })
        );
      });
    });

    describe('POST /api/privacy/consent', () => {
      it('should create consent record', async () => {
        const mockRecord = createMockConsentRecord();
        prismaMock.consentRecord.create.mockResolvedValue(mockRecord as any);

        const response = await request(app)
          .post('/api/privacy/consent')
          .send({
            userId: 'user-456',
            purpose: 'Marketing',
            consentSource: 'Website',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.status).toBe('Active');
      });
    });

    describe('POST /api/privacy/consent/:id/withdraw', () => {
      it('should withdraw consent', async () => {
        const mockRecord = createMockConsentRecord();
        const withdrawnRecord = { ...mockRecord, status: 'Withdrawn', withdrawnAt: new Date() };

        prismaMock.consentRecord.findFirst.mockResolvedValue(mockRecord as any);
        prismaMock.consentRecord.update.mockResolvedValue(withdrawnRecord as any);

        const response = await request(app)
          .post('/api/privacy/consent/consent-123/withdraw')
          .expect(200);

        expect(response.body.status).toBe('Withdrawn');
      });
    });
  });

  // ===========================================================================
  // Consent Preferences Tests
  // ===========================================================================
  describe('Consent Preferences', () => {
    describe('GET /api/privacy/consent-preferences/:userId', () => {
      it('should get user consent preferences', async () => {
        const mockPreferences = {
          id: 'pref-123',
          userId: 'user-456',
          marketing: true,
          analytics: false,
          thirdParty: false,
        };

        prismaMock.consentPreference.findFirst.mockResolvedValue(mockPreferences as any);

        const response = await request(app)
          .get('/api/privacy/consent-preferences/user-456')
          .expect(200);

        expect(response.body).toHaveProperty('marketing');
        expect(response.body).toHaveProperty('analytics');
      });
    });

    describe('PUT /api/privacy/consent-preferences/:userId', () => {
      it('should update consent preferences', async () => {
        const updatedPreferences = {
          id: 'pref-123',
          userId: 'user-456',
          marketing: false,
          analytics: true,
        };

        prismaMock.consentPreference.upsert.mockResolvedValue(updatedPreferences as any);

        const response = await request(app)
          .put('/api/privacy/consent-preferences/user-456')
          .send({
            marketing: false,
            analytics: true,
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
      it('should list retention policies', async () => {
        const mockPolicies = [createMockRetentionPolicy()];
        prismaMock.retentionPolicy.findMany.mockResolvedValue(mockPolicies as any);

        const response = await request(app)
          .get('/api/privacy/retention')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
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
            retentionUnit: 'months',
            legalBasis: 'Contract',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });

    describe('POST /api/privacy/retention/enforce', () => {
      it('should enforce retention policies', async () => {
        prismaMock.retentionPolicy.findMany.mockResolvedValue([createMockRetentionPolicy()] as any);

        const response = await request(app)
          .post('/api/privacy/retention/enforce')
          .expect(200);

        expect(response.body).toHaveProperty('processed');
      });
    });
  });

  // ===========================================================================
  // SCC/TIA Tests
  // ===========================================================================
  describe('SCC/TIA (Standard Contractual Clauses / Transfer Impact Assessment)', () => {
    describe('GET /api/privacy/scc-templates', () => {
      it('should list SCC templates', async () => {
        prismaMock.sCCTemplate.findMany.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/privacy/scc-templates')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/privacy/scc-templates', () => {
      it('should create SCC template', async () => {
        const mockTemplate = {
          id: 'scc-123',
          name: 'EU SCC 2021',
          type: 'Controller-to-Processor',
        };

        prismaMock.sCCTemplate.create.mockResolvedValue(mockTemplate as any);

        const response = await request(app)
          .post('/api/privacy/scc-templates')
          .send({
            name: 'EU SCC 2021',
            type: 'Controller-to-Processor',
            content: 'SCC clauses...',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });

    describe('GET /api/privacy/tia', () => {
      it('should list TIA assessments', async () => {
        prismaMock.tIAAssessment.findMany.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/privacy/tia')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/privacy/tia', () => {
      it('should create TIA assessment', async () => {
        const mockTIA = {
          id: 'tia-123',
          name: 'US Transfer Assessment',
          destinationCountry: 'USA',
          status: 'In Progress',
        };

        prismaMock.tIAAssessment.create.mockResolvedValue(mockTIA as any);

        const response = await request(app)
          .post('/api/privacy/tia')
          .send({
            name: 'US Transfer Assessment',
            destinationCountry: 'USA',
            dataCategories: ['Personal Data'],
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
      it('should list BCR programs', async () => {
        prismaMock.bCRProgram.findMany.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/privacy/bcr')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
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

    describe('POST /api/privacy/bcr/:id/submit', () => {
      it('should submit BCR for approval', async () => {
        const mockBCR = { id: 'bcr-123', status: 'Draft' };
        const submittedBCR = { ...mockBCR, status: 'Submitted' };

        prismaMock.bCRProgram.findFirst.mockResolvedValue(mockBCR as any);
        prismaMock.bCRProgram.update.mockResolvedValue(submittedBCR as any);

        const response = await request(app)
          .post('/api/privacy/bcr/bcr-123/submit')
          .expect(200);

        expect(response.body.status).toBe('Submitted');
      });
    });
  });

  // ===========================================================================
  // Marketing Opt-out Tests
  // ===========================================================================
  describe('Marketing Opt-out', () => {
    describe('GET /api/privacy/marketing-optout', () => {
      it('should list marketing opt-outs', async () => {
        prismaMock.marketingOptOut.findMany.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/privacy/marketing-optout')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/privacy/marketing-optout', () => {
      it('should create marketing opt-out', async () => {
        const mockOptOut = {
          id: 'optout-123',
          email: 'user@example.com',
          channels: ['email', 'sms'],
        };

        prismaMock.marketingOptOut.create.mockResolvedValue(mockOptOut as any);

        const response = await request(app)
          .post('/api/privacy/marketing-optout')
          .send({
            email: 'user@example.com',
            channels: ['email', 'sms'],
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
    describe('GET /api/privacy/deletion-requests', () => {
      it('should list deletion requests', async () => {
        prismaMock.deletionRequest.findMany.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/privacy/deletion-requests')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/privacy/deletion-requests', () => {
      it('should create deletion request', async () => {
        const mockRequest = {
          id: 'del-123',
          userId: 'user-456',
          requestType: 'Full Deletion',
          status: 'Pending',
        };

        prismaMock.deletionRequest.create.mockResolvedValue(mockRequest as any);

        const response = await request(app)
          .post('/api/privacy/deletion-requests')
          .send({
            userId: 'user-456',
            requestType: 'Full Deletion',
            reason: 'User requested account deletion',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.status).toBe('Pending');
      });
    });

    describe('POST /api/privacy/deletion-requests/:id/execute', () => {
      it('should execute deletion request', async () => {
        const mockRequest = { id: 'del-123', status: 'Pending' };
        const executedRequest = { ...mockRequest, status: 'Completed', executedAt: new Date() };

        prismaMock.deletionRequest.findFirst.mockResolvedValue(mockRequest as any);
        prismaMock.deletionRequest.update.mockResolvedValue(executedRequest as any);

        const response = await request(app)
          .post('/api/privacy/deletion-requests/del-123/execute')
          .expect(200);

        expect(response.body.status).toBe('Completed');
      });
    });
  });

  // ===========================================================================
  // Processing Restrictions Tests
  // ===========================================================================
  describe('Processing Restrictions', () => {
    describe('GET /api/privacy/processing-restrictions', () => {
      it('should list processing restrictions', async () => {
        prismaMock.processingRestriction.findMany.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/privacy/processing-restrictions')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/privacy/processing-restrictions', () => {
      it('should create processing restriction', async () => {
        const mockRestriction = {
          id: 'restrict-123',
          userId: 'user-456',
          restrictionType: 'No Marketing',
          status: 'Active',
        };

        prismaMock.processingRestriction.create.mockResolvedValue(mockRestriction as any);

        const response = await request(app)
          .post('/api/privacy/processing-restrictions')
          .send({
            userId: 'user-456',
            restrictionType: 'No Marketing',
            reason: 'User objected to marketing',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });

    describe('DELETE /api/privacy/processing-restrictions/:id', () => {
      it('should remove processing restriction', async () => {
        const mockRestriction = { id: 'restrict-123' };

        prismaMock.processingRestriction.findFirst.mockResolvedValue(mockRestriction as any);
        prismaMock.processingRestriction.delete.mockResolvedValue(mockRestriction as any);

        const response = await request(app)
          .delete('/api/privacy/processing-restrictions/restrict-123')
          .expect(200);

        expect(response.body).toHaveProperty('deleted');
      });
    });
  });

  // ===========================================================================
  // AI Transparency Tests
  // ===========================================================================
  describe('AI Transparency', () => {
    describe('GET /api/privacy/ai-transparency', () => {
      it('should list AI transparency records', async () => {
        prismaMock.aITransparencyRecord.findMany.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/privacy/ai-transparency')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/privacy/ai-transparency', () => {
      it('should create AI transparency record', async () => {
        const mockRecord = {
          id: 'ai-trans-123',
          systemName: 'Credit Scoring AI',
          purpose: 'Credit risk assessment',
          dataUsed: ['Financial history', 'Employment data'],
        };

        prismaMock.aITransparencyRecord.create.mockResolvedValue(mockRecord as any);

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
      it('should list JIT privacy notices', async () => {
        prismaMock.jITPrivacyNotice.findMany.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/privacy/jit-notices')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
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

    describe('POST /api/privacy/jit-notices/:id/display', () => {
      it('should record JIT notice display', async () => {
        const mockNotice = { id: 'jit-123' };
        const displayRecord = {
          id: 'display-123',
          noticeId: 'jit-123',
          userId: 'user-456',
          displayedAt: new Date(),
        };

        prismaMock.jITPrivacyNotice.findFirst.mockResolvedValue(mockNotice as any);
        prismaMock.jITNoticeDisplay.create.mockResolvedValue(displayRecord as any);

        const response = await request(app)
          .post('/api/privacy/jit-notices/jit-123/display')
          .send({ userId: 'user-456' })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });
  });
});
