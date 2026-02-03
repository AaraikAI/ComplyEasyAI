/**
 * Slack Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock Slack WebClient
const mockChatPostMessage = jest.fn() as jest.Mock<any>;
const mockConversationsList = jest.fn() as jest.Mock<any>;

jest.mock('@slack/web-api', () => ({
  WebClient: (jest.fn() as jest.Mock<any>).mockImplementation(() => ({
    chat: {
      postMessage: mockChatPostMessage,
    },
    conversations: {
      list: mockConversationsList,
    },
  })),
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import slackService from '../../../../services/integrations/slackService';

describe('SlackService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('postMessage()', () => {
    it('should post message to Slack channel', async () => {
      const organizationId = 'org-123';
      const channel = '#compliance';
      const text = 'Test message';

      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'integration-123',
        accessToken: 'xoxb-test-token',
      } as any);

      mockChatPostMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456',
      });

      const result = await slackService.postMessage(organizationId, channel, text);

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

