/**
 * Webhook Controller Contract Tests
 *
 * Validates the contract for webhook CRUD, testing, event history,
 * API key management, and Zapier integration endpoints.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

const mockWebhookService = {
  getWebhooks: jest.fn<any>().mockResolvedValue([{ id: 'wh-1' }] as never),
  getWebhook: jest.fn<any>().mockResolvedValue({ id: 'wh-1', events: [] } as never),
  createWebhook: jest.fn<any>().mockResolvedValue({ id: 'wh-new', secret: 'sec_123' } as never),
  updateWebhook: jest.fn<any>().mockResolvedValue({ id: 'wh-1' } as never),
  deleteWebhook: jest.fn<any>().mockResolvedValue(undefined as never),
  testWebhook: jest.fn<any>().mockResolvedValue({ success: true, statusCode: 200, duration: 150 } as never),
  regenerateSecret: jest.fn<any>().mockResolvedValue('new_sec_456' as never),
  getEventHistory: jest.fn<any>().mockResolvedValue({ events: [], total: 0 } as never),
  retryEvent: jest.fn<any>().mockResolvedValue(undefined as never),
  dispatchEvent: jest.fn<any>().mockResolvedValue(undefined as never),
};

const mockWebhookEventTypes = {
  'risk.created': 'Risk created',
  'issue.created': 'Issue created',
  'user.created': 'User created',
};

jest.mock('../../../services/webhookService', () => ({
  __esModule: true,
  default: mockWebhookService,
  WEBHOOK_EVENT_TYPES: mockWebhookEventTypes,
}));

import webhookController from '../../../controllers/webhookController';
import { AppError } from '../../../middleware/errorHandler';

describe('WebhookController Contract Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    // Re-establish mock implementations cleared by resetMocks: true in jest config
    mockWebhookService.getWebhooks.mockResolvedValue([{ id: 'wh-1' }] as never);
    mockWebhookService.getWebhook.mockResolvedValue({ id: 'wh-1', events: [] } as never);
    mockWebhookService.createWebhook.mockResolvedValue({ id: 'wh-new', secret: 'sec_123' } as never);
    mockWebhookService.updateWebhook.mockResolvedValue({ id: 'wh-1' } as never);
    mockWebhookService.deleteWebhook.mockResolvedValue(undefined as never);
    mockWebhookService.testWebhook.mockResolvedValue({ success: true, statusCode: 200, duration: 150 } as never);
    mockWebhookService.regenerateSecret.mockResolvedValue('new_sec_456' as never);
    mockWebhookService.getEventHistory.mockResolvedValue({ events: [], total: 0 } as never);
    mockWebhookService.retryEvent.mockResolvedValue(undefined as never);
    mockWebhookService.dispatchEvent.mockResolvedValue(undefined as never);

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
      },
      headers: {},
    } as any;

    mockRes = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as unknown as NextFunction;
  });

  // ===========================================================================
  // Webhook CRUD
  // ===========================================================================
  describe('getWebhooks()', () => {
    it('should return webhooks and available events', async () => {
      await webhookController.getWebhooks(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          webhooks: expect.any(Array),
          availableEvents: expect.any(Object),
        })
      );
      expect(mockWebhookService.getWebhooks).toHaveBeenCalledWith('org-123');
    });
  });

  describe('getWebhook()', () => {
    it('should return single webhook', async () => {
      mockReq.params = { webhookId: 'wh-1' };

      await webhookController.getWebhook(mockReq as Request, mockRes as Response, mockNext);

      expect(mockWebhookService.getWebhook).toHaveBeenCalledWith('wh-1', 'org-123');
    });

    it('should throw 404 when not found', async () => {
      mockReq.params = { webhookId: 'wh-missing' };
      mockWebhookService.getWebhook.mockRejectedValueOnce(new Error('Webhook not found') as never);

      await expect(
        webhookController.getWebhook(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('createWebhook()', () => {
    it('should create webhook with status 201', async () => {
      mockReq.body = {
        name: 'My Webhook',
        url: 'https://example.com/hook',
        events: ['risk.created'],
      };

      await webhookController.createWebhook(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          webhook: expect.any(Object),
          message: expect.stringContaining('created'),
        })
      );
    });

    it('should throw 400 when required fields missing', async () => {
      mockReq.body = { name: 'Test' }; // missing url and events

      await expect(
        webhookController.createWebhook(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw 400 for invalid URL', async () => {
      mockReq.body = {
        name: 'Test',
        url: 'not-a-url',
        events: ['risk.created'],
      };

      await expect(
        webhookController.createWebhook(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw 400 for invalid events', async () => {
      mockReq.body = {
        name: 'Test',
        url: 'https://example.com/hook',
        events: ['invalid.event'],
      };

      await expect(
        webhookController.createWebhook(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('updateWebhook()', () => {
    it('should update webhook', async () => {
      mockReq.params = { webhookId: 'wh-1' };
      mockReq.body = { name: 'Updated Webhook' };

      await webhookController.updateWebhook(mockReq as Request, mockRes as Response, mockNext);

      expect(mockWebhookService.updateWebhook).toHaveBeenCalledWith(
        'wh-1', 'org-123', expect.objectContaining({ name: 'Updated Webhook' })
      );
    });

    it('should throw 404 when webhook not found', async () => {
      mockReq.params = { webhookId: 'wh-missing' };
      mockWebhookService.updateWebhook.mockRejectedValueOnce(new Error('Webhook not found') as never);

      await expect(
        webhookController.updateWebhook(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('deleteWebhook()', () => {
    it('should delete and return success', async () => {
      mockReq.params = { webhookId: 'wh-1' };

      await webhookController.deleteWebhook(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  // ===========================================================================
  // Testing & Events
  // ===========================================================================
  describe('testWebhook()', () => {
    it('should return success result', async () => {
      mockReq.params = { webhookId: 'wh-1' };

      await webhookController.testWebhook(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          statusCode: 200,
          duration: expect.any(Number),
        })
      );
    });

    it('should return 422 when delivery fails', async () => {
      mockReq.params = { webhookId: 'wh-1' };
      mockWebhookService.testWebhook.mockResolvedValueOnce({
        success: false, error: 'Timeout', statusCode: 504, duration: 30000,
      } as never);

      await webhookController.testWebhook(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(422);
    });
  });

  describe('regenerateSecret()', () => {
    it('should return new secret', async () => {
      mockReq.params = { webhookId: 'wh-1' };

      await webhookController.regenerateSecret(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          secret: expect.any(String),
        })
      );
    });
  });

  describe('getEventHistory()', () => {
    it('should return event history', async () => {
      await webhookController.getEventHistory(mockReq as Request, mockRes as Response, mockNext);

      expect(mockWebhookService.getEventHistory).toHaveBeenCalledWith('org-123', expect.any(Object));
    });
  });

  describe('retryEvent()', () => {
    it('should retry event and return success', async () => {
      mockReq.params = { eventId: 'evt-1' };

      await webhookController.retryEvent(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should throw 404 for non-existent event', async () => {
      mockReq.params = { eventId: 'evt-missing' };
      mockWebhookService.retryEvent.mockRejectedValueOnce(new Error('Webhook event not found') as never);

      await expect(
        webhookController.retryEvent(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw 400 for already delivered event', async () => {
      mockReq.params = { eventId: 'evt-delivered' };
      mockWebhookService.retryEvent.mockRejectedValueOnce(new Error('Event already delivered') as never);

      await expect(
        webhookController.retryEvent(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getEventTypes()', () => {
    it('should return event types with categories', async () => {
      await webhookController.getEventTypes(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          eventTypes: expect.arrayContaining([
            expect.objectContaining({
              type: expect.any(String),
              description: expect.any(String),
              category: expect.any(String),
            }),
          ]),
        })
      );
    });
  });

  // ===========================================================================
  // API Keys
  // ===========================================================================
  describe('getApiKeys()', () => {
    it('should return non-revoked API keys for org', async () => {
      (prismaMock.apiKey.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'key-1', name: 'Test Key', keyPrefix: 'cea_abc123' },
      ] as never);

      await webhookController.getApiKeys(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
            revokedAt: null,
          }),
        })
      );
    });
  });

  describe('createApiKey()', () => {
    it('should create API key with status 201', async () => {
      mockReq.body = { name: 'My API Key', scopes: ['webhook:receive'] };

      (prismaMock.apiKey.create as jest.Mock<any>).mockResolvedValue({
        id: 'key-new',
        name: 'My API Key',
        keyPrefix: 'cea_test1234',
        scopes: ['webhook:receive'],
        rateLimit: 1000,
        expiresAt: null,
      } as never);

      await webhookController.createApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          key: expect.stringContaining('cea_'),
          message: expect.stringContaining('save the key'),
        })
      );
    });

    it('should throw 400 when name is missing', async () => {
      mockReq.body = {};

      await expect(
        webhookController.createApiKey(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });

    it('should throw 409 for duplicate key name', async () => {
      mockReq.body = { name: 'Existing Key' };

      const error: any = new Error('Unique constraint');
      error.code = 'P2002';
      (prismaMock.apiKey.create as jest.Mock<any>).mockRejectedValue(error as never);

      await expect(
        webhookController.createApiKey(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('revokeApiKey()', () => {
    it('should revoke API key', async () => {
      mockReq.params = { keyId: 'key-1' };

      (prismaMock.apiKey.update as jest.Mock<any>).mockResolvedValue({} as never);

      await webhookController.revokeApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'key-1',
            organizationId: 'org-123',
          }),
          data: expect.objectContaining({
            revokedAt: expect.any(Date),
          }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should throw 404 when key not found', async () => {
      mockReq.params = { keyId: 'key-missing' };

      const error: any = new Error('Not found');
      error.code = 'P2025';
      (prismaMock.apiKey.update as jest.Mock<any>).mockRejectedValue(error as never);

      await expect(
        webhookController.revokeApiKey(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  // ===========================================================================
  // Zapier Integration
  // ===========================================================================
  describe('zapierAuthTest()', () => {
    it('should return org info on valid auth', async () => {
      (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue({
        name: 'Test Org',
        plan: 'Essentials',
      } as never);

      await webhookController.zapierAuthTest(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          organizationName: 'Test Org',
        })
      );
    });
  });

  describe('zapierSubscribe()', () => {
    it('should create webhook for Zapier', async () => {
      mockReq.body = { hookUrl: 'https://zapier.com/hook/123', event: 'risk.created' };

      await webhookController.zapierSubscribe(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.any(String) })
      );
    });

    it('should throw 400 when hookUrl or event missing', async () => {
      mockReq.body = { hookUrl: 'https://zapier.com/hook/123' };

      await expect(
        webhookController.zapierSubscribe(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('zapierUnsubscribe()', () => {
    it('should unsubscribe and return success', async () => {
      mockReq.params = { id: 'wh-zapier' };

      await webhookController.zapierUnsubscribe(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should return success even when webhook not found', async () => {
      mockReq.params = { id: 'wh-missing' };
      mockWebhookService.deleteWebhook.mockRejectedValueOnce(new Error('Webhook not found') as never);

      await webhookController.zapierUnsubscribe(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('zapierSampleData()', () => {
    it('should return sample data for known event', async () => {
      mockReq.params = { event: 'risk.created' };

      await webhookController.zapierSampleData(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })])
      );
    });

    it('should return default sample for unknown event', async () => {
      mockReq.params = { event: 'unknown.event' };

      await webhookController.zapierSampleData(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ event: 'unknown.event' })])
      );
    });
  });
});
