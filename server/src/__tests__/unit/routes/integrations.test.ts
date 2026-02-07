import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../middleware/tierMiddleware', () => ({
  enforceLimit: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../controllers/integrationsController', () => ({
  authorizeGoogle: jest.fn(),
  callbackGoogle: jest.fn(),
  syncGoogleData: jest.fn(),
  disconnectGoogle: jest.fn(),
  authorizeGitHub: jest.fn(),
  callbackGitHub: jest.fn(),
  syncGitHubData: jest.fn(),
  disconnectGitHub: jest.fn(),
  authorizeSlack: jest.fn(),
  callbackSlack: jest.fn(),
  syncSlackData: jest.fn(),
  postSlackMessage: jest.fn(),
  disconnectSlack: jest.fn(),
  authorizeJira: jest.fn(),
  callbackJira: jest.fn(),
  syncJiraData: jest.fn(),
  createJiraIssue: jest.fn(),
  disconnectJira: jest.fn(),
  connectAWS: jest.fn(),
  syncAWSData: jest.fn(),
  disconnectAWS: jest.fn(),
  connectAzure: jest.fn(),
  syncAzureData: jest.fn(),
  disconnectAzure: jest.fn(),
  listIntegrations: jest.fn(),
  getIntegrationStatus: jest.fn(),
  connectProvider: jest.fn(),
  authorizeProvider: jest.fn(),
  syncProvider: jest.fn(),
  disconnectProvider: jest.fn(),
}));

import router from '../../../routes/integrations';

describe('Integrations Routes', () => {
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

  it('should have Google Workspace routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/google/authorize' && r.methods.includes('get'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/google/callback' && r.methods.includes('get'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/google/sync' && r.methods.includes('post'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/google' && r.methods.includes('delete'))).toBeDefined();
  });

  it('should have GitHub routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/github/authorize');
    expect(routes).toContain('/github/callback');
    expect(routes).toContain('/github/sync');
  });

  it('should have Slack routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/slack/authorize');
    expect(routes).toContain('/slack/callback');
    expect(routes).toContain('/slack/sync');
    expect(routes).toContain('/slack/message');
  });

  it('should have Jira routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/jira/authorize');
    expect(routes).toContain('/jira/callback');
    expect(routes).toContain('/jira/sync');
    expect(routes).toContain('/jira/issue');
  });

  it('should have AWS routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/aws/connect');
    expect(routes).toContain('/aws/sync');
  });

  it('should have Azure routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/azure/connect');
    expect(routes).toContain('/azure/sync');
  });

  it('should have generic provider routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/' && r.methods.includes('get'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/:provider' && r.methods.includes('get'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/:provider/connect' && r.methods.includes('post'))).toBeDefined();
  });
});
