import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../controllers/demoController', () => ({
  demoController: {
    submitDemoRequest: jest.fn(),
    getAllDemoRequests: jest.fn(),
    getDemoStats: jest.fn(),
    getDemoRequest: jest.fn(),
    updateDemoRequest: jest.fn(),
    scheduleDemo: jest.fn(),
    markAsConverted: jest.fn(),
    deleteDemoRequest: jest.fn(),
  },
}));

import router from '../../../routes/demo';

describe('Demo Routes', () => {
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

  it('should have POST /request public route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/request' && r.methods.includes('post'))).toBeDefined();
  });

  it('should have admin routes for demo management', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/requests' && r.methods.includes('get'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/requests/stats' && r.methods.includes('get'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/requests/:id' && r.methods.includes('get'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/requests/:id' && r.methods.includes('put'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/requests/:id' && r.methods.includes('delete'))).toBeDefined();
  });

  it('should have POST /requests/:id/schedule route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/requests/:id/schedule');
  });

  it('should have POST /requests/:id/convert route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/requests/:id/convert');
  });
});
