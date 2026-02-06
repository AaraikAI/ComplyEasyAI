/**
 * Demo Controller Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock webhook service
const mockDispatchEvent = jest.fn<any>();
jest.mock('../../../services/webhookService', () => ({
  __esModule: true,
  default: {
    dispatchEvent: mockDispatchEvent,
  },
}));

// Mock email service
const mockSendEmail = jest.fn<any>();
jest.mock('../../../services/emailService', () => ({
  __esModule: true,
  default: {
    sendEmail: mockSendEmail,
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

// Add missing demoRequest model to prismaMock
const mockDemoRequest = {
  findFirst: jest.fn<any>(),
  findUnique: jest.fn<any>(),
  findMany: jest.fn<any>(),
  create: jest.fn<any>(),
  update: jest.fn<any>(),
  delete: jest.fn<any>(),
  count: jest.fn<any>(),
  groupBy: jest.fn<any>(),
};
(prismaMock as any).demoRequest = mockDemoRequest;

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import { demoController } from '../../../controllers/demoController';
import { AppError } from '../../../middleware/errorHandler';

describe('DemoController', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock<any>;

  beforeEach(() => {
    mockNext = jest.fn<any>();
    mockSendEmail.mockResolvedValue(undefined);
    mockDispatchEvent.mockResolvedValue(undefined);

    mockReq = {
      user: { id: 'user-1', organizationId: 'org-1', email: 'admin@test.com', role: 'admin' },
      params: {},
      query: {},
      body: {},
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent', referer: 'https://complyeasyai.com' },
    };

    mockRes = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
  });

  // ============================================================================
  // submitDemoRequest
  // ============================================================================

  describe('submitDemoRequest', () => {
    const validBody = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@company.com',
      company: 'Acme Corp',
      jobTitle: 'CTO',
      companySize: '50-200',
      industry: 'Technology',
    };

    it('should submit a demo request and return 201', async () => {
      mockReq.body = { ...validBody };

      const createdRequest = {
        id: 'demo-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@company.com',
        company: 'Acme Corp',
        status: 'pending',
        createdAt: new Date(),
        source: 'pricing_page',
      };

      mockDemoRequest.findFirst.mockResolvedValue(null);
      mockDemoRequest.create.mockResolvedValue(createdRequest);
      mockDemoRequest.update.mockResolvedValue(createdRequest);
      (prismaMock.webhook.findMany as jest.Mock<any>).mockResolvedValue([]);

      await demoController.submitDemoRequest(mockReq, mockRes, mockNext);

      expect(mockDemoRequest.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: 'john@company.com',
          }),
        })
      );
      expect(mockDemoRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@company.com',
            company: 'Acme Corp',
            status: 'pending',
          }),
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          requestId: 'demo-1',
        })
      );
    });

    it('should trim and lowercase email', async () => {
      mockReq.body = { ...validBody, email: 'John@Company.COM' };

      const createdRequest = {
        id: 'demo-1',
        email: 'john@company.com',
        createdAt: new Date(),
        source: 'pricing_page',
      };

      mockDemoRequest.findFirst.mockResolvedValue(null);
      mockDemoRequest.create.mockResolvedValue(createdRequest);
      mockDemoRequest.update.mockResolvedValue(createdRequest);
      (prismaMock.webhook.findMany as jest.Mock<any>).mockResolvedValue([]);

      await demoController.submitDemoRequest(mockReq, mockRes, mockNext);

      expect(mockDemoRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'john@company.com',
          }),
        })
      );
    });

    it('should use default source when not provided', async () => {
      mockReq.body = { ...validBody };

      const createdRequest = {
        id: 'demo-1',
        source: 'pricing_page',
        createdAt: new Date(),
      };

      mockDemoRequest.findFirst.mockResolvedValue(null);
      mockDemoRequest.create.mockResolvedValue(createdRequest);
      mockDemoRequest.update.mockResolvedValue(createdRequest);
      (prismaMock.webhook.findMany as jest.Mock<any>).mockResolvedValue([]);

      await demoController.submitDemoRequest(mockReq, mockRes, mockNext);

      expect(mockDemoRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source: 'pricing_page',
          }),
        })
      );
    });

    it('should call next with AppError when firstName is missing', async () => {
      mockReq.body = { lastName: 'Doe', email: 'john@co.com', company: 'Acme' };

      await demoController.submitDemoRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock<any>).mock.calls[0][0] as AppError;
      expect(error.message).toBe('First name, last name, email, and company are required');
      expect(error.statusCode).toBe(400);
    });

    it('should call next with AppError when lastName is missing', async () => {
      mockReq.body = { firstName: 'John', email: 'john@co.com', company: 'Acme' };

      await demoController.submitDemoRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should call next with AppError when email is missing', async () => {
      mockReq.body = { firstName: 'John', lastName: 'Doe', company: 'Acme' };

      await demoController.submitDemoRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should call next with AppError when company is missing', async () => {
      mockReq.body = { firstName: 'John', lastName: 'Doe', email: 'john@co.com' };

      await demoController.submitDemoRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should call next with AppError for invalid email format', async () => {
      mockReq.body = { ...validBody, email: 'not-an-email' };

      await demoController.submitDemoRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock<any>).mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid email format');
      expect(error.statusCode).toBe(400);
    });

    it('should call next with 409 when duplicate request exists within 24 hours', async () => {
      mockReq.body = { ...validBody };

      mockDemoRequest.findFirst.mockResolvedValue({
        id: 'demo-old',
        email: 'john@company.com',
        createdAt: new Date(),
      });

      await demoController.submitDemoRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock<any>).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(409);
    });

    it('should call next with error on database failure', async () => {
      mockReq.body = { ...validBody };

      mockDemoRequest.findFirst.mockResolvedValue(null);
      mockDemoRequest.create.mockRejectedValue(new Error('DB connection lost'));

      await demoController.submitDemoRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should dispatch webhooks to subscribed organizations', async () => {
      mockReq.body = { ...validBody };

      const createdRequest = {
        id: 'demo-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@company.com',
        company: 'Acme Corp',
        status: 'pending',
        createdAt: new Date(),
        source: 'pricing_page',
      };

      mockDemoRequest.findFirst.mockResolvedValue(null);
      mockDemoRequest.create.mockResolvedValue(createdRequest);
      mockDemoRequest.update.mockResolvedValue(createdRequest);
      (prismaMock.webhook.findMany as jest.Mock<any>).mockResolvedValue([
        { organizationId: 'org-webhook-1', enabled: true, events: ['demo.request.welcome'] },
      ]);

      await demoController.submitDemoRequest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  // ============================================================================
  // getAllDemoRequests
  // ============================================================================

  describe('getAllDemoRequests', () => {
    it('should return paginated demo requests with defaults', async () => {
      const demoRequests = [
        { id: 'demo-1', firstName: 'John', lastName: 'Doe' },
        { id: 'demo-2', firstName: 'Jane', lastName: 'Smith' },
      ];

      mockDemoRequest.findMany.mockResolvedValue(demoRequests);
      mockDemoRequest.count.mockResolvedValue(2);

      await demoController.getAllDemoRequests(mockReq, mockRes, mockNext);

      expect(mockDemoRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 50,
          orderBy: { createdAt: 'desc' },
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        demoRequests,
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          pages: 1,
        },
      });
    });

    it('should apply status filter', async () => {
      mockReq.query = { status: 'pending' };

      mockDemoRequest.findMany.mockResolvedValue([]);
      mockDemoRequest.count.mockResolvedValue(0);

      await demoController.getAllDemoRequests(mockReq, mockRes, mockNext);

      expect(mockDemoRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'pending' },
        })
      );
    });

    it('should apply tier filter', async () => {
      mockReq.query = { tier: 'enterprise' };

      mockDemoRequest.findMany.mockResolvedValue([]);
      mockDemoRequest.count.mockResolvedValue(0);

      await demoController.getAllDemoRequests(mockReq, mockRes, mockNext);

      expect(mockDemoRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { interestedTier: 'enterprise' },
        })
      );
    });

    it('should apply date range filters', async () => {
      mockReq.query = {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      };

      mockDemoRequest.findMany.mockResolvedValue([]);
      mockDemoRequest.count.mockResolvedValue(0);

      await demoController.getAllDemoRequests(mockReq, mockRes, mockNext);

      expect(mockDemoRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2025-01-01'),
              lte: new Date('2025-12-31'),
            },
          }),
        })
      );
    });

    it('should apply custom pagination', async () => {
      mockReq.query = { page: '3', limit: '10', sortBy: 'email', sortOrder: 'asc' };

      mockDemoRequest.findMany.mockResolvedValue([]);
      mockDemoRequest.count.mockResolvedValue(100);

      await demoController.getAllDemoRequests(mockReq, mockRes, mockNext);

      expect(mockDemoRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
          orderBy: { email: 'asc' },
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: {
            page: 3,
            limit: 10,
            total: 100,
            pages: 10,
          },
        })
      );
    });

    it('should call next with error on failure', async () => {
      mockDemoRequest.findMany.mockRejectedValue(new Error('DB error'));

      await demoController.getAllDemoRequests(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ============================================================================
  // getDemoRequest
  // ============================================================================

  describe('getDemoRequest', () => {
    it('should return a single demo request by id', async () => {
      mockReq.params = { id: 'demo-1' };

      const demoRequest = { id: 'demo-1', firstName: 'John', lastName: 'Doe' };
      mockDemoRequest.findUnique.mockResolvedValue(demoRequest);

      await demoController.getDemoRequest(mockReq, mockRes, mockNext);

      expect(mockDemoRequest.findUnique).toHaveBeenCalledWith({ where: { id: 'demo-1' } });
      expect(mockRes.json).toHaveBeenCalledWith({ demoRequest });
    });

    it('should call next with 404 when demo request not found', async () => {
      mockReq.params = { id: 'nonexistent' };

      mockDemoRequest.findUnique.mockResolvedValue(null);

      await demoController.getDemoRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock<any>).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Demo request not found');
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: 'demo-1' };
      mockDemoRequest.findUnique.mockRejectedValue(new Error('DB error'));

      await demoController.getDemoRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ============================================================================
  // updateDemoRequest
  // ============================================================================

  describe('updateDemoRequest', () => {
    it('should update a demo request status', async () => {
      mockReq.params = { id: 'demo-1' };
      mockReq.body = { status: 'contacted', notes: 'Called the client' };

      const existing = {
        id: 'demo-1',
        status: 'pending',
        completedAt: null,
      };
      const updated = {
        id: 'demo-1',
        status: 'contacted',
        notes: 'Called the client',
      };

      mockDemoRequest.findUnique.mockResolvedValue(existing);
      mockDemoRequest.update.mockResolvedValue(updated);
      (prismaMock.webhook.findMany as jest.Mock<any>).mockResolvedValue([]);

      await demoController.updateDemoRequest(mockReq, mockRes, mockNext);

      expect(mockDemoRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'demo-1' },
          data: expect.objectContaining({
            status: 'contacted',
            notes: 'Called the client',
          }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({ demoRequest: updated });
    });

    it('should set completedAt when status changes to completed', async () => {
      mockReq.params = { id: 'demo-1' };
      mockReq.body = { status: 'completed' };

      const existing = { id: 'demo-1', status: 'scheduled', completedAt: null };
      const updated = { id: 'demo-1', status: 'completed', completedAt: new Date() };

      mockDemoRequest.findUnique.mockResolvedValue(existing);
      mockDemoRequest.update.mockResolvedValue(updated);
      (prismaMock.webhook.findMany as jest.Mock<any>).mockResolvedValue([]);

      await demoController.updateDemoRequest(mockReq, mockRes, mockNext);

      expect(mockDemoRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'completed',
            completedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should not overwrite existing completedAt when status is completed again', async () => {
      mockReq.params = { id: 'demo-1' };
      mockReq.body = { status: 'completed' };

      const existingDate = new Date('2025-01-01');
      const existing = { id: 'demo-1', status: 'completed', completedAt: existingDate };
      const updated = { id: 'demo-1', status: 'completed', completedAt: existingDate };

      mockDemoRequest.findUnique.mockResolvedValue(existing);
      mockDemoRequest.update.mockResolvedValue(updated);
      (prismaMock.webhook.findMany as jest.Mock<any>).mockResolvedValue([]);

      await demoController.updateDemoRequest(mockReq, mockRes, mockNext);

      // completedAt should NOT be in the update data because existing.completedAt is truthy
      const updateCall = mockDemoRequest.update.mock.calls[0][0];
      expect(updateCall.data.completedAt).toBeUndefined();
    });

    it('should update scheduledAt to null when passed as null', async () => {
      mockReq.params = { id: 'demo-1' };
      mockReq.body = { scheduledAt: null };

      const existing = { id: 'demo-1', status: 'scheduled', completedAt: null };
      const updated = { id: 'demo-1', scheduledAt: null };

      mockDemoRequest.findUnique.mockResolvedValue(existing);
      mockDemoRequest.update.mockResolvedValue(updated);
      (prismaMock.webhook.findMany as jest.Mock<any>).mockResolvedValue([]);

      await demoController.updateDemoRequest(mockReq, mockRes, mockNext);

      expect(mockDemoRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            scheduledAt: null,
          }),
        })
      );
    });

    it('should call next with 404 when demo request not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { status: 'contacted' };

      mockDemoRequest.findUnique.mockResolvedValue(null);

      await demoController.updateDemoRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock<any>).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(404);
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: 'demo-1' };
      mockReq.body = { status: 'contacted' };

      mockDemoRequest.findUnique.mockRejectedValue(new Error('DB error'));

      await demoController.updateDemoRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ============================================================================
  // scheduleDemo
  // ============================================================================

  describe('scheduleDemo', () => {
    it('should schedule a demo and return success', async () => {
      mockReq.params = { id: 'demo-1' };
      mockReq.body = {
        scheduledAt: '2025-06-15T10:00:00Z',
        assignedTo: 'sales-rep-1',
        sendConfirmation: true,
      };

      const existing = { id: 'demo-1', email: 'john@co.com', status: 'pending' };
      const updated = {
        id: 'demo-1',
        status: 'scheduled',
        scheduledAt: new Date('2025-06-15T10:00:00Z'),
        assignedTo: 'sales-rep-1',
        email: 'john@co.com',
      };

      mockDemoRequest.findUnique.mockResolvedValue(existing);
      mockDemoRequest.update.mockResolvedValue(updated);
      (prismaMock.webhook.findMany as jest.Mock<any>).mockResolvedValue([]);

      await demoController.scheduleDemo(mockReq, mockRes, mockNext);

      expect(mockDemoRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'demo-1' },
          data: expect.objectContaining({
            status: 'scheduled',
            scheduledAt: expect.any(Date),
            assignedTo: 'sales-rep-1',
          }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Demo scheduled successfully',
          demoRequest: updated,
        })
      );
    });

    it('should skip confirmation webhook when sendConfirmation is false', async () => {
      mockReq.params = { id: 'demo-1' };
      mockReq.body = {
        scheduledAt: '2025-06-15T10:00:00Z',
        sendConfirmation: false,
      };

      const existing = { id: 'demo-1', email: 'john@co.com', status: 'pending' };
      const updated = { id: 'demo-1', status: 'scheduled', email: 'john@co.com' };

      mockDemoRequest.findUnique.mockResolvedValue(existing);
      mockDemoRequest.update.mockResolvedValue(updated);

      await demoController.scheduleDemo(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should call next with 400 when scheduledAt is missing', async () => {
      mockReq.params = { id: 'demo-1' };
      mockReq.body = {};

      await demoController.scheduleDemo(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock<any>).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Scheduled date/time is required');
    });

    it('should call next with 404 when demo request not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { scheduledAt: '2025-06-15T10:00:00Z' };

      mockDemoRequest.findUnique.mockResolvedValue(null);

      await demoController.scheduleDemo(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock<any>).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(404);
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: 'demo-1' };
      mockReq.body = { scheduledAt: '2025-06-15T10:00:00Z' };

      mockDemoRequest.findUnique.mockRejectedValue(new Error('DB error'));

      await demoController.scheduleDemo(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ============================================================================
  // markAsConverted
  // ============================================================================

  describe('markAsConverted', () => {
    it('should mark a demo request as converted', async () => {
      mockReq.params = { id: 'demo-1' };
      mockReq.body = { userId: 'new-user-1' };

      const existing = { id: 'demo-1', email: 'john@co.com', status: 'completed' };
      const updated = {
        id: 'demo-1',
        status: 'converted',
        convertedToUserId: 'new-user-1',
        convertedAt: new Date(),
        email: 'john@co.com',
      };

      mockDemoRequest.findUnique.mockResolvedValue(existing);
      mockDemoRequest.update.mockResolvedValue(updated);
      (prismaMock.webhook.findMany as jest.Mock<any>).mockResolvedValue([]);

      await demoController.markAsConverted(mockReq, mockRes, mockNext);

      expect(mockDemoRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'demo-1' },
          data: expect.objectContaining({
            status: 'converted',
            convertedToUserId: 'new-user-1',
            convertedAt: expect.any(Date),
          }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Demo request marked as converted',
        })
      );
    });

    it('should call next with 404 when demo request not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { userId: 'new-user-1' };

      mockDemoRequest.findUnique.mockResolvedValue(null);

      await demoController.markAsConverted(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock<any>).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(404);
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: 'demo-1' };
      mockReq.body = { userId: 'new-user-1' };

      mockDemoRequest.findUnique.mockRejectedValue(new Error('DB error'));

      await demoController.markAsConverted(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ============================================================================
  // getDemoStats
  // ============================================================================

  describe('getDemoStats', () => {
    it('should return demo statistics', async () => {
      const statusCounts = [
        { status: 'pending', _count: 10 },
        { status: 'scheduled', _count: 5 },
        { status: 'converted', _count: 3 },
      ];
      const tierCounts = [
        { interestedTier: 'enterprise', _count: 8 },
        { interestedTier: 'pro', _count: 7 },
      ];
      const sourceCounts = [
        { source: 'pricing_page', _count: 12 },
        { source: 'homepage', _count: 3 },
      ];
      const dailyCounts = [
        { createdAt: new Date(), _count: 2 },
      ];

      mockDemoRequest.groupBy
        .mockResolvedValueOnce(statusCounts)
        .mockResolvedValueOnce(tierCounts)
        .mockResolvedValueOnce(sourceCounts)
        .mockResolvedValueOnce(dailyCounts);
      mockDemoRequest.count.mockResolvedValue(18);

      await demoController.getDemoStats(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 18,
          statusBreakdown: {
            pending: 10,
            scheduled: 5,
            converted: 3,
          },
          tierBreakdown: {
            enterprise: 8,
            pro: 7,
          },
          sourceBreakdown: {
            pricing_page: 12,
            homepage: 3,
          },
          conversionRate: expect.stringContaining('%'),
          recentTrend: 1,
        })
      );
    });

    it('should apply date filters to statistics', async () => {
      mockReq.query = {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      };

      mockDemoRequest.groupBy.mockResolvedValue([]);
      mockDemoRequest.count.mockResolvedValue(0);

      await demoController.getDemoStats(mockReq, mockRes, mockNext);

      expect(mockDemoRequest.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2025-01-01'),
              lte: new Date('2025-12-31'),
            },
          }),
        })
      );
    });

    it('should return 0% conversion rate when total is 0', async () => {
      mockDemoRequest.groupBy.mockResolvedValue([]);
      mockDemoRequest.count.mockResolvedValue(0);

      await demoController.getDemoStats(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 0,
          conversionRate: '0%',
        })
      );
    });

    it('should call next with error on failure', async () => {
      mockDemoRequest.groupBy.mockRejectedValue(new Error('DB error'));

      await demoController.getDemoStats(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ============================================================================
  // deleteDemoRequest
  // ============================================================================

  describe('deleteDemoRequest', () => {
    it('should delete a demo request and return success', async () => {
      mockReq.params = { id: 'demo-1' };

      mockDemoRequest.findUnique.mockResolvedValue({ id: 'demo-1' });
      mockDemoRequest.delete.mockResolvedValue({});

      await demoController.deleteDemoRequest(mockReq, mockRes, mockNext);

      expect(mockDemoRequest.findUnique).toHaveBeenCalledWith({ where: { id: 'demo-1' } });
      expect(mockDemoRequest.delete).toHaveBeenCalledWith({ where: { id: 'demo-1' } });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Demo request deleted',
      });
    });

    it('should call next with 404 when demo request not found', async () => {
      mockReq.params = { id: 'nonexistent' };

      mockDemoRequest.findUnique.mockResolvedValue(null);

      await demoController.deleteDemoRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock<any>).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Demo request not found');
    });

    it('should call next with error on failure', async () => {
      mockReq.params = { id: 'demo-1' };
      mockDemoRequest.findUnique.mockRejectedValue(new Error('DB error'));

      await demoController.deleteDemoRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
