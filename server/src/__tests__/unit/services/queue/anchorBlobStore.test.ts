/**
 * AnchorBlobStore — S3-backed payload helper for the retry queue.
 *
 * Verifies the availability gate and the put/get/delete flow against a
 * mocked @aws-sdk/client-s3.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockSend = jest.fn<any>();

jest.mock('@aws-sdk/client-s3', () => {
  class FakeCmd {
    public input: any;
    constructor(input: any) { this.input = input; }
  }
  class FakeS3Client {
    send = mockSend;
    constructor(_config: any) {}
  }
  return {
    __esModule: true,
    S3Client: FakeS3Client,
    PutObjectCommand: FakeCmd,
    GetObjectCommand: FakeCmd,
    DeleteObjectCommand: FakeCmd,
  };
});

jest.mock('../../../../config', () => ({
  __esModule: true,
  default: {
    aws: {
      region: 'us-east-1',
      s3Bucket: 'test-bucket',
      accessKeyId: 'AK',
      secretAccessKey: 'SK',
    },
  },
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import {
  isAnchorBlobStoreAvailable,
  putAnchorBlob,
  getAnchorBlob,
  deleteAnchorBlob,
} from '../../../../services/queue/anchorBlobStore';

describe('AnchorBlobStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports availability when bucket + region are configured', () => {
    expect(isAnchorBlobStoreAvailable()).toBe(true);
  });

  it('uploads a blob and returns the bucket + key', async () => {
    mockSend.mockResolvedValue({});
    const result = await putAnchorBlob('org-1', 'ev-1', Buffer.from('hello'), 'application/pdf');
    expect(result).toBeTruthy();
    expect(result!.s3Bucket).toBe('test-bucket');
    expect(result!.s3Key).toMatch(/^org-1\/anchor-retries\/ev-1\//);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const cmd = (mockSend.mock.calls[0] as any[])[0];
    expect(cmd.input.Bucket).toBe('test-bucket');
    expect(cmd.input.ServerSideEncryption).toBe('AES256');
  });

  it('fetches a blob and returns a Buffer (uses transformToByteArray)', async () => {
    mockSend.mockResolvedValue({
      Body: {
        transformToByteArray: async () => new Uint8Array([0x68, 0x69]),
      },
    });
    const buf = await getAnchorBlob('test-bucket', 'org-1/anchor-retries/ev-1/abc.bin');
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.toString()).toBe('hi');
  });

  it('deletes a blob without throwing', async () => {
    mockSend.mockResolvedValue({});
    await expect(deleteAnchorBlob('test-bucket', 'org-1/anchor-retries/ev-1/abc.bin')).resolves.toBeUndefined();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
