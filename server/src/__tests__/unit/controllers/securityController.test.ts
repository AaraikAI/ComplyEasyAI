/**
 * Security Controller Unit Tests
 * Tests for Zero Trust, Zero-Knowledge Proofs, BYOK, and Compliance-as-Code features
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock Zero Trust Service
const mockZeroTrustInitialize = jest.fn();
const mockVerifyDeviceTrust = jest.fn();
const mockEvaluateAccessRequest = jest.fn();
const mockCreatePolicy = jest.fn();
const mockGetPolicies = jest.fn();
const mockGetAllDeviceTrusts = jest.fn();
const mockGetDeviceTrust = jest.fn();
const mockContinuousVerification = jest.fn();
const mockGenerateDeviceFingerprint = jest.fn();

jest.mock('../../../services/advanced/zeroTrustService', () => ({
  __esModule: true,
  default: {
    initialize: mockZeroTrustInitialize,
    verifyDeviceTrust: mockVerifyDeviceTrust,
    evaluateAccessRequest: mockEvaluateAccessRequest,
    createPolicy: mockCreatePolicy,
    getPolicies: mockGetPolicies,
    getAllDeviceTrusts: mockGetAllDeviceTrusts,
    getDeviceTrust: mockGetDeviceTrust,
    continuousVerification: mockContinuousVerification,
    generateDeviceFingerprint: mockGenerateDeviceFingerprint,
  },
}));

// Mock Zero Knowledge Service
const mockGenerateComplianceProof = jest.fn();
const mockVerifyComplianceProof = jest.fn();
const mockGenerateCredentialProof = jest.fn();
const mockVerifyCredentialProof = jest.fn();
const mockGenerateOwnershipProof = jest.fn();
const mockVerifyOwnershipProof = jest.fn();
const mockGetAllProofs = jest.fn();

jest.mock('../../../services/advanced/zeroKnowledgeService', () => ({
  __esModule: true,
  default: {
    generateComplianceProof: mockGenerateComplianceProof,
    verifyComplianceProof: mockVerifyComplianceProof,
    generateCredentialProof: mockGenerateCredentialProof,
    verifyCredentialProof: mockVerifyCredentialProof,
    generateOwnershipProof: mockGenerateOwnershipProof,
    verifyOwnershipProof: mockVerifyOwnershipProof,
    getAllProofs: mockGetAllProofs,
  },
}));

// Mock BYOK Service
const mockGenerateKey = jest.fn();
const mockImportKey = jest.fn();
const mockRotateKey = jest.fn();
const mockRevokeKey = jest.fn();
const mockGetKeyStatus = jest.fn();
const mockEncrypt = jest.fn();
const mockDecrypt = jest.fn();

jest.mock('../../../services/advanced/byokService', () => ({
  __esModule: true,
  default: {
    generateKey: mockGenerateKey,
    importKey: mockImportKey,
    rotateKey: mockRotateKey,
    revokeKey: mockRevokeKey,
    getKeyStatus: mockGetKeyStatus,
    encrypt: mockEncrypt,
    decrypt: mockDecrypt,
  },
}));

// Mock Compliance-as-Code Service
const mockLoadPolicyBundle = jest.fn();
const mockEvaluatePolicies = jest.fn();
const mockGenerateRules = jest.fn();
const mockExportOPARego = jest.fn();
const mockGenerateComplianceReport = jest.fn();

jest.mock('../../../services/advanced/complianceAsCodeService', () => ({
  __esModule: true,
  default: {
    loadPolicyBundle: mockLoadPolicyBundle,
    evaluatePolicies: mockEvaluatePolicies,
    generateRulesFromFramework: mockGenerateRules,
    exportToOPARego: mockExportOPARego,
    generateComplianceReport: mockGenerateComplianceReport,
  },
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

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import securityController from '../../../controllers/securityController';
import { AppError } from '../../../middleware/errorHandler';

describe('SecurityController', () => {
  let mockRequest: any;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {},
      headers: {},
      params: {},
      query: {},
      ip: '192.168.1.1',
      socket: { remoteAddress: '192.168.1.1' } as any,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
      },
    };

    mockResponse = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };
  });

  const mockNext = jest.fn() as any;

  // ==================== Zero Trust Security Tests ====================

  describe('Zero Trust Security', () => {
    describe('verifyDeviceTrust()', () => {
      it('should verify device trust successfully', async () => {
        mockRequest.body = {
          deviceId: 'device-123',
          deviceType: 'laptop',
          macAddress: '00:11:22:33:44:55',
          ipAddress: '192.168.1.100',
        };

        (mockZeroTrustInitialize as any).mockResolvedValue(undefined);
        (mockGenerateDeviceFingerprint as any).mockReturnValue('fingerprint-123');
        (mockVerifyDeviceTrust as any).mockResolvedValue({
          trusted: true,
          trustScore: 95,
          deviceId: 'device-123',
        });

        await securityController.verifyDeviceTrust(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            trusted: true,
            trustScore: 95,
          })
        );
      });

      it('should throw error if device ID is missing', async () => {
        mockRequest.body = {};

        await expect(
          securityController.verifyDeviceTrust(mockRequest as Request, mockResponse as Response, mockNext)
        ).rejects.toThrow(AppError);
      });

      it('should use provided fingerprint if available', async () => {
        mockRequest.body = {
          deviceId: 'device-123',
          fingerprint: 'custom-fingerprint',
        };

        (mockZeroTrustInitialize as any).mockResolvedValue(undefined);
        (mockVerifyDeviceTrust as any).mockResolvedValue({
          trusted: true,
          trustScore: 90,
        });

        await securityController.verifyDeviceTrust(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockVerifyDeviceTrust).toHaveBeenCalledWith(
          'device-123',
          'custom-fingerprint',
          expect.any(Object),
          'org-123'
        );
      });
    });

    describe('evaluateAccessRequest()', () => {
      it('should evaluate access request', async () => {
        mockRequest.body = {
          resourceId: 'resource-123',
          deviceId: 'device-123',
          action: 'read',
          context: { department: 'engineering' },
        };

        (mockZeroTrustInitialize as any).mockResolvedValue(undefined);
        (mockEvaluateAccessRequest as any).mockResolvedValue({
          allowed: true,
          reason: 'Access granted based on policy',
        });

        await securityController.evaluateAccessRequest(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            allowed: true,
          })
        );
      });

      it('should throw error if required fields missing', async () => {
        mockRequest.body = { resourceId: 'resource-123' };

        await expect(
          securityController.evaluateAccessRequest(mockRequest as Request, mockResponse as Response, mockNext)
        ).rejects.toThrow(AppError);
      });
    });

    describe('createZeroTrustPolicy()', () => {
      it('should create Zero Trust policy', async () => {
        mockRequest.body = {
          name: 'Engineering Policy',
          conditions: { department: 'engineering' },
          actions: ['read', 'write'],
        };

        (mockCreatePolicy as any).mockResolvedValue({
          id: 'policy-123',
          name: 'Engineering Policy',
          enabled: true,
        });

        await securityController.createZeroTrustPolicy(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'policy-123',
            name: 'Engineering Policy',
          })
        );
      });
    });

    describe('getZeroTrustPolicies()', () => {
      it('should return all Zero Trust policies', async () => {
        (mockGetPolicies as any).mockResolvedValue([
          { id: 'policy-1', name: 'Policy 1' },
          { id: 'policy-2', name: 'Policy 2' },
        ]);

        await securityController.getZeroTrustPolicies(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: 'policy-1' }),
          ])
        );
      });
    });

    describe('getZeroTrustPolicy()', () => {
      it('should return specific policy', async () => {
        mockRequest.params = { policyId: 'policy-123' };

        (mockGetPolicies as any).mockResolvedValue([
          { id: 'policy-123', name: 'Test Policy' },
        ]);

        await securityController.getZeroTrustPolicy(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'policy-123' })
        );
      });

      it('should throw error if policy not found', async () => {
        mockRequest.params = { policyId: 'nonexistent' };
        (mockGetPolicies as any).mockResolvedValue([]);

        await expect(
          securityController.getZeroTrustPolicy(mockRequest as Request, mockResponse as Response, mockNext)
        ).rejects.toThrow(AppError);
      });
    });

    describe('updateZeroTrustPolicy()', () => {
      it('should update policy', async () => {
        mockRequest.params = { policyId: 'policy-123' };
        mockRequest.body = { name: 'Updated Policy' };

        (mockGetPolicies as any).mockResolvedValue([
          { id: 'policy-123', name: 'Original Policy', enabled: true },
        ]);
        prismaMock.auditLog.create.mockResolvedValue({} as any);

        await securityController.updateZeroTrustPolicy(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'policy-123', name: 'Updated Policy' })
        );
      });
    });

    describe('deleteZeroTrustPolicy()', () => {
      it('should delete policy', async () => {
        mockRequest.params = { policyId: 'policy-123' };

        (mockGetPolicies as any).mockResolvedValue([
          { id: 'policy-123', name: 'Test Policy' },
        ]);
        prismaMock.auditLog.create.mockResolvedValue({} as any);

        await securityController.deleteZeroTrustPolicy(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({ success: true })
        );
      });
    });

    describe('getDeviceTrusts()', () => {
      it('should return all device trusts', async () => {
        (mockZeroTrustInitialize as any).mockResolvedValue(undefined);
        (mockGetAllDeviceTrusts as any).mockResolvedValue([
          { deviceId: 'device-1', trusted: true },
          { deviceId: 'device-2', trusted: false },
        ]);

        await securityController.getDeviceTrusts(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ deviceId: 'device-1' }),
          ])
        );
      });
    });

    describe('getDeviceTrust()', () => {
      it('should return device trust', async () => {
        mockRequest.params = { deviceId: 'device-123' };

        (mockGetDeviceTrust as any).mockResolvedValue({
          deviceId: 'device-123',
          trusted: true,
          trustScore: 90,
        });

        await securityController.getDeviceTrust(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({ deviceId: 'device-123' })
        );
      });

      it('should throw error if device trust not found', async () => {
        mockRequest.params = { deviceId: 'nonexistent' };
        (mockGetDeviceTrust as any).mockResolvedValue(null);

        await expect(
          securityController.getDeviceTrust(mockRequest as Request, mockResponse as Response, mockNext)
        ).rejects.toThrow(AppError);
      });
    });

    describe('continuousVerification()', () => {
      it('should perform continuous verification', async () => {
        mockRequest.body = { deviceId: 'device-123' };

        (mockContinuousVerification as any).mockResolvedValue(true);

        await securityController.continuousVerification(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith({ isTrusted: true });
      });
    });
  });

  // ==================== Zero-Knowledge Proofs Tests ====================

  describe('Zero-Knowledge Proofs', () => {
    describe('generateComplianceProof()', () => {
      it('should generate compliance proof', async () => {
        mockRequest.body = {
          frameworkId: 'soc2',
          privateData: {
            controlsImplemented: 80,
            totalControls: 100,
          },
        };

        (mockGenerateComplianceProof as any).mockResolvedValue({
          proof: 'proof-data',
          publicSignals: ['signal-1', 'signal-2'],
        });
        (prismaMock.auditLog.create as any).mockResolvedValue({} as any);

        await securityController.generateComplianceProof(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            proof: 'proof-data',
            frameworkId: 'soc2',
            proofType: 'compliance',
          })
        );
      });

      it('should throw error if required fields missing', async () => {
        mockRequest.body = { frameworkId: 'soc2' };

        await expect(
          securityController.generateComplianceProof(mockRequest as Request, mockResponse as Response, mockNext)
        ).rejects.toThrow(AppError);
      });
    });

    describe('verifyComplianceProof()', () => {
      it('should verify compliance proof', async () => {
        mockRequest.body = {
          proof: { proof: 'proof-data', publicSignals: [] },
        };

        (mockVerifyComplianceProof as any).mockResolvedValue(true);

        await securityController.verifyComplianceProof(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith({ isValid: true });
      });

      it('should throw error if proof missing', async () => {
        mockRequest.body = {};

        await expect(
          securityController.verifyComplianceProof(mockRequest as Request, mockResponse as Response, mockNext)
        ).rejects.toThrow(AppError);
      });
    });

    describe('generateCredentialProof()', () => {
      it('should generate credential proof', async () => {
        mockRequest.body = {
          credential: {
            type: 'admin',
            issuer: 'ComplyEasyAI',
            expirationDate: '2027-01-01',
          },
          secret: 'secret-123',
        };

        (mockGenerateCredentialProof as any).mockResolvedValue({
          proof: 'credential-proof',
          publicSignals: ['signal'],
        });
        (prismaMock.auditLog.create as any).mockResolvedValue({} as any);

        await securityController.generateCredentialProof(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            proof: expect.any(Object),
            credentialType: 'admin',
            isValid: true,
          })
        );
      });

      it('should throw error if credential or secret missing', async () => {
        mockRequest.body = { credential: {} };

        await expect(
          securityController.generateCredentialProof(mockRequest as Request, mockResponse as Response, mockNext)
        ).rejects.toThrow(AppError);
      });
    });

    describe('verifyCredentialProof()', () => {
      it('should verify credential proof', async () => {
        mockRequest.body = {
          proof: { proof: 'data' },
          requiredLevel: 2,
        };

        (mockVerifyCredentialProof as any).mockResolvedValue(true);

        await securityController.verifyCredentialProof(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith({ isValid: true });
      });
    });

    describe('generateOwnershipProof()', () => {
      it('should generate ownership proof', async () => {
        mockRequest.body = {
          dataHash: 'hash-123',
          secret: 'secret-456',
          assetId: 'asset-123',
          assetType: 'document',
        };

        (mockGenerateOwnershipProof as any).mockResolvedValue({
          proof: 'ownership-proof',
          publicSignals: ['signal'],
        });
        (prismaMock.auditLog.create as any).mockResolvedValue({} as any);

        await securityController.generateOwnershipProof(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            proofType: 'ownership',
            dataHash: 'hash-123',
          })
        );
      });

      it('should throw error if required fields missing', async () => {
        mockRequest.body = { dataHash: 'hash-123' };

        await expect(
          securityController.generateOwnershipProof(mockRequest as Request, mockResponse as Response, mockNext)
        ).rejects.toThrow(AppError);
      });
    });

    describe('verifyOwnershipProof()', () => {
      it('should verify ownership proof', async () => {
        mockRequest.body = {
          proof: { proof: 'data' },
          dataHash: 'hash-123',
        };

        (mockVerifyOwnershipProof as any).mockResolvedValue(true);

        await securityController.verifyOwnershipProof(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith({ isValid: true });
      });

      it('should throw error if proof or dataHash missing', async () => {
        mockRequest.body = { proof: {} };

        await expect(
          securityController.verifyOwnershipProof(mockRequest as Request, mockResponse as Response, mockNext)
        ).rejects.toThrow(AppError);
      });
    });

    describe('getZKProofs()', () => {
      it('should return all ZK proofs', async () => {
        (mockGetAllProofs as any).mockResolvedValue([
          { id: 'proof-1', type: 'compliance' },
          { id: 'proof-2', type: 'credential' },
        ]);

        await securityController.getZKProofs(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: 'proof-1' }),
          ])
        );
      });
    });

    describe('getZKProof()', () => {
      it('should return specific proof', async () => {
        mockRequest.params = { proofId: 'proof-123' };

        prismaMock.auditLog.findFirst.mockResolvedValue({
          id: 'log-1',
          hash: 'proof-123',
          action: 'ZK Proof Generated: compliance',
          details: JSON.stringify({ type: 'compliance', verified: true }),
          timestamp: new Date(),
          organizationId: 'org-123',
          userId: 'user-123',
        } as any);

        await securityController.getZKProof(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'proof-123' })
        );
      });
    });
  });

  // ==================== BYOK Tests ====================
  // Note: These tests verify the controller methods exist and handle errors properly
  // Full integration testing requires running services

  describe('BYOK (Bring Your Own Key)', () => {
    describe('getBYOKConfig()', () => {
      it('should return BYOK configuration', async () => {
        await securityController.getBYOKConfig(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalled();
      });
    });
  });

  // ==================== Compliance-as-Code Tests ====================

  describe('Compliance-as-Code', () => {
    describe('evaluateCompliancePolicy()', () => {
      it('should throw error if policy ID missing', async () => {
        mockRequest.params = {};
        mockRequest.body = {
          input: { user: 'user-123', action: 'read' },
        };

        await expect(
          securityController.evaluateCompliancePolicy(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
          )
        ).rejects.toThrow();
      });
    });

    describe('generateComplianceReport()', () => {
      it('should default to SOC2 framework when not provided', async () => {
        mockRequest.body = {
          options: { format: 'pdf' },
        };
        const mockReport = { id: 'report-1', framework: 'SOC2', score: 90 };
        (mockGenerateComplianceReport as any).mockResolvedValue(mockReport);

        await securityController.generateComplianceReport(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockGenerateComplianceReport).toHaveBeenCalledWith('org-123', 'SOC2');
        expect(mockResponse.json).toHaveBeenCalledWith(mockReport);
      });
    });

    describe('getComplianceReports()', () => {
      it('should return all compliance reports', async () => {
        (mockGenerateComplianceReport as any).mockResolvedValue({
          framework: 'SOC2',
          score: 85,
          controls: [],
        });

        await securityController.getComplianceReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalled();
      });
    });

    describe('getCICDIntegrations()', () => {
      it('should return CI/CD integrations', async () => {
        prismaMock.auditLog.findMany.mockResolvedValue([
          {
            id: 'log-1',
            action: 'CI/CD Integration Created',
            details: JSON.stringify({ provider: 'github', webhookUrl: 'https://example.com' }),
            hash: 'int-1',
            timestamp: new Date(),
            organizationId: 'org-123',
            userId: 'user-123',
          } as any,
        ]);

        await securityController.getCICDIntegrations(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.json).toHaveBeenCalled();
      });
    });
  });
});
