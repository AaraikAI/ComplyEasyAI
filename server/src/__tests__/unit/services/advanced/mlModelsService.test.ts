/**
 * ML Models Service Unit Tests
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

// Mock TensorFlow.js
const mockModel = {
  predict: jest.fn<any>().mockReturnValue({
    data: jest.fn<any>().mockResolvedValue(new Float32Array([0.7])),
    dispose: jest.fn(),
    shape: [1, 1],
    dataSync: jest.fn<any>().mockReturnValue(new Float32Array([0.7])),
  }),
  fit: jest.fn<any>().mockResolvedValue({
    history: {
      loss: [0.5, 0.3, 0.1],
      acc: [0.6, 0.8, 0.9],
    },
  }),
  compile: jest.fn(),
  summary: jest.fn(),
  save: jest.fn<any>().mockResolvedValue({}),
  dispose: jest.fn(),
  getWeights: jest.fn<any>().mockReturnValue([]),
};

jest.mock('@tensorflow/tfjs', () => ({
  sequential: jest.fn<any>().mockReturnValue(mockModel),
  layers: {
    dense: jest.fn<any>().mockReturnValue({}),
    dropout: jest.fn<any>().mockReturnValue({}),
    batchNormalization: jest.fn<any>().mockReturnValue({}),
  },
  train: {
    adam: jest.fn<any>().mockReturnValue({}),
  },
  regularizers: {
    l2: jest.fn<any>().mockReturnValue({}),
  },
  tensor2d: jest.fn<any>().mockReturnValue({
    dispose: jest.fn(),
  }),
  tensor: jest.fn<any>().mockReturnValue({
    dispose: jest.fn(),
    data: jest.fn<any>().mockResolvedValue(new Float32Array([0.5])),
  }),
  dispose: jest.fn(),
  tidy: jest.fn<any>().mockImplementation((fn: () => any) => fn()),
  loadLayersModel: jest.fn<any>().mockRejectedValue(new Error('No model found')),
}));

jest.mock('graphology', () => {
  return {
    __esModule: true,
    default: jest.fn<any>().mockImplementation(() => ({
      addNode: jest.fn(),
      addEdge: jest.fn(),
      hasNode: jest.fn<any>().mockReturnValue(false),
      hasEdge: jest.fn<any>().mockReturnValue(false),
      order: 0,
      size: 0,
      nodes: jest.fn<any>().mockReturnValue([]),
      edges: jest.fn<any>().mockReturnValue([]),
      forEachNode: jest.fn(),
      forEachEdge: jest.fn(),
      neighbors: jest.fn<any>().mockReturnValue([]),
      degree: jest.fn<any>().mockReturnValue(0),
      getNodeAttributes: jest.fn<any>().mockReturnValue({}),
      getEdgeAttributes: jest.fn<any>().mockReturnValue({}),
      setNodeAttribute: jest.fn(),
    })),
  };
});

jest.mock('graphology-layout-forceatlas2', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import mlModelsService from '../../../../services/advanced/mlModelsService';

describe('MLModelsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize models without error', async () => {
      await expect(mlModelsService.initialize()).resolves.not.toThrow();
    });

    it('should be idempotent - no error on double init', async () => {
      await mlModelsService.initialize();
      await expect(mlModelsService.initialize()).resolves.not.toThrow();
    });
  });

  describe('buildTemporalGraph', () => {
    it('should build a temporal graph from data', () => {
      const data = {
        risks: [
          { id: 'r-1', title: 'Risk 1', severity: 'High', category: 'Security', detectedAt: new Date() },
        ],
        frameworks: [
          { id: 'fw-1', name: 'SOC2', status: 'In_Progress', createdAt: new Date() },
        ],
        controls: [
          { id: 'c-1', name: 'Control 1', status: 'Implemented', frameworkId: 'fw-1', createdAt: new Date() },
        ],
      };

      const graph = mlModelsService.buildTemporalGraph(data);
      expect(graph).toBeDefined();
    });

    it('should handle empty data', () => {
      const data = { risks: [], frameworks: [], controls: [] };
      const graph = mlModelsService.buildTemporalGraph(data);
      expect(graph).toBeDefined();
    });
  });

  describe('predictRisksWithTGN', () => {
    it('should predict risks using TGN model', async () => {
      await mlModelsService.initialize();

      const mockGraph = {
        nodes: [
          { id: 'r-1', type: 'risk', category: 'Security', severity: 'High', data: {} },
          { id: 'fw-1', type: 'framework', data: {} },
        ],
        edges: [
          { source: 'r-1', target: 'fw-1', weight: 1 },
        ],
      };

      const predictions = await mlModelsService.predictRisksWithTGN(mockGraph, 6);

      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
    });
  });

  describe('detectDeepfake', () => {
    it('should detect deepfake from feature vector', async () => {
      await mlModelsService.initialize();

      const features = new Array(256).fill(0).map(() => Math.random());

      const result = await mlModelsService.detectDeepfake(features, 'image');

      expect(result).toBeDefined();
      expect(result.isDeepfake).toBeDefined();
      expect(typeof result.confidence).toBe('number');
    });
  });

  describe('detectLiveness', () => {
    it('should detect liveness from features', async () => {
      await mlModelsService.initialize();

      const features = {
        hasDepth: true,
        textureComplexity: 0.6,
        edgeDensity: 0.3,
        colorVariation: 0.5,
      };

      const result = await mlModelsService.detectLiveness(features);

      expect(result).toBeDefined();
      expect(typeof result.isLive).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
    });

    it('should handle features indicating a non-live image', async () => {
      await mlModelsService.initialize();

      const features = {
        hasDepth: false,
        textureComplexity: 0.1,
        edgeDensity: 0.05,
        colorVariation: 0.1,
      };

      const result = await mlModelsService.detectLiveness(features);

      expect(result).toBeDefined();
      expect(typeof result.isLive).toBe('boolean');
    });
  });

  describe('trainDeepfakeModel', () => {
    it('should train deepfake model with training data', async () => {
      await mlModelsService.initialize();

      const trainingData = Array.from({ length: 20 }, (_, i) => ({
        features: new Array(256).fill(0).map(() => Math.random()),
        label: i % 2,
      }));

      const result = await mlModelsService.trainDeepfakeModel(trainingData, {
        epochs: 2,
        batchSize: 8,
      });

      expect(result).toBeDefined();
      expect(result.finalAccuracy).toBeDefined();
      expect(result.finalLoss).toBeDefined();
    });
  });

  describe('trainTGNModel', () => {
    it('should train TGN model with historical data', async () => {
      await mlModelsService.initialize();

      const historicalData = [
        {
          features: new Array(10).fill(0).map(() => Math.random()),
          label: 1,
        },
        {
          features: new Array(10).fill(0).map(() => Math.random()),
          label: 0,
        },
      ];

      await expect(
        mlModelsService.trainTGNModel(historicalData)
      ).resolves.not.toThrow();
    });
  });
});
