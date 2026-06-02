/**
 * Security Controller Contract Tests
 *
 * Validates the contract for Zero Trust, Zero-Knowledge Proofs, BYOK,
 * Compliance-as-Code, and network segment endpoints.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

const mockZeroTrustService = {
  initialize: jest.fn<any>().mockResolvedValue(undefined as never),
  verifyDeviceTrust: jest.fn<any>().mockResolvedValue({ trusted: true, score: 90 } as never),
  evaluateAccessRequest: jest.fn<any>().mockResolvedValue({ allowed: true, reason: 'Policy compliant' } as never),
  createPolicy: jest.fn<any>().mockResolvedValue({ id: 'policy-1', name: 'Test Policy' } as never),
  getPolicies: jest.fn<any>().mockResolvedValue([{ id: 'policy-1', name: 'Test Policy' }] as never),
  generateDeviceFingerprint: jest.fn().mockReturnValue('fingerprint-abc'),
  getAllDeviceTrusts: jest.fn<any>().mockResolvedValue([{ deviceId: 'dev-1' }] as never),
  getDeviceTrust: jest.fn<any>().mockResolvedValue({ deviceId: 'dev-1', trusted: true } as never),
};

const mockZeroKnowledgeService = {};
const mockByokService = {};
const mockComplianceAsCodeService = {};

jest.mock('../../../services/advanced/zeroTrustService', () => ({
  __esModule: true,
  default: mockZeroTrustService,
}));

jest.mock('../../../services/advanced/zeroKnowledgeService', () => ({
  __esModule: true,
  default: mockZeroKnowledgeService,
}));

jest.mock('../../../services/advanced/byokService', () => ({
  __esModule: true,
  default: mockByokService,
}));

jest.mock('../../../services/advanced/complianceAsCodeService', () => ({
  __esModule: true,
  default: mockComplianceAsCodeService,
}));

import securityController from '../../../controllers/securityController';
import { AppError } from '../../../middleware/errorHandler';

describe('SecurityController Contract Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    // The shared prisma mock does not declare deleteMany on zeroTrustPolicy;
    // the controller's org-scoped delete uses it, so provide a local jest.fn.
    if (typeof (prismaMock.zeroTrustPolicy as any).deleteMany !== 'function') {
      (prismaMock.zeroTrustPolicy as any).deleteMany = jest.fn();
    }

    // Re-setup mock service implementations after clearAllMocks/resetMocks
    mockZeroTrustService.initialize.mockResolvedValue(undefined as never);
    mockZeroTrustService.verifyDeviceTrust.mockResolvedValue({ trusted: true, score: 90 } as never);
    mockZeroTrustService.evaluateAccessRequest.mockResolvedValue({ allowed: true, reason: 'Policy compliant' } as never);
    mockZeroTrustService.createPolicy.mockResolvedValue({ id: 'policy-1', name: 'Test Policy' } as never);
    mockZeroTrustService.getPolicies.mockResolvedValue([{ id: 'policy-1', name: 'Test Policy' }] as never);
    mockZeroTrustService.generateDeviceFingerprint.mockReturnValue('fingerprint-abc');
    mockZeroTrustService.getAllDeviceTrusts.mockResolvedValue([{ deviceId: 'dev-1' }] as never);
    mockZeroTrustService.getDeviceTrust.mockResolvedValue({ deviceId: 'dev-1', trusted: true } as never);

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
      },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
      socket: { remoteAddress: '127.0.0.1' },
    } as any;

    mockRes = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as unknown as NextFunction;
  });

  // ===========================================================================
  // Zero Trust - Device Trust
  // ===========================================================================
  describe('verifyDeviceTrust()', () => {
    it('should verify device trust and return result', async () => {
      mockReq.body = { deviceId: 'dev-1', deviceType: 'desktop' };

      await securityController.verifyDeviceTrust(mockReq as Request, mockRes as Response, mockNext);

      expect(mockZeroTrustService.initialize).toHaveBeenCalledWith('org-123');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ trusted: true, score: 90 })
      );
    });

    it('should throw 400 when deviceId is missing', async () => {
      mockReq.body = {};

      await expect(
        securityController.verifyDeviceTrust(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  // ===========================================================================
  // Zero Trust - Access Request
  // ===========================================================================
  describe('evaluateAccessRequest()', () => {
    it('should evaluate access and return decision', async () => {
      mockReq.body = { resourceId: 'res-1', deviceId: 'dev-1', action: 'read' };

      await securityController.evaluateAccessRequest(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ allowed: true })
      );
    });

    it('should throw 400 when required fields missing', async () => {
      mockReq.body = { resourceId: 'res-1' }; // missing deviceId and action

      await expect(
        securityController.evaluateAccessRequest(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  // ===========================================================================
  // Zero Trust - Policies
  // ===========================================================================
  describe('createZeroTrustPolicy()', () => {
    it('should create policy', async () => {
      mockReq.body = { name: 'Test Policy', rules: [] };

      await securityController.createZeroTrustPolicy(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'policy-1' })
      );
    });
  });

  describe('getZeroTrustPolicies()', () => {
    it('should return policies array', async () => {
      await securityController.getZeroTrustPolicies(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('getZeroTrustPolicy()', () => {
    it('should return single policy', async () => {
      mockReq.params = { policyId: 'policy-1' };

      await securityController.getZeroTrustPolicy(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'policy-1' })
      );
    });

    it('should throw 404 when policy not found', async () => {
      mockReq.params = { policyId: 'nonexistent' };

      await expect(
        securityController.getZeroTrustPolicy(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('updateZeroTrustPolicy()', () => {
    it('should update policy and write an audit log', async () => {
      mockReq.params = { policyId: 'policy-1' };
      mockReq.body = { name: 'Updated Policy' };

      // Controller org-scopes the lookup before mutating, then persists the
      // update and the audit log inside a $transaction.
      prismaMock.zeroTrustPolicy.findFirst.mockResolvedValue({
        id: 'policy-1',
        name: 'Test Policy',
        organizationId: 'org-123',
      } as never);
      prismaMock.zeroTrustPolicy.update.mockResolvedValue({
        id: 'policy-1',
        name: 'Updated Policy',
        organizationId: 'org-123',
        rules: JSON.stringify([]),
      } as never);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);
      (prismaMock.$transaction as jest.Mock<any>).mockImplementation(
        async (ops: any) => (Array.isArray(ops) ? Promise.all(ops) : ops)
      );

      await securityController.updateZeroTrustPolicy(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-123',
            userId: 'user-123',
          }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'policy-1', name: 'Updated Policy' })
      );
    });

    it('should throw 404 when policy not found for update', async () => {
      mockReq.params = { policyId: 'nonexistent' };
      // Org-scoped findFirst returns nothing (not found / cross-tenant).
      prismaMock.zeroTrustPolicy.findFirst.mockResolvedValue(null as never);

      await expect(
        securityController.updateZeroTrustPolicy(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
      expect(prismaMock.zeroTrustPolicy.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteZeroTrustPolicy()', () => {
    it('should delete policy and return success', async () => {
      mockReq.params = { policyId: 'policy-1' };

      // Controller performs an org-scoped deleteMany and checks the count.
      (prismaMock.zeroTrustPolicy as any).deleteMany.mockResolvedValue({ count: 1 } as never);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);

      await securityController.deleteZeroTrustPolicy(mockReq as Request, mockRes as Response, mockNext);

      expect((prismaMock.zeroTrustPolicy as any).deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'policy-1', organizationId: 'org-123' },
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should throw 404 when policy belongs to another organization', async () => {
      mockReq.params = { policyId: 'policy-other-org' };

      // Cross-tenant: org-scoped deleteMany removes nothing.
      (prismaMock.zeroTrustPolicy as any).deleteMany.mockResolvedValue({ count: 0 } as never);

      await expect(
        securityController.deleteZeroTrustPolicy(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  // ===========================================================================
  // Device Trust listing
  // ===========================================================================
  describe('getDeviceTrusts()', () => {
    it('should return device trusts', async () => {
      await securityController.getDeviceTrusts(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('getDeviceTrust()', () => {
    it('should return single device trust', async () => {
      mockReq.params = { deviceId: 'dev-1' };

      await securityController.getDeviceTrust(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ deviceId: 'dev-1' })
      );
    });

    it('should throw 404 when device not found', async () => {
      mockReq.params = { deviceId: 'dev-missing' };
      mockZeroTrustService.getDeviceTrust.mockResolvedValueOnce(null as never);

      await expect(
        securityController.getDeviceTrust(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  // ===========================================================================
  // Network Segments
  // ===========================================================================
  describe('createNetworkSegment()', () => {
    it('should persist a segment to the network segment store', async () => {
      mockReq.body = { name: 'DMZ', cidr: '10.0.0.0/24' };

      // Controller now persists to the dedicated networkSegment store, then
      // writes an audit log referencing the created row's id.
      prismaMock.networkSegment.create.mockResolvedValue({
        id: 'seg-1',
        organizationId: 'org-123',
        name: 'DMZ',
        cidr: '10.0.0.0/24',
        trustLevel: 'medium',
        resources: [],
        policies: [],
      } as never);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);

      await securityController.createNetworkSegment(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.networkSegment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-123',
            name: 'DMZ',
            cidr: '10.0.0.0/24',
          }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'DMZ',
          cidr: '10.0.0.0/24',
          organizationId: 'org-123',
        })
      );
    });

    it('should throw 400 when name or cidr is missing', async () => {
      mockReq.body = { name: 'DMZ' }; // missing cidr

      await expect(
        securityController.createNetworkSegment(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getNetworkSegments()', () => {
    it('should return org-scoped segments from the network segment store', async () => {
      prismaMock.networkSegment.findMany.mockResolvedValue([
        { id: 'seg-1', organizationId: 'org-123', name: 'DMZ', cidr: '10.0.0.0/24', policies: [] },
      ] as never);

      await securityController.getNetworkSegments(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.networkSegment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
          }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(expect.any(Array));
    });
  });
});
