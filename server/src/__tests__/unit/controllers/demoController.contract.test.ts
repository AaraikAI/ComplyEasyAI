/**
 * Demo Controller Contract Tests
 *
 * Validates the contract for demo request submission, listing,
 * scheduling, conversion, statistics, and deletion endpoints.
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

jest.mock('../../../services/webhookService', () => ({
  __esModule: true,
  default: {
    dispatchEvent: jest.fn<any>().mockResolvedValue(undefined as never),
  },
}));

jest.mock('../../../services/emailService', () => ({
  __esModule: true,
  default: {
    sendEmail: jest.fn<any>().mockResolvedValue(true as never),
  },
}));

import demoController from '../../../controllers/demoController';
import { AppError } from '../../../middleware/errorHandler';

const createMockDemoRequest = (overrides = {}) => ({
  id: 'demo-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  company: 'Acme Corp',
  jobTitle: 'CTO',
  phone: null,
  companySize: '50-200',
  industry: 'Technology',
  country: 'US',
  interestedTier: 'Essentials',
  currentChallenge: null,
  howDidYouHear: 'Google',
  message: null,
  source: 'pricing_page',
  status: 'pending',
  scheduledAt: null,
  assignedTo: null,
  convertedToUserId: null,
  convertedAt: null,
  completedAt: null,
  welcomeEmailSentAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('DemoController Contract Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        organizationId: 'org-123',
      },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    } as any;

    mockRes = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as unknown as NextFunction;
  });

  // ===========================================================================
  // submitDemoRequest (public)
  // ===========================================================================
  describe('submitDemoRequest()', () => {
    it('should create demo request with status 201', async () => {
      mockReq.body = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@company.com',
        company: 'BigCo',
      };

      (prismaMock.demoRequest.findFirst as jest.Mock<any>).mockResolvedValue(null as never);
      (prismaMock.demoRequest.create as jest.Mock<any>).mockResolvedValue(
        createMockDemoRequest({ email: 'jane@company.com' }) as never
      );
      (prismaMock.webhook.findMany as jest.Mock<any>).mockResolvedValue([] as never);
      (prismaMock.demoRequest.update as jest.Mock<any>).mockResolvedValue({} as never);

      await demoController.submitDemoRequest(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          requestId: expect.any(String),
        })
      );
      expect(prismaMock.demoRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'jane@company.com',
            status: 'pending',
          }),
        })
      );
    });

    it('should call next with error for missing required fields', async () => {
      mockReq.body = { firstName: 'Jane' }; // missing lastName, email, company

      await demoController.submitDemoRequest(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should call next with error for invalid email', async () => {
      mockReq.body = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'invalid-email',
        company: 'BigCo',
      };

      await demoController.submitDemoRequest(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should call next with 409 for duplicate in 24hrs', async () => {
      mockReq.body = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@company.com',
        company: 'BigCo',
      };

      (prismaMock.demoRequest.findFirst as jest.Mock<any>).mockResolvedValue(
        createMockDemoRequest() as never
      );

      await demoController.submitDemoRequest(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  // ===========================================================================
  // getAllDemoRequests (admin)
  // ===========================================================================
  describe('getAllDemoRequests()', () => {
    it('should return paginated demo requests', async () => {
      const requests = [createMockDemoRequest()];
      (prismaMock.demoRequest.findMany as jest.Mock<any>).mockResolvedValue(requests as never);
      (prismaMock.demoRequest.count as jest.Mock<any>).mockResolvedValue(1 as never);

      await demoController.getAllDemoRequests(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          demoRequests: expect.any(Array),
          pagination: expect.objectContaining({
            page: expect.any(Number),
            limit: expect.any(Number),
            total: 1,
            pages: expect.any(Number),
          }),
        })
      );
    });

    it('should filter by status', async () => {
      mockReq.query = { status: 'pending' };

      (prismaMock.demoRequest.findMany as jest.Mock<any>).mockResolvedValue([] as never);
      (prismaMock.demoRequest.count as jest.Mock<any>).mockResolvedValue(0 as never);

      await demoController.getAllDemoRequests(mockReq as any, mockRes as Response, mockNext);

      expect(prismaMock.demoRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'pending' }),
        })
      );
    });
  });

  // ===========================================================================
  // getDemoRequest (admin)
  // ===========================================================================
  describe('getDemoRequest()', () => {
    it('should return single demo request', async () => {
      mockReq.params = { id: 'demo-123' };

      (prismaMock.demoRequest.findUnique as jest.Mock<any>).mockResolvedValue(
        createMockDemoRequest() as never
      );

      await demoController.getDemoRequest(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          demoRequest: expect.objectContaining({ id: 'demo-123' }),
        })
      );
    });

    it('should call next with 404 when not found', async () => {
      mockReq.params = { id: 'nonexistent' };

      (prismaMock.demoRequest.findUnique as jest.Mock<any>).mockResolvedValue(null as never);

      await demoController.getDemoRequest(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  // ===========================================================================
  // updateDemoRequest (admin)
  // ===========================================================================
  describe('updateDemoRequest()', () => {
    it('should update demo request status', async () => {
      mockReq.params = { id: 'demo-123' };
      mockReq.body = { status: 'contacted' };

      (prismaMock.demoRequest.findUnique as jest.Mock<any>).mockResolvedValue(
        createMockDemoRequest() as never
      );
      (prismaMock.demoRequest.update as jest.Mock<any>).mockResolvedValue(
        createMockDemoRequest({ status: 'contacted' }) as never
      );
      (prismaMock.webhook.findMany as jest.Mock<any>).mockResolvedValue([] as never);

      await demoController.updateDemoRequest(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          demoRequest: expect.objectContaining({ status: 'contacted' }),
        })
      );
    });

    it('should call next with 404 when not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { status: 'contacted' };

      (prismaMock.demoRequest.findUnique as jest.Mock<any>).mockResolvedValue(null as never);

      await demoController.updateDemoRequest(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  // ===========================================================================
  // scheduleDemo (admin)
  // ===========================================================================
  describe('scheduleDemo()', () => {
    it('should schedule demo successfully', async () => {
      mockReq.params = { id: 'demo-123' };
      mockReq.body = { scheduledAt: '2026-04-15T14:00:00Z' };

      (prismaMock.demoRequest.findUnique as jest.Mock<any>).mockResolvedValue(
        createMockDemoRequest() as never
      );
      (prismaMock.demoRequest.update as jest.Mock<any>).mockResolvedValue(
        createMockDemoRequest({ status: 'scheduled', scheduledAt: new Date() }) as never
      );
      (prismaMock.webhook.findMany as jest.Mock<any>).mockResolvedValue([] as never);

      await demoController.scheduleDemo(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          demoRequest: expect.any(Object),
        })
      );
    });

    it('should call next with 400 when scheduledAt is missing', async () => {
      mockReq.params = { id: 'demo-123' };
      mockReq.body = {};

      await demoController.scheduleDemo(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  // ===========================================================================
  // markAsConverted (admin)
  // ===========================================================================
  describe('markAsConverted()', () => {
    it('should mark demo as converted', async () => {
      mockReq.params = { id: 'demo-123' };
      mockReq.body = { userId: 'user-456' };

      (prismaMock.demoRequest.findUnique as jest.Mock<any>).mockResolvedValue(
        createMockDemoRequest() as never
      );
      (prismaMock.demoRequest.update as jest.Mock<any>).mockResolvedValue(
        createMockDemoRequest({ status: 'converted', convertedToUserId: 'user-456' }) as never
      );
      (prismaMock.webhook.findMany as jest.Mock<any>).mockResolvedValue([] as never);

      await demoController.markAsConverted(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('converted'),
        })
      );
    });
  });

  // ===========================================================================
  // getDemoStats (admin)
  // ===========================================================================
  describe('getDemoStats()', () => {
    it('should return statistics', async () => {
      (prismaMock.demoRequest.groupBy as jest.Mock<any>)
        .mockResolvedValueOnce([{ status: 'pending', _count: 5 }] as never)
        .mockResolvedValueOnce([{ interestedTier: 'Essentials', _count: 3 }] as never)
        .mockResolvedValueOnce([{ source: 'pricing_page', _count: 4 }] as never)
        .mockResolvedValueOnce([] as never);
      (prismaMock.demoRequest.count as jest.Mock<any>).mockResolvedValue(10 as never);

      await demoController.getDemoStats(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 10,
          statusBreakdown: expect.any(Object),
          tierBreakdown: expect.any(Object),
          sourceBreakdown: expect.any(Object),
          conversionRate: expect.any(String),
        })
      );
    });
  });

  // ===========================================================================
  // deleteDemoRequest (admin)
  // ===========================================================================
  describe('deleteDemoRequest()', () => {
    it('should delete demo request', async () => {
      mockReq.params = { id: 'demo-123' };

      (prismaMock.demoRequest.findUnique as jest.Mock<any>).mockResolvedValue(
        createMockDemoRequest() as never
      );
      (prismaMock.demoRequest.delete as jest.Mock<any>).mockResolvedValue({} as never);

      await demoController.deleteDemoRequest(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should call next with 404 for non-existent request', async () => {
      mockReq.params = { id: 'nonexistent' };

      (prismaMock.demoRequest.findUnique as jest.Mock<any>).mockResolvedValue(null as never);

      await demoController.deleteDemoRequest(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});
