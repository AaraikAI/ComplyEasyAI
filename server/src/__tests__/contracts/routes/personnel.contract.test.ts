/**
 * Personnel Routes — Contract Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock, createMockPersonnel } from '../../mocks/prisma';

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
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => {
    if (!(req as any).user) { res.status(401).json({ error: 'Authentication required' }); return; }
    next();
  },
  AuthRequest: {},
}));
jest.mock('../../../middleware/tierMiddleware', () => ({
  requireEnterpriseFeature: () => [(_req: any, _res: any, next: any) => next()],
}));

// Mock personnelService
const mockPersonnelService = {
  createPersonnel: jest.fn(),
  completeOnboarding: jest.fn(),
  startOffboarding: jest.fn(),
  createAccessReview: jest.fn(),
  completeAccessReview: jest.fn(),
  getPersonnelByOrganization: jest.fn(),
  getPendingAccessReviews: jest.fn(),
  getComplianceSummary: jest.fn(),
  getPersonnelById: jest.fn(),
  updatePersonnel: jest.fn(),
  deletePersonnel: jest.fn(),
};
jest.mock('../../../services/personnelService', () => ({
  __esModule: true,
  default: mockPersonnelService,
}));

import personnelRoutes from '../../../routes/personnel';
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
app.use('/api/personnel', personnelRoutes);
app.use(errorHandler);

const generateTestToken = (userId = 'user-123', organizationId = 'org-123', role = 'Admin') =>
  jwt.sign({ id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

describe('Personnel API — Contract Tests', () => {
  const authToken = generateTestToken();
  beforeEach(() => { jest.clearAllMocks(); });

  // POST /
  describe('POST /api/personnel/', () => {
    it('should create a personnel record', async () => {
      const mockP = createMockPersonnel();
      mockPersonnelService.createPersonnel.mockResolvedValue(mockP);

      const res = await request(app)
        .post('/api/personnel/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@example.com',
          department: 'Engineering',
          title: 'Engineer',
          startDate: '2025-01-01',
        });
      expect(res.status).toBe(201);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).post('/api/personnel/').send({});
      expect(res.status).toBe(401);
    });
  });

  // POST /:id/complete-onboarding
  describe('POST /api/personnel/:id/complete-onboarding', () => {
    it('should complete onboarding', async () => {
      mockPersonnelService.completeOnboarding.mockResolvedValue({ id: 'p-1', status: 'Active' });
      const res = await request(app)
        .post('/api/personnel/p-1/complete-onboarding')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });

  // POST /:id/start-offboarding
  describe('POST /api/personnel/:id/start-offboarding', () => {
    it('should start offboarding', async () => {
      mockPersonnelService.startOffboarding.mockResolvedValue({ id: 'p-1', status: 'Offboarding' });
      const res = await request(app)
        .post('/api/personnel/p-1/start-offboarding')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Resignation' });
      expect(res.status).toBe(200);
    });
  });

  // POST /access-reviews
  describe('POST /api/personnel/access-reviews', () => {
    it('should create access review', async () => {
      mockPersonnelService.createAccessReview.mockResolvedValue({ id: 'ar-1' });
      const res = await request(app)
        .post('/api/personnel/access-reviews')
        .set('Authorization', `Bearer ${authToken}`)
        // schema field is reviewType (not type); unknown fields are rejected
        .send({ personnelId: 'p-1', reviewType: 'quarterly' });
      expect(res.status).toBe(201);
    });
  });

  // POST /access-reviews/:id/complete
  describe('POST /api/personnel/access-reviews/:id/complete', () => {
    it('should complete access review', async () => {
      mockPersonnelService.completeAccessReview.mockResolvedValue({ id: 'ar-1', status: 'completed' });
      const res = await request(app)
        .post('/api/personnel/access-reviews/ar-1/complete')
        .set('Authorization', `Bearer ${authToken}`)
        // completeAccessReviewSchema requires `decision`; `findings` is not a
        // schema field (recommendations/revokedAccess are), so omit it.
        .send({ decision: 'approve', recommendations: [] });
      expect(res.status).toBe(200);
    });
  });

  // GET /
  describe('GET /api/personnel/', () => {
    it('should list all personnel', async () => {
      mockPersonnelService.getPersonnelByOrganization.mockResolvedValue([createMockPersonnel()]);
      const res = await request(app).get('/api/personnel/').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/personnel/');
      expect(res.status).toBe(401);
    });
  });

  // GET /access-reviews/pending
  describe('GET /api/personnel/access-reviews/pending', () => {
    it('should return pending access reviews', async () => {
      mockPersonnelService.getPendingAccessReviews.mockResolvedValue([]);
      const res = await request(app).get('/api/personnel/access-reviews/pending').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });

  // GET /compliance-summary
  describe('GET /api/personnel/compliance-summary', () => {
    it('should return compliance summary', async () => {
      mockPersonnelService.getComplianceSummary.mockResolvedValue({ total: 10, compliant: 8 });
      const res = await request(app).get('/api/personnel/compliance-summary').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
    });
  });

  // GET /:id
  describe('GET /api/personnel/:id', () => {
    it('should return single personnel record', async () => {
      mockPersonnelService.getPersonnelById.mockResolvedValue(createMockPersonnel());
      const res = await request(app).get('/api/personnel/p-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 404 if not found', async () => {
      mockPersonnelService.getPersonnelById.mockResolvedValue(null);
      const res = await request(app).get('/api/personnel/p-bad').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  // PATCH /:id
  describe('PATCH /api/personnel/:id', () => {
    it('should update personnel record', async () => {
      mockPersonnelService.updatePersonnel.mockResolvedValue({ id: 'p-1', title: 'Senior Engineer' });
      const res = await request(app)
        .patch('/api/personnel/p-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Senior Engineer' });
      expect(res.status).toBe(200);
    });
  });

  // DELETE /:id
  describe('DELETE /api/personnel/:id', () => {
    it('should deactivate personnel record', async () => {
      mockPersonnelService.deletePersonnel.mockResolvedValue(undefined);
      const res = await request(app).delete('/api/personnel/p-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });
});
