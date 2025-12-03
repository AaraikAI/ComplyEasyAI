import Stripe from 'stripe';
import config from '../config';
import logger from '../config/logger';
import prisma from '../config/database';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-02-24.acacia',
});

interface CreateCheckoutSessionOptions {
  priceId: string;
  customerId?: string;
  customerEmail: string;
  organizationId: string;
  successUrl: string;
  cancelUrl: string;
}

class StripeService {
  async createCustomer(email: string, name: string, organizationId: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          organizationId,
        },
      });

      // Update organization with Stripe customer ID
      await prisma.organization.update({
        where: { id: organizationId },
        data: { stripeCustomerId: customer.id },
      });

      logger.info(`Stripe customer created: ${customer.id}`);
      return customer.id;
    } catch (error) {
      logger.error('Failed to create Stripe customer', error);
      throw new Error('Failed to create customer');
    }
  }

  async createCheckoutSession(options: CreateCheckoutSessionOptions): Promise<string> {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: options.customerId,
        customer_email: options.customerId ? undefined : options.customerEmail,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: options.priceId,
            quantity: 1,
          },
        ],
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        metadata: {
          organizationId: options.organizationId,
        },
        subscription_data: {
          metadata: {
            organizationId: options.organizationId,
          },
        },
      });

      logger.info(`Checkout session created: ${session.id}`);
      return session.url!;
    } catch (error) {
      logger.error('Failed to create checkout session', error);
      throw new Error('Failed to create checkout session');
    }
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<string> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error) {
      logger.error('Failed to create portal session', error);
      throw new Error('Failed to create billing portal session');
    }
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );
    } catch (error) {
      logger.error('Webhook signature verification failed', error);
      throw new Error('Invalid webhook signature');
    }

    // Log the event
    await prisma.stripeEvent.create({
      data: {
        eventId: event.id,
        type: event.type,
        data: event.data as any,
      },
    });

    logger.info(`Processing Stripe webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      // Mark event as processed
      await prisma.stripeEvent.update({
        where: { eventId: event.id },
        data: { processed: true },
      });
    } catch (error) {
      logger.error(`Error processing webhook ${event.type}`, error);
      throw error;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const organizationId = session.metadata?.organizationId;
    if (!organizationId) return;

    // Update organization with customer ID if not already set
    if (session.customer && typeof session.customer === 'string') {
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          stripeCustomerId: session.customer,
          subscriptionStatus: 'active',
        },
      });
    }

    logger.info(`Checkout completed for organization: ${organizationId}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

    const organization = await prisma.organization.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) {
      logger.warn(`Organization not found for customer: ${customerId}`);
      return;
    }

    // Determine plan from price ID
    let plan: 'Basic' | 'Pro' | 'Enterprise' = 'Basic';
    const priceId = subscription.items.data[0]?.price.id;

    if (priceId === config.stripe.priceIds.pro) {
      plan = 'Pro';
    } else if (priceId === config.stripe.priceIds.enterprise) {
      plan = 'Enterprise';
    }

    // Update organization
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        plan,
        subscriptionStatus: subscription.status as any,
      },
    });

    logger.info(`Subscription updated for organization: ${organization.id} - Plan: ${plan}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

    const organization = await prisma.organization.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) return;

    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        plan: 'Basic',
        subscriptionStatus: 'canceled',
      },
    });

    logger.info(`Subscription canceled for organization: ${organization.id}`);
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    logger.info(`Payment succeeded for invoice: ${invoice.id}`);
    // Could send receipt email here
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id;

    if (!customerId) return;

    const organization = await prisma.organization.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) return;

    await prisma.organization.update({
      where: { id: organization.id },
      data: { subscriptionStatus: 'past_due' },
    });

    logger.warn(`Payment failed for organization: ${organization.id}`);
    // Could send payment failed email here
  }

  async cancelSubscription(customerId: string): Promise<void> {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
      });

      for (const subscription of subscriptions.data) {
        await stripe.subscriptions.cancel(subscription.id);
      }

      logger.info(`Subscriptions canceled for customer: ${customerId}`);
    } catch (error) {
      logger.error('Failed to cancel subscription', error);
      throw new Error('Failed to cancel subscription');
    }
  }
}

export default new StripeService();
