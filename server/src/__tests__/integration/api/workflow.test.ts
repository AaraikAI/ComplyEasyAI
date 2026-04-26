/**
 * Workflow Routes Integration Tests
 *
 * Tests for visual workflow builder, templates, execution runs, and automation rules.
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
      email: 'test@example.com',
      organizationId: 'org-123',
      role: 'Admin',
    };
    next();
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../../middleware/tierMiddleware', () => ({
  requireVisionaryFeature: () => [(req: any, res: any, next: any) => next()],
}));

// Mock data factories
const createMockWorkflow = (overrides: Record<string, unknown> = {}) => ({
  id: 'workflow-123',
  organizationId: 'org-123',
  name: 'Incident Response Workflow',
  description: 'Automated incident response process',
  status: 'Active',
  trigger: { type: 'event', event: 'incident.created' },
  nodes: [
    { id: 'node-1', type: 'start', position: { x: 0, y: 0 } },
    { id: 'node-2', type: 'action', action: 'notify', position: { x: 100, y: 0 } },
    { id: 'node-3', type: 'end', position: { x: 200, y: 0 } },
  ],
  edges: [
    { id: 'edge-1', source: 'node-1', target: 'node-2' },
    { id: 'edge-2', source: 'node-2', target: 'node-3' },
  ],
  createdBy: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockExecution = (overrides: Record<string, unknown> = {}) => ({
  id: 'execution-123',
  workflowId: 'workflow-123',
  status: 'Running',
  startedAt: new Date(),
  triggeredBy: 'user-123',
  triggerData: { incidentId: 'incident-456' },
  currentNode: 'node-2',
  logs: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockTemplate = (overrides: Record<string, unknown> = {}) => ({
  id: 'template-123',
  name: 'SOC 2 Incident Response',
  description: 'Standard incident response workflow for SOC 2',
  category: 'Incident Management',
  nodes: [],
  edges: [],
  isPublic: true,
  createdAt: new Date(),
  ...overrides,
});

// Setup app
let app: Express;

beforeEach(async () => {
  jest.clearAllMocks();

  app = express();
  app.use(express.json());

  const workflowRoutes = (await import('../../../routes/workflow')).default;
  app.use('/api/workflow', workflowRoutes);
});

describe('Workflow Routes Integration', () => {
  // ===========================================================================
  // Workflow CRUD Tests
  // ===========================================================================
  describe('Workflow CRUD Operations', () => {
    describe('GET /api/workflow', () => {
      it('should list all workflows', async () => {
        const mockWorkflows = [createMockWorkflow(), createMockWorkflow({ id: 'workflow-456' })];
        prismaMock.gRCWorkflow.findMany.mockResolvedValue(mockWorkflows as any);
        prismaMock.gRCWorkflow.count.mockResolvedValue(2);

        const response = await request(app)
          .get('/api/workflow')
          .expect(200);

        expect(response.body).toHaveProperty('workflows');
      });

      it('should filter workflows by status', async () => {
        prismaMock.gRCWorkflow.findMany.mockResolvedValue([]);

        await request(app)
          .get('/api/workflow?status=Active')
          .expect(200);

        expect(prismaMock.gRCWorkflow.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'Active',
            }),
          })
        );
      });
    });

    describe('POST /api/workflow', () => {
      it('should create a new workflow', async () => {
        const mockWorkflow = createMockWorkflow();
        prismaMock.gRCWorkflow.create.mockResolvedValue(mockWorkflow as any);

        const response = await request(app)
          .post('/api/workflow')
          .send({
            name: 'New Workflow',
            description: 'Test workflow',
            trigger: { type: 'manual' },
            nodes: [],
            edges: [],
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Incident Response Workflow');
      });

      it('should create workflow with minimal required fields', async () => {
        const mockWorkflow = createMockWorkflow({ name: 'Minimal Workflow' });
        prismaMock.gRCWorkflow.create.mockResolvedValue(mockWorkflow as any);

        const response = await request(app)
          .post('/api/workflow')
          .send({ name: 'Minimal Workflow', description: 'Only required fields provided' })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });

    describe('GET /api/workflow/:id', () => {
      it('should get workflow by ID', async () => {
        const mockWorkflow = createMockWorkflow();
        prismaMock.gRCWorkflow.findFirst.mockResolvedValue(mockWorkflow as any);

        const response = await request(app)
          .get('/api/workflow/workflow-123')
          .expect(200);

        expect(response.body.id).toBe('workflow-123');
      });

      it('should return 404 for non-existent workflow', async () => {
        prismaMock.gRCWorkflow.findFirst.mockResolvedValue(null);

        await request(app)
          .get('/api/workflow/nonexistent')
          .expect(404);
      });
    });

    describe('PATCH /api/workflow/:id', () => {
      it('should update workflow', async () => {
        const mockWorkflow = createMockWorkflow();
        const updatedWorkflow = { ...mockWorkflow, name: 'Updated Workflow' };

        prismaMock.gRCWorkflow.findFirst.mockResolvedValue(mockWorkflow as any);
        prismaMock.gRCWorkflow.update.mockResolvedValue(updatedWorkflow as any);

        const response = await request(app)
          .patch('/api/workflow/workflow-123')
          .send({ name: 'Updated Workflow' })
          .expect(200);

        expect(response.body.name).toBe('Updated Workflow');
      });
    });

    describe('DELETE /api/workflow/:id', () => {
      it('should delete workflow', async () => {
        const mockWorkflow = createMockWorkflow();

        prismaMock.gRCWorkflow.findFirst.mockResolvedValue(mockWorkflow as any);
        prismaMock.gRCWorkflow.delete.mockResolvedValue(mockWorkflow as any);

        await request(app)
          .delete('/api/workflow/workflow-123')
          .expect(204);
      });
    });
  });

  // ===========================================================================
  // Workflow Duplication Tests
  // ===========================================================================
  describe('Workflow Duplication', () => {
    describe('POST /api/workflow/:id/duplicate', () => {
      it('should duplicate a workflow', async () => {
        const mockWorkflow = createMockWorkflow();
        const duplicatedWorkflow = createMockWorkflow({
          id: 'workflow-dup',
          name: 'Incident Response Workflow (Copy)',
        });

        prismaMock.gRCWorkflow.findFirst.mockResolvedValue(mockWorkflow as any);
        prismaMock.gRCWorkflow.create.mockResolvedValue(duplicatedWorkflow as any);

        const response = await request(app)
          .post('/api/workflow/workflow-123/duplicate')
          .expect(201);

        expect(response.body.id).not.toBe('workflow-123');
      });
    });
  });

  // ===========================================================================
  // Workflow Execution Tests
  // ===========================================================================
  describe('Workflow Execution', () => {
    describe('POST /api/workflow/:id/run', () => {
      it('should start workflow execution', async () => {
        const mockWorkflow = createMockWorkflow();
        const mockExecution = createMockExecution();

        prismaMock.gRCWorkflow.findFirst.mockResolvedValue(mockWorkflow as any);
        prismaMock.workflowExecution.create.mockResolvedValue(mockExecution as any);

        const response = await request(app)
          .post('/api/workflow/workflow-123/run')
          .send({ triggerData: { incidentId: 'incident-456' } })
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body.status).toBe('Running');
      });

      it('should return 404 for non-existent workflow', async () => {
        prismaMock.gRCWorkflow.findFirst.mockResolvedValue(null);

        await request(app)
          .post('/api/workflow/nonexistent/run')
          .send({})
          .expect(404);
      });
    });

    describe('GET /api/workflow/runs/list', () => {
      it('should list execution runs', async () => {
        const mockExecutions = [
          createMockExecution(),
          createMockExecution({ id: 'execution-456', status: 'Completed' }),
        ];

        // Route first gets org workflow IDs, then queries executions
        prismaMock.gRCWorkflow.findMany.mockResolvedValue([{ id: 'workflow-123' }] as any);
        prismaMock.workflowExecution.findMany.mockResolvedValue(mockExecutions as any);
        prismaMock.workflowExecution.count.mockResolvedValue(2);

        const response = await request(app)
          .get('/api/workflow/runs/list')
          .expect(200);

        expect(response.body).toBeDefined();
      });

      it('should filter runs by status', async () => {
        prismaMock.gRCWorkflow.findMany.mockResolvedValue([{ id: 'workflow-123' }] as any);
        prismaMock.workflowExecution.findMany.mockResolvedValue([]);
        prismaMock.workflowExecution.count.mockResolvedValue(0);

        await request(app)
          .get('/api/workflow/runs/list?status=Completed')
          .expect(200);

        expect(prismaMock.workflowExecution.findMany).toHaveBeenCalled();
      });

      it('should filter runs by workflow ID', async () => {
        prismaMock.gRCWorkflow.findMany.mockResolvedValue([{ id: 'workflow-123' }] as any);
        prismaMock.workflowExecution.findMany.mockResolvedValue([]);
        prismaMock.workflowExecution.count.mockResolvedValue(0);

        await request(app)
          .get('/api/workflow/runs/list?workflowId=workflow-123')
          .expect(200);

        expect(prismaMock.workflowExecution.findMany).toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // Workflow Templates Tests
  // ===========================================================================
  describe('Workflow Templates', () => {
    describe('GET /api/workflow/templates/list', () => {
      it('should list workflow templates', async () => {
        // Templates are hardcoded in the route, no prisma mock needed
        const response = await request(app)
          .get('/api/workflow/templates/list')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should return templates with expected fields', async () => {
        const response = await request(app)
          .get('/api/workflow/templates/list')
          .expect(200);

        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('category');
      });
    });

    describe('POST /api/workflow/templates/:id/use', () => {
      it('should create workflow from template', async () => {
        const mockWorkflow = createMockWorkflow();
        prismaMock.gRCWorkflow.create.mockResolvedValue(mockWorkflow as any);

        const response = await request(app)
          .post('/api/workflow/templates/tpl-vendor-risk/use')
          .send({ name: 'My Custom Workflow' })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });

      it('should create workflow even with unknown template id', async () => {
        const mockWorkflow = createMockWorkflow();
        prismaMock.gRCWorkflow.create.mockResolvedValue(mockWorkflow as any);

        const response = await request(app)
          .post('/api/workflow/templates/nonexistent/use')
          .send({ name: 'My Workflow' })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });
  });

  // ===========================================================================
  // Automation Rules Tests
  // ===========================================================================
  describe('Automation Rules', () => {
    describe('POST /api/workflow/rules', () => {
      it('should create automation rule', async () => {
        const mockRule = {
          id: 'rule-123',
          organizationId: 'org-123',
          name: 'Auto-trigger on incident',
          trigger: { type: 'event', config: { event: 'incident.created' } },
          nodes: [],
          edges: [],
          status: 'Active',
          createdBy: 'user-123',
        };

        prismaMock.gRCWorkflow.create.mockResolvedValue(mockRule as any);

        const response = await request(app)
          .post('/api/workflow/rules')
          .send({
            name: 'Auto-trigger on incident',
            trigger: { event: 'incident.created' },
            conditions: [],
            actions: [],
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });
  });
});
