/**
 * Organization Controller Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock uuid
const mockUuidv4 = jest.fn<any>();
jest.mock('uuid', () => ({
  v4: mockUuidv4,
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

import organizationController from '../../../controllers/organizationController';
import { AppError } from '../../../middleware/errorHandler';

describe('OrganizationController', () => {
  let mockReq: any;
  let mockRes: any;
  const mockNext: NextFunction = jest.fn() as any;

  beforeEach(() => {
    mockUuidv4.mockReturnValue('test-uuid-1234');

    mockReq = {
      user: { id: 'user-1', organizationId: 'org-1', email: 'test@test.com', role: 'admin' },
      params: {},
      query: {},
      body: {},
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    };

    mockRes = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
  });

  // ============================================================================
  // get
  // ============================================================================

  describe('get', () => {
    it('should return the organization data', async () => {
      const organization = {
        id: 'org-1',
        name: 'Test Organization',
        plan: 'Pro',
        subscriptionStatus: 'Active',
        stripeCustomerId: 'cus_test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue(organization);

      await organizationController.get(mockReq, mockRes, mockNext);

      expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        select: {
          id: true,
          name: true,
          plan: true,
          subscriptionStatus: true,
          stripeCustomerId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(mockRes.json).toHaveBeenCalledWith(organization);
    });

    it('should throw 404 when organization not found', async () => {
      (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue(null);

      await expect(
        organizationController.get(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Organization not found');

      try {
        (prismaMock.organization.findUnique as jest.Mock<any>).mockResolvedValue(null);
        await organizationController.get(mockReq, mockRes, mockNext);
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(404);
      }
    });

    it('should re-throw AppError from prisma', async () => {
      (prismaMock.organization.findUnique as jest.Mock<any>).mockRejectedValue(
        new AppError('Access denied', 403)
      );

      await expect(
        organizationController.get(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Access denied');
    });

    it('should throw 500 AppError on generic database error', async () => {
      (prismaMock.organization.findUnique as jest.Mock<any>).mockRejectedValue(
        new Error('Connection timeout')
      );

      await expect(
        organizationController.get(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Failed to fetch organization');
    });
  });

  // ============================================================================
  // update
  // ============================================================================

  describe('update', () => {
    it('should update organization name', async () => {
      mockReq.body = { name: 'Updated Org Name' };

      const updatedOrg = {
        id: 'org-1',
        name: 'Updated Org Name',
        plan: 'Pro',
        subscriptionStatus: 'Active',
        stripeCustomerId: 'cus_test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaMock.organization.update as jest.Mock<any>).mockResolvedValue(updatedOrg);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await organizationController.update(mockReq, mockRes, mockNext);

      expect(prismaMock.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'org-1' },
          data: { name: 'Updated Org Name' },
          select: {
            id: true,
            name: true,
            plan: true,
            subscriptionStatus: true,
            stripeCustomerId: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      );
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'Organization Settings Updated',
            userId: 'user-1',
            organizationId: 'org-1',
            hash: 'test-uuid-1234',
          }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(updatedOrg);
    });

    it('should update organization plan', async () => {
      mockReq.body = { plan: 'Growth' };

      const updatedOrg = {
        id: 'org-1',
        name: 'Test Org',
        plan: 'Growth',
      };

      (prismaMock.organization.update as jest.Mock<any>).mockResolvedValue(updatedOrg);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await organizationController.update(mockReq, mockRes, mockNext);

      expect(prismaMock.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { plan: 'Growth' },
        })
      );
    });

    it('should update both name and plan simultaneously', async () => {
      mockReq.body = { name: 'New Name', plan: 'Essentials' };

      const updatedOrg = {
        id: 'org-1',
        name: 'New Name',
        plan: 'Essentials',
      };

      (prismaMock.organization.update as jest.Mock<any>).mockResolvedValue(updatedOrg);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await organizationController.update(mockReq, mockRes, mockNext);

      expect(prismaMock.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'New Name', plan: 'Essentials' },
        })
      );
    });

    it('should trim the organization name', async () => {
      mockReq.body = { name: '  Trimmed Org  ' };

      const updatedOrg = { id: 'org-1', name: 'Trimmed Org' };

      (prismaMock.organization.update as jest.Mock<any>).mockResolvedValue(updatedOrg);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await organizationController.update(mockReq, mockRes, mockNext);

      expect(prismaMock.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'Trimmed Org' },
        })
      );
    });

    it('should throw 400 when name is empty string', async () => {
      mockReq.body = { name: '' };

      await expect(
        organizationController.update(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Organization name is required');
    });

    it('should throw 400 when name is whitespace only', async () => {
      mockReq.body = { name: '   ' };

      await expect(
        organizationController.update(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Organization name is required');
    });

    it('should throw 400 when name exceeds 100 characters', async () => {
      mockReq.body = { name: 'A'.repeat(101) };

      await expect(
        organizationController.update(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Organization name is too long. Maximum 100 characters.');
    });

    it('should accept name with exactly 100 characters', async () => {
      mockReq.body = { name: 'A'.repeat(100) };

      const updatedOrg = { id: 'org-1', name: 'A'.repeat(100) };

      (prismaMock.organization.update as jest.Mock<any>).mockResolvedValue(updatedOrg);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await organizationController.update(mockReq, mockRes, mockNext);

      expect(prismaMock.organization.update).toHaveBeenCalled();
    });

    it('should throw 400 for invalid plan', async () => {
      mockReq.body = { plan: 'InvalidPlan' };

      await expect(
        organizationController.update(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Invalid plan. Must be one of: Foundation, Essentials, Growth, Visionary');
    });

    it('should accept valid plan "Foundation"', async () => {
      mockReq.body = { plan: 'Foundation' };

      const updatedOrg = { id: 'org-1', plan: 'Foundation' };

      (prismaMock.organization.update as jest.Mock<any>).mockResolvedValue(updatedOrg);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await organizationController.update(mockReq, mockRes, mockNext);

      expect(prismaMock.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { plan: 'Foundation' },
        })
      );
    });

    it('should accept valid plan "Essentials"', async () => {
      mockReq.body = { plan: 'Essentials' };

      const updatedOrg = { id: 'org-1', plan: 'Essentials' };

      (prismaMock.organization.update as jest.Mock<any>).mockResolvedValue(updatedOrg);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await organizationController.update(mockReq, mockRes, mockNext);

      expect(prismaMock.organization.update).toHaveBeenCalled();
    });

    it('should accept valid plan "Visionary"', async () => {
      mockReq.body = { plan: 'Visionary' };

      const updatedOrg = { id: 'org-1', plan: 'Visionary' };

      (prismaMock.organization.update as jest.Mock<any>).mockResolvedValue(updatedOrg);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await organizationController.update(mockReq, mockRes, mockNext);

      expect(prismaMock.organization.update).toHaveBeenCalled();
    });

    it('should log audit with ip address and user agent', async () => {
      mockReq.body = { name: 'Test' };
      mockReq.ip = '192.168.1.1';
      mockReq.headers['user-agent'] = 'Mozilla/5.0';

      const updatedOrg = { id: 'org-1', name: 'Test' };

      (prismaMock.organization.update as jest.Mock<any>).mockResolvedValue(updatedOrg);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await organizationController.update(mockReq, mockRes, mockNext);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
          }),
        })
      );
    });

    it('should re-throw AppError from prisma', async () => {
      mockReq.body = { name: 'Test' };
      (prismaMock.organization.update as jest.Mock<any>).mockRejectedValue(
        new AppError('Not found', 404)
      );

      await expect(
        organizationController.update(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Not found');
    });

    it('should throw 500 AppError on generic database error', async () => {
      mockReq.body = { name: 'Test' };
      (prismaMock.organization.update as jest.Mock<any>).mockRejectedValue(
        new Error('Connection lost')
      );

      await expect(
        organizationController.update(mockReq, mockRes, mockNext)
      ).rejects.toThrow('Failed to update organization');
    });

    it('should not include name in update data when not provided', async () => {
      mockReq.body = { plan: 'Essentials' };

      const updatedOrg = { id: 'org-1', plan: 'Essentials' };

      (prismaMock.organization.update as jest.Mock<any>).mockResolvedValue(updatedOrg);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await organizationController.update(mockReq, mockRes, mockNext);

      const updateCall = (prismaMock.organization.update as jest.Mock<any>).mock.calls[0][0];
      expect(updateCall.data.name).toBeUndefined();
      expect(updateCall.data.plan).toBe('Essentials');
    });

    it('should not include plan in update data when not provided', async () => {
      mockReq.body = { name: 'Test' };

      const updatedOrg = { id: 'org-1', name: 'Test' };

      (prismaMock.organization.update as jest.Mock<any>).mockResolvedValue(updatedOrg);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({});

      await organizationController.update(mockReq, mockRes, mockNext);

      const updateCall = (prismaMock.organization.update as jest.Mock<any>).mock.calls[0][0];
      expect(updateCall.data.name).toBe('Test');
      expect(updateCall.data.plan).toBeUndefined();
    });
  });
});
