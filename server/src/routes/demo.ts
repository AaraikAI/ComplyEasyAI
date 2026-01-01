/**
 * Demo Request Routes
 *
 * Handles demo booking requests for lead capture.
 * Public endpoint for form submission, admin endpoints for management.
 */

import { Router } from 'express';
import { demoController } from '../controllers/demoController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * @route   POST /api/demo/request
 * @desc    Submit a demo request (public)
 * @access  Public
 */
router.post('/request', demoController.submitDemoRequest.bind(demoController));

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
  requireAdmin,
  demoController.getAllDemoRequests.bind(demoController)
);

/**
 * @route   GET /api/demo/requests/stats
 * @desc    Get demo request statistics
 * @access  Admin only
 */
router.get(
  '/requests/stats',
  authenticate,
  requireAdmin,
  demoController.getDemoStats.bind(demoController)
);

/**
 * @route   GET /api/demo/requests/:id
 * @desc    Get a single demo request
 * @access  Admin only
 */
router.get(
  '/requests/:id',
  authenticate,
  requireAdmin,
  demoController.getDemoRequest.bind(demoController)
);

/**
 * @route   PUT /api/demo/requests/:id
 * @desc    Update a demo request
 * @access  Admin only
 */
router.put(
  '/requests/:id',
  authenticate,
  requireAdmin,
  demoController.updateDemoRequest.bind(demoController)
);

/**
 * @route   POST /api/demo/requests/:id/schedule
 * @desc    Schedule a demo
 * @access  Admin only
 */
router.post(
  '/requests/:id/schedule',
  authenticate,
  requireAdmin,
  demoController.scheduleDemo.bind(demoController)
);

/**
 * @route   POST /api/demo/requests/:id/convert
 * @desc    Mark demo as converted
 * @access  Admin only
 */
router.post(
  '/requests/:id/convert',
  authenticate,
  requireAdmin,
  demoController.markAsConverted.bind(demoController)
);

/**
 * @route   DELETE /api/demo/requests/:id
 * @desc    Delete a demo request
 * @access  Admin only
 */
router.delete(
  '/requests/:id',
  authenticate,
  requireAdmin,
  demoController.deleteDemoRequest.bind(demoController)
);

export default router;
