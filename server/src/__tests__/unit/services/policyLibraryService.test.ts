/**
 * Policy Library Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn().mockResolvedValue({}),
  },
}));

import { PolicyLibraryService } from '../../../services/policyLibraryService';

describe('PolicyLibraryService', () => {
  let service: PolicyLibraryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PolicyLibraryService();
  });

  describe('createPolicy()', () => {
    it('should create policy', async () => {
      const data = {
        organizationId: 'org-123',
        title: 'Security Policy',
        category: 'Security',
        content: 'Policy content...',
        userId: 'user-123',
      };

      const mockPolicy = {
        id: 'policy-123',
        ...data,
        version: '1.0',
        status: 'Draft',
      };

      prismaMock.policy.create.mockResolvedValue(mockPolicy as any);

      const result = await service.createPolicy(data);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title', data.title);
      expect(prismaMock.policy.create).toHaveBeenCalled();
    });

    it('should set default version and status', async () => {
      const data = {
        organizationId: 'org-123',
        title: 'Test Policy',
        category: 'Test',
        content: 'Content',
        userId: 'user-123',
      };

      prismaMock.policy.create.mockResolvedValue({} as any);

      await service.createPolicy(data);

      expect(prismaMock.policy.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: '1.0',
            status: 'Draft',
          }),
        })
      );
    });
  });

  describe('bulkImportPolicies()', () => {
    it('should import multiple policies', async () => {
      const policies = [
        { title: 'Policy 1', category: 'Security', content: 'Content 1' },
        { title: 'Policy 2', category: 'Privacy', content: 'Content 2' },
      ];

      prismaMock.policy.create.mockResolvedValue({ id: 'policy-123' } as any);

      const result = await service.bulkImportPolicies('org-123', policies, 'user-123');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('getPolicies()', () => {
    it('should get policies for organization', async () => {
      const mockPolicies = [
        { id: 'policy-1', title: 'Policy 1' },
        { id: 'policy-2', title: 'Policy 2' },
      ];

      prismaMock.policy.findMany.mockResolvedValue(mockPolicies as any);

      const result = await service.getPolicies('org-123');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });
});

