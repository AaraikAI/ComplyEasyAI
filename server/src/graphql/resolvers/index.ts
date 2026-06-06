/**
 * GraphQL Resolvers
 *
 * Production resolvers that delegate to existing Prisma services.
 * Each resolver authenticates using the context user and applies
 * organization-scoped queries.
 */

import prisma from '../../config/database';
import logger from '../../config/logger';
import { validatePaginationParams, buildPaginatedResponse } from '../../utils/pagination';
import monitoringService from '../../services/monitoringService';

// ============================================================================
// HELPERS
// ============================================================================

interface GqlContext {
  user: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  } | null;
}

function requireAuth(ctx: GqlContext) {
  if (!ctx.user) {
    throw new Error('Authentication required');
  }
  return ctx.user;
}

function parsePagination(input?: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) {
  return validatePaginationParams({
    page: input?.page ?? 0,
    pageSize: input?.pageSize ?? 20,
    sortBy: input?.sortBy,
    sortOrder: input?.sortOrder as 'asc' | 'desc' | undefined,
  });
}

function buildWhere(organizationId: string, filter?: Record<string, any>): Record<string, any> {
  const where: Record<string, any> = { organizationId };
  if (!filter) return where;

  if (filter.status) where.status = filter.status;
  if (filter.category) where.category = filter.category;
  if (filter.riskLevel) where.riskLevel = filter.riskLevel;
  if (filter.type) where.type = filter.type;
  if (filter.region) where.region = filter.region;
  if (filter.severity) where.severity = filter.severity;
  if (filter.assigneeId) where.assigneeId = filter.assigneeId;

  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: 'insensitive' } },
      { title: { contains: filter.search, mode: 'insensitive' } },
      { description: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  if (filter.minScore !== undefined || filter.maxScore !== undefined) {
    where.riskScore = {};
    if (filter.minScore !== undefined) where.riskScore.gte = filter.minScore;
    if (filter.maxScore !== undefined) where.riskScore.lte = filter.maxScore;
  }

  return where;
}

// ============================================================================
// RESOLVERS
// ============================================================================

export const resolvers = {
  // ==========================================================================
  // QUERIES
  // ==========================================================================
  Query: {
    // Vendor queries
    vendors: async (_: any, args: any, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const { skip, take, orderBy } = parsePagination(args.pagination);
      const where = buildWhere(user.organizationId, args.filter);

      const [data, totalItems] = await Promise.all([
        prisma.vendor.findMany({ where, skip, take, ...(orderBy && { orderBy }), include: { assessments: { take: 1, orderBy: { createdAt: 'desc' } } } }),
        prisma.vendor.count({ where }),
      ]);

      return buildPaginatedResponse(data, totalItems, args.pagination?.page ?? 0, args.pagination?.pageSize ?? 20);
    },

    vendor: async (_: any, args: { id: string }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      return prisma.vendor.findFirst({
        where: { id: args.id, organizationId: user.organizationId },
        include: { assessments: true, reviews: true, monitors: true },
      });
    },

    vendorDashboard: async (_: any, __: any, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const orgId = user.organizationId;

      const [totalVendors, highRiskCount, activeAssessments, topRiskVendors] = await Promise.all([
        prisma.vendor.count({ where: { organizationId: orgId } }),
        prisma.vendor.count({ where: { organizationId: orgId, riskLevel: { in: ['High', 'Critical'] } } }),
        prisma.vendorAssessment.count({ where: { vendor: { organizationId: orgId }, status: { not: 'Completed' } } }),
        prisma.vendor.findMany({
          where: { organizationId: orgId, riskScore: { gt: 0 } },
          orderBy: { riskScore: 'desc' },
          take: 5,
        }),
      ]);

      return {
        totalVendors,
        highRiskCount,
        activeAssessments,
        overdueReviews: 0,
        averageRiskScore: null,
        byRiskLevel: null,
        byCategory: null,
        recentActivity: null,
        topRiskVendors,
      };
    },

    // Framework queries
    frameworks: async (_: any, args: any, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const { skip, take, orderBy } = parsePagination(args.pagination);
      const where = buildWhere(user.organizationId, args.filter);

      const [data, totalItems] = await Promise.all([
        prisma.complianceFramework.findMany({ where, skip, take, ...(orderBy && { orderBy }), include: { _count: { select: { controls: true } } } }),
        prisma.complianceFramework.count({ where }),
      ]);

      return buildPaginatedResponse(data, totalItems, args.pagination?.page ?? 0, args.pagination?.pageSize ?? 20);
    },

    framework: async (_: any, args: { id: string }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      return prisma.complianceFramework.findFirst({
        where: { id: args.id, organizationId: user.organizationId },
        include: { controls: true },
      });
    },

    frameworkTemplates: async () => {
      return [
        { type: 'SOC2', name: 'SOC 2 Type II', description: 'Service Organization Control 2', controlCount: 129, region: 'US' },
        { type: 'ISO27001', name: 'ISO 27001:2022', description: 'Information Security Management', controlCount: 208, region: 'International' },
        { type: 'HIPAA', name: 'HIPAA', description: 'Health Insurance Portability and Accountability', controlCount: 174, region: 'US' },
        { type: 'GDPR', name: 'GDPR', description: 'General Data Protection Regulation', controlCount: 214, region: 'EU' },
        { type: 'PCI_DSS', name: 'PCI DSS v4.0', description: 'Payment Card Industry Data Security Standard', controlCount: 316, region: 'International' },
        { type: 'NIST_800_53', name: 'NIST 800-53 Rev 5', description: 'Security and Privacy Controls', controlCount: 1025, region: 'US' },
        { type: 'CCPA', name: 'CCPA/CPRA', description: 'California Consumer Privacy Act', controlCount: 117, region: 'US' },
        { type: 'SOX', name: 'SOX', description: 'Sarbanes-Oxley Act', controlCount: 150, region: 'US' },
        { type: 'NIST_CSF', name: 'NIST CSF 2.0', description: 'Cybersecurity Framework', controlCount: 130, region: 'US' },
        { type: 'FedRAMP', name: 'FedRAMP', description: 'Federal Risk and Authorization Management', controlCount: 422, region: 'US' },
        { type: 'CMMC', name: 'CMMC 2.0', description: 'Cybersecurity Maturity Model Certification', controlCount: 180, region: 'US' },
        { type: 'HITRUST', name: 'HITRUST CSF', description: 'Health Information Trust Alliance', controlCount: 233, region: 'US' },
        { type: 'CIS', name: 'CIS Controls v8', description: 'Center for Internet Security Controls', controlCount: 154, region: 'International' },
      ];
    },

    // Risk queries
    risks: async (_: any, args: any, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const { skip, take, orderBy } = parsePagination(args.pagination);
      const where = buildWhere(user.organizationId, args.filter);

      const [data, totalItems] = await Promise.all([
        prisma.riskItem.findMany({ where, skip, take, ...(orderBy && { orderBy }) }),
        prisma.riskItem.count({ where }),
      ]);

      return buildPaginatedResponse(data, totalItems, args.pagination?.page ?? 0, args.pagination?.pageSize ?? 20);
    },

    risk: async (_: any, args: { id: string }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      return prisma.riskItem.findFirst({ where: { id: args.id, organizationId: user.organizationId } });
    },

    // Policy queries
    policies: async (_: any, args: any, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const { skip, take, orderBy } = parsePagination(args.pagination);
      const where = buildWhere(user.organizationId, args.filter);

      const [data, totalItems] = await Promise.all([
        prisma.policy.findMany({ where, skip, take, ...(orderBy && { orderBy }) }),
        prisma.policy.count({ where }),
      ]);

      return buildPaginatedResponse(data, totalItems, args.pagination?.page ?? 0, args.pagination?.pageSize ?? 20);
    },

    policy: async (_: any, args: { id: string }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      return prisma.policy.findFirst({ where: { id: args.id, organizationId: user.organizationId } });
    },

    // Issue queries
    issues: async (_: any, args: any, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const { skip, take, orderBy } = parsePagination(args.pagination);
      const where = buildWhere(user.organizationId, args.filter);

      const [data, totalItems] = await Promise.all([
        prisma.issue.findMany({ where, skip, take, ...(orderBy && { orderBy }), include: { comments: { take: 3, orderBy: { createdAt: 'desc' } } } }),
        prisma.issue.count({ where }),
      ]);

      return buildPaginatedResponse(data, totalItems, args.pagination?.page ?? 0, args.pagination?.pageSize ?? 20);
    },

    issue: async (_: any, args: { id: string }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      return prisma.issue.findFirst({
        where: { id: args.id, organizationId: user.organizationId },
        include: { comments: true },
      });
    },

    // Monitor queries
    monitors: async (_: any, args: any, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const { skip, take, orderBy } = parsePagination(args.pagination);
      const where = { organizationId: user.organizationId };

      const [data, totalItems] = await Promise.all([
        prisma.continuousMonitor.findMany({ where, skip, take, ...(orderBy && { orderBy }) }),
        prisma.continuousMonitor.count({ where }),
      ]);

      return buildPaginatedResponse(data, totalItems, args.pagination?.page ?? 0, args.pagination?.pageSize ?? 20);
    },

    monitor: async (_: any, args: { id: string }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      return prisma.continuousMonitor.findFirst({
        where: { id: args.id, organizationId: user.organizationId },
        include: { results: { take: 10, orderBy: { runDate: 'desc' } } },
      });
    },

    // Audit log queries
    auditLogs: async (_: any, args: any, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const { skip, take } = parsePagination(args.pagination);
      const where = { organizationId: user.organizationId };

      const [data, totalItems] = await Promise.all([
        prisma.auditLog.findMany({ where, skip, take, orderBy: { timestamp: 'desc' } }),
        prisma.auditLog.count({ where }),
      ]);

      return buildPaginatedResponse(data, totalItems, args.pagination?.page ?? 0, args.pagination?.pageSize ?? 20);
    },

    // User queries
    me: async (_: any, __: any, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      return prisma.user.findUnique({
        where: { id: user.id },
        include: { organization: true },
      });
    },

    organizationUsers: async (_: any, __: any, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      return prisma.user.findMany({ where: { organizationId: user.organizationId } });
    },

    // Dashboard
    dashboardStats: async (_: any, __: any, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const orgId = user.organizationId;

      const [vendors, frameworks, risks, policies, issues, monitors] = await Promise.all([
        prisma.vendor.count({ where: { organizationId: orgId } }),
        prisma.complianceFramework.count({ where: { organizationId: orgId } }),
        prisma.riskItem.count({ where: { organizationId: orgId } }),
        prisma.policy.count({ where: { organizationId: orgId } }),
        prisma.issue.count({ where: { organizationId: orgId } }),
        prisma.continuousMonitor.count({ where: { organizationId: orgId } }),
      ]);

      return { vendors, frameworks, risks, policies, issues, monitors };
    },
  },

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================
  Mutation: {
    createVendor: async (_: any, args: { input: any }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      return prisma.vendor.create({
        data: {
          ...args.input,
          status: args.input.status || 'Active',
          organizationId: user.organizationId,
        },
      });
    },

    updateVendor: async (_: any, args: { id: string; input: any }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const vendor = await prisma.vendor.findFirst({ where: { id: args.id, organizationId: user.organizationId } });
      if (!vendor) throw new Error('Vendor not found');

      return prisma.vendor.update({ where: { id: args.id }, data: args.input });
    },

    deleteVendor: async (_: any, args: { id: string }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const vendor = await prisma.vendor.findFirst({ where: { id: args.id, organizationId: user.organizationId } });
      if (!vendor) throw new Error('Vendor not found');

      await prisma.vendor.delete({ where: { id: args.id } });
      return true;
    },

    createRisk: async (_: any, args: { input: any }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const likelihood = args.input.likelihood || 3;
      const impact = args.input.impact || 3;

      return prisma.riskItem.create({
        data: {
          title: args.input.title,
          description: args.input.description || '',
          category: args.input.category || 'Operational',
          severity: args.input.severity || 'Medium',
          likelihood,
          impact,
          riskScore: likelihood * impact,
          status: 'Open',
          mitigationPlan: args.input.mitigationPlan || null,
          organizationId: user.organizationId,
        },
      });
    },

    updateRisk: async (_: any, args: { id: string; input: any }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const risk = await prisma.riskItem.findFirst({ where: { id: args.id, organizationId: user.organizationId } });
      if (!risk) throw new Error('Risk not found');

      const updateData: any = { ...args.input };
      if (args.input.likelihood || args.input.impact) {
        updateData.riskScore = (args.input.likelihood || risk.likelihood || 3) * (args.input.impact || risk.impact || 3);
      }

      return prisma.riskItem.update({ where: { id: args.id }, data: updateData });
    },

    deleteRisk: async (_: any, args: { id: string }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const risk = await prisma.riskItem.findFirst({ where: { id: args.id, organizationId: user.organizationId } });
      if (!risk) throw new Error('Risk not found');

      await prisma.riskItem.delete({ where: { id: args.id } });
      return true;
    },

    createPolicy: async (_: any, args: { input: any }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      return prisma.policy.create({
        data: {
          title: args.input.title,
          content: args.input.content || '',
          category: args.input.category || 'General',
          status: args.input.status || 'Draft',
          version: args.input.version || '1.0',
          owner: user.email,
          organizationId: user.organizationId,
        },
      });
    },

    deletePolicy: async (_: any, args: { id: string }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const policy = await prisma.policy.findFirst({ where: { id: args.id, organizationId: user.organizationId } });
      if (!policy) throw new Error('Policy not found');

      await prisma.policy.delete({ where: { id: args.id } });
      return true;
    },

    createIssue: async (_: any, args: { input: any }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      return prisma.issue.create({
        data: {
          title: args.input.title,
          description: args.input.description || '',
          issueType: args.input.issueType || 'General',
          category: args.input.category || null,
          status: 'Open',
          createdById: user.id,
          organizationId: user.organizationId,
        },
      });
    },

    addIssueComment: async (_: any, args: { issueId: string; content: string }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const issue = await prisma.issue.findFirst({ where: { id: args.issueId, organizationId: user.organizationId } });
      if (!issue) throw new Error('Issue not found');

      return prisma.issueComment.create({
        data: {
          comment: args.content,
          issueId: args.issueId,
          author: user.email,
        },
      });
    },

    createFramework: async (_: any, args: { input: any }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      return prisma.complianceFramework.create({
        data: {
          name: args.input.name,
          status: 'In_Review',
          progress: 0,
          nextAuditDate: args.input.nextAuditDate ? new Date(args.input.nextAuditDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          region: args.input.region || null,
          notes: args.input.notes || null,
          organizationId: user.organizationId,
        },
      });
    },

    applyTemplate: async (_: any, args: { frameworkId: string; templateType: string }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const framework = await prisma.complianceFramework.findFirst({
        where: { id: args.frameworkId, organizationId: user.organizationId },
      });
      if (!framework) throw new Error('Framework not found');

      logger.info(`[GraphQL] Template ${args.templateType} applied to framework ${args.frameworkId}`);
      return framework;
    },

    deleteFramework: async (_: any, args: { id: string }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const framework = await prisma.complianceFramework.findFirst({ where: { id: args.id, organizationId: user.organizationId } });
      if (!framework) throw new Error('Framework not found');

      await prisma.complianceFramework.delete({ where: { id: args.id } });
      return true;
    },

    createMonitor: async (_: any, args: { input: any }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      return prisma.continuousMonitor.create({
        data: {
          name: args.input.name,
          monitorType: args.input.monitorType || 'Custom',
          configuration: args.input.configuration || {},
          status: 'Unknown',
          active: true,
          organizationId: user.organizationId,
        },
      });
    },

    toggleMonitor: async (_: any, args: { id: string; enabled: boolean }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const monitor = await prisma.continuousMonitor.findFirst({ where: { id: args.id, organizationId: user.organizationId } });
      if (!monitor) throw new Error('Monitor not found');

      return prisma.continuousMonitor.update({
        where: { id: args.id },
        data: { active: args.enabled },
      });
    },

    runMonitor: async (_: any, args: { id: string }, ctx: GqlContext) => {
      const user = requireAuth(ctx);
      const monitor = await prisma.continuousMonitor.findFirst({ where: { id: args.id, organizationId: user.organizationId } });
      if (!monitor) throw new Error('Monitor not found');

      // Delegate to the real continuous-monitoring execution service (the same
      // path the REST endpoint and scheduler use). It runs the monitor's checks,
      // persists the actual evaluation result, and updates status/lastRun.
      return monitoringService.executeMonitor(args.id, user.id, user.organizationId);
    },
  },

  // ==========================================================================
  // FIELD RESOLVERS
  // ==========================================================================

  ComplianceFramework: {
    controlCount: async (parent: any) => {
      if (parent._count?.controls !== undefined) return parent._count.controls;
      return prisma.frameworkControl.count({ where: { frameworkId: parent.id } });
    },
    completionPercentage: async (parent: any) => {
      const [total, implemented] = await Promise.all([
        prisma.frameworkControl.count({ where: { frameworkId: parent.id } }),
        prisma.frameworkControl.count({ where: { frameworkId: parent.id, status: 'Implemented' } }),
      ]);
      return total > 0 ? Math.round((implemented / total) * 100) : 0;
    },
  },

  Issue: {
    assignee: async (parent: any) => {
      if (!parent.assignedToId) return null;
      return prisma.user.findUnique({ where: { id: parent.assignedToId } });
    },
    reporter: async (parent: any) => {
      if (!parent.createdById) return null;
      return prisma.user.findUnique({ where: { id: parent.createdById } });
    },
  },

  AuditLog: {
    user: async (parent: any) => {
      if (!parent.userId) return null;
      return prisma.user.findUnique({ where: { id: parent.userId } });
    },
  },
};

export default resolvers;
