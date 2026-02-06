/**
 * Multi-Workspace Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: (jest.fn() as jest.Mock<any>).mockResolvedValue({}),
  },
}));

import { MultiWorkspaceService } from '../../../services/multiWorkspaceService';

describe('MultiWorkspaceService', () => {
  let service: MultiWorkspaceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MultiWorkspaceService();
  });

  describe('createChildOrganization()', () => {
    it('should create child organization', async () => {
      const parentId = 'parent-123';
      const data = {
        name: 'Child Organization',
        plan: 'Pro',
      };

      prismaMock.organization.findUnique.mockResolvedValue({
        id: parentId,
        isParent: false,
        plan: 'Enterprise',
      } as any);
      prismaMock.organization.update.mockResolvedValue({} as any);
      prismaMock.organization.create.mockResolvedValue({
        id: 'child-123',
        ...data,
        parentOrganizationId: parentId,
      } as any);

      const result = await service.createChildOrganization(parentId, data, 'user-123');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('parentOrganizationId', parentId);
    });

    it('should mark parent as parent if not already', async () => {
      const parentId = 'parent-123';

      prismaMock.organization.findUnique.mockResolvedValue({
        id: parentId,
        isParent: false,
      } as any);
      prismaMock.organization.update.mockResolvedValue({} as any);
      prismaMock.organization.create.mockResolvedValue({
        id: 'child-123',
      } as any);

      await service.createChildOrganization(parentId, { name: 'Child' }, 'user-123');

      expect(prismaMock.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: parentId },
          data: { isParent: true },
        })
      );
    });

    it('should throw error if parent not found', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.createChildOrganization('invalid-id', { name: 'Child' }, 'user-123')
      ).rejects.toThrow('Parent organization not found');
    });
  });

  describe('getOrganizationHierarchy()', () => {
    it('should get organization hierarchy', async () => {
      const organizationId = 'org-123';

      prismaMock.organization.findUnique.mockResolvedValue({
        id: organizationId,
        childOrganizations: [],
        parentOrganization: null,
      } as any);

      const result = await service.getOrganizationHierarchy(organizationId);

      expect(result).toHaveProperty('current');
      expect(result.current).toHaveProperty('id', organizationId);
    });
  });
});

