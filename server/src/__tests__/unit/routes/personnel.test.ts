import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../services/personnelService', () => ({
  __esModule: true,
  default: {
    createPersonnel: jest.fn(),
    completeOnboarding: jest.fn(),
    startOffboarding: jest.fn(),
    createAccessReview: jest.fn(),
    completeAccessReview: jest.fn(),
    getPersonnelByOrganization: jest.fn(),
    getPendingAccessReviews: jest.fn(),
    getComplianceSummary: jest.fn(),
  },
}));

import router from '../../../routes/personnel';

describe('Personnel Routes', () => {
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

  it('should have POST / route for creating personnel', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/' && r.methods.includes('post'))).toBeDefined();
  });

  it('should have GET / route for listing personnel', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/' && r.methods.includes('get'))).toBeDefined();
  });

  it('should have onboarding and offboarding routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/:id/complete-onboarding');
    expect(routes).toContain('/:id/start-offboarding');
  });

  it('should have access review routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/access-reviews');
    expect(routes).toContain('/access-reviews/:id/complete');
    expect(routes).toContain('/access-reviews/pending');
  });

  it('should have GET /compliance-summary route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/compliance-summary');
  });
});
