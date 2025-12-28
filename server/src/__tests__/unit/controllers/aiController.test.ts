/**
 * AI Controller Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// Mock Gemini Service
const mockGenerateComplianceReport = jest.fn();
const mockGeneratePolicy = jest.fn();
const mockAnalyzeContract = jest.fn();
const mockPerformGapAnalysis = jest.fn();
const mockGenerateRFPResponse = jest.fn();
const mockGeneratePhishingSimulation = jest.fn();
const mockScoreVendorRisk = jest.fn();
const mockGenerateDataMap = jest.fn();
const mockGenerateBCP = jest.fn();

jest.mock('../../../services/geminiService', () => ({
  __esModule: true,
  default: {
    generateComplianceReport: mockGenerateComplianceReport,
    generatePolicy: mockGeneratePolicy,
    analyzeContract: mockAnalyzeContract,
    performGapAnalysis: mockPerformGapAnalysis,
    generateRFPResponse: mockGenerateRFPResponse,
    generatePhishingSimulation: mockGeneratePhishingSimulation,
    scoreVendorRisk: mockScoreVendorRisk,
    generateDataMap: mockGenerateDataMap,
    generateBCP: mockGenerateBCP,
  },
}));

// Mock Secure Chat Service
const mockChatWithUser = jest.fn();

jest.mock('../../../services/secureChatService', () => ({
  __esModule: true,
  default: {
    chatWithUser: mockChatWithUser,
  },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import aiController from '../../../controllers/aiController';
import { AppError } from '../../../middleware/errorHandler';

describe('AIController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
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

  describe('generateReport()', () => {
    it('should generate compliance report', async () => {
      mockRequest.body = {
        framework: 'SOC 2',
        companyName: 'Test Company',
        context: 'Annual audit',
      };

      mockGenerateComplianceReport.mockResolvedValue('# Compliance Report\n\n...');

      await aiController.generateReport(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGenerateComplianceReport).toHaveBeenCalledWith(
        'SOC 2',
        'Test Company',
        'Annual audit',
        'user-123'
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          report: expect.any(String),
        })
      );
    });

    it('should throw error if required fields missing', async () => {
      mockRequest.body = { framework: 'SOC 2' };

      await expect(
        aiController.generateReport(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);
    });
  });

  describe('generatePolicy()', () => {
    it('should generate policy', async () => {
      mockRequest.body = {
        type: 'Security Policy',
        company: 'Test Company',
        tone: 'professional',
      };

      mockGeneratePolicy.mockResolvedValue('# Security Policy\n\n...');

      await aiController.generatePolicy(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGeneratePolicy).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('analyzeContract()', () => {
    it('should analyze contract', async () => {
      mockRequest.body = {
        text: 'Contract text here...',
      };

      mockAnalyzeContract.mockResolvedValue('Contract analysis...');

      await aiController.analyzeContract(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAnalyzeContract).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('performGapAnalysis()', () => {
    it('should perform gap analysis', async () => {
      mockRequest.body = {
        current: 'Current state',
        target: 'Target state',
      };

      mockPerformGapAnalysis.mockResolvedValue('Gap analysis...');

      await aiController.performGapAnalysis(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockPerformGapAnalysis).toHaveBeenCalled();
    });
  });

  describe('chat()', () => {
    it('should handle chat message', async () => {
      mockRequest.body = {
        message: 'What is SOC 2?',
      };

      mockChatWithUser.mockResolvedValue({
        response: 'SOC 2 is a compliance framework...',
        sources: [],
        encrypted: true,
      });

      await aiController.chat(mockRequest as Request, mockResponse as Response);

      expect(mockChatWithUser).toHaveBeenCalledWith('What is SOC 2?', 'user-123', 'org-123');
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });
});

