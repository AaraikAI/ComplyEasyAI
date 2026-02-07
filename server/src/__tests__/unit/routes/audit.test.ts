import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../controllers/auditController', () => ({
  __esModule: true,
  default: {
    list: jest.fn(),
    log: jest.fn(),
  },
}));

import router from '../../../routes/audit';

describe('Audit Routes', () => {
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

  it('should have GET / route for listing audit logs (admin/editor)', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/' && r.methods.includes('get'))).toBeDefined();
  });

  it('should have POST / route for creating audit log entries', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/' && r.methods.includes('post'))).toBeDefined();
  });

  it('should have exactly 2 routes', () => {
    const routes = router.stack.filter((layer: any) => layer.route);
    expect(routes.length).toBe(2);
  });
});
