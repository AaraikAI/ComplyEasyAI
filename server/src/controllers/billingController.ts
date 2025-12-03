import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import stripeService from '../services/stripeService';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import config from '../config';

class BillingController {
  async createCheckout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { plan } = req.body;
      const organizationId = req.user!.organizationId;

      if (!['Basic', 'Pro', 'Enterprise'].includes(plan)) {
        throw new AppError('Invalid plan', 400);
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        throw new AppError('Organization not found', 404);
      }

      // Get price ID from config
      const priceIdMap: Record<string, string> = {
        Basic: config.stripe.priceIds.basic,
        Pro: config.stripe.priceIds.pro,
        Enterprise: config.stripe.priceIds.enterprise,
      };

      const priceId = priceIdMap[plan];

      if (!priceId) {
        throw new AppError('Price configuration missing', 500);
      }

      const checkoutUrl = await stripeService.createCheckoutSession({
        priceId,
        customerId: organization.stripeCustomerId,
        customerEmail: req.user!.email,
        organizationId,
        successUrl: `${config.server.clientUrl}/settings?success=true`,
        cancelUrl: `${config.server.clientUrl}/settings?canceled=true`,
      });

      res.json({ url: checkoutUrl });
    } catch (error) {
      logger.error('Create checkout error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create checkout session', 500);
    }
  }

  async createPortalSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization?.stripeCustomerId) {
        throw new AppError('No billing account found', 404);
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
  }

  async webhook(req: any, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        throw new AppError('Missing stripe signature', 400);
      }

      await stripeService.handleWebhook(req.rawBody, signature);

      res.json({ received: true });
    } catch (error) {
      logger.error('Stripe webhook error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Webhook processing failed', 500);
    }
  }

  async getSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        throw new AppError('Organization not found', 404);
      }

      res.json({
        plan: organization.plan,
        status: organization.subscriptionStatus,
        stripeCustomerId: organization.stripeCustomerId,
      });
    } catch (error) {
      logger.error('Get subscription error', error);
      throw new AppError('Failed to fetch subscription', 500);
    }
  }
}

export default new BillingController();
