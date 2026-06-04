/**
 * SoD Service Unit Tests
 * Comprehensive tests for Segregation of Duties analysis functionality
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

// Mock the database - MUST be before importing modules that use it
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

// Mock dependencies
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn(),
  },
}));

// Import after mocking
import { SoDService, sodService } from '../../../services/sodService';
import { AuditLogger } from '../../../utils/auditLogger';

// =============================================================================
// Mock Data Factories
// =============================================================================

const createMockSoDRule = (overrides: Record<string, unknown> = {}) => ({
  id: 'sod_rule_123',
  organizationId: 'org-123',
  name: 'PO Creation vs PO Approval',
  description: 'User should not be able to both create and approve purchase orders',
  ruleType: 'Conflicting',
  function1: 'Create Purchase Orders',
  function2: 'Approve Purchase Orders',
  riskLevel: 'High',
  system: 'ERP',
  mitigatingControl: null,
  enabled: true,
  status: 'Active',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockSoDViolation = (overrides: Record<string, unknown> = {}) => ({
  id: 'sod_viol_123',
  organizationId: 'org-123',
  ruleId: 'sod_rule_123',
  userId: 'user-456',
  userName: 'John Doe',
  conflictingRoles: {
    function1: 'Create Purchase Orders',
    function2: 'Approve Purchase Orders',
    userPermissions: ['Create Purchase Orders', 'Approve Purchase Orders'],
  },
  detectedAt: new Date(),
  status: 'Open',
  riskLevel: 'High',
  mitigationAction: null,
  compensatingControls: null,
  mitigatedBy: null,
  mitigatedAt: null,
  acceptedBy: null,
  acceptanceReason: null,
  reviewDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  rule: createMockSoDRule(),
  ...overrides,
});

const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-123',
  email: 'user@example.com',
  name: 'Test User',
  role: 'admin',
  active: true,
  ...overrides,
});

describe('SoDService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // SoD Rule CRUD Tests
  // ===========================================================================

  describe('SoD Rule CRUD', () => {
    describe('createSoDRule()', () => {
      it('should create a new SoD rule', async () => {
        const mockRule = createMockSoDRule();
        prismaMock.soDRule.create.mockResolvedValue(mockRule);

        const result = await sodService.createSoDRule({
          organizationId: 'org-123',
          name: 'PO Creation vs PO Approval',
          description: 'User should not be able to both create and approve purchase orders',
          ruleType: 'Conflicting',
          function1: 'Create Purchase Orders',
          function2: 'Approve Purchase Orders',
          riskLevel: 'High',
          system: 'ERP',
          createdBy: 'admin-123',
        });

        expect(result.name).toBe('PO Creation vs PO Approval');
        expect(prismaMock.soDRule.create).toHaveBeenCalledTimes(1);
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'sod_rule.created',
            resourceType: 'SoDRule',
          })
        );
      });

      it('should use default values for optional fields', async () => {
        const mockRule = createMockSoDRule({ riskLevel: 'High', enabled: true, status: 'Active' });
        prismaMock.soDRule.create.mockResolvedValue(mockRule);

        await sodService.createSoDRule({
          organizationId: 'org-123',
          name: 'Basic Rule',
          ruleType: 'Conflicting',
          function1: 'Function A',
          function2: 'Function B',
          createdBy: 'admin-123',
        });

        expect(prismaMock.soDRule.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              riskLevel: 'High',
              enabled: true,
              status: 'Active',
            }),
          })
        );
      });

      it('should generate unique ID with sod_rule prefix', async () => {
        const mockRule = createMockSoDRule();
        prismaMock.soDRule.create.mockResolvedValue(mockRule);

        await sodService.createSoDRule({
          organizationId: 'org-123',
          name: 'Test Rule',
          ruleType: 'Conflicting',
          function1: 'A',
          function2: 'B',
          createdBy: 'admin-123',
        });

        expect(prismaMock.soDRule.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              id: expect.stringMatching(/^sod_rule_/),
            }),
          })
        );
      });
    });

    describe('listSoDRules()', () => {
      it('should return all rules for organization', async () => {
        const mockRules = [createMockSoDRule(), createMockSoDRule({ id: 'rule-2' })];
        prismaMock.soDRule.findMany.mockResolvedValue(mockRules);

        const result = await sodService.listSoDRules('org-123');

        expect(result).toHaveLength(2);
        expect(prismaMock.soDRule.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { organizationId: 'org-123' },
          })
        );
      });

      it('should filter by system', async () => {
        prismaMock.soDRule.findMany.mockResolvedValue([]);

        await sodService.listSoDRules('org-123', { system: 'SAP' });

        expect(prismaMock.soDRule.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              system: 'SAP',
            }),
          })
        );
      });

      it('should filter by risk level', async () => {
        prismaMock.soDRule.findMany.mockResolvedValue([]);

        await sodService.listSoDRules('org-123', { riskLevel: 'Critical' });

        expect(prismaMock.soDRule.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              riskLevel: 'Critical',
            }),
          })
        );
      });

      it('should filter by enabled status', async () => {
        prismaMock.soDRule.findMany.mockResolvedValue([]);

        await sodService.listSoDRules('org-123', { enabled: true });

        expect(prismaMock.soDRule.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              enabled: true,
            }),
          })
        );
      });

      it('should support pagination', async () => {
        prismaMock.soDRule.findMany.mockResolvedValue([]);

        await sodService.listSoDRules('org-123', {}, { skip: 10, take: 25 });

        expect(prismaMock.soDRule.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 10,
            take: 25,
          })
        );
      });
    });

    describe('getSoDRule()', () => {
      it('should return rule by ID', async () => {
        const mockRule = createMockSoDRule();
        prismaMock.soDRule.findFirst.mockResolvedValue(mockRule);

        const result = await sodService.getSoDRule('sod_rule_123', 'org-123');

        expect(result?.id).toBe('sod_rule_123');
      });

      it('should return null when rule not found', async () => {
        prismaMock.soDRule.findFirst.mockResolvedValue(null);

        const result = await sodService.getSoDRule('non-existent', 'org-123');

        expect(result).toBeNull();
      });

      it('should filter by organization ID', async () => {
        prismaMock.soDRule.findFirst.mockResolvedValue(null);

        await sodService.getSoDRule('sod_rule_123', 'org-123');

        expect(prismaMock.soDRule.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'sod_rule_123', organizationId: 'org-123' },
          })
        );
      });
    });

    describe('updateSoDRule()', () => {
      it('should update rule', async () => {
        const existingRule = createMockSoDRule();
        const updatedRule = { ...existingRule, riskLevel: 'Critical' };

        prismaMock.soDRule.findFirst.mockResolvedValue(existingRule);
        prismaMock.soDRule.update.mockResolvedValue(updatedRule);

        const result = await sodService.updateSoDRule('sod_rule_123', 'admin-123', 'org-123', {
          riskLevel: 'Critical',
        });

        expect(result?.riskLevel).toBe('Critical');
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'sod_rule.updated',
          })
        );
      });

      it('should return null when rule not found', async () => {
        prismaMock.soDRule.findFirst.mockResolvedValue(null);

        const result = await sodService.updateSoDRule('non-existent', 'admin-123', 'org-123', {
          riskLevel: 'Critical',
        });

        expect(result).toBeNull();
      });

      it('should only update provided fields', async () => {
        const existingRule = createMockSoDRule();
        prismaMock.soDRule.findFirst.mockResolvedValue(existingRule);
        prismaMock.soDRule.update.mockResolvedValue(existingRule);

        await sodService.updateSoDRule('sod_rule_123', 'admin-123', 'org-123', {
          name: 'Updated Name',
          enabled: false,
        });

        expect(prismaMock.soDRule.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { name: 'Updated Name', enabled: false },
          })
        );
      });
    });

    describe('deleteSoDRule()', () => {
      it('should delete rule', async () => {
        const existingRule = createMockSoDRule();
        prismaMock.soDRule.findFirst.mockResolvedValue(existingRule);
        prismaMock.soDRule.delete.mockResolvedValue(existingRule);

        const result = await sodService.deleteSoDRule('sod_rule_123', 'admin-123', 'org-123');

        expect(result).toBe(true);
        expect(prismaMock.soDRule.delete).toHaveBeenCalledWith({
          where: { id: 'sod_rule_123' },
        });
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'sod_rule.deleted',
          })
        );
      });

      it('should return false when rule not found', async () => {
        prismaMock.soDRule.findFirst.mockResolvedValue(null);

        const result = await sodService.deleteSoDRule('non-existent', 'admin-123', 'org-123');

        expect(result).toBe(false);
      });
    });
  });

  // ===========================================================================
  // SoD Violation CRUD Tests
  // ===========================================================================

  describe('SoD Violation CRUD', () => {
    describe('createSoDViolation()', () => {
      it('should create a new violation', async () => {
        const mockViolation = createMockSoDViolation();
        prismaMock.soDViolation.create.mockResolvedValue(mockViolation);

        const result = await sodService.createSoDViolation({
          organizationId: 'org-123',
          ruleId: 'sod_rule_123',
          userId: 'user-456',
          userName: 'John Doe',
          conflictingRoles: {
            function1: 'Create PO',
            function2: 'Approve PO',
          },
          riskLevel: 'High',
          detectedByUserId: 'admin-123',
        });

        expect(result.status).toBe('Open');
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'sod_violation.detected',
            metadata: expect.objectContaining({
              affectedUser: 'John Doe',
              riskLevel: 'High',
            }),
          })
        );
      });

      it('should generate unique ID with sod_viol prefix', async () => {
        const mockViolation = createMockSoDViolation();
        prismaMock.soDViolation.create.mockResolvedValue(mockViolation);

        await sodService.createSoDViolation({
          organizationId: 'org-123',
          ruleId: 'sod_rule_123',
          userId: 'user-456',
          userName: 'John Doe',
          conflictingRoles: {},
          riskLevel: 'High',
          detectedByUserId: 'admin-123',
        });

        expect(prismaMock.soDViolation.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              id: expect.stringMatching(/^sod_viol_/),
              status: 'Open',
            }),
          })
        );
      });
    });

    describe('listSoDViolations()', () => {
      it('should return violations with rule data', async () => {
        const mockViolations = [createMockSoDViolation()];
        prismaMock.soDViolation.findMany.mockResolvedValue(mockViolations);

        const result = await sodService.listSoDViolations('org-123');

        expect(result).toHaveLength(1);
        expect(result[0].rule).toBeDefined();
        expect(prismaMock.soDViolation.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            include: { rule: true },
          })
        );
      });

      it('should filter by status', async () => {
        prismaMock.soDViolation.findMany.mockResolvedValue([]);

        await sodService.listSoDViolations('org-123', { status: 'Open' });

        expect(prismaMock.soDViolation.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'Open',
            }),
          })
        );
      });

      it('should filter by ruleId', async () => {
        prismaMock.soDViolation.findMany.mockResolvedValue([]);

        await sodService.listSoDViolations('org-123', { ruleId: 'sod_rule_123' });

        expect(prismaMock.soDViolation.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              ruleId: 'sod_rule_123',
            }),
          })
        );
      });

      it('should filter by userId', async () => {
        prismaMock.soDViolation.findMany.mockResolvedValue([]);

        await sodService.listSoDViolations('org-123', { userId: 'user-456' });

        expect(prismaMock.soDViolation.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              userId: 'user-456',
            }),
          })
        );
      });
    });

    describe('getSoDViolation()', () => {
      it('should return violation with rule', async () => {
        const mockViolation = createMockSoDViolation();
        prismaMock.soDViolation.findFirst.mockResolvedValue(mockViolation);

        const result = await sodService.getSoDViolation('sod_viol_123', 'org-123');

        expect(result?.rule).toBeDefined();
      });

      it('should return null when not found', async () => {
        prismaMock.soDViolation.findFirst.mockResolvedValue(null);

        const result = await sodService.getSoDViolation('non-existent', 'org-123');

        expect(result).toBeNull();
      });
    });
  });

  // ===========================================================================
  // SoD Analysis Tests
  // ===========================================================================

  describe('runSoDAnalysis()', () => {
    it('should return message when no enabled rules', async () => {
      prismaMock.soDRule.findMany.mockResolvedValue([]);

      const result = await sodService.runSoDAnalysis('org-123', 'admin-123');

      expect(result.rulesEvaluated).toBe(0);
      expect(result.message).toContain('No enabled SoD rules');
    });

    it('should detect violations for users with conflicting permissions', async () => {
      const mockRule = createMockSoDRule({
        function1: 'Create Purchase Orders',
        function2: 'Approve Purchase Orders',
      });
      const mockUser = createMockUser({
        id: 'user-admin',
        role: 'admin',
        name: 'Admin User',
      });

      prismaMock.soDRule.findMany.mockResolvedValue([mockRule]);
      prismaMock.user.findMany.mockResolvedValue([mockUser]);
      prismaMock.soDViolation.findMany.mockResolvedValue([]); // No existing violations
      prismaMock.soDViolation.create.mockResolvedValue(createMockSoDViolation());
      prismaMock.organization.findUnique.mockResolvedValue(null);

      const result = await sodService.runSoDAnalysis('org-123', 'admin-123');

      expect(result.rulesEvaluated).toBe(1);
      expect(result.usersScanned).toBe(1);
      expect(result.violationsFound).toBeGreaterThan(0);
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'sod_analysis.completed',
        })
      );
    });

    it('should not create duplicate violations', async () => {
      const mockRule = createMockSoDRule();
      const mockUser = createMockUser({ id: 'user-admin', role: 'admin' });
      const existingViolation = createMockSoDViolation({
        ruleId: mockRule.id,
        userId: 'user-admin',
        status: 'Open',
      });

      prismaMock.soDRule.findMany.mockResolvedValue([mockRule]);
      prismaMock.user.findMany.mockResolvedValue([mockUser]);
      prismaMock.soDViolation.findMany.mockResolvedValue([existingViolation]);
      prismaMock.organization.findUnique.mockResolvedValue(null);

      const result = await sodService.runSoDAnalysis('org-123', 'admin-123');

      expect(result.existingOpenViolations).toBe(1);
      // New violations should not include the already existing one
      expect(prismaMock.soDViolation.create).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Violation Resolution Tests
  // ===========================================================================

  describe('Violation Resolution', () => {
    describe('mitigateViolation()', () => {
      it('should mitigate violation with compensating control', async () => {
        const existingViolation = createMockSoDViolation();
        const mitigatedViolation = { ...existingViolation, status: 'Mitigated' };

        prismaMock.soDViolation.findFirst.mockResolvedValue(existingViolation);
        prismaMock.soDViolation.update.mockResolvedValue(mitigatedViolation);

        const result = await sodService.mitigateViolation(
          'sod_viol_123',
          'admin-123',
          'org-123',
          { mitigatingControl: 'Manager approval required for all transactions' }
        );

        expect(result?.status).toBe('Mitigated');
        expect(prismaMock.soDViolation.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: 'Mitigated',
              mitigationAction: 'Manager approval required for all transactions',
              mitigatedBy: 'admin-123',
              mitigatedAt: expect.any(Date),
            }),
          })
        );
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'sod_violation.mitigated',
          })
        );
      });

      it('should return null when violation not found', async () => {
        prismaMock.soDViolation.findFirst.mockResolvedValue(null);

        const result = await sodService.mitigateViolation(
          'non-existent',
          'admin-123',
          'org-123',
          { mitigatingControl: 'Test' }
        );

        expect(result).toBeNull();
      });
    });

    describe('acceptViolation()', () => {
      it('should accept violation with justification', async () => {
        const existingViolation = createMockSoDViolation();
        const acceptedViolation = { ...existingViolation, status: 'Accepted' };

        prismaMock.soDViolation.findFirst.mockResolvedValue(existingViolation);
        prismaMock.soDViolation.update.mockResolvedValue(acceptedViolation);

        const result = await sodService.acceptViolation(
          'sod_viol_123',
          'admin-123',
          'org-123',
          { justification: 'Business need - executive approval granted' }
        );

        expect(result?.status).toBe('Accepted');
        expect(prismaMock.soDViolation.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: 'Accepted',
              acceptedBy: 'admin-123',
              acceptanceReason: 'Business need - executive approval granted',
            }),
          })
        );
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'sod_violation.accepted',
          })
        );
      });

      it('should set review date if provided', async () => {
        const existingViolation = createMockSoDViolation();
        prismaMock.soDViolation.findFirst.mockResolvedValue(existingViolation);
        prismaMock.soDViolation.update.mockResolvedValue({ ...existingViolation, status: 'Accepted' });

        await sodService.acceptViolation(
          'sod_viol_123',
          'admin-123',
          'org-123',
          { justification: 'Temporary exception', reviewDate: '2024-12-31' }
        );

        expect(prismaMock.soDViolation.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              reviewDate: expect.any(Date),
            }),
          })
        );
      });
    });

    describe('remediateViolation()', () => {
      it('should remediate violation', async () => {
        const existingViolation = createMockSoDViolation();
        const remediatedViolation = { ...existingViolation, status: 'Remediated' };

        prismaMock.soDViolation.findFirst.mockResolvedValue(existingViolation);
        prismaMock.soDViolation.update.mockResolvedValue(remediatedViolation);

        const result = await sodService.remediateViolation(
          'sod_viol_123',
          'admin-123',
          'org-123',
          { remediationAction: 'Removed user access to Approve PO function' }
        );

        expect(result?.status).toBe('Remediated');
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'sod_violation.remediated',
          })
        );
      });
    });
  });

  // ===========================================================================
  // SoD Matrix Tests
  // ===========================================================================

  describe('getMatrix()', () => {
    it('should build conflict matrix from rules', async () => {
      const mockRules = [
        createMockSoDRule({
          function1: 'Create PO',
          function2: 'Approve PO',
        }),
        createMockSoDRule({
          id: 'rule-2',
          function1: 'Create Vendor',
          function2: 'Process Payment',
        }),
      ];
      prismaMock.soDRule.findMany.mockResolvedValue(mockRules);
      prismaMock.soDViolation.findMany.mockResolvedValue([]);

      const result = await sodService.getMatrix('org-123');

      expect(result.roles).toContain('Create PO');
      expect(result.roles).toContain('Approve PO');
      expect(result.roles).toContain('Create Vendor');
      expect(result.totalConflicts).toBe(2);
      expect(result.matrix['Create PO']['Approve PO'].hasConflict).toBe(true);
    });

    it('should include violation counts in matrix', async () => {
      const mockRule = createMockSoDRule({
        id: 'rule-1',
        function1: 'Create PO',
        function2: 'Approve PO',
      });
      const mockViolations = [
        createMockSoDViolation({ ruleId: 'rule-1', status: 'Open' }),
        createMockSoDViolation({ id: 'v2', ruleId: 'rule-1', status: 'Open' }),
      ];

      prismaMock.soDRule.findMany.mockResolvedValue([mockRule]);
      prismaMock.soDViolation.findMany.mockResolvedValue(mockViolations);

      const result = await sodService.getMatrix('org-123');

      expect(result.matrix['Create PO']['Approve PO'].violationCount).toBe(2);
    });

    it('should filter by system', async () => {
      prismaMock.soDRule.findMany.mockResolvedValue([]);
      prismaMock.soDViolation.findMany.mockResolvedValue([]);

      await sodService.getMatrix('org-123', 'SAP');

      expect(prismaMock.soDRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            system: 'SAP',
          }),
        })
      );
    });

    it('should create mirrored conflict entries', async () => {
      const mockRule = createMockSoDRule({
        function1: 'A',
        function2: 'B',
      });
      prismaMock.soDRule.findMany.mockResolvedValue([mockRule]);
      prismaMock.soDViolation.findMany.mockResolvedValue([]);

      const result = await sodService.getMatrix('org-123');

      // Both A->B and B->A should show conflict
      expect(result.matrix['A']['B'].hasConflict).toBe(true);
      expect(result.matrix['B']['A'].hasConflict).toBe(true);
    });
  });

  // ===========================================================================
  // Analytics Dashboard Tests
  // ===========================================================================

  describe('getAnalyticsDashboard()', () => {
    it('should return comprehensive analytics', async () => {
      const mockRules = [
        createMockSoDRule({ enabled: true }),
        createMockSoDRule({ id: 'rule-2', enabled: false }),
      ];
      const mockViolations = [
        createMockSoDViolation({ status: 'Open', riskLevel: 'Critical' }),
        createMockSoDViolation({ id: 'v2', status: 'Open', riskLevel: 'High' }),
        createMockSoDViolation({ id: 'v3', status: 'Mitigated', riskLevel: 'High' }),
        createMockSoDViolation({ id: 'v4', status: 'Remediated', riskLevel: 'Medium' }),
      ];

      prismaMock.soDRule.findMany.mockResolvedValue(mockRules);
      prismaMock.soDViolation.findMany.mockResolvedValue(mockViolations);

      const result = await sodService.getAnalyticsDashboard('org-123');

      expect(result.summary.totalRules).toBe(2);
      expect(result.summary.enabledRules).toBe(1);
      expect(result.summary.totalViolations).toBe(4);
      expect(result.summary.openViolations).toBe(2);
      expect(result.summary.mitigatedViolations).toBe(1);
      expect(result.summary.remediatedViolations).toBe(1);
    });

    it('should calculate risk distribution for open violations', async () => {
      const mockViolations = [
        createMockSoDViolation({ status: 'Open', riskLevel: 'Critical' }),
        createMockSoDViolation({ id: 'v2', status: 'Open', riskLevel: 'High' }),
        createMockSoDViolation({ id: 'v3', status: 'Open', riskLevel: 'High' }),
        createMockSoDViolation({ id: 'v4', status: 'Mitigated', riskLevel: 'Critical' }), // Not counted
      ];

      prismaMock.soDRule.findMany.mockResolvedValue([]);
      prismaMock.soDViolation.findMany.mockResolvedValue(mockViolations);

      const result = await sodService.getAnalyticsDashboard('org-123');

      expect(result.riskDistribution.critical).toBe(1);
      expect(result.riskDistribution.high).toBe(2);
    });

    it('should identify top violators', async () => {
      const mockViolations = [
        createMockSoDViolation({ userId: 'user-1', userName: 'User One', status: 'Open' }),
        createMockSoDViolation({ id: 'v2', userId: 'user-1', userName: 'User One', status: 'Open' }),
        createMockSoDViolation({ id: 'v3', userId: 'user-1', userName: 'User One', status: 'Open' }),
        createMockSoDViolation({ id: 'v4', userId: 'user-2', userName: 'User Two', status: 'Open' }),
      ];

      prismaMock.soDRule.findMany.mockResolvedValue([]);
      prismaMock.soDViolation.findMany.mockResolvedValue(mockViolations);

      const result = await sodService.getAnalyticsDashboard('org-123');

      expect(result.topViolators[0].userId).toBe('user-1');
      expect(result.topViolators[0].count).toBe(3);
    });

    it('should calculate resolution rate', async () => {
      const mockViolations = [
        createMockSoDViolation({ status: 'Open' }),
        createMockSoDViolation({ id: 'v2', status: 'Mitigated' }),
        createMockSoDViolation({ id: 'v3', status: 'Remediated' }),
        createMockSoDViolation({ id: 'v4', status: 'Accepted' }),
      ];

      prismaMock.soDRule.findMany.mockResolvedValue([]);
      prismaMock.soDViolation.findMany.mockResolvedValue(mockViolations);

      const result = await sodService.getAnalyticsDashboard('org-123');

      // 2 resolved (mitigated + remediated) out of 4 = 50%
      expect(result.resolutionRate).toBe(50);
    });
  });

  // ===========================================================================
  // Seed Default Rules Tests
  // ===========================================================================

  describe('seedDefaultRules()', () => {
    it('should seed default rules when no rules provided', async () => {
      prismaMock.soDRule.create.mockImplementation(async (args: any) => ({
        id: args.data.id,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const result = await sodService.seedDefaultRules('org-123', 'admin-123');

      expect(result.imported).toBe(8); // 8 default rule templates
      expect(result.rules).toHaveLength(8);
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'sod_rules.bulk_imported',
          metadata: { count: 8 },
        })
      );
    });

    it('should import custom rules when provided', async () => {
      const customRules = [
        { name: 'Custom Rule 1', ruleType: 'Toxic', function1: 'A', function2: 'B' },
        { name: 'Custom Rule 2', ruleType: 'Conflicting', function1: 'C', function2: 'D' },
      ];

      prismaMock.soDRule.create.mockImplementation(async (args: any) => ({
        id: args.data.id,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const result = await sodService.seedDefaultRules('org-123', 'admin-123', customRules);

      expect(result.imported).toBe(2);
    });
  });

  // ===========================================================================
  // Role Expansion Tests
  // ===========================================================================

  describe('expandUserRoles()', () => {
    it('should expand admin role to all permissions', () => {
      const permissions = sodService.expandUserRoles('admin');

      expect(permissions).toContain('Approve Purchase Orders');
      expect(permissions).toContain('Create Purchase Orders');
      expect(permissions).toContain('Process Payments');
      expect(permissions).toContain('Create Vendor Master');
    });

    it('should expand editor role to creation permissions', () => {
      const permissions = sodService.expandUserRoles('editor');

      expect(permissions).toContain('Create Purchase Orders');
      expect(permissions).toContain('Enter AP Invoice');
      expect(permissions).not.toContain('Approve Purchase Orders');
    });

    it('should expand viewer role to view only', () => {
      const permissions = sodService.expandUserRoles('viewer');

      expect(permissions).toEqual(['viewer']);
    });

    it('should return role as-is for unknown roles', () => {
      const permissions = sodService.expandUserRoles('custom_role');

      expect(permissions).toEqual(['custom_role']);
    });
  });

  describe('expandUserRolesAsync()', () => {
    it('should use custom mappings from organization when available', async () => {
      prismaMock.organization.findUnique.mockResolvedValue({
        id: 'org-123',
        usageMetrics: {
          sodRoleMappings: {
            custom_role: ['Permission A', 'Permission B'],
          },
        },
      });

      const permissions = await sodService.expandUserRolesAsync('custom_role', 'org-123');

      expect(permissions).toEqual(['Permission A', 'Permission B']);
    });

    it('should fall back to default mappings when no custom mapping', async () => {
      prismaMock.organization.findUnique.mockResolvedValue({
        id: 'org-123',
        usageMetrics: null,
      });

      const permissions = await sodService.expandUserRolesAsync('admin', 'org-123');

      expect(permissions).toContain('Approve Purchase Orders');
    });
  });

  // ===========================================================================
  // Compensating Controls Tests
  // ===========================================================================

  describe('Compensating Controls', () => {
    describe('getCompensatingControls()', () => {
      it('should return compensating controls from violation', async () => {
        const violation = createMockSoDViolation({
          compensatingControls: [
            { id: 'cc-1', name: 'Manager Review', controlType: 'Detective' },
          ],
        });
        prismaMock.soDViolation.findFirst.mockResolvedValue(violation);

        const controls = await sodService.getCompensatingControls('sod_viol_123', 'org-123');

        expect(controls).toHaveLength(1);
        expect(controls[0].name).toBe('Manager Review');
      });

      it('should throw error when violation not found', async () => {
        prismaMock.soDViolation.findFirst.mockResolvedValue(null);

        await expect(
          sodService.getCompensatingControls('non-existent', 'org-123')
        ).rejects.toThrow('Violation not found');
      });
    });

    describe('addCompensatingControl()', () => {
      it('should add compensating control to violation', async () => {
        const violation = createMockSoDViolation({ compensatingControls: null });
        prismaMock.soDViolation.findFirst.mockResolvedValue(violation);
        prismaMock.soDViolation.update.mockResolvedValue(violation);

        const control = await sodService.addCompensatingControl(
          'sod_viol_123',
          'admin-123',
          'org-123',
          {
            name: 'Monthly Audit Review',
            controlType: 'Detective',
            reviewFrequency: 'Monthly',
          }
        );

        expect(control.name).toBe('Monthly Audit Review');
        expect(control.id).toMatch(/^cc-/);
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'sod.compensating_control.added',
          })
        );
      });
    });

    describe('updateCompensatingControl()', () => {
      it('should update existing compensating control', async () => {
        const violation = createMockSoDViolation({
          compensatingControls: [
            { id: 'cc-1', name: 'Old Name', controlType: 'Detective' },
          ],
        });
        prismaMock.soDViolation.findFirst.mockResolvedValue(violation);
        prismaMock.soDViolation.update.mockResolvedValue(violation);

        const control = await sodService.updateCompensatingControl(
          'sod_viol_123',
          'cc-1',
          'admin-123',
          'org-123',
          { name: 'Updated Name' }
        );

        expect(control.name).toBe('Updated Name');
      });

      it('should throw error when control not found', async () => {
        const violation = createMockSoDViolation({
          compensatingControls: [],
        });
        prismaMock.soDViolation.findFirst.mockResolvedValue(violation);

        await expect(
          sodService.updateCompensatingControl(
            'sod_viol_123',
            'non-existent',
            'admin-123',
            'org-123',
            { name: 'Test' }
          )
        ).rejects.toThrow('Compensating control not found');
      });
    });

    describe('deleteCompensatingControl()', () => {
      it('should delete compensating control', async () => {
        const violation = createMockSoDViolation({
          compensatingControls: [
            { id: 'cc-1', name: 'Control 1' },
            { id: 'cc-2', name: 'Control 2' },
          ],
        });
        prismaMock.soDViolation.findFirst.mockResolvedValue(violation);
        prismaMock.soDViolation.update.mockResolvedValue(violation);

        const result = await sodService.deleteCompensatingControl(
          'sod_viol_123',
          'cc-1',
          'admin-123',
          'org-123'
        );

        expect(result.success).toBe(true);
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'sod.compensating_control.deleted',
          })
        );
      });
    });
  });
});
