/**
 * Swarm Task Allocation Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import swarmTaskAllocationService from '../../../../services/advanced/swarmTaskAllocationService';

describe('SwarmTaskAllocationService', () => {
  const orgId = 'org-123';

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset internal state
    (swarmTaskAllocationService as any).agents = new Map();
    (swarmTaskAllocationService as any).activeTasks = new Map();
    (swarmTaskAllocationService as any).completedTasks = new Map();
    // Re-initialize task queues
    const taskQueue = new Map();
    taskQueue.set('critical', []);
    taskQueue.set('high', []);
    taskQueue.set('medium', []);
    taskQueue.set('low', []);
    (swarmTaskAllocationService as any).taskQueue = taskQueue;
    (swarmTaskAllocationService as any).historicalMetrics = new Map();
    (swarmTaskAllocationService as any).metricAlerts = new Map();
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
  });

  describe('registerAgent', () => {
    it('should register a new agent', async () => {
      const agentConfig = {
        name: 'Evidence Collector Agent',
        type: 'evidence_collector' as const,
        capabilities: ['evidence_processing', 'document_analysis'] as any[],
        maxLoad: 10,
      };

      const agent = await swarmTaskAllocationService.registerAgent(orgId, agentConfig);

      expect(agent).toBeDefined();
      expect(agent.id).toBeDefined();
      expect(agent.name).toBe('Evidence Collector Agent');
      expect(agent.status).toBe('available');
      expect(agent.currentLoad).toBe(0);
    });

    it('should register multiple agents', async () => {
      await swarmTaskAllocationService.registerAgent(orgId, {
        name: 'Agent A',
        type: 'evidence_collector' as const,
        capabilities: ['evidence_processing'] as any[],
        maxLoad: 5,
      });
      await swarmTaskAllocationService.registerAgent(orgId, {
        name: 'Agent B',
        type: 'risk_analyzer' as const,
        capabilities: ['risk_assessment'] as any[],
        maxLoad: 5,
      });

      const agents = swarmTaskAllocationService.getAgents();
      expect(agents.length).toBe(2);
    });
  });

  describe('submitTask', () => {
    it('should submit a task successfully', async () => {
      // Register an agent first
      await swarmTaskAllocationService.registerAgent(orgId, {
        name: 'Test Agent',
        type: 'evidence_collector' as const,
        capabilities: ['evidence_processing'] as any[],
        maxLoad: 10,
      });

      const task = await swarmTaskAllocationService.submitTask(
        orgId,
        {
          taskType: 'evidence_collection',
          priority: 'medium',
          payload: {
            parameters: { targetId: 'ctrl-1' },
          },
          constraints: {
            requiredCapabilities: ['evidence_processing'] as any[],
            minAgents: 1,
            maxAgents: 1,
          },
          dependencies: [],
        },
        'user-123'
      );

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.status).toBeDefined();
      expect(task.organizationId).toBe(orgId);
    });

    it('should validate task has required fields', async () => {
      const invalidTask: any = {
        taskType: null,
        priority: 'medium',
        payload: { parameters: {} },
        constraints: {
          requiredCapabilities: [],
          minAgents: 1,
          maxAgents: 1,
        },
        dependencies: [],
      };

      await expect(
        swarmTaskAllocationService.submitTask(orgId, invalidTask, 'user-123')
      ).rejects.toThrow();
    });

    it('should reject task with past deadline', async () => {
      await expect(
        swarmTaskAllocationService.submitTask(
          orgId,
          {
            taskType: 'evidence_collection',
            priority: 'high',
            payload: { parameters: {} },
            constraints: {
              requiredCapabilities: [] as any[],
              minAgents: 1,
              maxAgents: 1,
            },
            dependencies: [],
            deadline: new Date(Date.now() - 86400000),
          },
          'user-123'
        )
      ).rejects.toThrow();
    });

    it('should reject self-dependent tasks via validateTask', () => {
      // The task id is generated inside submitTask, so a self-dependency cannot be
      // injected through the public submit flow. Exercise the actual self-dependency
      // guard directly (swarmTaskAllocationService.ts:737) with a task whose
      // dependencies include its own id, valid constraints, and a FUTURE deadline so
      // the check under test is the one that fires (not the deadline/constraint checks).
      const selfDependentTask: any = {
        id: 'task_self_1',
        organizationId: orgId,
        taskType: 'evidence_collection',
        priority: 'high',
        status: 'pending',
        payload: { parameters: {} },
        constraints: { requiredCapabilities: [], minAgents: 1, maxAgents: 1 },
        assignedAgents: [],
        dependencies: ['task_self_1'], // depends on itself
        subtasks: [],
        createdAt: new Date(),
        deadline: new Date(Date.now() + 86400000),
        retryCount: 0,
        maxRetries: 3,
        metrics: { queueTime: 0, assignmentTime: 0, executionTime: 0, totalTime: 0, agentSwitches: 0, failureCount: 0 },
      };

      const result = (swarmTaskAllocationService as any).validateTask(selfDependentTask);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Task cannot depend on itself');
    });

    it('should accept a task that depends on a DIFFERENT task id', () => {
      // Control case: a dependency on another task id must pass the self-dependency guard.
      const okTask: any = {
        id: 'task_self_1',
        organizationId: orgId,
        taskType: 'evidence_collection',
        priority: 'high',
        status: 'pending',
        payload: { parameters: {} },
        constraints: { requiredCapabilities: [], minAgents: 1, maxAgents: 1 },
        assignedAgents: [],
        dependencies: ['task_other_2'],
        subtasks: [],
        createdAt: new Date(),
        deadline: new Date(Date.now() + 86400000),
        retryCount: 0,
        maxRetries: 3,
        metrics: { queueTime: 0, assignmentTime: 0, executionTime: 0, totalTime: 0, agentSwitches: 0, failureCount: 0 },
      };

      const result = (swarmTaskAllocationService as any).validateTask(okTask);

      expect(result.valid).toBe(true);
    });
  });

  describe('getTaskStatus', () => {
    it('should return null for non-existent task', () => {
      const status = swarmTaskAllocationService.getTaskStatus('nonexistent');
      expect(status).toBeNull();
    });
  });

  describe('cancelTask', () => {
    it('should cancel an active task', async () => {
      await swarmTaskAllocationService.registerAgent(orgId, {
        name: 'Agent',
        type: 'evidence_collector' as const,
        capabilities: ['evidence_processing'] as any[],
        maxLoad: 10,
      });

      const task = await swarmTaskAllocationService.submitTask(
        orgId,
        {
          taskType: 'evidence_collection',
          priority: 'low',
          payload: { parameters: {} },
          constraints: {
            requiredCapabilities: ['evidence_processing'] as any[],
            minAgents: 1,
            maxAgents: 1,
          },
          dependencies: [],
        },
        'user-123'
      );

      const cancelledTask = await swarmTaskAllocationService.cancelTask(
        task.id,
        'No longer needed',
        'user-123'
      );

      expect(cancelledTask).toBeDefined();
      if (cancelledTask) {
        expect(cancelledTask.status).toBe('cancelled');
      }
    });
  });

  describe('getSwarmMetrics', () => {
    it('should return swarm metrics', () => {
      const metrics = swarmTaskAllocationService.getSwarmMetrics(orgId);

      expect(metrics).toBeDefined();
      expect(metrics.totalAgents).toBeDefined();
      expect(metrics.availableAgents).toBeDefined();
    });
  });

  describe('updateAgentStatus', () => {
    it('should update agent status', async () => {
      const agent = await swarmTaskAllocationService.registerAgent(orgId, {
        name: 'Test Agent',
        type: 'general_purpose' as const,
        capabilities: ['evidence_processing'] as any[],
        maxLoad: 5,
      });

      await swarmTaskAllocationService.updateAgentStatus(agent.id, 'maintenance', orgId);

      const updatedAgent = swarmTaskAllocationService.getAgentById(agent.id);
      expect(updatedAgent).toBeDefined();
      expect(updatedAgent!.status).toBe('maintenance');
    });

    it('should throw for non-existent agent', async () => {
      await expect(
        swarmTaskAllocationService.updateAgentStatus('nonexistent', 'offline', orgId)
      ).rejects.toThrow();
    });
  });

  describe('getAllTasks', () => {
    it('should return all tasks for an organization', () => {
      const result = swarmTaskAllocationService.getAllTasks(orgId);

      expect(result).toBeDefined();
      expect(result.queued).toBeDefined();
      expect(result.active).toBeDefined();
      expect(result.completed).toBeDefined();
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard data', () => {
      const dashboard = swarmTaskAllocationService.getDashboard(orgId);

      expect(dashboard).toBeDefined();
      expect(dashboard.metrics).toBeDefined();
      expect(dashboard.topAgents).toBeDefined();
      expect(dashboard.recentTasks).toBeDefined();
    });
  });

  describe('getAgentWorkload', () => {
    it('should return agent workload', async () => {
      const agent = await swarmTaskAllocationService.registerAgent(orgId, {
        name: 'Workload Agent',
        type: 'evidence_collector' as const,
        capabilities: ['evidence_processing'] as any[],
        maxLoad: 10,
      });

      const workload = swarmTaskAllocationService.getAgentWorkload(agent.id);

      expect(workload).toBeDefined();
      expect(workload.currentLoad).toBe(0);
      expect(workload.maxLoad).toBe(10);
      expect(workload.assignedTasks).toBeDefined();
    });

    it('should throw for non-existent agent', () => {
      expect(() => {
        swarmTaskAllocationService.getAgentWorkload('nonexistent');
      }).toThrow();
    });
  });

  describe('shutdown', () => {
    it('should clean up intervals on shutdown', () => {
      swarmTaskAllocationService.shutdown();
      // Should not throw
    });
  });

  describe('exportMetrics', () => {
    it('should export metrics in JSON format', () => {
      const exported = swarmTaskAllocationService.exportMetrics(orgId, 'json');
      expect(exported).toBeDefined();
    });

    it('should export metrics in CSV format', () => {
      const exported = swarmTaskAllocationService.exportMetrics(orgId, 'csv');
      expect(exported).toBeDefined();
      expect(exported).toHaveProperty('format', 'csv');
      expect(exported).toHaveProperty('content');
    });
  });
});
