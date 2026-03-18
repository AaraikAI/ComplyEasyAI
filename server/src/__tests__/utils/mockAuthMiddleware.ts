/**
 * Reusable Auth Middleware Mock
 * Extracts the auth mocking pattern used across all integration tests
 */

import { jest } from '@jest/globals';

/**
 * Creates standard auth middleware mocks
 * Use with: jest.mock('../../../middleware/auth', () => createMockAuthMiddleware())
 */
export function createMockAuthMiddleware() {
  return {
    authenticate: (req: any, res: any, next: any) => {
      if ((req as any).user) {
        next();
        return;
      }
      res.status(401).json({ error: 'No token provided' });
    },
    authorize: (..._roles: string[]) => (req: any, res: any, next: any) => {
      if (!(req as any).user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const allowedRoles = _roles.map(r => r.toLowerCase());
      const userRole = ((req as any).user?.role || '').toLowerCase();
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      next();
    },
    AuthRequest: {},
  };
}

/**
 * Creates tier middleware mocks
 */
export function createMockTierMiddleware() {
  return {
    requireTier: (..._tiers: string[]) => (_req: any, _res: any, next: any) => next(),
    requireFeature: (_feature: string) => (_req: any, _res: any, next: any) => next(),
    requireAiFeature: (_feature: string) => (_req: any, _res: any, next: any) => next(),
    enforceLimit: (_limit: string) => (_req: any, _res: any, next: any) => next(),
  };
}

/**
 * Creates CSRF middleware mock
 */
export function createMockCsrfMiddleware() {
  return {
    csrfProtection: (_req: any, _res: any, next: any) => next(),
    setCsrfToken: (_req: any, _res: any, next: any) => next(),
  };
}

/**
 * Creates rate limiter mock
 */
export function createMockRateLimiter() {
  return {
    authLimiter: (_req: any, _res: any, next: any) => next(),
    apiLimiter: (_req: any, _res: any, next: any) => next(),
    frameworkLimiter: (_req: any, _res: any, next: any) => next(),
    aiLimiter: (_req: any, _res: any, next: any) => next(),
  };
}
