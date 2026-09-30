/**
 * Tests that a BYOK-managed evidence signing key is persisted as a KMS
 * envelope and recovered from that envelope, so signatures stay verifiable
 * across calls.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// ---------------------------------------------------------------------------
// Mocks (must declare BEFORE importing the service)
// ---------------------------------------------------------------------------

const mockByok = {
  createAWSKey: jest.fn<any>(),
  encryptData: jest.fn<any>(),
  decryptData: jest.fn<any>(),
};

jest.mock('../../../../services/advanced/byokService', () => ({
  __esModule: true,
  default: mockByok,
}));

jest.mock('../../../../services/advanced/blockchainService', () => ({
  __esModule: true,
  default: { anchorEvidenceHash: jest.fn<any>(), detectTampering: jest.fn<any>() },
}));

jest.mock('../../../../services/queue/jobQueue', () => ({
  __esModule: true,
  default: { addJob: jest.fn<any>(), registerProcessor: jest.fn() },
  QUEUE_NAMES: { BLOCKCHAIN_ANCHOR: 'blockchain-anchor' },
}));

jest.mock('../../../../services/monitoring/anchorSLA', () => ({
  __esModule: true,
  recordAnchorDuration: jest.fn(),
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
  default: { initialize: jest.fn(), detectDeepfake: jest.fn<any>(), detectLiveness: jest.fn<any>() },
}));

jest.mock('ntp-client', () => ({
  __esModule: true,
  default: { getNetworkTime: jest.fn() },
}));

jest.mock('fluent-ffmpeg', () => ({ __esModule: true, default: jest.fn() }));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import evidenceTruthLayerService from '../../../../services/advanced/evidenceTruthLayerService';

const service = evidenceTruthLayerService as any;

const envelope = {
  ciphertext: 'Y2lwaGVydGV4dA==',
  encryptedDataKey: 'd3JhcHBlZC1kZWs=',
  iv: 'aXYtYnl0ZXM=',
  authTag: 'dGFnLWJ5dGVz',
  provider: 'aws_kms',
  keyId: 'kms-key-1',
  algorithm: 'AES-256-GCM',
};

describe('evidenceTruthLayerService signing-key persistence (BYOK)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prismaMock.keyRotationPolicy.create as jest.Mock<any>).mockResolvedValue({});
    (prismaMock.keyUsage.create as jest.Mock<any>).mockResolvedValue({});
    mockByok.createAWSKey.mockResolvedValue('kms-key-1');
    mockByok.encryptData.mockResolvedValue(envelope);
  });

  it('stores the KMS envelope of a newly generated signing key', async () => {
    (prismaMock.keyRotationPolicy.findFirst as jest.Mock<any>).mockResolvedValue(null);

    const key = await service.getOrganizationSigningKey('org-1');

    expect(key.privateKey).toContain('PRIVATE KEY');
    expect(key.publicKey).toContain('PUBLIC KEY');

    // The key pair itself is what gets envelope-encrypted.
    const plaintext = JSON.parse((mockByok.encryptData.mock.calls[0][0] as Buffer).toString());
    expect(plaintext).toEqual(key);

    const usage = (prismaMock.keyUsage.create as jest.Mock<any>).mock.calls[0][0] as any;
    expect(usage.data.operation).toBe('generate');
    expect(usage.data.metadata.encryptedKeyEnvelope).toEqual({
      ciphertext: envelope.ciphertext,
      encryptedDataKey: envelope.encryptedDataKey,
      iv: envelope.iv,
      authTag: envelope.authTag,
      algorithm: envelope.algorithm,
    });
    // Only ciphertext is persisted, never the PEM key material.
    expect(JSON.stringify(usage.data.metadata)).not.toContain('PRIVATE KEY');
  });

  it('recovers a stored key by opening the persisted envelope', async () => {
    const stored = {
      privateKey: '-----BEGIN PRIVATE KEY-----\nstored\n-----END PRIVATE KEY-----',
      publicKey: '-----BEGIN PUBLIC KEY-----\nstored\n-----END PUBLIC KEY-----',
    };
    (prismaMock.keyRotationPolicy.findFirst as jest.Mock<any>).mockResolvedValue({
      keyId: 'kms-key-1',
      provider: 'aws_kms',
    });
    (prismaMock.keyUsage.findFirst as jest.Mock<any>).mockResolvedValue({
      metadata: {
        purpose: 'evidence_signing',
        encryptedKeyEnvelope: {
          ciphertext: envelope.ciphertext,
          encryptedDataKey: envelope.encryptedDataKey,
          iv: envelope.iv,
          authTag: envelope.authTag,
          algorithm: envelope.algorithm,
        },
      },
    });
    mockByok.decryptData.mockResolvedValue(Buffer.from(JSON.stringify(stored)));

    const key = await service.getOrganizationSigningKey('org-1');

    expect(key).toEqual(stored);
    expect(mockByok.decryptData).toHaveBeenCalledWith(
      expect.objectContaining({
        ciphertext: envelope.ciphertext,
        encryptedDataKey: envelope.encryptedDataKey,
        iv: envelope.iv,
        authTag: envelope.authTag,
        keyId: 'kms-key-1',
      }),
      expect.objectContaining({ provider: 'aws_kms', keyId: 'kms-key-1' }),
      'org-1'
    );
    expect(mockByok.createAWSKey).not.toHaveBeenCalled();
    expect(mockByok.encryptData).not.toHaveBeenCalled();
  });

  it('generates a new key instead of decrypting a stored key that has no envelope', async () => {
    (prismaMock.keyRotationPolicy.findFirst as jest.Mock<any>).mockResolvedValue({
      keyId: 'kms-key-legacy',
      provider: 'aws_kms',
    });
    (prismaMock.keyUsage.findFirst as jest.Mock<any>).mockResolvedValue({
      metadata: { purpose: 'evidence_signing', keyType: 'RSA-2048' },
    });

    const key = await service.getOrganizationSigningKey('org-1');

    expect(mockByok.decryptData).not.toHaveBeenCalled();
    expect(mockByok.createAWSKey).toHaveBeenCalledTimes(1);
    expect(key.privateKey).toContain('PRIVATE KEY');
  });
});
