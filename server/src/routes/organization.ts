import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import organizationController from '../controllers/organizationController';
import { asyncHandler } from '../types/express';
import { apiLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validate';
import { updateOrganizationSchema } from '../validators/organizationSchemas';

const router = Router();

router.use(authenticate); // All routes require authentication

// Get organization details
router.get('/', apiLimiter, asyncHandler(organizationController.get.bind(organizationController)));

// Update organization (admin only)
router.patch('/', apiLimiter, authorize('admin'), validateBody(updateOrganizationSchema), asyncHandler(organizationController.update.bind(organizationController)));

export default router;

