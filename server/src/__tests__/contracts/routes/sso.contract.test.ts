/**
 * SSO Configuration Routes — Contract Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({ __esModule: true, default: prismaMock }));
jest.mock('../../../config/logger', () => ({
  __esModule: true, default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../../utils/auditLogger', () => ({ AuditLogger: { log: jest.fn() } }));
jest.mock('../../../config', () => ({
  __esModule: true,
  default: { server: { baseUrl: 'http://localhost:3000' } },
}));
jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if ((req as any).user) { next(); return; }
    res.status(401).json({ error: 'No token provided' });
  },
  authorize: (...roles: string[]) => (req: any, res: any, next: any) => {
    if (!(req as any).user) { res.status(401).json({ error: 'Authentication required' }); return; }
    const userRole = (req as any).user.role?.toLowerCase();
    if (roles.length > 0 && !roles.includes(userRole)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  },
  AuthRequest: {},
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
}));

import ssoRoutes from '../../../routes/sso';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next): void => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try { (req as any).user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'test-secret') as any; } catch {}
  }
  next();
});
app.use('/api/sso', ssoRoutes);
app.use(errorHandler);

const generateTestToken = (userId = 'user-123', organizationId = 'org-123', role = 'admin') =>
  jwt.sign({ id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const viewerToken = generateTestToken('user-456', 'org-123', 'viewer');

describe('SSO API — Contract Tests', () => {
  const authToken = generateTestToken();
  beforeEach(() => { jest.clearAllMocks(); });

  // POST /acs (unauthenticated — SAML callback)
  describe('POST /api/sso/acs', () => {
    it('should return 400 when SAMLResponse missing', async () => {
      const res = await request(app).post('/api/sso/acs').send({});
      expect(res.status).toBe(400);
    });

    it('should return 400 for a SAML response that fails signature verification', async () => {
      // A matching, enabled config (by issuer/entityId) with a certificate is
      // found, so the handler proceeds to signature verification. This minimal
      // unsigned response fails verification and is rejected with 400 before any
      // claims (NameID) are trusted — the XML-signature-wrapping guard.
      prismaMock.sSOConfiguration.findFirst.mockResolvedValue({
        id: 'sso-1', organizationId: 'org-123', enabled: true,
        entityId: 'idp', certificate: 'CERT_DATA',
        organization: { id: 'org-123', name: 'Test Org' },
      });
      const saml = Buffer.from('<Response><Issuer>idp</Issuer></Response>').toString('base64');
      const res = await request(app).post('/api/sso/acs').send({ SAMLResponse: saml });
      expect(res.status).toBe(400);
    });
  });

  // GET /login/:orgSlug (unauthenticated)
  describe('GET /api/sso/login/:orgSlug', () => {
    it('should initiate SSO login', async () => {
      prismaMock.organization.findFirst.mockResolvedValue({ id: 'org-1', name: 'Test Org', slug: 'test-org' });
      prismaMock.sSOConfiguration.findUnique.mockResolvedValue({
        organizationId: 'org-1', enabled: true, ssoUrl: 'https://idp.example.com/sso',
        provider: 'SAML', entityId: 'entity-1',
      });

      const res = await request(app).get('/api/sso/login/test-org');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('redirectUrl');
      expect(res.body.data).toHaveProperty('provider');
    });

    it('should return 404 when org not found', async () => {
      prismaMock.organization.findFirst.mockResolvedValue(null);
      const res = await request(app).get('/api/sso/login/bad-org');
      expect(res.status).toBe(404);
    });

    it('should return 404 when SSO not configured', async () => {
      prismaMock.organization.findFirst.mockResolvedValue({ id: 'org-1', name: 'O', slug: 'o' });
      prismaMock.sSOConfiguration.findUnique.mockResolvedValue(null);
      const res = await request(app).get('/api/sso/login/o');
      expect(res.status).toBe(404);
    });
  });

  // GET /config (authenticated)
  describe('GET /api/sso/config', () => {
    it('should return SSO config (certificate redacted)', async () => {
      prismaMock.sSOConfiguration.findUnique.mockResolvedValue({
        organizationId: 'org-123', provider: 'SAML', enabled: true,
        entityId: 'eid', ssoUrl: 'https://sso.test', certificate: 'CERT_DATA',
        metadataUrl: null, attributeMapping: null, defaultRole: 'viewer',
        autoProvision: true, domains: [],
      });

      const res = await request(app).get('/api/sso/config').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('hasCertificate', true);
      expect(res.body.data).not.toHaveProperty('certificate');
    });

    it('should return null when no config', async () => {
      prismaMock.sSOConfiguration.findUnique.mockResolvedValue(null);
      const res = await request(app).get('/api/sso/config').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/sso/config');
      expect(res.status).toBe(401);
    });
  });

  // POST /config (admin)
  describe('POST /api/sso/config', () => {
    it('should create/update SSO config', async () => {
      // The config POST uses sSOConfiguration.upsert; the shared prisma mock
      // predates that and omits the method, so define it here.
      if (!(prismaMock.sSOConfiguration as any).upsert) {
        (prismaMock.sSOConfiguration as any).upsert = jest.fn();
      }
      (prismaMock.sSOConfiguration as any).upsert.mockResolvedValue({
        organizationId: 'org-123', provider: 'SAML', enabled: true, certificate: 'cert',
      });

      const res = await request(app)
        .post('/api/sso/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'SAML', ssoUrl: 'https://sso.test' });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('hasCertificate');
    });

    it('should return 400 when provider missing', async () => {
      const res = await request(app).post('/api/sso/config').set('Authorization', `Bearer ${authToken}`).send({});
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid provider', async () => {
      const res = await request(app)
        .post('/api/sso/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'INVALID' });
      expect(res.status).toBe(400);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app).post('/api/sso/config').set('Authorization', `Bearer ${viewerToken}`).send({ provider: 'SAML' });
      expect(res.status).toBe(403);
    });
  });

  // DELETE /config (admin)
  describe('DELETE /api/sso/config', () => {
    it('should delete SSO config', async () => {
      prismaMock.sSOConfiguration.findUnique.mockResolvedValue({ organizationId: 'org-123' });
      prismaMock.sSOConfiguration.delete.mockResolvedValue({ organizationId: 'org-123' });

      const res = await request(app).delete('/api/sso/config').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('message');
    });

    it('should return 404 if no config exists', async () => {
      prismaMock.sSOConfiguration.findUnique.mockResolvedValue(null);
      const res = await request(app).delete('/api/sso/config').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  // GET /metadata (authenticated)
  describe('GET /api/sso/metadata', () => {
    it('should return SAML SP metadata XML', async () => {
      prismaMock.sSOConfiguration.findUnique.mockResolvedValue({ entityId: 'eid' });
      const res = await request(app).get('/api/sso/metadata').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
    });
  });

  // POST /test (admin)
  describe('POST /api/sso/test', () => {
    it('should validate SSO configuration', async () => {
      prismaMock.sSOConfiguration.findUnique.mockResolvedValue({
        organizationId: 'org-123', ssoUrl: 'https://sso.test', entityId: 'eid',
        certificate: 'BEGIN CERTIFICATE...', domains: ['example.com'], enabled: true,
      });

      const res = await request(app).post('/api/sso/test').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('valid');
      expect(res.body.data).toHaveProperty('errors');
      expect(res.body.data).toHaveProperty('warnings');
    });

    it('should return invalid when no config', async () => {
      prismaMock.sSOConfiguration.findUnique.mockResolvedValue(null);
      const res = await request(app).post('/api/sso/test').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.valid).toBe(false);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app).post('/api/sso/test').set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });
});
