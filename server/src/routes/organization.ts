import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import organizationController from '../controllers/organizationController';
import { asyncHandler } from '../types/express';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate); // All routes require authentication

// Get organization details
router.get('/', apiLimiter, asyncHandler(organizationController.get.bind(organizationController)));

// Update organization (admin only)
router.patch('/', apiLimiter, authorize('admin'), asyncHandler(organizationController.update.bind(organizationController)));

export default router;

