/**
 * Tests that a failed blockchain anchor enqueues a retry job
 * and that a successful inline anchor does NOT enqueue.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// ---------------------------------------------------------------------------
// Mocks (must declare BEFORE importing the service)
// ---------------------------------------------------------------------------

const mockAnchorEvidenceHash = jest.fn<any>();

jest.mock('../../../../services/advanced/blockchainService', () => ({
  __esModule: true,
  default: {
    anchorEvidenceHash: mockAnchorEvidenceHash,
    detectTampering: jest.fn<any>(),
  },
}));

const mockAddJob = jest.fn<any>();
jest.mock('../../../../services/queue/jobQueue', () => ({
  __esModule: true,
  default: { addJob: mockAddJob, registerProcessor: jest.fn() },
  QUEUE_NAMES: { BLOCKCHAIN_ANCHOR: 'blockchain-anchor' },
}));

const mockRecordAnchorDuration = jest.fn();
jest.mock('../../../../services/monitoring/anchorSLA', () => ({
  __esModule: true,
  recordAnchorDuration: mockRecordAnchorDuration,
}));

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../../services/advanced/mlModelsService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    detectDeepfake: jest.fn<any>().mockResolvedValue({ isDeepfake: false, confidence: 0.95, model: 'm', details: {} }),
    detectLiveness: jest.fn<any>().mockResolvedValue({ isLive: true, confidence: 0.9 }),
  },
}));

jest.mock('../../../../services/advanced/byokService', () => ({
  __esModule: true,
  default: {
    getOrganizationKey: jest.fn<any>().mockResolvedValue(null),
    signWithKey: jest.fn<any>().mockResolvedValue(null),
    verifyWithKey: jest.fn<any>().mockResolvedValue(null),
    decryptData: jest.fn<any>().mockResolvedValue(Buffer.from('{}')),
  },
}));

jest.mock('ntp-client', () => ({
  __esModule: true,
  default: { getNetworkTime: jest.fn() },
}));

jest.mock('fluent-ffmpeg', () => {
  const m = jest.fn();
  return { __esModule: true, default: m };
});

jest.mock('fs', () => ({
  existsSync: jest.fn<any>().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  writeFile: jest.fn(),
  readFileSync: jest.fn<any>().mockReturnValue(Buffer.alloc(100)),
  unlinkSync: jest.fn(),
  unlink: jest.fn(),
  createReadStream: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import evidenceTruthLayerService from '../../../../services/advanced/evidenceTruthLayerService';

describe('evidenceTruthLayerService.analyzeAndAnchor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prismaMock.evidenceAnalysis.create as jest.Mock<any>).mockResolvedValue({ id: 'an-1' });
    (prismaMock.evidenceAnalysis.findFirst as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.ioTDevice.findMany as jest.Mock<any>).mockResolvedValue([]);
  });

  it('records duration and does NOT enqueue when anchor succeeds', async () => {
    mockAnchorEvidenceHash.mockResolvedValue({
      evidenceHash: 'hash',
      transactionHash: '0xtx',
      blockNumber: 42,
      anchoredAt: new Date(),
      network: 'polygon',
    });

    const result = await evidenceTruthLayerService.analyzeAndAnchor(
      'ev-1',
      'org-1',
      Buffer.from('data'),
      { filename: 'a.pdf', mimeType: 'application/pdf' }
    );

    expect(result.blockchainAnchor).toBeDefined();
    expect(mockRecordAnchorDuration).toHaveBeenCalled();
    expect(mockAddJob).not.toHaveBeenCalled();
  });

  it('enqueues a retry job when blockchain anchoring throws', async () => {
    mockAnchorEvidenceHash.mockRejectedValue(new Error('rpc unreachable'));

    const result = await evidenceTruthLayerService.analyzeAndAnchor(
      'ev-1',
      'org-1',
      Buffer.from('data'),
      { filename: 'a.pdf', mimeType: 'application/pdf' },
      { network: 'ethereum' }
    );

    expect(result.blockchainAnchor).toBeUndefined();
    expect(mockRecordAnchorDuration).toHaveBeenCalled();
    expect(mockAddJob).toHaveBeenCalledTimes(1);
    const call = mockAddJob.mock.calls[0] as unknown[];
    expect(call[0]).toBe('blockchain-anchor');
    expect(call[1]).toBe('retry-anchor');
    const payload = call[2] as Record<string, any>;
    expect(payload.evidenceId).toBe('ev-1');
    expect(payload.organizationId).toBe('org-1');
    expect(payload.network).toBe('ethereum');
    expect(typeof payload.fileBufferBase64).toBe('string');
    const opts = call[3] as Record<string, any>;
    expect(opts.attempts).toBe(5);
    expect(opts.backoff).toEqual({ type: 'exponential', delay: 5000 });
  });

  it('skips anchoring entirely when skipBlockchain is true', async () => {
    const result = await evidenceTruthLayerService.analyzeAndAnchor(
      'ev-1',
      'org-1',
      Buffer.from('data'),
      { filename: 'a.pdf' },
      { skipBlockchain: true }
    );
    expect(result.blockchainAnchor).toBeUndefined();
    expect(mockAnchorEvidenceHash).not.toHaveBeenCalled();
    expect(mockAddJob).not.toHaveBeenCalled();
  });
});
