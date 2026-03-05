/**
 * Billing Routes
 *
 * Production-level routes for the 4-tier subscription system.
 */

import { Router } from 'express';
import billingController from '../controllers/billingController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import { checkoutSchema, changeTierSchema, cancelSubscriptionSchema, addAddonSchema, requestQuoteSchema } from '../validators/billingSchemas';

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
router.post('/checkout', authorize('admin'), validateBody(checkoutSchema), asyncHandler(billingController.createCheckout.bind(billingController)));

// Create Stripe billing portal session
router.post('/portal', authorize('admin'), asyncHandler(billingController.createPortalSession.bind(billingController)));

// ============================================================================
// TIER CHANGES (Admin only)
// ============================================================================

// Preview tier change (upgrade/downgrade)
router.post('/preview-change', authorize('admin'), asyncHandler(billingController.previewTierChange.bind(billingController)));

// Change tier (upgrade/downgrade)
router.post('/change-tier', authorize('admin'), validateBody(changeTierSchema), asyncHandler(billingController.changeTier.bind(billingController)));

// Cancel subscription
router.post('/cancel', authorize('admin'), validateBody(cancelSubscriptionSchema), asyncHandler(billingController.cancelSubscription.bind(billingController)));

// Reactivate subscription
router.post('/reactivate', authorize('admin'), asyncHandler(billingController.reactivateSubscription.bind(billingController)));

// Process refund
router.post('/refund', authorize('admin'), asyncHandler(billingController.processRefund.bind(billingController)));

// ============================================================================
// ADD-ONS (Admin only)
// ============================================================================

// Add an add-on
router.post('/addons', authorize('admin'), validateBody(addAddonSchema), asyncHandler(billingController.addAddOn.bind(billingController)));

// Remove an add-on
router.delete('/addons/:addOnId', authorize('admin'), asyncHandler(billingController.removeAddOn.bind(billingController)));

// ============================================================================
// CUSTOM QUOTES (Visionary tier)
// ============================================================================

// Request custom quote
router.post('/quote', authorize('admin'), validateBody(requestQuoteSchema), asyncHandler(billingController.requestQuote.bind(billingController)));

// ============================================================================
// FEATURE SUBSCRIPTIONS (A-La-Carte)
// ============================================================================

// Get all available features for organization's tier
router.get('/features', asyncHandler(billingController.getAvailableFeatures.bind(billingController)));

// Get active feature subscriptions
router.get('/features/subscriptions', asyncHandler(billingController.getFeatureSubscriptions.bind(billingController)));

// Subscribe to a feature
router.post('/features/:featureId/subscribe', authorize('admin'), asyncHandler(billingController.subscribeToFeature.bind(billingController)));

// Unsubscribe from a feature
router.delete('/features/:featureId/unsubscribe', authorize('admin'), asyncHandler(billingController.unsubscribeFromFeature.bind(billingController)));

// Check feature access
router.get('/features/:featureId/access', asyncHandler(billingController.checkFeatureAccess.bind(billingController)));

// ============================================================================
// FEATURE BUNDLES
// ============================================================================

// Get available feature bundles
router.get('/bundles', asyncHandler(billingController.getAvailableBundles.bind(billingController)));

// Subscribe to a feature bundle
router.post('/bundles/:bundleId/subscribe', authorize('admin'), asyncHandler(billingController.subscribeToBundle.bind(billingController)));

export default router;
