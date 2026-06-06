/**
 * Risks Controller Unit Tests
 *
 * Comprehensive tests for risk management including CRUD operations,
 * AI prioritization, remediation generation, and automated scanning.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../services/geminiService', () => ({
  __esModule: true,
  default: {
    prioritizeRisks: jest.fn<any>().mockResolvedValue([
      { id: 'risk-1', score: 95, rationale: 'Critical vulnerability' },
    ] as never),
    generateRemediationPlan: jest.fn<any>().mockResolvedValue('# Remediation Plan\n\n1. Immediate actions...' as never),
  },
}));

import risksController from '../../../controllers/risksController';
import { AppError } from '../../../middleware/errorHandler';

// Mock data factories
const createMockRisk = (overrides: Record<string, unknown> = {}) => ({
  id: 'risk-123',
  title: 'Security Vulnerability',
  description: 'Critical security vulnerability found in API endpoint',
  severity: 'High',
  status: 'Open',
  category: 'Security',
  likelihood: 4,
  impact: 5,
  riskScore: 20,
  aiPriorityScore: null,
  aiRationale: null,
  mitigationPlan: null,
  assignedToId: null,
  assignedTo: null,
  organizationId: 'org-123',
  detectedAt: new Date(),
  resolvedAt: null,
  targetDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockFramework = (overrides: Record<string, unknown> = {}) => ({
  id: 'framework-123',
  name: 'SOC 2',
  status: 'In_Review',
  progress: 45,
  nextAuditDate: new Date('2025-12-31'),
  organizationId: 'org-123',
  controls: [],
  ...overrides,
});

const createMockControl = (overrides: Record<string, unknown> = {}) => ({
  id: 'control-123',
  name: 'Access Control',
  description: 'Test control',
  status: 'Pending',
  evidence: null,
  frameworkId: 'framework-123',
  ...overrides,
});

describe('RisksController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        organizationId: 'org-123',
      },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    } as any;

    mockResponse = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as unknown as NextFunction;
  });

  // ===========================================================================
  // List Tests
  // ===========================================================================
  describe('list()', () => {
    it('should list risks for organization', async () => {
      const mockRisks = [
        createMockRisk({ id: 'risk-1' }),
        createMockRisk({ id: 'risk-2', severity: 'Medium' }),
      ];

      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue(mockRisks as any);

      await risksController.list(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(mockRisks);
      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-123' },
        })
      );
    });

    it('should filter by status', async () => {
      mockRequest.query = { status: 'Open' };

      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);

      await risksController.list(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'Open',
          }),
        })
      );
    });

    it('should filter by severity', async () => {
      mockRequest.query = { severity: 'High' };

      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);

      await risksController.list(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            severity: 'High',
          }),
        })
      );
    });

    it('should filter by category', async () => {
      mockRequest.query = { category: 'Security' };

      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);

      await risksController.list(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'Security',
          }),
        })
      );
    });

    it('should filter by assigned user', async () => {
      mockRequest.query = { assignedTo: 'user-456' };

      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);

      await risksController.list(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignedToId: 'user-456',
          }),
        })
      );
    });

    it('should support search across title, description, and category', async () => {
      mockRequest.query = { search: 'vulnerability' };

      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);

      await risksController.list(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: 'vulnerability', mode: 'insensitive' } },
              { description: { contains: 'vulnerability', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should sort by severity descending by default', async () => {
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);

      await risksController.list(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.arrayContaining([{ severity: 'desc' }]),
        })
      );
    });

    it('should sort by custom field when specified', async () => {
      mockRequest.query = { sortBy: 'riskScore', sortOrder: 'asc' };

      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);

      await risksController.list(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ riskScore: 'asc' }],
        })
      );
    });

    it('should ignore All filter value', async () => {
      mockRequest.query = { status: 'All', severity: 'All' };

      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);

      await risksController.list(mockRequest as Request, mockResponse as Response, mockNext);

      const callArg = (prismaMock.riskItem.findMany as jest.Mock<any>).mock.calls[0][0];
      expect(callArg.where.status).toBeUndefined();
      expect(callArg.where.severity).toBeUndefined();
    });
  });

  // ===========================================================================
  // GetById Tests
  // ===========================================================================
  describe('getById()', () => {
    it('should get risk by ID', async () => {
      mockRequest.params = { id: 'risk-123' };
      const mockRisk = createMockRisk();

      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(mockRisk as any);

      await risksController.getById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(mockRisk);
    });

    it('should throw error if risk not found', async () => {
      mockRequest.params = { id: 'invalid-id' };

      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        risksController.getById(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Risk not found');
    });

    it('should include assigned user details', async () => {
      mockRequest.params = { id: 'risk-123' };
      const mockRisk = createMockRisk({
        assignedTo: { id: 'user-456', name: 'John Doe', email: 'john@example.com' },
      });

      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(mockRisk as any);

      await risksController.getById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            assignedTo: expect.any(Object),
          }),
        })
      );
    });
  });

  // ===========================================================================
  // Create Tests
  // ===========================================================================
  describe('create()', () => {
    it('should create risk with required fields', async () => {
      mockRequest.body = {
        title: 'Security Vulnerability',
        severity: 'High',
        description: 'Critical vulnerability found',
        category: 'Security',
      };

      const mockRisk = createMockRisk(mockRequest.body);

      (prismaMock.riskItem.create as jest.Mock<any>).mockResolvedValue(mockRisk as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await risksController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockRisk);
    });

    it('should calculate risk score from likelihood and impact', async () => {
      mockRequest.body = {
        severity: 'High',
        description: 'Test risk',
        category: 'Security',
        likelihood: 4,
        impact: 5,
      };

      const mockRisk = createMockRisk({ ...mockRequest.body, riskScore: 20 });

      (prismaMock.riskItem.create as jest.Mock<any>).mockResolvedValue(mockRisk as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await risksController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            likelihood: 4,
            impact: 5,
            riskScore: 20,
          }),
        })
      );
    });

    it('should use default likelihood and impact when not provided', async () => {
      mockRequest.body = {
        severity: 'Medium',
        description: 'Test risk',
        category: 'Compliance',
      };

      (prismaMock.riskItem.create as jest.Mock<any>).mockResolvedValue(createMockRisk() as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await risksController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            likelihood: 3,
            impact: 3,
            riskScore: 9,
          }),
        })
      );
    });

    it('should generate title from description if not provided', async () => {
      const longDescription = 'A'.repeat(150);
      mockRequest.body = {
        severity: 'Low',
        description: longDescription,
        category: 'Operational',
      };

      (prismaMock.riskItem.create as jest.Mock<any>).mockResolvedValue(createMockRisk() as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await risksController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: longDescription.substring(0, 100),
          }),
        })
      );
    });

    it('should throw error if required fields missing', async () => {
      mockRequest.body = { title: 'Risk' };

      await expect(
        risksController.create(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Severity, description, and category are required');
    });

    it('should create audit log entry', async () => {
      mockRequest.body = {
        severity: 'High',
        description: 'Test risk',
        category: 'Security',
      };

      (prismaMock.riskItem.create as jest.Mock<any>).mockResolvedValue(createMockRisk() as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await risksController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: expect.stringContaining('created'),
            userId: 'user-123',
            organizationId: 'org-123',
          }),
        })
      );
    });
  });

  // ===========================================================================
  // Update Tests
  // ===========================================================================
  describe('update()', () => {
    it('should update risk', async () => {
      mockRequest.params = { id: 'risk-123' };
      mockRequest.body = { status: 'In_Progress', severity: 'Critical' };

      const existingRisk = createMockRisk();
      const updatedRisk = { ...existingRisk, status: 'In_Progress', severity: 'Critical' };

      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(existingRisk as any);
      (prismaMock.riskItem.update as jest.Mock<any>).mockResolvedValue(updatedRisk as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await risksController.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(updatedRisk);
    });

    it('should map status from In Progress to In_Progress', async () => {
      mockRequest.params = { id: 'risk-123' };
      mockRequest.body = { status: 'In Progress' };

      const existingRisk = createMockRisk();

      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(existingRisk as any);
      (prismaMock.riskItem.update as jest.Mock<any>).mockResolvedValue(existingRisk as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await risksController.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'In_Progress',
          }),
        })
      );
    });

    it('should set resolvedAt when status changes to Resolved', async () => {
      mockRequest.params = { id: 'risk-123' };
      mockRequest.body = { status: 'Resolved' };

      const existingRisk = createMockRisk({ resolvedAt: null });

      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(existingRisk as any);
      (prismaMock.riskItem.update as jest.Mock<any>).mockResolvedValue({ ...existingRisk, status: 'Resolved' } as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await risksController.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resolvedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should allow clearing mitigation plan', async () => {
      mockRequest.params = { id: 'risk-123' };
      mockRequest.body = { mitigationPlan: '' };

      const existingRisk = createMockRisk({ mitigationPlan: 'Old plan' });

      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(existingRisk as any);
      (prismaMock.riskItem.update as jest.Mock<any>).mockResolvedValue({ ...existingRisk, mitigationPlan: null } as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await risksController.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mitigationPlan: null,
          }),
        })
      );
    });

    it('should throw error if risk not found', async () => {
      mockRequest.params = { id: 'invalid-id' };
      mockRequest.body = { status: 'Resolved' };

      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        risksController.update(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Risk not found');
    });
  });

  // ===========================================================================
  // Delete Tests
  // ===========================================================================
  describe('delete()', () => {
    it('should delete risk', async () => {
      mockRequest.params = { id: 'risk-123' };

      const mockRisk = createMockRisk();

      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(mockRisk as any);
      (prismaMock.riskItem.delete as jest.Mock<any>).mockResolvedValue(mockRisk as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await risksController.delete(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Risk deleted successfully' });
    });

    it('should throw error if risk not found', async () => {
      mockRequest.params = { id: 'invalid-id' };

      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        risksController.delete(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Risk not found');
    });
  });

  // ===========================================================================
  // AI Prioritization Tests
  // ===========================================================================
  describe('prioritize()', () => {
    it('should prioritize risks using AI', async () => {
      const risks = [
        createMockRisk({ id: 'risk-1', description: 'Risk 1' }),
        createMockRisk({ id: 'risk-2', description: 'Risk 2' }),
      ];

      const prioritized = [
        { id: 'risk-1', score: 95, rationale: 'Critical' },
        { id: 'risk-2', score: 75, rationale: 'Important' },
      ];

      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue(risks as any);
      (prismaMock.riskItem.update as jest.Mock<any>).mockResolvedValue({} as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      const geminiService = require('../../../services/geminiService').default;
      (geminiService.prioritizeRisks as jest.Mock<any>).mockResolvedValue(prioritized as any);

      await risksController.prioritize(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(prioritized);
    });

    it('should return empty array when no risks exist', async () => {
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);

      await risksController.prioritize(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it('should exclude resolved risks from prioritization', async () => {
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([]);

      await risksController.prioritize(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { not: 'Resolved' },
          }),
        })
      );
    });

    it('should update risks with AI scores', async () => {
      const risks = [createMockRisk({ id: 'risk-1' })];
      const prioritized = [{ id: 'risk-1', score: 95, rationale: 'Critical' }];

      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue(risks as any);
      (prismaMock.riskItem.updateMany as jest.Mock<any>).mockResolvedValue({ count: 1 } as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      const geminiService = require('../../../services/geminiService').default;
      (geminiService.prioritizeRisks as jest.Mock<any>).mockResolvedValue(prioritized as any);

      await risksController.prioritize(mockRequest as Request, mockResponse as Response, mockNext);

      // Writes are now org-scoped via updateMany({ where: { id, organizationId } })
      // so an AI-returned id cannot be written outside the caller's organization.
      expect(prismaMock.riskItem.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'risk-1', organizationId: 'org-123' },
          data: {
            aiPriorityScore: 95,
            aiRationale: 'Critical',
          },
        })
      );
    });

    it('should not write AI scores for ids outside the caller organization', async () => {
      // Only risk-1 belongs to org-123; the AI also returns a foreign id.
      const risks = [createMockRisk({ id: 'risk-1' })];
      const prioritized = [
        { id: 'risk-1', score: 95, rationale: 'Critical' },
        { id: 'cross-org-risk', score: 99, rationale: 'Injected' },
      ];

      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue(risks as any);
      (prismaMock.riskItem.updateMany as jest.Mock<any>).mockResolvedValue({ count: 1 } as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      const geminiService = require('../../../services/geminiService').default;
      (geminiService.prioritizeRisks as jest.Mock<any>).mockResolvedValue(prioritized as any);

      await risksController.prioritize(mockRequest as Request, mockResponse as Response, mockNext);

      // The owned risk is written, org-scoped.
      expect(prismaMock.riskItem.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'risk-1', organizationId: 'org-123' },
        })
      );
      // The foreign id is never written at all (guarded before the DB call).
      expect(prismaMock.riskItem.updateMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.riskItem.updateMany).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'cross-org-risk', organizationId: 'org-123' } })
      );
    });
  });

  // ===========================================================================
  // Remediation Generation Tests
  // ===========================================================================
  describe('generateRemediation()', () => {
    it('should generate remediation plan for risk', async () => {
      mockRequest.params = { id: 'risk-123' };

      const mockRisk = createMockRisk();
      const plan = '# Remediation Plan\n\n1. Step one...';

      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(mockRisk as any);
      (prismaMock.riskItem.update as jest.Mock<any>).mockResolvedValue({ ...mockRisk, mitigationPlan: plan } as any);

      const geminiService = require('../../../services/geminiService').default;
      (geminiService.generateRemediationPlan as jest.Mock<any>).mockResolvedValue(plan as any);

      await risksController.generateRemediation(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({ plan });
    });

    it('should throw error if risk not found', async () => {
      mockRequest.params = { id: 'invalid-id' };

      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        risksController.generateRemediation(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Risk not found');
    });

    it('should save generated plan to risk', async () => {
      mockRequest.params = { id: 'risk-123' };

      const mockRisk = createMockRisk();
      const plan = '# Remediation Plan';

      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(mockRisk as any);
      (prismaMock.riskItem.update as jest.Mock<any>).mockResolvedValue({} as any);

      const geminiService = require('../../../services/geminiService').default;
      (geminiService.generateRemediationPlan as jest.Mock<any>).mockResolvedValue(plan as any);

      await risksController.generateRemediation(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'risk-123' },
          data: { mitigationPlan: plan },
        })
      );
    });
  });

  // ===========================================================================
  // Risk Scan Tests
  // ===========================================================================
  describe('scan()', () => {
    it('should scan for new risks and create them', async () => {
      const mockFramework = createMockFramework({
        controls: [
          createMockControl({ status: 'At Risk', name: 'Access Control' }),
        ],
      });

      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([mockFramework] as any);
      (prismaMock.integration.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.riskItem.create as jest.Mock<any>).mockResolvedValue(createMockRisk() as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await risksController.scan(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Risk scan completed',
          newRisks: expect.any(Array),
        })
      );
    });

    it('should detect overdue audit dates', async () => {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 60); // 60 days ago

      const mockFramework = createMockFramework({
        nextAuditDate: overdueDate,
        controls: [],
      });

      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([mockFramework] as any);
      (prismaMock.integration.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.riskItem.create as jest.Mock<any>).mockResolvedValue(createMockRisk({ severity: 'High' }) as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await risksController.scan(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: expect.stringContaining('Overdue Audit'),
            severity: 'High',
          }),
        })
      );
    });

    it('should detect stale integrations', async () => {
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - 10); // 10 days ago

      const staleIntegration = {
        id: 'int-123',
        provider: 'AWS',
        name: 'AWS Integration',
        connected: true,
        lastSync: staleDate,
      };

      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.integration.findMany as jest.Mock<any>).mockResolvedValue([staleIntegration]);
      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.riskItem.create as jest.Mock<any>).mockResolvedValue(createMockRisk() as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await risksController.scan(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: expect.stringContaining('Stale Integration'),
            category: 'Integration',
          }),
        })
      );
    });

    it('should detect low compliance scores', async () => {
      const mockFramework = createMockFramework({
        progress: 20,
        status: 'At_Risk',
        controls: [],
      });

      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([mockFramework] as any);
      (prismaMock.integration.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(null);
      (prismaMock.riskItem.create as jest.Mock<any>).mockResolvedValue(createMockRisk() as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await risksController.scan(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: expect.stringContaining('Low Compliance Score'),
            severity: 'High',
          }),
        })
      );
    });

    it('should not create duplicate risks', async () => {
      const mockFramework = createMockFramework({
        controls: [createMockControl({ status: 'At Risk' })],
      });

      const existingRisk = createMockRisk();

      (prismaMock.complianceFramework.findMany as jest.Mock<any>).mockResolvedValue([mockFramework] as any);
      (prismaMock.integration.findMany as jest.Mock<any>).mockResolvedValue([]);
      (prismaMock.riskItem.findFirst as jest.Mock<any>).mockResolvedValue(existingRisk); // Risk already exists
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await risksController.scan(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.create).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================
  describe('Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      (prismaMock.riskItem.findMany as jest.Mock<any>).mockRejectedValue(new Error('DB connection failed'));

      await expect(
        risksController.list(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Failed to fetch risks');
    });

    it('should handle AI service errors gracefully', async () => {
      const geminiService = require('../../../services/geminiService').default;
      (geminiService.prioritizeRisks as jest.Mock<any>).mockRejectedValue(new Error('AI service unavailable'));

      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([createMockRisk()]);

      await expect(
        risksController.prioritize(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow('Failed to prioritize risks');
    });
  });
});
