import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../controllers/twoFactorController', () => ({
  setupTwoFactor: jest.fn(),
  verifyAndEnable: jest.fn(),
  verifyToken: jest.fn(),
  verifyBackupCode: jest.fn(),
  disableTwoFactor: jest.fn(),
  regenerateBackupCodes: jest.fn(),
  getTwoFactorStatus: jest.fn(),
}));

import router from '../../../routes/twoFactor';

describe('Two Factor Routes', () => {
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

  it('should have POST /setup route (authenticated)', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/setup' && r.methods.includes('post'))).toBeDefined();
  });

  it('should have POST /verify-enable route (authenticated)', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/verify-enable');
  });

  it('should have POST /verify route (public)', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/verify');
  });

  it('should have POST /verify-backup route (public)', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/verify-backup');
  });

  it('should have POST /disable route (authenticated)', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/disable');
  });

  it('should have POST /regenerate-codes route (authenticated)', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/regenerate-codes');
  });

  it('should have GET /status route (authenticated)', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/status' && r.methods.includes('get'))).toBeDefined();
  });

  it('should have exactly 7 routes', () => {
    const routes = router.stack.filter((layer: any) => layer.route);
    expect(routes.length).toBe(7);
  });
});
