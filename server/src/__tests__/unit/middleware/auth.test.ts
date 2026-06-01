import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Mocks – must be declared before importing the module under test
// ---------------------------------------------------------------------------

const mockSign = jest.fn();
const mockVerify = jest.fn();

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: (...args: unknown[]) => mockSign(...args),
    verify: (...args: unknown[]) => mockVerify(...args),
  },
  sign: (...args: unknown[]) => mockSign(...args),
  verify: (...args: unknown[]) => mockVerify(...args),
}));

jest.mock('../../../config', () => ({
  __esModule: true,
  default: {
    jwt: {
      secret: 'test-jwt-secret-key-for-testing-purposes-only-min-32-chars',
      expiresIn: '1h',
      refreshSecret: 'test-refresh-secret-key-for-testing-purposes-only-min-32-chars',
      refreshExpiresIn: '7d',
    },
  },
}));

const mockFindUnique = jest.fn();

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
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

const mockSetUserContext = jest.fn();

jest.mock('../../../config/monitoring', () => ({
  __esModule: true,
  default: {
    setUserContext: (...args: unknown[]) => mockSetUserContext(...args),
    captureException: jest.fn(),
  },
}));

const mockUpdateSessionActivity = jest.fn();

jest.mock('../../../services/sessionManagementService', () => ({
  __esModule: true,
  default: {
    updateSessionActivity: (...args: unknown[]) => mockUpdateSessionActivity(...args),
  },
}));

// ---------------------------------------------------------------------------
// Import the module under test
// ---------------------------------------------------------------------------

import {
  authenticate,
  authorize,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../../middleware/auth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReq(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    headers: {},
    ...overrides,
  };
}

function buildRes(): { res: Partial<Response>; statusFn: jest.Mock; jsonFn: jest.Mock } {
  const jsonFn = jest.fn().mockReturnThis() as jest.Mock;
  const statusFn = jest.fn().mockReturnValue({ json: jsonFn }) as jest.Mock;
  return {
    res: { status: statusFn, json: jsonFn } as unknown as Partial<Response>,
    statusFn,
    jsonFn,
  };
}

function buildNext(): jest.Mock {
  return jest.fn() as jest.Mock;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // authenticate
  // =========================================================================

  describe('authenticate', () => {
    it('should return 401 when no authorization header is provided', async () => {
      const req = buildReq();
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      await (authenticate as Function)(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', async () => {
      const req = buildReq({
        headers: { authorization: 'Basic some-token' },
      } as Partial<Request>);
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      await (authenticate as Function)(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is empty string', async () => {
      const req = buildReq({
        headers: { authorization: '' },
      } as Partial<Request>);
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      await (authenticate as Function)(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when jwt.verify throws an error (invalid token)', async () => {
      mockVerify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      const req = buildReq({
        headers: { authorization: 'Bearer invalid-token' },
      } as Partial<Request>);
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      await (authenticate as Function)(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found in database', async () => {
      const decoded = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org-1',
      };
      mockVerify.mockReturnValue(decoded);
      mockFindUnique.mockResolvedValue(null);

      const req = buildReq({
        headers: { authorization: 'Bearer valid-token' },
      } as Partial<Request>);
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      await (authenticate as Function)(req, res, next);

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { organization: true },
      });
      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should set req.user and call next() when token is valid and user exists', async () => {
      const decoded = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org-1',
      };
      const dbUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org-1',
        organization: { id: 'org-1', name: 'Test Org' },
      };
      mockVerify.mockReturnValue(decoded);
      mockFindUnique.mockResolvedValue(dbUser);
      mockUpdateSessionActivity.mockResolvedValue(undefined);

      const req = buildReq({
        headers: { authorization: 'Bearer valid-token' },
      } as Partial<Request>);
      const { res } = buildRes();
      const next = buildNext();

      await (authenticate as Function)(req, res, next);

      expect((req as any).user).toEqual(dbUser);
      expect(next).toHaveBeenCalled();
    });

    it('should call monitoring.setUserContext with user details', async () => {
      const decoded = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org-1',
      };
      const dbUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org-1',
        organization: { id: 'org-1', name: 'Test Org' },
      };
      mockVerify.mockReturnValue(decoded);
      mockFindUnique.mockResolvedValue(dbUser);
      mockUpdateSessionActivity.mockResolvedValue(undefined);

      const req = buildReq({
        headers: { authorization: 'Bearer valid-token' },
      } as Partial<Request>);
      const { res } = buildRes();
      const next = buildNext();

      await (authenticate as Function)(req, res, next);

      expect(mockSetUserContext).toHaveBeenCalledWith('user-123', 'test@example.com', 'org-1');
    });

    it('should attempt to update session activity', async () => {
      const decoded = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org-1',
      };
      const dbUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org-1',
        organization: { id: 'org-1', name: 'Test Org' },
      };
      mockVerify.mockReturnValue(decoded);
      mockFindUnique.mockResolvedValue(dbUser);
      mockUpdateSessionActivity.mockResolvedValue(undefined);

      const req = buildReq({
        headers: { authorization: 'Bearer valid-token' },
      } as Partial<Request>);
      const { res } = buildRes();
      const next = buildNext();

      await (authenticate as Function)(req, res, next);

      expect(mockUpdateSessionActivity).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should still call next() if session management update fails', async () => {
      const decoded = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org-1',
      };
      const dbUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org-1',
        organization: { id: 'org-1', name: 'Test Org' },
      };
      mockVerify.mockReturnValue(decoded);
      mockFindUnique.mockResolvedValue(dbUser);
      mockUpdateSessionActivity.mockRejectedValue(new Error('Session service down'));

      const req = buildReq({
        headers: { authorization: 'Bearer valid-token' },
      } as Partial<Request>);
      const { res } = buildRes();
      const next = buildNext();

      await (authenticate as Function)(req, res, next);

      // Should still proceed even if session management fails
      expect(next).toHaveBeenCalled();
    });

    it('should return 500 when an unexpected error occurs', async () => {
      // Simulate a scenario where accessing req.headers throws
      const req = {
        get headers(): any {
          throw new Error('Unexpected failure');
        },
      } as any;
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      await (authenticate as Function)(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(500);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'Authentication error' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should extract the token correctly from Bearer prefix', async () => {
      const specificToken = 'my.specific.jwt.token';
      const decoded = {
        userId: 'user-456',
        email: 'user@example.com',
        role: 'user',
        organizationId: 'org-2',
      };
      const dbUser = {
        id: 'user-456',
        email: 'user@example.com',
        role: 'user',
        organizationId: 'org-2',
        organization: { id: 'org-2', name: 'Org 2' },
      };
      mockVerify.mockReturnValue(decoded);
      mockFindUnique.mockResolvedValue(dbUser);
      mockUpdateSessionActivity.mockResolvedValue(undefined);

      const req = buildReq({
        headers: { authorization: `Bearer ${specificToken}` },
      } as Partial<Request>);
      const { res } = buildRes();
      const next = buildNext();

      await (authenticate as Function)(req, res, next);

      // jwt.verify must pin the algorithm (HS256) to block alg-downgrade / "none" attacks (COV-9).
      expect(mockVerify).toHaveBeenCalledWith(
        specificToken,
        'test-jwt-secret-key-for-testing-purposes-only-min-32-chars',
        { algorithms: ['HS256'] }
      );
    });
  });

  // =========================================================================
  // authorize
  // =========================================================================

  describe('authorize', () => {
    it('should return 401 when no user is attached to request', () => {
      const middleware = authorize('admin');
      const req = buildReq() as Request;
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      middleware(req, res as Response, next);

      expect(statusFn).toHaveBeenCalledWith(401);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user role is not in allowed roles', () => {
      const middleware = authorize('admin');
      const req = buildReq() as any;
      req.user = { id: 'user-1', role: 'viewer', email: 'viewer@test.com' };
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      middleware(req as Request, res as Response, next);

      expect(statusFn).toHaveBeenCalledWith(403);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() when user role is in allowed roles', () => {
      const middleware = authorize('admin', 'editor');
      const req = buildReq() as any;
      req.user = { id: 'user-1', role: 'admin', email: 'admin@test.com' };
      const { res } = buildRes();
      const next = buildNext();

      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should accept multiple roles and allow any matching role', () => {
      const middleware = authorize('admin', 'editor', 'viewer');
      const req = buildReq() as any;
      req.user = { id: 'user-1', role: 'editor', email: 'editor@test.com' };
      const { res } = buildRes();
      const next = buildNext();

      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject a role that is not in the allowed list of multiple roles', () => {
      const middleware = authorize('admin', 'editor');
      const req = buildReq() as any;
      req.user = { id: 'user-1', role: 'viewer', email: 'viewer@test.com' };
      const { res, statusFn, jsonFn } = buildRes();
      const next = buildNext();

      middleware(req as Request, res as Response, next);

      expect(statusFn).toHaveBeenCalledWith(403);
      expect(jsonFn).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
    });
  });

  // =========================================================================
  // generateToken
  // =========================================================================

  describe('generateToken', () => {
    it('should call jwt.sign with the correct payload and options', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org-1',
      };
      mockSign.mockReturnValue('generated-token');

      const result = generateToken(payload);

      expect(mockSign).toHaveBeenCalledWith(
        payload,
        'test-jwt-secret-key-for-testing-purposes-only-min-32-chars',
        { expiresIn: '1h' }
      );
      expect(result).toBe('generated-token');
    });

    it('should return a string value', () => {
      mockSign.mockReturnValue('a-jwt-token-string');

      const result = generateToken({
        userId: 'u1',
        email: 'e@t.com',
        role: 'user',
        organizationId: 'o1',
      });

      expect(typeof result).toBe('string');
    });

    it('should include the full payload in the token', () => {
      const payload = {
        userId: 'user-abc',
        email: 'abc@test.com',
        role: 'editor',
        organizationId: 'org-xyz',
      };
      mockSign.mockReturnValue('token');

      generateToken(payload);

      const signedPayload = mockSign.mock.calls[0][0];
      expect(signedPayload).toEqual(payload);
      expect(signedPayload.userId).toBe('user-abc');
      expect(signedPayload.email).toBe('abc@test.com');
      expect(signedPayload.role).toBe('editor');
      expect(signedPayload.organizationId).toBe('org-xyz');
    });
  });

  // =========================================================================
  // generateRefreshToken
  // =========================================================================

  describe('generateRefreshToken', () => {
    it('should call jwt.sign with userId and refresh secret', () => {
      mockSign.mockReturnValue('refresh-token');

      const result = generateRefreshToken('user-123');

      expect(mockSign).toHaveBeenCalledWith(
        { userId: 'user-123' },
        'test-refresh-secret-key-for-testing-purposes-only-min-32-chars',
        { expiresIn: '7d' }
      );
      expect(result).toBe('refresh-token');
    });

    it('should return a string', () => {
      mockSign.mockReturnValue('some-refresh-token');

      const result = generateRefreshToken('u1');

      expect(typeof result).toBe('string');
    });
  });

  // =========================================================================
  // verifyRefreshToken
  // =========================================================================

  describe('verifyRefreshToken', () => {
    it('should return userId when token is valid', () => {
      mockVerify.mockReturnValue({ userId: 'user-123' });

      const result = verifyRefreshToken('valid-refresh-token');

      // The refresh-token verify must also pin algorithms to HS256 (COV-9).
      expect(mockVerify).toHaveBeenCalledWith(
        'valid-refresh-token',
        'test-refresh-secret-key-for-testing-purposes-only-min-32-chars',
        { algorithms: ['HS256'] }
      );
      expect(result).toBe('user-123');
    });

    it('should return null when token is invalid', () => {
      mockVerify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      const result = verifyRefreshToken('bad-token');

      expect(result).toBeNull();
    });

    it('should return null when token is expired', () => {
      mockVerify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      const result = verifyRefreshToken('expired-token');

      expect(result).toBeNull();
    });
  });
});
