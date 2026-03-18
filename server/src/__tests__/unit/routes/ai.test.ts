import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../middleware/rateLimiter', () => ({
  aiLimiter: jest.fn((req: any, res: any, next: any) => next()),
}));

jest.mock('../../../middleware/tierMiddleware', () => ({
  requireFeature: jest.fn(() => [(req: any, res: any, next: any) => next()]),
  enforceLimit: jest.fn(() => (req: any, res: any, next: any) => next()),
  requireAiFeature: jest.fn(() => [(req: any, res: any, next: any) => next()]),
}));

jest.mock('../../../middleware/validate', () => ({
  validateBody: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../validators/aiSchemas', () => ({
  aiReportSchema: {},
  aiPolicySchema: {},
  aiGapAnalysisSchema: {},
  aiChatSchema: {},
  aiContractSchema: {},
  aiRfpSchema: {},
  aiPhishingSchema: {},
  aiVendorScoreSchema: {},
  aiDataMapSchema: {},
  aiBcpSchema: {},
  aiCrossFrameworkSchema: {},
  aiAutoRemediationSchema: {},
  aiEvidenceCompletenessSchema: {},
  aiAgenticVendorRiskSchema: {},
  aiAuditSimulationSchema: {},
  aiNlQuerySchema: {},
  aiCopilotSchema: {},
  aiForecastSchema: {},
  aiAnalyzeProcessSchema: {},
}));

jest.mock('../../../types/express', () => ({
  asyncHandler: jest.fn((fn: any) => fn),
}));

jest.mock('../../../controllers/aiController', () => ({
  __esModule: true,
  default: {
    generateReport: jest.fn(),
    generatePolicy: jest.fn(),
    analyzeContract: jest.fn(),
    performGapAnalysis: jest.fn(),
    generateRFPResponse: jest.fn(),
    generatePhishing: jest.fn(),
    scoreVendor: jest.fn(),
    generateDataMap: jest.fn(),
    generateBCP: jest.fn(),
    chat: jest.fn(),
    crossFrameworkMapping: jest.fn(),
    regulatoryAutoRemediation: jest.fn(),
    checkEvidenceCompleteness: jest.fn(),
    agenticVendorRisk: jest.fn(),
    simulateAudit: jest.fn(),
    naturalLanguageQuery: jest.fn(),
    complianceCopilot: jest.fn(),
    forecastComplianceScore: jest.fn(),
    analyzeProcess: jest.fn(),
  },
}));

import router from '../../../routes/ai';

describe('AI Routes', () => {
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

  it('should have all AI generation POST routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    const expectedPaths = [
      '/report',
      '/policy',
      '/contract',
      '/gap-analysis',
      '/rfp',
      '/phishing',
      '/vendor-score',
      '/data-map',
      '/bcp',
      '/chat',
      '/cross-framework-mapping',
      '/auto-remediation',
      '/evidence-completeness',
      '/agentic-vendor-risk',
      '/audit-simulation',
      '/nl-query',
      '/copilot',
      '/forecast',
      '/analyze-process',
    ];

    for (const path of expectedPaths) {
      expect(routes.find((r: any) => r.path === path && r.methods.includes('post'))).toBeDefined();
    }
  });

  it('should have exactly 19 routes', () => {
    const routes = router.stack.filter((layer: any) => layer.route);
    expect(routes.length).toBe(19);
  });
});
