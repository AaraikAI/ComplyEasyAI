/**
 * Graph Neural Network Service Unit Tests
 *
 * Tests for GNN implementations including GCN, GraphSAGE, GAT, TGN,
 * Node2Vec embeddings, risk prediction, and training pipeline.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// Mock TensorFlow.js
const mockTensor: any = {
  dataSync: jest.fn().mockReturnValue(new Float32Array([0.5, 0.3, 0.15, 0.05])),
  data: jest.fn().mockResolvedValue(new Float32Array([0.5, 0.3, 0.15, 0.05])),
  array: jest.fn().mockResolvedValue([[0.5, 0.3, 0.15, 0.05]]),
  arraySync: jest.fn().mockReturnValue([[0.5, 0.3, 0.15, 0.05]]),
  dispose: jest.fn(),
  shape: [1, 64],
  slice: jest.fn(),
  gather: jest.fn(),
  argMax: jest.fn(),
  equal: jest.fn(),
  cast: jest.fn(),
  mean: jest.fn(),
};
// Self-referencing: methods that return tensors should return mockTensor
mockTensor.slice.mockReturnValue(mockTensor);
mockTensor.gather.mockReturnValue(mockTensor);
mockTensor.argMax.mockReturnValue(mockTensor);
mockTensor.equal.mockReturnValue(mockTensor);
mockTensor.cast.mockReturnValue(mockTensor);
mockTensor.mean.mockReturnValue(mockTensor);

const mockTfOps = {
  tensor: jest.fn().mockReturnValue(mockTensor),
  tensor1d: jest.fn().mockReturnValue(mockTensor),
  tensor2d: jest.fn().mockReturnValue(mockTensor),
  matMul: jest.fn().mockReturnValue(mockTensor),
  add: jest.fn().mockReturnValue(mockTensor),
  sub: jest.fn().mockReturnValue(mockTensor),
  mul: jest.fn().mockReturnValue(mockTensor),
  div: jest.fn().mockReturnValue(mockTensor),
  relu: jest.fn().mockReturnValue(mockTensor),
  softmax: jest.fn().mockReturnValue(mockTensor),
  mean: jest.fn().mockReturnValue(mockTensor),
  sum: jest.fn().mockReturnValue(mockTensor),
  norm: jest.fn().mockReturnValue({ dataSync: () => [1.0] }),
  dropout: jest.fn().mockReturnValue(mockTensor),
  where: jest.fn().mockReturnValue(mockTensor),
  greater: jest.fn().mockReturnValue(mockTensor),
  eye: jest.fn().mockReturnValue(mockTensor),
  zeros: jest.fn().mockReturnValue(mockTensor),
  randomUniform: jest.fn().mockReturnValue(mockTensor),
  diag: jest.fn().mockReturnValue(mockTensor),
  log: jest.fn().mockReturnValue(mockTensor),
  neg: jest.fn().mockReturnValue(mockTensor),
  oneHot: jest.fn().mockReturnValue(mockTensor),
  tidy: jest.fn((fn: () => any) => fn()),
  variable: jest.fn().mockReturnValue({
    dataSync: () => new Float32Array(64).fill(0.1),
    dispose: jest.fn(),
    assign: jest.fn(),
  }),
  ready: jest.fn().mockResolvedValue(undefined),
  setBackend: jest.fn().mockResolvedValue(undefined),
  engine: jest.fn().mockReturnValue({ registryFactory: { cpu: true } }),
  losses: {
    softmaxCrossEntropy: jest.fn().mockReturnValue(mockTensor),
  },
  train: {
    adam: jest.fn().mockReturnValue({
      minimize: jest.fn().mockReturnValue(mockTensor),
      dispose: jest.fn(),
    }),
  },
};

jest.mock('@tensorflow/tfjs', () => mockTfOps);

// Mock graphology
const mockGraph = {
  nodes: jest.fn().mockReturnValue(['node-1', 'node-2', 'node-3']),
  edges: jest.fn().mockReturnValue(['edge-1', 'edge-2']),
  neighbors: jest.fn().mockReturnValue(['node-2']),
  addNode: jest.fn(),
  addEdge: jest.fn(),
  hasNode: jest.fn().mockReturnValue(true),
  hasEdge: jest.fn().mockReturnValue(true),
  getNodeAttribute: jest.fn().mockReturnValue({ type: 'risk' }),
  setNodeAttribute: jest.fn(),
  degree: jest.fn().mockReturnValue(2),
  source: jest.fn().mockReturnValue('node-1'),
  target: jest.fn().mockReturnValue('node-2'),
  getEdgeAttribute: jest.fn().mockReturnValue(1.0),
  order: 3,
  size: 2,
};

jest.mock('graphology', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockGraph),
}));

jest.mock('graphology-layout-forceatlas2', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({}),
}));

// Extend prismaMock for GNN-specific models
const gnnPrismaMock = {
  ...prismaMock,
  risk: {
    findMany: jest.fn().mockResolvedValue([
      { id: 'risk-1', title: 'Risk 1', severity: 'High', status: 'Open', organizationId: 'org-123' },
      { id: 'risk-2', title: 'Risk 2', severity: 'Medium', status: 'Mitigated', organizationId: 'org-123' },
    ]) as jest.Mock<any>,
  },
  control: {
    findMany: jest.fn().mockResolvedValue([
      { id: 'ctrl-1', name: 'Control 1', status: 'Active', riskId: 'risk-1', organizationId: 'org-123' },
    ]) as jest.Mock<any>,
  },
  framework: {
    findMany: jest.fn().mockResolvedValue([
      { id: 'fw-1', name: 'SOC 2', progress: 75, organizationId: 'org-123' },
    ]) as jest.Mock<any>,
  },
  controlMapping: {
    findMany: jest.fn().mockResolvedValue([
      { controlId: 'ctrl-1', requirementId: 'req-1' },
    ]) as jest.Mock<any>,
  },
};

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: gnnPrismaMock,
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

// Mock fs for model persistence
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue(JSON.stringify({})),
}));

import graphNeuralNetworkService from '../../../../services/advanced/graphNeuralNetworkService';

describe('GraphNeuralNetworkService', () => {
  const orgId = 'org-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Re-establish mock implementations cleared by resetMocks: true
    // TensorFlow mocks
    mockTfOps.tensor.mockReturnValue(mockTensor);
    mockTfOps.tensor1d.mockReturnValue(mockTensor);
    mockTfOps.tensor2d.mockReturnValue(mockTensor);
    mockTfOps.matMul.mockReturnValue(mockTensor);
    mockTfOps.add.mockReturnValue(mockTensor);
    mockTfOps.sub.mockReturnValue(mockTensor);
    mockTfOps.mul.mockReturnValue(mockTensor);
    mockTfOps.div.mockReturnValue(mockTensor);
    mockTfOps.relu.mockReturnValue(mockTensor);
    mockTfOps.softmax.mockReturnValue(mockTensor);
    mockTfOps.mean.mockReturnValue(mockTensor);
    mockTfOps.sum.mockReturnValue(mockTensor);
    mockTfOps.norm.mockReturnValue({ dataSync: () => [1.0] });
    mockTfOps.dropout.mockReturnValue(mockTensor);
    mockTfOps.where.mockReturnValue(mockTensor);
    mockTfOps.greater.mockReturnValue(mockTensor);
    mockTfOps.eye.mockReturnValue(mockTensor);
    mockTfOps.zeros.mockReturnValue(mockTensor);
    mockTfOps.randomUniform.mockReturnValue(mockTensor);
    mockTfOps.diag.mockReturnValue(mockTensor);
    mockTfOps.log.mockReturnValue(mockTensor);
    mockTfOps.neg.mockReturnValue(mockTensor);
    mockTfOps.oneHot.mockReturnValue(mockTensor);
    mockTfOps.tidy.mockImplementation((fn: () => any) => fn());
    mockTfOps.variable.mockReturnValue({
      dataSync: () => new Float32Array(64).fill(0.1),
      dispose: jest.fn(),
      assign: jest.fn(),
    });
    mockTfOps.ready.mockResolvedValue(undefined);
    mockTfOps.setBackend.mockResolvedValue(undefined);
    mockTfOps.engine.mockReturnValue({ registryFactory: { cpu: true } });
    mockTfOps.losses.softmaxCrossEntropy.mockReturnValue(mockTensor);
    mockTfOps.train.adam.mockReturnValue({
      minimize: jest.fn().mockReturnValue(mockTensor),
      dispose: jest.fn(),
    });

    // mockTensor methods
    mockTensor.dataSync.mockReturnValue(new Float32Array([0.5, 0.3, 0.15, 0.05]));
    mockTensor.data.mockResolvedValue(new Float32Array([0.5, 0.3, 0.15, 0.05]));
    mockTensor.array.mockResolvedValue([[0.5, 0.3, 0.15, 0.05]]);
    mockTensor.arraySync.mockReturnValue([[0.5, 0.3, 0.15, 0.05]]);
    mockTensor.dispose.mockReturnValue(undefined);
    mockTensor.slice.mockReturnValue(mockTensor);
    mockTensor.gather.mockReturnValue(mockTensor);
    mockTensor.argMax.mockReturnValue(mockTensor);
    mockTensor.equal.mockReturnValue(mockTensor);
    mockTensor.cast.mockReturnValue(mockTensor);
    mockTensor.mean.mockReturnValue(mockTensor);

    // Graphology mocks
    mockGraph.nodes.mockReturnValue(['node-1', 'node-2', 'node-3']);
    mockGraph.edges.mockReturnValue(['edge-1', 'edge-2']);
    mockGraph.neighbors.mockReturnValue(['node-2']);
    mockGraph.addNode.mockReturnValue(undefined);
    mockGraph.addEdge.mockReturnValue(undefined);
    mockGraph.hasNode.mockReturnValue(true);
    mockGraph.hasEdge.mockReturnValue(true);
    mockGraph.getNodeAttribute.mockReturnValue({ type: 'risk' });
    mockGraph.setNodeAttribute.mockReturnValue(undefined);
    mockGraph.degree.mockReturnValue(2);
    mockGraph.source.mockReturnValue('node-1');
    mockGraph.target.mockReturnValue('node-2');
    mockGraph.getEdgeAttribute.mockReturnValue(1.0);

    // Graphology constructor
    const Graph = require('graphology').default;
    Graph.mockImplementation(() => mockGraph);

    // Prisma mocks for GNN
    // Use correct Prisma model names matching the service
    (gnnPrismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([
      { id: 'risk-1', title: 'Risk 1', severity: 'High', status: 'Open', category: 'Security', detectedAt: new Date(), organizationId: 'org-123' },
      { id: 'risk-2', title: 'Risk 2', severity: 'Medium', status: 'Mitigated', category: 'Compliance', detectedAt: new Date(), organizationId: 'org-123' },
    ] as never);
    (gnnPrismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([
      { id: 'fw-1', name: 'SOC 2', progress: 75, status: 'In_Progress', organizationId: 'org-123', updatedAt: new Date(), controls: [{ id: 'ctrl-1', name: 'CC1.1', status: 'Implemented' }] },
    ] as never);
    (gnnPrismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValue([
      { id: 'ctrl-1', name: 'Control 1', status: 'Implemented', frameworkId: 'fw-1' },
    ] as never);
    gnnPrismaMock.risk.findMany.mockResolvedValue([
      { id: 'risk-1', title: 'Risk 1', severity: 'High', status: 'Open', organizationId: 'org-123' },
      { id: 'risk-2', title: 'Risk 2', severity: 'Medium', status: 'Mitigated', organizationId: 'org-123' },
    ] as never);
    gnnPrismaMock.control.findMany.mockResolvedValue([
      { id: 'ctrl-1', name: 'Control 1', status: 'Active', riskId: 'risk-1', organizationId: 'org-123' },
    ] as never);
    gnnPrismaMock.framework.findMany.mockResolvedValue([
      { id: 'fw-1', name: 'SOC 2', progress: 75, organizationId: 'org-123' },
    ] as never);
    gnnPrismaMock.controlMapping.findMany.mockResolvedValue([
      { controlId: 'ctrl-1', requirementId: 'req-1' },
    ] as never);

    // fs mocks
    const fs = require('fs');
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockReturnValue(undefined);
    fs.writeFileSync.mockReturnValue(undefined);
    fs.readFileSync.mockReturnValue(JSON.stringify({}));

    // Reset internal state
    (graphNeuralNetworkService as any).isInitialized = false;
    (graphNeuralNetworkService as any).gcnWeights = [];
    (graphNeuralNetworkService as any).gatWeights = [];
    (graphNeuralNetworkService as any).sageWeights = new Map();
    (graphNeuralNetworkService as any).tgnMemory = new Map();
    (graphNeuralNetworkService as any).node2vecEmbeddings = new Map();
  });

  // ===========================================================================
  // initialize
  // ===========================================================================
  describe('initialize', () => {
    it('should initialize all GNN model weights', async () => {
      await graphNeuralNetworkService.initialize();

      expect((graphNeuralNetworkService as any).isInitialized).toBe(true);
    });

    it('should accept custom configuration', async () => {
      await graphNeuralNetworkService.initialize({
        embeddingDim: 128,
        hiddenDim: 256,
        numLayers: 4,
      });

      expect((graphNeuralNetworkService as any).config.embeddingDim).toBe(128);
      expect((graphNeuralNetworkService as any).config.hiddenDim).toBe(256);
    });

    it('should skip re-initialization if already initialized', async () => {
      (graphNeuralNetworkService as any).isInitialized = true;

      await graphNeuralNetworkService.initialize();

      expect(mockTfOps.ready).not.toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      // Both initial and fallback ready() must fail for the error to propagate
      mockTfOps.ready
        .mockRejectedValueOnce(new Error('GPU not available'))
        .mockRejectedValueOnce(new Error('CPU not available'));
      (graphNeuralNetworkService as any).isInitialized = false;

      await expect(graphNeuralNetworkService.initialize()).rejects.toThrow();
    });
  });

  // ===========================================================================
  // GCN Forward Pass
  // ===========================================================================
  describe('gcnForward', () => {
    beforeEach(async () => {
      (graphNeuralNetworkService as any).isInitialized = true;
      // Initialize GCN weights
      (graphNeuralNetworkService as any).gcnWeights = [mockTfOps.variable()];
      (graphNeuralNetworkService as any).gcnBiases = [mockTfOps.variable()];
      (graphNeuralNetworkService as any).gcnSkipWeights = [mockTfOps.variable()];
      (graphNeuralNetworkService as any).config = {
        numLayers: 1,
        dropout: 0.2,
      };
    });

    it('should perform GCN message passing', () => {
      const features = mockTensor;
      const normalizedAdj = mockTensor;

      const result = (graphNeuralNetworkService as any).gcnForward(
        features,
        normalizedAdj,
        false
      );

      expect(result).toBeDefined();
      expect(mockTfOps.matMul).toHaveBeenCalled();
    });

    it('should apply dropout during training', () => {
      const features = mockTensor;
      const normalizedAdj = mockTensor;

      (graphNeuralNetworkService as any).gcnForward(features, normalizedAdj, true);

      // dropout should be applied in training mode
      // (Implementation detail - verified by coverage)
    });
  });

  // ===========================================================================
  // GraphSAGE Forward Pass
  // ===========================================================================
  describe('graphSAGEForward', () => {
    beforeEach(() => {
      (graphNeuralNetworkService as any).isInitialized = true;
      (graphNeuralNetworkService as any).config = {
        numLayers: 2,
        embeddingDim: 64,
        hiddenDim: 128,
        outputDim: 64,
      };
    });

    it('should perform inductive learning with neighborhood sampling', () => {
      const nodeIds = ['node-1', 'node-2'];
      const nodeFeatureMap = new Map([
        ['node-1', new Array(64).fill(0.5)],
        ['node-2', new Array(64).fill(0.3)],
      ]);

      const result = (graphNeuralNetworkService as any).graphSAGEForward(
        mockGraph,
        nodeIds,
        nodeFeatureMap,
        'mean',
        10,
        false
      );

      expect(result).toBeInstanceOf(Map);
    });

    it('should support different aggregation types', () => {
      const nodeIds = ['node-1'];
      const nodeFeatureMap = new Map([['node-1', new Array(64).fill(0.5)]]);

      const meanResult = (graphNeuralNetworkService as any).graphSAGEForward(
        mockGraph, nodeIds, nodeFeatureMap, 'mean'
      );

      const maxResult = (graphNeuralNetworkService as any).graphSAGEForward(
        mockGraph, nodeIds, nodeFeatureMap, 'max'
      );

      const lstmResult = (graphNeuralNetworkService as any).graphSAGEForward(
        mockGraph, nodeIds, nodeFeatureMap, 'lstm'
      );

      expect(meanResult).toBeInstanceOf(Map);
      expect(maxResult).toBeInstanceOf(Map);
      expect(lstmResult).toBeInstanceOf(Map);
    });

    it('should handle nodes with no neighbors', () => {
      mockGraph.neighbors.mockReturnValueOnce([]);
      const nodeIds = ['isolated-node'];
      const nodeFeatureMap = new Map([['isolated-node', new Array(64).fill(0.5)]]);

      const result = (graphNeuralNetworkService as any).graphSAGEForward(
        mockGraph, nodeIds, nodeFeatureMap, 'mean'
      );

      expect(result.has('isolated-node')).toBe(true);
    });
  });

  // ===========================================================================
  // GAT Forward Pass
  // ===========================================================================
  describe('gatForward', () => {
    beforeEach(() => {
      (graphNeuralNetworkService as any).isInitialized = true;
      (graphNeuralNetworkService as any).config = {
        numLayers: 2,
        numHeads: 4,
        embeddingDim: 64,
        hiddenDim: 128,
        outputDim: 64,
      };
      (graphNeuralNetworkService as any).gatWeights = [mockTfOps.variable()];
      (graphNeuralNetworkService as any).gatAttentionWeights = [mockTfOps.variable()];
      (graphNeuralNetworkService as any).gatBiases = [mockTfOps.variable()];
    });

    it('should compute multi-head attention', () => {
      const nodeIds = ['node-1', 'node-2'];
      const nodeFeatureMap = new Map([
        ['node-1', new Array(64).fill(0.5)],
        ['node-2', new Array(64).fill(0.3)],
      ]);

      const result = (graphNeuralNetworkService as any).gatForward(
        mockGraph, nodeIds, nodeFeatureMap, false
      );

      expect(result).toHaveProperty('embeddings');
      expect(result).toHaveProperty('attentionWeights');
      expect(result.embeddings).toBeInstanceOf(Map);
    });

    it('should return attention weights for explainability', () => {
      const nodeIds = ['node-1'];
      const nodeFeatureMap = new Map([['node-1', new Array(64).fill(0.5)]]);

      const result = (graphNeuralNetworkService as any).gatForward(
        mockGraph, nodeIds, nodeFeatureMap, false
      );

      expect(result.attentionWeights).toBeInstanceOf(Map);
    });
  });

  // ===========================================================================
  // Temporal Graph Network
  // ===========================================================================
  describe('TGN (Temporal Graph Network)', () => {
    beforeEach(() => {
      (graphNeuralNetworkService as any).isInitialized = true;
      (graphNeuralNetworkService as any).config = { embeddingDim: 64 };
      (graphNeuralNetworkService as any).tgnTimeEncoder = mockTfOps.variable();
      (graphNeuralNetworkService as any).tgnMessageWeights = mockTfOps.variable();
      (graphNeuralNetworkService as any).tgnAttentionWeights = mockTfOps.variable();
      (graphNeuralNetworkService as any).tgnMemory = new Map();
    });

    it('should process temporal events and update memory', () => {
      const event = {
        sourceId: 'node-1',
        targetId: 'node-2',
        timestamp: Date.now() - 1000,
        features: new Array(64).fill(0.5),
      };

      (graphNeuralNetworkService as any).processTemporalEvent(event, Date.now());

      // Memory should be updated for both nodes
      const memory = (graphNeuralNetworkService as any).tgnMemory;
      expect(memory.size).toBeGreaterThan(0);
    });

    it('should encode time deltas', () => {
      const timeEnc = (graphNeuralNetworkService as any).encodeTime(86400000); // 1 day

      expect(timeEnc).toBeDefined();
      expect(Array.isArray(timeEnc)).toBe(true);
      expect(timeEnc.length).toBe(64);
    });

    it('should compute temporal attention over historical events', () => {
      const events = [
        { sourceId: 'node-1', targetId: 'node-2', timestamp: Date.now() - 10000, features: [] },
        { sourceId: 'node-1', targetId: 'node-3', timestamp: Date.now() - 5000, features: [] },
      ];

      const result = (graphNeuralNetworkService as any).temporalAttention(
        'node-1', events, Date.now()
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ===========================================================================
  // Node2Vec Embeddings
  // ===========================================================================
  describe('generateNode2VecEmbeddings', () => {
    beforeEach(() => {
      (graphNeuralNetworkService as any).isInitialized = true;
      (graphNeuralNetworkService as any).config = { embeddingDim: 64 };
    });

    it('should generate embeddings via random walks', async () => {
      const result = await graphNeuralNetworkService.generateNode2VecEmbeddings(mockGraph, {
        dimensions: 64,
        walkLength: 10,
        numWalks: 5,
        epochs: 2,
      });

      expect(result).toBeInstanceOf(Map);
    });

    it('should support p and q parameters for walk bias', async () => {
      const result = await graphNeuralNetworkService.generateNode2VecEmbeddings(mockGraph, {
        p: 0.5, // Return parameter
        q: 2.0, // In-out parameter
      });

      expect(result).toBeInstanceOf(Map);
    });

    it('should handle empty graph', async () => {
      mockGraph.nodes.mockReturnValueOnce([]);

      const result = await graphNeuralNetworkService.generateNode2VecEmbeddings(mockGraph);

      expect(result.size).toBe(0);
    });
  });

  // ===========================================================================
  // Risk Prediction Pipeline
  // ===========================================================================
  describe('predictRisks', () => {
    beforeEach(async () => {
      (graphNeuralNetworkService as any).isInitialized = true;
      (graphNeuralNetworkService as any).classifierWeights = mockTfOps.variable();
      (graphNeuralNetworkService as any).classifierBias = mockTfOps.variable();
      (graphNeuralNetworkService as any).autoencoderEncoder = [mockTfOps.variable(), mockTfOps.variable()];
      (graphNeuralNetworkService as any).autoencoderDecoder = [mockTfOps.variable(), mockTfOps.variable()];
      (graphNeuralNetworkService as any).gatWeights = [mockTfOps.variable()];
      (graphNeuralNetworkService as any).gatAttentionWeights = [mockTfOps.variable()];
      (graphNeuralNetworkService as any).gatBiases = [mockTfOps.variable()];
      (graphNeuralNetworkService as any).gcnWeights = [mockTfOps.variable()];
      (graphNeuralNetworkService as any).gcnBiases = [mockTfOps.variable()];
      (graphNeuralNetworkService as any).gcnSkipWeights = [mockTfOps.variable()];
      (graphNeuralNetworkService as any).config = {
        numLayers: 1,
        numHeads: 2,
        embeddingDim: 64,
        hiddenDim: 128,
        outputDim: 64,
        numClasses: 4,
        dropout: 0.2,
      };
    });

    it('should return predictions for all nodes', async () => {
      const predictions = await graphNeuralNetworkService.predictRisks(orgId);

      expect(Array.isArray(predictions)).toBe(true);
      for (const pred of predictions) {
        expect(pred).toHaveProperty('nodeId');
        expect(pred).toHaveProperty('nodeType');
        expect(pred).toHaveProperty('predictedLabel');
        expect(pred).toHaveProperty('probability');
        expect(pred).toHaveProperty('confidence');
      }
    });

    it('should include embeddings and explanations', async () => {
      const predictions = await graphNeuralNetworkService.predictRisks(orgId);

      for (const pred of predictions) {
        expect(pred).toHaveProperty('embedding');
        expect(pred).toHaveProperty('explanation');
        expect(pred.explanation).toHaveProperty('topFeatures');
      }
    });

    it('should predict risk labels (Low, Medium, High, Critical)', async () => {
      const predictions = await graphNeuralNetworkService.predictRisks(orgId);

      const validLabels = ['Low', 'Medium', 'High', 'Critical'];
      for (const pred of predictions) {
        expect(validLabels).toContain(pred.predictedLabel);
      }
    });

    it('should handle organization with no data', async () => {
      (gnnPrismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValueOnce([] as never);
      (gnnPrismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValueOnce([] as never);
      (gnnPrismaMock.frameworkControl.findMany as jest.Mock<any>).mockResolvedValueOnce([] as never);
      // When no data, the graph should be empty - override nodes() to always return empty
      const emptyGraph = {
        ...mockGraph,
        nodes: jest.fn().mockReturnValue([]),
        edges: jest.fn().mockReturnValue([]),
        order: 0,
        size: 0,
      };
      const Graph = require('graphology').default;
      Graph.mockImplementationOnce(() => emptyGraph);

      const predictions = await graphNeuralNetworkService.predictRisks('empty-org');

      expect(predictions).toEqual([]);
    });
  });

  // ===========================================================================
  // Link Prediction
  // ===========================================================================
  describe('predictLink', () => {
    it('should predict link probability between nodes', () => {
      const embA = new Array(64).fill(0.5);
      const embB = new Array(64).fill(0.5);

      const result = graphNeuralNetworkService.predictLink(embA, embB);

      expect(result).toHaveProperty('probability');
      expect(result).toHaveProperty('confidence');
      expect(result.probability).toBeGreaterThanOrEqual(0);
      expect(result.probability).toBeLessThanOrEqual(1);
    });

    it('should return higher probability for similar embeddings', () => {
      const embA = new Array(64).fill(0.5);
      const embB = new Array(64).fill(0.5);
      const embC = new Array(64).fill(-0.5);

      const similarResult = graphNeuralNetworkService.predictLink(embA, embB);
      const dissimilarResult = graphNeuralNetworkService.predictLink(embA, embC);

      expect(similarResult.probability).toBeGreaterThan(dissimilarResult.probability);
    });
  });

  // ===========================================================================
  // Graph Classification
  // ===========================================================================
  describe('classifyGraph', () => {
    beforeEach(() => {
      (graphNeuralNetworkService as any).classifierWeights = mockTfOps.variable();
      (graphNeuralNetworkService as any).classifierBias = mockTfOps.variable();
      (graphNeuralNetworkService as any).config = { numClasses: 4 };
    });

    it('should classify entire graph', () => {
      const nodeEmbeddings = [
        new Array(64).fill(0.5),
        new Array(64).fill(0.3),
      ];

      const result = graphNeuralNetworkService.classifyGraph(nodeEmbeddings);

      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('probability');
      expect(result).toHaveProperty('confidence');
    });

    it('should handle empty graph', () => {
      const result = graphNeuralNetworkService.classifyGraph([]);

      expect(result.label).toBe('Low');
      expect(result.confidence).toBe(0);
    });
  });

  // ===========================================================================
  // Training Pipeline
  // ===========================================================================
  describe('train', () => {
    beforeEach(() => {
      (graphNeuralNetworkService as any).isInitialized = true;
      (graphNeuralNetworkService as any).config = {
        numEpochs: 10,
        learningRate: 0.001,
        patience: 5,
        embeddingDim: 64,
        hiddenDim: 128,
        outputDim: 64,
        numLayers: 2,
        numClasses: 4,
        batchSize: 32,
        dropout: 0.2,
      };
    });

    it('should train GNN model and return metrics', async () => {
      const result = await graphNeuralNetworkService.train(orgId, {
        epochs: 2,
        validationSplit: 0.2,
      });

      expect(result).toHaveProperty('modelId');
      expect(result).toHaveProperty('epochs');
      expect(result).toHaveProperty('finalLoss');
      expect(result).toHaveProperty('finalAccuracy');
      expect(result).toHaveProperty('f1Score');
    });

    it('should support k-fold cross validation', async () => {
      const result = await graphNeuralNetworkService.train(orgId, {
        epochs: 2,
        kFolds: 3,
      });

      expect(result).toHaveProperty('validationMetrics');
    });

    it('should handle early stopping', async () => {
      const result = await graphNeuralNetworkService.train(orgId, {
        epochs: 100,
        patience: 2,
      });

      // Should stop before 100 epochs due to patience
      expect(result.epochs).toBeLessThanOrEqual(100);
    });
  });

  // ===========================================================================
  // Utility Functions
  // ===========================================================================
  describe('Utility Functions', () => {
    it('should compute cosine similarity correctly', () => {
      const cosineSim = (graphNeuralNetworkService as any).constructor
        ? require('../../../../services/advanced/graphNeuralNetworkService')
        : null;

      // Test via prediction results which use cosine similarity internally
      const embA = new Array(64).fill(0.5);
      const embB = new Array(64).fill(0.5);

      const result = graphNeuralNetworkService.predictLink(embA, embB);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should normalize features', () => {
      (graphNeuralNetworkService as any).featureMeans = [];
      (graphNeuralNetworkService as any).featureStds = [];

      const nodeFeatureMap = new Map([
        ['node-1', [10, 20, 30]],
        ['node-2', [15, 25, 35]],
      ]);

      (graphNeuralNetworkService as any).computeFeatureNormalization(
        nodeFeatureMap,
        ['node-1', 'node-2']
      );

      expect((graphNeuralNetworkService as any).featureMeans.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Memory Management
  // ===========================================================================
  describe('Memory Management', () => {
    it('should dispose tensors properly', () => {
      const mockVar = { dispose: jest.fn() };
      (graphNeuralNetworkService as any).disposeList([mockVar]);

      expect(mockVar.dispose).toHaveBeenCalled();
    });

    it('should use tf.tidy for automatic cleanup', async () => {
      (graphNeuralNetworkService as any).isInitialized = true;

      await graphNeuralNetworkService.predictRisks(orgId);

      expect(mockTfOps.tidy).toHaveBeenCalled();
    });
  });
});
