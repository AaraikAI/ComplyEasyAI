import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../controllers/onboardingController', () => ({
  onboardingController: {
    getProgress: jest.fn(),
    updateProgress: jest.fn(),
    trackEvent: jest.fn(),
    completeMilestone: jest.fn(),
    updatePreferences: jest.fn(),
    skipFlow: jest.fn(),
    resetProgress: jest.fn(),
    getChecklist: jest.fn(),
    updateChecklist: jest.fn(),
  },
}));

import router from '../../../routes/onboarding';

describe('Onboarding Routes', () => {
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

  it('should have progress routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/progress' && r.methods.includes('get'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/progress' && r.methods.includes('put'))).toBeDefined();
  });

  it('should have POST /event route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/event' && r.methods.includes('post'))).toBeDefined();
  });

  it('should have POST /complete-milestone route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/complete-milestone');
  });

  it('should have PUT /preferences route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/preferences' && r.methods.includes('put'))).toBeDefined();
  });

  it('should have POST /skip-flow route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/skip-flow');
  });

  it('should have POST /reset route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/reset');
  });

  it('should have checklist routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/checklist' && r.methods.includes('get'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/checklist' && r.methods.includes('put'))).toBeDefined();
  });
});
