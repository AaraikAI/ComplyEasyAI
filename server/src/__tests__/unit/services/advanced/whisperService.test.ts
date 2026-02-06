/**
 * Whisper Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Extend prismaMock with transcription model
const whisperPrismaMock = {
  ...prismaMock,
  transcriptionResult: {
    findFirst: jest.fn() as jest.Mock<any>,
    findMany: jest.fn() as jest.Mock<any>,
    create: jest.fn() as jest.Mock<any>,
    update: jest.fn() as jest.Mock<any>,
  },
};

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: whisperPrismaMock,
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

// Mock OpenAI
const mockCreate = jest.fn() as jest.Mock<any>;
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: mockCreate,
      },
    },
  })),
}));

// Mock fs operations
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  createReadStream: jest.fn().mockReturnValue('mock-stream'),
  writeFile: jest.fn(),
  unlink: jest.fn(),
}));

jest.mock('util', () => ({
  promisify: jest.fn().mockImplementation((fn: any) => {
    if (fn === undefined) return jest.fn().mockResolvedValue(undefined);
    return jest.fn().mockResolvedValue(undefined);
  }),
}));

import whisperService from '../../../../services/advanced/whisperService';

describe('WhisperService', () => {
  const orgId = 'org-123';
  const evidenceId = 'evidence-456';
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Default: no OpenAI key, non-production
    delete process.env.OPENAI_API_KEY;
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // =========================================================================
  // initialize
  // =========================================================================
  describe('initialize', () => {
    it('should initialize without API key and log a warning', async () => {
      // Reset the service state by accessing private field
      (whisperService as any).isInitialized = false;
      (whisperService as any).openai = null;
      delete process.env.OPENAI_API_KEY;

      await whisperService.initialize();

      // Should complete without error
      expect((whisperService as any).isInitialized).toBe(true);
    });

    it('should not re-initialize if already initialized', async () => {
      (whisperService as any).isInitialized = true;

      await whisperService.initialize();

      // Should return immediately
      expect((whisperService as any).isInitialized).toBe(true);
    });

    it('should initialize with OpenAI when API key is present', async () => {
      (whisperService as any).isInitialized = false;
      (whisperService as any).openai = null;
      process.env.OPENAI_API_KEY = 'test-api-key';

      await whisperService.initialize();

      expect((whisperService as any).isInitialized).toBe(true);
    });
  });

  // =========================================================================
  // transcribeAudio (fallback path)
  // =========================================================================
  describe('transcribeAudio', () => {
    it('should return fallback transcription when no API key in non-production', async () => {
      (whisperService as any).isInitialized = false;
      (whisperService as any).openai = null;
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'test';

      const audioBuffer = Buffer.from('fake-audio-data');

      const result = await whisperService.transcribeAudio(audioBuffer, {}, orgId);

      expect(result).toBeDefined();
      expect(result.text).toContain('Transcription service not available');
      expect(result.language).toBe('en');
    });

    it('should use specified language in fallback', async () => {
      (whisperService as any).isInitialized = false;
      (whisperService as any).openai = null;
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'test';

      const audioBuffer = Buffer.from('fake-audio-data');

      const result = await whisperService.transcribeAudio(
        audioBuffer,
        { language: 'fr' },
        orgId
      );

      expect(result.language).toBe('fr');
    });

    it('should throw in production when no API key is available', async () => {
      (whisperService as any).isInitialized = false;
      (whisperService as any).openai = null;
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'production';

      const audioBuffer = Buffer.from('fake-audio-data');

      await expect(
        whisperService.transcribeAudio(audioBuffer, {}, orgId)
      ).rejects.toThrow(/required.*production/i);
    });

    it('should estimate duration from buffer length in fallback', async () => {
      (whisperService as any).isInitialized = false;
      (whisperService as any).openai = null;
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'test';

      const audioBuffer = Buffer.alloc(160000); // 160000 bytes

      const result = await whisperService.transcribeAudio(audioBuffer, {}, orgId);

      expect(result.duration).toBeDefined();
      expect(result.duration).toBe(Math.floor(160000 / 16000));
    });
  });

  // =========================================================================
  // transcribeVideo (fallback path)
  // =========================================================================
  describe('transcribeVideo', () => {
    it('should return fallback transcription for video when no API key in non-production', async () => {
      (whisperService as any).isInitialized = false;
      (whisperService as any).openai = null;
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'test';

      const videoBuffer = Buffer.from('fake-video-data');

      const result = await whisperService.transcribeVideo(videoBuffer, {}, orgId);

      expect(result).toBeDefined();
      expect(result.text).toContain('Transcription service not available');
    });

    it('should throw in production when no API key for video', async () => {
      (whisperService as any).isInitialized = false;
      (whisperService as any).openai = null;
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'production';

      const videoBuffer = Buffer.from('fake-video-data');

      await expect(
        whisperService.transcribeVideo(videoBuffer, {}, orgId)
      ).rejects.toThrow(/production/i);
    });

    it('should accept optional evidenceId', async () => {
      (whisperService as any).isInitialized = false;
      (whisperService as any).openai = null;
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'test';

      const videoBuffer = Buffer.from('fake-video-data');

      const result = await whisperService.transcribeVideo(
        videoBuffer,
        { language: 'de' },
        orgId,
        evidenceId
      );

      expect(result.language).toBe('de');
    });
  });

  // =========================================================================
  // getTranscription
  // =========================================================================
  describe('getTranscription', () => {
    it('should return transcription from database', async () => {
      const mockTranscription = {
        id: 'trans-123',
        organizationId: orgId,
        text: 'This is the transcribed text.',
        language: 'en',
        duration: 120,
        segments: [{ id: 0, text: 'This is the transcribed text.', start: 0, end: 5 }],
      };

      (whisperPrismaMock.transcriptionResult.findFirst as jest.Mock).mockResolvedValue(
        mockTranscription as any
      );

      const result = await whisperService.getTranscription('trans-123', orgId);

      expect(result).toBeDefined();
      expect(result!.text).toBe('This is the transcribed text.');
      expect(result!.language).toBe('en');
      expect(result!.duration).toBe(120);
      expect(whisperPrismaMock.transcriptionResult.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'trans-123',
          organizationId: orgId,
        },
      });
    });

    it('should return null when transcription not found', async () => {
      (whisperPrismaMock.transcriptionResult.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await whisperService.getTranscription('nonexistent', orgId);

      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      (whisperPrismaMock.transcriptionResult.findFirst as jest.Mock).mockRejectedValue(
        new Error('DB error')
      );

      const result = await whisperService.getTranscription('trans-123', orgId);

      expect(result).toBeNull();
    });

    it('should return undefined duration when not stored', async () => {
      const mockTranscription = {
        id: 'trans-456',
        organizationId: orgId,
        text: 'Short text',
        language: 'en',
        duration: null,
        segments: null,
      };

      (whisperPrismaMock.transcriptionResult.findFirst as jest.Mock).mockResolvedValue(
        mockTranscription as any
      );

      const result = await whisperService.getTranscription('trans-456', orgId);

      expect(result).toBeDefined();
      expect(result!.duration).toBeUndefined();
    });
  });
});
