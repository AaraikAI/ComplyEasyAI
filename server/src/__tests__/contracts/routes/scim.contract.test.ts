/**
 * SCIM 2.0 Provisioning Routes — Contract Tests
 *
 * SCIM routes use bearer token auth (not JWT), so we mock the SCIM config lookup.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({ __esModule: true, default: prismaMock }));
jest.mock('../../../config/logger', () => ({
  __esModule: true, default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../../utils/auditLogger', () => ({ AuditLogger: { log: jest.fn() } }));

import scimRoutes from '../../../routes/scim';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use('/api/scim', scimRoutes);
app.use(errorHandler);

const SCIM_TOKEN = 'scim-test-bearer-token';

describe('SCIM API — Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock SCIM bearer token auth
    prismaMock.sCIMConfiguration.findFirst.mockImplementation(async (args: any) => {
      if (args?.where?.bearerToken === SCIM_TOKEN) {
        return { id: 'scim-cfg-1', organizationId: 'org-123', enabled: true, bearerToken: SCIM_TOKEN };
      }
      return null;
    });
    prismaMock.sCIMConfiguration.update.mockResolvedValue({ id: 'scim-cfg-1' });
  });

  // GET /v2/ServiceProviderConfig (no auth required)
  describe('GET /api/scim/v2/ServiceProviderConfig', () => {
    it('should return service provider config', async () => {
      const res = await request(app).get('/api/scim/v2/ServiceProviderConfig');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('schemas');
      expect(res.body).toHaveProperty('authenticationSchemes');
    });
  });

  // GET /v2/Users
  describe('GET /api/scim/v2/Users', () => {
    it('should list users', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { id: 'u-1', email: 'a@b.com', name: 'User A', active: true, createdAt: new Date(), updatedAt: new Date() },
      ]);
      prismaMock.user.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/scim/v2/Users')
        .set('Authorization', `Bearer ${SCIM_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalResults', 1);
      expect(res.body).toHaveProperty('Resources');
      expect(res.body.Resources[0]).toHaveProperty('userName', 'a@b.com');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/scim/v2/Users')
        .set('Authorization', 'Bearer bad-token');
      expect(res.status).toBe(401);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/scim/v2/Users');
      expect(res.status).toBe(401);
    });
  });

  // POST /v2/Users
  describe('POST /api/scim/v2/Users', () => {
    it('should create a user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'u-new', email: 'new@b.com', name: 'New User', active: true,
        createdAt: new Date(), updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/scim/v2/Users')
        .set('Authorization', `Bearer ${SCIM_TOKEN}`)
        .send({ userName: 'new@b.com', name: { givenName: 'New', familyName: 'User' } });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('userName', 'new@b.com');
    });

    it('should return 409 for existing user', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: 'u-1', email: 'existing@b.com' });
      const res = await request(app)
        .post('/api/scim/v2/Users')
        .set('Authorization', `Bearer ${SCIM_TOKEN}`)
        .send({ userName: 'existing@b.com' });
      expect(res.status).toBe(409);
    });

    it('should return 400 when userName missing', async () => {
      const res = await request(app)
        .post('/api/scim/v2/Users')
        .set('Authorization', `Bearer ${SCIM_TOKEN}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // GET /v2/Users/:id
  describe('GET /api/scim/v2/Users/:id', () => {
    it('should return a user', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        id: 'u-1', email: 'a@b.com', name: 'User A', active: true,
        createdAt: new Date(), updatedAt: new Date(),
      });

      const res = await request(app)
        .get('/api/scim/v2/Users/u-1')
        .set('Authorization', `Bearer ${SCIM_TOKEN}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', 'u-1');
    });

    it('should return 404 if user not found', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      const res = await request(app).get('/api/scim/v2/Users/bad').set('Authorization', `Bearer ${SCIM_TOKEN}`);
      expect(res.status).toBe(404);
    });
  });

  // PUT /v2/Users/:id
  describe('PUT /api/scim/v2/Users/:id', () => {
    it('should replace a user', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: 'u-1', email: 'old@b.com', name: 'Old', active: true });
      prismaMock.user.update.mockResolvedValue({
        id: 'u-1', email: 'new@b.com', name: 'New Name', active: true,
        createdAt: new Date(), updatedAt: new Date(),
      });

      const res = await request(app)
        .put('/api/scim/v2/Users/u-1')
        .set('Authorization', `Bearer ${SCIM_TOKEN}`)
        .send({ userName: 'new@b.com', name: { givenName: 'New', familyName: 'Name' } });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userName', 'new@b.com');
    });

    it('should return 404 if user not found', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      const res = await request(app).put('/api/scim/v2/Users/bad').set('Authorization', `Bearer ${SCIM_TOKEN}`).send({});
      expect(res.status).toBe(404);
    });
  });

  // PATCH /v2/Users/:id
  describe('PATCH /api/scim/v2/Users/:id', () => {
    it('should patch a user', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: 'u-1', email: 'a@b.com', name: 'User A', active: true });
      prismaMock.user.update.mockResolvedValue({
        id: 'u-1', email: 'a@b.com', name: 'User A', active: false,
        createdAt: new Date(), updatedAt: new Date(),
      });

      const res = await request(app)
        .patch('/api/scim/v2/Users/u-1')
        .set('Authorization', `Bearer ${SCIM_TOKEN}`)
        .send({ Operations: [{ op: 'replace', path: 'active', value: false }] });
      expect(res.status).toBe(200);
    });

    it('should return 400 when Operations missing', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: 'u-1' });
      const res = await request(app)
        .patch('/api/scim/v2/Users/u-1')
        .set('Authorization', `Bearer ${SCIM_TOKEN}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // DELETE /v2/Users/:id
  describe('DELETE /api/scim/v2/Users/:id', () => {
    it('should deactivate a user (204)', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: 'u-1' });
      prismaMock.user.update.mockResolvedValue({ id: 'u-1', active: false });

      const res = await request(app)
        .delete('/api/scim/v2/Users/u-1')
        .set('Authorization', `Bearer ${SCIM_TOKEN}`);
      expect(res.status).toBe(204);
    });

    it('should return 404 if user not found', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      const res = await request(app).delete('/api/scim/v2/Users/bad').set('Authorization', `Bearer ${SCIM_TOKEN}`);
      expect(res.status).toBe(404);
    });
  });

  // GET /v2/Groups
  describe('GET /api/scim/v2/Groups', () => {
    it('should list groups', async () => {
      prismaMock.customRole.findMany.mockResolvedValue([
        { id: 'role-1', name: 'Admin', organizationId: 'org-123', userRoles: [], createdAt: new Date(), updatedAt: new Date() },
      ]);
      prismaMock.customRole.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/scim/v2/Groups')
        .set('Authorization', `Bearer ${SCIM_TOKEN}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalResults', 1);
      expect(res.body.Resources[0]).toHaveProperty('displayName', 'Admin');
    });
  });

  // POST /v2/Groups
  describe('POST /api/scim/v2/Groups', () => {
    it('should create a group', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue(null);
      prismaMock.customRole.create.mockResolvedValue({ id: 'role-new', name: 'Editors', organizationId: 'org-123' });
      prismaMock.customRole.findUnique.mockResolvedValue({
        id: 'role-new', name: 'Editors', userRoles: [], createdAt: new Date(), updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/scim/v2/Groups')
        .set('Authorization', `Bearer ${SCIM_TOKEN}`)
        .send({ displayName: 'Editors' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('displayName', 'Editors');
    });

    it('should return 400 when displayName missing', async () => {
      const res = await request(app)
        .post('/api/scim/v2/Groups')
        .set('Authorization', `Bearer ${SCIM_TOKEN}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate group', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({ id: 'role-1', name: 'Existing' });
      const res = await request(app)
        .post('/api/scim/v2/Groups')
        .set('Authorization', `Bearer ${SCIM_TOKEN}`)
        .send({ displayName: 'Existing' });
      expect(res.status).toBe(409);
    });
  });
});
