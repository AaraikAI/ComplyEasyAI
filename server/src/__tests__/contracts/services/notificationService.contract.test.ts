/**
 * Notification Service Contract Tests
 *
 * Verifies the contract for notification creation, delivery channels,
 * template rendering, and preference handling.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockNotification } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

jest.mock('../../../services/websocketService', () => ({
  __esModule: true,
  default: {
    sendToUser: jest.fn(),
    broadcastToOrganization: jest.fn(),
    initialize: jest.fn(),
  },
}));

jest.mock('../../../services/integrations/slackService', () => ({
  __esModule: true,
  default: {
    sendDirectMessage: jest.fn().mockResolvedValue(true),
    sendMessage: jest.fn().mockResolvedValue(true),
  },
}));

import notificationService from '../../../services/notificationService';

describe('NotificationService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // sendNotification
  // ---------------------------------------------------------------------------
  describe('sendNotification', () => {
    it('should create notification record in Prisma with correct shape', async () => {
      prismaMock.notification.create.mockResolvedValue(
        createMockNotification({ id: 'notif-1', status: 'pending' })
      );
      prismaMock.notification.update.mockResolvedValue(
        createMockNotification({ id: 'notif-1', status: 'sent' })
      );
      prismaMock.notificationPreference.findUnique.mockResolvedValue(null);
      prismaMock.integration.findFirst.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await notificationService.sendNotification('user-123', 'org-123', {
        type: 'info',
        category: 'compliance',
        title: 'Framework Updated',
        message: 'SOC 2 progress changed to 85%',
        link: '/frameworks/soc2',
      });

      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          organizationId: 'org-123',
          type: 'info',
          category: 'compliance',
          title: 'Framework Updated',
          message: 'SOC 2 progress changed to 85%',
          link: '/frameworks/soc2',
          status: 'pending',
          retryCount: 0,
        }),
      });
    });

    it('should update notification status after delivery', async () => {
      prismaMock.notification.create.mockResolvedValue(
        createMockNotification({ id: 'notif-1' })
      );
      prismaMock.notification.update.mockResolvedValue(
        createMockNotification({ id: 'notif-1', status: 'sent' })
      );
      prismaMock.notificationPreference.findUnique.mockResolvedValue(null);
      prismaMock.integration.findFirst.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await notificationService.sendNotification('user-123', 'org-123', {
        type: 'warning',
        category: 'risk',
        title: 'Risk Alert',
        message: 'New critical risk identified',
      });

      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: { id: expect.any(String) },
        data: expect.objectContaining({
          status: expect.stringMatching(/sent|failed/),
          sentAt: expect.any(Date),
        }),
      });
    });

    it('should return a notification object', async () => {
      const mockNotif = createMockNotification({ id: 'notif-2' });
      prismaMock.notification.create.mockResolvedValue(mockNotif);
      prismaMock.notification.update.mockResolvedValue(mockNotif);
      prismaMock.notificationPreference.findUnique.mockResolvedValue(null);
      prismaMock.integration.findFirst.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await notificationService.sendNotification('user-123', 'org-123', {
        type: 'success',
        category: 'audit',
        title: 'Audit Complete',
        message: 'Annual audit completed',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
    });

    it('should propagate errors from notification creation', async () => {
      prismaMock.notification.create.mockRejectedValue(
        new Error('Database connection lost')
      );

      await expect(
        notificationService.sendNotification('user-123', 'org-123', {
          type: 'error',
          category: 'system',
          title: 'Error',
          message: 'System error occurred',
        })
      ).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Template system
  // ---------------------------------------------------------------------------
  describe('templates', () => {
    it('should apply template when templateId is provided', async () => {
      prismaMock.notification.create.mockResolvedValue(createMockNotification());
      prismaMock.notification.update.mockResolvedValue(createMockNotification());
      prismaMock.notificationPreference.findUnique.mockResolvedValue(null);
      prismaMock.integration.findFirst.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await notificationService.sendNotification('user-123', 'org-123', {
        type: 'info',
        category: 'issues',
        title: 'placeholder',
        message: 'placeholder',
        templateId: 'issue_assigned',
        metadata: {
          title: 'Critical Bug',
          description: 'Found a bug',
          priority: 'High',
          dueDate: '2026-04-01',
          link: '/issues/123',
        },
      });

      // Template should replace the title and message
      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: expect.stringContaining('Critical Bug'),
          message: expect.stringContaining('Critical Bug'),
        }),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Notification type contract
  // ---------------------------------------------------------------------------
  describe('notification types', () => {
    it('should accept all valid notification types', async () => {
      prismaMock.notification.create.mockResolvedValue(createMockNotification());
      prismaMock.notification.update.mockResolvedValue(createMockNotification());
      prismaMock.notificationPreference.findUnique.mockResolvedValue(null);
      prismaMock.integration.findFirst.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(null);

      const types = ['info', 'success', 'warning', 'error', 'critical'] as const;

      for (const type of types) {
        await notificationService.sendNotification('user-123', 'org-123', {
          type,
          category: 'test',
          title: `${type} notification`,
          message: `This is a ${type} notification`,
        });
      }

      expect(prismaMock.notification.create).toHaveBeenCalledTimes(types.length);
    });
  });
});
