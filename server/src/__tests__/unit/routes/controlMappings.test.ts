import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../controllers/controlMappingsController', () => ({
  __esModule: true,
  default: {
    createMapping: jest.fn(),
    getMappings: jest.fn(),
    deleteMapping: jest.fn(),
    exportMappings: jest.fn(),
  },
}));

import router from '../../../routes/controlMappings';

describe('Control Mappings Routes', () => {
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

  it('should have POST / route for creating mappings', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/' && r.methods.includes('post'))).toBeDefined();
  });

  it('should have GET /control/:controlId route for getting mappings', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/control/:controlId' && r.methods.includes('get'))).toBeDefined();
  });

  it('should have DELETE /:mappingId route for deleting mappings', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/:mappingId' && r.methods.includes('delete'))).toBeDefined();
  });

  it('should have GET /export/csv route for exporting mappings', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/export/csv' && r.methods.includes('get'))).toBeDefined();
  });

  it('should have exactly 4 routes', () => {
    const routes = router.stack.filter((layer: any) => layer.route);
    expect(routes.length).toBe(4);
  });
});
