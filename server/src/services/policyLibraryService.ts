import { Policy, Prisma } from '../generated/prisma/client';
import prisma from '../config/database';
import { AuditLogger } from '../utils/auditLogger';


/**
 * Policy & Controls Library Service
 * Manages policy templates, bulk imports, and cross-framework control mapping
 */
export class PolicyLibraryService {
  /**
   * Create policy
   */
  async createPolicy(data: {
    organizationId: string;
    title: string;
    category: string;
    content: string;
    version?: string;
    status?: string;
    owner?: string;
    approver?: string;
    effectiveDate?: Date;
    reviewDate?: Date;
    tags?: Prisma.InputJsonValue;
    framework?: string;
    userId: string;
  }) {
    const policy = await prisma.policy.create({
      data: {
        organizationId: data.organizationId,
        title: data.title,
        category: data.category,
        content: data.content,
        version: data.version || '1.0',
        status: data.status || 'Draft',
        owner: data.owner,
        approver: data.approver,
        effectiveDate: data.effectiveDate,
        reviewDate: data.reviewDate,
        tags: data.tags,
        framework: data.framework,
      },
    });

    await AuditLogger.log({
      userId: data.userId,
      organizationId: data.organizationId,
      action: 'policy.created',
      resourceType: 'Policy',
      resourceId: policy.id,
      metadata: { title: data.title, category: data.category },
    });

    return policy;
  }

  /**
   * Bulk import policies
   */
  async bulkImportPolicies(
    organizationId: string,
    policies: Array<{
      title: string;
      category: string;
      content: string;
      version?: string;
      owner?: string;
      tags?: Prisma.InputJsonValue;
    }>,
    userId: string
  ) {
    const imported = await Promise.all(
      policies.map(async (policy) => {
        return await this.createPolicy({
          organizationId,
          title: policy.title,
          category: policy.category,
          content: policy.content,
          version: policy.version || '1.0',
          owner: policy.owner,
          tags: policy.tags,
          userId,
        });
      })
    );

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'policy.bulk_imported',
      resourceType: 'Policy',
      resourceId: organizationId,
      metadata: { count: policies.length },
    });

    return imported;
  }

  /**
   * Get policy templates by category
   */
  async getPolicyTemplates(category?: string) {
    const templates = {
      'Information Security': [
        {
          title: 'Information Security Policy',
          content: `# Information Security Policy

## 1. Purpose
This policy establishes the framework for information security within the organization.

## 2. Scope
Applies to all employees, contractors, and third parties with access to organizational information.

## 3. Policy Statements
- All information assets must be classified according to sensitivity
- Access to information must be granted based on least privilege principle
- Security incidents must be reported within 24 hours

## 4. Responsibilities
- CISO: Overall information security program
- IT Team: Implementation of technical controls
- Employees: Compliance with security policies`,
          category: 'Information Security',
        },
        {
          title: 'Access Control Policy',
          content: `# Access Control Policy

## 1. Purpose
Define requirements for controlling access to organizational resources.

## 2. Access Provisioning
- All access requests must be approved by resource owner
- Access granted based on job role and business need
- Regular access reviews conducted quarterly

## 3. Authentication
- Strong passwords required (12+ characters, complexity)
- Multi-factor authentication required for privileged access
- Session timeouts enforced

## 4. Deprovisioning
- Access removed within 24 hours of termination
- Privileged access removed immediately`,
          category: 'Information Security',
        },
      ],
      'Data Privacy': [
        {
          title: 'Data Privacy Policy',
          content: `# Data Privacy Policy

## 1. Purpose
Protect personal data and ensure GDPR/privacy compliance.

## 2. Data Collection
- Only collect data necessary for business purposes
- Obtain consent for data processing
- Provide privacy notice to data subjects

## 3. Data Protection
- Encrypt personal data at rest and in transit
- Implement access controls for personal data
- Conduct privacy impact assessments

## 4. Data Subject Rights
- Right to access, rectification, erasure
- Right to data portability
- Right to object to processing`,
          category: 'Data Privacy',
        },
      ],
      'Business Continuity': [
        {
          title: 'Business Continuity Plan',
          content: `# Business Continuity Plan

## 1. Purpose
Ensure business operations continue during disruptions.

## 2. Critical Business Functions
- [List critical functions]
- Recovery time objectives (RTO)
- Recovery point objectives (RPO)

## 3. Emergency Response
- Incident declaration procedures
- Communication protocols
- Escalation procedures

## 4. Recovery Procedures
- System restoration steps
- Data recovery procedures
- Alternative site activation`,
          category: 'Business Continuity',
        },
      ],
      'Vendor Management': [
        {
          title: 'Third-Party Risk Management Policy',
          content: `# Third-Party Risk Management Policy

## 1. Purpose
Manage risks associated with third-party relationships.

## 2. Vendor Assessment
- Due diligence before engagement
- Security assessments for high-risk vendors
- Annual vendor reviews

## 3. Contractual Requirements
- Data protection clauses
- Security requirements
- Right to audit

## 4. Ongoing Monitoring
- Performance monitoring
- Security incident notification
- Compliance verification`,
          category: 'Vendor Management',
        },
      ],
    };

    if (category && templates[category as keyof typeof templates]) {
      return templates[category as keyof typeof templates];
    }

    return templates;
  }

  /**
   * Create cross-framework control mapping
   */
  async createControlMapping(
    sourceControlId: string,
    targetControlId: string,
    mappingType: string,
    notes: string,
    userId: string,
    organizationId: string
  ) {
    const sourceControl = await prisma.frameworkControl.findUnique({
      where: { id: sourceControlId },
    });

    if (!sourceControl) {
      throw new Error('Source control not found');
    }

    const existingMappings = (sourceControl.mappedControls as { mappings?: unknown[] } | null)?.mappings || [];

    const updated = await prisma.frameworkControl.update({
      where: { id: sourceControlId },
      data: {
        mappedControls: {
          mappings: [
            ...existingMappings,
            {
              targetControlId,
              mappingType,
              notes,
              createdAt: new Date().toISOString(),
            },
          ],
        } as Prisma.InputJsonValue,
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'control.mapping_created',
      resourceType: 'FrameworkControl',
      resourceId: sourceControlId,
      metadata: { targetControlId, mappingType },
    });

    return updated;
  }

  /**
   * Get single policy by ID
   */
  async getPolicyById(policyId: string, organizationId: string) {
    const policy = await prisma.policy.findFirst({
      where: { id: policyId, organizationId },
    });
    if (!policy) throw new Error('Policy not found');
    return policy;
  }

  /**
   * Archive policy (soft status change)
   */
  async archivePolicy(policyId: string, userId: string, organizationId: string) {
    const existing = await prisma.policy.findFirst({
      where: { id: policyId, organizationId },
    });
    if (!existing) throw new Error('Policy not found');

    const policy = await prisma.policy.update({
      where: { id: policyId },
      data: { status: 'Archived' },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'policy.archived',
      resourceType: 'Policy',
      resourceId: policyId,
      metadata: { title: policy.title },
    });

    return policy;
  }

  /**
   * Submit policy for review
   */
  async submitForReview(policyId: string, userId: string, organizationId: string) {
    const existing = await prisma.policy.findFirst({
      where: { id: policyId, organizationId },
    });
    if (!existing) throw new Error('Policy not found');

    const policy = await prisma.policy.update({
      where: { id: policyId },
      data: { status: 'In_Review' },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'policy.submitted_for_review',
      resourceType: 'Policy',
      resourceId: policyId,
      metadata: { title: policy.title },
    });

    return policy;
  }

  /**
   * Duplicate policy
   */
  async duplicatePolicy(policyId: string, userId: string, organizationId: string) {
    const original = await prisma.policy.findFirst({
      where: { id: policyId, organizationId },
    });
    if (!original) throw new Error('Policy not found');

    const duplicate = await prisma.policy.create({
      data: {
        organizationId,
        title: `${original.title} (Copy)`,
        category: original.category,
        content: original.content,
        summary: original.summary,
        framework: original.framework,
        version: '1.0',
        status: 'Draft',
        owner: original.owner,
        tags: original.tags as Prisma.InputJsonValue,
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'policy.duplicated',
      resourceType: 'Policy',
      resourceId: duplicate.id,
      metadata: { originalId: policyId, title: duplicate.title },
    });

    return duplicate;
  }

  /**
   * Get policies by organization (with pagination)
   */
  async getPoliciesByOrganization(
    organizationId: string,
    filters?: {
      category?: string;
      status?: string;
    },
    queryParams?: any
  ) {
    // Use pagination utilities if query params provided
    if (queryParams) {
      const { paginatedQuery } = require('../utils/pagination');
      return await paginatedQuery(
        prisma.policy.findMany.bind(prisma.policy),
        prisma.policy.count.bind(prisma.policy),
        {
          where: {
            organizationId,
            ...(filters?.category && { category: filters.category }),
            ...(filters?.status && { status: filters.status }),
          },
          orderBy: { updatedAt: 'desc' },
        },
        queryParams
      );
    }

    // Fallback for backward compatibility (limit to 100 for safety)
    return await prisma.policy.findMany({
      where: {
        organizationId,
        ...(filters?.category && { category: filters.category }),
        ...(filters?.status && { status: filters.status }),
      },
      orderBy: { updatedAt: 'desc' },
      take: 100, // Safety limit
    });
  }

  /**
   * Update policy
   */
  async updatePolicy(
    policyId: string,
    data: {
      title?: string;
      content?: string;
      status?: string;
      version?: string;
      approver?: string;
      effectiveDate?: Date;
      reviewDate?: Date;
    },
    userId: string,
    organizationId: string
  ) {
    const policy = await prisma.policy.update({
      where: { id: policyId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    await AuditLogger.log({
      userId,
      organizationId,
      action: 'policy.updated',
      resourceType: 'Policy',
      resourceId: policyId,
      metadata: { updates: Object.keys(data) },
    });

    return policy;
  }

  /**
   * Approve policy
   */
  async approvePolicy(
    policyId: string,
    approverId: string,
    organizationId: string
  ) {
    const policy = await prisma.policy.update({
      where: { id: policyId },
      data: {
        status: 'Approved',
        approver: approverId,
        approvalDate: new Date(),
      },
    });

    await AuditLogger.log({
      userId: approverId,
      organizationId,
      action: 'policy.approved',
      resourceType: 'Policy',
      resourceId: policyId,
      metadata: { approver: approverId },
    });

    return policy;
  }

  /**
   * Get policy metrics (optimized with aggregation queries)
   */
  async getPolicyMetrics(organizationId: string) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Use parallel count queries for better performance
    const [
      total,
      draftCount,
      reviewCount,
      approvedCount,
      archivedCount,
      reviewsDueCount,
      overdueCount,
      policiesForCategories,
    ] = await Promise.all([
      prisma.policy.count({ where: { organizationId } }),
      prisma.policy.count({ where: { organizationId, status: 'Draft' } }),
      prisma.policy.count({ where: { organizationId, status: 'In_Review' } }),
      prisma.policy.count({ where: { organizationId, status: 'Approved' } }),
      prisma.policy.count({ where: { organizationId, status: 'Archived' } }),
      prisma.policy.count({
        where: {
          organizationId,
          reviewDate: { lt: thirtyDaysFromNow },
        },
      }),
      prisma.policy.count({
        where: {
          organizationId,
          reviewDate: { lt: now },
        },
      }),
      // Only fetch category field for distribution calculation
      prisma.policy.findMany({
        where: { organizationId },
        select: { category: true },
      }),
    ]);

    return {
      total,
      byStatus: {
        draft: draftCount,
        review: reviewCount,
        approved: approvedCount,
        archived: archivedCount,
      },
      byCategory: this.getCategoryDistributionFromSelected(policiesForCategories),
      reviewsDue: reviewsDueCount,
      overdue: overdueCount,
    };
  }

  /**
   * Private helper: Get category distribution from selected data
   */
  private getCategoryDistributionFromSelected(
    policies: Array<{ category: string | null }>
  ) {
    const distribution: Record<string, number> = {};

    policies.forEach((policy) => {
      const category = policy.category || 'Uncategorized';
      distribution[category] = (distribution[category] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Private helper: Get category distribution (legacy - for backward compatibility)
   */
  private getCategoryDistribution(policies: Policy[]) {
    return this.getCategoryDistributionFromSelected(
      policies.map(p => ({ category: p.category }))
    );
  }
}

export default new PolicyLibraryService();
