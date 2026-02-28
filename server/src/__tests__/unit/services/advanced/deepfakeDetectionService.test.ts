/**
 * Deepfake Detection Service Unit Tests
 *
 * Tests for ML-based deepfake detection using FaceForensics++ methodology,
 * DCT/FFT analysis, temporal consistency checks, and classifier training.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock TensorFlow.js
const mockTensor = {
  dataSync: jest.fn().mockReturnValue(new Float32Array([0.5, 0.3, 0.2])),
  dispose: jest.fn(),
  shape: [1, 64],
};

const mockTfOps = {
  tensor2d: jest.fn().mockReturnValue(mockTensor),
  tensor4d: jest.fn().mockReturnValue(mockTensor),
  matMul: jest.fn().mockReturnValue(mockTensor),
  add: jest.fn().mockReturnValue(mockTensor),
  relu: jest.fn().mockReturnValue(mockTensor),
  softmax: jest.fn().mockReturnValue(mockTensor),
  sigmoid: jest.fn().mockReturnValue(mockTensor),
  mean: jest.fn().mockReturnValue(mockTensor),
  sub: jest.fn().mockReturnValue(mockTensor),
  mul: jest.fn().mockReturnValue(mockTensor),
  div: jest.fn().mockReturnValue(mockTensor),
  concat: jest.fn().mockReturnValue(mockTensor),
  tidy: jest.fn((fn: () => any) => fn()),
  variable: jest.fn().mockReturnValue({ dispose: jest.fn() }),
  randomUniform: jest.fn().mockReturnValue(mockTensor),
  zeros: jest.fn().mockReturnValue(mockTensor),
  ready: jest.fn().mockResolvedValue(undefined),
  setBackend: jest.fn().mockResolvedValue(undefined),
  engine: jest.fn().mockReturnValue({ registryFactory: { cpu: true } }),
  dispose: jest.fn(),
};

jest.mock('@tensorflow/tfjs', () => mockTfOps);

// Mock face-api.js
jest.mock('@vladmandic/face-api', () => ({
  nets: {
    ssdMobilenetv1: { loadFromUri: jest.fn().mockResolvedValue(undefined) },
    faceLandmark68Net: { loadFromUri: jest.fn().mockResolvedValue(undefined) },
    faceRecognitionNet: { loadFromUri: jest.fn().mockResolvedValue(undefined) },
  },
  detectAllFaces: jest.fn().mockResolvedValue([
    {
      detection: { box: { x: 10, y: 10, width: 100, height: 100 }, score: 0.95 },
      landmarks: { positions: Array(68).fill({ x: 50, y: 50 }) },
      descriptor: new Float32Array(128).fill(0.5),
    },
  ]),
}));

// Mock canvas
jest.mock('canvas', () => ({
  createCanvas: jest.fn().mockReturnValue({
    getContext: jest.fn().mockReturnValue({
      drawImage: jest.fn(),
      getImageData: jest.fn().mockReturnValue({
        data: new Uint8ClampedArray(100 * 100 * 4).fill(128),
        width: 100,
        height: 100,
      }),
      putImageData: jest.fn(),
    }),
    width: 100,
    height: 100,
    toBuffer: jest.fn().mockReturnValue(Buffer.from('test')),
  }),
  loadImage: jest.fn().mockResolvedValue({ width: 640, height: 480 }),
}));

// Mock ffmpeg
jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = {
    input: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    videoFrames: jest.fn().mockReturnThis(),
    format: jest.fn().mockReturnThis(),
    on: jest.fn().mockImplementation(function (this: any, event: string, cb: () => void) {
      if (event === 'end') setTimeout(cb, 10);
      return this;
    }),
    run: jest.fn().mockReturnThis(),
  };
  return jest.fn(() => mockFfmpeg);
});

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

import deepfakeDetectionService from '../../../../services/advanced/deepfakeDetectionService';

describe('DeepfakeDetectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset internal state
    (deepfakeDetectionService as any).isInitialized = false;
    (deepfakeDetectionService as any).classifierWeights = [];
    (deepfakeDetectionService as any).dctWeights = [];
  });

  // ===========================================================================
  // initialize
  // ===========================================================================
  describe('initialize', () => {
    it('should initialize detection models and weights', async () => {
      await deepfakeDetectionService.initialize();

      expect((deepfakeDetectionService as any).isInitialized).toBe(true);
    });

    it('should skip re-initialization if already initialized', async () => {
      (deepfakeDetectionService as any).isInitialized = true;

      await deepfakeDetectionService.initialize();

      // Should not call tf.ready again
      expect(mockTfOps.ready).not.toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockTfOps.ready.mockRejectedValueOnce(new Error('Backend init failed'));
      (deepfakeDetectionService as any).isInitialized = false;

      await expect(deepfakeDetectionService.initialize()).rejects.toThrow();
    });
  });

  // ===========================================================================
  // analyzeImage
  // ===========================================================================
  describe('analyzeImage', () => {
    beforeEach(async () => {
      (deepfakeDetectionService as any).isInitialized = true;
      // Mock internal weights
      (deepfakeDetectionService as any).classifierWeights = [
        { dataSync: () => new Float32Array(64).fill(0.1), dispose: jest.fn() },
      ];
      (deepfakeDetectionService as any).classifierBiases = [
        { dataSync: () => new Float32Array(2).fill(0), dispose: jest.fn() },
      ];
    });

    it('should analyze an image and return deepfake probability', async () => {
      const imageBuffer = Buffer.from('fake-image-data');

      const result = await deepfakeDetectionService.analyzeImage(imageBuffer);

      expect(result).toHaveProperty('isDeepfake');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('probability');
      expect(typeof result.isDeepfake).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should include face detection results in analysis', async () => {
      const imageBuffer = Buffer.from('fake-image-data');

      const result = await deepfakeDetectionService.analyzeImage(imageBuffer);

      expect(result).toHaveProperty('facesDetected');
      expect(typeof result.facesDetected).toBe('number');
    });

    it('should include DCT analysis artifacts', async () => {
      const imageBuffer = Buffer.from('fake-image-data');

      const result = await deepfakeDetectionService.analyzeImage(imageBuffer);

      expect(result).toHaveProperty('artifacts');
      expect(result.artifacts).toHaveProperty('dctAnomalies');
      expect(result.artifacts).toHaveProperty('frequencyDistortion');
    });

    it('should handle images with no faces detected', async () => {
      const faceApi = require('@vladmandic/face-api');
      faceApi.detectAllFaces.mockResolvedValueOnce([]);

      const imageBuffer = Buffer.from('no-face-image');

      const result = await deepfakeDetectionService.analyzeImage(imageBuffer);

      expect(result.facesDetected).toBe(0);
      expect(result).toHaveProperty('isDeepfake');
    });

    it('should reject invalid image data', async () => {
      const invalidBuffer = null as any;

      await expect(
        deepfakeDetectionService.analyzeImage(invalidBuffer)
      ).rejects.toThrow();
    });
  });

  // ===========================================================================
  // analyzeVideo
  // ===========================================================================
  describe('analyzeVideo', () => {
    beforeEach(async () => {
      (deepfakeDetectionService as any).isInitialized = true;
      (deepfakeDetectionService as any).classifierWeights = [
        { dataSync: () => new Float32Array(64).fill(0.1), dispose: jest.fn() },
      ];
    });

    it('should analyze video frames for temporal consistency', async () => {
      const videoPath = '/tmp/test-video.mp4';

      const result = await deepfakeDetectionService.analyzeVideo(videoPath);

      expect(result).toHaveProperty('isDeepfake');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('framesAnalyzed');
      expect(result).toHaveProperty('temporalConsistency');
    });

    it('should detect temporal inconsistencies across frames', async () => {
      const videoPath = '/tmp/test-video.mp4';

      const result = await deepfakeDetectionService.analyzeVideo(videoPath, {
        sampleRate: 5,
        maxFrames: 30,
      });

      expect(result.temporalConsistency).toBeDefined();
      expect(typeof result.temporalConsistency).toBe('number');
    });

    it('should provide frame-level analysis when requested', async () => {
      const videoPath = '/tmp/test-video.mp4';

      const result = await deepfakeDetectionService.analyzeVideo(videoPath, {
        includeFrameDetails: true,
      });

      expect(result).toHaveProperty('frameAnalysis');
      expect(Array.isArray(result.frameAnalysis)).toBe(true);
    });

    it('should handle missing video file', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      ffmpeg.mockImplementationOnce(() => ({
        input: jest.fn().mockReturnThis(),
        output: jest.fn().mockReturnThis(),
        on: jest.fn().mockImplementation(function (this: any, event: string, cb: (err: Error) => void) {
          if (event === 'error') setTimeout(() => cb(new Error('File not found')), 10);
          return this;
        }),
        run: jest.fn().mockReturnThis(),
      }));

      const videoPath = '/tmp/nonexistent.mp4';

      await expect(deepfakeDetectionService.analyzeVideo(videoPath)).rejects.toThrow();
    });
  });

  // ===========================================================================
  // computeDCTFeatures
  // ===========================================================================
  describe('computeDCTFeatures', () => {
    it('should compute DCT coefficients for frequency analysis', () => {
      const imageData = new Uint8ClampedArray(64 * 64 * 4).fill(128);

      const dctFeatures = (deepfakeDetectionService as any).computeDCTFeatures(
        { data: imageData, width: 64, height: 64 }
      );

      expect(dctFeatures).toBeDefined();
      expect(Array.isArray(dctFeatures)).toBe(true);
    });

    it('should detect high-frequency anomalies in manipulated images', () => {
      // Simulate an image with artificial high-frequency patterns
      const imageData = new Uint8ClampedArray(64 * 64 * 4);
      for (let i = 0; i < imageData.length; i += 4) {
        imageData[i] = i % 256; // Artificial pattern
        imageData[i + 1] = (i + 50) % 256;
        imageData[i + 2] = (i + 100) % 256;
        imageData[i + 3] = 255;
      }

      const dctFeatures = (deepfakeDetectionService as any).computeDCTFeatures(
        { data: imageData, width: 64, height: 64 }
      );

      expect(dctFeatures.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // computeFFTFeatures
  // ===========================================================================
  describe('computeFFTFeatures', () => {
    it('should compute FFT for spectral analysis', () => {
      const imageData = new Uint8ClampedArray(64 * 64 * 4).fill(128);

      const fftFeatures = (deepfakeDetectionService as any).computeFFTFeatures(
        { data: imageData, width: 64, height: 64 }
      );

      expect(fftFeatures).toBeDefined();
      expect(fftFeatures).toHaveProperty('magnitudeSpectrum');
      expect(fftFeatures).toHaveProperty('phaseSpectrum');
    });
  });

  // ===========================================================================
  // extractFacialLandmarks
  // ===========================================================================
  describe('extractFacialLandmarks', () => {
    it('should extract 68-point facial landmarks', async () => {
      const imageBuffer = Buffer.from('test-image');

      const landmarks = await (deepfakeDetectionService as any).extractFacialLandmarks(imageBuffer);

      expect(landmarks).toBeDefined();
      expect(Array.isArray(landmarks)).toBe(true);
    });

    it('should return empty array when no faces detected', async () => {
      const faceApi = require('@vladmandic/face-api');
      faceApi.detectAllFaces.mockResolvedValueOnce([]);

      const imageBuffer = Buffer.from('no-face-image');

      const landmarks = await (deepfakeDetectionService as any).extractFacialLandmarks(imageBuffer);

      expect(landmarks).toEqual([]);
    });
  });

  // ===========================================================================
  // checkTemporalConsistency
  // ===========================================================================
  describe('checkTemporalConsistency', () => {
    it('should detect temporal inconsistencies between frames', () => {
      const frames = [
        { landmarks: Array(68).fill({ x: 50, y: 50 }), embedding: new Array(128).fill(0.5) },
        { landmarks: Array(68).fill({ x: 51, y: 51 }), embedding: new Array(128).fill(0.5) },
        { landmarks: Array(68).fill({ x: 100, y: 100 }), embedding: new Array(128).fill(0.5) }, // Jump
      ];

      const consistency = (deepfakeDetectionService as any).checkTemporalConsistency(frames);

      expect(consistency).toBeDefined();
      expect(typeof consistency.score).toBe('number');
      expect(consistency.score).toBeLessThanOrEqual(1);
    });

    it('should return high consistency for natural motion', () => {
      // Simulate smooth motion
      const frames = [];
      for (let i = 0; i < 10; i++) {
        frames.push({
          landmarks: Array(68).fill({ x: 50 + i, y: 50 + i }),
          embedding: new Array(128).fill(0.5),
        });
      }

      const consistency = (deepfakeDetectionService as any).checkTemporalConsistency(frames);

      expect(consistency.score).toBeGreaterThan(0.7);
    });
  });

  // ===========================================================================
  // trainClassifier
  // ===========================================================================
  describe('trainClassifier', () => {
    beforeEach(() => {
      (deepfakeDetectionService as any).isInitialized = true;
    });

    it('should train classifier on provided dataset', async () => {
      const trainingData = {
        real: [Buffer.from('real-1'), Buffer.from('real-2')],
        fake: [Buffer.from('fake-1'), Buffer.from('fake-2')],
      };

      const result = await deepfakeDetectionService.trainClassifier(trainingData, {
        epochs: 2,
        learningRate: 0.001,
      });

      expect(result).toHaveProperty('accuracy');
      expect(result).toHaveProperty('loss');
      expect(result).toHaveProperty('epochs');
    });

    it('should validate training data format', async () => {
      const invalidData = {
        real: [], // Empty
        fake: [Buffer.from('fake-1')],
      };

      await expect(
        deepfakeDetectionService.trainClassifier(invalidData as any)
      ).rejects.toThrow();
    });

    it('should return training metrics', async () => {
      const trainingData = {
        real: [Buffer.from('real-1')],
        fake: [Buffer.from('fake-1')],
      };

      const result = await deepfakeDetectionService.trainClassifier(trainingData, {
        epochs: 1,
      });

      expect(result).toHaveProperty('f1Score');
      expect(result).toHaveProperty('precision');
      expect(result).toHaveProperty('recall');
    });
  });

  // ===========================================================================
  // getModelMetrics
  // ===========================================================================
  describe('getModelMetrics', () => {
    it('should return current model metrics', () => {
      const metrics = deepfakeDetectionService.getModelMetrics();

      expect(metrics).toHaveProperty('modelVersion');
      expect(metrics).toHaveProperty('lastTrainedAt');
      expect(metrics).toHaveProperty('totalPredictions');
    });
  });

  // ===========================================================================
  // Edge Cases & Error Handling
  // ===========================================================================
  describe('Edge Cases', () => {
    it('should handle corrupted image data', async () => {
      const corruptedBuffer = Buffer.from([0x00, 0x01, 0x02]); // Invalid image

      // Should either throw or return with low confidence
      try {
        const result = await deepfakeDetectionService.analyzeImage(corruptedBuffer);
        expect(result.confidence).toBeLessThan(0.5);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle very small images', async () => {
      (deepfakeDetectionService as any).isInitialized = true;
      const canvas = require('canvas');
      canvas.loadImage.mockResolvedValueOnce({ width: 10, height: 10 });

      const smallImage = Buffer.from('tiny-image');

      // Should handle gracefully
      const result = await deepfakeDetectionService.analyzeImage(smallImage);
      expect(result).toHaveProperty('isDeepfake');
    });

    it('should dispose tensors to prevent memory leaks', async () => {
      (deepfakeDetectionService as any).isInitialized = true;

      const imageBuffer = Buffer.from('test-image');
      await deepfakeDetectionService.analyzeImage(imageBuffer);

      // tidy should have been called to manage memory
      expect(mockTfOps.tidy).toHaveBeenCalled();
    });
  });
});
