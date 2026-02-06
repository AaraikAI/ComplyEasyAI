/**
 * Regulatory Intelligence Fabric Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../../services/notificationService', () => ({
  __esModule: true,
  default: {
    sendNotification: jest.fn<any>().mockResolvedValue(undefined),
    notifyAdmins: jest.fn<any>().mockResolvedValue(undefined),
  },
}));

const mockGenerateContent = jest.fn<any>().mockResolvedValue({
  response: {
    text: jest.fn<any>().mockReturnValue(JSON.stringify({
      requirements: ['Implement access controls', 'Maintain audit logs'],
    })),
  },
});

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn<any>().mockImplementation(() => ({
    getGenerativeModel: jest.fn<any>().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn<any>().mockResolvedValue({
      data: '<html><body>Regulation text content</body></html>',
    }),
  },
}));

jest.mock('../../../../utils/urlValidator', () => ({
  isUrlSafe: jest.fn<any>().mockReturnValue(true),
}));

import regulatoryIntelligenceFabricService from '../../../../services/advanced/regulatoryIntelligenceFabricService';

describe('RegulatoryIntelligenceFabricService', () => {
  const orgId = 'org-123';
  const userId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Re-establish mock implementations (cleared by resetMocks)
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn<any>().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    }));
    mockGenerateContent.mockResolvedValue({
      response: {
        text: jest.fn<any>().mockReturnValue(JSON.stringify({
          requirements: ['Implement access controls', 'Maintain audit logs'],
        })),
      },
    });

    const axios = require('axios').default;
    axios.get.mockResolvedValue({
      data: '<html><body>Regulation text content</body></html>',
    });

    const { isUrlSafe } = require('../../../../utils/urlValidator');
    isUrlSafe.mockReturnValue(true);

    const notificationService = require('../../../../services/notificationService').default;
    notificationService.sendNotification.mockResolvedValue(undefined);
    notificationService.notifyAdmins.mockResolvedValue(undefined);

    // Prisma mocks
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.auditLog.findFirst as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.frameworkControl.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.user.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.regulatoryChange.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.regulatoryChange.findUnique as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.regulatoryChange.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.regulatoryChange.update as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.regulatoryFeed.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.regulatoryFeed.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.regulatoryFeed.delete as jest.Mock<any>).mockResolvedValue({});
  });

  describe('ingestRegulation', () => {
    it('should ingest regulation from text', async () => {
      (prismaMock.regulatoryChange.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.regulatoryChange.create as jest.Mock<any>).mockResolvedValue({
        id: 'reg-1',
        organizationId: orgId,
        regulationName: 'GDPR Amendment',
        jurisdiction: 'EU',
        status: 'analyzed',
        extractedRequirements: ['Implement DPA', 'Update consent forms'],
        affectedFrameworks: ['fw-1'],
        createdAt: new Date(),
      });
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([
        {
          id: 'fw-1',
          name: 'GDPR',
          controls: [
            { id: 'c-1', name: 'Data Protection', description: 'data protection agreement' },
          ],
        },
      ]);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.user.findMany as jest.Mock<any>).mockResolvedValue([
        { id: userId, role: 'Admin', email: 'admin@test.com' },
      ]);

      const result = await regulatoryIntelligenceFabricService.ingestRegulation(
        orgId,
        { text: 'New GDPR amendment requires organizations to implement data protection agreements...' },
        {
          name: 'GDPR Amendment',
          jurisdiction: 'EU',
          effectiveDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
        userId
      );

      expect(result).toBeDefined();
      expect(result.regulationName).toBe('GDPR Amendment');
      expect(result.jurisdiction).toBe('EU');
    });

    it('should throw error when no input provided', async () => {
      await expect(
        regulatoryIntelligenceFabricService.ingestRegulation(
          orgId,
          {},
          {
            name: 'Test',
            jurisdiction: 'US',
            effectiveDate: new Date(),
          },
          userId
        )
      ).rejects.toThrow('No input provided');
    });

    it('should detect duplicate regulations', async () => {
      (prismaMock.regulatoryChange.findMany as jest.Mock<any>).mockResolvedValue([
        {
          id: 'existing-1',
          regulationName: 'GDPR Amendment',
          regulationText: 'Same regulation text content',
        },
      ]);

      await expect(
        regulatoryIntelligenceFabricService.ingestRegulation(
          orgId,
          { text: 'Same regulation text content' },
          {
            name: 'GDPR Amendment',
            jurisdiction: 'EU',
            effectiveDate: new Date(),
          },
          userId
        )
      ).rejects.toThrow('Duplicate regulation');
    });
  });

  describe('detectConflicts', () => {
    it('should detect jurisdiction conflicts', async () => {
      (prismaMock.regulatoryChange.findMany as jest.Mock<any>).mockResolvedValue([
        {
          id: 'reg-1',
          regulationName: 'GDPR',
          jurisdiction: 'EU',
          affectedFrameworks: ['fw-1'],
          extractedRequirements: ['Must encrypt all PII data'],
          regulationText: 'GDPR regulation text',
        },
      ]);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'fw-1', name: 'GDPR', controls: [] },
      ]);

      const conflicts = await regulatoryIntelligenceFabricService.detectConflicts(
        'US',
        ['fw-1'],
        orgId
      );

      expect(conflicts).toBeDefined();
      expect(Array.isArray(conflicts)).toBe(true);
    });
  });

  describe('autoUpdateControls', () => {
    it('should auto-update controls based on regulatory change', async () => {
      (prismaMock.regulatoryChange.findUnique as jest.Mock<any>).mockResolvedValue({
        id: 'reg-1',
        organizationId: orgId,
        autoGeneratedControls: [
          { name: 'New Control 1', description: 'Implement new requirement' },
        ],
        extractedRequirements: ['Must implement access controls'],
        regulationName: 'Test Regulation',
        affectedFrameworks: ['fw-1'],
      });
      (prismaMock.regulatoryChange.update as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'fw-1', name: 'SOC2', controls: [] },
      ]);
      (prismaMock.frameworkControl.findFirst as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.frameworkControl.create as jest.Mock<any>).mockResolvedValue({
        id: 'new-ctrl',
        name: 'New Control 1',
      });
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.user.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await regulatoryIntelligenceFabricService.autoUpdateControls(
        orgId,
        'reg-1',
        userId
      );

      expect(result).toBeDefined();
    });

    it('should throw error if regulatory change not found', async () => {
      (prismaMock.regulatoryChange.findUnique as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        regulatoryIntelligenceFabricService.autoUpdateControls(orgId, 'nonexistent', userId)
      ).rejects.toThrow();
    });
  });

  describe('addFeed', () => {
    it('should add a regulatory feed', async () => {
      (prismaMock.regulatoryFeed.create as jest.Mock<any>).mockResolvedValue({
        id: 'feed-1',
        name: 'SEC Feed',
        url: 'https://sec.gov/rss',
        feedType: 'rss',
        jurisdiction: 'US',
        pollingInterval: 60,
        status: 'active',
        organizationId: orgId,
      });
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const result = await regulatoryIntelligenceFabricService.addFeed(
        orgId,
        {
          name: 'SEC Feed',
          url: 'https://sec.gov/rss',
          feedType: 'rss',
          jurisdiction: 'US',
          pollingInterval: 60,
        },
        userId
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('SEC Feed');
    });
  });

  describe('getFeeds', () => {
    it('should return feeds for an organization', async () => {
      (prismaMock.regulatoryFeed.findMany as jest.Mock<any>).mockResolvedValue([
        { id: 'feed-1', name: 'SEC', status: 'active' },
      ]);

      const result = await regulatoryIntelligenceFabricService.getFeeds(orgId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('removeFeed', () => {
    it('should remove a regulatory feed', async () => {
      (prismaMock.regulatoryFeed.delete as jest.Mock<any>).mockResolvedValue({ id: 'feed-1' });
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await expect(
        regulatoryIntelligenceFabricService.removeFeed(orgId, 'feed-1', userId)
      ).resolves.not.toThrow();
    });
  });

  describe('getRegulatoryChanges', () => {
    it('should return regulatory changes for an organization', async () => {
      (prismaMock.regulatoryChange.findMany as jest.Mock<any>).mockResolvedValue([
        {
          id: 'reg-1',
          regulationName: 'GDPR Update',
          jurisdiction: 'EU',
          status: 'analyzed',
        },
      ]);

      const result = await regulatoryIntelligenceFabricService.getRegulatoryChanges(orgId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('resolveConflict', () => {
    it('should resolve a jurisdiction conflict', async () => {
      (prismaMock.auditLog.findFirst as jest.Mock<any>).mockResolvedValue({
        id: 'conflict-log-1',
        details: JSON.stringify({
          conflicts: [{ id: 'conflict-1', regulation1: 'GDPR', regulation2: 'CCPA' }],
        }),
      });
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const result = await regulatoryIntelligenceFabricService.resolveConflict(
        orgId,
        'conflict-1',
        'Apply GDPR requirements as they are stricter',
        userId
      );

      expect(result).toBeDefined();
    });
  });
});
