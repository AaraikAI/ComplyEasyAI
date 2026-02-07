import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../middleware/tierMiddleware', () => ({
  enforceLimit: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../services/vendorRiskService', () => ({
  __esModule: true,
  default: {
    createVendor: jest.fn(),
    createVendorAssessment: jest.fn(),
    completeVendorAssessment: jest.fn(),
    getVendorRiskDashboard: jest.fn(),
    getVendorsByOrganization: jest.fn(),
    getVendorScorecard: jest.fn(),
    getVendorById: jest.fn(),
    updateVendor: jest.fn(),
    archiveVendor: jest.fn(),
  },
}));

import router from '../../../routes/vendors';

describe('Vendors Routes', () => {
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

  it('should have POST / route for creating vendors', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/' && r.methods.includes('post'))).toBeDefined();
  });

  it('should have GET / route for listing vendors', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/' && r.methods.includes('get'))).toBeDefined();
  });

  it('should have vendor assessment routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/:id/assessments');
    expect(routes).toContain('/assessments/:id/complete');
  });

  it('should have GET /dashboard route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/dashboard');
  });

  it('should have vendor CRUD routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/:id' && r.methods.includes('get'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/:id' && r.methods.includes('put'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/:id' && r.methods.includes('delete'))).toBeDefined();
  });

  it('should have GET /:id/scorecard route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/:id/scorecard');
  });
});
