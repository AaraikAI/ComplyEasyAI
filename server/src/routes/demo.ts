/**
 * Demo Request Routes
 *
 * Handles demo booking requests for lead capture.
 * Public endpoint for form submission, admin endpoints for management.
 */

import { Router } from 'express';
import { demoController } from '../controllers/demoController';
import { authenticate } from '../middleware/auth';
import { requirePlatformAdmin } from '../middleware/requirePlatformAdmin';
import { asyncHandler, authAsyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import {
  submitDemoRequestSchema,
  updateDemoRequestSchema,
  scheduleDemoSchema,
  convertDemoSchema,
} from '../validators/demoSchemas';

const router = Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * @route   POST /api/demo/request
 * @desc    Submit a demo request (public)
 * @access  Public
 */
router.post('/request', validateBody(submitDemoRequestSchema), asyncHandler(demoController.submitDemoRequest.bind(demoController)));

// ============================================================================
// PLATFORM OPERATOR ROUTES (cross-tenant lead data — not org-scoped)
// ============================================================================

/**
 * @route   GET /api/demo/requests
 * @desc    Get all demo requests with filtering and pagination
 * @access  Platform operators only
 */
router.get(
  '/requests',
  authenticate,
  requirePlatformAdmin,
  authAsyncHandler(demoController.getAllDemoRequests.bind(demoController) as any)
);

/**
 * @route   GET /api/demo/requests/stats
 * @desc    Get demo request statistics
 * @access  Platform operators only
 */
router.get(
  '/requests/stats',
  authenticate,
  requirePlatformAdmin,
  authAsyncHandler(demoController.getDemoStats.bind(demoController) as any)
);

/**
 * @route   GET /api/demo/stats
 * @desc    Alias for /requests/stats — frontend uses this shorter path
 * @access  Platform operators only
 */
router.get(
  '/stats',
  authenticate,
  requirePlatformAdmin,
  authAsyncHandler(demoController.getDemoStats.bind(demoController) as any)
);

/**
 * @route   GET /api/demo/requests/:id
 * @desc    Get a single demo request
 * @access  Platform operators only
 */
router.get(
  '/requests/:id',
  authenticate,
  requirePlatformAdmin,
  authAsyncHandler(demoController.getDemoRequest.bind(demoController) as any)
);

/**
 * @route   PATCH /api/demo/requests/:id
 * @desc    Update a demo request (partial update)
 * @access  Platform operators only
 */
router.patch(
  '/requests/:id',
  authenticate,
  requirePlatformAdmin,
  validateBody(updateDemoRequestSchema),
  authAsyncHandler(demoController.updateDemoRequest.bind(demoController) as any)
);

/**
 * @route   PUT /api/demo/requests/:id
 * @desc    Update a demo request (backwards-compatible full replacement)
 * @access  Platform operators only
 */
router.put(
  '/requests/:id',
  authenticate,
  requirePlatformAdmin,
  validateBody(updateDemoRequestSchema),
  authAsyncHandler(demoController.updateDemoRequest.bind(demoController) as any)
);

/**
 * @route   POST /api/demo/requests/:id/schedule
 * @desc    Schedule a demo
 * @access  Platform operators only
 */
router.post(
  '/requests/:id/schedule',
  authenticate,
  requirePlatformAdmin,
  validateBody(scheduleDemoSchema),
  authAsyncHandler(demoController.scheduleDemo.bind(demoController) as any)
);

/**
 * @route   POST /api/demo/requests/:id/convert
 * @desc    Mark demo as converted
 * @access  Platform operators only
 */
router.post(
  '/requests/:id/convert',
  authenticate,
  requirePlatformAdmin,
  validateBody(convertDemoSchema),
  authAsyncHandler(demoController.markAsConverted.bind(demoController) as any)
);

/**
 * @route   DELETE /api/demo/requests/:id
 * @desc    Delete a demo request
 * @access  Platform operators only
 */
router.delete(
  '/requests/:id',
  authenticate,
  requirePlatformAdmin,
  authAsyncHandler(demoController.deleteDemoRequest.bind(demoController) as any)
);

export default router;
