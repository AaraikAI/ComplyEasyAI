/**
 * Billing Routes
 *
 * Production-level routes for the 4-tier subscription system.
 */

import { Router } from 'express';
import billingController from '../controllers/billingController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';

const router = Router();

// Public webhook endpoint (Stripe)
router.post('/webhook', asyncHandler(billingController.webhook.bind(billingController)));

// Protected routes
router.use(authenticate);

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

// Get current subscription details
router.get('/subscription', asyncHandler(billingController.getSubscription.bind(billingController)));

// Get available tiers with comparison
router.get('/tiers', asyncHandler(billingController.getAvailableTiers.bind(billingController)));

// Get usage metrics
router.get('/usage', asyncHandler(billingController.getUsageMetrics.bind(billingController)));

// Get subscription history
router.get('/history', asyncHandler(billingController.getSubscriptionHistory.bind(billingController)));

// ============================================================================
// CHECKOUT & BILLING PORTAL (Admin only)
// ============================================================================

// Create checkout session for new subscription or upgrade
router.post('/checkout', authorize('admin'), asyncHandler(billingController.createCheckout.bind(billingController)));

// Create Stripe billing portal session
router.post('/portal', authorize('admin'), asyncHandler(billingController.createPortalSession.bind(billingController)));

// ============================================================================
// TIER CHANGES (Admin only)
// ============================================================================

// Preview tier change (upgrade/downgrade)
router.post('/preview-change', authorize('admin'), asyncHandler(billingController.previewTierChange.bind(billingController)));

// Change tier (upgrade/downgrade)
router.post('/change-tier', authorize('admin'), asyncHandler(billingController.changeTier.bind(billingController)));

// Cancel subscription
router.post('/cancel', authorize('admin'), asyncHandler(billingController.cancelSubscription.bind(billingController)));

// Reactivate subscription
router.post('/reactivate', authorize('admin'), asyncHandler(billingController.reactivateSubscription.bind(billingController)));

// ============================================================================
// ADD-ONS (Admin only)
// ============================================================================

// Add an add-on
router.post('/addons', authorize('admin'), asyncHandler(billingController.addAddOn.bind(billingController)));

// Remove an add-on
router.delete('/addons/:addOnId', authorize('admin'), asyncHandler(billingController.removeAddOn.bind(billingController)));

// ============================================================================
// CUSTOM QUOTES (Visionary tier)
// ============================================================================

// Request custom quote
router.post('/quote', authorize('admin'), asyncHandler(billingController.requestQuote.bind(billingController)));

export default router;
