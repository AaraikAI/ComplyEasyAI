/**
 * Branding Routes — Contract Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock } from '../../mocks/prisma';

// The shared prisma mock does not define upsert on the brandingConfig delegate,
// which the branding routes use. Augment the mock with the missing method so the
// routes can exercise upsert; tests set the resolved value per-case.
if (typeof (prismaMock as any).brandingConfig.upsert !== 'function') {
  (prismaMock as any).brandingConfig.upsert = jest.fn();
}

jest.mock('../../../config/database', () => ({ __esModule: true, default: prismaMock }));
jest.mock('../../../config/logger', () => ({
  __esModule: true, default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../../utils/auditLogger', () => ({ AuditLogger: { log: jest.fn() } }));
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
}));

import brandingRoutes from '../../../routes/branding';
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
app.use('/api/branding', brandingRoutes);
app.use(errorHandler);

const generateTestToken = (userId = 'user-123', organizationId = 'org-123', role = 'admin') =>
  jwt.sign({ id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const viewerToken = generateTestToken('user-456', 'org-123', 'viewer');

describe('Branding API — Contract Tests', () => {
  const authToken = generateTestToken();
  beforeEach(() => { jest.clearAllMocks(); });

  // GET /
  describe('GET /api/branding/', () => {
    it('should return defaults when no config exists', async () => {
      prismaMock.brandingConfig.findUnique.mockResolvedValue(null);
      const res = await request(app).get('/api/branding/').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('isDefault', true);
      expect(res.body.data).toHaveProperty('primaryColor');
    });

    it('should return stored branding config', async () => {
      prismaMock.brandingConfig.findUnique.mockResolvedValue({
        organizationId: 'org-123', logoUrl: 'https://logo.png', primaryColor: '#FF0000',
        secondaryColor: '#00FF00', accentColor: '#0000FF',
      });
      const res = await request(app).get('/api/branding/').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('isDefault', false);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/branding/');
      expect(res.status).toBe(401);
    });
  });

  // POST / (admin)
  describe('POST /api/branding/', () => {
    it('should create/update branding config', async () => {
      prismaMock.brandingConfig.upsert.mockResolvedValue({
        organizationId: 'org-123', primaryColor: '#112233', secondaryColor: '#1E40AF', accentColor: '#10B981',
      });

      const res = await request(app)
        .post('/api/branding/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ primaryColor: '#112233' });
      expect(res.status).toBe(200);
      expect(prismaMock.brandingConfig.upsert).toHaveBeenCalled();
    });

    it('should return 400 for invalid hex color', async () => {
      const res = await request(app)
        .post('/api/branding/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ primaryColor: 'not-a-color' });
      expect(res.status).toBe(400);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .post('/api/branding/')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ primaryColor: '#FF0000' });
      expect(res.status).toBe(403);
    });
  });

  // DELETE / (admin)
  describe('DELETE /api/branding/', () => {
    it('should reset branding to defaults', async () => {
      prismaMock.brandingConfig.findUnique.mockResolvedValue({ organizationId: 'org-123' });
      prismaMock.brandingConfig.delete.mockResolvedValue({ organizationId: 'org-123' });

      const res = await request(app).delete('/api/branding/').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('message');
    });

    it('should return success even if already at defaults', async () => {
      prismaMock.brandingConfig.findUnique.mockResolvedValue(null);
      const res = await request(app).delete('/api/branding/').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app).delete('/api/branding/').set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  // POST /logo (admin, multipart) — test 400 when no file
  describe('POST /api/branding/logo', () => {
    it('should return 400 when no file uploaded', async () => {
      const res = await request(app)
        .post('/api/branding/logo')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(400);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .post('/api/branding/logo')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  // POST /favicon (admin, multipart) — test 400 when no file
  describe('POST /api/branding/favicon', () => {
    it('should return 400 when no file uploaded', async () => {
      const res = await request(app)
        .post('/api/branding/favicon')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(400);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .post('/api/branding/favicon')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });
});
