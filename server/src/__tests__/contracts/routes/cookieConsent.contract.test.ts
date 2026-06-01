/**
 * Cookie Consent Routes — Contract Tests
 * 7 endpoints: banner, preferences CRUD, record, records list, withdraw
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

const mockPrisma: any = {
  jITPrivacyNotice: {
    findFirst: jest.fn<any>().mockResolvedValue(null),
  },
  consentPreference: {
    upsert: jest.fn<any>().mockResolvedValue({ id: 'pref-1' }),
    findUnique: jest.fn<any>().mockResolvedValue(null),
    update: jest.fn<any>().mockResolvedValue({ id: 'pref-1' }),
  },
  consentRecord: {
    create: jest.fn<any>().mockResolvedValue({ id: 'cr-1' }),
    findMany: jest.fn<any>().mockResolvedValue([]),
    count: jest.fn<any>().mockResolvedValue(0),
  },
};

jest.mock('../../../config/database', () => ({ __esModule: true, default: mockPrisma }));
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../../utils/auditLogger', () => ({ AuditLogger: { log: jest.fn() } }));

// Cookie-consent routes are auth-only by design: routes/cookieConsent.ts guards
// every endpoint with `router.use(authenticate)` plus per-route `validateBody`,
// and does NOT apply `authorize(...)` role gating. Any authenticated org member
// may read/record consent for their org. The authorize mock therefore only
// enforces authentication; there is no role-rejection (403) path to cover.
jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if ((req as any).user) return next();
    res.status(401).json({ error: 'No token provided' });
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => {
    if (!(req as any).user) return res.status(401).json({ error: 'Authentication required' });
    next();
  },
  AuthRequest: {},
}));

import cookieConsentRoutes from '../../../routes/cookieConsent';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try { (req as any).user = jwt.verify(authHeader.split(' ')[1], 'test-secret'); } catch { /* no-op */ }
  }
  next();
});
app.use('/api/cookie-consent', cookieConsentRoutes);
app.use(errorHandler);

const generateToken = (role = 'Admin') =>
  jwt.sign({ id: 'user-1', organizationId: 'org-1', role, email: 't@t.com', name: 'T' }, 'test-secret', { expiresIn: '1h' });

describe('Cookie Consent Routes Contract Tests', () => {
  const adminToken = generateToken('Admin');

  beforeEach(() => jest.clearAllMocks());

  // ── Banner ───────────────────────────────────────────────────────

  describe('GET /api/cookie-consent/banner', () => {
    it('returns 200 with not-configured when no banner', async () => {
      mockPrisma.jITPrivacyNotice.findFirst.mockResolvedValueOnce(null);
      const res = await request(app).get('/api/cookie-consent/banner').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.configured).toBe(false);
    });

    it('returns 200 with configured banner', async () => {
      mockPrisma.jITPrivacyNotice.findFirst.mockResolvedValueOnce({
        id: 'b-1',
        noticeContent: 'We use cookies',
        shortNotice: 'Cookies',
        dataCollected: [],
        purposes: [],
        impressions: 0,
        acceptances: 0,
        dismissals: 0,
      });
      const res = await request(app).get('/api/cookie-consent/banner').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.configured).toBe(true);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/cookie-consent/banner');
      expect(res.status).toBe(401);
    });
  });

  // ── Save Preferences ─────────────────────────────────────────────

  describe('POST /api/cookie-consent/preferences', () => {
    it('returns 201 with valid data', async () => {
      const res = await request(app)
        .post('/api/cookie-consent/preferences')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subjectIdentifier: 'user-abc',
          categories: { functional: true, analytics: false, targeting: false },
        });
      expect(res.status).toBe(201);
      expect(res.body.message).toContain('saved');
    });

    it('returns 400 when subjectIdentifier missing', async () => {
      const res = await request(app)
        .post('/api/cookie-consent/preferences')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ categories: { functional: true } });
      expect(res.status).toBe(400);
    });

    it('returns 400 when categories missing', async () => {
      const res = await request(app)
        .post('/api/cookie-consent/preferences')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ subjectIdentifier: 'user-abc' });
      expect(res.status).toBe(400);
    });
  });

  // ── Get Preferences ──────────────────────────────────────────────

  describe('GET /api/cookie-consent/preferences/:subjectId', () => {
    it('returns 200 when found', async () => {
      mockPrisma.consentPreference.findUnique.mockResolvedValueOnce({ id: 'pref-1', preferences: {} });
      const res = await request(app)
        .get('/api/cookie-consent/preferences/user-abc')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      mockPrisma.consentPreference.findUnique.mockResolvedValueOnce(null);
      const res = await request(app)
        .get('/api/cookie-consent/preferences/missing')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── Update Preferences ───────────────────────────────────────────

  describe('PATCH /api/cookie-consent/preferences/:subjectId', () => {
    it('returns 200 on update', async () => {
      mockPrisma.consentPreference.findUnique.mockResolvedValueOnce({ id: 'pref-1', preferences: { functional: true } });
      mockPrisma.consentPreference.update.mockResolvedValueOnce({ id: 'pref-1' });
      const res = await request(app)
        .patch('/api/cookie-consent/preferences/user-abc')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ categories: { analytics: true } });
      expect(res.status).toBe(200);
    });

    it('returns 404 when not found', async () => {
      mockPrisma.consentPreference.findUnique.mockResolvedValueOnce(null);
      const res = await request(app)
        .patch('/api/cookie-consent/preferences/missing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ categories: { analytics: true } });
      expect(res.status).toBe(404);
    });

    it('returns 400 when categories missing', async () => {
      mockPrisma.consentPreference.findUnique.mockResolvedValueOnce({ id: 'pref-1', preferences: {} });
      const res = await request(app)
        .patch('/api/cookie-consent/preferences/user-abc')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // ── Record Consent Event ─────────────────────────────────────────

  describe('POST /api/cookie-consent/record', () => {
    it('returns 201 with valid event', async () => {
      const res = await request(app)
        .post('/api/cookie-consent/record')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ subjectIdentifier: 'user-abc', action: 'accept_all' });
      expect(res.status).toBe(201);
    });

    it('returns 400 when required fields missing', async () => {
      const res = await request(app)
        .post('/api/cookie-consent/record')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ subjectIdentifier: 'user-abc' });
      expect(res.status).toBe(400);
    });
  });

  // ── List Consent Records ─────────────────────────────────────────

  describe('GET /api/cookie-consent/records', () => {
    it('returns 200 with list', async () => {
      mockPrisma.consentRecord.findMany.mockResolvedValueOnce([]);
      mockPrisma.consentRecord.count.mockResolvedValueOnce(0);
      const res = await request(app).get('/api/cookie-consent/records').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('records');
    });
  });

  // ── Withdraw Consent ─────────────────────────────────────────────

  describe('DELETE /api/cookie-consent/preferences/:subjectId', () => {
    it('returns 200 on withdrawal', async () => {
      mockPrisma.consentPreference.findUnique.mockResolvedValueOnce({
        id: 'pref-1',
        preferences: { essential: true, analytics: true },
      });
      mockPrisma.consentPreference.update.mockResolvedValueOnce({});
      const res = await request(app)
        .delete('/api/cookie-consent/preferences/user-abc')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('withdrawn');
    });

    it('returns 404 when not found', async () => {
      mockPrisma.consentPreference.findUnique.mockResolvedValueOnce(null);
      const res = await request(app)
        .delete('/api/cookie-consent/preferences/missing')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});
