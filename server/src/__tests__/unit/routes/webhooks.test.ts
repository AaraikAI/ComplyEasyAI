import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
  AuthRequest: {},
}));

jest.mock('../../../controllers/webhookController', () => ({
  __esModule: true,
  default: {
    getEventTypes: jest.fn(),
    receiveIncomingWebhook: jest.fn(),
    zapierAuthTest: jest.fn(),
    zapierSubscribe: jest.fn(),
    zapierUnsubscribe: jest.fn(),
    zapierSampleData: jest.fn(),
    getWebhooks: jest.fn(),
    getWebhook: jest.fn(),
    createWebhook: jest.fn(),
    updateWebhook: jest.fn(),
    deleteWebhook: jest.fn(),
    testWebhook: jest.fn(),
    regenerateSecret: jest.fn(),
    getEventHistory: jest.fn(),
    retryEvent: jest.fn(),
    getApiKeys: jest.fn(),
    createApiKey: jest.fn(),
    revokeApiKey: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    apiKey: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
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

jest.mock('../../../middleware/errorHandler', () => ({
  AppError: class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

import router from '../../../routes/webhooks';

describe('Webhooks Routes', () => {
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

  it('should have GET /event-types public route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    const eventTypes = routes.find((r: any) => r.path === '/event-types' && r.methods.includes('get'));
    expect(eventTypes).toBeDefined();
  });

  it('should have POST /incoming/:organizationId/:action route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    const incoming = routes.find((r: any) => r.path === '/incoming/:organizationId/:action' && r.methods.includes('post'));
    expect(incoming).toBeDefined();
  });

  it('should have Zapier integration routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/zapier/auth');
    expect(routes).toContain('/zapier/subscribe');
    expect(routes).toContain('/zapier/subscribe/:id');
    expect(routes).toContain('/zapier/sample/:event');
  });

  it('should have webhook CRUD routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/' && r.methods.includes('get'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/' && r.methods.includes('post'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/:webhookId' && r.methods.includes('get'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/:webhookId' && r.methods.includes('patch'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/:webhookId' && r.methods.includes('delete'))).toBeDefined();
  });

  it('should have API key management routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/keys/list' && r.methods.includes('get'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/keys' && r.methods.includes('post'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/keys/:keyId' && r.methods.includes('delete'))).toBeDefined();
  });
});
