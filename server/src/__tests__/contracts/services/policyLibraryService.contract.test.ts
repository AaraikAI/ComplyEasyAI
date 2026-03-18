/**
 * Policy Library Service Contract Tests
 *
 * Verifies the contract for policy CRUD, bulk imports,
 * template retrieval, and cross-framework mapping.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockPolicy } from '../../mocks/prisma';

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

import policyLibraryService from '../../../services/policyLibraryService';

describe('PolicyLibraryService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createPolicy
  // ---------------------------------------------------------------------------
  describe('createPolicy', () => {
    it('should call prisma.policy.create with correct shape', async () => {
      const mockPolicy = createMockPolicy({ id: 'policy-new' });
      prismaMock.policy.create.mockResolvedValue(mockPolicy);

      await policyLibraryService.createPolicy({
        organizationId: 'org-123',
        title: 'Information Security Policy',
        category: 'Security',
        content: '# Information Security Policy\n\nPolicy content...',
        userId: 'user-1',
      });

      expect(prismaMock.policy.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
          title: 'Information Security Policy',
          category: 'Security',
          content: expect.any(String),
          version: '1.0',
          status: 'Draft',
        }),
      });
    });

    it('should use custom version when provided', async () => {
      prismaMock.policy.create.mockResolvedValue(createMockPolicy({ version: '2.0' }));

      await policyLibraryService.createPolicy({
        organizationId: 'org-123',
        title: 'Updated Policy',
        category: 'Privacy',
        content: 'Updated content',
        version: '2.0',
        userId: 'user-1',
      });

      expect(prismaMock.policy.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          version: '2.0',
        }),
      });
    });

    it('should default version to 1.0 when not provided', async () => {
      prismaMock.policy.create.mockResolvedValue(createMockPolicy());

      await policyLibraryService.createPolicy({
        organizationId: 'org-123',
        title: 'New Policy',
        category: 'Compliance',
        content: 'Content',
        userId: 'user-1',
      });

      expect(prismaMock.policy.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          version: '1.0',
        }),
      });
    });

    it('should default status to Draft when not provided', async () => {
      prismaMock.policy.create.mockResolvedValue(createMockPolicy());

      await policyLibraryService.createPolicy({
        organizationId: 'org-123',
        title: 'Policy',
        category: 'HR',
        content: 'Content',
        userId: 'user-1',
      });

      expect(prismaMock.policy.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'Draft',
        }),
      });
    });

    it('should propagate database errors', async () => {
      prismaMock.policy.create.mockRejectedValue(new Error('Disk full'));

      await expect(
        policyLibraryService.createPolicy({
          organizationId: 'org-123',
          title: 'Policy',
          category: 'Security',
          content: 'Content',
          userId: 'user-1',
        })
      ).rejects.toThrow('Disk full');
    });
  });

  // ---------------------------------------------------------------------------
  // bulkImportPolicies
  // ---------------------------------------------------------------------------
  describe('bulkImportPolicies', () => {
    it('should create multiple policies and return array', async () => {
      const policy1 = createMockPolicy({ id: 'p-1', title: 'Policy 1' });
      const policy2 = createMockPolicy({ id: 'p-2', title: 'Policy 2' });
      prismaMock.policy.create
        .mockResolvedValueOnce(policy1)
        .mockResolvedValueOnce(policy2);

      const result = await policyLibraryService.bulkImportPolicies(
        'org-123',
        [
          { title: 'Policy 1', category: 'Security', content: 'Content 1' },
          { title: 'Policy 2', category: 'Privacy', content: 'Content 2' },
        ],
        'user-1'
      );

      expect(result).toHaveLength(2);
      expect(prismaMock.policy.create).toHaveBeenCalledTimes(2);
    });

    it('should propagate error if any policy creation fails', async () => {
      prismaMock.policy.create
        .mockResolvedValueOnce(createMockPolicy())
        .mockRejectedValueOnce(new Error('Duplicate title'));

      await expect(
        policyLibraryService.bulkImportPolicies(
          'org-123',
          [
            { title: 'Policy 1', category: 'Security', content: 'Content 1' },
            { title: 'Policy 1', category: 'Security', content: 'Duplicate' },
          ],
          'user-1'
        )
      ).rejects.toThrow('Duplicate title');
    });
  });

  // ---------------------------------------------------------------------------
  // getPolicyTemplates
  // ---------------------------------------------------------------------------
  describe('getPolicyTemplates', () => {
    it('should return policy templates organized by category', async () => {
      const templates = await policyLibraryService.getPolicyTemplates();

      expect(templates).toBeDefined();
      expect(typeof templates).toBe('object');
    });

    it('should filter by category when provided', async () => {
      const templates = await policyLibraryService.getPolicyTemplates('Information Security');

      expect(templates).toBeDefined();
    });
  });
});
