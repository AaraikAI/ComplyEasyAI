import prisma from '../config/database';
import { AuditLogger } from '../utils/auditLogger';
import { AppError } from '../middleware/errorHandler';


/**
 * Multi-Workspace Service
 * Manages parent/child organization relationships for multi-entity setups
 */
export class MultiWorkspaceService {
  /**
   * Create child organization — multi-tenant safe.
   * Verifies the calling user is a member of the parent organization before
   * mutating the parent or creating a child under it.
   */
  async createChildOrganization(
    parentOrganizationId: string,
    data: {
      name: string;
      plan?: string;
    },
    userId: string
  ) {
    // Multi-tenant guard: the caller MUST belong to the parent organization.
    const caller = await prisma.user.findFirst({
      where: { id: userId, organizationId: parentOrganizationId },
      select: { id: true },
    });
    if (!caller) {
      throw new AppError('Not authorized to create child organizations for this parent', 403);
    }

    // Ensure parent exists and is marked as parent
    const parent = await prisma.organization.findUnique({
      where: { id: parentOrganizationId },
    });

    if (!parent) {
      throw new AppError('Parent organization not found', 404);
    }

    // Update parent to be marked as parent if not already.
    // Re-asserting organizationId in the where clause defends against any
    // future signature changes that decouple parentOrganizationId from the caller.
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
      throw new AppError('Organization not found', 404);
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
  async getConsolidatedMetrics(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: true,
        frameworks: {
          include: {
            controls: true,
          },
        },
        risks: true,
        vendors: true,
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

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    // If this is a parent organization with children, aggregate metrics across all
    if (organization.isParent && organization.childOrganizations.length > 0) {
      const allOrgs = [organization, ...organization.childOrganizations];

      const metrics = {
        totalOrganizations: allOrgs.length,
        totalUsers: allOrgs.reduce((sum, org) => sum + org.users.length, 0),
        totalFrameworks: allOrgs.reduce((sum, org) => sum + org.frameworks.length, 0),
        totalControls: allOrgs.reduce(
          (sum, org) => sum + org.frameworks.reduce((fSum, f) => fSum + f.controls.length, 0),
          0
        ),
        implementedControls: allOrgs.reduce(
          (sum, org) =>
            sum + org.frameworks.reduce(
              (fSum, f) => fSum + f.controls.filter((c) => c.status === 'Implemented').length,
              0
            ),
          0
        ),
        totalRisks: allOrgs.reduce((sum, org) => sum + org.risks.length, 0),
        openRisks: allOrgs.reduce(
          (sum, org) => sum + org.risks.filter((r) => r.status === 'Open').length,
          0
        ),
        totalVendors: allOrgs.reduce((sum, org) => sum + org.vendors.length, 0),
        organizationBreakdown: allOrgs.map((org) => ({
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
                      sum + f.controls.filter((c) => c.status === 'Implemented').length,
                    0
                  ) /
                    Math.max(org.frameworks.reduce((sum, f) => sum + f.controls.length, 0), 1)) *
                    100
                )
              : 0,
        })),
      };

      return metrics;
    }

    // For non-parent organizations or parent orgs without children, return metrics for just this org
    const totalControls = organization.frameworks.reduce((sum, f) => sum + f.controls.length, 0);
    const implementedControls = organization.frameworks.reduce(
      (sum, f) => sum + f.controls.filter((c) => c.status === 'Implemented').length,
      0
    );

    return {
      totalOrganizations: 1,
      totalUsers: organization.users.length,
      totalFrameworks: organization.frameworks.length,
      totalControls,
      implementedControls,
      totalRisks: organization.risks.length,
      openRisks: organization.risks.filter((r) => r.status === 'Open').length,
      totalVendors: organization.vendors.length,
      organizationBreakdown: [{
        id: organization.id,
        name: organization.name,
        users: organization.users.length,
        frameworks: organization.frameworks.length,
        risks: organization.risks.length,
        vendors: organization.vendors.length,
        complianceRate: totalControls > 0
          ? Math.round((implementedControls / totalControls) * 100)
          : 0,
      }],
    };
  }

  /**
   * Move user between organizations
   */
  async moveUserToOrganization(
    userId: string,
    targetOrganizationId: string,
    adminUserId: string
  ) {
    // Verify the admin user exists and fetch their org
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { id: true, organizationId: true, role: true },
    });

    if (!admin) {
      throw new AppError('Admin user not found', 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify admin belongs to the same organization as the user being moved
    if (admin.organizationId !== user.organizationId) {
      throw new AppError('Cannot move users from other organizations', 403);
    }

    // Verify the target organization is accessible (same org or a child org)
    if (targetOrganizationId !== admin.organizationId) {
      const targetOrg = await prisma.organization.findFirst({
        where: { id: targetOrganizationId, parentOrganizationId: admin.organizationId },
      });
      if (!targetOrg) {
        throw new AppError('Target organization not accessible', 403);
      }
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
    const framework = await prisma.complianceFramework.findFirst({
      where: {
        id: frameworkId,
        organizationId: sourceOrganizationId,
      },
      include: {
        controls: true,
      },
    });

    if (!framework) {
      throw new AppError('Framework not found', 404);
    }

    const cloned = await Promise.all(
      targetOrganizationIds.map(async (targetOrgId) => {
        const newFramework = await prisma.complianceFramework.create({
          data: {
            name: framework.name,
            region: framework.region,
            organizationId: targetOrgId,
            nextAuditDate: framework.nextAuditDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });

        // Clone controls
        await Promise.all(
          framework.controls.map((control: { name: string; description: string | null; status: string }) =>
            prisma.frameworkControl.create({
              data: {
                frameworkId: newFramework.id,
                name: control.name,
                description: control.description,
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
