/**
 * Swarm-based Task Allocation Service
 *
 * Implements dynamic multi-agent task distribution using swarm intelligence principles.
 *
 * Features:
 * - Dynamic task allocation based on agent capabilities
 * - Load balancing across agents
 * - Priority-based task queuing
 * - Real-time task redistribution
 * - Agent health monitoring
 * - Collaborative task execution
 * - Fault tolerance with task reassignment
 */

import prisma from '../../config/database';
import logger from '../../config/logger';
import crypto from 'crypto';
import { EventEmitter } from 'events';

// Task Types
export interface SwarmTask {
  id: string;
  organizationId: string;
  taskType: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  payload: TaskPayload;
  constraints: TaskConstraints;
  assignedAgents: AgentAssignment[];
  dependencies: string[];
  parentTaskId?: string;
  subtasks: string[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  deadline?: Date;
  estimatedDuration: number;
  actualDuration?: number;
  retryCount: number;
  maxRetries: number;
  result?: TaskResult;
  metrics: TaskMetrics;
  checkpoints?: TaskCheckpoint[];
  timeoutAt?: Date;
}

export type TaskType =
  | 'evidence_collection'
  | 'control_assessment'
  | 'risk_analysis'
  | 'policy_review'
  | 'compliance_mapping'
  | 'report_generation'
  | 'audit_preparation'
  | 'gap_analysis'
  | 'remediation_planning'
  | 'monitoring_setup'
  | 'training_delivery'
  | 'vendor_assessment'
  | 'data_classification'
  | 'access_review';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'queued' | 'assigned' | 'in_progress' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface TaskPayload {
  targetId?: string;
  targetType?: string;
  parameters: Record<string, any>;
  inputData?: any;
  requiredOutputFormat?: string;
}

export interface TaskConstraints {
  requiredCapabilities: AgentCapability[];
  minAgents: number;
  maxAgents: number;
  requiresHumanApproval: boolean;
  maxExecutionTime: number;
  resourceRequirements: ResourceRequirements;
  locationConstraints?: string[];
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ResourceRequirements {
  cpu: 'low' | 'medium' | 'high';
  memory: 'low' | 'medium' | 'high';
  network: 'low' | 'medium' | 'high';
  storage: 'low' | 'medium' | 'high';
}

export interface AgentAssignment {
  agentId: string;
  role: 'primary' | 'secondary' | 'reviewer';
  assignedAt: Date;
  acceptedAt?: Date;
  workShare: number;
  status: 'pending' | 'accepted' | 'working' | 'completed' | 'failed';
}

export interface TaskResult {
  success: boolean;
  output: any;
  artifacts: TaskArtifact[];
  errors?: TaskError[];
  agentContributions: AgentContribution[];
}

export interface TaskArtifact {
  id: string;
  name: string;
  type: string;
  url?: string;
  data?: any;
  createdBy: string;
}

export interface TaskError {
  code: string;
  message: string;
  agentId?: string;
  timestamp: Date;
  recoverable: boolean;
}

export interface AgentContribution {
  agentId: string;
  contribution: string;
  quality: number;
  completionTime: number;
}

export interface TaskMetrics {
  queueTime: number;
  assignmentTime: number;
  executionTime: number;
  totalTime: number;
  agentSwitches: number;
  failureCount: number;
  qualityScore?: number;
}

export interface TaskCheckpoint {
  id: string;
  timestamp: Date;
  agentId: string;
  progress: number;
  state: any;
  description: string;
}

// Agent Types
export interface SwarmAgent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: AgentCapability[];
  currentLoad: number;
  maxLoad: number;
  performance: AgentPerformance;
  lastHeartbeat: Date;
  registeredAt: Date;
  metadata: AgentMetadata;
}

export type AgentType =
  | 'evidence_collector'
  | 'control_assessor'
  | 'risk_analyzer'
  | 'policy_reviewer'
  | 'compliance_mapper'
  | 'report_generator'
  | 'general_purpose'
  | 'specialized';

export type AgentStatus = 'available' | 'busy' | 'overloaded' | 'maintenance' | 'offline';

export type AgentCapability =
  | 'evidence_processing'
  | 'document_analysis'
  | 'risk_assessment'
  | 'policy_interpretation'
  | 'compliance_mapping'
  | 'report_generation'
  | 'data_extraction'
  | 'ml_inference'
  | 'natural_language'
  | 'code_analysis'
  | 'api_integration'
  | 'human_interaction';

export interface AgentPerformance {
  tasksCompleted: number;
  tasksFailed: number;
  averageQuality: number;
  averageSpeed: number;
  reliability: number;
  specializations: Map<TaskType, number>;
}

export interface AgentMetadata {
  version: string;
  location?: string;
  resources: ResourceRequirements;
  tags: string[];
}

// Swarm Configuration
export interface SwarmConfig {
  maxConcurrentTasks: number;
  taskTimeout: number;
  loadBalancingStrategy: 'round_robin' | 'least_loaded' | 'best_fit' | 'adaptive';
  failoverEnabled: boolean;
  maxRetries: number;
  healthCheckInterval: number;
  qualityThreshold: number;
}

class SwarmTaskAllocationService extends EventEmitter {
  private agents: Map<string, SwarmAgent> = new Map();
  private taskQueue: Map<TaskPriority, SwarmTask[]> = new Map([
    ['critical', []],
    ['high', []],
    ['medium', []],
    ['low', []],
  ]);
  private activeTasks: Map<string, SwarmTask> = new Map();
  private completedTasks: Map<string, SwarmTask> = new Map();
  private config: SwarmConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private taskProcessorInterval: NodeJS.Timeout | null = null;
  private timeoutCheckInterval: NodeJS.Timeout | null = null;
  private historicalMetrics: Map<string, HistoricalMetric[]> = new Map(); // organizationId -> metrics
  private metricAlerts: Map<string, MetricAlert[]> = new Map(); // organizationId -> alerts

  constructor() {
    super();
    this.config = {
      maxConcurrentTasks: 100,
      taskTimeout: 3600000, // 1 hour
      loadBalancingStrategy: 'adaptive',
      failoverEnabled: true,
      maxRetries: 3,
      healthCheckInterval: 30000, // 30 seconds
      qualityThreshold: 0.8,
    };
  }

  /**
   * Initialize the swarm task allocation system
   */
  async initialize(): Promise<void> {
    try {
      // Start health check interval
      this.healthCheckInterval = setInterval(
        () => this.performHealthChecks(),
        this.config.healthCheckInterval
      );

      // Start task processor
      this.taskProcessorInterval = setInterval(
        () => this.processTaskQueue(),
        1000
      );

      // Start timeout checker
      this.timeoutCheckInterval = setInterval(
        () => this.checkTaskTimeouts(),
        5000 // Check every 5 seconds
      );

      logger.info('[Swarm Tasks] Task allocation service initialized');
    } catch (error) {
      logger.error('[Swarm Tasks] Error initializing service', error);
      throw error;
    }
  }

  /**
   * Register a new agent in the swarm
   */
  async registerAgent(
    organizationId: string,
    agent: {
      name: string;
      type: AgentType;
      capabilities: AgentCapability[];
      maxLoad: number;
      metadata?: Partial<AgentMetadata>;
    }
  ): Promise<SwarmAgent> {
    try {
      const agentId = `agent_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      const swarmAgent: SwarmAgent = {
        id: agentId,
        name: agent.name,
        type: agent.type,
        status: 'available',
        capabilities: agent.capabilities,
        currentLoad: 0,
        maxLoad: agent.maxLoad,
        performance: {
          tasksCompleted: 0,
          tasksFailed: 0,
          averageQuality: 1.0,
          averageSpeed: 1.0,
          reliability: 1.0,
          specializations: new Map(),
        },
        lastHeartbeat: new Date(),
        registeredAt: new Date(),
        metadata: {
          version: '1.0.0',
          resources: { cpu: 'medium', memory: 'medium', network: 'medium', storage: 'medium' },
          tags: [],
          ...agent.metadata,
        },
      };

      this.agents.set(agentId, swarmAgent);

      await prisma.auditLog.create({
        data: {
          action: 'swarm.agent_registered',
          details: JSON.stringify({
            agentId,
            name: agent.name,
            type: agent.type,
            capabilities: agent.capabilities,
          }),
          userId: 'system',
          organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      this.emit('agentRegistered', swarmAgent);
      logger.info(`[Swarm Tasks] Agent registered: ${agentId}`);

      return swarmAgent;
    } catch (error) {
      logger.error('[Swarm Tasks] Error registering agent', error);
      throw error;
    }
  }

  /**
   * Get agent by ID
   */
  getAgentById(agentId: string): SwarmAgent | null {
    return this.agents.get(agentId) || null;
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(
    agentId: string,
    status: AgentStatus,
    organizationId: string
  ): Promise<SwarmAgent> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      const oldStatus = agent.status;
      agent.status = status;
      agent.lastHeartbeat = new Date();

      // If agent went offline, reassign tasks
      if (status === 'offline' && oldStatus !== 'offline') {
        await this.reassignTasksFromAgent(agentId);
      }

      await prisma.auditLog.create({
        data: {
          action: 'swarm.agent_status_updated',
          details: JSON.stringify({
            agentId,
            oldStatus,
            newStatus: status,
          }),
          userId: 'system',
          organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[Swarm Tasks] Agent ${agentId} status updated: ${oldStatus} -> ${status}`);

      return agent;
    } catch (error) {
      logger.error('[Swarm Tasks] Error updating agent status', error);
      throw error;
    }
  }

  /**
   * Deactivate agent
   */
  async deactivateAgent(
    agentId: string,
    organizationId: string
  ): Promise<SwarmAgent> {
    try {
      const agent = await this.updateAgentStatus(agentId, 'offline', organizationId);
      
      await prisma.auditLog.create({
        data: {
          action: 'swarm.agent_deactivated',
          details: JSON.stringify({ agentId }),
          userId: 'system',
          organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      return agent;
    } catch (error) {
      logger.error('[Swarm Tasks] Error deactivating agent', error);
      throw error;
    }
  }

  /**
   * Reactivate agent
   */
  async reactivateAgent(
    agentId: string,
    organizationId: string
  ): Promise<SwarmAgent> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      // Set to available if load allows
      const newStatus: AgentStatus = agent.currentLoad < agent.maxLoad ? 'available' : 'busy';
      const reactivated = await this.updateAgentStatus(agentId, newStatus, organizationId);

      await prisma.auditLog.create({
        data: {
          action: 'swarm.agent_reactivated',
          details: JSON.stringify({ agentId, status: newStatus }),
          userId: 'system',
          organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      logger.info(`[Swarm Tasks] Agent ${agentId} reactivated with status: ${newStatus}`);

      return reactivated;
    } catch (error) {
      logger.error('[Swarm Tasks] Error reactivating agent', error);
      throw error;
    }
  }

  /**
   * Get agent workload
   */
  getAgentWorkload(agentId: string): {
    currentLoad: number;
    maxLoad: number;
    utilization: number;
    assignedTasks: number;
  } {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Count assigned tasks
    let assignedTasks = 0;
    for (const [, task] of this.activeTasks) {
      if (task.assignedAgents.some(a => a.agentId === agentId && a.status !== 'completed' && a.status !== 'failed')) {
        assignedTasks++;
      }
    }

    return {
      currentLoad: agent.currentLoad,
      maxLoad: agent.maxLoad,
      utilization: agent.maxLoad > 0 ? agent.currentLoad / agent.maxLoad : 0,
      assignedTasks,
    };
  }

  /**
   * Submit a new task to the swarm
   */
  async submitTask(
    organizationId: string,
    task: {
      taskType: TaskType;
      priority: TaskPriority;
      payload: TaskPayload;
      constraints?: Partial<TaskConstraints>;
      dependencies?: string[];
      deadline?: Date;
    },
    userId: string
  ): Promise<SwarmTask> {
    try {
      const taskId = `task_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      const defaultConstraints: TaskConstraints = {
        requiredCapabilities: this.getDefaultCapabilities(task.taskType),
        minAgents: 1,
        maxAgents: 3,
        requiresHumanApproval: false,
        maxExecutionTime: 3600000, // 1 hour
        resourceRequirements: { cpu: 'medium', memory: 'medium', network: 'low', storage: 'low' },
        securityLevel: 'medium',
      };

      const swarmTask: SwarmTask = {
        id: taskId,
        organizationId,
        taskType: task.taskType,
        priority: task.priority,
        status: 'pending',
        payload: task.payload,
        constraints: { ...defaultConstraints, ...task.constraints },
        assignedAgents: [],
        dependencies: task.dependencies || [],
        subtasks: [],
        createdAt: new Date(),
        deadline: task.deadline,
        estimatedDuration: this.estimateTaskDuration(task.taskType),
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        metrics: {
          queueTime: 0,
          assignmentTime: 0,
          executionTime: 0,
          totalTime: 0,
          agentSwitches: 0,
          failureCount: 0,
        },
      };

      // Validate task
      const validation = this.validateTask(swarmTask);
      if (!validation.valid) {
        throw new Error(`Task validation failed: ${validation.error}`);
      }

      // Set timeout if maxExecutionTime is specified
      if (swarmTask.constraints.maxExecutionTime) {
        swarmTask.timeoutAt = new Date(Date.now() + swarmTask.constraints.maxExecutionTime);
      }

      // Check if dependencies are satisfied
      const dependenciesSatisfied = await this.checkDependencies(swarmTask.dependencies);

      if (dependenciesSatisfied) {
        swarmTask.status = 'queued';
        this.taskQueue.get(task.priority)?.push(swarmTask);
      } else {
        // Keep as pending until dependencies are met
        this.activeTasks.set(taskId, swarmTask);
      }

      await prisma.auditLog.create({
        data: {
          action: 'swarm.task_submitted',
          details: JSON.stringify({
            taskId,
            taskType: task.taskType,
            priority: task.priority,
            status: swarmTask.status,
          }),
          userId,
          organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      this.emit('taskSubmitted', swarmTask);
      logger.info(`[Swarm Tasks] Task submitted: ${taskId}`);

      return swarmTask;
    } catch (error) {
      logger.error('[Swarm Tasks] Error submitting task', error);
      throw error;
    }
  }

  /**
   * Validate task before submission
   */
  private validateTask(task: SwarmTask): { valid: boolean; error?: string } {
    // Check required fields
    if (!task.taskType) {
      return { valid: false, error: 'Task type is required' };
    }

    if (!task.priority) {
      return { valid: false, error: 'Task priority is required' };
    }

    if (!task.payload) {
      return { valid: false, error: 'Task payload is required' };
    }

    // Check deadline is in future
    if (task.deadline && task.deadline < new Date()) {
      return { valid: false, error: 'Deadline must be in the future' };
    }

    // Check constraints
    if (task.constraints.minAgents > task.constraints.maxAgents) {
      return { valid: false, error: 'minAgents cannot exceed maxAgents' };
    }

    if (task.constraints.minAgents < 1) {
      return { valid: false, error: 'minAgents must be at least 1' };
    }

    // Check dependencies don't include self
    if (task.dependencies.includes(task.id)) {
      return { valid: false, error: 'Task cannot depend on itself' };
    }

    return { valid: true };
  }

  /**
   * Bulk submit tasks
   */
  async bulkSubmitTasks(
    organizationId: string,
    tasks: Array<{
      taskType: TaskType;
      priority: TaskPriority;
      payload: TaskPayload;
      constraints?: Partial<TaskConstraints>;
      dependencies?: string[];
      deadline?: Date;
    }>,
    userId: string
  ): Promise<{
    successful: SwarmTask[];
    failed: Array<{ task: any; error: string }>;
  }> {
    try {
      const successful: SwarmTask[] = [];
      const failed: Array<{ task: any; error: string }> = [];

      for (const task of tasks) {
        try {
          const submitted = await this.submitTask(organizationId, task, userId);
          successful.push(submitted);
        } catch (error: any) {
          failed.push({
            task,
            error: error.message || 'Unknown error',
          });
        }
      }

      logger.info(`[Swarm Tasks] Bulk submission: ${successful.length} successful, ${failed.length} failed`);

      return { successful, failed };
    } catch (error) {
      logger.error('[Swarm Tasks] Error in bulk task submission', error);
      throw error;
    }
  }

  /**
   * Get all tasks (queued, active, completed)
   */
  getAllTasks(organizationId: string): {
    queued: SwarmTask[];
    active: SwarmTask[];
    completed: SwarmTask[];
    failed: SwarmTask[];
    cancelled: SwarmTask[];
  } {
    const queued: SwarmTask[] = [];
    const active: SwarmTask[] = [];
    const completed: SwarmTask[] = [];
    const failed: SwarmTask[] = [];
    const cancelled: SwarmTask[] = [];

    // From queues
    for (const [, queue] of this.taskQueue) {
      queued.push(...queue.filter(t => t.organizationId === organizationId));
    }

    // From active tasks
    for (const [, task] of this.activeTasks) {
      if (task.organizationId === organizationId) {
        if (task.status === 'in_progress' || task.status === 'assigned') {
          active.push(task);
        } else if (task.status === 'queued' || task.status === 'pending') {
          queued.push(task);
        }
      }
    }

    // From completed tasks
    for (const [, task] of this.completedTasks) {
      if (task.organizationId === organizationId) {
        if (task.status === 'completed') {
          completed.push(task);
        } else if (task.status === 'failed') {
          failed.push(task);
        } else if (task.status === 'cancelled') {
          cancelled.push(task);
        }
      }
    }

    return { queued, active, completed, failed, cancelled };
  }

  /**
   * Allocate tasks to agents using swarm intelligence
   */
  private async allocateTasks(): Promise<void> {
    try {
      const availableAgents = this.getAvailableAgents();

      if (availableAgents.length === 0) {
        return;
      }

      // Process tasks by priority
      const priorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];

      for (const priority of priorities) {
        const queue = this.taskQueue.get(priority);
        if (!queue || queue.length === 0) continue;

        const tasksToAssign = [...queue];

        for (const task of tasksToAssign) {
          const selectedAgents = await this.selectAgentsForTask(task, availableAgents);

          if (selectedAgents.length >= task.constraints.minAgents) {
            await this.assignTaskToAgents(task, selectedAgents);

            // Remove from queue
            const queueIndex = queue.findIndex(t => t.id === task.id);
            if (queueIndex !== -1) {
              queue.splice(queueIndex, 1);
            }
          }
        }
      }
    } catch (error) {
      logger.error('[Swarm Tasks] Error allocating tasks', error);
    }
  }

  /**
   * Select best agents for a task using swarm intelligence
   */
  private async selectAgentsForTask(
    task: SwarmTask,
    availableAgents: SwarmAgent[]
  ): Promise<SwarmAgent[]> {
    // Filter agents by capabilities
    const capableAgents = availableAgents.filter(agent =>
      task.constraints.requiredCapabilities.every(cap =>
        agent.capabilities.includes(cap)
      )
    );

    if (capableAgents.length === 0) {
      return [];
    }

    // Score agents based on fitness for the task
    const scoredAgents = capableAgents.map(agent => ({
      agent,
      score: this.calculateAgentFitness(agent, task),
    }));

    // Sort by score descending
    scoredAgents.sort((a, b) => b.score - a.score);

    // Select top agents up to maxAgents
    const selectedCount = Math.min(
      task.constraints.maxAgents,
      scoredAgents.length
    );

    return scoredAgents.slice(0, selectedCount).map(s => s.agent);
  }

  /**
   * Calculate agent fitness for a specific task
   */
  private calculateAgentFitness(agent: SwarmAgent, task: SwarmTask): number {
    let score = 0;

    // Load factor (prefer less loaded agents)
    const loadRatio = agent.currentLoad / agent.maxLoad;
    score += (1 - loadRatio) * 30;

    // Performance factor
    score += agent.performance.averageQuality * 25;
    score += agent.performance.reliability * 25;
    score += agent.performance.averageSpeed * 10;

    // Specialization factor
    const specialization = agent.performance.specializations.get(task.taskType) || 0;
    score += specialization * 10;

    // Resource fit
    const resourceFit = this.calculateResourceFit(
      agent.metadata.resources,
      task.constraints.resourceRequirements
    );
    score += resourceFit * 10;

    return score;
  }

  /**
   * Calculate resource fit between agent and task
   */
  private calculateResourceFit(
    agentResources: ResourceRequirements,
    taskResources: ResourceRequirements
  ): number {
    const levels = { low: 1, medium: 2, high: 3 };
    let fit = 0;
    let total = 0;

    for (const key of ['cpu', 'memory', 'network', 'storage'] as const) {
      const agentLevel = levels[agentResources[key]];
      const taskLevel = levels[taskResources[key]];

      if (agentLevel >= taskLevel) {
        fit += 1;
      } else {
        fit += agentLevel / taskLevel;
      }
      total += 1;
    }

    return fit / total;
  }

  /**
   * Assign task to selected agents
   */
  private async assignTaskToAgents(
    task: SwarmTask,
    agents: SwarmAgent[]
  ): Promise<void> {
    try {
      const workShare = 1 / agents.length;

      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        const role: AgentAssignment['role'] = i === 0 ? 'primary' : 'secondary';

        const assignment: AgentAssignment = {
          agentId: agent.id,
          role,
          assignedAt: new Date(),
          workShare,
          status: 'pending',
        };

        task.assignedAgents.push(assignment);

        // Update agent load
        agent.currentLoad += 1;
        if (agent.currentLoad >= agent.maxLoad) {
          agent.status = 'busy';
        }
      }

      task.status = 'assigned';
      task.metrics.queueTime = Date.now() - task.createdAt.getTime();

      this.activeTasks.set(task.id, task);

      this.emit('taskAssigned', task);
      logger.info(`[Swarm Tasks] Task ${task.id} assigned to ${agents.length} agents`);
    } catch (error) {
      logger.error('[Swarm Tasks] Error assigning task to agents', error);
      throw error;
    }
  }

  /**
   * Report task progress from an agent
   */
  async reportProgress(
    taskId: string,
    agentId: string,
    progress: {
      percentComplete: number;
      currentStep?: string;
      partialResult?: any;
      issues?: string[];
    }
  ): Promise<void> {
    try {
      const task = this.activeTasks.get(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const assignment = task.assignedAgents.find(a => a.agentId === agentId);
      if (!assignment) {
        throw new Error('Agent not assigned to this task');
      }

      if (assignment.status === 'pending') {
        assignment.status = 'working';
        assignment.acceptedAt = new Date();
        task.status = 'in_progress';
        task.startedAt = task.startedAt || new Date();
        task.metrics.assignmentTime = Date.now() - task.createdAt.getTime();
      }

      // Create checkpoint for partial completion
      if (progress.partialResult || progress.percentComplete > 0) {
        if (!task.checkpoints) {
          task.checkpoints = [];
        }

        const checkpoint: TaskCheckpoint = {
          id: `checkpoint_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
          timestamp: new Date(),
          agentId,
          progress: progress.percentComplete,
          state: progress.partialResult,
          description: progress.currentStep || `Progress: ${progress.percentComplete}%`,
        };

        task.checkpoints.push(checkpoint);
      }

      // Update agent heartbeat
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.lastHeartbeat = new Date();
      }

      this.emit('taskProgress', { taskId, agentId, progress });

    } catch (error) {
      logger.error('[Swarm Tasks] Error reporting progress', error);
    }
  }

  /**
   * Complete a task
   */
  async completeTask(
    taskId: string,
    agentId: string,
    result: {
      success: boolean;
      output: any;
      artifacts?: TaskArtifact[];
      errors?: TaskError[];
    },
    organizationId: string
  ): Promise<SwarmTask> {
    try {
      const task = this.activeTasks.get(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const assignment = task.assignedAgents.find(a => a.agentId === agentId);
      if (!assignment) {
        throw new Error('Agent not assigned to this task');
      }

      assignment.status = result.success ? 'completed' : 'failed';

      // Check if all agents have completed
      const allCompleted = task.assignedAgents.every(
        a => a.status === 'completed' || a.status === 'failed'
      );

      if (allCompleted) {
        const successCount = task.assignedAgents.filter(a => a.status === 'completed').length;
        const success = successCount > task.assignedAgents.length / 2;

        task.status = success ? 'completed' : 'failed';
        task.completedAt = new Date();
        task.metrics.executionTime = Date.now() - (task.startedAt?.getTime() || Date.now());
        task.metrics.totalTime = Date.now() - task.createdAt.getTime();

        task.result = {
          success,
          output: result.output,
          artifacts: result.artifacts || [],
          errors: result.errors,
          agentContributions: task.assignedAgents.map(a => ({
            agentId: a.agentId,
            contribution: a.role,
            quality: a.status === 'completed' ? 1.0 : 0,
            completionTime: task.metrics.executionTime * a.workShare,
          })),
        };

        // Update agent performance
        for (const a of task.assignedAgents) {
          const agent = this.agents.get(a.agentId);
          if (agent) {
            agent.currentLoad = Math.max(0, agent.currentLoad - 1);
            if (agent.currentLoad < agent.maxLoad) {
              agent.status = 'available';
            }

            if (a.status === 'completed') {
              agent.performance.tasksCompleted += 1;
            } else {
              agent.performance.tasksFailed += 1;
            }

            // Update reliability
            const total = agent.performance.tasksCompleted + agent.performance.tasksFailed;
            agent.performance.reliability = agent.performance.tasksCompleted / total;
          }
        }

        // Move to completed
        this.activeTasks.delete(taskId);
        this.completedTasks.set(taskId, task);

        // Check for dependent tasks
        await this.checkAndQueueDependentTasks(taskId);
      }

      await prisma.auditLog.create({
        data: {
          action: result.success ? 'swarm.task_completed' : 'swarm.task_failed',
          details: JSON.stringify({
            taskId,
            agentId,
            success: result.success,
            duration: task.metrics.executionTime,
          }),
          userId: 'system',
          organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      this.emit(result.success ? 'taskCompleted' : 'taskFailed', task);
      logger.info(`[Swarm Tasks] Task ${taskId} ${result.success ? 'completed' : 'failed'}`);

      return task;
    } catch (error) {
      logger.error('[Swarm Tasks] Error completing task', error);
      throw error;
    }
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string, reason: string, userId: string): Promise<SwarmTask | null> {
    try {
      let task = this.activeTasks.get(taskId);

      if (!task) {
        // Check queues
        for (const [priority, queue] of this.taskQueue) {
          const index = queue.findIndex(t => t.id === taskId);
          if (index !== -1) {
            task = queue[index];
            queue.splice(index, 1);
            break;
          }
        }
      } else {
        this.activeTasks.delete(taskId);
      }

      if (!task) {
        return null;
      }

      task.status = 'cancelled';
      task.completedAt = new Date();

      // Free up agents
      for (const assignment of task.assignedAgents) {
        const agent = this.agents.get(assignment.agentId);
        if (agent) {
          agent.currentLoad = Math.max(0, agent.currentLoad - 1);
          if (agent.currentLoad < agent.maxLoad) {
            agent.status = 'available';
          }
        }
      }

      await prisma.auditLog.create({
        data: {
          action: 'swarm.task_cancelled',
          details: JSON.stringify({
            taskId,
            reason,
          }),
          userId,
          organizationId: task.organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });

      this.emit('taskCancelled', task);
      logger.info(`[Swarm Tasks] Task ${taskId} cancelled`);

      return task;
    } catch (error) {
      logger.error('[Swarm Tasks] Error cancelling task', error);
      throw error;
    }
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): SwarmTask | null {
    return (
      this.activeTasks.get(taskId) ||
      this.completedTasks.get(taskId) ||
      this.findTaskInQueues(taskId)
    );
  }

  /**
   * Get all active tasks for an organization
   */
  getActiveTasks(organizationId: string): SwarmTask[] {
    const tasks: SwarmTask[] = [];

    // From queues
    for (const [, queue] of this.taskQueue) {
      tasks.push(...queue.filter(t => t.organizationId === organizationId));
    }

    // From active tasks
    for (const [, task] of this.activeTasks) {
      if (task.organizationId === organizationId) {
        tasks.push(task);
      }
    }

    return tasks;
  }

  /**
   * Get swarm metrics (enhanced)
   */
  getSwarmMetrics(organizationId: string): SwarmMetrics {
    const agents = Array.from(this.agents.values());
    const activeTasks = this.getActiveTasks(organizationId);
    const allTasks = this.getAllTasks(organizationId);

    let queuedCount = 0;
    for (const [, queue] of this.taskQueue) {
      queuedCount += queue.filter(t => t.organizationId === organizationId).length;
    }

    const completedTasks = allTasks.completed;
    const failedTasks = allTasks.failed;
    const totalCompleted = completedTasks.length + failedTasks.length;

    const metrics: SwarmMetrics = {
      totalAgents: agents.length,
      availableAgents: agents.filter(a => a.status === 'available').length,
      busyAgents: agents.filter(a => a.status === 'busy').length,
      offlineAgents: agents.filter(a => a.status === 'offline').length,
      queuedTasks: queuedCount,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      averageTaskDuration: this.calculateAverageTaskDuration(organizationId),
      taskSuccessRate: this.calculateTaskSuccessRate(organizationId),
      agentUtilization: this.calculateAgentUtilization(),
      taskCompletionRate: this.calculateTaskCompletionRate(organizationId),
      queueDepth: queuedCount,
      failureRate: totalCompleted > 0 ? failedTasks.length / totalCompleted : 0,
      historicalMetrics: this.historicalMetrics.get(organizationId) || [],
    };

    // Store historical metric
    this.storeHistoricalMetric(organizationId, metrics);

    // Check for metric alerts
    this.checkMetricAlerts(organizationId, metrics);

    return metrics;
  }

  /**
   * Calculate task completion rate
   */
  private calculateTaskCompletionRate(organizationId: string): number {
    const allTasks = this.getAllTasks(organizationId);
    const total = allTasks.completed.length + allTasks.failed.length + allTasks.active.length + allTasks.queued.length;

    if (total === 0) return 0;

    return allTasks.completed.length / total;
  }

  /**
   * Store historical metric
   */
  private storeHistoricalMetric(organizationId: string, metrics: SwarmMetrics): void {
    const history = this.historicalMetrics.get(organizationId) || [];
    
    // Keep last 1000 metrics (approximately 16 hours at 1-minute intervals)
    if (history.length >= 1000) {
      history.shift();
    }

    history.push({
      timestamp: new Date(),
      metrics: {
        totalAgents: metrics.totalAgents,
        availableAgents: metrics.availableAgents,
        busyAgents: metrics.busyAgents,
        offlineAgents: metrics.offlineAgents,
        queuedTasks: metrics.queuedTasks,
        activeTasks: metrics.activeTasks,
        completedTasks: metrics.completedTasks,
        averageTaskDuration: metrics.averageTaskDuration,
        taskSuccessRate: metrics.taskSuccessRate,
        agentUtilization: metrics.agentUtilization,
        taskCompletionRate: metrics.taskCompletionRate,
        queueDepth: metrics.queueDepth,
        failureRate: metrics.failureRate,
      },
    });

    this.historicalMetrics.set(organizationId, history);
  }

  /**
   * Check for metric alerts
   */
  private checkMetricAlerts(organizationId: string, metrics: SwarmMetrics): void {
    const alerts = this.metricAlerts.get(organizationId) || [];
    const thresholds = {
      agentUtilization: 0.9, // 90%
      queueDepth: 100,
      failureRate: 0.2, // 20%
      offlineAgents: metrics.totalAgents * 0.5, // 50% of agents
    };

    // Check agent utilization
    if (metrics.agentUtilization > thresholds.agentUtilization) {
      this.createAlert(organizationId, {
        type: 'threshold_exceeded',
        severity: 'high',
        message: `Agent utilization (${(metrics.agentUtilization * 100).toFixed(1)}%) exceeds threshold (${(thresholds.agentUtilization * 100)}%)`,
      });
    }

    // Check queue depth
    if (metrics.queueDepth > thresholds.queueDepth) {
      this.createAlert(organizationId, {
        type: 'queue_overflow',
        severity: 'critical',
        message: `Queue depth (${metrics.queueDepth}) exceeds threshold (${thresholds.queueDepth})`,
      });
    }

    // Check failure rate
    if (metrics.failureRate > thresholds.failureRate) {
      this.createAlert(organizationId, {
        type: 'threshold_exceeded',
        severity: 'high',
        message: `Task failure rate (${(metrics.failureRate * 100).toFixed(1)}%) exceeds threshold (${(thresholds.failureRate * 100)}%)`,
      });
    }

    // Check offline agents
    if (metrics.offlineAgents > thresholds.offlineAgents) {
      this.createAlert(organizationId, {
        type: 'agent_offline',
        severity: 'critical',
        message: `${metrics.offlineAgents} agents offline (${((metrics.offlineAgents / metrics.totalAgents) * 100).toFixed(1)}% of total)`,
      });
    }
  }

  /**
   * Create metric alert
   */
  private createAlert(organizationId: string, alert: Omit<MetricAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const alerts = this.metricAlerts.get(organizationId) || [];
    
    // Check if similar alert already exists
    const existingAlert = alerts.find(a => 
      a.type === alert.type && 
      !a.resolved &&
      (Date.now() - a.timestamp.getTime()) < 5 * 60 * 1000 // Within 5 minutes
    );

    if (existingAlert) {
      return; // Don't create duplicate alert
    }

    const newAlert: MetricAlert = {
      id: `alert_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      ...alert,
      timestamp: new Date(),
      resolved: false,
    };

    alerts.push(newAlert);
    
    // Keep last 100 alerts
    if (alerts.length > 100) {
      alerts.shift();
    }

    this.metricAlerts.set(organizationId, alerts);

    // Emit alert event
    this.emit('metricAlert', { organizationId, alert: newAlert });

    logger.warn(`[Swarm Tasks] Metric alert: ${newAlert.message}`);
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): HistoricalMetric[] {
    const history = this.historicalMetrics.get(organizationId) || [];

    if (!startDate && !endDate) {
      return history.slice(-100); // Return last 100 metrics
    }

    return history.filter(m => {
      if (startDate && m.timestamp < startDate) return false;
      if (endDate && m.timestamp > endDate) return false;
      return true;
    });
  }

  /**
   * Get metric alerts
   */
  getMetricAlerts(
    organizationId: string,
    resolved?: boolean
  ): MetricAlert[] {
    const alerts = this.metricAlerts.get(organizationId) || [];

    if (resolved === undefined) {
      return alerts;
    }

    return alerts.filter(a => a.resolved === resolved);
  }

  /**
   * Resolve metric alert
   */
  async resolveMetricAlert(
    organizationId: string,
    alertId: string,
    userId: string
  ): Promise<void> {
    const alerts = this.metricAlerts.get(organizationId) || [];
    const alert = alerts.find(a => a.id === alertId);

    if (alert) {
      alert.resolved = true;

      await prisma.auditLog.create({
        data: {
          action: 'swarm.metric_alert_resolved',
          details: JSON.stringify({ alertId, alertType: alert.type }),
          userId,
          organizationId,
          hash: crypto.randomBytes(16).toString('hex'),
        },
      });
    }
  }

  /**
   * Export metrics
   */
  exportMetrics(
    organizationId: string,
    format: 'json' | 'csv' = 'json',
    startDate?: Date,
    endDate?: Date
  ): any {
    try {
      const metrics = this.getSwarmMetrics(organizationId);
      const history = this.getHistoricalMetrics(organizationId, startDate, endDate);

      if (format === 'csv') {
        const csvRows = [
          ['Timestamp', 'Total Agents', 'Available', 'Busy', 'Offline', 'Queued Tasks', 'Active Tasks', 'Completed', 'Utilization', 'Success Rate', 'Failure Rate'],
          ...history.map(m => [
            m.timestamp.toISOString(),
            m.metrics.totalAgents.toString(),
            m.metrics.availableAgents.toString(),
            m.metrics.busyAgents.toString(),
            m.metrics.offlineAgents.toString(),
            m.metrics.queuedTasks.toString(),
            m.metrics.activeTasks.toString(),
            m.metrics.completedTasks.toString(),
            m.metrics.agentUtilization.toFixed(2),
            m.metrics.taskSuccessRate.toFixed(2),
            m.metrics.failureRate.toFixed(2),
          ]),
        ];

        return {
          format: 'csv',
          content: csvRows.map(row => row.join(',')).join('\n'),
          filename: `swarm-metrics-${organizationId}-${new Date().toISOString().split('T')[0]}.csv`,
        };
      }

      return {
        current: metrics,
        history,
      };
    } catch (error) {
      logger.error('[Swarm Tasks] Error exporting metrics', error);
      throw error;
    }
  }

  /**
   * Get registered agents
   */
  getAgents(): SwarmAgent[] {
    return Array.from(this.agents.values());
  }

  // Private helper methods

  private processTaskQueue(): void {
    this.allocateTasks().catch(error => {
      logger.error('[Swarm Tasks] Error in task processor', error);
    });
  }

  private performHealthChecks(): void {
    const now = new Date();
    const timeout = 60000; // 1 minute

    for (const [agentId, agent] of this.agents) {
      const timeSinceHeartbeat = now.getTime() - agent.lastHeartbeat.getTime();

      if (timeSinceHeartbeat > timeout && agent.status !== 'offline') {
        agent.status = 'offline';
        logger.warn(`[Swarm Tasks] Agent ${agentId} went offline`);

        // Reassign tasks from offline agent
        this.reassignTasksFromAgent(agentId);
      }
    }
  }

  private async reassignTasksFromAgent(agentId: string): Promise<void> {
    for (const [taskId, task] of this.activeTasks) {
      const assignment = task.assignedAgents.find(a => a.agentId === agentId);

      if (assignment && assignment.status === 'working') {
        assignment.status = 'failed';
        task.metrics.agentSwitches += 1;
        task.metrics.failureCount += 1;

        if (task.retryCount < task.maxRetries) {
          task.retryCount += 1;
          task.status = 'queued';
          task.assignedAgents = task.assignedAgents.filter(a => a.agentId !== agentId);
          task.metrics.failureCount += 1;

          // Restore from checkpoint if available
          if (task.checkpoints && task.checkpoints.length > 0) {
            const lastCheckpoint = task.checkpoints[task.checkpoints.length - 1];
            logger.info(`[Swarm Tasks] Task ${taskId} will resume from checkpoint at ${lastCheckpoint.progress}%`);
          }

          this.activeTasks.delete(taskId);
          this.taskQueue.get(task.priority)?.push(task);

          logger.info(`[Swarm Tasks] Task ${taskId} requeued after agent failure (retry ${task.retryCount}/${task.maxRetries})`);
        } else {
          // Max retries exceeded, mark as failed
          task.status = 'failed';
          task.completedAt = new Date();
          this.activeTasks.delete(taskId);
          this.completedTasks.set(taskId, task);

          logger.warn(`[Swarm Tasks] Task ${taskId} failed after ${task.maxRetries} retries`);
        }
      }
    }
  }

  /**
   * Check for task timeouts
   */
  private checkTaskTimeouts(): void {
    const now = new Date();

    for (const [taskId, task] of this.activeTasks) {
      // Check deadline
      if (task.deadline && task.deadline < now) {
        logger.warn(`[Swarm Tasks] Task ${taskId} exceeded deadline`);
        this.handleTaskTimeout(taskId, 'deadline');
        continue;
      }

      // Check execution timeout
      if (task.timeoutAt && task.timeoutAt < now) {
        logger.warn(`[Swarm Tasks] Task ${taskId} exceeded execution timeout`);
        this.handleTaskTimeout(taskId, 'execution_timeout');
        continue;
      }

      // Check max execution time
      if (task.startedAt && task.constraints.maxExecutionTime) {
        const elapsed = Date.now() - task.startedAt.getTime();
        if (elapsed > task.constraints.maxExecutionTime) {
          logger.warn(`[Swarm Tasks] Task ${taskId} exceeded max execution time`);
          this.handleTaskTimeout(taskId, 'max_execution_time');
        }
      }
    }
  }

  /**
   * Handle task timeout
   */
  private async handleTaskTimeout(taskId: string, timeoutType: string): Promise<void> {
    try {
      const task = this.activeTasks.get(taskId);
      if (!task) {
        return;
      }

      // Cancel or retry based on configuration
      if (task.retryCount < task.maxRetries) {
        task.retryCount += 1;
        task.status = 'queued';
        task.startedAt = undefined;
        task.timeoutAt = task.constraints.maxExecutionTime ?
          new Date(Date.now() + task.constraints.maxExecutionTime) : undefined;

        // Clear agent assignments
        for (const assignment of task.assignedAgents) {
          const agent = this.agents.get(assignment.agentId);
          if (agent) {
            agent.currentLoad = Math.max(0, agent.currentLoad - 1);
            if (agent.currentLoad < agent.maxLoad) {
              agent.status = 'available';
            }
          }
        }
        task.assignedAgents = [];

        this.activeTasks.delete(taskId);
        this.taskQueue.get(task.priority)?.push(task);

        logger.info(`[Swarm Tasks] Task ${taskId} requeued after ${timeoutType} (retry ${task.retryCount}/${task.maxRetries})`);
      } else {
        // Max retries exceeded, mark as failed
        task.status = 'failed';
        task.completedAt = new Date();
        task.metrics.failureCount += 1;

        // Free up agents
        for (const assignment of task.assignedAgents) {
          const agent = this.agents.get(assignment.agentId);
          if (agent) {
            agent.currentLoad = Math.max(0, agent.currentLoad - 1);
            if (agent.currentLoad < agent.maxLoad) {
              agent.status = 'available';
            }
          }
        }

        this.activeTasks.delete(taskId);
        this.completedTasks.set(taskId, task);

        await prisma.auditLog.create({
          data: {
            action: 'swarm.task_timeout',
            details: JSON.stringify({
              taskId,
              timeoutType,
              retryCount: task.retryCount,
            }),
            userId: 'system',
            organizationId: task.organizationId,
            hash: crypto.randomBytes(16).toString('hex'),
          },
        });

        logger.warn(`[Swarm Tasks] Task ${taskId} failed due to ${timeoutType} after ${task.maxRetries} retries`);
      }
    } catch (error) {
      logger.error('[Swarm Tasks] Error handling task timeout', error);
    }
  }

  private getAvailableAgents(): SwarmAgent[] {
    return Array.from(this.agents.values()).filter(
      agent => agent.status === 'available' && agent.currentLoad < agent.maxLoad
    );
  }

  private async checkDependencies(dependencies: string[]): Promise<boolean> {
    for (const depId of dependencies) {
      const depTask = this.completedTasks.get(depId);
      if (!depTask || depTask.status !== 'completed') {
        return false;
      }
    }
    return true;
  }

  private async checkAndQueueDependentTasks(completedTaskId: string): Promise<void> {
    for (const [, task] of this.activeTasks) {
      if (task.status === 'pending' && task.dependencies.includes(completedTaskId)) {
        const allDepsComplete = await this.checkDependencies(task.dependencies);

        if (allDepsComplete) {
          task.status = 'queued';
          this.taskQueue.get(task.priority)?.push(task);
          this.activeTasks.delete(task.id);
        }
      }
    }
  }

  private findTaskInQueues(taskId: string): SwarmTask | null {
    for (const [, queue] of this.taskQueue) {
      const task = queue.find(t => t.id === taskId);
      if (task) return task;
    }
    return null;
  }

  private getDefaultCapabilities(taskType: TaskType): AgentCapability[] {
    const capabilityMap: Record<TaskType, AgentCapability[]> = {
      evidence_collection: ['evidence_processing', 'document_analysis'],
      control_assessment: ['evidence_processing', 'document_analysis'],
      risk_analysis: ['risk_assessment', 'ml_inference'],
      policy_review: ['policy_interpretation', 'natural_language'],
      compliance_mapping: ['compliance_mapping', 'document_analysis'],
      report_generation: ['report_generation', 'natural_language'],
      audit_preparation: ['evidence_processing', 'document_analysis', 'report_generation'],
      gap_analysis: ['compliance_mapping', 'risk_assessment'],
      remediation_planning: ['risk_assessment', 'natural_language'],
      monitoring_setup: ['api_integration', 'code_analysis'],
      training_delivery: ['natural_language', 'human_interaction'],
      vendor_assessment: ['risk_assessment', 'document_analysis'],
      data_classification: ['data_extraction', 'ml_inference'],
      access_review: ['data_extraction', 'human_interaction'],
    };

    return capabilityMap[taskType] || ['natural_language'];
  }

  private estimateTaskDuration(taskType: TaskType): number {
    const durationMap: Record<TaskType, number> = {
      evidence_collection: 300000, // 5 minutes
      control_assessment: 600000, // 10 minutes
      risk_analysis: 900000, // 15 minutes
      policy_review: 1200000, // 20 minutes
      compliance_mapping: 1800000, // 30 minutes
      report_generation: 600000, // 10 minutes
      audit_preparation: 3600000, // 1 hour
      gap_analysis: 1200000, // 20 minutes
      remediation_planning: 1800000, // 30 minutes
      monitoring_setup: 900000, // 15 minutes
      training_delivery: 1800000, // 30 minutes
      vendor_assessment: 1200000, // 20 minutes
      data_classification: 600000, // 10 minutes
      access_review: 900000, // 15 minutes
    };

    return durationMap[taskType] || 600000;
  }

  private calculateAverageTaskDuration(organizationId: string): number {
    const tasks = Array.from(this.completedTasks.values())
      .filter(t => t.organizationId === organizationId && t.actualDuration);

    if (tasks.length === 0) return 0;

    const totalDuration = tasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0);
    return totalDuration / tasks.length;
  }

  private calculateTaskSuccessRate(organizationId: string): number {
    const tasks = Array.from(this.completedTasks.values())
      .filter(t => t.organizationId === organizationId);

    if (tasks.length === 0) return 1.0;

    const successCount = tasks.filter(t => t.status === 'completed').length;
    return successCount / tasks.length;
  }

  private calculateAgentUtilization(): number {
    const agents = Array.from(this.agents.values());

    if (agents.length === 0) return 0;

    const totalUtilization = agents.reduce((sum, agent) => {
      return sum + (agent.currentLoad / agent.maxLoad);
    }, 0);

    return totalUtilization / agents.length;
  }

  /**
   * Get real-time dashboard data
   */
  getDashboard(organizationId: string): {
    metrics: SwarmMetrics;
    recentTasks: SwarmTask[];
    topAgents: Array<{
      agent: SwarmAgent;
      workload: ReturnType<typeof this.getAgentWorkload>;
    }>;
    alerts: MetricAlert[];
  } {
    const metrics = this.getSwarmMetrics(organizationId);
    const allTasks = this.getAllTasks(organizationId);
    
    // Get recent tasks (last 20)
    const recentTasks = [
      ...allTasks.active,
      ...allTasks.queued,
      ...allTasks.completed.slice(-10),
      ...allTasks.failed.slice(-5),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 20);

    // Get top agents by performance
    const agents = Array.from(this.agents.values());
    const topAgents = agents
      .map(agent => ({
        agent,
        workload: this.getAgentWorkload(agent.id),
      }))
      .sort((a, b) => {
        // Sort by utilization and performance
        const scoreA = a.agent.performance.reliability * a.agent.performance.averageQuality;
        const scoreB = b.agent.performance.reliability * b.agent.performance.averageQuality;
        return scoreB - scoreA;
      })
      .slice(0, 10);

    const alerts = this.getMetricAlerts(organizationId, false).slice(0, 10);

    return {
      metrics,
      recentTasks,
      topAgents,
      alerts,
    };
  }

  /**
   * Shutdown the service
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.taskProcessorInterval) {
      clearInterval(this.taskProcessorInterval);
    }
    if (this.timeoutCheckInterval) {
      clearInterval(this.timeoutCheckInterval);
    }
    logger.info('[Swarm Tasks] Service shutdown');
  }
}

interface SwarmMetrics {
  totalAgents: number;
  availableAgents: number;
  busyAgents: number;
  offlineAgents: number;
  queuedTasks: number;
  activeTasks: number;
  completedTasks: number;
  averageTaskDuration: number;
  taskSuccessRate: number;
  agentUtilization: number;
  taskCompletionRate: number;
  queueDepth: number;
  failureRate: number;
  historicalMetrics?: HistoricalMetric[];
}

export interface HistoricalMetric {
  timestamp: Date;
  metrics: Omit<SwarmMetrics, 'historicalMetrics'>;
}

export interface MetricAlert {
  id: string;
  type: 'threshold_exceeded' | 'anomaly_detected' | 'agent_offline' | 'queue_overflow';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export default new SwarmTaskAllocationService();
