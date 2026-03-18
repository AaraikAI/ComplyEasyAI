/**
 * Liveness Detection Service Unit Tests
 *
 * Tests for biometric liveness detection including Eye Aspect Ratio (EAR),
 * head pose estimation, texture analysis, depth verification, and challenge-response.
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

import livenessDetectionService from '../../../../services/advanced/livenessDetectionService';

describe('LivenessDetectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset internal state
    (livenessDetectionService as any).isInitialized = false;
    (livenessDetectionService as any).activeChallenges = new Map();
    (livenessDetectionService as any).sessionHistory = new Map();
    (livenessDetectionService as any).antiSpoofModel = null;
  });

  // ===========================================================================
  // initialize
  // ===========================================================================
  describe('initialize', () => {
    it('should initialize the service', async () => {
      await livenessDetectionService.initialize();
      expect((livenessDetectionService as any).isInitialized).toBe(true);
    });

    it('should skip re-initialization', async () => {
      (livenessDetectionService as any).isInitialized = true;
      const initSpy = jest.spyOn(livenessDetectionService as any, 'initAntiSpoofModel');

      await livenessDetectionService.initialize();

      expect(initSpy).not.toHaveBeenCalled();
      initSpy.mockRestore();
    });
  });

  // ===========================================================================
  // analyzeImage
  // ===========================================================================
  describe('analyzeImage', () => {
    it('should analyze a single image and return LivenessResult', async () => {
      const imageBuffer = Buffer.alloc(1000);

      const result = await livenessDetectionService.analyzeImage(imageBuffer);

      expect(result).toHaveProperty('isLive');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('detectionDetails');
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('processingTimeMs');
      expect(typeof result.isLive).toBe('boolean');
      expect(typeof result.overallScore).toBe('number');
    });

    it('should use provided session ID', async () => {
      const imageBuffer = Buffer.alloc(1000);

      const result = await livenessDetectionService.analyzeImage(imageBuffer, 'my-session');

      expect(result.sessionId).toBe('my-session');
    });

    it('should include detection details breakdown', async () => {
      const imageBuffer = Buffer.alloc(1000);

      const result = await livenessDetectionService.analyzeImage(imageBuffer);

      const { detectionDetails } = result;
      expect(detectionDetails).toHaveProperty('eyeBlinkScore');
      expect(detectionDetails).toHaveProperty('headPoseScore');
      expect(detectionDetails).toHaveProperty('textureAnalysisScore');
      expect(detectionDetails).toHaveProperty('depthAnalysisScore');
      expect(detectionDetails).toHaveProperty('motionAnalysisScore');
    });

    it('should have zero motion score for single image', async () => {
      const imageBuffer = Buffer.alloc(1000);

      const result = await livenessDetectionService.analyzeImage(imageBuffer);

      expect(result.detectionDetails.motionAnalysisScore).toBe(0);
    });
  });

  // ===========================================================================
  // createChallenge
  // ===========================================================================
  describe('createChallenge', () => {
    it('should create a challenge with default 3 actions', () => {
      const challenge = livenessDetectionService.createChallenge();

      expect(challenge).toHaveProperty('challengeId');
      expect(challenge).toHaveProperty('actions');
      expect(challenge).toHaveProperty('createdAt');
      expect(challenge).toHaveProperty('expiresAt');
      expect(challenge.actions.length).toBe(3);
    });

    it('should create a challenge with specified number of actions', () => {
      const challenge = livenessDetectionService.createChallenge(5);

      expect(challenge.actions.length).toBe(5);
    });

    it('should store the challenge for later verification', () => {
      const challenge = livenessDetectionService.createChallenge();

      const stored = (livenessDetectionService as any).activeChallenges.get(challenge.challengeId);
      expect(stored).toBeDefined();
      expect(stored.challengeId).toBe(challenge.challengeId);
    });

    it('should set an expiration in the future', () => {
      const challenge = livenessDetectionService.createChallenge();

      expect(new Date(challenge.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('should generate unique challenge IDs', () => {
      const c1 = livenessDetectionService.createChallenge();
      const c2 = livenessDetectionService.createChallenge();

      expect(c1.challengeId).not.toBe(c2.challengeId);
    });

    it('should include action order', () => {
      const challenge = livenessDetectionService.createChallenge(3);

      const orders = challenge.actions.map(a => a.order);
      expect(orders).toEqual([1, 2, 3]);
    });

    it('should include timeoutMs for each action', () => {
      const challenge = livenessDetectionService.createChallenge();

      for (const action of challenge.actions) {
        expect(typeof action.timeoutMs).toBe('number');
        expect(action.timeoutMs).toBeGreaterThan(0);
      }
    });
  });

  // ===========================================================================
  // verifyChallengeResponse
  // ===========================================================================
  describe('verifyChallengeResponse', () => {
    it('should throw for unknown challenge', async () => {
      const frames = [{ buffer: Buffer.alloc(100), timestamp: 0 }];

      await expect(
        livenessDetectionService.verifyChallengeResponse('nonexistent', frames)
      ).rejects.toThrow('Challenge not found');
    });

    it('should throw for expired challenge', async () => {
      const challenge = livenessDetectionService.createChallenge();
      // Manually expire it
      const stored = (livenessDetectionService as any).activeChallenges.get(challenge.challengeId);
      stored.expiresAt = new Date(Date.now() - 10000);

      const frames = [{ buffer: Buffer.alloc(100), timestamp: 0 }];

      await expect(
        livenessDetectionService.verifyChallengeResponse(challenge.challengeId, frames)
      ).rejects.toThrow('expired');
    });

    it('should clean up challenge after verification', async () => {
      const challenge = livenessDetectionService.createChallenge(1);
      const frames = [
        { buffer: Buffer.alloc(100), timestamp: 0 },
        { buffer: Buffer.alloc(100), timestamp: 100 },
      ];

      await livenessDetectionService.verifyChallengeResponse(challenge.challengeId, frames);

      expect(
        (livenessDetectionService as any).activeChallenges.has(challenge.challengeId)
      ).toBe(false);
    });

    it('should return LivenessResult with challengeResults', async () => {
      const challenge = livenessDetectionService.createChallenge(2);
      const frames = [
        { buffer: Buffer.alloc(100), timestamp: 0 },
        { buffer: Buffer.alloc(100), timestamp: 100 },
        { buffer: Buffer.alloc(100), timestamp: 200 },
      ];

      const result = await livenessDetectionService.verifyChallengeResponse(
        challenge.challengeId,
        frames
      );

      expect(result).toHaveProperty('isLive');
      expect(result).toHaveProperty('challengeResults');
      expect(result.challengeResults?.length).toBe(2);
    });
  });

  // ===========================================================================
  // Private helper methods (accessed via as any)
  // ===========================================================================
  describe('computeEAR', () => {
    it('should compute EAR from FaceLandmarks', () => {
      const landmarks = {
        leftEye: [
          { x: 0, y: 0 }, { x: 1, y: -1 }, { x: 2, y: -1 },
          { x: 3, y: 0 }, { x: 2, y: 1 }, { x: 1, y: 1 },
        ],
        rightEye: [
          { x: 10, y: 0 }, { x: 11, y: -1 }, { x: 12, y: -1 },
          { x: 13, y: 0 }, { x: 12, y: 1 }, { x: 11, y: 1 },
        ],
        nose: { x: 5, y: 5 },
        mouthLeft: { x: 2, y: 10 },
        mouthRight: { x: 8, y: 10 },
        jawline: [],
        leftEyebrow: [],
        rightEyebrow: [],
      };

      const ear = (livenessDetectionService as any).computeEAR(landmarks);

      expect(typeof ear).toBe('number');
      expect(ear).toBeGreaterThan(0);
      expect(ear).toBeLessThan(1);
    });

    it('should return low EAR for closed eyes (flat landmarks)', () => {
      const landmarks = {
        leftEye: [
          { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
          { x: 3, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 0 },
        ],
        rightEye: [
          { x: 10, y: 0 }, { x: 11, y: 0 }, { x: 12, y: 0 },
          { x: 13, y: 0 }, { x: 12, y: 0 }, { x: 11, y: 0 },
        ],
        nose: { x: 5, y: 5 },
        mouthLeft: { x: 2, y: 10 },
        mouthRight: { x: 8, y: 10 },
        jawline: [],
        leftEyebrow: [],
        rightEyebrow: [],
      };

      const ear = (livenessDetectionService as any).computeEAR(landmarks);

      expect(ear).toBeLessThan(0.1);
    });

    it('should return higher EAR for open eyes', () => {
      const landmarks = {
        leftEye: [
          { x: 0, y: 0 }, { x: 1, y: -2 }, { x: 2, y: -2 },
          { x: 3, y: 0 }, { x: 2, y: 2 }, { x: 1, y: 2 },
        ],
        rightEye: [
          { x: 10, y: 0 }, { x: 11, y: -2 }, { x: 12, y: -2 },
          { x: 13, y: 0 }, { x: 12, y: 2 }, { x: 11, y: 2 },
        ],
        nose: { x: 5, y: 5 },
        mouthLeft: { x: 2, y: 10 },
        mouthRight: { x: 8, y: 10 },
        jawline: [],
        leftEyebrow: [],
        rightEyebrow: [],
      };

      const ear = (livenessDetectionService as any).computeEAR(landmarks);

      expect(ear).toBeGreaterThan(0.5);
    });
  });

  describe('estimateHeadPose', () => {
    it('should estimate head rotation angles', () => {
      const landmarks = {
        leftEye: [{ x: 80, y: 100 }, { x: 85, y: 95 }, { x: 90, y: 100 }, { x: 85, y: 105 }],
        rightEye: [{ x: 110, y: 100 }, { x: 115, y: 95 }, { x: 120, y: 100 }, { x: 115, y: 105 }],
        nose: { x: 100, y: 120 },
        mouthLeft: { x: 90, y: 140 },
        mouthRight: { x: 110, y: 140 },
        jawline: [],
        leftEyebrow: [],
        rightEyebrow: [],
      };

      const pose = (livenessDetectionService as any).estimateHeadPose(landmarks, 256, 256);

      expect(pose).toHaveProperty('yaw');
      expect(pose).toHaveProperty('pitch');
      expect(pose).toHaveProperty('roll');
    });
  });
});
