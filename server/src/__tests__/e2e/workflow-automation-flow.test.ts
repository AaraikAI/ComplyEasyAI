/**
 * E2E Tests - Workflow Automation Flow
 * Tests complete workflow automation including visual builder,
 * triggers, actions, execution, and monitoring.
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
    send: jest.fn().mockResolvedValue(true),
  },
}));

import workflowRoutes from '../../routes/workflow';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'Admin',
    email: 'admin@example.com',
  };
  next();
});
app.use('/api/workflows', workflowRoutes);
app.use(errorHandler);

describe('E2E: Workflow Automation Flow', () => {
  // Prisma model is `gRCWorkflow`; executions are `workflowExecution`.
  const mockWorkflow = {
    id: 'wf-123',
    name: 'Risk Escalation Workflow',
    description: 'Escalate high risks to management',
    status: 'Active',
    workflowType: 'Custom',
    organizationId: 'org-123',
    trigger: { type: 'event', config: {} },
    nodes: [],
    edges: [],
    variables: {},
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockExecution = {
    id: 'exec-123',
    workflowId: 'wf-123',
    status: 'Running',
    triggeredBy: 'user-123',
    triggerType: 'manual',
    completedNodes: [],
    nodeResults: {},
    variables: {},
    startedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Workflow CRUD', () => {
    it('should create a new workflow', async () => {
      prismaMock.gRCWorkflow.create.mockResolvedValue(mockWorkflow as any);

      const response = await request(app)
        .post('/api/workflows')
        .send({
          name: 'Risk Escalation Workflow',
          description: 'Escalate high risks to management',
          workflowType: 'Custom',
          trigger: { type: 'event', config: {} },
          status: 'Active',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'wf-123');
      expect(response.body.name).toBe('Risk Escalation Workflow');
    });

    it('should reject creating a workflow without a name', async () => {
      const response = await request(app)
        .post('/api/workflows')
        .send({ description: 'no name' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should list workflows (paginated envelope)', async () => {
      prismaMock.gRCWorkflow.findMany.mockResolvedValue([mockWorkflow] as any);
      prismaMock.gRCWorkflow.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/workflows')
        .query({ status: 'Active' })
        .expect(200);

      expect(response.body).toHaveProperty('workflows');
      expect(Array.isArray(response.body.workflows)).toBe(true);
      expect(response.body).toHaveProperty('total', 1);
    });

    it('should get a single workflow with recent executions', async () => {
      prismaMock.gRCWorkflow.findFirst.mockResolvedValue({
        ...mockWorkflow,
        executions: [mockExecution],
      } as any);

      const response = await request(app)
        .get('/api/workflows/wf-123')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'wf-123');
    });

    it('should update a workflow definition', async () => {
      prismaMock.gRCWorkflow.findFirst.mockResolvedValue(mockWorkflow as any);
      prismaMock.gRCWorkflow.update.mockResolvedValue({
        ...mockWorkflow,
        status: 'Draft',
      } as any);

      const response = await request(app)
        .patch('/api/workflows/wf-123')
        .send({ status: 'Draft' })
        .expect(200);

      expect(response.body.status).toBe('Draft');
    });

    it('should duplicate a workflow', async () => {
      prismaMock.gRCWorkflow.findFirst.mockResolvedValue(mockWorkflow as any);
      prismaMock.gRCWorkflow.create.mockResolvedValue({
        ...mockWorkflow,
        id: 'wf-124',
        name: 'Risk Escalation Workflow (Copy)',
        status: 'Draft',
      } as any);

      const response = await request(app)
        .post('/api/workflows/wf-123/duplicate')
        .expect(201);

      expect(response.body.name).toContain('Copy');
    });
  });

  describe('Workflow Execution', () => {
    it('should manually run a workflow', async () => {
      prismaMock.gRCWorkflow.findFirst.mockResolvedValue(mockWorkflow as any);
      prismaMock.workflowExecution.create.mockResolvedValue(mockExecution as any);
      prismaMock.gRCWorkflow.update.mockResolvedValue(mockWorkflow as any);

      const response = await request(app)
        .post('/api/workflows/wf-123/run')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'exec-123');
      expect(response.body).toHaveProperty('status', 'Running');
    });

    it('should return 404 running a workflow that is not owned', async () => {
      prismaMock.gRCWorkflow.findFirst.mockResolvedValue(null as any);

      const response = await request(app)
        .post('/api/workflows/wf-999/run')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should list execution runs (paginated envelope)', async () => {
      prismaMock.gRCWorkflow.findMany.mockResolvedValue([{ id: 'wf-123' }] as any);
      prismaMock.workflowExecution.findMany.mockResolvedValue([
        { ...mockExecution, workflow: { id: 'wf-123', name: 'WF', workflowType: 'Custom' } },
      ] as any);
      prismaMock.workflowExecution.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/workflows/runs/list')
        .expect(200);

      expect(response.body).toHaveProperty('runs');
      expect(Array.isArray(response.body.runs)).toBe(true);
      expect(response.body).toHaveProperty('total', 1);
    });
  });

  describe('Workflow Templates', () => {
    it('should list built-in workflow templates', async () => {
      const response = await request(app)
        .get('/api/workflows/templates/list')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
    });

    it('should create a workflow from a template', async () => {
      prismaMock.gRCWorkflow.create.mockResolvedValue({
        ...mockWorkflow,
        id: 'wf-125',
        name: 'Vendor Risk Assessment',
        status: 'Draft',
      } as any);

      const response = await request(app)
        .post('/api/workflows/templates/tpl-vendor-risk/use')
        .expect(201);

      expect(response.body).toHaveProperty('id', 'wf-125');
    });
  });

  describe('Workflow Automation Rules', () => {
    it('should create an automation rule (event-triggered workflow)', async () => {
      prismaMock.gRCWorkflow.create.mockResolvedValue({
        ...mockWorkflow,
        id: 'rule-123',
        name: 'Auto-assign high risks',
      } as any);

      const response = await request(app)
        .post('/api/workflows/rules')
        .send({
          name: 'Auto-assign high risks',
          trigger: { event: 'risk.created' },
          conditions: [{ field: 'severity', operator: 'equals', value: 'High' }],
          actions: [{ type: 'assign' }],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'rule-123');
    });

    it('should list automation rules', async () => {
      prismaMock.gRCWorkflow.findMany.mockResolvedValue([mockWorkflow] as any);
      prismaMock.gRCWorkflow.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/workflows/rules/list')
        .expect(200);

      expect(response.body).toHaveProperty('rules');
      expect(Array.isArray(response.body.rules)).toBe(true);
    });

    it('should update an automation rule', async () => {
      prismaMock.gRCWorkflow.findFirst.mockResolvedValue(mockWorkflow as any);
      prismaMock.gRCWorkflow.update.mockResolvedValue({
        ...mockWorkflow,
        status: 'Disabled',
      } as any);

      const response = await request(app)
        .patch('/api/workflows/rules/wf-123')
        .send({ status: 'Disabled' })
        .expect(200);

      expect(response.body.status).toBe('Disabled');
    });
  });
});
