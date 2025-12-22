/**
 * Slack Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock Slack WebClient
const mockChatPostMessage = jest.fn();
const mockConversationsList = jest.fn();

jest.mock('@slack/web-api', () => ({
  WebClient: jest.fn().mockImplementation(() => ({
    chat: {
      postMessage: mockChatPostMessage,
    },
    conversations: {
      list: mockConversationsList,
    },
  })),
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

import slackService from '../../../../services/integrations/slackService';

describe('SlackService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage()', () => {
    it('should send message to Slack channel', async () => {
      const integrationId = 'integration-123';
      const message = {
        channel: '#compliance',
        text: 'Test message',
      };

      prismaMock.integration.findUnique.mockResolvedValue({
        id: integrationId,
        accessToken: 'xoxb-test-token',
      } as any);

      mockChatPostMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456',
      });

      const result = await slackService.sendMessage(integrationId, message);

      expect(result).toHaveProperty('ok', true);
      expect(result).toHaveProperty('ts');
    });
  });

  describe('listChannels()', () => {
    it('should list Slack channels', async () => {
      const integrationId = 'integration-123';

      prismaMock.integration.findUnique.mockResolvedValue({
        id: integrationId,
        accessToken: 'xoxb-test-token',
      } as any);

      mockConversationsList.mockResolvedValue({
        ok: true,
        channels: [
          { id: 'C123', name: 'general' },
          { id: 'C456', name: 'compliance' },
        ],
      });

      const result = await slackService.listChannels(integrationId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });
});

