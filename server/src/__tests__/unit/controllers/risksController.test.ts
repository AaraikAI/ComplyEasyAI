/**
 * Risks Controller Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../services/geminiService', () => ({
  __esModule: true,
  default: {
    prioritizeRisks: jest.fn<any>().mockResolvedValue([
      { id: 'risk-1', score: 95, rationale: 'Critical' },
    ] as never),
    generateRemediationPlan: jest.fn<any>().mockResolvedValue('# Remediation Plan\n\n...' as never),
  },
}));

import risksController from '../../../controllers/risksController';
import { AppError } from '../../../middleware/errorHandler';

describe('RisksController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
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
    } as any;

    mockResponse = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as unknown as NextFunction;
  });

  describe('list()', () => {
    it('should list risks for organization', async () => {
      const mockRisks = [
        { id: 'risk-1', title: 'Risk 1', severity: 'High' },
        { id: 'risk-2', title: 'Risk 2', severity: 'Medium' },
      ];

      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue(mockRisks as any);

      await risksController.list(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(mockRisks);
    });

    it('should filter by status', async () => {
      mockRequest.query = { status: 'Open' };

      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue([] as any);

      await risksController.list(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'Open',
          }),
        })
      );
    });
  });

  describe('create()', () => {
    it('should create risk', async () => {
      mockRequest.body = {
        title: 'Security Vulnerability',
        severity: 'High',
        description: 'Critical vulnerability found',
        category: 'Security',
      };

      const mockRisk = {
        id: 'risk-123',
        ...mockRequest.body,
        organizationId: 'org-123',
      };

      (prismaMock.riskItem.create as jest.Mock<any>).mockResolvedValue(mockRisk as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      await risksController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error if required fields missing', async () => {
      mockRequest.body = { title: 'Risk' };

      await expect(
        risksController.create(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('prioritize()', () => {
    it('should prioritize risks using AI', async () => {
      const risks = [
        { id: 'risk-1', description: 'Risk 1', severity: 'High' },
      ];

      const prioritized = [
        { id: 'risk-1', score: 95, rationale: 'Critical' },
      ];

      (prismaMock.riskItem.findMany as jest.Mock<any>).mockResolvedValue(risks as any);
      (prismaMock.riskItem.update as jest.Mock<any>).mockResolvedValue({} as any);
      (prismaMock.auditLog.create as jest.Mock<any>).mockResolvedValue({} as any);

      // Re-mock geminiService.prioritizeRisks since resetMocks clears mock implementations
      const geminiService = require('../../../services/geminiService').default;
      (geminiService.prioritizeRisks as jest.Mock<any>).mockResolvedValue(prioritized as any);

      await risksController.prioritize(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(prioritized);
    });
  });
});
