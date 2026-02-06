/**
 * Evidence Truth Layer Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';
import crypto from 'crypto';

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
    detectDeepfake: jest.fn(),
    detectLiveness: jest.fn(),
  },
}));

jest.mock('../../../../services/advanced/byokService', () => ({
  __esModule: true,
  default: {
    getOrganizationKey: jest.fn(),
    signWithKey: jest.fn(),
    verifyWithKey: jest.fn(),
  },
}));

jest.mock('ntp-client', () => ({
  __esModule: true,
  default: {
    getNetworkTime: jest.fn(),
  },
}));

jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = jest.fn();
  return { __esModule: true, default: mockFfmpeg };
});

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  writeFile: jest.fn(),
  readFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  unlink: jest.fn(),
  createReadStream: jest.fn(),
}));

import evidenceTruthLayerService from '../../../../services/advanced/evidenceTruthLayerService';

describe('EvidenceTruthLayerService', () => {
  const orgId = 'org-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Re-establish mock implementations (cleared by resetMocks)
    const mlModelsService = require('../../../../services/advanced/mlModelsService').default;
    mlModelsService.initialize.mockResolvedValue(undefined);
    mlModelsService.detectDeepfake.mockResolvedValue({
      isDeepfake: false,
      confidence: 0.95,
      model: 'test-model',
      details: {},
    });
    mlModelsService.detectLiveness.mockResolvedValue({
      isLive: true,
      confidence: 0.9,
    });

    const byokService = require('../../../../services/advanced/byokService').default;
    byokService.getOrganizationKey.mockResolvedValue(null);
    byokService.signWithKey.mockResolvedValue(null);
    byokService.verifyWithKey.mockResolvedValue(null);

    const fs = require('fs');
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(Buffer.alloc(100));
    fs.writeFileSync.mockImplementation(() => {});
    fs.writeFile.mockImplementation((_path: any, _data: any, cb: any) => { if (cb) cb(null); });
    fs.unlinkSync.mockImplementation(() => {});
    fs.unlink.mockImplementation((_path: any, cb: any) => { if (cb) cb(null); });
    fs.mkdirSync.mockImplementation(() => {});
    fs.createReadStream.mockReturnValue({});

    const ffmpeg = require('fluent-ffmpeg').default;
    ffmpeg.mockReturnValue({
      ffprobe: jest.fn(),
      outputOptions: jest.fn<any>().mockReturnThis(),
      output: jest.fn<any>().mockReturnThis(),
      on: jest.fn<any>().mockReturnThis(),
      run: jest.fn(),
    });

    // Prisma mocks
    (prismaMock.evidenceAnalysis.create as jest.Mock<any>).mockResolvedValue({ id: 'analysis-1' });
    (prismaMock.evidenceAnalysis.findFirst as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockResolvedValue([]);
  });

  describe('analyzeEvidence', () => {
    it('should analyze evidence and return analysis result', async () => {
      const fileBuffer = Buffer.alloc(1024, 'a');
      const metadata = {
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
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
      const result = await evidenceTruthLayerService.analyzeEvidence(
        'evidence-2',
        orgId
      );

      expect(result).toBeDefined();
      expect(result.evidenceId).toBe('evidence-2');
    });

    it('should continue even if database storage fails', async () => {
      (prismaMock.evidenceAnalysis.create as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

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
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      const result = await evidenceTruthLayerService.verifyFileHash(
        fileBuffer,
        hash
      );

      expect(result).toBeDefined();
      expect(result.matches).toBe(true);
    });

    it('should detect hash mismatch', async () => {
      const result = await evidenceTruthLayerService.verifyFileHash(
        Buffer.from('content A'),
        'wrong-hash-value-does-not-match'
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
        analyzedAt: new Date(),
        createdAt: new Date(),
      };

      (prismaMock.evidenceAnalysis.findFirst as jest.Mock<any>).mockResolvedValue(mockAnalysis);

      const result = await evidenceTruthLayerService.getEvidenceAnalysis('evidence-1', orgId);

      expect(result).toBeDefined();
      expect(result!.evidenceId).toBe('evidence-1');
    });

    it('should return null when analysis not found', async () => {
      (prismaMock.evidenceAnalysis.findFirst as jest.Mock<any>).mockResolvedValue(null);

      const result = await evidenceTruthLayerService.getEvidenceAnalysis('nonexistent', orgId);

      expect(result).toBeNull();
    });
  });

  describe('bulkAnalyzeEvidence', () => {
    it('should analyze multiple evidence files', async () => {
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
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('createChainOfCustody', () => {
    it('should create chain of custody for evidence', async () => {
      const result = await evidenceTruthLayerService.createChainOfCustody(
        'evidence-1',
        orgId,
        null,
        'upload',
        'user-123'
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('signer');
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
        analyzedAt: new Date(),
        createdAt: new Date(),
      };

      (prismaMock.evidenceAnalysis.findFirst as jest.Mock<any>).mockResolvedValue(mockAnalysis);

      const result = await evidenceTruthLayerService.exportAnalysisReport(
        'ev-1',
        orgId,
        'json'
      );

      expect(result).toBeDefined();
    });

    it('should throw if analysis not found for export', async () => {
      (prismaMock.evidenceAnalysis.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        evidenceTruthLayerService.exportAnalysisReport('nonexistent', orgId, 'json')
      ).rejects.toThrow();
    });
  });
});
