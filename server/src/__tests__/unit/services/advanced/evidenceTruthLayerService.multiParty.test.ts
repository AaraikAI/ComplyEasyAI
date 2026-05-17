/**
 * createMultiPartyAttestation now uses PER-USER RSA-2048 signing keys
 * (lazily generated, AES-256-GCM encrypted at rest) and persists each
 * signature in a first-class EvidenceAttestation row.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import crypto from 'crypto';
import { prismaMock } from '../../../mocks/prisma';

// Generate a real RSA keypair to feed back from the (mocked) DB lookup
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

// Stub the at-rest credential-encryption module so the test doesn't need ENCRYPTION_KEY
jest.mock('../../../../utils/credentialEncryption', () => ({
  __esModule: true,
  encryptField: (s: string) => `enc:${s}`,
  decryptField: (s: string) => (s.startsWith('enc:') ? s.slice(4) : s),
}));

// Stub the metrics module (counters can throw if registry not initialized in tests)
jest.mock('../../../../services/monitoring/metrics', () => ({
  __esModule: true,
  attestationsCreatedTotal: { labels: () => ({ inc: jest.fn() }) },
  userSigningKeysGeneratedTotal: { inc: jest.fn() },
}));

jest.mock('../../../../services/advanced/mlModelsService', () => ({
  __esModule: true,
  default: { initialize: jest.fn(), detectDeepfake: jest.fn(), detectLiveness: jest.fn() },
}));

jest.mock('../../../../services/advanced/byokService', () => ({
  __esModule: true,
  default: {
    getOrganizationKey: jest.fn(),
    signWithKey: jest.fn(),
    verifyWithKey: jest.fn(),
    decryptData: jest.fn(),
  },
}));

jest.mock('ntp-client', () => ({ __esModule: true, default: { getNetworkTime: jest.fn() } }));
jest.mock('fluent-ffmpeg', () => ({ __esModule: true, default: jest.fn() }));
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

describe('evidenceTruthLayerService.createMultiPartyAttestation (per-user RSA)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

    // Every party already has an active key (so service does NOT generate new ones)
    (prismaMock.userSigningKey.findFirst as jest.Mock<any>).mockResolvedValue({
      id: 'key-1',
      userId: 'user',
      organizationId: 'org-1',
      publicKey,
      encryptedPrivateKey: `enc:${privateKey}`,
      algorithm: 'SHA256-RSA',
      keyVersion: 1,
      active: true,
      createdAt: new Date(),
      revokedAt: null,
    });

    (prismaMock.evidenceAttestation.create as jest.Mock<any>).mockImplementation(
      (args: any) => Promise.resolve({ id: `att-${args.data.userId}`, ...args.data })
    );
  });

  it('produces verifiable RSA signatures using each party\'s key', async () => {
    const fileBuffer = Buffer.from('document under attestation');
    const parties = [
      { userId: 'u1', role: 'cfo' },
      { userId: 'u2', role: 'cto' },
    ];

    const attestations = await evidenceTruthLayerService.createMultiPartyAttestation(
      fileBuffer,
      'org-1',
      parties,
      'ev-123'
    );

    expect(attestations).toHaveLength(2);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    for (const att of attestations) {
      expect(att.algorithm).toBe('SHA256-RSA');
      expect(att.publicKey).toBe(publicKey);
      expect(att.attestationId).toBeTruthy();
      const matchedParty = parties.find(p => p.userId === att.userId)!;
      const signed = `${hash}:${matchedParty.userId}:${matchedParty.role}:${att.timestamp.toISOString()}`;
      const verifier = crypto.createVerify('SHA256');
      verifier.update(signed);
      verifier.end();
      const valid = verifier.verify(publicKey, Buffer.from(att.signature, 'base64'));
      expect(valid).toBe(true);
    }
  });

  it('writes one EvidenceAttestation row per party (with org + user + evidenceId)', async () => {
    const fileBuffer = Buffer.from('doc');
    await evidenceTruthLayerService.createMultiPartyAttestation(
      fileBuffer,
      'org-1',
      [
        { userId: 'a', role: 'r1' },
        { userId: 'b', role: 'r2' },
        { userId: 'c', role: 'r3' },
      ],
      'ev-xyz'
    );

    expect(prismaMock.evidenceAttestation.create).toHaveBeenCalledTimes(3);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    for (const call of (prismaMock.evidenceAttestation.create as jest.Mock).mock.calls) {
      const args = call[0] as { data: { evidenceId: string; organizationId: string; algorithm: string; evidenceHash: string } };
      expect(args.data.evidenceId).toBe('ev-xyz');
      expect(args.data.organizationId).toBe('org-1');
      expect(args.data.algorithm).toBe('SHA256-RSA');
      expect(args.data.evidenceHash).toBe(hash);
    }

    // Audit log mirror still written (3 rows)
    expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(3);
  });

  it('lazily generates a new UserSigningKey when none exists', async () => {
    (prismaMock.userSigningKey.findFirst as jest.Mock<any>).mockResolvedValue(null);
    (prismaMock.userSigningKey.create as jest.Mock<any>).mockImplementation(
      (args: any) => Promise.resolve({ id: 'new-key', ...args.data })
    );

    const fileBuffer = Buffer.from('doc');
    await evidenceTruthLayerService.createMultiPartyAttestation(
      fileBuffer,
      'org-1',
      [
        { userId: 'fresh-1', role: 'r' },
        { userId: 'fresh-2', role: 'r' },
      ],
      'ev-z'
    );

    expect(prismaMock.userSigningKey.create).toHaveBeenCalledTimes(2);
    const created = (prismaMock.userSigningKey.create as jest.Mock).mock.calls[0][0] as { data: any };
    expect(created.data.algorithm).toBe('SHA256-RSA');
    expect(created.data.active).toBe(true);
    expect(created.data.encryptedPrivateKey).toMatch(/^enc:/);
  });
});
