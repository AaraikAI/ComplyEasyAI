/**
 * Deepfake Detection Service Unit Tests
 *
 * Tests for ML-based deepfake detection using FaceForensics++ methodology,
 * DCT/FFT analysis, temporal consistency checks, and classifier training.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock sharp before importing the service
jest.mock('sharp', () => {
  const mockSharp = jest.fn().mockReturnValue({
    grayscale: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    raw: jest.fn().mockReturnThis(),
    removeAlpha: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(256 * 256)),
    metadata: jest.fn().mockResolvedValue({ width: 256, height: 256 }),
  });
  return { __esModule: true, default: mockSharp };
});

// Mock fluent-ffmpeg
jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg: any = jest.fn(() => mockFfmpeg);
  mockFfmpeg.seekInput = jest.fn().mockReturnValue(mockFfmpeg);
  mockFfmpeg.frames = jest.fn().mockReturnValue(mockFfmpeg);
  mockFfmpeg.output = jest.fn().mockReturnValue(mockFfmpeg);
  mockFfmpeg.on = jest.fn().mockImplementation(function (this: any, event: string, cb: any) {
    if (event === 'end') setTimeout(cb, 5);
    return mockFfmpeg;
  });
  mockFfmpeg.run = jest.fn().mockReturnValue(mockFfmpeg);
  mockFfmpeg.ffprobe = jest.fn((file: string, cb: any) => cb(null, { format: { duration: 5 } }));
  return { __esModule: true, default: mockFfmpeg };
});

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import deepfakeDetectionService from '../../../../services/advanced/deepfakeDetectionService';

describe('DeepfakeDetectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset internal state
    (deepfakeDetectionService as any).isInitialized = false;
    (deepfakeDetectionService as any).classifierModel = null;
    (deepfakeDetectionService as any).manipulationClassifier = null;
    (deepfakeDetectionService as any).resultCache = new Map();
  });

  // ===========================================================================
  // initialize
  // ===========================================================================
  describe('initialize', () => {
    it('should initialize detection models', async () => {
      await deepfakeDetectionService.initialize();

      expect((deepfakeDetectionService as any).isInitialized).toBe(true);
      expect((deepfakeDetectionService as any).classifierModel).not.toBeNull();
      expect((deepfakeDetectionService as any).manipulationClassifier).not.toBeNull();
    });

    it('should skip re-initialization if already initialized', async () => {
      (deepfakeDetectionService as any).isInitialized = true;

      const initSpy = jest.spyOn(deepfakeDetectionService as any, 'initClassifierModel');
      await deepfakeDetectionService.initialize();

      expect(initSpy).not.toHaveBeenCalled();
      initSpy.mockRestore();
    });
  });

  // ===========================================================================
  // analyzeImage
  // ===========================================================================
  describe('analyzeImage', () => {
    it('should analyze an image and return DeepfakeAnalysisResult', async () => {
      const imageBuffer = Buffer.alloc(1000);

      const result = await deepfakeDetectionService.analyzeImage(imageBuffer);

      expect(result).toHaveProperty('isDeepfake');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('analysisDetails');
      expect(result).toHaveProperty('processingTimeMs');
      expect(result).toHaveProperty('modelVersion');
      expect(typeof result.isDeepfake).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should include analysis details breakdown', async () => {
      const imageBuffer = Buffer.alloc(1000);

      const result = await deepfakeDetectionService.analyzeImage(imageBuffer);

      const { analysisDetails } = result;
      expect(analysisDetails).toHaveProperty('frequencyDomainScore');
      expect(analysisDetails).toHaveProperty('facialConsistencyScore');
      expect(analysisDetails).toHaveProperty('temporalConsistencyScore');
      expect(analysisDetails).toHaveProperty('blendingArtifactScore');
      expect(analysisDetails).toHaveProperty('compressionArtifactScore');
    });

    it('should have zero temporal score for single image', async () => {
      const imageBuffer = Buffer.alloc(1000);

      const result = await deepfakeDetectionService.analyzeImage(imageBuffer);

      expect(result.analysisDetails.temporalConsistencyScore).toBe(0);
    });

    it('should cache results', async () => {
      const imageBuffer = Buffer.alloc(1000);

      const result1 = await deepfakeDetectionService.analyzeImage(imageBuffer);
      const result2 = await deepfakeDetectionService.analyzeImage(imageBuffer);

      // Should return the same cached result (same processing time)
      expect(result1.processingTimeMs).toBe(result2.processingTimeMs);
    });

    it('should include model version', async () => {
      const imageBuffer = Buffer.alloc(1000);

      const result = await deepfakeDetectionService.analyzeImage(imageBuffer);

      expect(typeof result.modelVersion).toBe('string');
      expect(result.modelVersion.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // trainClassifier
  // ===========================================================================
  describe('trainClassifier', () => {
    it('should train classifier with labeled data', async () => {
      const data = [
        { features: new Array(256).fill(0.1), label: 0 },
        { features: new Array(256).fill(0.9), label: 1 },
        { features: new Array(256).fill(0.2), label: 0 },
        { features: new Array(256).fill(0.8), label: 1 },
      ];

      const result = await deepfakeDetectionService.trainClassifier(data, {
        epochs: 2,
        batchSize: 2,
      });

      expect(result).toHaveProperty('finalLoss');
      expect(result).toHaveProperty('finalAccuracy');
      expect(typeof result.finalLoss).toBe('number');
      expect(typeof result.finalAccuracy).toBe('number');
    });

    it('should throw if no data provided', async () => {
      await expect(
        deepfakeDetectionService.trainClassifier([])
      ).rejects.toThrow();
    });
  });

  // ===========================================================================
  // Private methods via (service as any)
  // ===========================================================================
  describe('analyzeTemporalConsistency', () => {
    it('should analyze temporal consistency across frame features', () => {
      const frameFeatures = [
        { frequencyFeatures: [0.1, 0.2], spatialFeatures: [0.5], faceRegionStats: { mean: 128, std: 20, skewness: 0, kurtosis: 0 }, edgeConsistency: 0.9, noisePatternScore: 0.1, blendingScore: 0.1, compressionScore: 0.1 },
        { frequencyFeatures: [0.12, 0.21], spatialFeatures: [0.5], faceRegionStats: { mean: 129, std: 20, skewness: 0, kurtosis: 0 }, edgeConsistency: 0.88, noisePatternScore: 0.1, blendingScore: 0.1, compressionScore: 0.1 },
      ];

      const result = (deepfakeDetectionService as any).analyzeTemporalConsistency(frameFeatures);

      expect(result).toHaveProperty('interFrameConsistency');
      expect(result).toHaveProperty('motionSmoothness');
      expect(typeof result.interFrameConsistency).toBe('number');
    });
  });
});
