/**
 * Demo Request Routes
 *
 * Handles demo booking requests for lead capture.
 * Public endpoint for form submission, admin endpoints for management.
 */

import { Router } from 'express';
import { demoController } from '../controllers/demoController';
import { authenticate, authorize } from '../middleware/auth';
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
// ADMIN ROUTES (Authentication required)
// ============================================================================

/**
 * @route   GET /api/demo/requests
 * @desc    Get all demo requests with filtering and pagination
 * @access  Admin only
 */
router.get(
  '/requests',
  authenticate,
  authorize('admin'),
  authAsyncHandler(demoController.getAllDemoRequests.bind(demoController) as any)
);

/**
 * @route   GET /api/demo/requests/stats
 * @desc    Get demo request statistics
 * @access  Admin only
 */
router.get(
  '/requests/stats',
  authenticate,
  authorize('admin'),
  authAsyncHandler(demoController.getDemoStats.bind(demoController) as any)
);

/**
 * @route   GET /api/demo/stats
 * @desc    Alias for /requests/stats — frontend uses this shorter path
 * @access  Admin only
 */
router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  authAsyncHandler(demoController.getDemoStats.bind(demoController) as any)
);

/**
 * @route   GET /api/demo/requests/:id
 * @desc    Get a single demo request
 * @access  Admin only
 */
router.get(
  '/requests/:id',
  authenticate,
  authorize('admin'),
  authAsyncHandler(demoController.getDemoRequest.bind(demoController) as any)
);

/**
 * @route   PATCH /api/demo/requests/:id
 * @desc    Update a demo request (partial update)
 * @access  Admin only
 */
router.patch(
  '/requests/:id',
  authenticate,
  authorize('admin'),
  validateBody(updateDemoRequestSchema),
  authAsyncHandler(demoController.updateDemoRequest.bind(demoController) as any)
);

/**
 * @route   PUT /api/demo/requests/:id
 * @desc    Update a demo request (backwards-compatible full replacement)
 * @access  Admin only
 */
router.put(
  '/requests/:id',
  authenticate,
  authorize('admin'),
  validateBody(updateDemoRequestSchema),
  authAsyncHandler(demoController.updateDemoRequest.bind(demoController) as any)
);

/**
 * @route   POST /api/demo/requests/:id/schedule
 * @desc    Schedule a demo
 * @access  Admin only
 */
router.post(
  '/requests/:id/schedule',
  authenticate,
  authorize('admin'),
  validateBody(scheduleDemoSchema),
  authAsyncHandler(demoController.scheduleDemo.bind(demoController) as any)
);

/**
 * @route   POST /api/demo/requests/:id/convert
 * @desc    Mark demo as converted
 * @access  Admin only
 */
router.post(
  '/requests/:id/convert',
  authenticate,
  authorize('admin'),
  validateBody(convertDemoSchema),
  authAsyncHandler(demoController.markAsConverted.bind(demoController) as any)
);

/**
 * @route   DELETE /api/demo/requests/:id
 * @desc    Delete a demo request
 * @access  Admin only
 */
router.delete(
  '/requests/:id',
  authenticate,
  authorize('admin'),
  authAsyncHandler(demoController.deleteDemoRequest.bind(demoController) as any)
);

export default router;
