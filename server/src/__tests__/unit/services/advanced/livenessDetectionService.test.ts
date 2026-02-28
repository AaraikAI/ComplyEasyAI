/**
 * Liveness Detection Service Unit Tests
 *
 * Tests for biometric liveness detection including Eye Aspect Ratio (EAR),
 * head pose estimation, texture analysis, depth verification, and challenge-response.
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
  tensor3d: jest.fn().mockReturnValue(mockTensor),
  tensor4d: jest.fn().mockReturnValue(mockTensor),
  matMul: jest.fn().mockReturnValue(mockTensor),
  add: jest.fn().mockReturnValue(mockTensor),
  relu: jest.fn().mockReturnValue(mockTensor),
  softmax: jest.fn().mockReturnValue(mockTensor),
  sigmoid: jest.fn().mockReturnValue(mockTensor),
  mean: jest.fn().mockReturnValue(mockTensor),
  tidy: jest.fn((fn: () => any) => fn()),
  variable: jest.fn().mockReturnValue({ dispose: jest.fn() }),
  ready: jest.fn().mockResolvedValue(undefined),
  setBackend: jest.fn().mockResolvedValue(undefined),
  engine: jest.fn().mockReturnValue({ registryFactory: { cpu: true } }),
};

jest.mock('@tensorflow/tfjs', () => mockTfOps);

// Mock face-api.js / MediaPipe
const mockFaceLandmarks = {
  positions: Array(468).fill({ x: 100, y: 100, z: 0 }),
  getLeftEye: jest.fn().mockReturnValue([
    { x: 80, y: 100 }, { x: 85, y: 95 }, { x: 90, y: 95 },
    { x: 95, y: 100 }, { x: 90, y: 105 }, { x: 85, y: 105 },
  ]),
  getRightEye: jest.fn().mockReturnValue([
    { x: 110, y: 100 }, { x: 115, y: 95 }, { x: 120, y: 95 },
    { x: 125, y: 100 }, { x: 120, y: 105 }, { x: 115, y: 105 },
  ]),
  getNose: jest.fn().mockReturnValue([{ x: 100, y: 120 }]),
  getMouth: jest.fn().mockReturnValue([
    { x: 90, y: 140 }, { x: 100, y: 145 }, { x: 110, y: 140 },
  ]),
};

jest.mock('@vladmandic/face-api', () => ({
  nets: {
    faceLandmark68Net: { loadFromUri: jest.fn().mockResolvedValue(undefined) },
    ssdMobilenetv1: { loadFromUri: jest.fn().mockResolvedValue(undefined) },
  },
  detectSingleFace: jest.fn().mockResolvedValue({
    detection: { box: { x: 50, y: 50, width: 100, height: 100 }, score: 0.95 },
    landmarks: mockFaceLandmarks,
  }),
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
    }),
    width: 100,
    height: 100,
  }),
  loadImage: jest.fn().mockResolvedValue({ width: 640, height: 480 }),
}));

// Mock crypto for challenge generation
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn().mockReturnValue(Buffer.from('challenge123')),
  randomUUID: jest.fn().mockReturnValue('challenge-uuid-123'),
}));

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

import livenessDetectionService from '../../../../services/advanced/livenessDetectionService';

describe('LivenessDetectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset internal state
    (livenessDetectionService as any).isInitialized = false;
    (livenessDetectionService as any).activeChallenges = new Map();
    (livenessDetectionService as any).blinkHistory = new Map();
  });

  // ===========================================================================
  // initialize
  // ===========================================================================
  describe('initialize', () => {
    it('should initialize detection models', async () => {
      await livenessDetectionService.initialize();

      expect((livenessDetectionService as any).isInitialized).toBe(true);
    });

    it('should load face landmark detection model', async () => {
      const faceApi = require('@vladmandic/face-api');

      await livenessDetectionService.initialize();

      expect(faceApi.nets.faceLandmark68Net.loadFromUri).toHaveBeenCalled();
    });

    it('should skip re-initialization', async () => {
      (livenessDetectionService as any).isInitialized = true;

      await livenessDetectionService.initialize();

      expect(mockTfOps.ready).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // analyzeImage
  // ===========================================================================
  describe('analyzeImage', () => {
    beforeEach(async () => {
      (livenessDetectionService as any).isInitialized = true;
    });

    it('should analyze single image for liveness', async () => {
      const imageBuffer = Buffer.from('test-image');

      const result = await livenessDetectionService.analyzeImage(imageBuffer);

      expect(result).toHaveProperty('isLive');
      expect(result).toHaveProperty('confidence');
      expect(typeof result.isLive).toBe('boolean');
    });

    it('should compute Eye Aspect Ratio (EAR)', async () => {
      const imageBuffer = Buffer.from('test-image');

      const result = await livenessDetectionService.analyzeImage(imageBuffer);

      expect(result).toHaveProperty('eyeAspectRatio');
      expect(typeof result.eyeAspectRatio).toBe('number');
    });

    it('should detect face in image', async () => {
      const imageBuffer = Buffer.from('test-image');

      const result = await livenessDetectionService.analyzeImage(imageBuffer);

      expect(result).toHaveProperty('faceDetected');
      expect(result.faceDetected).toBe(true);
    });

    it('should return low confidence when no face detected', async () => {
      const faceApi = require('@vladmandic/face-api');
      faceApi.detectSingleFace.mockResolvedValueOnce(null);

      const imageBuffer = Buffer.from('no-face-image');

      const result = await livenessDetectionService.analyzeImage(imageBuffer);

      expect(result.faceDetected).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should include texture analysis results', async () => {
      const imageBuffer = Buffer.from('test-image');

      const result = await livenessDetectionService.analyzeImage(imageBuffer);

      expect(result).toHaveProperty('textureScore');
    });

    it('should handle invalid image data', async () => {
      const invalidBuffer = null as any;

      await expect(
        livenessDetectionService.analyzeImage(invalidBuffer)
      ).rejects.toThrow();
    });
  });

  // ===========================================================================
  // analyzeVideo
  // ===========================================================================
  describe('analyzeVideo', () => {
    beforeEach(() => {
      (livenessDetectionService as any).isInitialized = true;
    });

    it('should analyze video stream for liveness', async () => {
      const frames = [
        Buffer.from('frame1'),
        Buffer.from('frame2'),
        Buffer.from('frame3'),
      ];

      const result = await livenessDetectionService.analyzeVideo(frames);

      expect(result).toHaveProperty('isLive');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('framesAnalyzed');
    });

    it('should detect blinks across frames', async () => {
      const frames = [
        Buffer.from('eyes-open'),
        Buffer.from('eyes-closed'),
        Buffer.from('eyes-open'),
      ];

      const result = await livenessDetectionService.analyzeVideo(frames);

      expect(result).toHaveProperty('blinksDetected');
    });

    it('should analyze head movement', async () => {
      const frames = Array(10).fill(null).map(() => Buffer.from('frame'));

      const result = await livenessDetectionService.analyzeVideo(frames);

      expect(result).toHaveProperty('headMovement');
    });

    it('should require minimum number of frames', async () => {
      const frames = [Buffer.from('single-frame')];

      const result = await livenessDetectionService.analyzeVideo(frames);

      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  // ===========================================================================
  // computeEyeAspectRatio
  // ===========================================================================
  describe('computeEyeAspectRatio', () => {
    it('should compute EAR from eye landmarks', () => {
      const eyeLandmarks = [
        { x: 0, y: 0 }, { x: 1, y: -1 }, { x: 2, y: -1 },
        { x: 3, y: 0 }, { x: 2, y: 1 }, { x: 1, y: 1 },
      ];

      const ear = (livenessDetectionService as any).computeEyeAspectRatio(eyeLandmarks);

      expect(typeof ear).toBe('number');
      expect(ear).toBeGreaterThan(0);
      expect(ear).toBeLessThan(1);
    });

    it('should return low EAR for closed eyes', () => {
      // Simulate closed eye (flat landmarks)
      const closedEyeLandmarks = [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
        { x: 3, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 0 },
      ];

      const ear = (livenessDetectionService as any).computeEyeAspectRatio(closedEyeLandmarks);

      expect(ear).toBeLessThan(0.2);
    });

    it('should return higher EAR for open eyes', () => {
      // Simulate open eye (vertical spread)
      const openEyeLandmarks = [
        { x: 0, y: 0 }, { x: 1, y: -2 }, { x: 2, y: -2 },
        { x: 3, y: 0 }, { x: 2, y: 2 }, { x: 1, y: 2 },
      ];

      const ear = (livenessDetectionService as any).computeEyeAspectRatio(openEyeLandmarks);

      expect(ear).toBeGreaterThan(0.2);
    });
  });

  // ===========================================================================
  // detectBlink
  // ===========================================================================
  describe('detectBlink', () => {
    it('should detect blink from EAR sequence', () => {
      // Simulate blink: open -> closed -> open
      const earSequence = [0.35, 0.32, 0.15, 0.12, 0.18, 0.30, 0.35];

      const blinks = (livenessDetectionService as any).detectBlinks(earSequence);

      expect(blinks).toBeGreaterThan(0);
    });

    it('should not detect blink in constant EAR', () => {
      const constantEar = [0.35, 0.35, 0.35, 0.35, 0.35];

      const blinks = (livenessDetectionService as any).detectBlinks(constantEar);

      expect(blinks).toBe(0);
    });

    it('should use configurable threshold', () => {
      const earSequence = [0.35, 0.25, 0.35]; // Slight dip

      const blinksStrict = (livenessDetectionService as any).detectBlinks(earSequence, 0.2);
      const blinksRelaxed = (livenessDetectionService as any).detectBlinks(earSequence, 0.3);

      expect(blinksRelaxed).toBeGreaterThanOrEqual(blinksStrict);
    });
  });

  // ===========================================================================
  // estimateHeadPose
  // ===========================================================================
  describe('estimateHeadPose', () => {
    it('should estimate head rotation angles', () => {
      const landmarks = mockFaceLandmarks;

      const pose = (livenessDetectionService as any).estimateHeadPose(landmarks);

      expect(pose).toHaveProperty('yaw');
      expect(pose).toHaveProperty('pitch');
      expect(pose).toHaveProperty('roll');
    });

    it('should detect frontal face', () => {
      const frontalLandmarks = {
        ...mockFaceLandmarks,
        getNose: jest.fn().mockReturnValue([{ x: 100, y: 120 }]), // Centered
      };

      const pose = (livenessDetectionService as any).estimateHeadPose(frontalLandmarks);

      expect(Math.abs(pose.yaw)).toBeLessThan(15);
      expect(Math.abs(pose.pitch)).toBeLessThan(15);
    });

    it('should detect head turn', () => {
      const turnedLandmarks = {
        ...mockFaceLandmarks,
        getNose: jest.fn().mockReturnValue([{ x: 130, y: 120 }]), // Off-center
      };

      const pose = (livenessDetectionService as any).estimateHeadPose(turnedLandmarks);

      expect(Math.abs(pose.yaw)).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // analyzeTexture
  // ===========================================================================
  describe('analyzeTexture', () => {
    it('should compute texture features', () => {
      const imageData = {
        data: new Uint8ClampedArray(100 * 100 * 4).fill(128),
        width: 100,
        height: 100,
      };

      const texture = (livenessDetectionService as any).analyzeTexture(imageData);

      expect(texture).toHaveProperty('lbpScore');
      expect(texture).toHaveProperty('variance');
    });

    it('should detect flat texture (potential photo attack)', () => {
      // Uniform image (no texture variation)
      const flatImageData = {
        data: new Uint8ClampedArray(100 * 100 * 4).fill(128),
        width: 100,
        height: 100,
      };

      const texture = (livenessDetectionService as any).analyzeTexture(flatImageData);

      expect(texture.variance).toBeLessThan(10);
    });

    it('should detect natural skin texture', () => {
      // Simulate natural texture with variation
      const texturedImageData = {
        data: new Uint8ClampedArray(100 * 100 * 4),
        width: 100,
        height: 100,
      };
      for (let i = 0; i < texturedImageData.data.length; i += 4) {
        texturedImageData.data[i] = 120 + Math.random() * 40;
        texturedImageData.data[i + 1] = 100 + Math.random() * 40;
        texturedImageData.data[i + 2] = 90 + Math.random() * 40;
        texturedImageData.data[i + 3] = 255;
      }

      const texture = (livenessDetectionService as any).analyzeTexture(texturedImageData);

      expect(texture.variance).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Challenge-Response
  // ===========================================================================
  describe('createChallenge', () => {
    it('should create a new challenge', async () => {
      const challenge = await livenessDetectionService.createChallenge('session-123');

      expect(challenge).toHaveProperty('challengeId');
      expect(challenge).toHaveProperty('action');
      expect(challenge).toHaveProperty('expiresAt');
    });

    it('should generate different challenge types', async () => {
      const challenges = [];
      for (let i = 0; i < 10; i++) {
        challenges.push(await livenessDetectionService.createChallenge(`session-${i}`));
      }

      const actions = challenges.map(c => c.action);
      const uniqueActions = new Set(actions);

      // Should have multiple different challenge types
      expect(uniqueActions.size).toBeGreaterThan(1);
    });

    it('should store challenge for verification', async () => {
      const challenge = await livenessDetectionService.createChallenge('session-123');

      const stored = (livenessDetectionService as any).activeChallenges.get(challenge.challengeId);
      expect(stored).toBeDefined();
    });

    it('should set expiration time', async () => {
      const challenge = await livenessDetectionService.createChallenge('session-123');

      expect(new Date(challenge.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('verifyChallengeResponse', () => {
    beforeEach(async () => {
      (livenessDetectionService as any).isInitialized = true;
      (livenessDetectionService as any).activeChallenges = new Map();
    });

    it('should verify successful challenge completion', async () => {
      const challenge = {
        challengeId: 'challenge-1',
        action: 'blink',
        sessionId: 'session-123',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      };
      (livenessDetectionService as any).activeChallenges.set('challenge-1', challenge);

      // Mock frames showing blink
      const frames = [
        Buffer.from('eyes-open'),
        Buffer.from('eyes-closed'),
        Buffer.from('eyes-open'),
      ];

      const result = await livenessDetectionService.verifyChallengeResponse(
        'challenge-1',
        frames
      );

      expect(result).toHaveProperty('verified');
      expect(result).toHaveProperty('confidence');
    });

    it('should reject expired challenge', async () => {
      const challenge = {
        challengeId: 'challenge-1',
        action: 'blink',
        sessionId: 'session-123',
        createdAt: new Date(Date.now() - 120000),
        expiresAt: new Date(Date.now() - 60000), // Expired
      };
      (livenessDetectionService as any).activeChallenges.set('challenge-1', challenge);

      const frames = [Buffer.from('frame')];

      const result = await livenessDetectionService.verifyChallengeResponse(
        'challenge-1',
        frames
      );

      expect(result.verified).toBe(false);
      expect(result.reason).toContain('expired');
    });

    it('should reject unknown challenge', async () => {
      const frames = [Buffer.from('frame')];

      const result = await livenessDetectionService.verifyChallengeResponse(
        'unknown-challenge',
        frames
      );

      expect(result.verified).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('should verify turn head challenge', async () => {
      const challenge = {
        challengeId: 'challenge-1',
        action: 'turn_left',
        sessionId: 'session-123',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      };
      (livenessDetectionService as any).activeChallenges.set('challenge-1', challenge);

      const frames = Array(10).fill(null).map(() => Buffer.from('frame'));

      const result = await livenessDetectionService.verifyChallengeResponse(
        'challenge-1',
        frames
      );

      expect(result).toHaveProperty('verified');
    });

    it('should clean up challenge after verification', async () => {
      const challenge = {
        challengeId: 'challenge-1',
        action: 'blink',
        sessionId: 'session-123',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      };
      (livenessDetectionService as any).activeChallenges.set('challenge-1', challenge);

      const frames = [Buffer.from('frame')];

      await livenessDetectionService.verifyChallengeResponse('challenge-1', frames);

      expect((livenessDetectionService as any).activeChallenges.has('challenge-1')).toBe(false);
    });
  });

  // ===========================================================================
  // Depth Analysis
  // ===========================================================================
  describe('analyzeDepth', () => {
    it('should analyze depth from stereo images', () => {
      const leftImage = { data: new Uint8ClampedArray(100 * 100 * 4).fill(128), width: 100, height: 100 };
      const rightImage = { data: new Uint8ClampedArray(100 * 100 * 4).fill(130), width: 100, height: 100 };

      const depth = (livenessDetectionService as any).analyzeDepth(leftImage, rightImage);

      expect(depth).toHaveProperty('hasDepth');
      expect(depth).toHaveProperty('depthVariance');
    });

    it('should detect flat surface (photo attack)', () => {
      // Identical images = no depth
      const image = { data: new Uint8ClampedArray(100 * 100 * 4).fill(128), width: 100, height: 100 };

      const depth = (livenessDetectionService as any).analyzeDepth(image, image);

      expect(depth.hasDepth).toBe(false);
    });
  });

  // ===========================================================================
  // Anti-Spoofing
  // ===========================================================================
  describe('Anti-Spoofing Detection', () => {
    beforeEach(() => {
      (livenessDetectionService as any).isInitialized = true;
    });

    it('should detect screen/display attack', async () => {
      // Simulate image with moiré pattern (screen capture)
      const imageBuffer = Buffer.from('screen-capture');

      const result = await livenessDetectionService.analyzeImage(imageBuffer);

      expect(result).toHaveProperty('spoofingIndicators');
    });

    it('should detect printed photo attack', async () => {
      const imageBuffer = Buffer.from('printed-photo');

      const result = await livenessDetectionService.analyzeImage(imageBuffer);

      expect(result).toHaveProperty('spoofingIndicators');
    });

    it('should detect mask attack', async () => {
      const imageBuffer = Buffer.from('mask-image');

      const result = await livenessDetectionService.analyzeImage(imageBuffer);

      expect(result).toHaveProperty('spoofingIndicators');
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================
  describe('Edge Cases', () => {
    beforeEach(() => {
      (livenessDetectionService as any).isInitialized = true;
    });

    it('should handle partial face visibility', async () => {
      const faceApi = require('@vladmandic/face-api');
      faceApi.detectSingleFace.mockResolvedValueOnce({
        detection: { box: { x: 0, y: 50, width: 50, height: 100 }, score: 0.7 },
        landmarks: {
          ...mockFaceLandmarks,
          getLeftEye: jest.fn().mockReturnValue([]), // No left eye visible
        },
      });

      const imageBuffer = Buffer.from('partial-face');

      const result = await livenessDetectionService.analyzeImage(imageBuffer);

      expect(result.confidence).toBeLessThan(0.8);
    });

    it('should handle low light conditions', async () => {
      // Very dark image
      const darkImageData = {
        data: new Uint8ClampedArray(100 * 100 * 4).fill(10),
        width: 100,
        height: 100,
      };

      const texture = (livenessDetectionService as any).analyzeTexture(darkImageData);

      expect(texture.quality).toBe('low');
    });

    it('should handle multiple faces', async () => {
      const faceApi = require('@vladmandic/face-api');
      faceApi.detectSingleFace.mockResolvedValueOnce({
        detection: { box: { x: 50, y: 50, width: 100, height: 100 }, score: 0.95 },
        landmarks: mockFaceLandmarks,
      });

      const imageBuffer = Buffer.from('multiple-faces');

      const result = await livenessDetectionService.analyzeImage(imageBuffer);

      // Should still analyze primary face
      expect(result.faceDetected).toBe(true);
    });

    it('should handle extreme head poses', async () => {
      const extremePose = {
        ...mockFaceLandmarks,
        getNose: jest.fn().mockReturnValue([{ x: 50, y: 120 }]), // Very turned
      };

      const pose = (livenessDetectionService as any).estimateHeadPose(extremePose);

      expect(Math.abs(pose.yaw)).toBeGreaterThan(30);
    });
  });
});
