/**
 * Multimodal Intake Service Unit Tests - Comprehensive Coverage
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
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

const mockGenerateContent = jest.fn<any>().mockResolvedValue({
  response: {
    text: jest.fn<any>().mockReturnValue(JSON.stringify({
      extractedData: { title: 'Test', content: 'Extracted content' },
      requirements: ['Requirement 1'],
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

jest.mock('../../../../services/notificationService', () => ({
  __esModule: true,
  default: {
    sendNotification: jest.fn<any>().mockResolvedValue(undefined),
  },
}));

import multimodalIntakeService from '../../../../services/advanced/multimodalIntakeService';

describe('MultimodalIntakeService', () => {
  const orgId = 'org-123';
  const userId = 'user-123';

  const mockIntake = {
    id: 'intake-1',
    organizationId: orgId,
    sourceType: 'document',
    fileName: 'test.pdf',
    mimeType: 'application/pdf',
    status: 'completed',
    extractedData: {
      title: 'Test Document',
      content: 'Document content',
      requirements: ['Req 1', 'Req 2'],
    },
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn<any>().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    }));
    mockGenerateContent.mockResolvedValue({
      response: {
        text: jest.fn<any>().mockReturnValue(JSON.stringify({
          extractedData: { title: 'Test', content: 'Extracted content' },
          requirements: ['Requirement 1'],
        })),
      },
    });

    (prismaMock.multimodalIntake.create as jest.Mock<any>).mockResolvedValue(mockIntake);
    (prismaMock.multimodalIntake.findFirst as jest.Mock<any>).mockResolvedValue(mockIntake);
    (prismaMock.multimodalIntake.findMany as jest.Mock<any>).mockResolvedValue([mockIntake]);
    (prismaMock.multimodalIntake.findUnique as jest.Mock<any>).mockResolvedValue(mockIntake);
    (prismaMock.multimodalIntake.update as jest.Mock<any>).mockResolvedValue(mockIntake);
    (prismaMock.multimodalIntake.delete as jest.Mock<any>).mockResolvedValue(mockIntake);
    (prismaMock.multimodalIntake.count as jest.Mock<any>).mockResolvedValue(1);
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([]);
    (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([]);
  });

  // ===================== processDocument =====================
  describe('processDocument', () => {
    it('should process a text document', async () => {
      const result = await multimodalIntakeService.processDocument(orgId, {
        content: 'This is a compliance document about data protection requirements.',
        fileName: 'policy.txt',
        mimeType: 'text/plain',
      }, userId);

      expect(result).toBeDefined();
      expect(prismaMock.multimodalIntake.create).toHaveBeenCalled();
    });

    it('should process a PDF document buffer', async () => {
      const result = await multimodalIntakeService.processDocument(orgId, {
        buffer: Buffer.from('PDF content'),
        fileName: 'policy.pdf',
        mimeType: 'application/pdf',
      }, userId);

      expect(result).toBeDefined();
    });

    it('should process an image document', async () => {
      const result = await multimodalIntakeService.processDocument(orgId, {
        buffer: Buffer.from('image content'),
        fileName: 'screenshot.png',
        mimeType: 'image/png',
      }, userId);

      expect(result).toBeDefined();
    });

    it('should process a spreadsheet', async () => {
      const result = await multimodalIntakeService.processDocument(orgId, {
        content: 'col1,col2\nval1,val2',
        fileName: 'data.csv',
        mimeType: 'text/csv',
      }, userId);

      expect(result).toBeDefined();
    });

    it('should handle AI extraction failure gracefully', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('AI unavailable'));

      const result = await multimodalIntakeService.processDocument(orgId, {
        content: 'Test content',
        fileName: 'test.txt',
        mimeType: 'text/plain',
      }, userId);

      expect(result).toBeDefined();
    });
  });

  // ===================== processAudio =====================
  describe('processAudio', () => {
    it('should process an audio file', async () => {
      const result = await multimodalIntakeService.processAudio(orgId, {
        buffer: Buffer.from('audio data'),
        fileName: 'recording.mp3',
        mimeType: 'audio/mpeg',
        duration: 120,
      }, userId);

      expect(result).toBeDefined();
    });

    it('should process a WAV audio file', async () => {
      const result = await multimodalIntakeService.processAudio(orgId, {
        buffer: Buffer.from('wav audio data'),
        fileName: 'recording.wav',
        mimeType: 'audio/wav',
        duration: 60,
      }, userId);

      expect(result).toBeDefined();
    });
  });

  // ===================== processVideo =====================
  describe('processVideo', () => {
    it('should process a video file', async () => {
      const result = await multimodalIntakeService.processVideo(orgId, {
        buffer: Buffer.from('video data'),
        fileName: 'compliance_training.mp4',
        mimeType: 'video/mp4',
        duration: 300,
      }, userId);

      expect(result).toBeDefined();
    });
  });

  // ===================== processEmail =====================
  describe('processEmail', () => {
    it('should process an email', async () => {
      const result = await multimodalIntakeService.processEmail(orgId, {
        from: 'auditor@example.com',
        to: ['compliance@company.com'],
        subject: 'Audit Findings',
        body: 'Please find attached the audit findings for Q4 2025.',
        attachments: [],
      }, userId);

      expect(result).toBeDefined();
    });

    it('should process email with attachments', async () => {
      const result = await multimodalIntakeService.processEmail(orgId, {
        from: 'auditor@example.com',
        to: ['compliance@company.com'],
        subject: 'Audit Report',
        body: 'See attached report.',
        attachments: [
          { fileName: 'report.pdf', mimeType: 'application/pdf', content: Buffer.from('pdf content') },
        ],
      }, userId);

      expect(result).toBeDefined();
    });
  });

  // ===================== processWebhook =====================
  describe('processWebhook', () => {
    it('should process a webhook payload', async () => {
      const result = await multimodalIntakeService.processWebhook(orgId, {
        source: 'github',
        event: 'push',
        payload: { repository: 'org/repo', branch: 'main' },
      }, userId);

      expect(result).toBeDefined();
    });

    it('should process a Jira webhook', async () => {
      const result = await multimodalIntakeService.processWebhook(orgId, {
        source: 'jira',
        event: 'issue_created',
        payload: { issue: { key: 'COMP-123', summary: 'New compliance task' } },
      }, userId);

      expect(result).toBeDefined();
    });
  });

  // ===================== getIntakes =====================
  describe('getIntakes', () => {
    it('should return all intakes for an organization', async () => {
      const result = await multimodalIntakeService.getIntakes(orgId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter by source type', async () => {
      const result = await multimodalIntakeService.getIntakes(orgId, { sourceType: 'document' });
      expect(result).toBeDefined();
    });

    it('should filter by status', async () => {
      const result = await multimodalIntakeService.getIntakes(orgId, { status: 'completed' });
      expect(result).toBeDefined();
    });

    it('should return empty array when no intakes', async () => {
      (prismaMock.multimodalIntake.findMany as jest.Mock<any>).mockResolvedValue([]);

      const result = await multimodalIntakeService.getIntakes(orgId);
      expect(result).toEqual([]);
    });
  });

  // ===================== getIntake =====================
  describe('getIntake', () => {
    it('should get an intake by ID', async () => {
      const result = await multimodalIntakeService.getIntake('intake-1', orgId);
      expect(result).toBeDefined();
    });

    it('should throw when intake not found', async () => {
      (prismaMock.multimodalIntake.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        multimodalIntakeService.getIntake('nonexistent', orgId)
      ).rejects.toThrow();
    });
  });

  // ===================== deleteIntake =====================
  describe('deleteIntake', () => {
    it('should delete an intake', async () => {
      await expect(
        multimodalIntakeService.deleteIntake('intake-1', orgId)
      ).resolves.not.toThrow();

      expect(prismaMock.multimodalIntake.delete).toHaveBeenCalled();
    });

    it('should throw when intake not found', async () => {
      (prismaMock.multimodalIntake.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        multimodalIntakeService.deleteIntake('nonexistent', orgId)
      ).rejects.toThrow();
    });
  });

  // ===================== reprocessIntake =====================
  describe('reprocessIntake', () => {
    it('should reprocess an existing intake', async () => {
      const result = await multimodalIntakeService.reprocessIntake('intake-1', orgId);
      expect(result).toBeDefined();
    });

    it('should throw when intake not found', async () => {
      (prismaMock.multimodalIntake.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        multimodalIntakeService.reprocessIntake('nonexistent', orgId)
      ).rejects.toThrow();
    });
  });

  // ===================== getIntakeStatistics =====================
  describe('getIntakeStatistics', () => {
    it('should return intake statistics', async () => {
      const result = await multimodalIntakeService.getIntakeStatistics(orgId);
      expect(result).toBeDefined();
    });

    it('should handle no intakes in statistics', async () => {
      (prismaMock.multimodalIntake.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.multimodalIntake.count as jest.Mock<any>).mockResolvedValue(0);

      const result = await multimodalIntakeService.getIntakeStatistics(orgId);
      expect(result).toBeDefined();
    });
  });

  // ===================== bulkProcess =====================
  describe('bulkProcess', () => {
    it('should process multiple documents at once', async () => {
      const result = await multimodalIntakeService.bulkProcess(orgId, [
        { content: 'Doc 1', fileName: 'doc1.txt', mimeType: 'text/plain' },
        { content: 'Doc 2', fileName: 'doc2.txt', mimeType: 'text/plain' },
      ], userId);

      expect(result).toBeDefined();
      expect(result.successful).toBeDefined();
      expect(result.failed).toBeDefined();
    });

    it('should handle empty document list', async () => {
      const result = await multimodalIntakeService.bulkProcess(orgId, [], userId);
      expect(result.successful).toHaveLength(0);
    });

    it('should handle partial failures in bulk processing', async () => {
      (prismaMock.multimodalIntake.create as jest.Mock<any>)
        .mockResolvedValueOnce(mockIntake)
        .mockRejectedValueOnce(new Error('DB error'));

      const result = await multimodalIntakeService.bulkProcess(orgId, [
        { content: 'Doc 1', fileName: 'doc1.txt', mimeType: 'text/plain' },
        { content: 'Doc 2', fileName: 'doc2.txt', mimeType: 'text/plain' },
      ], userId);

      expect(result).toBeDefined();
    });
  });

  // ===================== mapToFramework =====================
  describe('mapToFramework', () => {
    it('should map intake findings to frameworks', async () => {
      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([
        {
          id: 'fw-1',
          name: 'SOC 2',
          controls: [{ id: 'c-1', name: 'CC1.1', description: 'Control Environment' }],
        },
      ]);

      const result = await multimodalIntakeService.mapToFramework('intake-1', orgId);
      expect(result).toBeDefined();
    });

    it('should handle intake not found in mapping', async () => {
      (prismaMock.multimodalIntake.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        multimodalIntakeService.mapToFramework('nonexistent', orgId)
      ).rejects.toThrow();
    });
  });

  // ===================== error handling =====================
  describe('error handling', () => {
    it('should handle database error in processDocument', async () => {
      (prismaMock.multimodalIntake.create as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

      await expect(
        multimodalIntakeService.processDocument(orgId, {
          content: 'Test',
          fileName: 'test.txt',
          mimeType: 'text/plain',
        }, userId)
      ).rejects.toThrow();
    });

    it('should handle database error in getIntakes', async () => {
      (prismaMock.multimodalIntake.findMany as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

      await expect(
        multimodalIntakeService.getIntakes(orgId)
      ).rejects.toThrow();
    });
  });
});
