/**
 * AI RMF Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

// Add missing AI RMF models to prismaMock
const createMockFn = (): jest.Mock<(...args: any[]) => any> => jest.fn() as jest.Mock<(...args: any[]) => any>;

(prismaMock as any).aISystem = {
  findUnique: createMockFn(),
  findFirst: createMockFn(),
  findMany: createMockFn(),
  create: createMockFn(),
  update: createMockFn(),
  delete: createMockFn(),
  count: createMockFn(),
};
(prismaMock as any).aIRMFCoreFunction = {
  findUnique: createMockFn(),
  findFirst: createMockFn(),
  findMany: createMockFn(),
  create: createMockFn(),
  update: createMockFn(),
  delete: createMockFn(),
};
(prismaMock as any).aIRMFCategory = {
  findUnique: createMockFn(),
  findFirst: createMockFn(),
  findMany: createMockFn(),
  create: createMockFn(),
  update: createMockFn(),
  delete: createMockFn(),
};
(prismaMock as any).aIRMFSubcategory = {
  findUnique: createMockFn(),
  findFirst: createMockFn(),
  findMany: createMockFn(),
  create: createMockFn(),
  update: createMockFn(),
  delete: createMockFn(),
};
(prismaMock as any).aIRMFTrustworthinessCharacteristic = {
  findUnique: createMockFn(),
  findFirst: createMockFn(),
  findMany: createMockFn(),
  create: createMockFn(),
  update: createMockFn(),
  delete: createMockFn(),
};
(prismaMock as any).aIRMFLifecycleStage = {
  findUnique: createMockFn(),
  findFirst: createMockFn(),
  findMany: createMockFn(),
  create: createMockFn(),
  update: createMockFn(),
  delete: createMockFn(),
};
(prismaMock as any).aIRMFActor = {
  findUnique: createMockFn(),
  findFirst: createMockFn(),
  findMany: createMockFn(),
  create: createMockFn(),
  update: createMockFn(),
  delete: createMockFn(),
};
(prismaMock as any).aIRMFAssessment = {
  findUnique: createMockFn(),
  findFirst: createMockFn(),
  findMany: createMockFn(),
  create: createMockFn(),
  update: createMockFn(),
  delete: createMockFn(),
};
(prismaMock as any).aIRMFProfile = {
  findUnique: createMockFn(),
  findFirst: createMockFn(),
  findMany: createMockFn(),
  create: createMockFn(),
  update: createMockFn(),
  delete: createMockFn(),
};
(prismaMock as any).aIRMFRiskActivity = {
  findUnique: createMockFn(),
  findFirst: createMockFn(),
  findMany: createMockFn(),
  create: createMockFn(),
  update: createMockFn(),
  delete: createMockFn(),
};

// Mock the database
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../middleware/errorHandler', () => ({
  AppError: class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
      this.name = 'AppError';
    }
  },
}));

jest.mock('../../../data/nistAiRmfData', () => ({
  NIST_AI_RMF_DATA: {
    GOVERN: {
      description: 'Governance function',
      categories: [
        {
          id: 'GV.1',
          name: 'Govern 1',
          description: 'Governance category 1',
          subcategories: [
            { id: 'GV.1.1', name: 'Sub 1.1', description: 'Subcategory 1.1' },
          ],
        },
      ],
    },
    MAP: {
      description: 'Map function',
      categories: [
        {
          id: 'MP.1',
          name: 'Map 1',
          description: 'Map category 1',
          subcategories: [
            { id: 'MP.1.1', name: 'Sub M.1', description: 'Map subcategory' },
          ],
        },
      ],
    },
    MEASURE: {
      description: 'Measure function',
      categories: [
        {
          id: 'MS.1',
          name: 'Measure 1',
          description: 'Measure category 1',
          subcategories: [],
        },
      ],
    },
    MANAGE: {
      description: 'Manage function',
      categories: [
        {
          id: 'MG.1',
          name: 'Manage 1',
          description: 'Manage category 1',
          subcategories: [],
        },
      ],
    },
  },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn(),
  },
}));

// Import after mocking
import aiRmfService from '../../../services/aiRmfService';
import { AuditLogger } from '../../../utils/auditLogger';

// Helpers
const mockAISystem = (overrides: Record<string, unknown> = {}) => ({
  id: 'ai-system-1',
  organizationId: 'org-123',
  name: 'Test AI System',
  description: 'Test description',
  systemType: 'Classification',
  useCase: 'Fraud detection',
  deploymentContext: 'Production',
  lifecycleStage: 'Plan_and_Design',
  autonomyLevel: 'Human_in_Loop',
  status: 'Active',
  riskLevel: 'Medium',
  overallTrustworthinessScore: 75,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('AIRMFService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ======================================================================
  // createAISystem
  // ======================================================================
  describe('createAISystem()', () => {
    it('should create an AI system and initialize core functions, trustworthiness, and lifecycle', async () => {
      const system = mockAISystem();
      (prismaMock as any).aISystem.create.mockResolvedValue(system);
      (prismaMock as any).aIRMFCoreFunction.create.mockResolvedValue({ id: 'cf-1' });
      (prismaMock as any).aIRMFCoreFunction.findFirst.mockResolvedValue({ id: 'cf-1', aiSystemId: system.id, functionName: 'GOVERN' });
      (prismaMock as any).aIRMFCategory.create.mockResolvedValue({ id: 'cat-1' });
      (prismaMock as any).aIRMFCategory.findFirst.mockResolvedValue({ id: 'cat-1', coreFunctionId: 'cf-1', categoryId: 'GV.1' });
      (prismaMock as any).aIRMFSubcategory.create.mockResolvedValue({ id: 'sub-1' });
      (prismaMock as any).aIRMFTrustworthinessCharacteristic.create.mockResolvedValue({ id: 'tw-1' });
      (prismaMock as any).aIRMFLifecycleStage.create.mockResolvedValue({ id: 'ls-1' });

      const result = await aiRmfService.createAISystem('org-123', {
        name: 'Test AI System',
        systemType: 'Classification',
      });

      expect(result).toEqual(system);
      expect((prismaMock as any).aISystem.create).toHaveBeenCalledTimes(1);
      // Core functions: GOVERN, MAP, MEASURE, MANAGE
      expect((prismaMock as any).aIRMFCoreFunction.create).toHaveBeenCalled();
      // Trustworthiness: 7 characteristics
      expect((prismaMock as any).aIRMFTrustworthinessCharacteristic.create).toHaveBeenCalledTimes(7);
      // Lifecycle stages: 5
      expect((prismaMock as any).aIRMFLifecycleStage.create).toHaveBeenCalledTimes(5);
    });

    it('should log audit event when userId is provided', async () => {
      const system = mockAISystem();
      (prismaMock as any).aISystem.create.mockResolvedValue(system);
      (prismaMock as any).aIRMFCoreFunction.create.mockResolvedValue({ id: 'cf-1' });
      (prismaMock as any).aIRMFCoreFunction.findFirst.mockResolvedValue({ id: 'cf-1', aiSystemId: system.id, functionName: 'GOVERN' });
      (prismaMock as any).aIRMFCategory.create.mockResolvedValue({ id: 'cat-1' });
      (prismaMock as any).aIRMFCategory.findFirst.mockResolvedValue({ id: 'cat-1' });
      (prismaMock as any).aIRMFSubcategory.create.mockResolvedValue({ id: 'sub-1' });
      (prismaMock as any).aIRMFTrustworthinessCharacteristic.create.mockResolvedValue({ id: 'tw-1' });
      (prismaMock as any).aIRMFLifecycleStage.create.mockResolvedValue({ id: 'ls-1' });

      await aiRmfService.createAISystem(
        'org-123',
        { name: 'Test AI System', systemType: 'Classification' },
        'user-123',
        '127.0.0.1',
        'Jest'
      );

      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          organizationId: 'org-123',
          action: 'ai_rmf.system.create',
          resourceType: 'AI_RMF_System',
        })
      );
    });

    it('should apply default lifecycleStage and autonomyLevel', async () => {
      const system = mockAISystem();
      (prismaMock as any).aISystem.create.mockResolvedValue(system);
      (prismaMock as any).aIRMFCoreFunction.create.mockResolvedValue({ id: 'cf-1' });
      (prismaMock as any).aIRMFCoreFunction.findFirst.mockResolvedValue({ id: 'cf-1' });
      (prismaMock as any).aIRMFCategory.create.mockResolvedValue({ id: 'cat-1' });
      (prismaMock as any).aIRMFCategory.findFirst.mockResolvedValue({ id: 'cat-1' });
      (prismaMock as any).aIRMFSubcategory.create.mockResolvedValue({ id: 'sub-1' });
      (prismaMock as any).aIRMFTrustworthinessCharacteristic.create.mockResolvedValue({ id: 'tw-1' });
      (prismaMock as any).aIRMFLifecycleStage.create.mockResolvedValue({ id: 'ls-1' });

      await aiRmfService.createAISystem('org-123', {
        name: 'Test',
        systemType: 'NLP',
      });

      expect((prismaMock as any).aISystem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          lifecycleStage: 'Plan_and_Design',
          autonomyLevel: 'Human_in_Loop',
        }),
      });
    });

    it('should throw AppError on failure', async () => {
      (prismaMock as any).aISystem.create.mockRejectedValue(new Error('DB fail'));

      await expect(
        aiRmfService.createAISystem('org-123', { name: 'Test', systemType: 'NLP' })
      ).rejects.toThrow('Failed to create AI system');
    });
  });

  // ======================================================================
  // getAISystems
  // ======================================================================
  describe('getAISystems()', () => {
    it('should return all AI systems for an organization', async () => {
      const systems = [mockAISystem(), mockAISystem({ id: 'ai-system-2', name: 'System 2' })];
      (prismaMock as any).aISystem.findMany.mockResolvedValue(systems);

      const result = await aiRmfService.getAISystems('org-123');

      expect(result).toHaveLength(2);
      expect((prismaMock as any).aISystem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-123' },
        })
      );
    });

    it('should apply filters when provided', async () => {
      (prismaMock as any).aISystem.findMany.mockResolvedValue([]);

      await aiRmfService.getAISystems('org-123', {
        status: 'Active',
        lifecycleStage: 'Deploy_and_Operate',
        riskLevel: 'High',
      });

      expect((prismaMock as any).aISystem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: 'org-123',
            status: 'Active',
            lifecycleStage: 'Deploy_and_Operate',
            riskLevel: 'High',
          },
        })
      );
    });

    it('should throw AppError on failure', async () => {
      (prismaMock as any).aISystem.findMany.mockRejectedValue(new Error('DB error'));

      await expect(aiRmfService.getAISystems('org-123')).rejects.toThrow('Failed to fetch AI systems');
    });
  });

  // ======================================================================
  // getAISystemById
  // ======================================================================
  describe('getAISystemById()', () => {
    it('should return AI system by ID with all relations', async () => {
      const system = mockAISystem();
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(system);

      const result = await aiRmfService.getAISystemById('org-123', 'ai-system-1');

      expect(result).toEqual(system);
      expect((prismaMock as any).aISystem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ai-system-1', organizationId: 'org-123' },
        })
      );
    });

    it('should throw AppError when AI system is not found', async () => {
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.getAISystemById('org-123', 'nonexistent')
      ).rejects.toThrow('AI system not found');
    });

    it('should throw AppError on database failure', async () => {
      (prismaMock as any).aISystem.findFirst.mockRejectedValue(new Error('DB down'));

      await expect(
        aiRmfService.getAISystemById('org-123', 'ai-system-1')
      ).rejects.toThrow('Failed to fetch AI system');
    });
  });

  // ======================================================================
  // updateAISystem
  // ======================================================================
  describe('updateAISystem()', () => {
    it('should update an AI system', async () => {
      const system = mockAISystem();
      const updatedSystem = { ...system, name: 'Updated Name' };
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(system);
      (prismaMock as any).aISystem.update.mockResolvedValue(updatedSystem);

      const result = await aiRmfService.updateAISystem('org-123', 'ai-system-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect((prismaMock as any).aISystem.update).toHaveBeenCalledWith({
        where: { id: 'ai-system-1' },
        data: { name: 'Updated Name' },
      });
    });

    it('should throw AppError when system not found', async () => {
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.updateAISystem('org-123', 'nonexistent', { name: 'x' })
      ).rejects.toThrow('AI system not found');
    });

    it('should log audit event with changes when userId is provided', async () => {
      const system = mockAISystem({ name: 'Old Name', status: 'Active' });
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(system);
      (prismaMock as any).aISystem.update.mockResolvedValue({ ...system, name: 'New Name' });

      await aiRmfService.updateAISystem('org-123', 'ai-system-1', { name: 'New Name' }, 'user-123');

      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ai_rmf.system.update',
          metadata: expect.objectContaining({
            changes: expect.objectContaining({
              name: { old: 'Old Name', new: 'New Name' },
            }),
          }),
        })
      );
    });
  });

  // ======================================================================
  // deleteAISystem
  // ======================================================================
  describe('deleteAISystem()', () => {
    it('should delete an AI system', async () => {
      const system = mockAISystem();
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(system);
      (prismaMock as any).aISystem.delete.mockResolvedValue(system);

      const result = await aiRmfService.deleteAISystem('org-123', 'ai-system-1');

      expect(result).toEqual({ success: true });
      expect((prismaMock as any).aISystem.delete).toHaveBeenCalledWith({
        where: { id: 'ai-system-1' },
      });
    });

    it('should throw AppError when system not found', async () => {
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.deleteAISystem('org-123', 'nonexistent')
      ).rejects.toThrow('AI system not found');
    });

    it('should log audit event before deletion when userId provided', async () => {
      const system = mockAISystem();
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(system);
      (prismaMock as any).aISystem.delete.mockResolvedValue(system);

      await aiRmfService.deleteAISystem('org-123', 'ai-system-1', 'user-123', '127.0.0.1', 'Jest');

      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ai_rmf.system.delete',
          resourceType: 'AI_RMF_System',
          resourceId: 'ai-system-1',
        })
      );
    });
  });

  // ======================================================================
  // updateCoreFunction
  // ======================================================================
  describe('updateCoreFunction()', () => {
    it('should update a core function', async () => {
      const system = mockAISystem();
      const coreFunc = { id: 'cf-1', aiSystemId: 'ai-system-1', functionName: 'GOVERN', status: 'Not_Started', completionPercent: 0 };
      const updatedFunc = { ...coreFunc, status: 'In_Progress', completionPercent: 50 };

      (prismaMock as any).aISystem.findFirst.mockResolvedValue(system);
      (prismaMock as any).aIRMFCoreFunction.findFirst.mockResolvedValue(coreFunc);
      (prismaMock as any).aIRMFCoreFunction.update.mockResolvedValue(updatedFunc);

      const result = await aiRmfService.updateCoreFunction('org-123', 'ai-system-1', 'GOVERN', {
        status: 'In_Progress',
        completionPercent: 50,
      });

      expect(result.completionPercent).toBe(50);
      expect((prismaMock as any).aIRMFCoreFunction.update).toHaveBeenCalledWith({
        where: { id: 'cf-1' },
        data: { status: 'In_Progress', completionPercent: 50 },
      });
    });

    it('should throw when AI system not found', async () => {
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.updateCoreFunction('org-123', 'ai-system-1', 'GOVERN', {})
      ).rejects.toThrow('AI system not found');
    });

    it('should throw when core function not found', async () => {
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(mockAISystem());
      (prismaMock as any).aIRMFCoreFunction.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.updateCoreFunction('org-123', 'ai-system-1', 'INVALID', {})
      ).rejects.toThrow('Core function not found');
    });
  });

  // ======================================================================
  // updateCategory
  // ======================================================================
  describe('updateCategory()', () => {
    it('should update a category', async () => {
      const category = {
        id: 'cat-1',
        categoryId: 'GV.1',
        name: 'Govern 1',
        completionPercent: 0,
        coreFunction: {
          aiSystem: { organizationId: 'org-123', id: 'ai-1', name: 'System' },
          functionName: 'GOVERN',
        },
      };
      const updatedCat = { ...category, completionPercent: 50 };

      (prismaMock as any).aIRMFCategory.findFirst.mockResolvedValue(category);
      (prismaMock as any).aIRMFCategory.update.mockResolvedValue(updatedCat);

      const result = await aiRmfService.updateCategory('org-123', 'cat-1', { completionPercent: 50 });

      expect(result.completionPercent).toBe(50);
    });

    it('should throw when category not found or wrong org', async () => {
      (prismaMock as any).aIRMFCategory.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.updateCategory('org-123', 'cat-nonexistent', {})
      ).rejects.toThrow('Category not found');
    });

    it('should throw when organizationId does not match', async () => {
      const category = {
        id: 'cat-1',
        coreFunction: {
          aiSystem: { organizationId: 'other-org' },
        },
      };
      (prismaMock as any).aIRMFCategory.findFirst.mockResolvedValue(category);

      await expect(
        aiRmfService.updateCategory('org-123', 'cat-1', {})
      ).rejects.toThrow('Category not found');
    });
  });

  // ======================================================================
  // updateSubcategory
  // ======================================================================
  describe('updateSubcategory()', () => {
    it('should update a subcategory and recalculate completion', async () => {
      const subcategory = {
        id: 'sub-1',
        subcategoryId: 'GV.1.1',
        name: 'Sub 1',
        status: 'Not_Started',
        evidence: null,
        notes: null,
        ownerId: null,
        categoryId: 'cat-1',
        category: {
          categoryId: 'GV.1',
          name: 'Govern 1',
          coreFunction: {
            functionName: 'GOVERN',
            aiSystem: { id: 'ai-1', name: 'System', organizationId: 'org-123' },
          },
          subcategories: [{ id: 'sub-1', status: 'Not_Started' }],
        },
      };
      const updatedSub = { ...subcategory, status: 'Completed' };

      (prismaMock as any).aIRMFSubcategory.findFirst.mockResolvedValue(subcategory);
      (prismaMock as any).aIRMFSubcategory.update.mockResolvedValue(updatedSub);
      // Mock recalculation chain
      (prismaMock as any).aIRMFCategory.findUnique.mockResolvedValue({
        id: 'cat-1',
        coreFunctionId: 'cf-1',
        subcategories: [{ status: 'Completed' }],
        coreFunction: { categories: [{ subcategories: [{ status: 'Completed' }] }] },
      });
      (prismaMock as any).aIRMFCategory.update.mockResolvedValue({});
      (prismaMock as any).aIRMFCoreFunction.findUnique.mockResolvedValue({
        id: 'cf-1',
        categories: [{ subcategories: [{ status: 'Completed' }] }],
      });
      (prismaMock as any).aIRMFCoreFunction.update.mockResolvedValue({});

      const result = await aiRmfService.updateSubcategory('org-123', 'sub-1', { status: 'Completed' });

      expect(result.status).toBe('Completed');
      expect((prismaMock as any).aIRMFSubcategory.update).toHaveBeenCalled();
    });

    it('should throw when subcategory not found', async () => {
      (prismaMock as any).aIRMFSubcategory.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.updateSubcategory('org-123', 'nonexistent', {})
      ).rejects.toThrow('Subcategory not found');
    });
  });

  // ======================================================================
  // updateTrustworthinessCharacteristic
  // ======================================================================
  describe('updateTrustworthinessCharacteristic()', () => {
    it('should update a trustworthiness characteristic', async () => {
      const system = mockAISystem();
      const tw = { id: 'tw-1', aiSystemId: 'ai-system-1', characteristic: 'Safe', score: 50, assessmentNotes: null, evidence: null };
      const updatedTw = { ...tw, score: 80 };

      (prismaMock as any).aISystem.findFirst.mockResolvedValue(system);
      (prismaMock as any).aIRMFTrustworthinessCharacteristic.findFirst.mockResolvedValue(tw);
      (prismaMock as any).aIRMFTrustworthinessCharacteristic.update.mockResolvedValue(updatedTw);
      // calculateTrustworthinessScore internals
      (prismaMock as any).aIRMFTrustworthinessCharacteristic.findMany.mockResolvedValue([
        { score: 80 }, { score: 70 },
      ]);
      (prismaMock as any).aISystem.update.mockResolvedValue({});

      const result = await aiRmfService.updateTrustworthinessCharacteristic(
        'org-123', 'ai-system-1', 'Safe', { score: 80 }, 'user-123'
      );

      expect(result.score).toBe(80);
    });

    it('should throw when system not found', async () => {
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.updateTrustworthinessCharacteristic('org-123', 'ai-1', 'Safe', {})
      ).rejects.toThrow('AI system not found');
    });

    it('should throw when characteristic not found', async () => {
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(mockAISystem());
      (prismaMock as any).aIRMFTrustworthinessCharacteristic.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.updateTrustworthinessCharacteristic('org-123', 'ai-1', 'Invalid', {})
      ).rejects.toThrow('Trustworthiness characteristic not found');
    });
  });

  // ======================================================================
  // updateLifecycleStage
  // ======================================================================
  describe('updateLifecycleStage()', () => {
    it('should update a lifecycle stage', async () => {
      const system = mockAISystem();
      const stage = { id: 'ls-1', aiSystemId: 'ai-system-1', stage: 'Plan_and_Design', status: 'Not_Started', notes: null, completionDate: null };

      (prismaMock as any).aISystem.findFirst.mockResolvedValue(system);
      (prismaMock as any).aIRMFLifecycleStage.findFirst.mockResolvedValue(stage);
      (prismaMock as any).aIRMFLifecycleStage.update.mockResolvedValue({ ...stage, status: 'In_Progress' });

      const result = await aiRmfService.updateLifecycleStage('org-123', 'ai-system-1', 'Plan_and_Design', { status: 'In_Progress' });

      expect(result.status).toBe('In_Progress');
    });

    it('should throw when system not found', async () => {
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.updateLifecycleStage('org-123', 'ai-1', 'Plan_and_Design', {})
      ).rejects.toThrow('AI system not found');
    });

    it('should throw when lifecycle stage not found', async () => {
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(mockAISystem());
      (prismaMock as any).aIRMFLifecycleStage.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.updateLifecycleStage('org-123', 'ai-1', 'Invalid', {})
      ).rejects.toThrow('Lifecycle stage not found');
    });
  });

  // ======================================================================
  // addActor
  // ======================================================================
  describe('addActor()', () => {
    it('should add an actor to an AI system', async () => {
      const system = mockAISystem();
      const actor = { id: 'actor-1', aiSystemId: 'ai-system-1', actorType: 'Developer', name: 'John', role: 'ML Engineer' };

      (prismaMock as any).aISystem.findFirst.mockResolvedValue(system);
      (prismaMock as any).aIRMFActor.create.mockResolvedValue(actor);

      const result = await aiRmfService.addActor('org-123', 'ai-system-1', {
        actorType: 'Developer',
        name: 'John',
        role: 'ML Engineer',
      });

      expect(result.name).toBe('John');
    });

    it('should validate userId when provided', async () => {
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(mockAISystem());
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.addActor('org-123', 'ai-system-1', {
          actorType: 'Developer',
          userId: 'invalid-user',
          name: 'John',
          role: 'Engineer',
        })
      ).rejects.toThrow('User not found');
    });

    it('should throw when AI system not found', async () => {
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.addActor('org-123', 'ai-1', { actorType: 'Dev', name: 'J', role: 'R' })
      ).rejects.toThrow('AI system not found');
    });
  });

  // ======================================================================
  // removeActor
  // ======================================================================
  describe('removeActor()', () => {
    it('should remove an actor', async () => {
      const actor = { id: 'actor-1', aiSystem: { organizationId: 'org-123' } };
      (prismaMock as any).aIRMFActor.findFirst.mockResolvedValue(actor);
      (prismaMock as any).aIRMFActor.delete.mockResolvedValue(actor);

      const result = await aiRmfService.removeActor('org-123', 'actor-1');

      expect(result).toEqual({ success: true });
    });

    it('should throw when actor not found or wrong org', async () => {
      (prismaMock as any).aIRMFActor.findFirst.mockResolvedValue(null);

      await expect(aiRmfService.removeActor('org-123', 'nonexistent')).rejects.toThrow('Actor not found');
    });

    it('should throw when actor belongs to different org', async () => {
      const actor = { id: 'actor-1', aiSystem: { organizationId: 'other-org' } };
      (prismaMock as any).aIRMFActor.findFirst.mockResolvedValue(actor);

      await expect(aiRmfService.removeActor('org-123', 'actor-1')).rejects.toThrow('Actor not found');
    });
  });

  // ======================================================================
  // createAssessment
  // ======================================================================
  describe('createAssessment()', () => {
    it('should create an assessment', async () => {
      const system = mockAISystem({ coreFunctions: [{ functionName: 'GOVERN', completionPercent: 50 }] });
      const assessment = { id: 'assess-1', aiSystemId: 'ai-system-1', assessmentType: 'Internal', assessedBy: 'user-123', overallScore: 50 };

      (prismaMock as any).aISystem.findFirst.mockResolvedValue(system);
      (prismaMock as any).aIRMFAssessment.create.mockResolvedValue(assessment);

      const result = await aiRmfService.createAssessment('org-123', 'ai-system-1', {
        assessmentType: 'Internal',
        assessedBy: 'user-123',
      });

      expect(result.assessmentType).toBe('Internal');
    });

    it('should auto-populate functionScores from core functions', async () => {
      const system = mockAISystem({
        coreFunctions: [
          { functionName: 'GOVERN', completionPercent: 60 },
          { functionName: 'MAP', completionPercent: 40 },
        ],
      });
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(system);
      (prismaMock as any).aIRMFAssessment.create.mockResolvedValue({ id: 'a-1' });

      await aiRmfService.createAssessment('org-123', 'ai-system-1', {
        assessmentType: 'Internal',
        assessedBy: 'user-123',
      });

      expect((prismaMock as any).aIRMFAssessment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          functionScores: { GOVERN: 60, MAP: 40 },
          overallScore: 50,
        }),
      });
    });

    it('should throw when system not found', async () => {
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.createAssessment('org-123', 'ai-1', { assessmentType: 'x', assessedBy: 'u' })
      ).rejects.toThrow('AI system not found');
    });
  });

  // ======================================================================
  // deleteAssessment
  // ======================================================================
  describe('deleteAssessment()', () => {
    it('should delete an assessment', async () => {
      const assessment = {
        id: 'assess-1',
        assessmentType: 'Internal',
        overallScore: 80,
        assessedBy: 'user-1',
        assessmentDate: new Date(),
        aiSystem: { id: 'ai-1', organizationId: 'org-123', name: 'System' },
      };
      (prismaMock as any).aIRMFAssessment.findFirst.mockResolvedValue(assessment);
      (prismaMock as any).aIRMFAssessment.delete.mockResolvedValue(assessment);

      const result = await aiRmfService.deleteAssessment('org-123', 'assess-1');

      expect(result).toEqual({ success: true });
    });

    it('should throw when assessment not found', async () => {
      (prismaMock as any).aIRMFAssessment.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.deleteAssessment('org-123', 'nonexistent')
      ).rejects.toThrow('Assessment not found');
    });
  });

  // ======================================================================
  // getAssessments
  // ======================================================================
  describe('getAssessments()', () => {
    it('should return assessments with user info and current scores', async () => {
      const assessments = [
        { id: 'a-1', assessedBy: 'user-1', aiSystemId: 'ai-1' },
      ];
      (prismaMock as any).aIRMFAssessment.findMany.mockResolvedValue(assessments);
      prismaMock.user.findMany.mockResolvedValue([{ id: 'user-1', name: 'Test', email: 'test@test.com' }]);
      (prismaMock as any).aISystem.findFirst.mockResolvedValue({
        id: 'ai-1',
        coreFunctions: [{ functionName: 'GOVERN', completionPercent: 75 }],
      });

      const result = await aiRmfService.getAssessments('org-123', 'ai-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('assessedByUser');
      expect(result[0]).toHaveProperty('currentFunctionScores');
      expect(result[0]).toHaveProperty('currentOverallScore');
    });
  });

  // ======================================================================
  // createProfile
  // ======================================================================
  describe('createProfile()', () => {
    it('should create a profile', async () => {
      const system = mockAISystem();
      const profile = { id: 'prof-1', profileName: 'Test Profile', profileType: 'Current' };

      (prismaMock as any).aISystem.findFirst.mockResolvedValue(system);
      (prismaMock as any).aIRMFProfile.create.mockResolvedValue(profile);

      const result = await aiRmfService.createProfile('org-123', 'ai-system-1', {
        profileName: 'Test Profile',
        profileType: 'Current',
        selectedFunctions: { GOVERN: true },
      });

      expect(result.profileName).toBe('Test Profile');
    });

    it('should throw when system not found', async () => {
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.createProfile('org-123', 'ai-1', {
          profileName: 'P', profileType: 'T', selectedFunctions: {},
        })
      ).rejects.toThrow('AI system not found');
    });
  });

  // ======================================================================
  // createRiskActivity
  // ======================================================================
  describe('createRiskActivity()', () => {
    it('should create a risk activity', async () => {
      const system = mockAISystem();
      const riskActivity = {
        id: 'ra-1', aiSystemId: 'ai-system-1', activityType: 'Risk_Assessment',
        description: 'Risk found', riskLevel: 'High',
      };

      (prismaMock as any).aISystem.findFirst.mockResolvedValue(system);
      (prismaMock as any).aIRMFRiskActivity.create.mockResolvedValue(riskActivity);

      const result = await aiRmfService.createRiskActivity('org-123', 'ai-system-1', {
        activityType: 'Risk_Assessment',
        description: 'Risk found',
        riskLevel: 'High',
      });

      expect(result.riskLevel).toBe('High');
    });

    it('should validate ownerId when provided', async () => {
      (prismaMock as any).aISystem.findFirst.mockResolvedValue(mockAISystem());
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.createRiskActivity('org-123', 'ai-1', {
          activityType: 'Assessment',
          description: 'Desc',
          riskLevel: 'High',
          ownerId: 'invalid-user',
        })
      ).rejects.toThrow('Owner user not found');
    });
  });

  // ======================================================================
  // updateRiskActivity
  // ======================================================================
  describe('updateRiskActivity()', () => {
    it('should update a risk activity', async () => {
      const activity = {
        id: 'ra-1', status: 'Open', riskLevel: 'High', mitigationPlan: null,
        ownerId: null, targetDate: null, description: 'Desc', activityType: 'Assessment',
        relatedFunction: null, relatedCategory: null, relatedSubcategory: null,
        aiSystem: { id: 'ai-1', organizationId: 'org-123', name: 'System' },
      };
      (prismaMock as any).aIRMFRiskActivity.findFirst.mockResolvedValue(activity);
      (prismaMock as any).aIRMFRiskActivity.update.mockResolvedValue({ ...activity, status: 'Mitigated' });

      const result = await aiRmfService.updateRiskActivity('org-123', 'ra-1', { status: 'Mitigated' });

      expect(result.status).toBe('Mitigated');
    });

    it('should throw when risk activity not found', async () => {
      (prismaMock as any).aIRMFRiskActivity.findFirst.mockResolvedValue(null);

      await expect(
        aiRmfService.updateRiskActivity('org-123', 'nonexistent', {})
      ).rejects.toThrow('Risk activity not found');
    });
  });

  // ======================================================================
  // calculateTrustworthinessScore
  // ======================================================================
  describe('calculateTrustworthinessScore()', () => {
    it('should calculate average score from characteristics', async () => {
      (prismaMock as any).aIRMFTrustworthinessCharacteristic.findMany.mockResolvedValue([
        { score: 80 }, { score: 60 }, { score: 70 },
      ]);
      (prismaMock as any).aISystem.update.mockResolvedValue({});

      const score = await aiRmfService.calculateTrustworthinessScore('org-123', 'ai-1');

      expect(score).toBe(70);
      expect((prismaMock as any).aISystem.update).toHaveBeenCalledWith({
        where: { id: 'ai-1' },
        data: { overallTrustworthinessScore: 70 },
      });
    });

    it('should return 0 when no characteristics exist', async () => {
      (prismaMock as any).aIRMFTrustworthinessCharacteristic.findMany.mockResolvedValue([]);

      const score = await aiRmfService.calculateTrustworthinessScore('org-123', 'ai-1');

      expect(score).toBe(0);
    });

    it('should handle null scores', async () => {
      (prismaMock as any).aIRMFTrustworthinessCharacteristic.findMany.mockResolvedValue([
        { score: null }, { score: 100 }, { score: null },
      ]);
      (prismaMock as any).aISystem.update.mockResolvedValue({});

      const score = await aiRmfService.calculateTrustworthinessScore('org-123', 'ai-1');

      expect(score).toBe(100);
    });
  });

  // ======================================================================
  // getDashboardData
  // ======================================================================
  describe('getDashboardData()', () => {
    it('should return dashboard statistics', async () => {
      const systems = [
        mockAISystem({ status: 'Active', lifecycleStage: 'Plan_and_Design', riskLevel: 'Medium', overallTrustworthinessScore: 80 }),
        mockAISystem({ id: 'ai-2', status: 'Active', lifecycleStage: 'Deploy_and_Operate', riskLevel: 'High', overallTrustworthinessScore: 60 }),
      ];
      (prismaMock as any).aISystem.findMany.mockResolvedValue(systems);

      const result = await aiRmfService.getDashboardData('org-123');

      expect(result.totalSystems).toBe(2);
      expect(result.byStatus).toEqual({ Active: 2 });
      expect(result.byRiskLevel).toEqual({ Medium: 1, High: 1 });
      expect(result.averageTrustworthinessScore).toBe(70);
    });

    it('should handle no systems', async () => {
      (prismaMock as any).aISystem.findMany.mockResolvedValue([]);

      const result = await aiRmfService.getDashboardData('org-123');

      expect(result.totalSystems).toBe(0);
      expect(result.averageTrustworthinessScore).toBe(0);
    });
  });
});
