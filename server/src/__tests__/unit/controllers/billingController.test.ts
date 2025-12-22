/**
 * Billing Controller Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { prismaMock } from '../../mocks/prisma';

const mockCreateCheckoutSession = jest.fn();
const mockCreatePortalSession = jest.fn();
const mockHandleWebhook = jest.fn();

jest.mock('../../../services/stripeService', () => ({
  __esModule: true,
  default: {
    createCheckoutSession: mockCreateCheckoutSession,
    createPortalSession: mockCreatePortalSession,
    handleWebhook: mockHandleWebhook,
  },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config', () => ({
  __esModule: true,
  default: {
    stripe: {
      priceIds: {
        basic: 'price_basic',
        pro: 'price_pro',
        enterprise: 'price_enterprise',
      },
    },
    server: {
      clientUrl: 'http://localhost:3000',
    },
  },
}));

import billingController from '../../../controllers/billingController';
import { AppError } from '../../../middleware/errorHandler';

describe('BillingController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {},
      headers: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
      },
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('createCheckout()', () => {
    it('should create checkout session', async () => {
      mockRequest.body = { plan: 'Pro' };

      prismaMock.organization.findUnique.mockResolvedValue({
        id: 'org-123',
        stripeCustomerId: null,
      } as any);

      mockCreateCheckoutSession.mockResolvedValue('https://checkout.stripe.com/test');

      await billingController.createCheckout(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.any(String),
        })
      );
    });

    it('should throw error for invalid plan', async () => {
      mockRequest.body = { plan: 'Invalid' };

      await expect(
        billingController.createCheckout(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('createPortalSession()', () => {
    it('should create portal session', async () => {
      prismaMock.organization.findUnique.mockResolvedValue({
        id: 'org-123',
        stripeCustomerId: 'cus_test123',
      } as any);

      mockCreatePortalSession.mockResolvedValue('https://billing.stripe.com/test');

      await billingController.createPortalSession(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.any(String),
        })
      );
    });

    it('should throw error if no customer ID', async () => {
      prismaMock.organization.findUnique.mockResolvedValue({
        id: 'org-123',
        stripeCustomerId: null,
      } as any);

      await expect(
        billingController.createPortalSession(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('webhook()', () => {
    it('should handle Stripe webhook', async () => {
      mockRequest.headers = {
        'stripe-signature': 'test-signature',
      };
      (mockRequest as any).rawBody = Buffer.from('test payload');

      mockHandleWebhook.mockResolvedValue(undefined);

      await billingController.webhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
    });

    it('should throw error if signature missing', async () => {
      mockRequest.headers = {};

      await expect(
        billingController.webhook(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });
});

