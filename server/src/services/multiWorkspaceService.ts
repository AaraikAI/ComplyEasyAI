import { PrismaClient } from '@prisma/client';
import { AuditLogger } from '../utils/auditLogger';

const prisma = new PrismaClient();

/**
 * Multi-Workspace Service
 * Manages parent/child organization relationships for multi-entity setups
 */
export class MultiWorkspaceService {
  /**
   * Create child organization
   */
  async createChildOrganization(
    parentOrganizationId: string,
    data: {
      name: string;
      plan?: string;
    },
    userId: string
  ) {
    // Ensure parent exists and is marked as parent
    const parent = await prisma.organization.findUnique({
      where: { id: parentOrganizationId },
    });

    if (!parent) {
      throw new Error('Parent organization not found');
    }

    // Update parent to be marked as parent if not already
    if (!parent.isParent) {
      await prisma.organization.update({
        where: { id: parentOrganizationId },
        data: { isParent: true },
      });
    }

    // Create child organization
    const child = await prisma.organization.create({
      data: {
        name: data.name,
        plan: data.plan as any || parent.plan,
        parentOrganizationId: parentOrganizationId,
        isParent: false,
      },
    });

    await AuditLogger.log({
      userId,
      organizationId: parentOrganizationId,
      action: 'organization.child_created',
      resourceType: 'Organization',
      resourceId: child.id,
      metadata: { childName: data.name },
    });

    return child;
  }

  /**
   * Get organization hierarchy
   */
  async getOrganizationHierarchy(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        childOrganizations: {
          include: {
            users: true,
            frameworks: true,
          },
        },
        parentOrganization: {
          include: {
            childOrganizations: true,
          },
        },
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    return {
      current: {
        id: organization.id,
        name: organization.name,
        isParent: organization.isParent,
        plan: organization.plan,
      },
      parent: organization.parentOrganization
        ? {
            id: organization.parentOrganization.id,
            name: organization.parentOrganization.name,
            siblingCount: organization.parentOrganization.childOrganizations.length,
          }
        : null,
      children: organization.childOrganizations.map((child) => ({
        id: child.id,
        name: child.name,
        plan: child.plan,
        userCount: child.users.length,
        frameworkCount: child.frameworks.length,
      })),
    };
  }

  /**
   * Get consolidated metrics across workspace
   */
  async getConsolidatedMetrics(parentOrganizationId: string) {
    const parent = await prisma.organization.findUnique({
      where: { id: parentOrganizationId },
      include: {
        childOrganizations: {
          include: {
            users: true,
            frameworks: {
              include: {
                controls: true,
              },
            },
            risks: true,
            vendors: true,
          },
        },
      },
    });

    if (!parent || !parent.isParent) {
      throw new Error('Parent organization not found');
    }

    // Aggregate metrics
    const metrics = {
      totalOrganizations: 1 + parent.childOrganizations.length,
      totalUsers: parent.childOrganizations.reduce(
        (sum, org) => sum + org.users.length,
        0
      ),
      totalFrameworks: parent.childOrganizations.reduce(
        (sum, org) => sum + org.frameworks.length,
        0
      ),
      totalControls: parent.childOrganizations.reduce(
        (sum, org) =>
          sum +
          org.frameworks.reduce((fSum, f) => fSum + f.controls.length, 0),
        0
      ),
      implementedControls: parent.childOrganizations.reduce(
        (sum, org) =>
          sum +
          org.frameworks.reduce(
            (fSum, f) =>
              fSum + f.controls.filter((c) => c.status === 'Implemented').length,
            0
          ),
        0
      ),
      totalRisks: parent.childOrganizations.reduce(
        (sum, org) => sum + org.risks.length,
        0
      ),
      openRisks: parent.childOrganizations.reduce(
        (sum, org) => sum + org.risks.filter((r) => r.status === 'Open').length,
        0
      ),
      totalVendors: parent.childOrganizations.reduce(
        (sum, org) => sum + org.vendors.length,
        0
      ),
      organizationBreakdown: parent.childOrganizations.map((org) => ({
        id: org.id,
        name: org.name,
        users: org.users.length,
        frameworks: org.frameworks.length,
        risks: org.risks.length,
        vendors: org.vendors.length,
        complianceRate:
          org.frameworks.length > 0
            ? Math.round(
                (org.frameworks.reduce(
                  (sum, f) =>
                    sum +
                    f.controls.filter((c) => c.status === 'Implemented').length,
                  0
                ) /
                  org.frameworks.reduce(
                    (sum, f) => sum + f.controls.length,
                    0
                  )) *
                  100
              )
            : 0,
      })),
    };

    return metrics;
  }

  /**
   * Move user between organizations
   */
  async moveUserToOrganization(
    userId: string,
    targetOrganizationId: string,
    adminUserId: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const sourceOrgId = user.organizationId;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { organizationId: targetOrganizationId },
    });

    await AuditLogger.log({
      userId: adminUserId,
      organizationId: sourceOrgId,
      action: 'user.moved_organization',
      resourceType: 'User',
      resourceId: userId,
      metadata: {
        from: sourceOrgId,
        to: targetOrganizationId,
      },
    });

    return updatedUser;
  }

  /**
   * Clone framework to child organizations
   */
  async cloneFrameworkToChildren(
    frameworkId: string,
    sourceOrganizationId: string,
    targetOrganizationIds: string[],
    userId: string
  ) {
    const framework = await prisma.framework.findFirst({
      where: {
        id: frameworkId,
        organizationId: sourceOrganizationId,
      },
      include: {
        controls: true,
      },
    });

    if (!framework) {
      throw new Error('Framework not found');
    }

    const cloned = await Promise.all(
      targetOrganizationIds.map(async (targetOrgId) => {
        const newFramework = await prisma.framework.create({
          data: {
            name: framework.name,
            description: framework.description,
            version: framework.version,
            organizationId: targetOrgId,
          },
        });

        // Clone controls
        await Promise.all(
          framework.controls.map((control) =>
            prisma.frameworkControl.create({
              data: {
                frameworkId: newFramework.id,
                controlId: control.controlId,
                title: control.title,
                description: control.description,
                category: control.category,
                status: 'Pending',
              },
            })
          )
        );

        return newFramework;
      })
    );

    await AuditLogger.log({
      userId,
      organizationId: sourceOrganizationId,
      action: 'framework.cloned_to_children',
      resourceType: 'Framework',
      resourceId: frameworkId,
      metadata: { targetOrganizations: targetOrganizationIds.length },
    });

    return cloned;
  }
}

export default new MultiWorkspaceService();
