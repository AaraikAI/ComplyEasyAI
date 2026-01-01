/**
 * Billing Controller
 *
 * Production-level billing controller for the 4-tier subscription system.
 * Handles:
 * - Checkout session creation
 * - Portal session management
 * - Subscription details
 * - Tier upgrades/downgrades
 * - Add-on management
 * - Usage metrics
 * - Stripe webhooks
 */

import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import stripeService from '../services/stripeService';
import tierService from '../services/tierService';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import config from '../config';
import {
  TierName,
  TIERS,
  TIER_ORDER,
  getTier,
  getTierIndex,
  tierAddOns,
  getAvailableAddOns,
} from '../config/tiers';

class BillingController {
  /**
   * Create a checkout session for a new subscription or upgrade
   */
  createCheckout: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { tier, billingCycle = 'annual', addOns = [], couponCode } = req.body;
      const organizationId = authReq.user!.organizationId;

      // Validate tier
      if (!TIER_ORDER.includes(tier as TierName)) {
        throw new AppError(`Invalid tier: ${tier}. Valid tiers: ${TIER_ORDER.join(', ')}`, 400);
      }

      // Validate billing cycle
      if (!['monthly', 'annual'].includes(billingCycle)) {
        throw new AppError('Invalid billing cycle. Use "monthly" or "annual"', 400);
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: { users: { where: { id: authReq.user!.id }, take: 1 } },
      });

      if (!organization) {
        throw new AppError('Organization not found', 404);
      }

      // Check Stripe configuration
      if (!config.stripe.secretKey) {
        throw new AppError('Stripe is not configured. Please contact support to upgrade your plan.', 503);
      }

      // Validate add-ons are available for the tier
      const availableAddOns = getAvailableAddOns(tier as TierName);
      const availableAddOnIds = availableAddOns.map(a => a.id);
      const invalidAddOns = addOns.filter((id: string) => !availableAddOnIds.includes(id));

      if (invalidAddOns.length > 0) {
        throw new AppError(`Add-ons not available for ${tier} tier: ${invalidAddOns.join(', ')}`, 400);
      }

      const checkoutUrl = await stripeService.createCheckoutSession({
        tierName: tier as TierName,
        billingCycle,
        customerId: organization.stripeCustomerId ?? undefined,
        customerEmail: authReq.user!.email,
        organizationId,
        successUrl: `${config.server.clientUrl}/settings?success=true&tier=${tier}`,
        cancelUrl: `${config.server.clientUrl}/settings?canceled=true`,
        addOns,
        couponCode,
      });

      res.json({ url: checkoutUrl });
    } catch (error) {
      logger.error('Create checkout error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create checkout session', 500);
    }
  };

  /**
   * Create a billing portal session
   */
  createPortalSession: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization?.stripeCustomerId) {
        throw new AppError('No billing account found. Please subscribe to a plan first.', 404);
      }

      const portalUrl = await stripeService.createPortalSession(
        organization.stripeCustomerId,
        `${config.server.clientUrl}/settings`
      );

      res.json({ url: portalUrl });
    } catch (error) {
      logger.error('Create portal session error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create portal session', 500);
    }
  };

  /**
   * Handle Stripe webhooks
   */
  webhook: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        throw new AppError('Missing stripe signature', 400);
      }

      const result = await stripeService.handleWebhook((req as any).rawBody, signature);

      // Trigger automation webhooks for subscription events
      if (result.processed) {
        const webhookService = (await import('../services/webhookService')).default;
        const eventType = result.event.type;

        // Map Stripe events to our webhook events
        const eventMappings: Record<string, string> = {
          'checkout.session.completed': 'subscription.created',
          'customer.subscription.updated': 'subscription.updated',
          'customer.subscription.deleted': 'subscription.canceled',
          'invoice.payment_succeeded': 'payment.succeeded',
          'invoice.payment_failed': 'payment.failed',
        };

        const mappedEvent = eventMappings[eventType];
        if (mappedEvent) {
          // Get organization ID from event
          const eventData = result.event.data.object as any;
          const organizationId = eventData.metadata?.organizationId ||
            (await this.getOrgIdFromCustomer(eventData.customer));

          if (organizationId) {
            await webhookService.dispatchEvent(organizationId, mappedEvent, {
              stripeEventId: result.event.id,
              stripeEventType: eventType,
              ...eventData,
            });
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Stripe webhook error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Webhook processing failed', 500);
    }
  };

  /**
   * Get current subscription details
   */
  getSubscription: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const details = await stripeService.getSubscriptionDetails(organizationId);

      if (!details) {
        throw new AppError('Subscription not found', 404);
      }

      res.json(details);
    } catch (error) {
      logger.error('Get subscription error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch subscription', 500);
    }
  };

  /**
   * Get all available tiers with comparison to current
   */
  getAvailableTiers: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const tiers = await tierService.getAvailableTiers(organizationId);

      res.json({
        tiers,
        addOns: tierAddOns,
      });
    } catch (error) {
      logger.error('Get available tiers error', error);
      throw new AppError('Failed to fetch available tiers', 500);
    }
  };

  /**
   * Preview tier change (upgrade/downgrade)
   */
  previewTierChange: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { tier, billingCycle = 'annual' } = req.body;
      const organizationId = authReq.user!.organizationId;

      if (!TIER_ORDER.includes(tier as TierName)) {
        throw new AppError(`Invalid tier: ${tier}`, 400);
      }

      const currentTier = await tierService.getOrganizationTier(organizationId);
      const comparison = tierService.compareTiers(currentTier, tier as TierName);

      // Get Stripe pricing preview if applicable
      const stripePreview = await stripeService.previewTierChange(
        organizationId,
        tier as TierName,
        billingCycle
      );

      // Check if downgrade is possible
      let canDowngrade = true;
      let downgradeBlockers: string[] = [];

      if (getTierIndex(tier as TierName) < getTierIndex(currentTier)) {
        const downgradeCheck = await tierService.canDowngrade(organizationId, tier as TierName);
        canDowngrade = downgradeCheck.allowed;
        downgradeBlockers = downgradeCheck.blockers;
      }

      res.json({
        comparison,
        stripePreview,
        canDowngrade,
        downgradeBlockers,
      });
    } catch (error) {
      logger.error('Preview tier change error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to preview tier change', 500);
    }
  };

  /**
   * Change tier (upgrade/downgrade)
   */
  changeTier: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { tier, billingCycle = 'annual', immediate = true } = req.body;
      const organizationId = authReq.user!.organizationId;

      if (!TIER_ORDER.includes(tier as TierName)) {
        throw new AppError(`Invalid tier: ${tier}`, 400);
      }

      const currentTier = await tierService.getOrganizationTier(organizationId);

      // Check if this is a downgrade and validate
      if (getTierIndex(tier as TierName) < getTierIndex(currentTier)) {
        const downgradeCheck = await tierService.canDowngrade(organizationId, tier as TierName);
        if (!downgradeCheck.allowed) {
          throw new AppError(
            `Cannot downgrade: ${downgradeCheck.blockers.join('; ')}`,
            400
          );
        }
      }

      const success = await stripeService.changeTier(
        organizationId,
        tier as TierName,
        billingCycle,
        immediate
      );

      if (success) {
        // Dispatch webhook event
        const webhookService = (await import('../services/webhookService')).default;
        await webhookService.dispatchEvent(organizationId, 'tier.changed', {
          previousTier: currentTier,
          newTier: tier,
          billingCycle,
          changedBy: authReq.user!.id,
        });
      }

      res.json({ success, newTier: tier });
    } catch (error) {
      logger.error('Change tier error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to change tier', 500);
    }
  };

  /**
   * Cancel subscription
   */
  cancelSubscription: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { atPeriodEnd = true, reason } = req.body;
      const organizationId = authReq.user!.organizationId;

      const success = await stripeService.cancelSubscription(
        organizationId,
        atPeriodEnd,
        reason
      );

      if (success) {
        // Dispatch webhook event
        const webhookService = (await import('../services/webhookService')).default;
        await webhookService.dispatchEvent(organizationId, 'subscription.canceled', {
          atPeriodEnd,
          reason,
          canceledBy: authReq.user!.id,
        });
      }

      res.json({
        success,
        message: atPeriodEnd
          ? 'Subscription will be canceled at the end of the current billing period'
          : 'Subscription has been canceled immediately',
      });
    } catch (error) {
      logger.error('Cancel subscription error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cancel subscription', 500);
    }
  };

  /**
   * Reactivate a canceled subscription
   */
  reactivateSubscription: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const success = await stripeService.reactivateSubscription(organizationId);

      if (success) {
        // Dispatch webhook event
        const webhookService = (await import('../services/webhookService')).default;
        await webhookService.dispatchEvent(organizationId, 'subscription.reactivated', {
          reactivatedBy: authReq.user!.id,
        });
      }

      res.json({ success, message: 'Subscription has been reactivated' });
    } catch (error) {
      logger.error('Reactivate subscription error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to reactivate subscription', 500);
    }
  };

  /**
   * Add an add-on to subscription
   */
  addAddOn: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { addOnId } = req.body;
      const organizationId = authReq.user!.organizationId;

      // Validate add-on exists
      const addOn = tierAddOns.find(a => a.id === addOnId);
      if (!addOn) {
        throw new AppError(`Add-on not found: ${addOnId}`, 404);
      }

      // Check if add-on is available for current tier
      const currentTier = await tierService.getOrganizationTier(organizationId);
      if (!addOn.availableForTiers.includes(currentTier)) {
        throw new AppError(
          `Add-on "${addOn.name}" is not available for ${currentTier} tier. Available for: ${addOn.availableForTiers.join(', ')}`,
          400
        );
      }

      const success = await stripeService.addAddOn(organizationId, addOnId);

      if (success) {
        // Dispatch webhook event
        const webhookService = (await import('../services/webhookService')).default;
        await webhookService.dispatchEvent(organizationId, 'addon.added', {
          addOnId,
          addOnName: addOn.name,
          addedBy: authReq.user!.id,
        });
      }

      res.json({ success, addOn });
    } catch (error) {
      logger.error('Add add-on error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add add-on', 500);
    }
  };

  /**
   * Remove an add-on from subscription
   */
  removeAddOn: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { addOnId } = req.params;
      const organizationId = authReq.user!.organizationId;

      const addOn = tierAddOns.find(a => a.id === addOnId);

      const success = await stripeService.removeAddOn(organizationId, addOnId);

      if (success) {
        // Dispatch webhook event
        const webhookService = (await import('../services/webhookService')).default;
        await webhookService.dispatchEvent(organizationId, 'addon.removed', {
          addOnId,
          addOnName: addOn?.name,
          removedBy: authReq.user!.id,
        });
      }

      res.json({ success });
    } catch (error) {
      logger.error('Remove add-on error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to remove add-on', 500);
    }
  };

  /**
   * Get usage metrics
   */
  getUsageMetrics: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

      const [metrics, limits] = await Promise.all([
        tierService.getAllUsageMetrics(organizationId),
        tierService.getUsageVsLimits(organizationId),
      ]);

      res.json({ metrics, limits });
    } catch (error) {
      logger.error('Get usage metrics error', error);
      throw new AppError('Failed to fetch usage metrics', 500);
    }
  };

  /**
   * Get subscription history
   */
  getSubscriptionHistory: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { limit = 50, offset = 0 } = req.query;

      const history = await prisma.subscriptionHistory.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      });

      const total = await prisma.subscriptionHistory.count({
        where: { organizationId },
      });

      res.json({ history, total });
    } catch (error) {
      logger.error('Get subscription history error', error);
      throw new AppError('Failed to fetch subscription history', 500);
    }
  };

  /**
   * Request a custom quote for Visionary tier
   */
  requestQuote: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { userCount, features, addOns, billingCycle = 'annual' } = req.body;
      const organizationId = authReq.user!.organizationId;

      if (userCount < 1000) {
        throw new AppError('Custom quotes are available for 1000+ users. Consider the Growth tier.', 400);
      }

      const quote = await stripeService.createQuote(organizationId, {
        userCount,
        features,
        addOns,
        billingCycle,
      });

      if (!quote) {
        throw new AppError('Failed to generate quote', 500);
      }

      res.json(quote);
    } catch (error) {
      logger.error('Request quote error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to request quote', 500);
    }
  };

  /**
   * Helper to get organization ID from Stripe customer ID
   */
  private async getOrgIdFromCustomer(customerId: string): Promise<string | null> {
    if (!customerId) return null;

    const org = await prisma.organization.findUnique({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });

    return org?.id || null;
  }
}

export default new BillingController();
