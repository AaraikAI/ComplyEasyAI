/**
 * Team Routes Integration Tests
 *
 * Tests for team member management, invitations, and role updates.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock dependencies
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

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'admin@example.com',
      organizationId: 'org-123',
      role: 'Admin',
    };
    next();
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../../middleware/tierMiddleware', () => ({
  enforceLimit: () => (req: any, res: any, next: any) => next(),
}));

jest.mock('../../../services/emailService', () => ({
  __esModule: true,
  default: {
    sendMagicLink: jest.fn().mockResolvedValue(true),
  },
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-123'),
}));

jest.mock('../../../config/monitoring', () => ({
  __esModule: true,
  default: { captureException: jest.fn() },
}));

jest.mock('../../../utils/securityEventLogger', () => ({
  logSecurityEvent: jest.fn(),
  SecurityEventType: { AUTHENTICATION_FAILURE: 'AUTHENTICATION_FAILURE', AUTHORIZATION_FAILURE: 'AUTHORIZATION_FAILURE' },
}));

// Mock data factories
const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'Admin',
  organizationId: 'org-123',
  avatar: 'TU',
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Setup app
let app: Express;

beforeEach(async () => {
  jest.clearAllMocks();

  app = express();
  app.use(express.json());

  const teamRoutes = (await import('../../../routes/team')).default;
  app.use('/api/team', teamRoutes);

  // Add error handler so AppError responses are properly serialized
  const { errorHandler } = await import('../../../middleware/errorHandler');
  app.use(errorHandler);
});

describe('Team Routes Integration', () => {
  // ===========================================================================
  // List Team Members Tests
  // ===========================================================================
  describe('GET /api/team', () => {
    it('should list team members', async () => {
      const mockUsers = [
        createMockUser(),
        createMockUser({ id: 'user-456', email: 'user2@example.com', name: 'User Two', role: 'Editor' }),
      ];

      prismaMock.user.findMany.mockResolvedValue(mockUsers as any);

      const response = await request(app)
        .get('/api/team')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('should return empty array when no team members', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/team')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Invite Team Member Tests
  // ===========================================================================
  describe('POST /api/team/invite', () => {
    it('should invite a new team member', async () => {
      const newUser = createMockUser({
        id: 'user-new',
        email: 'new@example.com',
        name: 'New User',
        role: 'Viewer',
      });

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(newUser as any);
      prismaMock.magicLink.create.mockResolvedValue({
        id: 'link-123',
        email: 'new@example.com',
        token: 'mock-uuid-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      } as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/team/invite')
        .send({
          email: 'new@example.com',
          name: 'New User',
          role: 'viewer',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('new@example.com');
    });

    it('should require email', async () => {
      const response = await request(app)
        .post('/api/team/invite')
        .send({ name: 'New User' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should require name', async () => {
      const response = await request(app)
        .post('/api/team/invite')
        .send({ email: 'new@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/team/invite')
        .send({
          email: 'invalid-email',
          name: 'New User',
        })
        .expect(400);

      expect(response.body.error).toContain('email');
    });

    it('should validate role', async () => {
      const response = await request(app)
        .post('/api/team/invite')
        .send({
          email: 'new@example.com',
          name: 'New User',
          role: 'invalid-role',
        })
        .expect(400);

      expect(response.body.error).toContain('role');
    });

    it('should reject duplicate email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createMockUser() as any);

      const response = await request(app)
        .post('/api/team/invite')
        .send({
          email: 'test@example.com',
          name: 'Duplicate User',
        })
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });

    it('should default to viewer role', async () => {
      const newUser = createMockUser({
        id: 'user-new',
        email: 'new@example.com',
        role: 'viewer',
      });

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(newUser as any);
      prismaMock.magicLink.create.mockResolvedValue({} as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/team/invite')
        .send({
          email: 'new@example.com',
          name: 'New User',
        })
        .expect(201);

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'viewer',
          }),
        })
      );
    });
  });

  // ===========================================================================
  // Bulk Invite Tests
  // ===========================================================================
  describe('POST /api/team/bulk-invite', () => {
    it('should bulk invite team members', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockImplementation((data: any) =>
        Promise.resolve({
          id: 'user-new',
          ...data.data,
          createdAt: new Date(),
        })
      );
      prismaMock.magicLink.create.mockResolvedValue({} as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/team/bulk-invite')
        .send({
          invitations: [
            { email: 'user1@example.com', name: 'User One', role: 'viewer' },
            { email: 'user2@example.com', name: 'User Two', role: 'editor' },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('successful');
      expect(response.body).toHaveProperty('failed');
      expect(response.body).toHaveProperty('summary');
    });

    it('should require invitations array', async () => {
      const response = await request(app)
        .post('/api/team/bulk-invite')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject empty invitations array', async () => {
      const response = await request(app)
        .post('/api/team/bulk-invite')
        .send({ invitations: [] })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should limit to 100 invites per batch', async () => {
      const invitations = Array.from({ length: 101 }, (_, i) => ({
        email: `user${i}@example.com`,
        name: `User ${i}`,
        role: 'viewer',
      }));

      const response = await request(app)
        .post('/api/team/bulk-invite')
        .send({ invitations })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return validation errors for invalid invitations', async () => {
      const response = await request(app)
        .post('/api/team/bulk-invite')
        .send({
          invitations: [
            { email: 'invalid-email', name: 'User One', role: 'viewer' },
          ],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle partial success', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createMockUser({ email: 'existing@example.com' }) as any);
      prismaMock.user.create.mockResolvedValue({
        id: 'user-new',
        email: 'new@example.com',
        name: 'New User',
        role: 'viewer',
      } as any);
      prismaMock.magicLink.create.mockResolvedValue({} as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/team/bulk-invite')
        .send({
          invitations: [
            { email: 'new@example.com', name: 'New User', role: 'viewer' },
            { email: 'existing@example.com', name: 'Existing User', role: 'viewer' },
          ],
        })
        .expect(201);

      expect(response.body.summary.successful).toBe(1);
      expect(response.body.summary.failed).toBe(1);
    });
  });

  // ===========================================================================
  // Update Team Member Tests
  // ===========================================================================
  describe('PATCH /api/team/:id', () => {
    it('should update team member role', async () => {
      const mockUser = createMockUser({ role: 'Viewer' });
      const updatedUser = { ...mockUser, role: 'Editor' };

      prismaMock.user.findFirst.mockResolvedValue(mockUser as any);
      prismaMock.user.count.mockResolvedValue(2); // Multiple admins
      prismaMock.user.update.mockResolvedValue(updatedUser as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .patch('/api/team/user-123')
        .send({ role: 'editor' })
        .expect(200);

      expect(response.body.role).toBe('Editor');
    });

    it('should require valid role', async () => {
      const response = await request(app)
        .patch('/api/team/user-123')
        .send({ role: 'superadmin' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/team/nonexistent')
        .send({ role: 'editor' })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should prevent demoting last admin', async () => {
      const mockAdmin = createMockUser({ role: 'admin' });

      prismaMock.user.findFirst.mockResolvedValue(mockAdmin as any);
      prismaMock.user.count.mockResolvedValue(1); // Only one admin

      const response = await request(app)
        .patch('/api/team/user-123')
        .send({ role: 'editor' })
        .expect(400);

      expect(response.body.error).toContain('only admin');
    });
  });

  // ===========================================================================
  // Delete Team Member Tests
  // ===========================================================================
  describe('DELETE /api/team/:id', () => {
    it('should delete team member', async () => {
      const mockUser = createMockUser({ id: 'user-456' });

      prismaMock.user.findFirst.mockResolvedValue(mockUser as any);
      prismaMock.user.delete.mockResolvedValue(mockUser as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const response = await request(app)
        .delete('/api/team/user-456')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('removed');
    });

    it('should return 404 for non-existent user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/team/nonexistent')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should prevent self-deletion', async () => {
      // Mock user with same id as authenticated user
      const mockUser = createMockUser({ id: 'user-123' });

      prismaMock.user.findFirst.mockResolvedValue(mockUser as any);

      const response = await request(app)
        .delete('/api/team/user-123')
        .expect(400);

      expect(response.body.error).toContain('Cannot delete your own');
    });
  });
});
