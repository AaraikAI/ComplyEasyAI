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
    (swarmTaskAllocationService as any).taskQueue = new Map();
  });

  describe('registerAgent', () => {
    it('should register a new agent', async () => {
      const agentConfig = {
        name: 'Evidence Collector Agent',
        type: 'evidence_collector' as const,
        capabilities: ['evidence_processing', 'document_analysis'] as any[],
        maxLoad: 10,
      };

      const agent = await swarmTaskAllocationService.registerAgent(agentConfig);

      expect(agent).toBeDefined();
      expect(agent.id).toBeDefined();
      expect(agent.name).toBe('Evidence Collector Agent');
      expect(agent.status).toBe('available');
      expect(agent.currentLoad).toBe(0);
    });

    it('should register multiple agents', async () => {
      await swarmTaskAllocationService.registerAgent({
        name: 'Agent A',
        type: 'evidence_collector' as const,
        capabilities: ['evidence_processing'] as any[],
        maxLoad: 5,
      });
      await swarmTaskAllocationService.registerAgent({
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
      await swarmTaskAllocationService.registerAgent({
        name: 'Test Agent',
        type: 'evidence_collector' as const,
        capabilities: ['evidence_processing'] as any[],
        maxLoad: 10,
      });

      const task = await swarmTaskAllocationService.submitTask({
        organizationId: orgId,
        taskType: 'evidence_collection',
        priority: 'medium',
        payload: {
          parameters: { targetId: 'ctrl-1' },
        },
        constraints: {
          requiredCapabilities: ['evidence_processing'] as any[],
          minAgents: 1,
          maxAgents: 1,
          requiresHumanApproval: false,
          maxExecutionTime: 60000,
          resourceRequirements: { cpu: 'low', memory: 'low', network: 'low', storage: 'low' },
          securityLevel: 'medium',
        },
        dependencies: [],
        estimatedDuration: 30000,
      });

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.status).toBeDefined();
      expect(task.organizationId).toBe(orgId);
    });

    it('should validate task has required fields', async () => {
      const invalidTask: any = {
        organizationId: orgId,
        taskType: null,
        priority: 'medium',
        payload: { parameters: {} },
        constraints: {
          requiredCapabilities: [],
          minAgents: 1,
          maxAgents: 1,
          requiresHumanApproval: false,
          maxExecutionTime: 60000,
          resourceRequirements: { cpu: 'low', memory: 'low', network: 'low', storage: 'low' },
          securityLevel: 'low',
        },
        dependencies: [],
        estimatedDuration: 1000,
      };

      await expect(
        swarmTaskAllocationService.submitTask(invalidTask)
      ).rejects.toThrow();
    });

    it('should reject task with past deadline', async () => {
      await expect(
        swarmTaskAllocationService.submitTask({
          organizationId: orgId,
          taskType: 'evidence_collection',
          priority: 'high',
          payload: { parameters: {} },
          constraints: {
            requiredCapabilities: [] as any[],
            minAgents: 1,
            maxAgents: 1,
            requiresHumanApproval: false,
            maxExecutionTime: 60000,
            resourceRequirements: { cpu: 'low', memory: 'low', network: 'low', storage: 'low' },
            securityLevel: 'low',
          },
          dependencies: [],
          estimatedDuration: 1000,
          deadline: new Date(Date.now() - 86400000),
        })
      ).rejects.toThrow();
    });

    it('should reject self-dependent tasks', async () => {
      await expect(
        swarmTaskAllocationService.submitTask({
          id: 'task-self',
          organizationId: orgId,
          taskType: 'evidence_collection',
          priority: 'high',
          payload: { parameters: {} },
          constraints: {
            requiredCapabilities: [] as any[],
            minAgents: 1,
            maxAgents: 1,
            requiresHumanApproval: false,
            maxExecutionTime: 60000,
            resourceRequirements: { cpu: 'low', memory: 'low', network: 'low', storage: 'low' },
            securityLevel: 'low',
          },
          dependencies: ['task-self'],
          estimatedDuration: 1000,
        })
      ).rejects.toThrow();
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
      await swarmTaskAllocationService.registerAgent({
        name: 'Agent',
        type: 'evidence_collector' as const,
        capabilities: ['evidence_processing'] as any[],
        maxLoad: 10,
      });

      const task = await swarmTaskAllocationService.submitTask({
        organizationId: orgId,
        taskType: 'evidence_collection',
        priority: 'low',
        payload: { parameters: {} },
        constraints: {
          requiredCapabilities: ['evidence_processing'] as any[],
          minAgents: 1,
          maxAgents: 1,
          requiresHumanApproval: false,
          maxExecutionTime: 60000,
          resourceRequirements: { cpu: 'low', memory: 'low', network: 'low', storage: 'low' },
          securityLevel: 'low',
        },
        dependencies: [],
        estimatedDuration: 1000,
      });

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
      expect(metrics.totalTasks).toBeDefined();
      expect(metrics.activeAgents).toBeDefined();
    });
  });

  describe('updateAgentStatus', () => {
    it('should update agent status', async () => {
      const agent = await swarmTaskAllocationService.registerAgent({
        name: 'Test Agent',
        type: 'general_purpose' as const,
        capabilities: ['evidence_processing'] as any[],
        maxLoad: 5,
      });

      await swarmTaskAllocationService.updateAgentStatus(agent.id, 'maintenance');

      const updatedAgent = swarmTaskAllocationService.getAgentById(agent.id);
      expect(updatedAgent).toBeDefined();
      expect(updatedAgent!.status).toBe('maintenance');
    });

    it('should throw for non-existent agent', async () => {
      await expect(
        swarmTaskAllocationService.updateAgentStatus('nonexistent', 'offline')
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
      expect(dashboard.agents).toBeDefined();
      expect(dashboard.recentTasks).toBeDefined();
    });
  });

  describe('getAgentWorkload', () => {
    it('should return agent workload', async () => {
      const agent = await swarmTaskAllocationService.registerAgent({
        name: 'Workload Agent',
        type: 'evidence_collector' as const,
        capabilities: ['evidence_processing'] as any[],
        maxLoad: 10,
      });

      const workload = swarmTaskAllocationService.getAgentWorkload(agent.id);

      expect(workload).toBeDefined();
      expect(workload.currentLoad).toBe(0);
      expect(workload.maxLoad).toBe(10);
      expect(workload.activeTasks).toBeDefined();
    });

    it('should return null for non-existent agent', () => {
      const workload = swarmTaskAllocationService.getAgentWorkload('nonexistent');
      expect(workload).toBeNull();
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
      expect(typeof exported).toBe('string');
    });
  });
});
