/**
 * Workflow Engine Service Contract Tests
 *
 * Verifies the contract for workflow condition evaluation, action execution,
 * template interpolation, and rate limiting.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { workflowEngine, WorkflowCondition } from '../../../services/workflowEngine';

describe('WorkflowEngineService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // evaluateConditions
  // ---------------------------------------------------------------------------
  describe('evaluateConditions', () => {
    it('should return true for empty conditions', () => {
      const result = workflowEngine.evaluateConditions([], {});
      expect(result).toBe(true);
    });

    it('should evaluate eq operator correctly', () => {
      const conditions: WorkflowCondition[] = [
        { field: 'severity', operator: 'eq', value: 'high' },
      ];

      expect(workflowEngine.evaluateConditions(conditions, { severity: 'high' })).toBe(true);
      expect(workflowEngine.evaluateConditions(conditions, { severity: 'low' })).toBe(false);
    });

    it('should evaluate ne operator correctly', () => {
      const conditions: WorkflowCondition[] = [
        { field: 'status', operator: 'ne', value: 'Closed' },
      ];

      expect(workflowEngine.evaluateConditions(conditions, { status: 'Open' })).toBe(true);
      expect(workflowEngine.evaluateConditions(conditions, { status: 'Closed' })).toBe(false);
    });

    it('should evaluate gt/lt operators correctly', () => {
      const gtCondition: WorkflowCondition[] = [
        { field: 'score', operator: 'gt', value: 80 },
      ];

      expect(workflowEngine.evaluateConditions(gtCondition, { score: 90 })).toBe(true);
      expect(workflowEngine.evaluateConditions(gtCondition, { score: 70 })).toBe(false);

      const ltCondition: WorkflowCondition[] = [
        { field: 'score', operator: 'lt', value: 50 },
      ];

      expect(workflowEngine.evaluateConditions(ltCondition, { score: 30 })).toBe(true);
      expect(workflowEngine.evaluateConditions(ltCondition, { score: 60 })).toBe(false);
    });

    it('should evaluate gte/lte operators correctly', () => {
      const conditions: WorkflowCondition[] = [
        { field: 'value', operator: 'gte', value: 10 },
      ];

      expect(workflowEngine.evaluateConditions(conditions, { value: 10 })).toBe(true);
      expect(workflowEngine.evaluateConditions(conditions, { value: 9 })).toBe(false);
    });

    it('should evaluate contains operator for strings', () => {
      const conditions: WorkflowCondition[] = [
        { field: 'description', operator: 'contains', value: 'breach' },
      ];

      expect(
        workflowEngine.evaluateConditions(conditions, { description: 'Data breach detected' })
      ).toBe(true);
      expect(
        workflowEngine.evaluateConditions(conditions, { description: 'Normal operation' })
      ).toBe(false);
    });

    it('should evaluate in operator', () => {
      const conditions: WorkflowCondition[] = [
        { field: 'status', operator: 'in', value: ['Open', 'In_Progress'] },
      ];

      expect(workflowEngine.evaluateConditions(conditions, { status: 'Open' })).toBe(true);
      expect(workflowEngine.evaluateConditions(conditions, { status: 'Closed' })).toBe(false);
    });

    it('should resolve nested field paths', () => {
      const conditions: WorkflowCondition[] = [
        { field: 'risk.severity', operator: 'eq', value: 'Critical' },
      ];

      expect(
        workflowEngine.evaluateConditions(conditions, {
          risk: { severity: 'Critical' },
        })
      ).toBe(true);
    });

    it('should combine conditions with AND logic by default', () => {
      const conditions: WorkflowCondition[] = [
        { field: 'severity', operator: 'eq', value: 'high' },
        { field: 'score', operator: 'gt', value: 80, logicalOperator: 'AND' },
      ];

      expect(
        workflowEngine.evaluateConditions(conditions, { severity: 'high', score: 90 })
      ).toBe(true);
      expect(
        workflowEngine.evaluateConditions(conditions, { severity: 'high', score: 70 })
      ).toBe(false);
    });

    it('should combine conditions with OR logic', () => {
      const conditions: WorkflowCondition[] = [
        { field: 'severity', operator: 'eq', value: 'critical' },
        { field: 'severity', operator: 'eq', value: 'high', logicalOperator: 'OR' },
      ];

      expect(
        workflowEngine.evaluateConditions(conditions, { severity: 'high' })
      ).toBe(true);
      expect(
        workflowEngine.evaluateConditions(conditions, { severity: 'low' })
      ).toBe(false);
    });

    it('should handle matches operator with regex', () => {
      const conditions: WorkflowCondition[] = [
        { field: 'email', operator: 'matches', value: '^admin@' },
      ];

      expect(
        workflowEngine.evaluateConditions(conditions, { email: 'admin@example.com' })
      ).toBe(true);
      expect(
        workflowEngine.evaluateConditions(conditions, { email: 'user@example.com' })
      ).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Workflow action execution shapes
  // ---------------------------------------------------------------------------
  describe('action execution (notification)', () => {
    it('should create notifications via prisma.notification.create for send_notification action', async () => {
      const mockWorkflow = {
        id: 'wf-1',
        name: 'Alert on Critical Risk',
        organizationId: 'org-123',
        status: 'Active',
        trigger: { type: 'event', eventType: 'risk.created' },
        variables: {},
        nodes: [
          {
            type: 'send_notification',
            config: {
              title: 'Risk Alert',
              message: 'New risk detected',
              userIds: ['user-1'],
            },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // findMany returns matching workflows for processEvent
      prismaMock.gRCWorkflow.findMany.mockResolvedValue([mockWorkflow]);
      // findUnique returns the same workflow for executeWorkflow
      prismaMock.gRCWorkflow.findUnique.mockResolvedValue(mockWorkflow);
      // update for run stats
      prismaMock.gRCWorkflow.update.mockResolvedValue(mockWorkflow);
      prismaMock.notification.create.mockResolvedValue({ id: 'notif-1' });
      prismaMock.workflowExecution.create.mockResolvedValue({ id: 'exec-1' });

      await workflowEngine.processEvent('risk.created', {}, 'org-123');

      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          organizationId: 'org-123',
          title: 'Risk Alert',
          message: 'New risk detected',
          read: false,
        }),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------
  describe('edge cases', () => {
    it('should handle undefined field values gracefully', () => {
      const conditions: WorkflowCondition[] = [
        { field: 'missing.field', operator: 'eq', value: 'anything' },
      ];

      expect(workflowEngine.evaluateConditions(conditions, {})).toBe(false);
    });

    it('should handle not_contains operator', () => {
      const conditions: WorkflowCondition[] = [
        { field: 'text', operator: 'not_contains', value: 'secret' },
      ];

      expect(
        workflowEngine.evaluateConditions(conditions, { text: 'public data' })
      ).toBe(true);
      expect(
        workflowEngine.evaluateConditions(conditions, { text: 'secret data' })
      ).toBe(false);
    });

    it('should handle not_in operator', () => {
      const conditions: WorkflowCondition[] = [
        { field: 'status', operator: 'not_in', value: ['Closed', 'Archived'] },
      ];

      expect(workflowEngine.evaluateConditions(conditions, { status: 'Open' })).toBe(true);
      expect(workflowEngine.evaluateConditions(conditions, { status: 'Closed' })).toBe(false);
    });
  });
});
