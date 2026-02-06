/**
 * Notification Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockUser } from '../../mocks/prisma';

// Add missing models to prismaMock
const createMockFn = (): jest.Mock<(...args: any[]) => any> => jest.fn() as jest.Mock<(...args: any[]) => any>;

(prismaMock as any).notification = {
  findUnique: createMockFn(),
  findFirst: createMockFn(),
  findMany: createMockFn(),
  create: createMockFn(),
  update: createMockFn(),
  delete: createMockFn(),
  count: createMockFn(),
};
(prismaMock as any).notificationPreference = {
  findUnique: createMockFn(),
  findFirst: createMockFn(),
  create: createMockFn(),
  update: createMockFn(),
};

// Mock the database
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

// Mock SendGrid
const mockSgMailSend = jest.fn() as jest.Mock<any>;
const mockSgMailSetApiKey = jest.fn() as jest.Mock<any>;
jest.mock('@sendgrid/mail', () => ({
  __esModule: true,
  default: {
    setApiKey: mockSgMailSetApiKey,
    send: mockSgMailSend,
  },
}));

// Mock websocketService
const mockSendNotification = jest.fn() as jest.Mock<any>;
jest.mock('../../../services/websocketService', () => ({
  __esModule: true,
  default: {
    sendNotification: mockSendNotification,
  },
}));

// Mock slackService
const mockGetIntegration = jest.fn() as jest.Mock<any>;
const mockSendComplianceNotification = jest.fn() as jest.Mock<any>;
jest.mock('../../../services/integrations/slackService', () => ({
  __esModule: true,
  default: {
    getIntegration: mockGetIntegration,
    sendComplianceNotification: mockSendComplianceNotification,
  },
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('test-uuid-1234'),
  randomBytes: jest.fn().mockReturnValue({ toString: () => 'mock-hash' }),
}));

// Import after mocking
import notificationService from '../../../services/notificationService';

// Helper
const mockNotificationRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'test-uuid-1234',
  userId: 'user-123',
  organizationId: 'org-123',
  type: 'info',
  category: 'compliance',
  title: 'Test Notification',
  message: 'Test message',
  channels: ['websocket'],
  templateId: null,
  metadata: {},
  link: null,
  sentAt: null,
  deliveredAt: null,
  readAt: null,
  status: 'pending',
  retryCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset env
    delete process.env.SENDGRID_API_KEY;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
  });

  // ======================================================================
  // sendNotification
  // ======================================================================
  describe('sendNotification()', () => {
    it('should create and send a notification via websocket', async () => {
      (prismaMock as any).notificationPreference.findUnique.mockResolvedValue(null);
      (prismaMock as any).notification.create.mockResolvedValue(mockNotificationRecord());
      (prismaMock as any).notification.update.mockResolvedValue(mockNotificationRecord({ status: 'sent' }));
      mockSendNotification.mockReturnValue(undefined);

      const result = await notificationService.sendNotification('user-123', 'org-123', {
        type: 'info',
        category: 'compliance',
        title: 'Test Notification',
        message: 'Test message',
        channels: ['websocket'],
      });

      expect(result).toHaveProperty('id');
      expect(result.type).toBe('info');
      expect(result.title).toBe('Test Notification');
      expect((prismaMock as any).notification.create).toHaveBeenCalledTimes(1);
      expect(mockSendNotification).toHaveBeenCalledWith('user-123', expect.objectContaining({
        title: 'Test Notification',
        message: 'Test message',
      }));
    });

    it('should use template when templateId is provided', async () => {
      (prismaMock as any).notificationPreference.findUnique.mockResolvedValue(null);
      (prismaMock as any).notification.create.mockResolvedValue(
        mockNotificationRecord({ templateId: 'issue_assigned' })
      );
      (prismaMock as any).notification.update.mockResolvedValue({});
      mockSendNotification.mockReturnValue(undefined);

      const result = await notificationService.sendNotification('user-123', 'org-123', {
        type: 'info',
        category: 'issues',
        title: 'Placeholder',
        message: 'Placeholder',
        templateId: 'issue_assigned',
        metadata: { title: 'Critical Bug', description: 'Fix ASAP', priority: 'High', dueDate: '2025-01-01', link: '/issues/1' },
        channels: ['websocket'],
      });

      expect(result).toHaveProperty('id');
    });

    it('should mark notification as failed when delivery fails', async () => {
      // Use a unique userId to avoid internal preferences cache from prior tests
      const uniqueUserId = 'user-no-websocket';
      (prismaMock as any).notificationPreference.findUnique.mockResolvedValue({
        userId: uniqueUserId,
        email: false,
        slack: false,
        websocket: false,
        sms: false,
        categories: {},
      });
      (prismaMock as any).notification.create.mockResolvedValue(
        mockNotificationRecord({ userId: uniqueUserId })
      );
      (prismaMock as any).notification.update.mockResolvedValue(
        mockNotificationRecord({ userId: uniqueUserId, status: 'failed' })
      );

      const result = await notificationService.sendNotification(uniqueUserId, 'org-123', {
        type: 'info',
        category: 'compliance',
        title: 'Test',
        message: 'Test',
        channels: ['websocket'],
      });

      expect((prismaMock as any).notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'failed',
          }),
        })
      );
    });

    it('should map critical notification type to error for websocket', async () => {
      (prismaMock as any).notificationPreference.findUnique.mockResolvedValue(null);
      (prismaMock as any).notification.create.mockResolvedValue(mockNotificationRecord({ type: 'critical' }));
      (prismaMock as any).notification.update.mockResolvedValue({});
      mockSendNotification.mockReturnValue(undefined);

      await notificationService.sendNotification('user-123', 'org-123', {
        type: 'critical',
        category: 'security',
        title: 'Critical Alert',
        message: 'Critical issue',
        channels: ['websocket'],
      });

      expect(mockSendNotification).toHaveBeenCalledWith('user-123', expect.objectContaining({
        type: 'error',
      }));
    });

    it('should throw when notification creation fails', async () => {
      (prismaMock as any).notificationPreference.findUnique.mockResolvedValue(null);
      (prismaMock as any).notification.create.mockRejectedValue(new Error('DB error'));

      await expect(
        notificationService.sendNotification('user-123', 'org-123', {
          type: 'info',
          category: 'test',
          title: 'Test',
          message: 'Test',
        })
      ).rejects.toThrow('DB error');
    });
  });

  // ======================================================================
  // getUserPreferences
  // ======================================================================
  describe('getUserPreferences()', () => {
    it('should return stored preferences from database', async () => {
      const dbPrefs = {
        userId: 'user-456',
        email: true,
        slack: false,
        websocket: true,
        sms: false,
        categories: { compliance: { email: true, slack: false, websocket: true, sms: false } },
      };
      (prismaMock as any).notificationPreference.findUnique.mockResolvedValue(dbPrefs);

      const result = await notificationService.getUserPreferences('user-456');

      expect(result.email).toBe(true);
      expect(result.slack).toBe(false);
      expect(result.websocket).toBe(true);
      expect(result.sms).toBe(false);
      expect(result.categories).toHaveProperty('compliance');
    });

    it('should return default preferences when none stored', async () => {
      (prismaMock as any).notificationPreference.findUnique.mockResolvedValue(null);

      const result = await notificationService.getUserPreferences('user-new');

      expect(result.email).toBe(true);
      expect(result.slack).toBe(true);
      expect(result.websocket).toBe(true);
      expect(result.sms).toBe(false);
      expect(result.categories).toEqual({});
    });
  });

  // ======================================================================
  // markAsRead
  // ======================================================================
  describe('markAsRead()', () => {
    it('should mark notification as read', async () => {
      (prismaMock as any).notification.update.mockResolvedValue(
        mockNotificationRecord({ readAt: new Date(), status: 'read' })
      );

      await notificationService.markAsRead('notif-123', 'user-123');

      expect((prismaMock as any).notification.update).toHaveBeenCalledWith({
        where: {
          id: 'notif-123',
          userId: 'user-123',
        },
        data: expect.objectContaining({
          status: 'read',
        }),
      });
    });
  });

  // ======================================================================
  // getUserNotifications
  // ======================================================================
  describe('getUserNotifications()', () => {
    it('should return user notifications', async () => {
      const notifications = [
        mockNotificationRecord(),
        mockNotificationRecord({ id: 'notif-2', title: 'Second' }),
      ];
      (prismaMock as any).notification.findMany.mockResolvedValue(notifications);

      const result = await notificationService.getUserNotifications('user-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('message');
      expect(result[0]).toHaveProperty('status');
    });

    it('should filter for unread only when specified', async () => {
      (prismaMock as any).notification.findMany.mockResolvedValue([]);

      await notificationService.getUserNotifications('user-123', { unreadOnly: true });

      expect((prismaMock as any).notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
            readAt: null,
          }),
        })
      );
    });

    it('should apply limit and offset', async () => {
      (prismaMock as any).notification.findMany.mockResolvedValue([]);

      await notificationService.getUserNotifications('user-123', { limit: 10, offset: 5 });

      expect((prismaMock as any).notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 5,
        })
      );
    });

    it('should apply default limit of 50 and offset of 0', async () => {
      (prismaMock as any).notification.findMany.mockResolvedValue([]);

      await notificationService.getUserNotifications('user-123');

      expect((prismaMock as any).notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0,
        })
      );
    });
  });
});
