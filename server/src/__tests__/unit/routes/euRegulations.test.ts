import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../controllers/euRegulationsController', () => ({
  __esModule: true,
  default: {
    registerAISystem: jest.fn(),
    getAISystems: jest.fn(),
    getAISystem: jest.fn(),
    updateAISystem: jest.fn(),
    deleteAISystem: jest.fn(),
    getRiskAssessments: jest.fn(),
    getLatestRiskAssessment: jest.fn(),
    conductRiskAssessment: jest.fn(),
    generateTransparencyReport: jest.fn(),
    getTransparencyReports: jest.fn(),
    registerGatekeeper: jest.fn(),
    getGatekeepers: jest.fn(),
    getGatekeeper: jest.fn(),
    updateGatekeeper: jest.fn(),
    deleteGatekeeper: jest.fn(),
    getObligations: jest.fn(),
    updateObligationCompliance: jest.fn(),
    getComplianceReports: jest.fn(),
    getLatestComplianceReport: jest.fn(),
    generateComplianceReport: jest.fn(),
    registerPlatform: jest.fn(),
    getPlatforms: jest.fn(),
    getPlatform: jest.fn(),
    updatePlatform: jest.fn(),
    deletePlatform: jest.fn(),
    getContentModerationHistory: jest.fn(),
    recordContentModeration: jest.fn(),
    reportIllegalContent: jest.fn(),
    processIllegalContentReport: jest.fn(),
    addAdToRepository: jest.fn(),
    getAdsFromRepository: jest.fn(),
    getDSATransparencyReports: jest.fn(),
    generateDSATransparencyReport: jest.fn(),
    conductDSARiskAssessment: jest.fn(),
    getDSARiskAssessments: jest.fn(),
    getLatestDSARiskAssessment: jest.fn(),
    updateDSARiskAssessment: jest.fn(),
    configureNonPersonalizedFeed: jest.fn(),
    getNonPersonalizedFeed: jest.fn(),
    updateNonPersonalizedFeedStatus: jest.fn(),
  },
}));

import router from '../../../routes/euRegulations';

describe('EU Regulations Routes', () => {
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

  it('should have EU AI Act routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/ai-act/systems');
    expect(routes).toContain('/ai-act/systems/:id');
    expect(routes).toContain('/ai-act/systems/:id/assessments');
    expect(routes).toContain('/ai-act/transparency-reports');
  });

  it('should have DMA routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/dma/gatekeepers');
    expect(routes).toContain('/dma/gatekeepers/:id');
    expect(routes).toContain('/dma/gatekeepers/:id/obligations');
  });

  it('should have DSA routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/dsa/platforms');
    expect(routes).toContain('/dsa/platforms/:id');
    expect(routes).toContain('/dsa/platforms/:id/content-moderation');
    expect(routes).toContain('/dsa/platforms/:id/ad-repository');
  });
});
