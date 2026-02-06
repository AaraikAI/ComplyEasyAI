/**
 * Evidence Truth Layer Service Unit Tests
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

jest.mock('../../../../services/advanced/mlModelsService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    detectDeepfake: (jest.fn() as jest.Mock<any>).mockResolvedValue({
      isDeepfake: false,
      confidence: 0.95,
      model: 'test-model',
      details: {},
    }),
    detectLiveness: (jest.fn() as jest.Mock<any>).mockResolvedValue({
      isLive: true,
      confidence: 0.9,
    }),
  },
}));

jest.mock('../../../../services/advanced/byokService', () => ({
  __esModule: true,
  default: {
    getOrganizationKey: (jest.fn() as jest.Mock<any>).mockResolvedValue(null),
    signWithKey: (jest.fn() as jest.Mock<any>).mockResolvedValue(null),
    verifyWithKey: (jest.fn() as jest.Mock<any>).mockResolvedValue(null),
  },
}));

jest.mock('ntp-client', () => ({
  __esModule: true,
  default: {
    getNetworkTime: jest.fn(),
  },
}));

jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = jest.fn<any>().mockReturnValue({
    ffprobe: jest.fn(),
    outputOptions: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    run: jest.fn(),
  });
  return { __esModule: true, default: mockFfmpeg };
});

jest.mock('fs', () => ({
  existsSync: jest.fn<any>().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn<any>().mockReturnValue(Buffer.alloc(100)),
  unlinkSync: jest.fn(),
  createReadStream: jest.fn(),
}));

import evidenceTruthLayerService from '../../../../services/advanced/evidenceTruthLayerService';

describe('EvidenceTruthLayerService', () => {
  const orgId = 'org-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeEvidence', () => {
    it('should analyze evidence and return analysis result', async () => {
      const fileBuffer = Buffer.alloc(1024, 'a');
      const metadata = {
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
      };

      (prismaMock.evidenceAnalysis as any) = {
        create: jest.fn<any>().mockResolvedValue({ id: 'analysis-1' }),
      };
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.ioTDevice as any) = {
        findMany: jest.fn<any>().mockResolvedValue([]),
      };

      const result = await evidenceTruthLayerService.analyzeEvidence(
        'evidence-1',
        orgId,
        fileBuffer,
        metadata
      );

      expect(result).toBeDefined();
      expect(result.evidenceId).toBe('evidence-1');
      expect(result.cryptographicHash).toBeDefined();
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(result.overallConfidence).toBeLessThanOrEqual(1);
      expect(['verified', 'suspicious', 'failed']).toContain(result.verificationStatus);
    });

    it('should handle evidence without file buffer', async () => {
      (prismaMock.evidenceAnalysis as any) = {
        create: jest.fn<any>().mockResolvedValue({ id: 'analysis-2' }),
      };
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.ioTDevice as any) = {
        findMany: jest.fn<any>().mockResolvedValue([]),
      };

      const result = await evidenceTruthLayerService.analyzeEvidence(
        'evidence-2',
        orgId
      );

      expect(result).toBeDefined();
      expect(result.evidenceId).toBe('evidence-2');
    });

    it('should continue even if database storage fails', async () => {
      (prismaMock.evidenceAnalysis as any) = {
        create: jest.fn<any>().mockRejectedValue(new Error('DB error')),
      };
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.ioTDevice as any) = {
        findMany: jest.fn<any>().mockResolvedValue([]),
      };

      const result = await evidenceTruthLayerService.analyzeEvidence(
        'evidence-3',
        orgId,
        Buffer.alloc(100),
        { filename: 'doc.pdf', mimeType: 'application/pdf', size: 100 }
      );

      expect(result).toBeDefined();
      expect(result.evidenceId).toBe('evidence-3');
    });
  });

  describe('verifyFileHash', () => {
    it('should verify matching file hash', async () => {
      const fileBuffer = Buffer.from('test content');

      const result = await evidenceTruthLayerService.verifyFileHash(
        fileBuffer,
        fileBuffer
      );

      expect(result).toBeDefined();
      expect(result.matches).toBe(true);
    });

    it('should detect hash mismatch', async () => {
      const result = await evidenceTruthLayerService.verifyFileHash(
        Buffer.from('content A'),
        Buffer.from('content B')
      );

      expect(result).toBeDefined();
      expect(result.matches).toBe(false);
    });
  });

  describe('getEvidenceAnalysis', () => {
    it('should retrieve existing analysis', async () => {
      const mockAnalysis = {
        id: 'analysis-1',
        evidenceId: 'evidence-1',
        organizationId: orgId,
        deepfakeScore: 0.1,
        cryptographicHash: 'abc123',
        overallConfidence: 0.9,
        verificationStatus: 'verified',
        createdAt: new Date(),
      };

      (prismaMock.evidenceAnalysis as any) = {
        findFirst: jest.fn<any>().mockResolvedValue(mockAnalysis),
      };

      const result = await evidenceTruthLayerService.getEvidenceAnalysis('evidence-1', orgId);

      expect(result).toBeDefined();
      expect(result!.evidenceId).toBe('evidence-1');
    });

    it('should throw when analysis not found', async () => {
      (prismaMock.evidenceAnalysis as any) = {
        findFirst: jest.fn<any>().mockResolvedValue(null),
      };

      await expect(
        evidenceTruthLayerService.getEvidenceAnalysis('nonexistent', orgId)
      ).rejects.toThrow();
    });
  });

  describe('bulkAnalyzeEvidence', () => {
    it('should analyze multiple evidence files', async () => {
      (prismaMock.evidenceAnalysis as any) = {
        create: jest.fn<any>().mockResolvedValue({ id: 'analysis-bulk' }),
      };
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
      (prismaMock.ioTDevice as any) = {
        findMany: jest.fn<any>().mockResolvedValue([]),
      };

      const files = [
        {
          evidenceId: 'ev-1',
          fileBuffer: Buffer.alloc(100),
          metadata: { filename: 'a.jpg', mimeType: 'image/jpeg', size: 100 },
        },
        {
          evidenceId: 'ev-2',
          fileBuffer: Buffer.alloc(200),
          metadata: { filename: 'b.png', mimeType: 'image/png', size: 200 },
        },
      ];

      const result = await evidenceTruthLayerService.bulkAnalyzeEvidence(
        orgId,
        files
      );

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
    });
  });

  describe('createChainOfCustody', () => {
    it('should create chain of custody for evidence', async () => {
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      const result = await evidenceTruthLayerService.createChainOfCustody(
        'evidence-1',
        orgId,
        Buffer.from('test data'),
        'user-123'
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('signEvidence', () => {
    it('should sign evidence with a generated key when no org key', async () => {
      const result = await evidenceTruthLayerService.signEvidence(
        Buffer.from('test data'),
        orgId
      );

      expect(result).toBeDefined();
      expect(result.signature).toBeDefined();
    });
  });

  describe('exportAnalysisReport', () => {
    it('should export analysis report in JSON format', async () => {
      const mockAnalysis = {
        id: 'a-1',
        evidenceId: 'ev-1',
        organizationId: orgId,
        deepfakeScore: 0.1,
        cryptographicHash: 'hash123',
        overallConfidence: 0.9,
        verificationStatus: 'verified',
        createdAt: new Date(),
      };

      (prismaMock.evidenceAnalysis as any) = {
        findFirst: jest.fn<any>().mockResolvedValue(mockAnalysis),
      };

      const result = await evidenceTruthLayerService.exportAnalysisReport(
        'ev-1',
        orgId,
        'json'
      );

      expect(result).toBeDefined();
    });

    it('should throw if analysis not found for export', async () => {
      (prismaMock.evidenceAnalysis as any) = {
        findFirst: jest.fn<any>().mockResolvedValue(null),
      };

      await expect(
        evidenceTruthLayerService.exportAnalysisReport('nonexistent', orgId, 'json')
      ).rejects.toThrow();
    });
  });
});
