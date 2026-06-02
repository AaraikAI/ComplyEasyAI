/**
 * E2E Tests - Team & Organization Management Flow
 * Tests complete team workflows including user management, role assignment,
 * organization settings, and access control.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock } from '../mocks/prisma';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
  testConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => next(),
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
  aiLimiter: (req: any, res: any, next: any) => next(),
  frameworkLimiter: (req: any, res: any, next: any) => next(),
}));

// The team invite route gates with enforceLimit('maxUsers'); without a mock the
// real tier middleware queries tierService and returns 429.
jest.mock('../../middleware/tierMiddleware', () => {
  const passthrough = (_req: any, _res: any, next: any) => next();
  return {
    enforceLimit: () => passthrough,
    requireFeature: () => passthrough,
    requireTier: () => passthrough,
    attachTierInfo: () => passthrough,
    trackUsage: () => passthrough,
    requireActiveSubscription: () => passthrough,
    requireAiFeature: () => [passthrough],
    requireResourceCreation: () => [passthrough],
    requireEnterpriseFeature: () => [passthrough],
    requireVisionaryFeature: () => [passthrough],
  };
});

jest.mock('../../services/emailService', () => ({
  __esModule: true,
  default: {
    sendInvite: jest.fn().mockResolvedValue(true),
    sendRoleChange: jest.fn().mockResolvedValue(true),
    sendMagicLink: jest.fn().mockResolvedValue(true),
  },
}));

import teamRoutes from '../../routes/team';
import organizationRoutes from '../../routes/organization';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'Admin',
    email: 'admin@example.com',
    name: 'Admin User',
  };
  next();
});
app.use('/api/team', teamRoutes);
app.use('/api/organizations', organizationRoutes);
app.use(errorHandler);

describe('E2E: Team & Organization Management Flow', () => {
  // Org GET/PATCH select a fixed shape (no `industry`/`size` in select).
  const mockOrganization = {
    id: 'org-123',
    name: 'Test Company',
    plan: 'Growth',
    subscriptionStatus: 'active',
    stripeCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-456',
    email: 'member@example.com',
    name: 'Team Member',
    role: 'editor',
    avatar: 'TM',
    organizationId: 'org-123',
    lastLogin: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // The invite route uses the array form of $transaction. resetMocks:true wipes
    // the shared implementation, so re-establish an array-and-callback-aware one.
    (prismaMock.$transaction as jest.Mock).mockImplementation((arg: any) =>
      Array.isArray(arg) ? Promise.all(arg) : arg(prismaMock)
    );
    prismaMock.auditLog.create.mockResolvedValue({} as any);
  });

  describe('Team Member Management', () => {
    it('should list all team members', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockUser] as any);

      const response = await request(app)
        .get('/api/team')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('email', 'member@example.com');
    });

    it('should invite a new team member', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null as any);
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        email: 'new@example.com',
        role: 'viewer',
      } as any);
      prismaMock.magicLink.create.mockResolvedValue({
        id: 'ml-1',
        email: 'new@example.com',
        token: 'tok',
      } as any);

      const response = await request(app)
        .post('/api/team/invite')
        .send({ email: 'new@example.com', name: 'New User', role: 'viewer' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'new@example.com');
    });

    it('should reject inviting an email that already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      const response = await request(app)
        .post('/api/team/invite')
        .send({ email: 'member@example.com', name: 'Dup User', role: 'viewer' })
        .expect(409);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject an invite missing required fields', async () => {
      const response = await request(app)
        .post('/api/team/invite')
        .send({ email: 'new@example.com' }) // missing name
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should update a member role', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ ...mockUser, role: 'viewer' } as any);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, role: 'editor' } as any);

      const response = await request(app)
        .patch('/api/team/user-456')
        .send({ role: 'editor' })
        .expect(200);

      expect(response.body.role).toBe('editor');
    });

    it('should block demoting the only admin', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ ...mockUser, role: 'admin' } as any);
      prismaMock.user.count.mockResolvedValue(1);

      const response = await request(app)
        .patch('/api/team/user-456')
        .send({ role: 'editor' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should remove a team member', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any);
      prismaMock.user.delete.mockResolvedValue(mockUser as any);

      const response = await request(app)
        .delete('/api/team/user-456')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should not allow deleting your own account', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...mockUser,
        id: 'user-123', // same as the authenticated user
      } as any);

      const response = await request(app)
        .delete('/api/team/user-123')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Bulk Invitation', () => {
    it('should bulk-invite multiple members', async () => {
      prismaMock.user.findMany.mockResolvedValue([] as any);
      prismaMock.user.count.mockResolvedValue(1);
      prismaMock.user.findUnique.mockResolvedValue(null as any);
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        email: 'a@example.com',
      } as any);
      prismaMock.magicLink.create.mockResolvedValue({ id: 'ml', token: 't' } as any);

      const response = await request(app)
        .post('/api/team/bulk-invite')
        .send({
          invitations: [
            { email: 'a@example.com', name: 'A User', role: 'viewer' },
            { email: 'b@example.com', name: 'B User', role: 'editor' },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toHaveProperty('total', 2);
    });

    it('should reject a bulk invite with an invalid email', async () => {
      const response = await request(app)
        .post('/api/team/bulk-invite')
        .send({
          invitations: [{ email: 'not-an-email', name: 'X' }],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Organization Settings', () => {
    it('should get organization details', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);

      const response = await request(app)
        .get('/api/organizations')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Test Company');
      expect(response.body).toHaveProperty('plan', 'Growth');
    });

    it('should update organization settings', async () => {
      prismaMock.organization.update.mockResolvedValue({
        ...mockOrganization,
        name: 'Updated Company Name',
      } as any);

      const response = await request(app)
        .patch('/api/organizations')
        .send({ name: 'Updated Company Name', plan: 'Visionary' })
        .expect(200);

      expect(response.body.name).toBe('Updated Company Name');
    });

    it('should reject an invalid plan', async () => {
      const response = await request(app)
        .patch('/api/organizations')
        .send({ plan: 'NotAPlan' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
