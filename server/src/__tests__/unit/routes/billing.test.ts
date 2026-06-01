/**
 * Billing Routes — security-wiring unit tests.
 *
 * Mounts the real billing router with auth/authorize/validate replaced by IDENTIFIABLE
 * tagged stand-ins, then inspects the router stack to prove each route carries the
 * guards it must. This deterministically catches an accidental removal of an auth or
 * admin-authorize guard (the previous version relied on a fragile mock-call count that
 * recorded zero calls). Public vs. protected ordering is asserted against the stack.
 */

import { jest, describe, it, expect } from '@jest/globals';

// Tagged middleware factory mocks: each guard is recognizable on the route's handler stack.
const authenticateMw: any = (_req: any, _res: any, next: any) => next();
authenticateMw.__guard = 'authenticate';

jest.mock('../../../middleware/auth', () => ({
  authenticate: authenticateMw,
  authorize: jest.fn((...roles: string[]) => {
    const mw: any = (_req: any, _res: any, next: any) => next();
    mw.__guard = 'authorize';
    mw.__roles = roles;
    return mw;
  }),
}));

jest.mock('../../../types/express', () => ({
  asyncHandler: jest.fn((fn: any) => fn),
}));

jest.mock('../../../middleware/validate', () => ({
  validateBody: jest.fn(() => {
    const mw: any = (_req: any, _res: any, next: any) => next();
    mw.__guard = 'validateBody';
    return mw;
  }),
}));

jest.mock('../../../validators/billingSchemas', () => ({
  checkoutSchema: {}, changeTierSchema: {}, cancelSubscriptionSchema: {}, addAddonSchema: {}, requestQuoteSchema: {},
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../services/tierService', () => ({
  __esModule: true,
  default: { getOrganizationTier: jest.fn(), compareTiers: jest.fn() },
}));

const controllerMethods = [
  'webhook', 'getSubscription', 'getAvailableTiers', 'getUsageMetrics', 'getSubscriptionHistory',
  'createCheckout', 'createPortalSession', 'previewTierChange', 'changeTier', 'cancelSubscription',
  'reactivateSubscription', 'processRefund', 'addAddOn', 'removeAddOn', 'requestQuote',
  'getAvailableFeatures', 'getFeatureSubscriptions', 'subscribeToFeature', 'unsubscribeFromFeature',
  'checkFeatureAccess', 'getAvailableBundles', 'subscribeToBundle',
];
jest.mock('../../../controllers/billingController', () => ({
  __esModule: true,
  default: Object.fromEntries(controllerMethods.map((m) => [m, jest.fn()])),
}));

import router from '../../../routes/billing';

// Returns the route layer for a given method+path, or undefined.
function routeLayer(method: string, path: string): any {
  return (router.stack as any[]).find(
    (l) => l.route && l.route.path === path && l.route.methods[method]
  );
}

// The guard tags present on a route's handler stack.
function guardsOn(method: string, path: string): string[] {
  const layer = routeLayer(method, path);
  if (!layer) return [];
  return (layer.route.stack as any[])
    .map((s) => s.handle && s.handle.__guard)
    .filter(Boolean);
}

// Index of the router-level authenticate middleware (router.use(authenticate)).
function authenticateLayerIndex(): number {
  return (router.stack as any[]).findIndex((l) => !l.route && l.handle === authenticateMw);
}

function routeLayerIndex(path: string): number {
  return (router.stack as any[]).findIndex((l) => l.route && l.route.path === path);
}

describe('Billing Routes — security wiring', () => {
  it('exports a mounted Express router', () => {
    expect(typeof router).toBe('function');
    expect(Array.isArray(router.stack)).toBe(true);
  });

  it('mounts authenticate as a router-level guard', () => {
    expect(authenticateLayerIndex()).toBeGreaterThanOrEqual(0);
  });

  it('keeps POST /webhook public (registered before the authenticate guard)', () => {
    const webhookIdx = routeLayerIndex('/webhook');
    const authIdx = authenticateLayerIndex();
    expect(webhookIdx).toBeGreaterThanOrEqual(0);
    expect(webhookIdx).toBeLessThan(authIdx);
    // The public webhook route carries NO authenticate/authorize guard on its own stack.
    expect(guardsOn('post', '/webhook')).not.toContain('authorize');
  });

  it('registers protected read routes after the authenticate guard', () => {
    const authIdx = authenticateLayerIndex();
    for (const p of ['/subscription', '/usage', '/history']) {
      expect(routeLayerIndex(p)).toBeGreaterThan(authIdx);
    }
  });

  it('guards every admin-only mutating route with authorize("admin")', () => {
    const adminRoutes: Array<[string, string]> = [
      ['post', '/checkout'],
      ['post', '/portal'],
      ['post', '/preview-change'],
      ['post', '/change-tier'],
      ['post', '/cancel'],
      ['post', '/reactivate'],
      ['post', '/refund'],
      ['post', '/addons'],
      ['delete', '/addons/:addOnId'],
      ['post', '/quote'],
      ['post', '/features/:featureId/subscribe'],
      ['delete', '/features/:featureId/unsubscribe'],
      ['post', '/bundles/:bundleId/subscribe'],
    ];
    for (const [method, path] of adminRoutes) {
      const layer = routeLayer(method, path);
      expect(layer).toBeDefined();
      const guards = guardsOn(method, path);
      // Each admin route must include an authorize guard on its stack.
      expect(guards).toContain('authorize');
      // And that authorize guard must have been wired with the 'admin' role.
      const authorizeStackEntry = (layer.route.stack as any[]).find((s) => s.handle && s.handle.__guard === 'authorize');
      expect(authorizeStackEntry.handle.__roles).toContain('admin');
    }
  });

  it('applies validateBody on mutating routes that accept a body', () => {
    for (const path of ['/checkout', '/change-tier', '/cancel', '/addons', '/quote']) {
      expect(guardsOn('post', path)).toContain('validateBody');
    }
  });

  it('registers the documented subscription/feature/bundle routes', () => {
    const paths = (router.stack as any[]).filter((l) => l.route).map((l) => l.route.path);
    for (const p of ['/subscription', '/tiers', '/usage', '/history', '/checkout', '/portal',
      '/features', '/features/subscriptions', '/bundles']) {
      expect(paths).toContain(p);
    }
  });
});
