import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { asyncHandler } from '../types/express';
import logger from '../config/logger';

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
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { email, name, role } = authReq.body;
    const organizationId = authReq.user!.organizationId;

    if (!email || !name) {
      res.status(400).json({ error: 'Email and name are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    // Create new user
    const newUser = await prisma.user.create({
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
    });

    // Generate magic link for the new user
    const { v4: uuidv4 } = await import('uuid');
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.magicLink.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

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

    logger.info(`Team member invited: ${email} to organization ${organizationId}`);

    res.status(201).json(newUser);
  })
);

/**
 * PATCH /api/team/:id
 * Update team member role
 */
router.patch(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { id } = authReq.params;
    const { role } = authReq.body;
    const organizationId = authReq.user!.organizationId;

    if (!role || !['admin', 'editor', 'viewer'].includes(role)) {
      res.status(400).json({ error: 'Valid role is required' });
      return;
    }

    // Verify user belongs to same organization
    const user = await prisma.user.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
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
        res.status(400).json({ error: 'Cannot change role: This is the only admin user. Please assign another admin before changing this role.' });
        return;
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
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent deleting yourself
    if (user.id === (req as AuthRequest).user!.id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
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

