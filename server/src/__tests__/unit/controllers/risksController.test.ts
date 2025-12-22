/**
 * Risks Controller Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../services/geminiService', () => ({
  __esModule: true,
  default: {
    prioritizeRisks: jest.fn().mockResolvedValue([
      { id: 'risk-1', score: 95, rationale: 'Critical' },
    ]),
    generateRemediationPlan: jest.fn().mockResolvedValue('# Remediation Plan\n\n...'),
  },
}));

import risksController from '../../../controllers/risksController';
import { AppError } from '../../../middleware/errorHandler';

describe('RisksController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

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
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('list()', () => {
    it('should list risks for organization', async () => {
      const mockRisks = [
        { id: 'risk-1', title: 'Risk 1', severity: 'High' },
        { id: 'risk-2', title: 'Risk 2', severity: 'Medium' },
      ];

      prismaMock.riskItem.findMany.mockResolvedValue(mockRisks as any);

      await risksController.list(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(mockRisks);
    });

    it('should filter by status', async () => {
      mockRequest.query = { status: 'Open' };

      prismaMock.riskItem.findMany.mockResolvedValue([]);

      await risksController.list(mockRequest as Request, mockResponse as Response);

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

      prismaMock.riskItem.create.mockResolvedValue(mockRisk as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await risksController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error if required fields missing', async () => {
      mockRequest.body = { title: 'Risk' };

      await expect(
        risksController.create(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('prioritize()', () => {
    it('should prioritize risks using AI', async () => {
      const risks = [
        { id: 'risk-1', description: 'Risk 1', severity: 'High' },
      ];

      prismaMock.riskItem.findMany.mockResolvedValue(risks as any);

      await risksController.prioritize(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalled();
    });
  });
});

