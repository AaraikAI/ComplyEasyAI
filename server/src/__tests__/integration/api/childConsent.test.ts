/**
 * Integration Tests: Child Consent (GDPR Art. 8) Flows
 *
 * Tests the full child consent lifecycle:
 * - Age verification with jurisdiction-specific thresholds
 * - Parental consent recording
 * - Pending parental consent listing
 * - Cross-org isolation and security
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

const createMockFn = () => jest.fn() as any;

const createMockConsentRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'consent-123',
  organizationId: 'org-123',
  dataSubjectId: 'subject-456',
  dataSubjectEmail: 'child@example.com',
  consentType: 'Marketing',
  purpose: 'Email marketing communications',
  legalBasis: 'Consent',
  channel: 'Web',
  consentGiven: true,
  consentDate: new Date('2026-01-01'),
  consentExpiry: new Date('2027-01-01'),
  withdrawnAt: null,
  version: '1.0',
  policyVersion: '1.0',
  proofOfConsent: { ip: '192.168.1.1' },
  granularity: { marketing: true },
  doubleOptIn: false,
  source: 'Web Form',
  metadata: {},
  dataSubjectAge: 14,
  isMinor: true,
  parentalConsentGiven: false,
  parentalConsentDate: null,
  parentalConsentEmail: 'parent@example.com',
  parentalConsentMethod: null,
  ageVerificationMethod: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

const prismaMock: Record<string, any> = {
  consentRecord: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  auditLog: { create: createMockFn() },
  user: { findUnique: createMockFn() },
  organization: { findUnique: createMockFn() },
  $transaction: jest.fn((fn: any) => fn(prismaMock)) as any,
};

// ---------------------------------------------------------------------------
// Module mocks — MUST be before route import
// ---------------------------------------------------------------------------

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

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'admin@example.com',
      organizationId: 'org-123',
      role: 'Admin',
    };
    next();
  },
  authorize: (..._roles: string[]) => (_req: any, _res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../../middleware/tierMiddleware', () => ({
  requireVisionaryFeature: () => [(_req: any, _res: any, next: any) => next()],
}));

jest.mock('../../../middleware/rateLimiter', () => ({
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------

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

// ===========================================================================
// TEST SUITES
// ===========================================================================

describe('Child Consent Integration Tests (GDPR Art. 8)', () => {
  // -------------------------------------------------------------------------
  // Suite 1: Configuration endpoint
  // -------------------------------------------------------------------------
  describe('GET /api/privacy/child-consent/config', () => {
    it('should return jurisdiction age thresholds', async () => {
      const res = await request(app)
        .get('/api/privacy/child-consent/config')
        .expect(200);

      expect(res.body).toHaveProperty('defaultMinimumAge', 16);
      expect(res.body.jurisdictions).toHaveProperty('EU', 16);
      expect(res.body.jurisdictions).toHaveProperty('UK', 13);
      expect(res.body.jurisdictions).toHaveProperty('FR', 15);
      expect(res.body.jurisdictions).toHaveProperty('ES', 14);
      expect(res.body.jurisdictions).toHaveProperty('US_COPPA', 13);
    });

    it('should return verification and consent methods', async () => {
      const res = await request(app)
        .get('/api/privacy/child-consent/config')
        .expect(200);

      expect(res.body.verificationMethods).toContain('SelfDeclaration');
      expect(res.body.parentalConsentMethods).toContain('Email');
      expect(res.body.parentalConsentMethods).toContain('InPerson');
    });
  });

  // -------------------------------------------------------------------------
  // Suite 2: Age verification
  // -------------------------------------------------------------------------
  describe('POST /api/privacy/child-consent/verify-age', () => {
    it('should identify adult (age >= EU threshold 16)', async () => {
      const record = createMockConsentRecord({ id: 'consent-adult' });
      prismaMock.consentRecord.findFirst.mockResolvedValue(record);
      prismaMock.consentRecord.update.mockResolvedValue({
        ...record,
        dataSubjectAge: 18,
        isMinor: false,
      });

      const res = await request(app)
        .post('/api/privacy/child-consent/verify-age')
        .send({
          consentRecordId: 'consent-adult',
          dataSubjectAge: 18,
          jurisdiction: 'EU',
          ageVerificationMethod: 'SelfDeclaration',
        })
        .expect(200);

      expect(res.body.requiresParentalConsent).toBe(false);
      expect(res.body.minimumAge).toBe(16);
    });

    it('should identify minor (age < EU threshold 16)', async () => {
      const record = createMockConsentRecord({ id: 'consent-minor' });
      prismaMock.consentRecord.findFirst.mockResolvedValue(record);
      prismaMock.consentRecord.update.mockResolvedValue({
        ...record,
        dataSubjectAge: 15,
        isMinor: true,
        parentalConsentGiven: false,
      });

      const res = await request(app)
        .post('/api/privacy/child-consent/verify-age')
        .send({
          consentRecordId: 'consent-minor',
          dataSubjectAge: 15,
          jurisdiction: 'EU',
          ageVerificationMethod: 'SelfDeclaration',
          parentalConsentEmail: 'parent@example.com',
        })
        .expect(200);

      expect(res.body.requiresParentalConsent).toBe(true);
      expect(res.body.minimumAge).toBe(16);
    });

    it('should use UK threshold of 13', async () => {
      const record = createMockConsentRecord({ id: 'consent-uk' });
      prismaMock.consentRecord.findFirst.mockResolvedValue(record);
      prismaMock.consentRecord.update.mockResolvedValue({
        ...record,
        dataSubjectAge: 14,
        isMinor: false,
      });

      const res = await request(app)
        .post('/api/privacy/child-consent/verify-age')
        .send({
          consentRecordId: 'consent-uk',
          dataSubjectAge: 14,
          jurisdiction: 'UK',
        })
        .expect(200);

      expect(res.body.minimumAge).toBe(13);
      expect(res.body.requiresParentalConsent).toBe(false);
    });

    it('should use FR threshold of 15', async () => {
      const record = createMockConsentRecord({ id: 'consent-fr' });
      prismaMock.consentRecord.findFirst.mockResolvedValue(record);
      prismaMock.consentRecord.update.mockResolvedValue({
        ...record,
        dataSubjectAge: 14,
        isMinor: true,
      });

      const res = await request(app)
        .post('/api/privacy/child-consent/verify-age')
        .send({
          consentRecordId: 'consent-fr',
          dataSubjectAge: 14,
          jurisdiction: 'FR',
        })
        .expect(200);

      expect(res.body.minimumAge).toBe(15);
      expect(res.body.requiresParentalConsent).toBe(true);
    });

    it('should use US_COPPA threshold of 13', async () => {
      const record = createMockConsentRecord({ id: 'consent-coppa' });
      prismaMock.consentRecord.findFirst.mockResolvedValue(record);
      prismaMock.consentRecord.update.mockResolvedValue({
        ...record,
        dataSubjectAge: 10,
        isMinor: true,
      });

      const res = await request(app)
        .post('/api/privacy/child-consent/verify-age')
        .send({
          consentRecordId: 'consent-coppa',
          dataSubjectAge: 10,
          jurisdiction: 'US_COPPA',
        })
        .expect(200);

      expect(res.body.minimumAge).toBe(13);
      expect(res.body.requiresParentalConsent).toBe(true);
    });

    it('should default to 16 for unknown jurisdiction', async () => {
      const record = createMockConsentRecord({ id: 'consent-unknown' });
      prismaMock.consentRecord.findFirst.mockResolvedValue(record);
      prismaMock.consentRecord.update.mockResolvedValue({
        ...record,
        dataSubjectAge: 15,
        isMinor: true,
      });

      const res = await request(app)
        .post('/api/privacy/child-consent/verify-age')
        .send({
          consentRecordId: 'consent-unknown',
          dataSubjectAge: 15,
          jurisdiction: 'ZZ',
        })
        .expect(200);

      expect(res.body.minimumAge).toBe(16);
      expect(res.body.requiresParentalConsent).toBe(true);
    });

    it('should treat age exactly at threshold as NOT minor', async () => {
      const record = createMockConsentRecord({ id: 'consent-boundary' });
      prismaMock.consentRecord.findFirst.mockResolvedValue(record);
      prismaMock.consentRecord.update.mockResolvedValue({
        ...record,
        dataSubjectAge: 16,
        isMinor: false,
      });

      const res = await request(app)
        .post('/api/privacy/child-consent/verify-age')
        .send({
          consentRecordId: 'consent-boundary',
          dataSubjectAge: 16,
          jurisdiction: 'EU',
        })
        .expect(200);

      expect(res.body.requiresParentalConsent).toBe(false);
    });

    it('should record ageVerificationMethod', async () => {
      const record = createMockConsentRecord({ id: 'consent-method' });
      prismaMock.consentRecord.findFirst.mockResolvedValue(record);
      prismaMock.consentRecord.update.mockResolvedValue({
        ...record,
        ageVerificationMethod: 'IDVerification',
      });

      await request(app)
        .post('/api/privacy/child-consent/verify-age')
        .send({
          consentRecordId: 'consent-method',
          dataSubjectAge: 20,
          ageVerificationMethod: 'IDVerification',
        })
        .expect(200);

      expect(prismaMock.consentRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ageVerificationMethod: 'IDVerification',
          }),
        })
      );
    });

    it('should return 400 if consentRecordId is missing', async () => {
      const res = await request(app)
        .post('/api/privacy/child-consent/verify-age')
        .send({ dataSubjectAge: 15, jurisdiction: 'EU' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 if dataSubjectAge is missing', async () => {
      const res = await request(app)
        .post('/api/privacy/child-consent/verify-age')
        .send({ consentRecordId: 'consent-123', jurisdiction: 'EU' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('should return 404 if consent record not found', async () => {
      prismaMock.consentRecord.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/privacy/child-consent/verify-age')
        .send({
          consentRecordId: 'nonexistent',
          dataSubjectAge: 15,
          jurisdiction: 'EU',
        })
        .expect(404);

      expect(res.body).toHaveProperty('error');
    });

    it('should enforce cross-org isolation (orgId filter)', async () => {
      prismaMock.consentRecord.findFirst.mockResolvedValue(null);

      await request(app)
        .post('/api/privacy/child-consent/verify-age')
        .send({
          consentRecordId: 'other-org-record',
          dataSubjectAge: 15,
        })
        .expect(404);

      // Verify the query includes organizationId filter
      expect(prismaMock.consentRecord.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
          }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Suite 3: Parental consent recording
  // -------------------------------------------------------------------------
  describe('POST /api/privacy/child-consent/parental-consent', () => {
    it('should record parental consent for minor', async () => {
      const record = createMockConsentRecord({
        id: 'consent-minor-pc',
        isMinor: true,
        parentalConsentGiven: false,
      });
      prismaMock.consentRecord.findFirst.mockResolvedValue(record);
      prismaMock.consentRecord.update.mockResolvedValue({
        ...record,
        parentalConsentGiven: true,
        parentalConsentDate: new Date(),
        parentalConsentEmail: 'parent@example.com',
        parentalConsentMethod: 'Email',
      });

      const res = await request(app)
        .post('/api/privacy/child-consent/parental-consent')
        .send({
          consentRecordId: 'consent-minor-pc',
          parentalConsentEmail: 'parent@example.com',
          parentalConsentMethod: 'Email',
        })
        .expect(200);

      expect(res.body.parentalConsentGiven).toBe(true);
      expect(res.body).toHaveProperty('parentalConsentDate');
      expect(res.body.parentalConsentMethod).toBe('Email');
    });

    it('should return 404 for non-minor record', async () => {
      prismaMock.consentRecord.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/privacy/child-consent/parental-consent')
        .send({
          consentRecordId: 'adult-record',
          parentalConsentEmail: 'parent@example.com',
        })
        .expect(404);

      expect(res.body).toHaveProperty('error');
    });

    it('should support all parental consent methods', async () => {
      const methods = ['Email', 'InPerson', 'Phone', 'PostalMail'];

      for (const method of methods) {
        jest.clearAllMocks();

        const record = createMockConsentRecord({
          id: `consent-${method}`,
          isMinor: true,
        });
        prismaMock.consentRecord.findFirst.mockResolvedValue(record);
        prismaMock.consentRecord.update.mockResolvedValue({
          ...record,
          parentalConsentGiven: true,
          parentalConsentMethod: method,
        });

        const res = await request(app)
          .post('/api/privacy/child-consent/parental-consent')
          .send({
            consentRecordId: `consent-${method}`,
            parentalConsentMethod: method,
          })
          .expect(200);

        expect(res.body.parentalConsentMethod).toBe(method);
      }
    });

    it('should default consent method to Email if not provided', async () => {
      const record = createMockConsentRecord({
        id: 'consent-default-method',
        isMinor: true,
      });
      prismaMock.consentRecord.findFirst.mockResolvedValue(record);
      prismaMock.consentRecord.update.mockResolvedValue({
        ...record,
        parentalConsentGiven: true,
        parentalConsentMethod: 'Email',
      });

      await request(app)
        .post('/api/privacy/child-consent/parental-consent')
        .send({ consentRecordId: 'consent-default-method' })
        .expect(200);

      expect(prismaMock.consentRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            parentalConsentMethod: 'Email',
          }),
        })
      );
    });

    it('should return 400 if consentRecordId is missing', async () => {
      const res = await request(app)
        .post('/api/privacy/child-consent/parental-consent')
        .send({ parentalConsentEmail: 'parent@example.com' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('should enforce cross-org isolation', async () => {
      prismaMock.consentRecord.findFirst.mockResolvedValue(null);

      await request(app)
        .post('/api/privacy/child-consent/parental-consent')
        .send({ consentRecordId: 'other-org-record' })
        .expect(404);

      expect(prismaMock.consentRecord.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
            isMinor: true,
          }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Suite 4: Pending parental consent listing
  // -------------------------------------------------------------------------
  describe('GET /api/privacy/child-consent/pending', () => {
    it('should return pending minor consent records', async () => {
      const records = [
        createMockConsentRecord({ id: 'minor-1', dataSubjectAge: 12 }),
        createMockConsentRecord({ id: 'minor-2', dataSubjectAge: 14 }),
      ];
      prismaMock.consentRecord.findMany.mockResolvedValue(records);
      prismaMock.consentRecord.count.mockResolvedValue(2);

      const res = await request(app)
        .get('/api/privacy/child-consent/pending')
        .expect(200);

      expect(Array.isArray(res.body.records)).toBe(true);
      expect(res.body.records.length).toBe(2);
      expect(res.body.total).toBe(2);
      expect(res.body).toHaveProperty('page', 1);
    });

    it('should filter for isMinor=true and parentalConsentGiven=false', async () => {
      prismaMock.consentRecord.findMany.mockResolvedValue([]);
      prismaMock.consentRecord.count.mockResolvedValue(0);

      await request(app)
        .get('/api/privacy/child-consent/pending')
        .expect(200);

      expect(prismaMock.consentRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isMinor: true,
            parentalConsentGiven: false,
            organizationId: 'org-123',
          }),
        })
      );
    });

    it('should support pagination', async () => {
      prismaMock.consentRecord.findMany.mockResolvedValue([]);
      prismaMock.consentRecord.count.mockResolvedValue(50);

      await request(app)
        .get('/api/privacy/child-consent/pending?page=2&limit=10')
        .expect(200);

      expect(prismaMock.consentRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should return empty list when no pending records', async () => {
      prismaMock.consentRecord.findMany.mockResolvedValue([]);
      prismaMock.consentRecord.count.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/privacy/child-consent/pending')
        .expect(200);

      expect(res.body.records).toEqual([]);
      expect(res.body.total).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Suite 5: E2E child consent lifecycle
  // -------------------------------------------------------------------------
  describe('E2E: Child Consent Lifecycle', () => {
    it('should complete full lifecycle: verify age → check pending → record consent → re-check pending', async () => {
      // Step 1: Verify age as minor
      const minorRecord = createMockConsentRecord({
        id: 'lifecycle-consent',
        dataSubjectAge: 12,
        isMinor: true,
        parentalConsentGiven: false,
      });
      prismaMock.consentRecord.findFirst.mockResolvedValue(minorRecord);
      prismaMock.consentRecord.update.mockResolvedValue({
        ...minorRecord,
        dataSubjectAge: 12,
        isMinor: true,
        parentalConsentGiven: false,
        ageVerificationMethod: 'SelfDeclaration',
      });

      const verifyRes = await request(app)
        .post('/api/privacy/child-consent/verify-age')
        .send({
          consentRecordId: 'lifecycle-consent',
          dataSubjectAge: 12,
          jurisdiction: 'EU',
          ageVerificationMethod: 'SelfDeclaration',
          parentalConsentEmail: 'parent@lifecycle.com',
        })
        .expect(200);

      expect(verifyRes.body.requiresParentalConsent).toBe(true);

      // Step 2: Check pending list — record should appear
      jest.clearAllMocks();
      prismaMock.consentRecord.findMany.mockResolvedValue([minorRecord]);
      prismaMock.consentRecord.count.mockResolvedValue(1);

      const pendingRes1 = await request(app)
        .get('/api/privacy/child-consent/pending')
        .expect(200);

      expect(pendingRes1.body.total).toBe(1);

      // Step 3: Record parental consent
      jest.clearAllMocks();
      prismaMock.consentRecord.findFirst.mockResolvedValue(minorRecord);
      prismaMock.consentRecord.update.mockResolvedValue({
        ...minorRecord,
        parentalConsentGiven: true,
        parentalConsentDate: new Date(),
        parentalConsentEmail: 'parent@lifecycle.com',
        parentalConsentMethod: 'Email',
      });

      const consentRes = await request(app)
        .post('/api/privacy/child-consent/parental-consent')
        .send({
          consentRecordId: 'lifecycle-consent',
          parentalConsentEmail: 'parent@lifecycle.com',
          parentalConsentMethod: 'Email',
        })
        .expect(200);

      expect(consentRes.body.parentalConsentGiven).toBe(true);

      // Step 4: Check pending list again — record should no longer appear
      jest.clearAllMocks();
      prismaMock.consentRecord.findMany.mockResolvedValue([]);
      prismaMock.consentRecord.count.mockResolvedValue(0);

      const pendingRes2 = await request(app)
        .get('/api/privacy/child-consent/pending')
        .expect(200);

      expect(pendingRes2.body.total).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Suite 6: Security tests
  // -------------------------------------------------------------------------
  describe('Security', () => {
    it('should handle large age values gracefully', async () => {
      const record = createMockConsentRecord({ id: 'consent-large-age' });
      prismaMock.consentRecord.findFirst.mockResolvedValue(record);
      prismaMock.consentRecord.update.mockResolvedValue({
        ...record,
        dataSubjectAge: 999,
        isMinor: false,
      });

      const res = await request(app)
        .post('/api/privacy/child-consent/verify-age')
        .send({
          consentRecordId: 'consent-large-age',
          dataSubjectAge: 999,
          jurisdiction: 'EU',
        })
        .expect(200);

      expect(res.body.requiresParentalConsent).toBe(false);
    });

    it('should treat negative age as minor', async () => {
      const record = createMockConsentRecord({ id: 'consent-neg-age' });
      prismaMock.consentRecord.findFirst.mockResolvedValue(record);
      prismaMock.consentRecord.update.mockResolvedValue({
        ...record,
        dataSubjectAge: -1,
        isMinor: true,
      });

      const res = await request(app)
        .post('/api/privacy/child-consent/verify-age')
        .send({
          consentRecordId: 'consent-neg-age',
          dataSubjectAge: -1,
          jurisdiction: 'EU',
        })
        .expect(200);

      expect(res.body.requiresParentalConsent).toBe(true);
    });

    it('should scope all queries to authenticated user org', async () => {
      prismaMock.consentRecord.findFirst.mockResolvedValue(null);
      prismaMock.consentRecord.findMany.mockResolvedValue([]);
      prismaMock.consentRecord.count.mockResolvedValue(0);

      // verify-age
      await request(app)
        .post('/api/privacy/child-consent/verify-age')
        .send({ consentRecordId: 'x', dataSubjectAge: 10 });

      expect(prismaMock.consentRecord.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: 'org-123' }),
        })
      );

      jest.clearAllMocks();

      // pending list
      prismaMock.consentRecord.findMany.mockResolvedValue([]);
      prismaMock.consentRecord.count.mockResolvedValue(0);

      await request(app).get('/api/privacy/child-consent/pending');

      expect(prismaMock.consentRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: 'org-123' }),
        })
      );
    });
  });
});
