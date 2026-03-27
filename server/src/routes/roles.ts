/**
 * Custom Role Management Routes
 *
 * Endpoints for advanced RBAC: create custom roles with granular permissions,
 * assign roles to users, and manage role-permission mappings.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import { createRoleSchema, updateRoleSchema, addPermissionSchema, assignRoleSchema } from '../validators/roleSchemas';
import { AppError } from '../middleware/errorHandler';
import prisma from '../config/database';
import logger from '../config/logger';

const router = Router();
router.use(authenticate);

// ============================================================================
// HELPERS
// ============================================================================

function paginate(query: any): { skip: number; take: number; page: number; limit: number } {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

// ============================================================================
// LIST CUSTOM ROLES
// ============================================================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);

    try {
      const where = { organizationId: user.organizationId };

      const [roles, total] = await Promise.all([
        prisma.customRole.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            _count: { select: { permissions: true, userRoles: true } },
          },
        }),
        prisma.customRole.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: { roles, total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      logger.error('Error fetching custom roles:', error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to fetch custom roles', 500);
    }
  })
);

// ============================================================================
// GET ROLE WITH PERMISSIONS
// ============================================================================

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const role = await prisma.customRole.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
        include: {
          permissions: { orderBy: { resource: 'asc' } },
          _count: { select: { userRoles: true } },
        },
      });

      if (!role) {
        throw new AppError('Role not found', 404);
      }

      res.json({ status: 'success', data: role });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching custom role:', error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to fetch custom role', 500);
    }
  })
);

// ============================================================================
// CREATE CUSTOM ROLE (Admin only)
// ============================================================================

router.post(
  '/',
  authorize('admin'),
  validateBody(createRoleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const { name, description, permissions } = req.body;

      if (!name) {
        throw new AppError('name is required', 400);
      }

      // Check for duplicate name within the org
      const existing = await prisma.customRole.findFirst({
        where: { organizationId: user.organizationId, name },
      });

      if (existing) {
        throw new AppError(`Role with name "${name}" already exists in this organization`, 409);
      }

      const role = await prisma.customRole.create({
        data: {
          organizationId: user.organizationId,
          name,
          description: description || null,
          isSystem: false,
          // Create permissions if provided inline
          ...(permissions && Array.isArray(permissions) && permissions.length > 0
            ? {
                permissions: {
                  create: permissions.map((p: any) => ({
                    resource: p.resource,
                    action: p.action,
                    scope: p.scope || 'OWN',
                  })),
                },
              }
            : {}),
        },
        include: {
          permissions: true,
          _count: { select: { userRoles: true } },
        },
      });

      res.status(201).json({ status: 'success', data: role });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating custom role:', error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to create custom role', 500);
    }
  })
);

// ============================================================================
// UPDATE CUSTOM ROLE
// ============================================================================

router.patch(
  '/:id',
  authorize('admin'),
  validateBody(updateRoleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.customRole.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Role not found', 404);
      }

      if (existing.isSystem) {
        throw new AppError('System roles cannot be modified', 403);
      }

      const { name, description } = req.body;

      // If renaming, check for duplicates
      if (name && name !== existing.name) {
        const duplicate = await prisma.customRole.findFirst({
          where: { organizationId: user.organizationId, name, id: { not: req.params.id } },
        });
        if (duplicate) {
          throw new AppError(`Role with name "${name}" already exists in this organization`, 409);
        }
      }

      const role = await prisma.customRole.update({
        where: { id: req.params.id },
        data: {
          ...(name ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
        },
        include: {
          permissions: true,
          _count: { select: { userRoles: true } },
        },
      });

      res.json({ status: 'success', data: role });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating custom role:', error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to update custom role', 500);
    }
  })
);

// ============================================================================
// DELETE CUSTOM ROLE (prevent deleting system roles)
// ============================================================================

router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.customRole.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!existing) {
        throw new AppError('Role not found', 404);
      }

      if (existing.isSystem) {
        throw new AppError('System roles cannot be deleted', 403);
      }

      // Check if any users are assigned to this role
      const assignedCount = await prisma.userRole.count({
        where: { roleId: req.params.id },
      });

      if (assignedCount > 0) {
        throw new AppError(`Cannot delete role: ${assignedCount} user(s) are still assigned to this role. Remove all assignments first.`, 409);
      }

      // Delete permissions and role (cascade handles permissions via schema)
      await prisma.customRole.delete({
        where: { id: req.params.id },
      });

      res.json({ status: 'success', data: { message: 'Role deleted', id: req.params.id } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting custom role:', error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to delete custom role', 500);
    }
  })
);

// ============================================================================
// ADD PERMISSION TO ROLE
// ============================================================================

router.post(
  '/:id/permissions',
  authorize('admin'),
  validateBody(addPermissionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const role = await prisma.customRole.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!role) {
        throw new AppError('Role not found', 404);
      }

      if (role.isSystem) {
        throw new AppError('Cannot modify permissions on system roles', 403);
      }

      const { resource, action, scope } = req.body;

      if (!resource || !action) {
        throw new AppError('resource and action are required', 400);
      }

      const validActions = ['create', 'read', 'update', 'delete', 'approve', 'export'];
      if (!validActions.includes(action)) {
        throw new AppError(`action must be one of: ${validActions.join(', ')}`, 400);
      }

      const validScopes = ['OWN', 'TEAM', 'DEPARTMENT', 'ORG'];
      const permissionScope = scope || 'OWN';
      if (!validScopes.includes(permissionScope)) {
        throw new AppError(`scope must be one of: ${validScopes.join(', ')}`, 400);
      }

      // Check for duplicate permission
      const existing = await prisma.rolePermission.findFirst({
        where: { roleId: role.id, resource, action },
      });

      if (existing) {
        throw new AppError(`Permission "${action}" on "${resource}" already exists for this role`, 409);
      }

      const permission = await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          resource,
          action,
          scope: permissionScope as any,
        },
      });

      res.status(201).json({ status: 'success', data: permission });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error adding permission to role:', error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to add permission', 500);
    }
  })
);

// ============================================================================
// REMOVE PERMISSION FROM ROLE
// ============================================================================

router.delete(
  '/:id/permissions/:permId',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const role = await prisma.customRole.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!role) {
        throw new AppError('Role not found', 404);
      }

      if (role.isSystem) {
        throw new AppError('Cannot modify permissions on system roles', 403);
      }

      const permission = await prisma.rolePermission.findFirst({
        where: { id: req.params.permId, roleId: role.id },
      });

      if (!permission) {
        throw new AppError('Permission not found', 404);
      }

      await prisma.rolePermission.delete({
        where: { id: req.params.permId },
      });

      res.json({ status: 'success', data: { message: 'Permission removed', id: req.params.permId } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error removing permission from role:', error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to remove permission', 500);
    }
  })
);

// ============================================================================
// LIST USERS WITH A ROLE
// ============================================================================

router.get(
  '/:id/users',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;
    const { skip, take, page, limit } = paginate(req.query);

    try {
      const role = await prisma.customRole.findFirst({
        where: { id: req.params.id, organizationId: user.organizationId },
      });

      if (!role) {
        throw new AppError('Role not found', 404);
      }

      const where = { roleId: role.id };

      const [userRoles, total] = await Promise.all([
        prisma.userRole.findMany({
          where,
          skip,
          take,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                jobTitle: true,
                active: true,
              },
            },
          },
        }),
        prisma.userRole.count({ where }),
      ]);

      const users = userRoles.map((ur) => ({
        assignmentId: ur.id,
        ...ur.user,
      }));

      res.json({
        status: 'success',
        data: { users, total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching users for role:', error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to fetch users for role', 500);
    }
  })
);

// ============================================================================
// ASSIGN ROLE TO USER (Admin only)
// ============================================================================

router.post(
  '/assign',
  authorize('admin'),
  validateBody(assignRoleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const { userId, roleId } = req.body;

      if (!userId || !roleId) {
        throw new AppError('userId and roleId are required', 400);
      }

      // Verify the role belongs to the org
      const role = await prisma.customRole.findFirst({
        where: { id: roleId, organizationId: user.organizationId },
      });

      if (!role) {
        throw new AppError('Role not found in this organization', 404);
      }

      // Verify the user belongs to the org
      const targetUser = await prisma.user.findFirst({
        where: { id: userId, organizationId: user.organizationId },
      });

      if (!targetUser) {
        throw new AppError('User not found in this organization', 404);
      }

      // Check for duplicate assignment
      const existing = await prisma.userRole.findFirst({
        where: { userId, roleId },
      });

      if (existing) {
        throw new AppError('User is already assigned to this role', 409);
      }

      const assignment = await prisma.userRole.create({
        data: { userId, roleId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          role: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({ status: 'success', data: assignment });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error assigning role to user:', error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to assign role', 500);
    }
  })
);

// ============================================================================
// REMOVE ROLE FROM USER
// ============================================================================

router.delete(
  '/assign/:userId/:roleId',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthRequest).user!;

    try {
      const { userId, roleId } = req.params;

      // Verify the role belongs to the org
      const role = await prisma.customRole.findFirst({
        where: { id: roleId, organizationId: user.organizationId },
      });

      if (!role) {
        throw new AppError('Role not found in this organization', 404);
      }

      const assignment = await prisma.userRole.findFirst({
        where: { userId, roleId },
      });

      if (!assignment) {
        throw new AppError('Role assignment not found', 404);
      }

      await prisma.userRole.delete({
        where: { id: assignment.id },
      });

      res.json({ status: 'success', data: { message: 'Role assignment removed', userId, roleId } });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error removing role from user:', error);
      throw new AppError(error instanceof Error ? error.message : 'Failed to remove role assignment', 500);
    }
  })
);

export default router;
