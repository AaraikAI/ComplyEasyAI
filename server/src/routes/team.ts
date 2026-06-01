import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { enforceLimit } from '../middleware/tierMiddleware';
import prisma from '../config/database';
import { asyncHandler } from '../types/express';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { validateBody } from '../middleware/validate';
import { inviteSchema, bulkInviteSchema, updateMemberSchema } from '../validators/teamSchemas';
import tierService from '../services/tierService';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/team
 * List all team members in the organization
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user!.organizationId;

    const users = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  })
);

/**
 * POST /api/team/invite
 * Invite a new team member
 */
router.post(
  '/invite',
  authorize('admin', 'editor'),
  enforceLimit('maxUsers'),
  validateBody(inviteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { email, name, role } = authReq.body;
    const organizationId = authReq.user!.organizationId;

    if (!email || !name) {
      throw new AppError('Email and name are required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Invalid email format', 400);
    }

    // Validate role
    if (role && !['admin', 'editor', 'viewer'].includes(role)) {
      throw new AppError('Invalid role. Must be admin, editor, or viewer', 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Generate magic link token for the new user
    const { v4: uuidv4 } = await import('uuid');
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create the user and its invite token atomically so an invited user can
    // never be left behind without a working magic link.
    const [newUser] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email,
          name,
          role: role || 'viewer',
          organizationId,
          avatar: name.substring(0, 2).toUpperCase(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          lastLogin: true,
          createdAt: true,
        },
      }),
      prisma.magicLink.create({
        data: {
          email,
          token,
          expiresAt,
        },
      }),
    ]);

    // Send invitation email (magic link)
    try {
      const emailService = (await import('../services/emailService')).default;
      await emailService.sendMagicLink(email, token);
    } catch (emailError) {
      logger.warn('Failed to send invitation email, but user was created', emailError);
    }

    // Log audit
    const { randomBytes } = await import('crypto');
    await prisma.auditLog.create({
      data: {
        action: `Team member invited: ${name} (${email}) with role ${role || 'viewer'}`,
        userId: (req as AuthRequest).user!.id,
        organizationId,
        hash: randomBytes(16).toString('hex'),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(`Team member invited: user ${newUser.id} to organization ${organizationId}`);

    res.status(201).json(newUser);
  })
);

/**
 * POST /api/team/bulk-invite
 * Bulk invite team members from CSV data
 */
router.post(
  '/bulk-invite',
  authorize('admin', 'editor'),
  validateBody(bulkInviteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { invitations } = req.body; // Array of { email, name, role }
    const invites = invitations; // Alias for backward compat within handler
    const organizationId = authReq.user!.organizationId;

    if (!Array.isArray(invites) || invites.length === 0) {
      throw new AppError('Invitations array is required and must not be empty', 400);
    }

    if (invites.length > 100) {
      throw new AppError('Maximum 100 invitations per batch', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validRoles = ['admin', 'editor', 'viewer'];
    const { v4: uuidv4 } = await import('uuid');
    const { randomBytes } = await import('crypto');
    const emailService = (await import('../services/emailService')).default;

    const results = {
      successful: [] as any[],
      failed: [] as Array<{ email: string; name: string; error: string }>,
    };

    // Validate all invites before processing
    const validationErrors: Array<{ email: string; name: string; error: string }> = [];
    
    for (const invite of invites) {
      if (!invite.email || !invite.name) {
        validationErrors.push({
          email: invite.email || 'N/A',
          name: invite.name || 'N/A',
          error: 'Email and name are required',
        });
        continue;
      }

      if (!emailRegex.test(invite.email)) {
        validationErrors.push({
          email: invite.email,
          name: invite.name,
          error: 'Invalid email format',
        });
        continue;
      }

      if (invite.role && !validRoles.includes(invite.role)) {
        validationErrors.push({
          email: invite.email,
          name: invite.name,
          error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        });
        continue;
      }
    }

    // If validation errors exist, return them without processing
    if (validationErrors.length > 0) {
      throw new AppError('Validation failed: please fix validation errors before sending invites', 400);
    }

    // Enforce the maxUsers tier quota for the whole batch (the single-invite
    // route applies enforceLimit('maxUsers'); bulk must check the projected total
    // so it cannot bypass the quota by inviting many users at once).
    const requestedEmails = Array.from(
      new Set(invites.map((inv: { email: string }) => inv.email))
    );
    const alreadyPresent = await prisma.user.findMany({
      where: { email: { in: requestedEmails } },
      select: { email: true },
    });
    const presentEmails = new Set(alreadyPresent.map((u: { email: string }) => u.email));
    const netNewCount = requestedEmails.filter((e) => !presentEmails.has(e)).length;

    if (netNewCount > 0) {
      const currentUserCount = await prisma.user.count({ where: { organizationId } });
      // Pass the projected post-invite total minus one: checkLimit allows when
      // current < limit, so projectedTotal - 1 < limit ⇒ projectedTotal <= limit.
      const projectedTotal = currentUserCount + netNewCount;
      const limitCheck = await tierService.checkLimit(organizationId, 'maxUsers', projectedTotal - 1);
      if (!limitCheck.allowed) {
        logger.info(
          `Bulk invite blocked: maxUsers limit for org ${organizationId} (current ${currentUserCount}, +${netNewCount} new, limit ${limitCheck.limit})`
        );
        res.status(429).json({
          error: 'Limit exceeded',
          message:
            limitCheck.upgradeMessage ||
            `This invite would exceed your ${limitCheck.displayName || 'user'} limit`,
          code: 'TIER_LIMIT_EXCEEDED',
          limitType: limitCheck.limitType,
          current: currentUserCount,
          limit: limitCheck.limit,
          requested: netNewCount,
          upgradeUrl: '/settings?tab=billing',
        });
        return;
      }
    }

    // Process invites
    for (const [i, invite] of invites.entries()) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: invite.email },
        });

        if (existingUser) {
          results.failed.push({
            email: invite.email,
            name: invite.name,
            error: 'User with this email already exists',
          });
          continue;
        }

        // Generate magic link token
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Create the user and its invite token atomically so a bulk-invited user
        // can never be left behind without a working magic link.
        const [newUser] = await prisma.$transaction([
          prisma.user.create({
            data: {
              email: invite.email,
              name: invite.name,
              role: invite.role || 'viewer',
              organizationId,
              avatar: invite.name.substring(0, 2).toUpperCase(),
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
              lastLogin: true,
              createdAt: true,
            },
          }),
          prisma.magicLink.create({
            data: {
              email: invite.email,
              token,
              expiresAt,
            },
          }),
        ]);

        // Send invitation email
        try {
          await emailService.sendMagicLink(invite.email, token);
        } catch (emailError) {
          logger.warn(`Failed to send invitation email for user ${newUser.id}`, emailError);
        }

        results.successful.push(newUser);

        // Log audit for each successful invite
        await prisma.auditLog.create({
          data: {
            action: `Team member bulk invited: ${invite.name} (${invite.email}) with role ${invite.role || 'viewer'}`,
            userId: (req as AuthRequest).user!.id,
            organizationId,
            hash: randomBytes(16).toString('hex'),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        });
      } catch (error: any) {
        logger.error(`Failed to invite at index ${i}`, error);
        results.failed.push({
          email: invite.email,
          name: invite.name,
          error: error.message || 'Unknown error',
        });
      }
    }

    // Log bulk invite summary
    await prisma.auditLog.create({
      data: {
        action: `Bulk invite completed: ${results.successful.length} successful, ${results.failed.length} failed`,
        userId: (req as AuthRequest).user!.id,
        organizationId,
        hash: randomBytes(16).toString('hex'),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(`Bulk invite completed: ${results.successful.length} successful, ${results.failed.length} failed`);

    res.status(201).json({
      successful: results.successful,
      failed: results.failed,
      summary: {
        total: invites.length,
        successful: results.successful.length,
        failed: results.failed.length,
      },
    });
  })
);

/**
 * PATCH /api/team/:id
 * Update team member role
 */
router.patch(
  '/:id',
  authorize('admin'),
  validateBody(updateMemberSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { id } = authReq.params;
    const { role } = authReq.body;
    const organizationId = authReq.user!.organizationId;

    if (!role || !['admin', 'editor', 'viewer'].includes(role)) {
      throw new AppError('Valid role is required', 400);
    }

    // Verify user belongs to same organization
    const user = await prisma.user.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent changing role if this is the only admin
    if (user.role === 'admin' && role !== 'admin') {
      // Count admins in the organization
      const adminCount = await prisma.user.count({
        where: {
          organizationId,
          role: 'admin',
        },
      });

      if (adminCount === 1) {
        throw new AppError('Cannot change role: This is the only admin user. Please assign another admin before changing this role.', 400);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: `Team member role updated: ${user.name} (${user.email}) to ${role}`,
        userId: (req as AuthRequest).user!.id,
        organizationId,
        hash: require('crypto').randomBytes(16).toString('hex'),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(`Team member role updated: ${id} to ${role}`);

    res.json(updatedUser);
  })
);

/**
 * DELETE /api/team/:id
 * Remove team member
 */
router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { id } = authReq.params;
    const organizationId = authReq.user!.organizationId;

    // Verify user belongs to same organization
    const user = await prisma.user.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent deleting yourself
    if (user.id === (req as AuthRequest).user!.id) {
      throw new AppError('Cannot delete your own account', 400);
    }

    await prisma.user.delete({
      where: { id },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: `Team member removed: ${user.name} (${user.email})`,
        userId: (req as AuthRequest).user!.id,
        organizationId,
        hash: require('crypto').randomBytes(16).toString('hex'),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(`Team member removed: ${id} from organization ${organizationId}`);

    res.json({ message: 'Team member removed successfully' });
  })
);

export default router;

