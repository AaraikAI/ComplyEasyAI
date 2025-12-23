import { Router } from 'express';
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
  asyncHandler(async (req: AuthRequest, res) => {
    const organizationId = req.user!.organizationId;

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
  asyncHandler(async (req: AuthRequest, res) => {
    const { email, name, role } = req.body;
    const organizationId = req.user!.organizationId;

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

    // TODO: Send invitation email
    // await emailService.sendInvitationEmail(email, name, token);

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
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const organizationId = req.user!.organizationId;

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
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

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
    if (user.id === req.user!.id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    await prisma.user.delete({
      where: { id },
    });

    logger.info(`Team member removed: ${id} from organization ${organizationId}`);

    res.json({ message: 'Team member removed successfully' });
  })
);

export default router;

