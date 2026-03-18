/**
 * Incidents Route Contract Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
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
  AuditLogger: { log: jest.fn() },
}));

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if ((req as any).user) { next(); return; }
    res.status(401).json({ error: 'No token provided' });
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => {
    if (!(req as any).user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    next();
  },
  AuthRequest: {},
}));

// Create test app
import incidentsRoutes from '../../../routes/incidents';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());

app.use((req, res, next): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as Record<string, unknown>;
      (req as any).user = decoded;
    } catch {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
  }
  next();
});

app.use('/api/incidents', incidentsRoutes);
app.use(errorHandler);

const generateTestToken = (userId = 'user-123', organizationId = 'org-123', role = 'admin') => {
  return jwt.sign(
    { id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

const mockIncident = (overrides: Record<string, any> = {}) => ({
  id: 'inc-123',
  organizationId: 'org-123',
  title: 'Data Breach',
  description: 'Unauthorized access',
  severity: 'SEV1',
  category: 'DATA_BREACH',
  status: 'DETECTED',
  reportedBy: 'user-123',
  assignedTo: null,
  detectedAt: new Date(),
  containedAt: null,
  resolvedAt: null,
  closedAt: null,
  rootCause: null,
  impact: null,
  lessonsLearned: null,
  affectedSystems: [],
  affectedControls: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Incidents API', () => {
  const authToken = generateTestToken();

  describe('GET /api/incidents/metrics', () => {
    it('should return incident metrics for authenticated user', async () => {
      prismaMock.grcIncident.findMany.mockResolvedValue([
        mockIncident({ severity: 'SEV1', status: 'DETECTED', detectedAt: new Date(), containedAt: new Date(), resolvedAt: new Date() }),
      ]);

      const response = await request(app)
        .get('/api/incidents/metrics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('mttc');
      expect(response.body.data).toHaveProperty('mttr');
      expect(response.body.data).toHaveProperty('bySeverity');
      expect(response.body.data).toHaveProperty('byStatus');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/incidents/metrics');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/incidents', () => {
    it('should return paginated incidents', async () => {
      prismaMock.grcIncident.findMany.mockResolvedValue([mockIncident()]);
      prismaMock.grcIncident.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/incidents');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/incidents/:id', () => {
    it('should return a specific incident', async () => {
      prismaMock.grcIncident.findFirst.mockResolvedValue(mockIncident());

      const response = await request(app)
        .get('/api/incidents/inc-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('inc-123');
    });

    it('should return 404 for non-existent incident', async () => {
      prismaMock.grcIncident.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/incidents/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/incidents', () => {
    it('should create a new incident', async () => {
      const created = mockIncident();
      prismaMock.grcIncident.create.mockResolvedValue(created);
      prismaMock.incidentTimelineEntry.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Data Breach',
          description: 'Unauthorized access',
          severity: 'SEV1',
          category: 'DATA_BREACH',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Only title' });

      expect(response.status).toBe(400);
    });

    it('should validate severity enum', async () => {
      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test',
          description: 'Desc',
          severity: 'INVALID',
          category: 'DATA_BREACH',
        });

      expect(response.status).toBe(400);
    });

    it('should validate category enum', async () => {
      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test',
          description: 'Desc',
          severity: 'SEV1',
          category: 'INVALID',
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/incidents')
        .send({ title: 'Test', description: 'Desc', severity: 'SEV1', category: 'DATA_BREACH' });
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/incidents/:id', () => {
    it('should update an incident', async () => {
      prismaMock.grcIncident.findFirst.mockResolvedValue(mockIncident());
      prismaMock.grcIncident.update.mockResolvedValue(mockIncident({ status: 'CONTAINED' }));
      prismaMock.incidentTimelineEntry.create.mockResolvedValue({} as any);

      const response = await request(app)
        .patch('/api/incidents/inc-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'CONTAINED' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should return 404 for non-existent incident', async () => {
      prismaMock.grcIncident.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/incidents/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'CONTAINED' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/incidents/:id', () => {
    it('should archive an incident', async () => {
      prismaMock.grcIncident.findFirst.mockResolvedValue(mockIncident());
      prismaMock.grcIncident.update.mockResolvedValue(mockIncident({ status: 'CLOSED' }));
      prismaMock.incidentTimelineEntry.create.mockResolvedValue({} as any);

      const response = await request(app)
        .delete('/api/incidents/inc-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('message');
    });

    it('should return 404 for non-existent incident', async () => {
      prismaMock.grcIncident.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/incidents/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/incidents/:id/timeline', () => {
    it('should return timeline for an incident', async () => {
      prismaMock.grcIncident.findFirst.mockResolvedValue(mockIncident());
      prismaMock.incidentTimelineEntry.findMany.mockResolvedValue([
        { id: 'entry-1', action: 'INCIDENT_CREATED', details: 'Created', performedBy: 'user-123', timestamp: new Date() },
      ]);

      const response = await request(app)
        .get('/api/incidents/inc-123/timeline')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 404 if incident not found', async () => {
      prismaMock.grcIncident.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/incidents/non-existent/timeline')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/incidents/:id/timeline', () => {
    it('should add a timeline entry', async () => {
      prismaMock.grcIncident.findFirst.mockResolvedValue(mockIncident());
      prismaMock.incidentTimelineEntry.create.mockResolvedValue({
        id: 'entry-2', action: 'NOTE', details: 'Investigation started', performedBy: 'user-123',
      });

      const response = await request(app)
        .post('/api/incidents/inc-123/timeline')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'NOTE', details: 'Investigation started' });

      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      prismaMock.grcIncident.findFirst.mockResolvedValue(mockIncident());

      const response = await request(app)
        .post('/api/incidents/inc-123/timeline')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'NOTE' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/incidents/:id/tasks', () => {
    it('should create an incident task', async () => {
      prismaMock.grcIncident.findFirst.mockResolvedValue(mockIncident());
      prismaMock.incidentTask.create.mockResolvedValue({
        id: 'task-1', incidentId: 'inc-123', title: 'Investigate', assignee: 'user-123', status: 'OPEN',
      });

      const response = await request(app)
        .post('/api/incidents/inc-123/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Investigate', assignee: 'user-123' });

      expect(response.status).toBe(201);
    });

    it('should validate required fields', async () => {
      prismaMock.grcIncident.findFirst.mockResolvedValue(mockIncident());

      const response = await request(app)
        .post('/api/incidents/inc-123/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Investigate' });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/incidents/:id/tasks/:taskId', () => {
    it('should update an incident task', async () => {
      prismaMock.grcIncident.findFirst.mockResolvedValue(mockIncident());
      prismaMock.incidentTask.findFirst.mockResolvedValue({
        id: 'task-1', incidentId: 'inc-123', title: 'Investigate', assignee: 'user-123', status: 'OPEN',
      });
      prismaMock.incidentTask.update.mockResolvedValue({
        id: 'task-1', status: 'COMPLETED',
      });

      const response = await request(app)
        .patch('/api/incidents/inc-123/tasks/task-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'COMPLETED' });

      expect(response.status).toBe(200);
    });

    it('should validate status enum', async () => {
      prismaMock.grcIncident.findFirst.mockResolvedValue(mockIncident());
      prismaMock.incidentTask.findFirst.mockResolvedValue({
        id: 'task-1', incidentId: 'inc-123', title: 'Investigate', assignee: 'user-123', status: 'OPEN',
      });

      const response = await request(app)
        .patch('/api/incidents/inc-123/tasks/task-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
    });

    it('should return 404 if task not found', async () => {
      prismaMock.grcIncident.findFirst.mockResolvedValue(mockIncident());
      prismaMock.incidentTask.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/incidents/inc-123/tasks/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'COMPLETED' });

      expect(response.status).toBe(404);
    });
  });
});
