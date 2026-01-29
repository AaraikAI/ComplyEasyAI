/**
 * Onboarding Routes
 *
 * Handles onboarding progress tracking, checklist management,
 * event analytics, and preference updates.
 */

import { Router } from 'express';
import { onboardingController } from '../controllers/onboardingController';
import { authenticate, authorize } from '../middleware/auth';
import { authAsyncHandler } from '../types/express';

const router = Router();

// All onboarding routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/onboarding/progress
 * @desc    Get current user's onboarding progress + checklist
 * @access  Authenticated
 */
router.get(
  '/progress',
  authAsyncHandler(onboardingController.getProgress.bind(onboardingController) as any)
);

/**
 * @route   PUT /api/onboarding/progress
 * @desc    Update onboarding progress (flow, step, milestones)
 * @access  Authenticated
 */
router.put(
  '/progress',
  authAsyncHandler(onboardingController.updateProgress.bind(onboardingController) as any)
);

/**
 * @route   POST /api/onboarding/event
 * @desc    Track an onboarding analytics event
 * @access  Authenticated
 */
router.post(
  '/event',
  authAsyncHandler(onboardingController.trackEvent.bind(onboardingController) as any)
);

/**
 * @route   POST /api/onboarding/complete-milestone
 * @desc    Mark a specific milestone as complete
 * @access  Authenticated
 */
router.post(
  '/complete-milestone',
  authAsyncHandler(onboardingController.completeMilestone.bind(onboardingController) as any)
);

/**
 * @route   PUT /api/onboarding/preferences
 * @desc    Update onboarding preferences (showHints, reducedMotion)
 * @access  Authenticated
 */
router.put(
  '/preferences',
  authAsyncHandler(onboardingController.updatePreferences.bind(onboardingController) as any)
);

/**
 * @route   POST /api/onboarding/skip-flow
 * @desc    Skip a specific flow
 * @access  Authenticated
 */
router.post(
  '/skip-flow',
  authAsyncHandler(onboardingController.skipFlow.bind(onboardingController) as any)
);

/**
 * @route   POST /api/onboarding/reset
 * @desc    Reset onboarding progress (admin only)
 * @access  Admin
 */
router.post(
  '/reset',
  authorize('admin'),
  authAsyncHandler(onboardingController.resetProgress.bind(onboardingController) as any)
);

/**
 * @route   GET /api/onboarding/checklist
 * @desc    Get organization's setup checklist
 * @access  Authenticated
 */
router.get(
  '/checklist',
  authAsyncHandler(onboardingController.getChecklist.bind(onboardingController) as any)
);

/**
 * @route   PUT /api/onboarding/checklist
 * @desc    Update checklist item
 * @access  Authenticated
 */
router.put(
  '/checklist',
  authAsyncHandler(onboardingController.updateChecklist.bind(onboardingController) as any)
);

export default router;
