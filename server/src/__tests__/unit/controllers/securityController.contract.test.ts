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
    it('should update policy via audit log', async () => {
      mockReq.params = { policyId: 'policy-1' };
      mockReq.body = { name: 'Updated Policy' };

      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);

      await securityController.updateZeroTrustPolicy(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-123',
            userId: 'user-123',
          }),
        })
      );
    });

    it('should throw 404 when policy not found for update', async () => {
      mockReq.params = { policyId: 'nonexistent' };
      mockZeroTrustService.getPolicies.mockResolvedValueOnce([] as never);

      await expect(
        securityController.updateZeroTrustPolicy(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('deleteZeroTrustPolicy()', () => {
    it('should delete policy and return success', async () => {
      mockReq.params = { policyId: 'policy-1' };

      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);

      await securityController.deleteZeroTrustPolicy(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
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
    it('should create segment via audit log', async () => {
      mockReq.body = { name: 'DMZ', cidr: '10.0.0.0/24' };

      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as never);

      await securityController.createNetworkSegment(mockReq as Request, mockRes as Response, mockNext);

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
    it('should return segments from audit logs', async () => {
      (prismaMock.auditLog.findMany as jest.Mock<any>).mockResolvedValue([
        { hash: 'seg-1', details: JSON.stringify({ id: 'seg-1', name: 'DMZ' }), timestamp: new Date() },
      ] as never);

      await securityController.getNetworkSegments(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
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
