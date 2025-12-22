/**
 * Trust Center Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn().mockResolvedValue({}),
  },
}));

import { TrustCenterService } from '../../../services/trustCenterService';

describe('TrustCenterService', () => {
  let service: TrustCenterService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TrustCenterService();
  });

  describe('createCertificate()', () => {
    it('should create trust certificate', async () => {
      const data = {
        organizationId: 'org-123',
        certificateType: 'SOC 2 Type II',
        issuer: 'Audit Firm',
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        userId: 'user-123',
      };

      const mockCertificate = {
        id: 'cert-123',
        ...data,
        status: 'Valid',
        publiclyVisible: true,
      };

      prismaMock.trustCertificate.create.mockResolvedValue(mockCertificate as any);

      const result = await service.createCertificate(data);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status', 'Valid');
    });
  });

  describe('getPublicTrustCenter()', () => {
    it('should get public trust center data', async () => {
      const organizationId = 'org-123';

      prismaMock.organization.findUnique.mockResolvedValue({
        id: organizationId,
        name: 'Test Org',
      } as any);
      prismaMock.trustCertificate.findMany.mockResolvedValue([
        { id: 'cert-1', certificateType: 'SOC 2', status: 'Valid' },
      ] as any);
      prismaMock.complianceFramework.findMany.mockResolvedValue([
        { id: 'framework-1', name: 'SOC 2', status: 'In_Progress' },
      ] as any);

      const result = await service.getPublicTrustCenter(organizationId);

      expect(result).toHaveProperty('organization');
      expect(result).toHaveProperty('certificates');
      expect(result).toHaveProperty('frameworks');
    });

    it('should throw error if organization not found', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);

      await expect(service.getPublicTrustCenter('invalid-id')).rejects.toThrow(
        'Organization not found'
      );
    });
  });
});

