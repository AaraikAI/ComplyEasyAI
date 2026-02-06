/**
 * Slack Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock axios (the service uses axios, not @slack/web-api)
const mockAxiosGet = jest.fn() as jest.Mock<any>;
const mockAxiosPost = jest.fn() as jest.Mock<any>;

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: mockAxiosGet,
    post: mockAxiosPost,
  },
}));

jest.mock('../../../../config', () => ({
  __esModule: true,
  default: {
    oauth: {
      slack: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        callbackUrl: 'http://localhost:3001/api/integrations/slack/callback',
      },
    },
  },
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
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

      // postMessage calls getIntegration -> prisma.integration.findUnique
      prismaMock.integration.findUnique.mockResolvedValue({
        id: 'integration-123',
        provider: 'slack',
        connected: true,
        accessToken: 'xoxb-test-token',
      } as any);

      // postMessage uses axios.post to call Slack API
      mockAxiosPost.mockResolvedValue({
        data: {
          ok: true,
          channel: channel,
          ts: '1234567890.123456',
          message: { text: text },
        },
      });

      const result = await slackService.postMessage(organizationId, channel, text);

      expect(result).toHaveProperty('channel');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('listChannels()', () => {
    it('should list Slack channels', async () => {
      const organizationId = 'org-123';

      // listChannels calls getIntegration -> prisma.integration.findUnique
      prismaMock.integration.findUnique.mockResolvedValue({
        id: 'integration-123',
        provider: 'slack',
        connected: true,
        accessToken: 'xoxb-test-token',
      } as any);

      // listChannels calls makeRequest -> axios.get
      mockAxiosGet.mockResolvedValue({
        data: {
          ok: true,
          channels: [
            { id: 'C123', name: 'general', is_private: false, is_member: true, num_members: 10, topic: { value: '' }, purpose: { value: '' }, created: 1609459200 },
            { id: 'C456', name: 'compliance', is_private: false, is_member: true, num_members: 5, topic: { value: '' }, purpose: { value: '' }, created: 1609459200 },
          ],
        },
      });

      const result = await slackService.listChannels(organizationId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });
});
