/**
 * Workflow Automation Rule Engine
 *
 * Service class managing workflow automation rules with triggers, conditions, and actions.
 * Supports event-driven, schedule-based, and condition-based triggers with a comprehensive
 * condition evaluation engine and extensible action execution pipeline.
 *
 * Features:
 * - Trigger types: event, schedule, condition
 * - Condition operators: eq, ne, gt, lt, gte, lte, contains, not_contains, matches, in, not_in
 * - Action types: send_notification, assign_task, update_status, create_incident,
 *                 send_email, call_webhook, add_tag, escalate
 * - Execution logging with step-by-step detail
 * - Rate limiting per organization
 * - Template variable interpolation in action configs
 */

import prisma from '../config/database';
import { Prisma } from '../generated/prisma/client';
import logger from '../config/logger';
import axios from 'axios';
import { isWebhookUrlSafe } from '../utils/urlValidator';
import { AppError } from '../middleware/errorHandler';

/**
 * Detect patterns known to cause catastrophic backtracking (ReDoS).
 * Rejects nested quantifiers such as (a+)+, (a*)+, (a+)*, etc.
 */
const REDOS_PATTERNS = [
  /\([^)]*[+*]\)[+*]/, // nested quantifier: (x+)+ or (x*)*
  /\([^)]*[+*]\)\{/, // nested quantifier with repetition: (x+){n}
  /\.\*.*\.\*/, // overlapping greedy wildcards: .*....*
];

function isReDoSSafe(pattern: string): boolean {
  return !REDOS_PATTERNS.some((rp) => rp.test(pattern));
}

/**
 * Execute regex test with length limits and ReDoS pattern rejection.
 * Rejects overly long patterns, inputs, and patterns with nested quantifiers.
 */
function safeRegexTest(pattern: string, input: string): boolean {
  if (pattern.length > 200 || input.length > 10000) {
    logger.warn('Regex input or pattern exceeds safe length limits', {
      patternLength: pattern.length,
      inputLength: input.length,
    });
    return false;
  }
  if (!isReDoSSafe(pattern)) {
    logger.warn('Regex pattern rejected — contains nested quantifiers (ReDoS risk)', {
      pattern: pattern.substring(0, 50),
    });
    return false;
  }
  const regex = new RegExp(pattern, 'i');
  return regex.test(input);
}

// Allowlist of Prisma model table names that can be updated via workflow actions.
// This prevents SQL injection through the `update_status` action's `model` parameter.
const ALLOWED_STATUS_UPDATE_MODELS = new Set([
  'RiskItem',
  'FrameworkControl',
  'GrcIncident',
  'Vendor',
  'Policy',
  'ComplianceDeadline',
  'GRCWorkflow',
  'AuditEngagement',
  'BreachIncident',
  'VendorAssessment',
  'VendorReview',
]);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'condition';
  eventType?: string; // 'risk.created', 'control.failed', 'evidence.uploaded', 'incident.created', etc.
  schedule?: string; // Cron expression
  conditionField?: string;
  conditionOperator?: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'matches';
  conditionValue?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'not_contains' | 'matches' | 'in' | 'not_in';
  value: string | number | boolean | string[];
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'send_notification' | 'assign_task' | 'update_status' | 'create_incident' | 'send_email' | 'call_webhook' | 'add_tag' | 'escalate';
  config: Record<string, unknown>;
}

export interface ActionResult {
  actionType: string;
  status: 'success' | 'failure' | 'skipped';
  message: string;
  error?: string;
  durationMs: number;
}

export interface StepResult {
  step: number;
  actionType: string;
  status: 'success' | 'failure' | 'skipped';
  detail: string;
  durationMs: number;
}

export interface ExecutionResult {
  workflowId: string;
  workflowName: string;
  status: 'Completed' | 'Failed' | 'Partial';
  steps: StepResult[];
  totalDurationMs: number;
  triggeredAt: string;
}

// Rate-limiting tracker: orgId -> { count, windowStart }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 100; // max actions per minute per org

// ============================================================================
// WORKFLOW ENGINE SERVICE
// ============================================================================

export class WorkflowEngineService {
  // --------------------------------------------------------------------------
  // Condition Evaluation
  // --------------------------------------------------------------------------

  /**
   * Resolve a dotted field path from a data object.
   * E.g. "risk.severity" from { risk: { severity: "high" } } -> "high"
   */
  private resolveField(data: Record<string, unknown>, field: string): unknown {
    const parts = field.split('.');
    let current: unknown = data;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return current;
  }

  /**
   * Evaluate a single condition against a data record.
   */
  private evaluateCondition(condition: WorkflowCondition, data: Record<string, unknown>): boolean {
    const actual = this.resolveField(data, condition.field);
    const expected = condition.value;

    switch (condition.operator) {
      case 'eq':
        return String(actual) === String(expected);

      case 'ne':
        return String(actual) !== String(expected);

      case 'gt':
        return Number(actual) > Number(expected);

      case 'lt':
        return Number(actual) < Number(expected);

      case 'gte':
        return Number(actual) >= Number(expected);

      case 'lte':
        return Number(actual) <= Number(expected);

      case 'contains':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return actual.toLowerCase().includes(expected.toLowerCase());
        }
        if (Array.isArray(actual)) {
          return actual.includes(expected);
        }
        return false;

      case 'not_contains':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return !actual.toLowerCase().includes(expected.toLowerCase());
        }
        if (Array.isArray(actual)) {
          return !actual.includes(expected);
        }
        return true;

      case 'matches':
        try {
          return safeRegexTest(String(expected), String(actual));
        } catch {
          logger.warn('Invalid regex in workflow condition', { pattern: expected });
          return false;
        }

      case 'in':
        if (Array.isArray(expected)) {
          return expected.map(String).includes(String(actual));
        }
        return false;

      case 'not_in':
        if (Array.isArray(expected)) {
          return !expected.map(String).includes(String(actual));
        }
        return true;

      default:
        logger.warn('Unknown condition operator', { operator: condition.operator });
        return false;
    }
  }

  /**
   * Evaluate an array of conditions against data.
   * Conditions are combined using their logicalOperator (default AND).
   * The first condition's logicalOperator is ignored (it starts the chain).
   */
  evaluateConditions(conditions: WorkflowCondition[], data: Record<string, unknown>): boolean {
    if (conditions.length === 0) return true;

    let result = this.evaluateCondition(conditions[0], data);

    for (let i = 1; i < conditions.length; i++) {
      const cond = conditions[i];
      const condResult = this.evaluateCondition(cond, data);
      const op = cond.logicalOperator || 'AND';

      if (op === 'OR') {
        result = result || condResult;
      } else {
        result = result && condResult;
      }
    }

    return result;
  }

  // --------------------------------------------------------------------------
  // Template Interpolation
  // --------------------------------------------------------------------------

  /**
   * Interpolate {{variable}} placeholders in a string using context data.
   */
  private interpolate(template: string, context: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, path: string) => {
      const value = this.resolveField(context, path);
      return value !== undefined ? String(value) : '';
    });
  }

  /**
   * Interpolate all string values in a config object.
   */
  private interpolateConfig(config: Record<string, unknown>, context: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string') {
        result[key] = this.interpolate(value, context);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = this.interpolateConfig(value as Record<string, unknown>, context);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  // --------------------------------------------------------------------------
  // Rate Limiting
  // --------------------------------------------------------------------------

  private checkRateLimit(organizationId: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(organizationId);

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.set(organizationId, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= RATE_LIMIT_MAX) {
      logger.warn('Workflow rate limit exceeded', { organizationId, count: entry.count });
      return false;
    }

    entry.count += 1;
    return true;
  }

  // --------------------------------------------------------------------------
  // Action Execution
  // --------------------------------------------------------------------------

  /**
   * Execute a single workflow action.
   */
  private async executeAction(
    action: WorkflowAction,
    context: Record<string, unknown>,
    organizationId: string
  ): Promise<ActionResult> {
    const startTime = Date.now();
    const config = this.interpolateConfig(action.config, context);

    try {
      switch (action.type) {
        case 'send_notification': {
          const title = (config.title as string) || 'Workflow Notification';
          const message = (config.message as string) || '';
          const userIds = (config.userIds as string[]) || [];
          const type = (config.notificationType as string) || 'info';

          for (const userId of userIds) {
            await prisma.notification.create({
              data: {
                userId,
                organizationId,
                type,
                title,
                message,
                status: 'unread',
                category: 'workflow',
                channels: ['in_app'],
              },
            });
          }

          return {
            actionType: action.type,
            status: 'success',
            message: `Sent notification to ${userIds.length} user(s)`,
            durationMs: Date.now() - startTime,
          };
        }

        case 'send_email': {
          const to = (config.to as string) || '';
          const subject = (config.subject as string) || '';
          const body = (config.body as string) || '';

          if (!to || !subject) {
            return {
              actionType: action.type,
              status: 'failure',
              message: 'Email requires "to" and "subject" fields',
              durationMs: Date.now() - startTime,
            };
          }

          try {
            const emailService = (await import('./emailService')).default;
            const sent = await emailService.sendEmail({ to, subject, html: body });
            return {
              actionType: action.type,
              status: sent ? 'success' : 'failure',
              message: sent ? `Email sent to ${to}` : `Email delivery failed for ${to}`,
              durationMs: Date.now() - startTime,
            };
          } catch (emailError: any) {
            logger.error('Workflow email action failed', { to, subject, error: emailError.message });
            return {
              actionType: action.type,
              status: 'failure',
              message: `Email failed: ${emailError.message}`,
              durationMs: Date.now() - startTime,
            };
          }
        }

        case 'assign_task': {
          const taskTitle = (config.taskTitle as string) || 'Workflow-generated task';
          const taskDescription = (config.taskDescription as string) || '';
          const assigneeId = (config.assigneeId as string) || '';
          const dueDays = (config.dueDays as number) || 7;
          const createdById = (context.userId as string) || 'system';

          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + dueDays);

          logger.info('Workflow assign_task action', {
            taskTitle,
            assigneeId,
            dueDate: dueDate.toISOString(),
          });

          // Persist the task as an Issue record in the database
          const issue = await prisma.issue.create({
            data: {
              organizationId,
              title: taskTitle,
              description: taskDescription,
              issueType: 'Task',
              category: 'workflow',
              priority: 'Medium',
              status: 'Open',
              assignedToId: assigneeId || null,
              createdById,
              dueDate,
            },
          });

          // Notify the assignee about the new task
          if (assigneeId) {
            await prisma.notification.create({
              data: {
                userId: assigneeId,
                organizationId,
                type: 'info',
                title: 'New Task Assigned',
                message: `${taskTitle}: ${taskDescription}`,
                status: 'unread',
                category: 'workflow',
                channels: ['in_app'],
              },
            });
          }

          return {
            actionType: action.type,
            status: 'success',
            message: `Task "${taskTitle}" (issue ${issue.id}) assigned to ${assigneeId}, due ${dueDate.toISOString().slice(0, 10)}`,
            durationMs: Date.now() - startTime,
          };
        }

        case 'update_status': {
          const model = (config.model as string) || '';
          const recordId = (config.recordId as string) || (context.resourceId as string) || '';
          const newStatus = (config.newStatus as string) || '';

          if (!ALLOWED_STATUS_UPDATE_MODELS.has(model)) {
            return {
              actionType: action.type,
              status: 'failure',
              message: `Model "${model}" is not allowed for status updates`,
              error: `Invalid model. Allowed: ${[...ALLOWED_STATUS_UPDATE_MODELS].join(', ')}`,
              durationMs: Date.now() - startTime,
            };
          }

          if (model && recordId && newStatus) {
            const modelTable = Prisma.raw(`"${model}"`);
            await prisma.$executeRaw`UPDATE ${modelTable} SET "status" = ${newStatus}, "updatedAt" = NOW() WHERE "id" = ${recordId} AND "organizationId" = ${organizationId}`;
          }

          return {
            actionType: action.type,
            status: 'success',
            message: `Updated ${model} ${recordId} status to "${newStatus}"`,
            durationMs: Date.now() - startTime,
          };
        }

        case 'create_incident': {
          const incidentTitle = (config.title as string) || 'Auto-created incident';
          const description = (config.description as string) || '';
          const severity = (config.severity as string) || 'medium';

          await prisma.grcIncident.create({
            data: {
              organizationId,
              title: incidentTitle,
              description,
              severity: severity.toUpperCase() === 'SEV1' ? 'SEV1' : severity.toUpperCase() === 'SEV2' ? 'SEV2' : severity.toUpperCase() === 'SEV3' ? 'SEV3' : 'SEV4',
              status: 'DETECTED',
              category: 'POLICY_VIOLATION',
              reportedBy: 'workflow-engine',
              detectedAt: new Date(),
            },
          });

          return {
            actionType: action.type,
            status: 'success',
            message: `Created incident: "${incidentTitle}" (${severity})`,
            durationMs: Date.now() - startTime,
          };
        }

        case 'call_webhook': {
          const url = (config.url as string) || '';
          const method = ((config.method as string) || 'POST').toUpperCase();
          const headers = (config.headers as Record<string, string>) || {};
          const payload = config.payload || context;

          if (!url) {
            return {
              actionType: action.type,
              status: 'failure',
              message: 'Webhook URL is required',
              error: 'Missing URL',
              durationMs: Date.now() - startTime,
            };
          }

          // SSRF protection: validate webhook URL before making request
          if (!isWebhookUrlSafe(url)) {
            logger.warn('Webhook URL blocked by SSRF protection', { url: url.substring(0, 200) });
            return {
              actionType: action.type,
              status: 'failure',
              message: 'Webhook URL is not allowed (SSRF protection)',
              error: 'Blocked URL',
              durationMs: Date.now() - startTime,
            };
          }

          const response = await axios({
            method: method as 'GET' | 'POST' | 'PUT' | 'PATCH',
            url,
            headers: {
              'Content-Type': 'application/json',
              'X-Workflow-Source': 'ComplyEasyAI',
              ...headers,
            },
            data: method !== 'GET' ? payload : undefined,
            timeout: 15_000,
          });

          return {
            actionType: action.type,
            status: 'success',
            message: `Webhook ${method} ${url} responded with ${response.status}`,
            durationMs: Date.now() - startTime,
          };
        }

        case 'add_tag': {
          const tagName = (config.tagName as string) || '';
          const resourceId = (config.resourceId as string) || (context.resourceId as string) || '';
          const resourceType = (config.resourceType as string) || (context.resourceType as string) || '';

          if (!tagName || !resourceId) {
            return {
              actionType: action.type,
              status: 'failure',
              message: 'Tag name and resource ID are required',
              durationMs: Date.now() - startTime,
            };
          }

          // Models that support a tags JSON field
          const TAGGABLE_MODELS = new Set(['Policy']);
          // Models that support a tags String[] field
          const TAGGABLE_ARRAY_MODELS = new Set(['ManagedDevice']);

          if (resourceType && TAGGABLE_MODELS.has(resourceType)) {
            // Append tag to the JSON tags field, avoiding duplicates
            const modelTable = Prisma.raw(`"${resourceType}"`);
            await prisma.$executeRaw`
              UPDATE ${modelTable}
              SET "tags" = COALESCE("tags", '[]'::jsonb) || to_jsonb(${tagName}::text),
                  "updatedAt" = NOW()
              WHERE "id" = ${resourceId}
                AND "organizationId" = ${organizationId}
                AND NOT (COALESCE("tags", '[]'::jsonb) ? ${tagName})
            `;
          } else if (resourceType && TAGGABLE_ARRAY_MODELS.has(resourceType)) {
            // Append tag to the String[] tags field, avoiding duplicates
            const modelTable = Prisma.raw(`"${resourceType}"`);
            await prisma.$executeRaw`
              UPDATE ${modelTable}
              SET "tags" = array_append("tags", ${tagName}),
                  "updatedAt" = NOW()
              WHERE "id" = ${resourceId}
                AND "organizationId" = ${organizationId}
                AND NOT (${tagName} = ANY("tags"))
            `;
          } else {
            // For resources without a tags field, persist via audit log notification
            await prisma.notification.create({
              data: {
                userId: (context.userId as string) || 'system',
                organizationId,
                type: 'info',
                title: 'Tag Applied',
                message: `Tag "${tagName}" applied to ${resourceType || 'resource'} ${resourceId}`,
                status: 'unread',
                category: 'workflow',
                channels: ['in_app'],
              },
            });
          }

          logger.info('Workflow add_tag action completed', { tagName, resourceId, resourceType, organizationId });

          return {
            actionType: action.type,
            status: 'success',
            message: `Tag "${tagName}" added to ${resourceType || 'resource'} ${resourceId}`,
            durationMs: Date.now() - startTime,
          };
        }

        case 'escalate': {
          const escalateTo = (config.escalateTo as string) || '';
          const reason = (config.reason as string) || 'Automated escalation';
          const priority = (config.priority as string) || 'high';
          const createdById = (context.userId as string) || 'system';
          const priorityMap: Record<string, 'Low' | 'Medium' | 'High' | 'Critical'> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

          // Persist the escalation as an Issue record
          const escalationIssue = await prisma.issue.create({
            data: {
              organizationId,
              title: `Escalation: ${reason.slice(0, 120)}`,
              description: reason,
              issueType: 'Escalation',
              category: 'workflow',
              priority: priorityMap[priority.toLowerCase()] ?? 'High',
              status: 'Open',
              assignedToId: escalateTo || null,
              createdById,
            },
          });

          // Notify the escalation target
          if (escalateTo) {
            await prisma.notification.create({
              data: {
                userId: escalateTo,
                organizationId,
                type: 'warning',
                title: `Escalation: ${priority.toUpperCase()}`,
                message: reason,
                status: 'unread',
                category: 'workflow',
                channels: ['in_app'],
              },
            });
          }

          return {
            actionType: action.type,
            status: 'success',
            message: `Escalated to ${escalateTo} with priority ${priority} (issue ${escalationIssue.id})`,
            durationMs: Date.now() - startTime,
          };
        }

        default:
          return {
            actionType: action.type,
            status: 'skipped',
            message: `Unknown action type: ${action.type}`,
            durationMs: Date.now() - startTime,
          };
      }
    } catch (error: any) {
      logger.error('Workflow action execution failed', {
        actionType: action.type,
        error: error.message,
      });
      return {
        actionType: action.type,
        status: 'failure',
        message: `Action failed: ${error.message}`,
        error: error.message,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute an array of workflow actions sequentially.
   */
  async executeActions(
    actions: WorkflowAction[],
    context: Record<string, unknown>,
    organizationId: string = ''
  ): Promise<ActionResult[]> {
    const orgId = organizationId || (context.organizationId as string) || '';
    const results: ActionResult[] = [];

    for (const action of actions) {
      if (!this.checkRateLimit(orgId)) {
        results.push({
          actionType: action.type,
          status: 'skipped',
          message: 'Rate limit exceeded for this organization',
          durationMs: 0,
        });
        continue;
      }

      const result = await this.executeAction(action, context, orgId);
      results.push(result);

      // If a critical action fails, stop execution
      if (result.status === 'failure' && action.config.stopOnFailure) {
        logger.warn('Stopping workflow execution due to action failure', {
          actionType: action.type,
          error: result.error,
        });
        break;
      }
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // Trigger Matching
  // --------------------------------------------------------------------------

  /**
   * Check if a workflow's trigger matches an incoming event.
   */
  private triggerMatchesEvent(trigger: WorkflowTrigger, eventType: string, data: Record<string, unknown>): boolean {
    if (trigger.type === 'event') {
      return trigger.eventType === eventType;
    }

    if (trigger.type === 'condition') {
      if (!trigger.conditionField || !trigger.conditionOperator || trigger.conditionValue === undefined) {
        return false;
      }
      const actual = this.resolveField(data, trigger.conditionField);
      switch (trigger.conditionOperator) {
        case 'eq': return String(actual) === trigger.conditionValue;
        case 'ne': return String(actual) !== trigger.conditionValue;
        case 'gt': return Number(actual) > Number(trigger.conditionValue);
        case 'lt': return Number(actual) < Number(trigger.conditionValue);
        case 'contains': return String(actual).toLowerCase().includes(trigger.conditionValue.toLowerCase());
        case 'matches':
          try { return new RegExp(trigger.conditionValue, 'i').test(String(actual)); }
          catch { return false; }
        default: return false;
      }
    }

    // Schedule triggers are handled by a cron runner, not event processing
    return false;
  }

  // --------------------------------------------------------------------------
  // Event Processing
  // --------------------------------------------------------------------------

  /**
   * Process an incoming event by finding matching workflows and executing them.
   */
  async processEvent(
    eventType: string,
    data: Record<string, unknown>,
    organizationId: string
  ): Promise<void> {
    logger.info('Processing workflow event', { eventType, organizationId });

    try {
      // Find all active workflows for this organization
      const workflows = await prisma.gRCWorkflow.findMany({
        where: {
          organizationId,
          status: 'Active',
        },
        orderBy: { createdAt: 'asc' },
      });

      if (workflows.length === 0) {
        logger.debug('No active workflows found', { organizationId, eventType });
        return;
      }

      let matchedCount = 0;

      for (const workflow of workflows) {
        const trigger = workflow.trigger as unknown as WorkflowTrigger;
        if (!trigger) continue;

        if (this.triggerMatchesEvent(trigger, eventType, data)) {
          matchedCount++;
          logger.info('Workflow matched event', { workflowId: workflow.id, workflowName: workflow.name, eventType });

          try {
            await this.executeWorkflow(workflow.id, {
              eventType,
              organizationId,
              ...data,
            });
          } catch (err: any) {
            logger.error('Failed to execute matched workflow', {
              workflowId: workflow.id,
              error: err.message,
            });
          }
        }
      }

      logger.info('Event processing complete', { eventType, organizationId, matchedCount, totalWorkflows: workflows.length });
    } catch (error: any) {
      logger.error('Event processing error', { eventType, organizationId, error: error.message });
    }
  }

  // --------------------------------------------------------------------------
  // Workflow Execution
  // --------------------------------------------------------------------------

  /**
   * Execute a specific workflow by its ID.
   */
  async executeWorkflow(
    workflowId: string,
    triggerData: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const triggeredAt = new Date().toISOString();
    const steps: StepResult[] = [];

    // Fetch the workflow
    const workflow = await prisma.gRCWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new AppError(`Workflow not found: ${workflowId}`, 404);
    }

    if (workflow.status !== 'Active') {
      throw new AppError(`Workflow is not active: ${workflow.name} (${workflow.status})`, 400);
    }

    logger.info('Executing workflow', { workflowId, workflowName: workflow.name });

    // Parse workflow nodes as actions
    const nodes = (workflow.nodes as unknown as WorkflowAction[]) || [];
    const conditions = (workflow.variables as unknown as { conditions?: WorkflowCondition[] })?.conditions || [];
    const organizationId = workflow.organizationId;

    // Check conditions if any
    if (conditions.length > 0) {
      const conditionsMet = this.evaluateConditions(conditions, triggerData);
      steps.push({
        step: 1,
        actionType: 'evaluate_conditions',
        status: conditionsMet ? 'success' : 'skipped',
        detail: conditionsMet
          ? `All ${conditions.length} condition(s) met`
          : `Conditions not met, skipping workflow`,
        durationMs: Date.now() - startTime,
      });

      if (!conditionsMet) {
        const result: ExecutionResult = {
          workflowId,
          workflowName: workflow.name,
          status: 'Completed',
          steps,
          totalDurationMs: Date.now() - startTime,
          triggeredAt,
        };
        await this.logExecution(workflowId, 'Completed', steps, organizationId, triggerData);
        return result;
      }
    }

    // Execute actions
    let overallStatus: 'Completed' | 'Failed' | 'Partial' = 'Completed';
    let hasFailure = false;
    let hasSuccess = false;

    for (let i = 0; i < nodes.length; i++) {
      const action = nodes[i];
      const stepNumber = steps.length + 1;

      if (!this.checkRateLimit(organizationId)) {
        steps.push({
          step: stepNumber,
          actionType: action.type,
          status: 'skipped',
          detail: 'Rate limit exceeded',
          durationMs: 0,
        });
        continue;
      }

      const actionResult = await this.executeAction(action, triggerData, organizationId);

      steps.push({
        step: stepNumber,
        actionType: action.type,
        status: actionResult.status,
        detail: actionResult.message,
        durationMs: actionResult.durationMs,
      });

      if (actionResult.status === 'success') hasSuccess = true;
      if (actionResult.status === 'failure') hasFailure = true;

      // Stop on failure if configured
      if (actionResult.status === 'failure' && action.config?.stopOnFailure) {
        break;
      }
    }

    if (hasFailure && hasSuccess) overallStatus = 'Partial';
    else if (hasFailure && !hasSuccess) overallStatus = 'Failed';

    // Update workflow run stats
    try {
      await prisma.gRCWorkflow.update({
        where: { id: workflowId },
        data: {
          lastRunAt: new Date(),
          runCount: { increment: 1 },
          ...(overallStatus === 'Completed' || overallStatus === 'Partial'
            ? { successCount: { increment: 1 } }
            : { failureCount: { increment: 1 } }),
        },
      });
    } catch (err: any) {
      logger.error('Failed to update workflow run stats', { workflowId, error: err.message });
    }

    // Log execution
    await this.logExecution(workflowId, overallStatus, steps, organizationId, triggerData);

    const result: ExecutionResult = {
      workflowId,
      workflowName: workflow.name,
      status: overallStatus,
      steps,
      totalDurationMs: Date.now() - startTime,
      triggeredAt,
    };

    logger.info('Workflow execution complete', {
      workflowId,
      status: overallStatus,
      steps: steps.length,
      durationMs: result.totalDurationMs,
    });

    return result;
  }

  // --------------------------------------------------------------------------
  // Execution Logging
  // --------------------------------------------------------------------------

  /**
   * Log a workflow execution to the WorkflowExecution model.
   */
  async logExecution(
    workflowId: string,
    status: string,
    steps: StepResult[],
    organizationId?: string,
    triggerData?: Record<string, unknown>
  ): Promise<void> {
    const startedAt = steps.length > 0 ? new Date() : new Date();
    const totalDuration = steps.reduce((sum, s) => sum + s.durationMs, 0);

    try {
      await prisma.workflowExecution.create({
        data: {
          workflowId,
          triggeredBy: (triggerData?.userId as string) || 'system',
          triggerType: (triggerData?.eventType as string) || 'manual',
          status: status === 'Completed' ? 'Completed' : status === 'Failed' ? 'Failed' : 'Completed',
          completedNodes: steps.filter(s => s.status === 'success').map(s => `step-${s.step}`),
          nodeResults: steps as unknown as any,
          variables: triggerData as unknown as any,
          error: steps.find(s => s.status === 'failure')?.detail || null,
          startedAt,
          completedAt: new Date(),
          duration: totalDuration,
        },
      });

      logger.debug('Workflow execution logged', { workflowId, status, steps: steps.length });
    } catch (error: any) {
      logger.error('Failed to log workflow execution', {
        workflowId,
        error: error.message,
      });
    }
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  /**
   * Validate a cron expression (basic syntax check).
   */
  validateCronExpression(expression: string): boolean {
    const parts = expression.trim().split(/\s+/);
    if (parts.length < 5 || parts.length > 6) return false;
    const patterns = [
      /^(\*|([0-9]|[1-5][0-9])([-/][0-9]+)?(,([0-9]|[1-5][0-9]))*|\*\/[0-9]+)$/, // minute
      /^(\*|([0-9]|1[0-9]|2[0-3])([-/][0-9]+)?(,([0-9]|1[0-9]|2[0-3]))*|\*\/[0-9]+)$/, // hour
      /^(\*|([1-9]|[12][0-9]|3[01])([-/][0-9]+)?(,([1-9]|[12][0-9]|3[01]))*|\*\/[0-9]+)$/, // day of month
      /^(\*|([1-9]|1[0-2])([-/][0-9]+)?(,([1-9]|1[0-2]))*|\*\/[0-9]+)$/, // month
      /^(\*|[0-6]([-/][0-6])?(,[0-6])*|\*\/[0-6])$/, // day of week
    ];
    for (let i = 0; i < 5; i++) {
      if (!patterns[i].test(parts[i])) return false;
    }
    return true;
  }

  /**
   * Get a human-readable description of a cron expression.
   */
  describeCron(expression: string): string {
    const parts = expression.trim().split(/\s+/);
    if (parts.length < 5) return expression;
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (minute === '0' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return `Daily at ${hour}:00`;
    }
    if (minute === '0' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
      const days = dayOfWeek.split(',').map(d => dayNames[parseInt(d)] || d).join(', ');
      return `Every ${days} at ${hour}:00`;
    }
    if (dayOfMonth !== '*' && month === '*') {
      return `Monthly on day ${dayOfMonth} at ${hour}:${minute.padStart(2, '0')}`;
    }
    return expression;
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngineService();
export default workflowEngine;
