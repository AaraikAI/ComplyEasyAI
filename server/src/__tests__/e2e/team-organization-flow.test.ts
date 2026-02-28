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

jest.mock('../../services/emailService', () => ({
  __esModule: true,
  default: {
    sendInvite: jest.fn().mockResolvedValue(true),
    sendRoleChange: jest.fn().mockResolvedValue(true),
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
  const mockOrganization = {
    id: 'org-123',
    name: 'Test Company',
    industry: 'Technology',
    size: '50-200',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-456',
    email: 'member@example.com',
    name: 'Team Member',
    role: 'Analyst',
    organizationId: 'org-123',
    status: 'Active',
    createdAt: new Date(),
  };

  const mockInvite = {
    id: 'invite-123',
    email: 'new@example.com',
    role: 'Analyst',
    organizationId: 'org-123',
    invitedBy: 'user-123',
    status: 'Pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Team Member Invitation Flow', () => {
    it('should complete full invitation workflow', async () => {
      // Step 1: Send invitation
      prismaMock.invite.create.mockResolvedValue(mockInvite as any);
      prismaMock.user.findUnique.mockResolvedValue(null); // User doesn't exist yet

      const inviteResponse = await request(app)
        .post('/api/team/invite')
        .send({
          email: 'new@example.com',
          role: 'Analyst',
          message: 'Welcome to the team!',
        })
        .expect(201);

      expect(inviteResponse.body).toHaveProperty('id');
      const inviteId = inviteResponse.body.id;

      // Step 2: Check invitation status
      prismaMock.invite.findFirst.mockResolvedValue(mockInvite as any);

      const statusResponse = await request(app)
        .get(`/api/team/invites/${inviteId}`)
        .expect(200);

      expect(statusResponse.body.status).toBe('Pending');

      // Step 3: Accept invitation (user side - simulated)
      prismaMock.invite.findFirst.mockResolvedValue(mockInvite as any);
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        email: 'new@example.com',
      } as any);
      prismaMock.invite.update.mockResolvedValue({
        ...mockInvite,
        status: 'Accepted',
      } as any);

      const acceptResponse = await request(app)
        .post(`/api/team/invites/${inviteId}/accept`)
        .send({
          name: 'New User',
          password: 'SecurePass123!',
        })
        .expect(200);

      expect(acceptResponse.body).toHaveProperty('user');
    });

    it('should resend expired invitation', async () => {
      prismaMock.invite.findFirst.mockResolvedValue({
        ...mockInvite,
        expiresAt: new Date(Date.now() - 1000), // Expired
      } as any);
      prismaMock.invite.update.mockResolvedValue({
        ...mockInvite,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      } as any);

      const response = await request(app)
        .post('/api/team/invites/invite-123/resend')
        .expect(200);

      expect(response.body).toHaveProperty('expiresAt');
    });

    it('should revoke pending invitation', async () => {
      prismaMock.invite.findFirst.mockResolvedValue(mockInvite as any);
      prismaMock.invite.update.mockResolvedValue({
        ...mockInvite,
        status: 'Revoked',
      } as any);

      const response = await request(app)
        .delete('/api/team/invites/invite-123')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'Revoked');
    });
  });

  describe('Team Member Management', () => {
    it('should list all team members', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockUser] as any);

      const response = await request(app)
        .get('/api/team/members')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should update member role', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        role: 'Manager',
      } as any);

      const response = await request(app)
        .patch('/api/team/members/user-456')
        .send({ role: 'Manager' })
        .expect(200);

      expect(response.body.role).toBe('Manager');
    });

    it('should deactivate team member', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        status: 'Inactive',
        deactivatedAt: new Date(),
      } as any);

      const response = await request(app)
        .post('/api/team/members/user-456/deactivate')
        .send({ reason: 'Left company' })
        .expect(200);

      expect(response.body.status).toBe('Inactive');
    });

    it('should reactivate team member', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...mockUser,
        status: 'Inactive',
      } as any);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        status: 'Active',
      } as any);

      const response = await request(app)
        .post('/api/team/members/user-456/reactivate')
        .expect(200);

      expect(response.body.status).toBe('Active');
    });
  });

  describe('Organization Settings', () => {
    it('should get organization details', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);

      const response = await request(app)
        .get('/api/organizations/current')
        .expect(200);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('industry');
    });

    it('should update organization settings', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);
      prismaMock.organization.update.mockResolvedValue({
        ...mockOrganization,
        name: 'Updated Company Name',
        settings: { timezone: 'America/New_York' },
      } as any);

      const response = await request(app)
        .patch('/api/organizations/current')
        .send({
          name: 'Updated Company Name',
          settings: { timezone: 'America/New_York' },
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Company Name');
    });

    it('should configure SSO settings', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization as any);
      prismaMock.organization.update.mockResolvedValue({
        ...mockOrganization,
        ssoConfig: {
          enabled: true,
          provider: 'okta',
          domain: 'company.okta.com',
        },
      } as any);

      const response = await request(app)
        .patch('/api/organizations/current/sso')
        .send({
          enabled: true,
          provider: 'okta',
          domain: 'company.okta.com',
          clientId: 'client_123',
          clientSecret: 'secret_456',
        })
        .expect(200);

      expect(response.body.ssoConfig.enabled).toBe(true);
    });
  });

  describe('Role & Permission Management', () => {
    it('should list available roles', async () => {
      const response = await request(app)
        .get('/api/team/roles')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('permissions');
    });

    it('should create custom role', async () => {
      prismaMock.role.create.mockResolvedValue({
        id: 'role-123',
        name: 'Compliance Lead',
        permissions: ['view:all', 'edit:frameworks', 'manage:evidence'],
        organizationId: 'org-123',
      } as any);

      const response = await request(app)
        .post('/api/team/roles')
        .send({
          name: 'Compliance Lead',
          permissions: ['view:all', 'edit:frameworks', 'manage:evidence'],
        })
        .expect(201);

      expect(response.body.name).toBe('Compliance Lead');
    });

    it('should check user permissions', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...mockUser,
        permissions: ['view:risks', 'edit:risks'],
      } as any);

      const response = await request(app)
        .get('/api/team/members/user-456/permissions')
        .expect(200);

      expect(response.body).toHaveProperty('permissions');
    });
  });

  describe('Activity & Audit Trail', () => {
    it('should get team activity log', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([
        { id: 'log-1', userId: 'user-456', action: 'login', timestamp: new Date() },
        { id: 'log-2', userId: 'user-456', action: 'view_framework', timestamp: new Date() },
      ] as any);

      const response = await request(app)
        .get('/api/team/activity')
        .query({ days: 7 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get member activity', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([
        { id: 'log-1', action: 'edit_risk', timestamp: new Date() },
      ] as any);

      const response = await request(app)
        .get('/api/team/members/user-456/activity')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Multi-Team / Department Support', () => {
    it('should create department', async () => {
      prismaMock.department.create.mockResolvedValue({
        id: 'dept-123',
        name: 'Engineering',
        organizationId: 'org-123',
      } as any);

      const response = await request(app)
        .post('/api/team/departments')
        .send({
          name: 'Engineering',
          leaderId: 'user-456',
        })
        .expect(201);

      expect(response.body.name).toBe('Engineering');
    });

    it('should assign member to department', async () => {
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        departmentId: 'dept-123',
      } as any);

      const response = await request(app)
        .patch('/api/team/members/user-456/department')
        .send({ departmentId: 'dept-123' })
        .expect(200);

      expect(response.body.departmentId).toBe('dept-123');
    });
  });
});
