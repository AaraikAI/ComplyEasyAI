/**
 * Billing Routes
 *
 * Production-level routes for the 4-tier subscription system.
 */

import { Router, Request, Response } from 'express';
import billingController from '../controllers/billingController';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import { validateBody } from '../middleware/validate';
import { checkoutSchema, changeTierSchema, cancelSubscriptionSchema, addAddonSchema, requestQuoteSchema } from '../validators/billingSchemas';
import tierService from '../services/tierService';
import { TierName, TIER_ORDER, TIERS, FEATURE_DISPLAY_NAMES, LIMIT_DISPLAY_NAMES } from '../config/tiers';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

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

// Compare current tier with a target tier
router.get('/compare/:targetTier', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { targetTier } = req.params;
    const organizationId = authReq.user!.organizationId;

    // Validate target tier
    if (!TIER_ORDER.includes(targetTier as TierName)) {
      throw new AppError(`Invalid tier: ${targetTier}. Valid tiers: ${TIER_ORDER.join(', ')}`, 400);
    }

    const currentTierName = await tierService.getOrganizationTier(organizationId);
    const target = targetTier as TierName;
    const currentTierConfig = TIERS[currentTierName];
    const targetTierConfig = TIERS[target];

    // Build feature comparison
    const featureChanges: Array<{ feature: string; displayName: string; current: boolean; target: boolean; change: 'added' | 'removed' | 'unchanged' }> = [];
    for (const key of Object.keys(currentTierConfig.features) as Array<keyof typeof currentTierConfig.features>) {
      const currentVal = currentTierConfig.features[key];
      const targetVal = targetTierConfig.features[key];
      if (currentVal !== targetVal) {
        featureChanges.push({
          feature: key,
          displayName: FEATURE_DISPLAY_NAMES[key] || key,
          current: currentVal,
          target: targetVal,
          change: targetVal ? 'added' : 'removed',
        });
      }
    }

    // Build limit comparison
    const limitChanges: Array<{ limit: string; displayName: string; current: number; target: number; currentDisplay: string; targetDisplay: string }> = [];
    for (const key of Object.keys(currentTierConfig.limits) as Array<keyof typeof currentTierConfig.limits>) {
      const currentVal = currentTierConfig.limits[key];
      const targetVal = targetTierConfig.limits[key];
      if (currentVal !== targetVal) {
        limitChanges.push({
          limit: key,
          displayName: LIMIT_DISPLAY_NAMES[key] || key,
          current: currentVal,
          target: targetVal,
          currentDisplay: currentVal === -1 ? 'Unlimited' : String(currentVal),
          targetDisplay: targetVal === -1 ? 'Unlimited' : String(targetVal),
        });
      }
    }

    // Use tierService comparison for additional context
    const comparison = tierService.compareTiers(currentTierName, target);

    res.json({
      currentTier: {
        name: currentTierName,
        displayName: currentTierConfig.displayName,
        tagline: currentTierConfig.tagline,
        pricing: currentTierConfig.pricing,
      },
      targetTier: {
        name: target,
        displayName: targetTierConfig.displayName,
        tagline: targetTierConfig.tagline,
        pricing: targetTierConfig.pricing,
      },
      direction: TIER_ORDER.indexOf(target) > TIER_ORDER.indexOf(currentTierName) ? 'upgrade' : 'downgrade',
      featureChanges,
      limitChanges,
      comparison,
      targetHighlights: targetTierConfig.highlights,
    });
  } catch (error) {
    logger.error('Compare tiers error', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to compare tiers', 500);
  }
}));

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
