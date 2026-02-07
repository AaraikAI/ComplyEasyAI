import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../controllers/aiRmfController', () => ({
  __esModule: true,
  default: {
    createAISystem: jest.fn(),
    getAISystems: jest.fn(),
    getAISystemById: jest.fn(),
    updateAISystem: jest.fn(),
    deleteAISystem: jest.fn(),
    updateCoreFunction: jest.fn(),
    updateCategory: jest.fn(),
    updateSubcategory: jest.fn(),
    updateTrustworthinessCharacteristic: jest.fn(),
    updateLifecycleStage: jest.fn(),
    addActor: jest.fn(),
    removeActor: jest.fn(),
    createAssessment: jest.fn(),
    getAssessments: jest.fn(),
    deleteAssessment: jest.fn(),
    createProfile: jest.fn(),
    createRiskActivity: jest.fn(),
    updateRiskActivity: jest.fn(),
    calculateTrustworthinessScore: jest.fn(),
    getDashboardData: jest.fn(),
  },
}));

import router from '../../../routes/aiRmf';

describe('AI RMF Routes', () => {
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

  it('should have AI system CRUD routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));
    expect(routes.find((r: any) => r.path === '/systems' && r.methods.includes('post'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/systems' && r.methods.includes('get'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/systems/:id' && r.methods.includes('get'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/systems/:id' && r.methods.includes('patch'))).toBeDefined();
    expect(routes.find((r: any) => r.path === '/systems/:id' && r.methods.includes('delete'))).toBeDefined();
  });

  it('should have core function routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/systems/:aiSystemId/functions/:functionName');
  });

  it('should have category and subcategory routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/categories/:categoryId');
    expect(routes).toContain('/subcategories/:subcategoryId');
  });

  it('should have assessment routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/systems/:aiSystemId/assessments');
    expect(routes).toContain('/assessments/:assessmentId');
  });

  it('should have dashboard route', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/dashboard');
  });

  it('should have actor routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/systems/:aiSystemId/actors');
    expect(routes).toContain('/actors/:actorId');
  });
});
