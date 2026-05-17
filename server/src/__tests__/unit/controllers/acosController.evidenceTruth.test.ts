/**
 * acosController — Evidence Truth handler tests
 * Covers the 4 new handlers: analyzeAndAnchor, verifyIntegrity, getProvenance, getAnchorSLA.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock the evidence-truth service the controller depends on
const mockEvidenceTruth = {
  analyzeEvidence: jest.fn<any>(),
  reanalyzeEvidence: jest.fn<any>(),
  getEvidenceAnalysis: jest.fn<any>(),
  getAnalysisHistory: jest.fn<any>(),
  bulkAnalyzeEvidence: jest.fn<any>(),
  exportAnalysisReport: jest.fn<any>(),
  verifyFileHash: jest.fn<any>(),
  signEvidence: jest.fn<any>(),
  verifyEvidenceSignature: jest.fn<any>(),
  timestampEvidence: jest.fn<any>(),
  createChainOfCustody: jest.fn<any>(),
  createMultiPartyAttestation: jest.fn<any>(),
  analyzeAndAnchor: jest.fn<any>(),
  verifyIntegrity: jest.fn<any>(),
  getProvenanceReport: jest.fn<any>(),
};

jest.mock('../../../services/advanced/evidenceTruthLayerService', () => ({
  __esModule: true,
  default: mockEvidenceTruth,
}));

// Mock the SLA module (controller uses dynamic import())
jest.mock('../../../services/monitoring/anchorSLA', () => ({
  __esModule: true,
  summarizeAnchorSLA: jest.fn(() => ({
    p50: 100,
    p95: 500,
    p99: 1000,
    sampleCount: 3,
    totalRecorded: 3,
    windowCapacity: 1000,
    lastUpdated: new Date('2026-05-14T00:00:00.000Z'),
    target: { p50Ms: 15000, p95Ms: 60000 },
    withinTarget: { p50: true, p95: true },
  })),
}));

// Stub the rest of the services the controller imports
jest.mock('../../../services/advanced/acosService', () => ({ __esModule: true, default: {} }));
jest.mock('../../../services/advanced/agenticAIService', () => ({ __esModule: true, default: {} }));
jest.mock('../../../services/advanced/regulatoryIntelligenceFabricService', () => ({ __esModule: true, default: {} }));
jest.mock('../../../services/advanced/temporalGraphNetworkService', () => ({ __esModule: true, default: {} }));
jest.mock('../../../services/advanced/complianceDigitalTwinService', () => ({ __esModule: true, default: {} }));
jest.mock('../../../services/advanced/redTeamService', () => ({ __esModule: true, default: {} }));
jest.mock('../../../services/advanced/federatedSwarmService', () => ({ __esModule: true, default: {} }));
jest.mock('../../../services/advanced/multimodalIntakeService', () => ({ __esModule: true, default: {} }));
jest.mock('../../../services/advanced/physicalAIService', () => ({ __esModule: true, default: {} }));
jest.mock('../../../services/advanced/vrCollaborativeReviewService', () => ({ __esModule: true, default: {} }));
jest.mock('../../../services/advanced/swarmTaskAllocationService', () => ({ __esModule: true, default: {} }));
jest.mock('../../../services/advanced/neuroSymbolicAIService', () => ({ __esModule: true, default: {} }));
jest.mock('../../../services/advanced/jitAccessService', () => ({ __esModule: true, default: {} }));
jest.mock('../../../services/advanced/homomorphicAIService', () => ({ __esModule: true, default: {} }));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../../config/database', () => ({ __esModule: true, default: prismaMock }));

import controller from '../../../controllers/acosController';
import { AppError } from '../../../middleware/errorHandler';

const buildReq = (overrides: Record<string, any> = {}): any => ({
  user: { id: 'user-1', organizationId: 'org-1', email: 't@t.com', role: 'admin' },
  params: {},
  query: {},
  body: {},
  ...overrides,
});

const buildRes = (): any => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const fakeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'evidence.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  buffer: Buffer.from('hello world'),
  size: 11,
  destination: '',
  filename: '',
  path: '',
  stream: undefined as any,
  ...overrides,
});

describe('acosController — Evidence Truth additions', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    jest.clearAllMocks();
    req = buildReq();
    res = buildRes();
  });

  describe('analyzeAndAnchor', () => {
    it('400s when no file is provided', async () => {
      req.params = { evidenceId: 'ev-1' };
      await expect(controller.analyzeAndAnchor(req as Request, res as Response)).rejects.toThrow(AppError);
    });

    it('returns the service result with anchor metadata', async () => {
      req.params = { evidenceId: 'ev-1' };
      req.file = fakeFile();
      req.body = { network: 'polygon', skipBlockchain: false };
      const expected = { evidenceId: 'ev-1', blockchainAnchor: { transactionHash: '0xabc' } };
      mockEvidenceTruth.analyzeAndAnchor.mockResolvedValue(expected as never);

      await controller.analyzeAndAnchor(req as Request, res as Response);

      expect(mockEvidenceTruth.analyzeAndAnchor).toHaveBeenCalledWith(
        'ev-1',
        'org-1',
        expect.any(Buffer),
        expect.objectContaining({ filename: 'evidence.pdf', mimeType: 'application/pdf' }),
        { network: 'polygon', skipBlockchain: false }
      );
      expect(res.json).toHaveBeenCalledWith(expected);
    });

    it('wraps generic service errors as AppError 500', async () => {
      req.params = { evidenceId: 'ev-1' };
      req.file = fakeFile();
      mockEvidenceTruth.analyzeAndAnchor.mockRejectedValue(new Error('boom') as never);
      await expect(controller.analyzeAndAnchor(req as Request, res as Response)).rejects.toThrow(
        'Failed to analyze and anchor evidence'
      );
    });
  });

  describe('verifyIntegrity', () => {
    it('400s when no file is provided', async () => {
      req.params = { evidenceId: 'ev-1' };
      await expect(controller.verifyIntegrity(req as Request, res as Response)).rejects.toThrow(AppError);
    });

    it('returns integrity check result', async () => {
      req.params = { evidenceId: 'ev-1' };
      req.file = fakeFile();
      const expected = { integrityVerified: true, hashMatch: true, blockchainVerified: true, analysisConsistent: true };
      mockEvidenceTruth.verifyIntegrity.mockResolvedValue(expected as never);

      await controller.verifyIntegrity(req as Request, res as Response);

      expect(mockEvidenceTruth.verifyIntegrity).toHaveBeenCalledWith('ev-1', 'org-1', expect.any(Buffer));
      expect(res.json).toHaveBeenCalledWith(expected);
    });
  });

  describe('getProvenance', () => {
    it('returns provenance report from service', async () => {
      req.params = { evidenceId: 'ev-1' };
      const expected = { evidenceId: 'ev-1', chainOfCustody: [], analyses: [], blockchainAnchors: [], attestations: [], integrityScore: 100 };
      mockEvidenceTruth.getProvenanceReport.mockResolvedValue(expected as never);

      await controller.getProvenance(req as Request, res as Response);

      expect(mockEvidenceTruth.getProvenanceReport).toHaveBeenCalledWith('ev-1', 'org-1');
      expect(res.json).toHaveBeenCalledWith(expected);
    });

    it('wraps generic errors as AppError 500', async () => {
      req.params = { evidenceId: 'ev-1' };
      mockEvidenceTruth.getProvenanceReport.mockRejectedValue(new Error('db down') as never);
      await expect(controller.getProvenance(req as Request, res as Response)).rejects.toThrow('Failed to get provenance report');
    });
  });

  describe('getAnchorSLA', () => {
    it('returns the SLA summary', async () => {
      await controller.getAnchorSLA(req as Request, res as Response);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          p50: 100,
          p95: 500,
          target: { p50Ms: 15000, p95Ms: 60000 },
        })
      );
    });
  });
});
