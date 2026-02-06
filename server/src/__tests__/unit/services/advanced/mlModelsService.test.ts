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
  tensor1d: jest.fn<any>().mockReturnValue({
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
      filterNodes: jest.fn<any>().mockReturnValue([]),
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
  default: {
    assign: jest.fn(),
  },
}));

import mlModelsService from '../../../../services/advanced/mlModelsService';

describe('MLModelsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-establish mock implementations (cleared by resetMocks)
    const tf = require('@tensorflow/tfjs');
    mockModel.predict.mockReturnValue({
      data: jest.fn<any>().mockResolvedValue(new Float32Array([0.7])),
      dispose: jest.fn(),
      shape: [1, 1],
      dataSync: jest.fn<any>().mockReturnValue(new Float32Array([0.7])),
    });
    mockModel.fit.mockResolvedValue({
      history: {
        loss: [0.5, 0.3, 0.1],
        acc: [0.6, 0.8, 0.9],
      },
    });
    mockModel.compile.mockImplementation(() => {});
    mockModel.summary.mockImplementation(() => {});
    mockModel.save.mockResolvedValue({});
    mockModel.getWeights.mockReturnValue([]);

    tf.sequential.mockReturnValue(mockModel);
    tf.layers.dense.mockReturnValue({});
    tf.layers.dropout.mockReturnValue({});
    tf.layers.batchNormalization.mockReturnValue({});
    tf.train.adam.mockReturnValue({});
    tf.regularizers.l2.mockReturnValue({});
    tf.tensor2d.mockReturnValue({ dispose: jest.fn() });
    tf.tensor1d.mockReturnValue({ dispose: jest.fn() });
    tf.tensor.mockReturnValue({
      dispose: jest.fn(),
      data: jest.fn<any>().mockResolvedValue(new Float32Array([0.5])),
    });
    tf.tidy.mockImplementation((fn: () => any) => fn());
    tf.loadLayersModel.mockRejectedValue(new Error('No model found'));

    const Graph = require('graphology').default;
    Graph.mockImplementation(() => ({
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
      filterNodes: jest.fn<any>().mockReturnValue([]),
      neighbors: jest.fn<any>().mockReturnValue([]),
      degree: jest.fn<any>().mockReturnValue(0),
      getNodeAttributes: jest.fn<any>().mockReturnValue({}),
      getEdgeAttributes: jest.fn<any>().mockReturnValue({}),
      setNodeAttribute: jest.fn(),
    }));

    const forceAtlas2 = require('graphology-layout-forceatlas2').default;
    if (forceAtlas2.assign) forceAtlas2.assign.mockImplementation(() => {});

    // Reset internal state
    (mlModelsService as any).initialized = false;
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

      // Provide a graph-like object with all methods used by extractGraphFeatures and predictRisksWithTGN
      const mockGraph = {
        order: 2,
        size: 1,
        nodes: jest.fn<any>().mockReturnValue(['r-1', 'fw-1']),
        edges: jest.fn<any>().mockReturnValue(['e-1']),
        degree: jest.fn<any>().mockReturnValue(1),
        getNodeAttributes: jest.fn<any>().mockReturnValue({ type: 'risk', category: 'Security', severity: 'High', timestamp: Date.now() }),
        getEdgeAttributes: jest.fn<any>().mockReturnValue({ weight: 0.5 }),
        filterNodes: jest.fn<any>().mockReturnValue(['r-1']),
        neighbors: jest.fn<any>().mockReturnValue([]),
        hasEdge: jest.fn<any>().mockReturnValue(false),
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
    it('should detect liveness from media buffer', async () => {
      await mlModelsService.initialize();

      // Provide a buffer with varied data to simulate a real image
      const imageBuffer = Buffer.alloc(1024);
      for (let i = 0; i < imageBuffer.length; i++) {
        imageBuffer[i] = Math.floor(Math.random() * 256);
      }

      const result = await mlModelsService.detectLiveness(imageBuffer, 'image');

      expect(result).toBeDefined();
      expect(typeof result.detected).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
    });

    it('should handle media indicating a non-live image', async () => {
      await mlModelsService.initialize();

      // Provide a uniform buffer (low complexity = likely not live)
      const imageBuffer = Buffer.alloc(1024, 0);

      const result = await mlModelsService.detectLiveness(imageBuffer, 'image');

      expect(result).toBeDefined();
      expect(typeof result.detected).toBe('boolean');
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
          risks: [{ id: 'r-1', title: 'Risk 1', severity: 'High', category: 'Security', detectedAt: new Date() }],
          frameworks: [{ id: 'fw-1', name: 'SOC2', status: 'In_Progress', createdAt: new Date() }],
          controls: [{ id: 'c-1', name: 'Control 1', status: 'Implemented', frameworkId: 'fw-1', createdAt: new Date() }],
          riskOccurred: true,
        },
        {
          risks: [],
          frameworks: [{ id: 'fw-2', name: 'ISO27001', status: 'Active', createdAt: new Date() }],
          controls: [],
          riskOccurred: false,
        },
      ];

      await expect(
        mlModelsService.trainTGNModel(historicalData)
      ).resolves.not.toThrow();
    });
  });
});
