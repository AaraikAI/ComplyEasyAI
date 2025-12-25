import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import stripeService from '../services/stripeService';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import config from '../config';

class BillingController {
  createCheckout: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { plan } = req.body;
      const organizationId = authReq.user!.organizationId;

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

      // Check if priceId is valid (not 'Contact Us' placeholder)
      if (!priceId || priceId === 'Contact Us' || !priceId.startsWith('price_')) {
        // If Stripe is not configured, return a message instead of error
        if (!config.stripe.secretKey || config.stripe.secretKey === '') {
          throw new AppError('Stripe is not configured. Please contact support to upgrade your plan.', 503);
        }
        throw new AppError(`Price ID for ${plan} plan is not configured. Please contact support.`, 503);
      }

      // Check if Stripe service is available
      if (!config.stripe.secretKey || config.stripe.secretKey === '') {
        throw new AppError('Stripe is not configured. Please contact support to upgrade your plan.', 503);
      }

      const checkoutUrl = await stripeService.createCheckoutSession({
        priceId,
        customerId: organization.stripeCustomerId ?? undefined,
        customerEmail: authReq.user!.email,
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
  };

  createPortalSession: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

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
  };

  webhook: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        throw new AppError('Missing stripe signature', 400);
      }

      await stripeService.handleWebhook((req as any).rawBody, signature);

      res.json({ received: true });
    } catch (error) {
      logger.error('Stripe webhook error', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Webhook processing failed', 500);
    }
  };

  getSubscription: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;

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
  };
}

export default new BillingController();
