import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
  AuthRequest: {},
}));

jest.mock('../../../middleware/tierMiddleware', () => ({
  enforceLimit: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    magicLink: { create: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../services/emailService', () => ({
  __esModule: true,
  default: {
    sendMagicLink: jest.fn(),
  },
}));

import router from '../../../routes/team';

describe('Team Routes', () => {
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

  it('should have GET / route for listing team members', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    const getRoot = routes.find((r: any) => r.path === '/' && r.methods.includes('get'));
    expect(getRoot).toBeDefined();
  });

  it('should have POST /invite route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    const postInvite = routes.find((r: any) => r.path === '/invite' && r.methods.includes('post'));
    expect(postInvite).toBeDefined();
  });

  it('should have POST /bulk-invite route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    const bulkInvite = routes.find((r: any) => r.path === '/bulk-invite' && r.methods.includes('post'));
    expect(bulkInvite).toBeDefined();
  });

  it('should have PATCH /:id route for updating role', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    const patchId = routes.find((r: any) => r.path === '/:id' && r.methods.includes('patch'));
    expect(patchId).toBeDefined();
  });

  it('should have DELETE /:id route for removing members', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    const deleteId = routes.find((r: any) => r.path === '/:id' && r.methods.includes('delete'));
    expect(deleteId).toBeDefined();
  });
});
