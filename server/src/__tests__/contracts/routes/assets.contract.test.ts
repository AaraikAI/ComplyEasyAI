/**
 * Assets Route Contract Tests
 */

import { jest, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({ __esModule: true, default: prismaMock }));
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
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

import assetsRoutes from '../../../routes/assets';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, res, next): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      (req as any).user = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    } catch { res.status(401).json({ error: 'Invalid token' }); return; }
  }
  next();
});
app.use('/api/assets', assetsRoutes);
app.use(errorHandler);

const generateTestToken = (role = 'admin') =>
  jwt.sign({ id: 'user-123', organizationId: 'org-123', role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const mockAsset = (overrides: Record<string, any> = {}) => ({
  id: 'asset-123', organizationId: 'org-123', name: 'Prod DB', type: 'HARDWARE',
  category: null, owner: 'user-123', department: 'IT', location: null,
  classification: 'CONFIDENTIAL', status: 'ACTIVE', ipAddress: null,
  hostname: null, serialNumber: null, vendor: null, purchaseDate: null,
  endOfLife: null, metadata: null, createdAt: new Date(), updatedAt: new Date(),
  ...overrides,
});

describe('Assets API', () => {
  const authToken = generateTestToken();

  describe('GET /api/assets/stats', () => {
    it('should return asset statistics', async () => {
      prismaMock.asset.findMany.mockResolvedValue([
        mockAsset({ type: 'HARDWARE', classification: 'CONFIDENTIAL', status: 'ACTIVE' }),
      ]);

      const response = await request(app)
        .get('/api/assets/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('byType');
      expect(response.body.data).toHaveProperty('byClassification');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/assets/stats');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/assets', () => {
    it('should return paginated assets', async () => {
      prismaMock.asset.findMany.mockResolvedValue([mockAsset()]);
      prismaMock.asset.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.meta).toHaveProperty('total');
    });
  });

  describe('GET /api/assets/:id', () => {
    it('should return a specific asset with linked data', async () => {
      prismaMock.asset.findFirst.mockResolvedValue(mockAsset());
      prismaMock.riskItem.findMany.mockResolvedValue([]);
      prismaMock.grcIncident.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/assets/asset-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('linkedRisks');
      expect(response.body.data).toHaveProperty('linkedIncidents');
    });

    it('should return 404 for non-existent asset', async () => {
      prismaMock.asset.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/assets/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/assets', () => {
    it('should create a new asset', async () => {
      prismaMock.asset.create.mockResolvedValue(mockAsset());

      const response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Prod DB', type: 'HARDWARE', owner: 'user-123' });

      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Only name' });

      expect(response.status).toBe(400);
    });

    it('should validate type enum', async () => {
      const response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test', type: 'INVALID', owner: 'user-123' });

      expect(response.status).toBe(400);
    });

    it('should validate classification enum', async () => {
      const response = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test', type: 'HARDWARE', owner: 'user-123', classification: 'INVALID' });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/assets/:id', () => {
    it('should update an asset', async () => {
      prismaMock.asset.findFirst.mockResolvedValue(mockAsset());
      prismaMock.asset.update.mockResolvedValue(mockAsset({ name: 'Updated' }));

      const response = await request(app)
        .patch('/api/assets/asset-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent asset', async () => {
      prismaMock.asset.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/assets/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/assets/:id', () => {
    it('should decommission an asset', async () => {
      prismaMock.asset.findFirst.mockResolvedValue(mockAsset());
      prismaMock.asset.update.mockResolvedValue(mockAsset({ status: 'DECOMMISSIONED' }));

      const response = await request(app)
        .delete('/api/assets/asset-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('message');
    });

    it('should return 404 for non-existent asset', async () => {
      prismaMock.asset.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/assets/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
