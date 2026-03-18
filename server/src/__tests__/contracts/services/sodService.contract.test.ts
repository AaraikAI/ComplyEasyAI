/**
 * SoD (Separation of Duties) Service Contract Tests
 *
 * Verifies the contract for SoD rule CRUD, violation detection,
 * and analysis logic.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockSodRule, createMockSodViolation } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

import sodService from '../../../services/sodService';

describe('SoDService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createSoDRule
  // ---------------------------------------------------------------------------
  describe('createSoDRule', () => {
    it('should call prisma.soDRule.create with correct shape', async () => {
      const mockRule = createMockSodRule();
      prismaMock.soDRule.create.mockResolvedValue(mockRule);

      await sodService.createSoDRule({
        organizationId: 'org-123',
        name: 'AP vs AR Separation',
        description: 'Users cannot have both AP and AR access',
        ruleType: 'Conflicting',
        function1: 'Approve Purchase Orders',
        function2: 'Process Payments',
        createdBy: 'user-1',
      });

      expect(prismaMock.soDRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
          name: 'AP vs AR Separation',
          ruleType: 'Conflicting',
          function1: 'Approve Purchase Orders',
          function2: 'Process Payments',
          riskLevel: 'High',
          enabled: true,
          status: 'Active',
        }),
      });
    });

    it('should default riskLevel to High when not provided', async () => {
      prismaMock.soDRule.create.mockResolvedValue(createMockSodRule());

      await sodService.createSoDRule({
        organizationId: 'org-123',
        name: 'Rule',
        ruleType: 'Conflicting',
        function1: 'F1',
        function2: 'F2',
        createdBy: 'user-1',
      });

      expect(prismaMock.soDRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          riskLevel: 'High',
        }),
      });
    });

    it('should default enabled to true and status to Active', async () => {
      prismaMock.soDRule.create.mockResolvedValue(createMockSodRule());

      await sodService.createSoDRule({
        organizationId: 'org-123',
        name: 'Rule',
        ruleType: 'Toxic',
        function1: 'F1',
        function2: 'F2',
        createdBy: 'user-1',
      });

      expect(prismaMock.soDRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          enabled: true,
          status: 'Active',
        }),
      });
    });

    it('should propagate database errors', async () => {
      prismaMock.soDRule.create.mockRejectedValue(new Error('Constraint violation'));

      await expect(
        sodService.createSoDRule({
          organizationId: 'org-123',
          name: 'Rule',
          ruleType: 'Conflicting',
          function1: 'F1',
          function2: 'F2',
          createdBy: 'user-1',
        })
      ).rejects.toThrow('Constraint violation');
    });
  });

  // ---------------------------------------------------------------------------
  // listSoDRules / getSoDRules
  // ---------------------------------------------------------------------------
  describe('listSoDRules', () => {
    it('should call prisma.soDRule.findMany with organization filter', async () => {
      prismaMock.soDRule.findMany.mockResolvedValue([createMockSodRule()]);

      await sodService.listSoDRules('org-123');

      expect(prismaMock.soDRule.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-123' },
        orderBy: { createdAt: 'desc' },
        skip: undefined,
        take: undefined,
      });
    });

    it('should apply optional filters', async () => {
      prismaMock.soDRule.findMany.mockResolvedValue([]);

      await sodService.listSoDRules('org-123', {
        system: 'SAP',
        riskLevel: 'Critical',
        enabled: true,
      });

      expect(prismaMock.soDRule.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: 'org-123',
          system: 'SAP',
          riskLevel: 'Critical',
          enabled: true,
        }),
        orderBy: { createdAt: 'desc' },
        skip: undefined,
        take: undefined,
      });
    });

    it('should return array of rules', async () => {
      const rules = [createMockSodRule(), createMockSodRule({ id: 'sod-rule-456' })];
      prismaMock.soDRule.findMany.mockResolvedValue(rules);

      const result = await sodService.listSoDRules('org-123');

      expect(result).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // getSoDRule
  // ---------------------------------------------------------------------------
  describe('getSoDRule', () => {
    it('should call prisma.soDRule.findFirst with id and org filter', async () => {
      prismaMock.soDRule.findFirst.mockResolvedValue(createMockSodRule());

      await sodService.getSoDRule('sod-rule-123', 'org-123');

      expect(prismaMock.soDRule.findFirst).toHaveBeenCalledWith({
        where: { id: 'sod-rule-123', organizationId: 'org-123' },
      });
    });

    it('should return null when rule is not found', async () => {
      prismaMock.soDRule.findFirst.mockResolvedValue(null);

      const result = await sodService.getSoDRule('nonexistent', 'org-123');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // updateSoDRule
  // ---------------------------------------------------------------------------
  describe('updateSoDRule', () => {
    it('should update rule after verifying existence', async () => {
      prismaMock.soDRule.findFirst.mockResolvedValue(createMockSodRule());
      prismaMock.soDRule.update.mockResolvedValue(
        createMockSodRule({ name: 'Updated Rule' })
      );

      await sodService.updateSoDRule('sod-rule-123', 'user-1', 'org-123', {
        name: 'Updated Rule',
      });

      expect(prismaMock.soDRule.findFirst).toHaveBeenCalledWith({
        where: { id: 'sod-rule-123', organizationId: 'org-123' },
      });
      expect(prismaMock.soDRule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sod-rule-123' },
        })
      );
    });

    it('should return null if rule does not exist', async () => {
      prismaMock.soDRule.findFirst.mockResolvedValue(null);

      const result = await sodService.updateSoDRule('nonexistent', 'user-1', 'org-123', {
        name: 'Update',
      });

      expect(result).toBeNull();
      expect(prismaMock.soDRule.update).not.toHaveBeenCalled();
    });
  });
});
