/**
 * Blockchain Anchor Worker — verifies success path persists anchor info and
 * final-attempt failure writes a permanent-failure audit log row.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

// Mocks
const mockAnchorEvidenceHash = jest.fn<any>();
jest.mock('../../../services/advanced/blockchainService', () => ({
  __esModule: true,
  default: { anchorEvidenceHash: mockAnchorEvidenceHash },
}));

const mockRecordAnchorDuration = jest.fn();
jest.mock('../../../services/monitoring/anchorSLA', () => ({
  __esModule: true,
  recordAnchorDuration: mockRecordAnchorDuration,
}));

jest.mock('../../../services/queue/jobQueue', () => ({
  __esModule: true,
  default: { registerProcessor: jest.fn() },
  QUEUE_NAMES: { BLOCKCHAIN_ANCHOR: 'blockchain-anchor' },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { registerBlockchainAnchorWorker } from '../../../workers/blockchainAnchorWorker';
import jobQueueService from '../../../services/queue/jobQueue';

const getProcessor = (): ((job: any) => Promise<any>) => {
  const calls = (jobQueueService.registerProcessor as jest.Mock).mock.calls;
  if (calls.length === 0) throw new Error('Processor was not registered');
  return calls[calls.length - 1][1] as (job: any) => Promise<any>;
};

const baseJob = (overrides: Partial<{ data: any; attemptsMade: number; maxAttempts: number }> = {}): any => ({
  id: 'job-1',
  name: 'retry-anchor',
  status: 'active',
  progress: 0,
  attemptsMade: 0,
  maxAttempts: 5,
  createdAt: new Date(),
  data: {
    evidenceId: 'ev-1',
    organizationId: 'org-1',
    fileBufferBase64: Buffer.from('payload').toString('base64'),
    metadata: { filename: 'a.pdf' },
    network: 'polygon',
  },
  ...overrides,
});

describe('registerBlockchainAnchorWorker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    registerBlockchainAnchorWorker();
    (prismaMock.evidenceAnalysis.findFirst as jest.Mock<any>).mockResolvedValue({
      id: 'an-1',
      physicalAttestation: null,
    });
    (prismaMock.evidenceAnalysis.update as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
  });

  it('registers a processor for the BLOCKCHAIN_ANCHOR queue', () => {
    expect((jobQueueService.registerProcessor as jest.Mock).mock.calls.length).toBeGreaterThan(0);
  });

  it('persists blockchain anchor on the latest EvidenceAnalysis on success', async () => {
    mockAnchorEvidenceHash.mockResolvedValue({
      evidenceHash: 'eh',
      transactionHash: '0xtx',
      blockNumber: 99,
      anchoredAt: new Date('2026-05-14T01:00:00.000Z'),
      network: 'polygon',
    });

    const job = baseJob();
    const result = await getProcessor()(job);

    expect(result).toEqual({ success: true, transactionHash: '0xtx' });
    expect(mockRecordAnchorDuration).toHaveBeenCalledTimes(1);
    expect(prismaMock.evidenceAnalysis.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { evidenceId: 'ev-1', organizationId: 'org-1' },
      })
    );
    expect(prismaMock.evidenceAnalysis.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'an-1' },
        data: expect.objectContaining({
          physicalAttestation: expect.objectContaining({
            blockchainAnchor: expect.objectContaining({
              evidenceHash: 'eh',
              transactionHash: '0xtx',
              blockNumber: 99,
              network: 'polygon',
              recoveredFromRetry: true,
            }),
          }),
        }),
      })
    );
  });

  it('throws and does NOT write permanent-failure log on intermediate failure', async () => {
    mockAnchorEvidenceHash.mockRejectedValue(new Error('rpc fail'));
    const job = baseJob({ attemptsMade: 1, maxAttempts: 5 });

    await expect(getProcessor()(job)).rejects.toThrow('rpc fail');
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
    expect(mockRecordAnchorDuration).toHaveBeenCalledTimes(1);
  });

  it('writes a permanent-failure audit log on the final attempt', async () => {
    mockAnchorEvidenceHash.mockRejectedValue(new Error('rpc fail'));
    const job = baseJob({ attemptsMade: 4, maxAttempts: 5 });

    await expect(getProcessor()(job)).rejects.toThrow('rpc fail');
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'evidence_truth_layer.anchor_failed_permanently',
          organizationId: 'org-1',
          userId: 'system',
        }),
      })
    );
  });
});
