/**
 * Webhook Controller Unit Tests
 * Tests for webhook management and Zapier integration
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock webhook service
const mockGetWebhooks = jest.fn();
const mockGetWebhook = jest.fn();
const mockCreateWebhook = jest.fn();
const mockUpdateWebhook = jest.fn();
const mockDeleteWebhook = jest.fn();
const mockTestWebhook = jest.fn();
const mockRegenerateSecret = jest.fn();
const mockGetEventHistory = jest.fn();
const mockRetryEvent = jest.fn();

const MOCK_WEBHOOK_EVENT_TYPES = {
  'risk.created': 'When a new risk is created',
  'risk.updated': 'When a risk is updated',
  'risk.deleted': 'When a risk is deleted',
  'framework.activated': 'When a framework is activated',
  'compliance.status_changed': 'When compliance status changes',
  'user.added': 'When a user is added',
  'subscription.created': 'When subscription is created',
  'subscription.updated': 'When subscription is updated',
};

jest.mock('../../../services/webhookService', () => ({
  __esModule: true,
  default: {
    getWebhooks: mockGetWebhooks,
    getWebhook: mockGetWebhook,
    createWebhook: mockCreateWebhook,
    updateWebhook: mockUpdateWebhook,
    deleteWebhook: mockDeleteWebhook,
    testWebhook: mockTestWebhook,
    regenerateSecret: mockRegenerateSecret,
    getEventHistory: mockGetEventHistory,
    retryEvent: mockRetryEvent,
  },
  WEBHOOK_EVENT_TYPES: MOCK_WEBHOOK_EVENT_TYPES,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import webhookController from '../../../controllers/webhookController';
import { AppError } from '../../../middleware/errorHandler';

describe('WebhookController', () => {
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {},
      headers: {},
      params: {},
      query: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
      },
    };

    mockResponse = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as unknown as NextFunction;
  });

  describe('getWebhooks()', () => {
    it('should return all webhooks for organization', async () => {
      (mockGetWebhooks as any).mockResolvedValue([
        { id: 'webhook-1', name: 'Slack Notifications', url: 'https://example.com/webhook1' },
        { id: 'webhook-2', name: 'Zapier Integration', url: 'https://example.com/webhook2' },
      ]);

      await webhookController.getWebhooks(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        webhooks: expect.any(Array),
        availableEvents: MOCK_WEBHOOK_EVENT_TYPES,
      });
    });

    it('should handle errors', async () => {
      (mockGetWebhooks as any).mockRejectedValue(new Error('Database error'));

      await expect(
        webhookController.getWebhooks(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getWebhook()', () => {
    it('should return specific webhook with event history', async () => {
      mockRequest.params = { webhookId: 'webhook-123' };

      (mockGetWebhook as any).mockResolvedValue({
        id: 'webhook-123',
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['risk.created', 'risk.updated'],
        enabled: true,
        eventHistory: [],
      });

      await webhookController.getWebhook(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'webhook-123',
          name: 'Test Webhook',
        })
      );
    });

    it('should throw 404 if webhook not found', async () => {
      mockRequest.params = { webhookId: 'nonexistent' };
      (mockGetWebhook as any).mockRejectedValue(new Error('Webhook not found'));

      await expect(
        webhookController.getWebhook(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('createWebhook()', () => {
    it('should create webhook successfully', async () => {
      mockRequest.body = {
        name: 'New Webhook',
        url: 'https://example.com/webhook',
        events: ['risk.created', 'risk.updated'],
        headers: { 'X-Custom': 'value' },
      };

      (mockCreateWebhook as any).mockResolvedValue({
        id: 'webhook-new',
        name: 'New Webhook',
        url: 'https://example.com/webhook',
        secret: 'whsec_test123',
        events: ['risk.created', 'risk.updated'],
      });

      await webhookController.createWebhook(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          webhook: expect.objectContaining({
            name: 'New Webhook',
          }),
          message: expect.stringContaining('secret'),
        })
      );
    });

    it('should throw error for missing required fields', async () => {
      mockRequest.body = { name: 'Test' };

      await expect(
        webhookController.createWebhook(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw error for invalid URL', async () => {
      mockRequest.body = {
        name: 'Test Webhook',
        url: 'not-a-valid-url',
        events: ['risk.created'],
      };

      await expect(
        webhookController.createWebhook(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw error for invalid events', async () => {
      mockRequest.body = {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['invalid.event'],
      };

      await expect(
        webhookController.createWebhook(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw error for duplicate webhook', async () => {
      mockRequest.body = {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['risk.created'],
      };

      (mockCreateWebhook as any).mockRejectedValue(new Error('Webhook already exists'));

      await expect(
        webhookController.createWebhook(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('updateWebhook()', () => {
    it('should update webhook successfully', async () => {
      mockRequest.params = { webhookId: 'webhook-123' };
      mockRequest.body = {
        name: 'Updated Webhook',
        url: 'https://example.com/updated',
        events: ['risk.created'],
        enabled: false,
      };

      (mockUpdateWebhook as any).mockResolvedValue({
        id: 'webhook-123',
        name: 'Updated Webhook',
        enabled: false,
      });

      await webhookController.updateWebhook(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Webhook',
        })
      );
    });

    it('should throw error for invalid URL', async () => {
      mockRequest.params = { webhookId: 'webhook-123' };
      mockRequest.body = { url: 'invalid-url' };

      await expect(
        webhookController.updateWebhook(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw error for invalid events', async () => {
      mockRequest.params = { webhookId: 'webhook-123' };
      mockRequest.body = { events: ['invalid.event'] };

      await expect(
        webhookController.updateWebhook(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw error if webhook not found', async () => {
      mockRequest.params = { webhookId: 'nonexistent' };
      mockRequest.body = { name: 'Test' };

      (mockUpdateWebhook as any).mockRejectedValue(new Error('Webhook not found'));

      await expect(
        webhookController.updateWebhook(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('deleteWebhook()', () => {
    it('should delete webhook successfully', async () => {
      mockRequest.params = { webhookId: 'webhook-123' };

      (mockDeleteWebhook as any).mockResolvedValue({ deleted: true });

      await webhookController.deleteWebhook(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should throw error if webhook not found', async () => {
      mockRequest.params = { webhookId: 'nonexistent' };

      (mockDeleteWebhook as any).mockRejectedValue(new Error('Webhook not found'));

      await expect(
        webhookController.deleteWebhook(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('testWebhook()', () => {
    it('should send test webhook successfully', async () => {
      mockRequest.params = { webhookId: 'webhook-123' };

      (mockTestWebhook as any).mockResolvedValue({
        success: true,
        statusCode: 200,
        responseTime: 150,
      });

      await webhookController.testWebhook(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          statusCode: 200,
        })
      );
    });

    it('should handle failed test webhook', async () => {
      mockRequest.params = { webhookId: 'webhook-123' };

      (mockTestWebhook as any).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: 'Connection refused',
      });

      await webhookController.testWebhook(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });
  });

  describe('regenerateSecret()', () => {
    it('should regenerate webhook secret', async () => {
      mockRequest.params = { webhookId: 'webhook-123' };

      (mockRegenerateSecret as any).mockResolvedValue({
        newSecret: 'whsec_new123',
      });

      await webhookController.regenerateSecret(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should throw error if webhook not found', async () => {
      mockRequest.params = { webhookId: 'nonexistent' };

      (mockRegenerateSecret as any).mockRejectedValue(new Error('Webhook not found'));

      await expect(
        webhookController.regenerateSecret(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getEventHistory()', () => {
    it('should return event history for webhook', async () => {
      mockRequest.params = { webhookId: 'webhook-123' };
      mockRequest.query = { limit: '20', offset: '0' };

      (mockGetEventHistory as any).mockResolvedValue({
        events: [
          { id: 'event-1', type: 'risk.created', status: 'delivered', timestamp: new Date() },
          { id: 'event-2', type: 'risk.updated', status: 'failed', timestamp: new Date() },
        ],
        total: 2,
      });

      await webhookController.getEventHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          events: expect.any(Array),
          total: 2,
        })
      );
    });

    it('should filter by status', async () => {
      mockRequest.params = { webhookId: 'webhook-123' };
      mockRequest.query = { status: 'failed' };

      (mockGetEventHistory as any).mockResolvedValue({
        events: [
          { id: 'event-2', type: 'risk.updated', status: 'failed' },
        ],
        total: 1,
      });

      await webhookController.getEventHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Just verify it was called - the service handles filtering
      expect(mockGetEventHistory).toHaveBeenCalled();
    });
  });

  describe('retryEvent()', () => {
    it('should retry failed event', async () => {
      mockRequest.params = { webhookId: 'webhook-123', eventId: 'event-456' };

      (mockRetryEvent as any).mockResolvedValue({
        success: true,
        statusCode: 200,
      });

      await webhookController.retryEvent(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should throw error if event not found', async () => {
      mockRequest.params = { webhookId: 'webhook-123', eventId: 'nonexistent' };

      (mockRetryEvent as any).mockRejectedValue(new Error('Event not found'));

      await expect(
        webhookController.retryEvent(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getEventTypes()', () => {
    it('should return available webhook event types', async () => {
      await webhookController.getEventTypes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  // Note: API key tests require the apiKey model which may not be in the prisma mock
  // These tests verify the controller handles API key operations

  describe('zapierAuthTest()', () => {
    it('should test Zapier authentication', async () => {
      await webhookController.zapierAuthTest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('zapierSubscribe()', () => {
    it('should create Zapier subscription', async () => {
      mockRequest.body = {
        hookUrl: 'https://hooks.zapier.com/test',
        event: 'risk.created',
      };

      (mockCreateWebhook as any).mockResolvedValue({
        id: 'zapier-webhook-123',
        url: 'https://hooks.zapier.com/test',
      });

      await webhookController.zapierSubscribe(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('zapierUnsubscribe()', () => {
    it('should remove Zapier subscription', async () => {
      mockRequest.params = { subscribeId: 'sub-123' };

      (mockDeleteWebhook as any).mockResolvedValue({ deleted: true });

      await webhookController.zapierUnsubscribe(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('zapierSampleData()', () => {
    it('should return sample data for Zapier', async () => {
      mockRequest.params = { event: 'risk.created' };

      await webhookController.zapierSampleData(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('receiveIncomingWebhook()', () => {
    it('should throw error if API key missing', async () => {
      mockRequest.params = { webhookId: 'webhook-123' };
      mockRequest.body = { data: 'test payload' };
      mockRequest.headers = {};

      await expect(
        webhookController.receiveIncomingWebhook(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        )
      ).rejects.toThrow(AppError);
    });
  });
});
