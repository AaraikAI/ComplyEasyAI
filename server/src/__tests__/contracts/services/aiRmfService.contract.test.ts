/**
 * AI RMF Service Contract Tests
 *
 * Verifies the contract for NIST AI Risk Management Framework including
 * AI system management, core functions, and trustworthiness characteristics.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../middleware/errorHandler', () => ({
  AppError: class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

jest.mock('../../../data/nistAiRmfData', () => ({
  NIST_AI_RMF_DATA: {
    coreFunctions: [],
    trustworthinessCharacteristics: [],
    lifecycleStages: [],
  },
}));

import aiRmfService from '../../../services/aiRmfService';

describe('AIRMFService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createAISystem
  // ---------------------------------------------------------------------------
  describe('createAISystem', () => {
    it('should call prisma.aISystem.create with correct shape', async () => {
      const mockSystem = {
        id: 'ai-sys-1',
        organizationId: 'org-123',
        name: 'Fraud Detection Model',
        systemType: 'Classification',
        lifecycleStage: 'Plan_and_Design',
        autonomyLevel: 'Human_in_Loop',
      };
      prismaMock.aISystem.create.mockResolvedValue(mockSystem);
      // Mock the initialization calls
      prismaMock.aIRMFCoreFunction.create.mockResolvedValue({ id: 'cf-1' });
      prismaMock.aIRMFCategory.create.mockResolvedValue({ id: 'cat-1' });
      prismaMock.aIRMFSubcategory.create.mockResolvedValue({ id: 'sub-1' });
      prismaMock.aIRMFTrustworthinessCharacteristic.create.mockResolvedValue({ id: 'tc-1' });
      prismaMock.aIRMFLifecycleStage.create.mockResolvedValue({ id: 'lc-1' });

      await aiRmfService.createAISystem('org-123', {
        name: 'Fraud Detection Model',
        systemType: 'Classification',
        useCase: 'Transaction fraud detection',
      });

      expect(prismaMock.aISystem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
          name: 'Fraud Detection Model',
          systemType: 'Classification',
          useCase: 'Transaction fraud detection',
          lifecycleStage: 'Plan_and_Design',
          autonomyLevel: 'Human_in_Loop',
        }),
      });
    });

    it('should default lifecycleStage to Plan_and_Design', async () => {
      prismaMock.aISystem.create.mockResolvedValue({ id: 'ai-sys-1' });
      prismaMock.aIRMFCoreFunction.create.mockResolvedValue({ id: 'cf-1' });
      prismaMock.aIRMFCategory.create.mockResolvedValue({ id: 'cat-1' });
      prismaMock.aIRMFSubcategory.create.mockResolvedValue({ id: 'sub-1' });
      prismaMock.aIRMFTrustworthinessCharacteristic.create.mockResolvedValue({ id: 'tc-1' });
      prismaMock.aIRMFLifecycleStage.create.mockResolvedValue({ id: 'lc-1' });

      await aiRmfService.createAISystem('org-123', {
        name: 'Test Model',
        systemType: 'NLP',
      });

      expect(prismaMock.aISystem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          lifecycleStage: 'Plan_and_Design',
        }),
      });
    });

    it('should default autonomyLevel to Human_in_Loop', async () => {
      prismaMock.aISystem.create.mockResolvedValue({ id: 'ai-sys-1' });
      prismaMock.aIRMFCoreFunction.create.mockResolvedValue({ id: 'cf-1' });
      prismaMock.aIRMFCategory.create.mockResolvedValue({ id: 'cat-1' });
      prismaMock.aIRMFSubcategory.create.mockResolvedValue({ id: 'sub-1' });
      prismaMock.aIRMFTrustworthinessCharacteristic.create.mockResolvedValue({ id: 'tc-1' });
      prismaMock.aIRMFLifecycleStage.create.mockResolvedValue({ id: 'lc-1' });

      await aiRmfService.createAISystem('org-123', {
        name: 'Test',
        systemType: 'Classification',
      });

      expect(prismaMock.aISystem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          autonomyLevel: 'Human_in_Loop',
        }),
      });
    });

    it('should propagate errors as AppError', async () => {
      prismaMock.aISystem.create.mockRejectedValue(new Error('DB error'));

      await expect(
        aiRmfService.createAISystem('org-123', {
          name: 'Test',
          systemType: 'Classification',
        })
      ).rejects.toThrow(/Failed to create AI system/);
    });
  });

  // ---------------------------------------------------------------------------
  // getAISystems
  // ---------------------------------------------------------------------------
  describe('getAISystems', () => {
    it('should call prisma.aISystem.findMany with org filter and includes', async () => {
      prismaMock.aISystem.findMany.mockResolvedValue([]);

      await aiRmfService.getAISystems('org-123');

      expect(prismaMock.aISystem.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-123' },
        include: expect.objectContaining({
          coreFunctions: expect.objectContaining({
            include: expect.objectContaining({
              categories: expect.any(Object),
            }),
          }),
          trustworthinessCharacteristics: true,
          lifecycleStages: true,
          actors: true,
        }),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply optional filters', async () => {
      prismaMock.aISystem.findMany.mockResolvedValue([]);

      await aiRmfService.getAISystems('org-123', {
        status: 'Active',
        lifecycleStage: 'Deploy_and_Use',
      });

      expect(prismaMock.aISystem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
            status: 'Active',
            lifecycleStage: 'Deploy_and_Use',
          }),
        })
      );
    });

    it('should propagate errors', async () => {
      prismaMock.aISystem.findMany.mockRejectedValue(new Error('Connection timeout'));

      await expect(
        aiRmfService.getAISystems('org-123')
      ).rejects.toThrow(/Failed to fetch AI systems/);
    });
  });
});
