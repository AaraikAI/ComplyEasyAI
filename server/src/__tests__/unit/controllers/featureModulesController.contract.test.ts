/**
 * Feature Modules Controller Contract Tests
 *
 * Validates the contract for all feature module CRUD endpoints:
 * governance bodies, meetings, decisions, escalation paths, breach notifications, etc.
 * These are exported as named functions (not a class).
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

import {
  listGovernanceBodies,
  createGovernanceBody,
  updateGovernanceBody,
  deleteGovernanceBody,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  createDecision,
  updateDecision,
} from '../../../controllers/featureModulesController';
import { AppError } from '../../../middleware/errorHandler';

/**
 * Invokes a controller and captures the thrown error.
 */
async function captureThrown(fn: () => Promise<unknown>): Promise<AppError> {
  try {
    await fn();
  } catch (err) {
    return err as AppError;
  }
  throw new Error('Expected controller to throw, but it resolved.');
}

describe('FeatureModulesController Contract Tests', () => {
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
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
      },
      headers: {},
    } as any;

    mockRes = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn() as unknown as NextFunction;
  });

  // ===========================================================================
  // Governance Bodies
  // ===========================================================================
  describe('listGovernanceBodies()', () => {
    it('should list bodies filtered by organizationId', async () => {
      const bodies = [
        { id: 'gb-1', name: 'Security Committee', organizationId: 'org-123' },
      ];
      (prismaMock.governanceBody.findMany as jest.Mock<any>).mockResolvedValue(bodies as never);

      await listGovernanceBodies(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.governanceBody.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-123' },
          include: expect.objectContaining({
            meetings: expect.any(Object),
            decisions: expect.any(Object),
            escalationPaths: true,
          }),
          orderBy: { createdAt: 'desc' },
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(bodies);
    });
  });

  describe('createGovernanceBody()', () => {
    it('should create body with status 201', async () => {
      mockReq.body = { name: 'Audit Committee', type: 'Committee' };

      const created = { id: 'gb-new', name: 'Audit Committee', type: 'Committee', organizationId: 'org-123' };
      (prismaMock.governanceBody.create as jest.Mock<any>).mockResolvedValue(created as never);

      await createGovernanceBody(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(prismaMock.governanceBody.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-123',
            name: 'Audit Committee',
            type: 'Committee',
          }),
        })
      );
    });

    it('should throw AppError(400) when name is missing', async () => {
      mockReq.body = { type: 'Committee' };

      const err = await captureThrown(() =>
        createGovernanceBody(mockReq as Request, mockRes as Response, mockNext) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('name and type are required');
    });

    it('should throw AppError(400) when type is missing', async () => {
      mockReq.body = { name: 'Audit Committee' };

      const err = await captureThrown(() =>
        createGovernanceBody(mockReq as Request, mockRes as Response, mockNext) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
    });
  });

  describe('updateGovernanceBody()', () => {
    it('should update body and return result', async () => {
      mockReq.params = { id: 'gb-1' };
      mockReq.body = { name: 'Updated Committee' };

      const updated = { id: 'gb-1', name: 'Updated Committee' };
      (prismaMock.governanceBody.update as jest.Mock<any>).mockResolvedValue(updated as never);

      await updateGovernanceBody(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.governanceBody.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'gb-1' },
          data: mockReq.body,
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(updated);
    });
  });

  describe('deleteGovernanceBody()', () => {
    it('should delete body and return success', async () => {
      mockReq.params = { id: 'gb-1' };

      (prismaMock.governanceBody.delete as jest.Mock<any>).mockResolvedValue({} as never);

      await deleteGovernanceBody(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.governanceBody.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'gb-1' } })
      );
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
  });

  // ===========================================================================
  // Governance Meetings
  // ===========================================================================
  describe('createMeeting()', () => {
    it('should create meeting with status 201', async () => {
      mockReq.body = {
        governanceBodyId: 'gb-1',
        title: 'Q1 Review',
        date: '2026-04-01T10:00:00Z',
      };

      const created = { id: 'mtg-1', title: 'Q1 Review' };
      (prismaMock.governanceMeeting.create as jest.Mock<any>).mockResolvedValue(created as never);

      await createMeeting(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(prismaMock.governanceMeeting.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            governanceBodyId: 'gb-1',
            title: 'Q1 Review',
            date: expect.any(Date),
          }),
        })
      );
    });

    it('should throw AppError(400) for missing required fields', async () => {
      mockReq.body = { title: 'Q1 Review' }; // missing governanceBodyId and date

      const err = await captureThrown(() =>
        createMeeting(mockReq as Request, mockRes as Response, mockNext) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('governanceBodyId, title, and date are required');
    });
  });

  describe('updateMeeting()', () => {
    it('should update meeting', async () => {
      mockReq.params = { id: 'mtg-1' };
      mockReq.body = { title: 'Updated Meeting' };

      const updated = { id: 'mtg-1', title: 'Updated Meeting' };
      (prismaMock.governanceMeeting.update as jest.Mock<any>).mockResolvedValue(updated as never);

      await updateMeeting(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(updated);
    });
  });

  describe('deleteMeeting()', () => {
    it('should delete meeting', async () => {
      mockReq.params = { id: 'mtg-1' };

      (prismaMock.governanceMeeting.delete as jest.Mock<any>).mockResolvedValue({} as never);

      await deleteMeeting(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
  });

  // ===========================================================================
  // Governance Decisions
  // ===========================================================================
  describe('createDecision()', () => {
    it('should create decision with status 201', async () => {
      mockReq.body = {
        governanceBodyId: 'gb-1',
        title: 'Approve Policy',
        decisionType: 'approval',
      };

      const created = { id: 'dec-1', title: 'Approve Policy' };
      (prismaMock.governanceDecision.create as jest.Mock<any>).mockResolvedValue(created as never);

      await createDecision(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should throw AppError(400) for missing required fields', async () => {
      mockReq.body = { title: 'Approve Policy' }; // missing governanceBodyId and decisionType

      const err = await captureThrown(() =>
        createDecision(mockReq as Request, mockRes as Response, mockNext) as Promise<unknown>
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('governanceBodyId, title, and decisionType are required');
    });
  });

  describe('updateDecision()', () => {
    it('should update decision', async () => {
      mockReq.params = { id: 'dec-1' };
      mockReq.body = { status: 'approved' };

      const updated = { id: 'dec-1', status: 'approved' };
      (prismaMock.governanceDecision.update as jest.Mock<any>).mockResolvedValue(updated as never);

      await updateDecision(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(updated);
    });
  });
});
