import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../types/express', () => ({
  asyncHandler: jest.fn((fn: any) => fn),
}));

jest.mock('../../../middleware/validate', () => ({
  validateBody: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../validators/billingSchemas', () => ({
  checkoutSchema: {},
  changeTierSchema: {},
  cancelSubscriptionSchema: {},
  addAddonSchema: {},
  requestQuoteSchema: {},
}));

jest.mock('../../../controllers/billingController', () => ({
  __esModule: true,
  default: {
    webhook: jest.fn(),
    getSubscription: jest.fn(),
    getAvailableTiers: jest.fn(),
    getUsageMetrics: jest.fn(),
    getSubscriptionHistory: jest.fn(),
    createCheckout: jest.fn(),
    createPortalSession: jest.fn(),
    previewTierChange: jest.fn(),
    changeTier: jest.fn(),
    cancelSubscription: jest.fn(),
    reactivateSubscription: jest.fn(),
    processRefund: jest.fn(),
    addAddOn: jest.fn(),
    removeAddOn: jest.fn(),
    requestQuote: jest.fn(),
    getAvailableFeatures: jest.fn(),
    getFeatureSubscriptions: jest.fn(),
    subscribeToFeature: jest.fn(),
    unsubscribeFromFeature: jest.fn(),
    checkFeatureAccess: jest.fn(),
    getAvailableBundles: jest.fn(),
    subscribeToBundle: jest.fn(),
  },
}));

import router from '../../../routes/billing';

describe('Billing Routes', () => {
  it('should export an Express router', () => {
    expect(router).toBeDefined();
    expect(typeof router).toBe('function');
  });

  it('should have registered routes in the stack', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should have POST /webhook public route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/webhook' && r.methods.includes('post'))).toBeDefined();
  });

  it('should have subscription management routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/subscription');
    expect(routes).toContain('/tiers');
    expect(routes).toContain('/usage');
    expect(routes).toContain('/history');
  });

  it('should have checkout and portal routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/checkout');
    expect(routes).toContain('/portal');
  });

  it('should have tier change routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/preview-change');
    expect(routes).toContain('/change-tier');
    expect(routes).toContain('/cancel');
    expect(routes).toContain('/reactivate');
  });

  it('should have add-on routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/addons' && r.methods.includes('post'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/addons/:addOnId' && r.methods.includes('delete'))).toBeDefined();
  });

  it('should have feature subscription routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/features');
    expect(routes).toContain('/features/subscriptions');
    expect(routes).toContain('/features/:featureId/subscribe');
    expect(routes).toContain('/features/:featureId/unsubscribe');
    expect(routes).toContain('/features/:featureId/access');
  });

  it('should have bundle routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/bundles');
    expect(routes).toContain('/bundles/:bundleId/subscribe');
  });
});
