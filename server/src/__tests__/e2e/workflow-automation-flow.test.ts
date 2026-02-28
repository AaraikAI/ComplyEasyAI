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
  const mockWorkflow = {
    id: 'wf-123',
    name: 'Risk Escalation Workflow',
    description: 'Escalate high risks to management',
    status: 'Active',
    organizationId: 'org-123',
    trigger: {
      type: 'event',
      event: 'risk.created',
      conditions: [{ field: 'severity', operator: 'equals', value: 'Critical' }],
    },
    actions: [
      { type: 'notification', config: { channel: 'email', recipients: ['admin@example.com'] } },
      { type: 'assignTask', config: { assignTo: 'manager', dueInDays: 1 } },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockExecution = {
    id: 'exec-123',
    workflowId: 'wf-123',
    status: 'Completed',
    triggeredBy: 'system',
    triggerData: { riskId: 'risk-123', severity: 'Critical' },
    startedAt: new Date(),
    completedAt: new Date(),
    steps: [
      { action: 'notification', status: 'Success', duration: 150 },
      { action: 'assignTask', status: 'Success', duration: 50 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Workflow Builder Flow', () => {
    it('should create new workflow', async () => {
      prismaMock.workflow.create.mockResolvedValue(mockWorkflow as any);

      const response = await request(app)
        .post('/api/workflows')
        .send({
          name: 'Risk Escalation Workflow',
          description: 'Escalate high risks to management',
          trigger: {
            type: 'event',
            event: 'risk.created',
            conditions: [{ field: 'severity', operator: 'equals', value: 'Critical' }],
          },
          actions: [
            { type: 'notification', config: { channel: 'email', recipients: ['admin@example.com'] } },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Risk Escalation Workflow');
    });

    it('should update workflow definition', async () => {
      prismaMock.workflow.findFirst.mockResolvedValue(mockWorkflow as any);
      prismaMock.workflow.update.mockResolvedValue({
        ...mockWorkflow,
        actions: [
          ...mockWorkflow.actions,
          { type: 'createTask', config: { title: 'Review risk' } },
        ],
      } as any);

      const response = await request(app)
        .patch('/api/workflows/wf-123')
        .send({
          actions: [
            { type: 'notification', config: { channel: 'email' } },
            { type: 'createTask', config: { title: 'Review risk' } },
          ],
        })
        .expect(200);

      expect(response.body.actions).toHaveLength(2);
    });

    it('should validate workflow before save', async () => {
      const response = await request(app)
        .post('/api/workflows/validate')
        .send({
          trigger: { type: 'event', event: 'risk.created' },
          actions: [{ type: 'notification', config: {} }],
        })
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('errors');
    });

    it('should duplicate workflow', async () => {
      prismaMock.workflow.findFirst.mockResolvedValue(mockWorkflow as any);
      prismaMock.workflow.create.mockResolvedValue({
        ...mockWorkflow,
        id: 'wf-124',
        name: 'Risk Escalation Workflow (Copy)',
      } as any);

      const response = await request(app)
        .post('/api/workflows/wf-123/duplicate')
        .expect(201);

      expect(response.body.name).toContain('Copy');
    });
  });

  describe('Workflow Triggers', () => {
    it('should configure event-based trigger', async () => {
      prismaMock.workflow.findFirst.mockResolvedValue(mockWorkflow as any);
      prismaMock.workflow.update.mockResolvedValue({
        ...mockWorkflow,
        trigger: {
          type: 'event',
          event: 'control.status_changed',
          conditions: [
            { field: 'oldStatus', operator: 'equals', value: 'Draft' },
            { field: 'newStatus', operator: 'equals', value: 'Active' },
          ],
        },
      } as any);

      const response = await request(app)
        .patch('/api/workflows/wf-123/trigger')
        .send({
          type: 'event',
          event: 'control.status_changed',
          conditions: [
            { field: 'oldStatus', operator: 'equals', value: 'Draft' },
            { field: 'newStatus', operator: 'equals', value: 'Active' },
          ],
        })
        .expect(200);

      expect(response.body.trigger.event).toBe('control.status_changed');
    });

    it('should configure scheduled trigger', async () => {
      prismaMock.workflow.findFirst.mockResolvedValue(mockWorkflow as any);
      prismaMock.workflow.update.mockResolvedValue({
        ...mockWorkflow,
        trigger: {
          type: 'schedule',
          cron: '0 9 * * 1', // Every Monday at 9 AM
          timezone: 'America/New_York',
        },
      } as any);

      const response = await request(app)
        .patch('/api/workflows/wf-123/trigger')
        .send({
          type: 'schedule',
          cron: '0 9 * * 1',
          timezone: 'America/New_York',
        })
        .expect(200);

      expect(response.body.trigger.type).toBe('schedule');
    });

    it('should configure webhook trigger', async () => {
      prismaMock.workflow.findFirst.mockResolvedValue(mockWorkflow as any);
      prismaMock.workflow.update.mockResolvedValue({
        ...mockWorkflow,
        trigger: {
          type: 'webhook',
          webhookUrl: 'https://api.example.com/workflows/wf-123/trigger',
          secret: 'webhook-secret',
        },
      } as any);

      const response = await request(app)
        .patch('/api/workflows/wf-123/trigger')
        .send({
          type: 'webhook',
        })
        .expect(200);

      expect(response.body.trigger.type).toBe('webhook');
      expect(response.body.trigger).toHaveProperty('webhookUrl');
    });
  });

  describe('Workflow Execution', () => {
    it('should manually trigger workflow', async () => {
      prismaMock.workflow.findFirst.mockResolvedValue(mockWorkflow as any);
      prismaMock.workflowExecution.create.mockResolvedValue(mockExecution as any);

      const response = await request(app)
        .post('/api/workflows/wf-123/execute')
        .send({
          inputData: { riskId: 'risk-123', severity: 'Critical' },
        })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');
    });

    it('should get execution history', async () => {
      prismaMock.workflowExecution.findMany.mockResolvedValue([mockExecution] as any);

      const response = await request(app)
        .get('/api/workflows/wf-123/executions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('status');
    });

    it('should get execution details', async () => {
      prismaMock.workflowExecution.findFirst.mockResolvedValue(mockExecution as any);

      const response = await request(app)
        .get('/api/workflows/wf-123/executions/exec-123')
        .expect(200);

      expect(response.body).toHaveProperty('steps');
      expect(response.body.steps).toHaveLength(2);
    });

    it('should retry failed execution', async () => {
      const failedExecution = {
        ...mockExecution,
        status: 'Failed',
        steps: [
          { action: 'notification', status: 'Failed', error: 'Email service unavailable' },
        ],
      };
      prismaMock.workflowExecution.findFirst.mockResolvedValue(failedExecution as any);
      prismaMock.workflowExecution.create.mockResolvedValue({
        ...mockExecution,
        id: 'exec-124',
        status: 'Running',
      } as any);

      const response = await request(app)
        .post('/api/workflows/wf-123/executions/exec-123/retry')
        .expect(200);

      expect(response.body).toHaveProperty('id');
    });

    it('should cancel running execution', async () => {
      const runningExecution = { ...mockExecution, status: 'Running' };
      prismaMock.workflowExecution.findFirst.mockResolvedValue(runningExecution as any);
      prismaMock.workflowExecution.update.mockResolvedValue({
        ...mockExecution,
        status: 'Cancelled',
      } as any);

      const response = await request(app)
        .post('/api/workflows/wf-123/executions/exec-123/cancel')
        .expect(200);

      expect(response.body.status).toBe('Cancelled');
    });
  });

  describe('Workflow Templates', () => {
    it('should list workflow templates', async () => {
      const response = await request(app)
        .get('/api/workflows/templates')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should create workflow from template', async () => {
      prismaMock.workflow.create.mockResolvedValue({
        ...mockWorkflow,
        id: 'wf-125',
        name: 'Risk Escalation (from template)',
      } as any);

      const response = await request(app)
        .post('/api/workflows/templates/risk-escalation/create')
        .send({
          name: 'Risk Escalation (from template)',
          customizations: {
            'actions.0.config.recipients': ['custom@example.com'],
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Workflow Automation Rules', () => {
    it('should create automation rule', async () => {
      prismaMock.automationRule.create.mockResolvedValue({
        id: 'rule-123',
        name: 'Auto-assign high risks',
        workflowId: 'wf-123',
        enabled: true,
        conditions: [{ field: 'severity', operator: 'equals', value: 'High' }],
      } as any);

      const response = await request(app)
        .post('/api/workflows/rules')
        .send({
          name: 'Auto-assign high risks',
          workflowId: 'wf-123',
          conditions: [{ field: 'severity', operator: 'equals', value: 'High' }],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should toggle automation rule', async () => {
      prismaMock.automationRule.findFirst.mockResolvedValue({
        id: 'rule-123',
        enabled: true,
      } as any);
      prismaMock.automationRule.update.mockResolvedValue({
        id: 'rule-123',
        enabled: false,
      } as any);

      const response = await request(app)
        .patch('/api/workflows/rules/rule-123/toggle')
        .expect(200);

      expect(response.body.enabled).toBe(false);
    });
  });

  describe('Workflow Dashboard', () => {
    it('should get workflow statistics', async () => {
      prismaMock.workflow.count.mockResolvedValue(10);
      prismaMock.workflowExecution.count.mockResolvedValue(150);
      prismaMock.workflowExecution.groupBy.mockResolvedValue([
        { status: 'Completed', _count: { id: 140 } },
        { status: 'Failed', _count: { id: 10 } },
      ] as any);

      const response = await request(app)
        .get('/api/workflows/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('totalWorkflows');
      expect(response.body).toHaveProperty('executionStats');
    });

    it('should get active workflows', async () => {
      prismaMock.workflow.findMany.mockResolvedValue([mockWorkflow] as any);

      const response = await request(app)
        .get('/api/workflows')
        .query({ status: 'Active' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
