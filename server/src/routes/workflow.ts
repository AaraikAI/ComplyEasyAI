/**
 * Visual Workflow Builder Routes
 * Routes for workflow management, templates, execution, and automation rules.
 * Uses GRCWorkflow and WorkflowExecution Prisma models.
 */

import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createWorkflowSchema, updateWorkflowSchema,
  createWorkflowRuleSchema, updateWorkflowRuleSchema,
} from '../validators/coreModulesSchemas';
import { asyncHandler, AuthenticatedRequest } from '../types/express';
import { AppError } from '../middleware/errorHandler';
import prisma from '../config/database';
import logger from '../config/logger';
import { Prisma } from '../generated/prisma/client';

interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
}

interface WorkflowEdge {
  source: string;
  target: string;
  label?: string;
}

const router = Router();
router.use(authenticate);

// ============================================================================
// WORKFLOWS (CRUD)
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const { status, category, search } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const where: Prisma.GRCWorkflowWhereInput = { organizationId: user.organizationId };
    if (status && status !== 'all') where.status = status as string;
    if (category && category !== 'all') where.workflowType = category as string;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    try {
      const [workflows, total] = await Promise.all([
        prisma.gRCWorkflow.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: { _count: { select: { executions: true } } },
        }),
        prisma.gRCWorkflow.count({ where }),
      ]);

      res.json({ workflows, total, page, limit });
    } catch (error: any) {
      if (error?.code === 'P2021' || error?.code === 'P2010' || error?.message?.includes('does not exist')) {
        return res.json({ workflows: [], total: 0, page, limit });
      }
      throw error;
    }
  })
);

router.post(
  '/',
  authorize('admin', 'editor'),
  validateBody(createWorkflowSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const { name, description, workflowType, trigger, nodes, edges, variables, status } = req.body;

    const workflow = await prisma.gRCWorkflow.create({
      data: {
        organizationId: user.organizationId,
        name,
        description: description || '',
        workflowType: workflowType || 'Custom',
        trigger: trigger || { type: 'manual', config: {} },
        nodes: nodes || [],
        edges: edges || [],
        variables: variables || {},
        status: status || 'Draft',
        createdBy: user.id,
      },
    });

    res.status(201).json(workflow);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    const workflow = await prisma.gRCWorkflow.findFirst({
      where: { id: req.params.id, organizationId: user.organizationId },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!workflow) {
      throw new AppError('Workflow not found', 404);
    }

    res.json(workflow);
  })
);

router.patch(
  '/:id',
  authorize('admin', 'editor'),
  validateBody(updateWorkflowSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const { name, description, workflowType, trigger, nodes, edges, variables, status } = req.body;

    const existing = await prisma.gRCWorkflow.findFirst({
      where: { id: req.params.id, organizationId: user.organizationId },
    });

    if (!existing) {
      throw new AppError('Workflow not found', 404);
    }

    const data: Prisma.GRCWorkflowUpdateInput = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (workflowType !== undefined) data.workflowType = workflowType;
    if (trigger !== undefined) data.trigger = trigger;
    if (nodes !== undefined) data.nodes = nodes;
    if (edges !== undefined) data.edges = edges;
    if (variables !== undefined) data.variables = variables;
    if (status !== undefined) data.status = status;

    const workflow = await prisma.gRCWorkflow.update({
      where: { id: req.params.id },
      data,
    });

    res.json(workflow);
  })
);

router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    const existing = await prisma.gRCWorkflow.findFirst({
      where: { id: req.params.id, organizationId: user.organizationId },
    });

    if (!existing) {
      throw new AppError('Workflow not found', 404);
    }

    await prisma.gRCWorkflow.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

router.post(
  '/:id/duplicate',
  authorize('admin', 'editor'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    const source = await prisma.gRCWorkflow.findFirst({
      where: { id: req.params.id, organizationId: user.organizationId },
    });

    if (!source) {
      throw new AppError('Workflow not found', 404);
    }

    const copy = await prisma.gRCWorkflow.create({
      data: {
        organizationId: user.organizationId,
        name: `${source.name} (Copy)`,
        description: source.description || '',
        workflowType: source.workflowType,
        trigger: source.trigger as Prisma.InputJsonValue,
        nodes: source.nodes as Prisma.InputJsonValue,
        edges: source.edges as Prisma.InputJsonValue,
        variables: source.variables as Prisma.InputJsonValue,
        status: 'Draft',
        createdBy: user.id,
      },
    });

    res.status(201).json(copy);
  })
);

router.post(
  '/:id/run',
  authorize('admin', 'editor'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    const workflow = await prisma.gRCWorkflow.findFirst({
      where: { id: req.params.id, organizationId: user.organizationId },
    });

    if (!workflow) {
      throw new AppError('Workflow not found', 404);
    }

    if (workflow.status !== 'Active' && workflow.status !== 'Draft') {
      throw new AppError('Workflow must be Active or Draft to run', 400);
    }

    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        triggeredBy: user.id,
        triggerType: 'manual',
        status: 'Running',
        completedNodes: [],
        nodeResults: {},
        variables: (workflow.variables as Prisma.InputJsonValue) || {},
      },
    });

    // Update workflow run stats
    await prisma.gRCWorkflow.update({
      where: { id: workflow.id },
      data: {
        lastRunAt: new Date(),
        runCount: { increment: 1 },
      },
    });

    res.json(execution);
  })
);

// ============================================================================
// TEMPLATES (built-in workflow templates)
// ============================================================================

router.get(
  '/templates/list',
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    // Built-in GRC workflow templates
    const templates = [
      { id: 'tpl-vendor-risk', name: 'New Vendor Risk Assessment', category: 'Risk', steps: 6, popularity: 94, description: 'End-to-end vendor risk assessment with automatic scoring and approval gates.' },
      { id: 'tpl-access-review', name: 'Quarterly Access Review', category: 'Compliance', steps: 5, popularity: 87, description: 'Automated quarterly user access review with manager approval workflow.' },
      { id: 'tpl-incident', name: 'Incident Response Workflow', category: 'Incident', steps: 8, popularity: 91, description: 'NIST-aligned incident response from detection through post-mortem.' },
      { id: 'tpl-evidence', name: 'Evidence Collection Reminder', category: 'Audit', steps: 4, popularity: 78, description: 'Automated evidence collection reminders with escalation paths.' },
      { id: 'tpl-policy', name: 'Policy Review Cycle', category: 'Compliance', steps: 7, popularity: 82, description: 'Annual policy review with stakeholder sign-off and version control.' },
      { id: 'tpl-dsar', name: 'DSAR Request Processing', category: 'Privacy', steps: 9, popularity: 89, description: 'GDPR/CCPA DSAR processing with identity verification and data collection.' },
      { id: 'tpl-finding', name: 'Audit Finding Remediation', category: 'Audit', steps: 6, popularity: 76, description: 'Track audit findings from discovery through verification and closure.' },
      { id: 'tpl-offboarding', name: 'Employee Offboarding Compliance', category: 'HR', steps: 10, popularity: 85, description: 'Ensure compliant offboarding with access revocation and data handling.' },
    ];
    res.json(templates);
  })
);

router.post(
  '/templates/:id/use',
  authorize('admin', 'editor'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const templateId = req.params.id;

    // Map template ID to workflow type and default nodes
    const templateMap: Record<string, { name: string; type: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] }> = {
      'tpl-vendor-risk': {
        name: 'Vendor Risk Assessment',
        type: 'VendorOnboarding',
        nodes: [
          { id: 'n1', type: 'trigger', label: 'New Vendor Request', position: { x: 0, y: 0 } },
          { id: 'n2', type: 'action', label: 'Collect Vendor Info', position: { x: 200, y: 0 } },
          { id: 'n3', type: 'action', label: 'Risk Assessment', position: { x: 400, y: 0 } },
          { id: 'n4', type: 'condition', label: 'Risk Level Check', position: { x: 600, y: 0 } },
          { id: 'n5', type: 'approval', label: 'Manager Approval', position: { x: 800, y: -50 } },
          { id: 'n6', type: 'action', label: 'Auto-Approve (Low Risk)', position: { x: 800, y: 50 } },
        ],
        edges: [
          { source: 'n1', target: 'n2' }, { source: 'n2', target: 'n3' },
          { source: 'n3', target: 'n4' }, { source: 'n4', target: 'n5', label: 'High' },
          { source: 'n4', target: 'n6', label: 'Low' },
        ],
      },
      'tpl-dsar': {
        name: 'DSAR Request Processing',
        type: 'Custom',
        nodes: [
          { id: 'n1', type: 'trigger', label: 'DSAR Received', position: { x: 0, y: 0 } },
          { id: 'n2', type: 'action', label: 'Verify Identity', position: { x: 200, y: 0 } },
          { id: 'n3', type: 'action', label: 'Locate Data', position: { x: 400, y: 0 } },
          { id: 'n4', type: 'action', label: 'Review Data', position: { x: 600, y: 0 } },
          { id: 'n5', type: 'approval', label: 'DPO Approval', position: { x: 800, y: 0 } },
          { id: 'n6', type: 'action', label: 'Send Response', position: { x: 1000, y: 0 } },
        ],
        edges: [
          { source: 'n1', target: 'n2' }, { source: 'n2', target: 'n3' },
          { source: 'n3', target: 'n4' }, { source: 'n4', target: 'n5' },
          { source: 'n5', target: 'n6' },
        ],
      },
    };

    const template = templateMap[templateId];
    const workflow = await prisma.gRCWorkflow.create({
      data: {
        organizationId: user.organizationId,
        name: template?.name || `Workflow from ${templateId}`,
        description: `Created from template ${templateId}`,
        workflowType: template?.type || 'Custom',
        trigger: { type: 'manual', config: {} },
        nodes: (template?.nodes || []) as unknown as Prisma.InputJsonValue,
        edges: (template?.edges || []) as unknown as Prisma.InputJsonValue,
        variables: {},
        status: 'Draft',
        createdBy: user.id,
      },
    });

    res.status(201).json(workflow);
  })
);

// ============================================================================
// EXECUTION RUNS
// ============================================================================

router.get(
  '/runs/list',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Get workflow IDs for this org first
    const orgWorkflows = await prisma.gRCWorkflow.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true },
    });
    const workflowIds = orgWorkflows.map((w: { id: string }) => w.id);

    const [runs, total] = await Promise.all([
      prisma.workflowExecution.findMany({
        where: { workflowId: { in: workflowIds } },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { workflow: { select: { id: true, name: true, workflowType: true } } },
      }),
      prisma.workflowExecution.count({
        where: { workflowId: { in: workflowIds } },
      }),
    ]);

    res.json({ runs, total, page, limit });
  })
);

router.get(
  '/runs/:runId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: req.params.runId },
      include: { workflow: true },
    });

    if (!execution) {
      throw new AppError('Execution run not found', 404);
    }

    res.json(execution);
  })
);

router.post(
  '/runs/:runId/retry',
  authorize('admin', 'editor'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    const original = await prisma.workflowExecution.findUnique({
      where: { id: req.params.runId },
      include: { workflow: true },
    });

    if (!original) {
      throw new AppError('Execution run not found', 404);
    }

    const retry = await prisma.workflowExecution.create({
      data: {
        workflowId: original.workflowId,
        triggeredBy: user.id,
        triggerType: 'manual',
        status: 'Running',
        completedNodes: [],
        nodeResults: {},
        variables: (original.variables as Prisma.InputJsonValue) || {},
      },
    });

    await prisma.gRCWorkflow.update({
      where: { id: original.workflowId },
      data: { runCount: { increment: 1 } },
    });

    res.json(retry);
  })
);

// ============================================================================
// AUTOMATION RULES (stored as workflows with event triggers)
// ============================================================================

router.get(
  '/rules/list',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const where = {
      organizationId: user.organizationId,
      trigger: { path: ['type'], equals: 'event' },
    };

    const [rules, total] = await Promise.all([
      prisma.gRCWorkflow.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.gRCWorkflow.count({ where }),
    ]);

    res.json({ rules, total, page, limit });
  })
);

router.post(
  '/rules',
  authorize('admin', 'editor'),
  validateBody(createWorkflowRuleSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const { name, description, trigger, conditions, actions } = req.body;

    const rule = await prisma.gRCWorkflow.create({
      data: {
        organizationId: user.organizationId,
        name,
        description: description || '',
        workflowType: 'Custom',
        trigger: { type: 'event', config: trigger || {} },
        nodes: (conditions || []).concat(actions || []),
        edges: [],
        status: 'Active',
        createdBy: user.id,
      },
    });

    res.status(201).json(rule);
  })
);

router.patch(
  '/rules/:id',
  authorize('admin', 'editor'),
  validateBody(updateWorkflowRuleSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    const existing = await prisma.gRCWorkflow.findFirst({
      where: { id: req.params.id, organizationId: user.organizationId },
    });

    if (!existing) {
      throw new AppError('Rule not found', 404);
    }

    const data: Prisma.GRCWorkflowUpdateInput = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.trigger !== undefined) data.trigger = { type: 'event', config: req.body.trigger };
    if (req.body.status !== undefined) data.status = req.body.status;
    if (req.body.conditions || req.body.actions) {
      data.nodes = (req.body.conditions || []).concat(req.body.actions || []);
    }

    const rule = await prisma.gRCWorkflow.update({
      where: { id: req.params.id },
      data,
    });

    res.json(rule);
  })
);

router.delete(
  '/rules/:id',
  authorize('admin'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    const existing = await prisma.gRCWorkflow.findFirst({
      where: { id: req.params.id, organizationId: user.organizationId },
    });

    if (!existing) {
      throw new AppError('Rule not found', 404);
    }

    await prisma.gRCWorkflow.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
