/**
 * Multimodal Intake Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../../services/advanced/whisperService', () => ({
  __esModule: true,
  default: {
    transcribeAudio: (jest.fn() as jest.Mock<any>).mockResolvedValue({
      text: 'This is a test transcription of the audio file.',
      confidence: 0.92,
      language: 'en',
      duration: 60,
      segments: [
        { id: 0, start: 0, end: 5, text: 'This is a test', confidence: 0.95 },
        { id: 1, start: 5, end: 10, text: 'transcription of the audio file.', confidence: 0.89 },
      ],
    }),
    transcribeVideo: (jest.fn() as jest.Mock<any>).mockResolvedValue({
      text: 'Video transcription text.',
      confidence: 0.88,
      language: 'en',
      duration: 120,
    }),
  },
}));

jest.mock('tesseract.js', () => ({
  __esModule: true,
  default: {
    createWorker: jest.fn<any>().mockReturnValue({
      loadLanguage: jest.fn<any>().mockResolvedValue(undefined),
      initialize: jest.fn<any>().mockResolvedValue(undefined),
      recognize: jest.fn<any>().mockResolvedValue({
        data: {
          text: 'OCR recognized text',
          confidence: 85,
          words: [{ text: 'OCR', confidence: 90, bbox: { x0: 0, y0: 0, x1: 50, y1: 20 } }],
        },
      }),
      terminate: jest.fn<any>().mockResolvedValue(undefined),
    }),
  },
}));

jest.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: {
    forVisionTasks: jest.fn<any>().mockRejectedValue(new Error('Not available in test')),
  },
  FaceDetector: {
    createFromOptions: jest.fn<any>().mockRejectedValue(new Error('Not available in test')),
  },
}));

jest.mock('sharp', () => {
  return jest.fn<any>().mockReturnValue({
    metadata: jest.fn<any>().mockResolvedValue({
      width: 1920,
      height: 1080,
      format: 'jpeg',
      channels: 3,
    }),
    stats: jest.fn<any>().mockResolvedValue({
      channels: [
        { mean: 120, stdev: 50, min: 0, max: 255 },
        { mean: 130, stdev: 45, min: 0, max: 255 },
        { mean: 110, stdev: 55, min: 0, max: 255 },
      ],
    }),
    raw: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn<any>().mockResolvedValue(Buffer.alloc(100)),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
  });
});

jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = jest.fn<any>().mockReturnValue({
    ffprobe: jest.fn<any>().mockImplementation((cb: any) => cb(null, {
      format: { duration: 60 },
      streams: [{ codec_type: 'video' }, { codec_type: 'audio' }],
    })),
    outputOptions: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    run: jest.fn(),
    seek: jest.fn().mockReturnThis(),
    frames: jest.fn().mockReturnThis(),
    pipe: jest.fn().mockReturnThis(),
    noVideo: jest.fn().mockReturnThis(),
    audioCodec: jest.fn().mockReturnThis(),
    format: jest.fn().mockReturnThis(),
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

import multimodalIntakeService from '../../../../services/advanced/multimodalIntakeService';

describe('MultimodalIntakeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('transcribeAudio', () => {
    it('should transcribe audio buffer successfully', async () => {
      // Create a buffer that looks like an MP3
      const mp3Buffer = Buffer.alloc(1024);
      mp3Buffer[0] = 0xFF;
      mp3Buffer[1] = 0xFB;

      const result = await multimodalIntakeService.transcribeAudio(
        mp3Buffer,
        { language: 'en', format: 'audio/mpeg' },
        'org-123',
        'evidence-1'
      );

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(typeof result.confidence).toBe('number');
      expect(result.language).toBe('en');
    });

    it('should throw for unsupported audio format', async () => {
      const audioBuffer = Buffer.alloc(100);

      await expect(
        multimodalIntakeService.transcribeAudio(
          audioBuffer,
          { format: 'audio/unsupported_format' }
        )
      ).rejects.toThrow('Unsupported audio format');
    });

    it('should auto-detect audio format from buffer header', async () => {
      const wavBuffer = Buffer.alloc(1024);
      wavBuffer[0] = 0x52; // R
      wavBuffer[1] = 0x49; // I
      wavBuffer[2] = 0x46; // F
      wavBuffer[3] = 0x46; // F

      const result = await multimodalIntakeService.transcribeAudio(wavBuffer);

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
    });
  });

  describe('analyzeVideo', () => {
    it('should analyze a video buffer', async () => {
      // Create a buffer that looks like MP4
      const mp4Buffer = Buffer.alloc(1024);
      mp4Buffer[4] = 0x66; // f
      mp4Buffer[5] = 0x74; // t
      mp4Buffer[6] = 0x79; // y
      mp4Buffer[7] = 0x70; // p
      mp4Buffer[8] = 0x6D; // m
      mp4Buffer[9] = 0x70; // p
      mp4Buffer[10] = 0x34; // 4

      const result = await multimodalIntakeService.analyzeVideo(
        mp4Buffer,
        { format: 'video/mp4' },
        'org-123',
        'evidence-2'
      );

      expect(result).toBeDefined();
      expect(result.format).toBeDefined();
      expect(result.duration).toBeDefined();
    });

    it('should throw for unsupported video format', async () => {
      const videoBuffer = Buffer.alloc(100);

      await expect(
        multimodalIntakeService.analyzeVideo(
          videoBuffer,
          { format: 'video/unsupported_format' }
        )
      ).rejects.toThrow('Unsupported video format');
    });
  });

  describe('processMultimodalEvidence', () => {
    it('should process multiple evidence files', async () => {
      const files = [
        {
          buffer: Buffer.alloc(100),
          filename: 'recording.mp3',
          mimeType: 'audio/mpeg',
          size: 100,
        },
      ];

      // Mock transcription for audio processing
      const result = await multimodalIntakeService.processMultimodalEvidence(
        files,
        'org-123',
        'evidence-3'
      );

      expect(result).toBeDefined();
    });
  });

  describe('extractTextFromPDF', () => {
    it('should extract text from a PDF buffer', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 test content');

      const result = await multimodalIntakeService.extractTextFromPDF(pdfBuffer);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('format detection helpers', () => {
    it('should detect MP3 format from buffer', () => {
      const buffer = Buffer.alloc(100);
      buffer[0] = 0xFF;
      buffer[1] = 0xFB;

      const format = (multimodalIntakeService as any).detectAudioFormat(buffer);
      expect(format).toBe('audio/mpeg');
    });

    it('should detect WAV format from buffer', () => {
      const buffer = Buffer.alloc(100);
      buffer[0] = 0x52; // R
      buffer[1] = 0x49; // I
      buffer[2] = 0x46; // F
      buffer[3] = 0x46; // F

      const format = (multimodalIntakeService as any).detectAudioFormat(buffer);
      expect(format).toBe('audio/wav');
    });

    it('should detect noise level from audio buffer', () => {
      const buffer = Buffer.alloc(1024);
      const noiseLevel = (multimodalIntakeService as any).detectNoiseLevel(buffer);
      expect(['low', 'medium', 'high']).toContain(noiseLevel);
    });
  });
});
