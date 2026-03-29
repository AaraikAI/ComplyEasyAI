/**
 * Personnel Service Unit Tests
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

import { PersonnelService } from '../../../services/personnelService';

describe('PersonnelService', () => {
  let personnelService: PersonnelService;

  beforeEach(() => {
    jest.clearAllMocks();
    personnelService = new PersonnelService();
  });

  describe('createPersonnel()', () => {
    it('should create personnel record', async () => {
      const data = {
        userId: 'user-123',
        organizationId: 'org-123',
        systemAccess: { systems: ['AWS', 'GitHub'] },
        dataAccess: { categories: ['Code'] },
        backgroundCheck: true,
        securityTraining: true,
      };

      const mockPersonnel = {
        id: 'personnel-123',
        ...data,
        onboardingStatus: 'In_Progress',
        onboardingDate: new Date(),
      };

      prismaMock.personnel.create.mockResolvedValue(mockPersonnel as any);

      const result = await personnelService.createPersonnel(data);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('onboardingStatus', 'In_Progress');
      expect(prismaMock.personnel.create).toHaveBeenCalled();
    });

    it('should set default values for optional fields', async () => {
      const data = {
        userId: 'user-123',
        organizationId: 'org-123',
      };

      prismaMock.personnel.create.mockResolvedValue({
        id: 'personnel-123',
        ...data,
      } as any);

      await personnelService.createPersonnel(data);

      expect(prismaMock.personnel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            systemAccess: {},
            dataAccess: {},
            physicalAccess: {},
            backgroundCheck: false,
            securityTraining: false,
          }),
        })
      );
    });
  });

  describe('completeOnboarding()', () => {
    it('should complete onboarding and activate user', async () => {
      const personnelId = 'personnel-123';
      const userId = 'user-123';
      const organizationId = 'org-123';

      const mockPersonnel = {
        id: personnelId,
        userId,
        onboardingStatus: 'Completed',
        user: { id: userId },
      };

      prismaMock.personnel.findFirst.mockResolvedValue({ id: personnelId, organizationId } as any);
      prismaMock.personnel.update.mockResolvedValue(mockPersonnel as any);
      prismaMock.user.update.mockResolvedValue({} as any);

      const result = await personnelService.completeOnboarding(
        personnelId,
        userId,
        organizationId
      );

      expect(result).toHaveProperty('onboardingStatus', 'Completed');
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: { active: true },
        })
      );
    });
  });

  describe('startOffboarding()', () => {
    it('should start offboarding process', async () => {
      const personnelId = 'personnel-123';
      const reason = 'Resignation';
      const userId = 'admin-123';
      const organizationId = 'org-123';

      const mockPersonnel = {
        id: personnelId,
        userId: 'user-123',
        onboardingStatus: 'Offboarding',
      };

      prismaMock.personnel.findFirst.mockResolvedValue({ id: personnelId, organizationId } as any);
      prismaMock.personnel.update.mockResolvedValue(mockPersonnel as any);
      prismaMock.user.update.mockResolvedValue({} as any);
      prismaMock.accessReview.create.mockResolvedValue({} as any);

      const result = await personnelService.startOffboarding(
        personnelId,
        reason,
        userId,
        organizationId
      );

      expect(result).toHaveProperty('onboardingStatus', 'Offboarding');
      expect(prismaMock.personnel.update).toHaveBeenCalled();
    });
  });

  describe('getPersonnelByOrganization()', () => {
    it('should get all personnel for organization', async () => {
      const organizationId = 'org-123';
      const mockPersonnel = [
        { id: 'personnel-1', organizationId },
        { id: 'personnel-2', organizationId },
      ];

      prismaMock.personnel.findMany.mockResolvedValue(mockPersonnel as any);

      const result = await personnelService.getPersonnelByOrganization(organizationId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('createAccessReview()', () => {
    it('should create access review', async () => {
      const reviewData = {
        personnelId: 'personnel-123',
        organizationId: 'org-123',
        reviewerId: 'reviewer-123',
        reviewType: 'Quarterly',
        dueDate: new Date(),
      };

      const mockReview = {
        id: 'review-123',
        ...reviewData,
        status: 'Pending',
      };

      prismaMock.accessReview.create.mockResolvedValue(mockReview as any);

      const result = await personnelService.createAccessReview(reviewData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status', 'Pending');
    });
  });
});

