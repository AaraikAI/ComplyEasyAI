/**
 * Custom Role Management Routes — Contract Tests
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

import rolesRoutes from '../../../routes/roles';
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
app.use('/api/roles', rolesRoutes);
app.use(errorHandler);

const generateTestToken = (userId = 'user-123', organizationId = 'org-123', role = 'admin') =>
  jwt.sign({ id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

const viewerToken = generateTestToken('user-456', 'org-123', 'viewer');

describe('Roles API — Contract Tests', () => {
  const authToken = generateTestToken();
  beforeEach(() => { jest.clearAllMocks(); });

  // GET /
  describe('GET /api/roles/', () => {
    it('should list custom roles', async () => {
      prismaMock.customRole.findMany.mockResolvedValue([]);
      prismaMock.customRole.count.mockResolvedValue(0);
      const res = await request(app).get('/api/roles/').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('roles');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/roles/');
      expect(res.status).toBe(401);
    });
  });

  // GET /:id
  describe('GET /api/roles/:id', () => {
    it('should return role with permissions', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({
        id: 'role-1', organizationId: 'org-123', name: 'Editor', permissions: [], _count: { userRoles: 2 },
      });
      const res = await request(app).get('/api/roles/role-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('name', 'Editor');
    });

    it('should return 404 if not found', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue(null);
      const res = await request(app).get('/api/roles/role-bad').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  // POST / (admin)
  describe('POST /api/roles/', () => {
    it('should create a custom role', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue(null); // no duplicate
      prismaMock.customRole.create.mockResolvedValue({ id: 'role-1', name: 'Auditor', permissions: [], _count: { userRoles: 0 } });

      const res = await request(app)
        .post('/api/roles/')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Auditor' });
      expect(res.status).toBe(201);
    });

    it('should return 400 when name missing', async () => {
      const res = await request(app).post('/api/roles/').set('Authorization', `Bearer ${authToken}`).send({});
      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate name', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({ id: 'role-1', name: 'Existing' });
      const res = await request(app).post('/api/roles/').set('Authorization', `Bearer ${authToken}`).send({ name: 'Existing' });
      expect(res.status).toBe(409);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app).post('/api/roles/').set('Authorization', `Bearer ${viewerToken}`).send({ name: 'X' });
      expect(res.status).toBe(403);
    });
  });

  // PATCH /:id (admin)
  describe('PATCH /api/roles/:id', () => {
    it('should update a role', async () => {
      // First findFirst loads the role being updated; because the name changes,
      // the handler runs a second findFirst to check for a duplicate name —
      // that must resolve to null so no 409 conflict is raised.
      prismaMock.customRole.findFirst
        .mockResolvedValueOnce({ id: 'role-1', organizationId: 'org-123', isSystem: false, name: 'Old' })
        .mockResolvedValueOnce(null);
      prismaMock.customRole.update.mockResolvedValue({ id: 'role-1', name: 'New', permissions: [] });

      const res = await request(app).patch('/api/roles/role-1').set('Authorization', `Bearer ${authToken}`).send({ name: 'New' });
      expect(res.status).toBe(200);
    });

    it('should return 403 for system roles', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({ id: 'role-1', organizationId: 'org-123', isSystem: true, name: 'Admin' });
      const res = await request(app).patch('/api/roles/role-1').set('Authorization', `Bearer ${authToken}`).send({ name: 'X' });
      expect(res.status).toBe(403);
    });
  });

  // DELETE /:id (admin)
  describe('DELETE /api/roles/:id', () => {
    it('should delete a role', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({ id: 'role-1', organizationId: 'org-123', isSystem: false });
      prismaMock.userRole.count.mockResolvedValue(0);
      prismaMock.customRole.delete.mockResolvedValue({ id: 'role-1' });

      const res = await request(app).delete('/api/roles/role-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 409 if users assigned', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({ id: 'role-1', organizationId: 'org-123', isSystem: false });
      prismaMock.userRole.count.mockResolvedValue(3);

      const res = await request(app).delete('/api/roles/role-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(409);
    });

    it('should return 403 for system roles', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({ id: 'role-1', organizationId: 'org-123', isSystem: true });
      const res = await request(app).delete('/api/roles/role-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(403);
    });
  });

  // POST /:id/permissions (admin)
  describe('POST /api/roles/:id/permissions', () => {
    it('should add permission to role', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({ id: 'role-1', organizationId: 'org-123', isSystem: false });
      prismaMock.rolePermission.findFirst.mockResolvedValue(null);
      prismaMock.rolePermission.create.mockResolvedValue({ id: 'perm-1', roleId: 'role-1', resource: 'risks', action: 'read', scope: 'OWN' });

      const res = await request(app)
        .post('/api/roles/role-1/permissions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ resource: 'risks', action: 'read' });
      expect(res.status).toBe(201);
    });

    it('should return 400 for invalid action', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({ id: 'role-1', organizationId: 'org-123', isSystem: false });
      const res = await request(app)
        .post('/api/roles/role-1/permissions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ resource: 'risks', action: 'nuke' });
      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate permission', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({ id: 'role-1', organizationId: 'org-123', isSystem: false });
      prismaMock.rolePermission.findFirst.mockResolvedValue({ id: 'perm-1' });
      const res = await request(app)
        .post('/api/roles/role-1/permissions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ resource: 'risks', action: 'read' });
      expect(res.status).toBe(409);
    });
  });

  // DELETE /:id/permissions/:permId (admin)
  describe('DELETE /api/roles/:id/permissions/:permId', () => {
    it('should remove permission from role', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({ id: 'role-1', organizationId: 'org-123', isSystem: false });
      prismaMock.rolePermission.findFirst.mockResolvedValue({ id: 'perm-1', roleId: 'role-1' });
      prismaMock.rolePermission.delete.mockResolvedValue({ id: 'perm-1' });

      const res = await request(app).delete('/api/roles/role-1/permissions/perm-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 404 if permission not found', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({ id: 'role-1', organizationId: 'org-123', isSystem: false });
      prismaMock.rolePermission.findFirst.mockResolvedValue(null);
      const res = await request(app).delete('/api/roles/role-1/permissions/perm-bad').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  // GET /:id/users
  describe('GET /api/roles/:id/users', () => {
    it('should list users assigned to role', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({ id: 'role-1', organizationId: 'org-123' });
      prismaMock.userRole.findMany.mockResolvedValue([]);
      prismaMock.userRole.count.mockResolvedValue(0);

      const res = await request(app).get('/api/roles/role-1/users').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('users');
    });
  });

  // POST /assign (admin)
  describe('POST /api/roles/assign', () => {
    it('should assign role to user', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({ id: 'role-1', organizationId: 'org-123' });
      prismaMock.user.findFirst.mockResolvedValue({ id: 'user-999', organizationId: 'org-123' });
      prismaMock.userRole.findFirst.mockResolvedValue(null);
      prismaMock.userRole.create.mockResolvedValue({
        id: 'ur-1', userId: 'user-999', roleId: 'role-1',
        user: { id: 'user-999', name: 'U', email: 'u@e.com' },
        role: { id: 'role-1', name: 'R' },
      });

      const res = await request(app)
        .post('/api/roles/assign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: 'user-999', roleId: 'role-1' });
      expect(res.status).toBe(201);
    });

    it('should return 400 when fields missing', async () => {
      const res = await request(app).post('/api/roles/assign').set('Authorization', `Bearer ${authToken}`).send({});
      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate assignment', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({ id: 'role-1', organizationId: 'org-123' });
      prismaMock.user.findFirst.mockResolvedValue({ id: 'user-999', organizationId: 'org-123' });
      prismaMock.userRole.findFirst.mockResolvedValue({ id: 'ur-1' });

      const res = await request(app)
        .post('/api/roles/assign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: 'user-999', roleId: 'role-1' });
      expect(res.status).toBe(409);
    });
  });

  // DELETE /assign/:userId/:roleId (admin)
  describe('DELETE /api/roles/assign/:userId/:roleId', () => {
    it('should remove role assignment', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({ id: 'role-1', organizationId: 'org-123' });
      prismaMock.userRole.findFirst.mockResolvedValue({ id: 'ur-1', userId: 'user-999', roleId: 'role-1' });
      prismaMock.userRole.delete.mockResolvedValue({ id: 'ur-1' });

      const res = await request(app).delete('/api/roles/assign/user-999/role-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 404 if assignment not found', async () => {
      prismaMock.customRole.findFirst.mockResolvedValue({ id: 'role-1', organizationId: 'org-123' });
      prismaMock.userRole.findFirst.mockResolvedValue(null);
      const res = await request(app).delete('/api/roles/assign/user-bad/role-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });
});
