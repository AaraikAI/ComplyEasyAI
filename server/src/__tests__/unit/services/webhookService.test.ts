/**
 * Webhook Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
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

jest.mock('../../../utils/urlValidator', () => ({
  __esModule: true,
  isWebhookUrlSafe: jest.fn().mockReturnValue(true),
  safeFetch: jest.fn(),
}));

import webhookService from '../../../services/webhookService';

describe('WebhookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // createWebhook
  // =========================================================================
  describe('createWebhook', () => {
    it('should create a webhook and return it with the signing secret', async () => {
      const mockWebhook = {
        id: 'webhook-1',
        organizationId: 'org-123',
        name: 'My Webhook',
        url: 'https://example.com/webhook',
        secret: 'generated-secret',
        events: ['user.created'],
        headers: {},
        createdBy: 'user-123',
        enabled: true,
        failureCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaMock.webhook.create as jest.Mock).mockResolvedValue(mockWebhook as any);

      const result = await webhookService.createWebhook({
        organizationId: 'org-123',
        name: 'My Webhook',
        url: 'https://example.com/webhook',
        events: ['user.created'],
        createdBy: 'user-123',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('webhook-1');
      expect(result.secret).toBeDefined();
      expect(prismaMock.webhook.create).toHaveBeenCalledTimes(1);
    });

    it('should throw an error for invalid URL', async () => {
      await expect(
        webhookService.createWebhook({
          organizationId: 'org-123',
          name: 'Bad Webhook',
          url: 'not-a-valid-url',
          events: ['user.created'],
          createdBy: 'user-123',
        })
      ).rejects.toThrow();
    });

    it('should throw a friendly error for duplicate name (P2002)', async () => {
      const prismaError = new Error('Unique constraint violation');
      (prismaError as any).code = 'P2002';
      (prismaMock.webhook.create as jest.Mock).mockRejectedValue(prismaError);

      await expect(
        webhookService.createWebhook({
          organizationId: 'org-123',
          name: 'Duplicate',
          url: 'https://example.com/webhook',
          events: ['user.created'],
          createdBy: 'user-123',
        })
      ).rejects.toThrow('Webhook with name "Duplicate" already exists');
    });

    it('should throw generic error on unknown database failure', async () => {
      (prismaMock.webhook.create as jest.Mock).mockRejectedValue(new Error('DB down'));

      await expect(
        webhookService.createWebhook({
          organizationId: 'org-123',
          name: 'Webhook',
          url: 'https://example.com/hook',
          events: ['user.created'],
          createdBy: 'user-123',
        })
      ).rejects.toThrow('Failed to create webhook');
    });
  });

  // =========================================================================
  // updateWebhook
  // =========================================================================
  describe('updateWebhook', () => {
    it('should update a webhook successfully', async () => {
      const mockUpdated = {
        id: 'webhook-1',
        name: 'Updated Name',
        url: 'https://example.com/updated',
        events: ['user.created', 'user.updated'],
        enabled: true,
      };

      (prismaMock.webhook.update as jest.Mock).mockResolvedValue(mockUpdated as any);

      const result = await webhookService.updateWebhook('webhook-1', 'org-123', {
        name: 'Updated Name',
        url: 'https://example.com/updated',
      });

      expect(result.name).toBe('Updated Name');
      expect(prismaMock.webhook.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'webhook-1', organizationId: 'org-123' },
        })
      );
    });

    it('should throw error when webhook not found (P2025)', async () => {
      const prismaError = new Error('Record not found');
      (prismaError as any).code = 'P2025';
      (prismaMock.webhook.update as jest.Mock).mockRejectedValue(prismaError);

      await expect(
        webhookService.updateWebhook('nonexistent', 'org-123', { name: 'X' })
      ).rejects.toThrow('Webhook not found');
    });

    it('should throw error for invalid URL in update', async () => {
      await expect(
        webhookService.updateWebhook('webhook-1', 'org-123', { url: 'invalid-url' })
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // deleteWebhook
  // =========================================================================
  describe('deleteWebhook', () => {
    it('should delete a webhook and return true', async () => {
      (prismaMock.webhook.delete as jest.Mock).mockResolvedValue({ id: 'webhook-1' } as any);

      const result = await webhookService.deleteWebhook('webhook-1', 'org-123');

      expect(result).toBe(true);
      expect(prismaMock.webhook.delete).toHaveBeenCalledWith({
        where: { id: 'webhook-1', organizationId: 'org-123' },
      });
    });

    it('should throw error when webhook not found on delete', async () => {
      const prismaError = new Error('Record not found');
      (prismaError as any).code = 'P2025';
      (prismaMock.webhook.delete as jest.Mock).mockRejectedValue(prismaError);

      await expect(
        webhookService.deleteWebhook('nonexistent', 'org-123')
      ).rejects.toThrow('Webhook not found');
    });
  });

  // =========================================================================
  // getWebhooks
  // =========================================================================
  describe('getWebhooks', () => {
    it('should return webhooks for an organization', async () => {
      const mockWebhooks = [
        { id: 'webhook-1', name: 'Hook A', url: 'https://a.com', enabled: true },
        { id: 'webhook-2', name: 'Hook B', url: 'https://b.com', enabled: false },
      ];

      (prismaMock.webhook.findMany as jest.Mock).mockResolvedValue(mockWebhooks as any);

      const result = await webhookService.getWebhooks('org-123');

      expect(result).toHaveLength(2);
      expect(prismaMock.webhook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-123' },
        })
      );
    });
  });

  // =========================================================================
  // getWebhook
  // =========================================================================
  describe('getWebhook', () => {
    it('should return a webhook without the secret', async () => {
      const mockWebhook = {
        id: 'webhook-1',
        name: 'My Hook',
        secret: 'super-secret',
        url: 'https://example.com',
        webhookEvents: [],
      };

      (prismaMock.webhook.findUnique as jest.Mock).mockResolvedValue(mockWebhook as any);

      const result = await webhookService.getWebhook('webhook-1', 'org-123');

      expect(result.id).toBe('webhook-1');
      expect(result.secret).toBeUndefined();
    });

    it('should throw when webhook not found', async () => {
      (prismaMock.webhook.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        webhookService.getWebhook('nonexistent', 'org-123')
      ).rejects.toThrow('Webhook not found');
    });
  });

  // =========================================================================
  // regenerateSecret
  // =========================================================================
  describe('regenerateSecret', () => {
    it('should regenerate and return a new secret', async () => {
      (prismaMock.webhook.update as jest.Mock).mockResolvedValue({ id: 'webhook-1' } as any);

      const newSecret = await webhookService.regenerateSecret('webhook-1', 'org-123');

      expect(typeof newSecret).toBe('string');
      expect(newSecret.length).toBe(64); // 32 bytes hex
      expect(prismaMock.webhook.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'webhook-1', organizationId: 'org-123' },
          data: { secret: expect.any(String) },
        })
      );
    });
  });

  // =========================================================================
  // generateSignature / verifySignature
  // =========================================================================
  describe('generateSignature', () => {
    it('should return a signature in t=...,v1=... format', () => {
      const signature = webhookService.generateSignature('{"test":true}', 'secret123');

      expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]+$/);
    });
  });

  describe('verifySignature', () => {
    it('should verify a valid signature', () => {
      const payload = '{"event":"test"}';
      const secret = 'my-secret';
      const signature = webhookService.generateSignature(payload, secret);

      // The generated signature uses Date.now() internally, so pass a large maxAge
      const isValid = webhookService.verifySignature(payload, signature, secret, 60000);

      expect(isValid).toBe(true);
    });

    it('should reject an expired signature', () => {
      const payload = '{"event":"test"}';
      const secret = 'my-secret';
      // Construct a signature with an old timestamp
      const oldTimestamp = Date.now() - 600000; // 10 minutes ago
      const crypto = require('crypto');
      const signaturePayload = `${oldTimestamp}.${payload}`;
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(signaturePayload);
      const sig = hmac.digest('hex');
      const fullSig = `t=${oldTimestamp},v1=${sig}`;

      // maxAge is 5 minutes (300000ms)
      const isValid = webhookService.verifySignature(payload, fullSig, secret, 300000);

      expect(isValid).toBe(false);
    });

    it('should reject a malformed signature', () => {
      const isValid = webhookService.verifySignature('payload', 'garbage', 'secret');
      expect(isValid).toBe(false);
    });

    it('should reject a signature with wrong secret', () => {
      const payload = '{"event":"test"}';
      const signature = webhookService.generateSignature(payload, 'correct-secret');

      const isValid = webhookService.verifySignature(payload, signature, 'wrong-secret', 60000);

      expect(isValid).toBe(false);
    });
  });

  // =========================================================================
  // dispatchEvent
  // =========================================================================
  describe('dispatchEvent', () => {
    it('should create webhook events for all matching webhooks', async () => {
      const mockWebhooks = [
        { id: 'wh-1', url: 'https://a.com', secret: 'sec1', events: ['user.created'], headers: {} },
        { id: 'wh-2', url: 'https://b.com', secret: 'sec2', events: ['user.created'], headers: {} },
      ];

      (prismaMock.webhook.findMany as jest.Mock).mockResolvedValue(mockWebhooks as any);
      (prismaMock.webhookEvent.create as jest.Mock).mockResolvedValue({ id: 'event-1' } as any);

      await webhookService.dispatchEvent('org-123', 'user.created', { userId: 'user-1' });

      expect(prismaMock.webhook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
            enabled: true,
            events: { has: 'user.created' },
          }),
        })
      );
      expect(prismaMock.webhookEvent.create).toHaveBeenCalledTimes(2);
    });

    it('should silently return when no webhooks are subscribed', async () => {
      (prismaMock.webhook.findMany as jest.Mock).mockResolvedValue([]);

      await webhookService.dispatchEvent('org-123', 'user.created', {});

      expect(prismaMock.webhookEvent.create).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // getEventHistory
  // =========================================================================
  describe('getEventHistory', () => {
    it('should return events and total count', async () => {
      const mockEvents = [
        { id: 'evt-1', eventType: 'user.created', status: 'delivered' },
      ];

      (prismaMock.webhookEvent.findMany as jest.Mock).mockResolvedValue(mockEvents as any);
      (prismaMock.webhookEvent.count as jest.Mock).mockResolvedValue(1 as any);

      const result = await webhookService.getEventHistory('org-123', { limit: 10, offset: 0 });

      expect(result.events).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply optional filters', async () => {
      (prismaMock.webhookEvent.findMany as jest.Mock).mockResolvedValue([] as any);
      (prismaMock.webhookEvent.count as jest.Mock).mockResolvedValue(0 as any);

      await webhookService.getEventHistory('org-123', {
        webhookId: 'wh-1',
        eventType: 'user.created',
        status: 'delivered' as any,
      });

      expect(prismaMock.webhookEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
            webhookId: 'wh-1',
            eventType: 'user.created',
            status: 'delivered',
          }),
        })
      );
    });
  });

  // =========================================================================
  // retryEvent
  // =========================================================================
  describe('retryEvent', () => {
    it('should reset event for retry', async () => {
      const mockEvent = {
        id: 'evt-1',
        status: 'failed',
        organizationId: 'org-123',
      };

      (prismaMock.webhookEvent.findUnique as jest.Mock).mockResolvedValue(mockEvent as any);
      (prismaMock.webhookEvent.update as jest.Mock).mockResolvedValue({ id: 'evt-1' } as any);

      const result = await webhookService.retryEvent('evt-1', 'org-123');

      expect(result).toBe(true);
      expect(prismaMock.webhookEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'evt-1' },
          data: expect.objectContaining({
            status: 'pending',
            attempts: 0,
          }),
        })
      );
    });

    it('should throw if event not found', async () => {
      (prismaMock.webhookEvent.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        webhookService.retryEvent('nonexistent', 'org-123')
      ).rejects.toThrow('Webhook event not found');
    });

    it('should throw if event already delivered', async () => {
      (prismaMock.webhookEvent.findUnique as jest.Mock).mockResolvedValue({
        id: 'evt-1',
        status: 'delivered',
      } as any);

      await expect(
        webhookService.retryEvent('evt-1', 'org-123')
      ).rejects.toThrow('Event already delivered');
    });
  });

  // =========================================================================
  // cleanupOldEvents
  // =========================================================================
  describe('cleanupOldEvents', () => {
    it('should delete old delivered/exhausted events', async () => {
      (prismaMock.webhookEvent.deleteMany as jest.Mock).mockResolvedValue({ count: 15 } as any);

      const result = await webhookService.cleanupOldEvents(30);

      expect(result).toBe(15);
      expect(prismaMock.webhookEvent.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['delivered', 'exhausted'] },
          }),
        })
      );
    });
  });

  // =========================================================================
  // processPendingEvents
  // =========================================================================
  describe('processPendingEvents', () => {
    it('should process pending events and return count', async () => {
      const pendingEvents = [
        { id: 'evt-1', status: 'pending' },
        { id: 'evt-2', status: 'failed' },
      ];

      (prismaMock.webhookEvent.findMany as jest.Mock).mockResolvedValue(pendingEvents as any);
      // processWebhookEvent will call findUnique - return null to shortcircuit
      (prismaMock.webhookEvent.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await webhookService.processPendingEvents();

      expect(result).toBe(2);
    });

    it('should return 0 when no pending events', async () => {
      (prismaMock.webhookEvent.findMany as jest.Mock).mockResolvedValue([]);

      const result = await webhookService.processPendingEvents();

      expect(result).toBe(0);
    });
  });

  // =========================================================================
  // testWebhook
  // =========================================================================
  describe('testWebhook', () => {
    it('should throw if webhook not found', async () => {
      (prismaMock.webhook.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        webhookService.testWebhook('nonexistent', 'org-123')
      ).rejects.toThrow('Webhook not found');
    });
  });
});
