import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../controllers/evidenceVersioningController', () => ({
  __esModule: true,
  default: {
    getVersions: jest.fn(),
    createVersion: jest.fn(),
    restoreVersion: jest.fn(),
    deleteVersion: jest.fn(),
  },
}));

import router from '../../../routes/evidenceVersions';

describe('Evidence Versions Routes', () => {
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

  it('should have GET /control/:controlId route for listing versions', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/control/:controlId' && r.methods.includes('get'))).toBeDefined();
  });

  it('should have POST /control/:controlId route for creating versions', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/control/:controlId' && r.methods.includes('post'))).toBeDefined();
  });

  it('should have POST /control/:controlId/restore/:versionId route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/control/:controlId/restore/:versionId');
  });

  it('should have DELETE /control/:controlId/:versionId route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/control/:controlId/:versionId' && r.methods.includes('delete'))).toBeDefined();
  });

  it('should have exactly 4 routes', () => {
    const routes = router.stack.filter((layer: any) => layer.route);
    expect(routes.length).toBe(4);
  });
});
