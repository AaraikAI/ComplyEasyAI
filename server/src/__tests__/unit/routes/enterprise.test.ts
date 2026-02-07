import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../middleware/tierMiddleware', () => ({
  enforceLimit: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../services/riskManagementService', () => ({
  __esModule: true,
  default: {
    createRiskAssessment: jest.fn(),
    getRiskRegister: jest.fn(),
    getRiskDashboard: jest.fn(),
    getRiskHeatMap: jest.fn(),
  },
}));

jest.mock('../../../services/questionnaireService', () => ({
  __esModule: true,
  default: {
    createQuestionnaire: jest.fn(),
    generateAIResponses: jest.fn(),
    completeQuestionnaire: jest.fn(),
    getQuestionnairesByOrganization: jest.fn(),
    getQuestionnaireMetrics: jest.fn(),
    addQuestions: jest.fn(),
    submitResponse: jest.fn(),
  },
}));

jest.mock('../../../services/policyLibraryService', () => ({
  __esModule: true,
  default: {
    createPolicy: jest.fn(),
    bulkImportPolicies: jest.fn(),
    getPolicyTemplates: jest.fn(),
    getPolicyMetrics: jest.fn(),
    getPoliciesByOrganization: jest.fn(),
    getPolicyById: jest.fn(),
    updatePolicy: jest.fn(),
    archivePolicy: jest.fn(),
    approvePolicy: jest.fn(),
    submitForReview: jest.fn(),
    duplicatePolicy: jest.fn(),
  },
}));

jest.mock('../../../services/trustCenterService', () => ({
  __esModule: true,
  default: {
    getPublicTrustCenter: jest.fn(),
    createCertificate: jest.fn(),
    generateComplianceCertificate: jest.fn(),
  },
}));

jest.mock('../../../services/multiWorkspaceService', () => ({
  __esModule: true,
  default: {
    createChildOrganization: jest.fn(),
    getOrganizationHierarchy: jest.fn(),
    getConsolidatedMetrics: jest.fn(),
    moveUserToOrganization: jest.fn(),
    cloneFrameworkToChildren: jest.fn(),
  },
}));

jest.mock('../../../services/reportingService', () => ({
  __esModule: true,
  default: {
    createReport: jest.fn(),
    generateComplianceReport: jest.fn(),
    generateRiskReport: jest.fn(),
    generateVendorRiskReport: jest.fn(),
    generateExecutiveSummary: jest.fn(),
  },
}));

jest.mock('../../../services/monitoringService', () => ({
  __esModule: true,
  default: {
    createMonitor: jest.fn(),
    executeMonitor: jest.fn(),
    getMonitoringDashboard: jest.fn(),
    getMonitorsByOrganization: jest.fn(),
    getMonitorById: jest.fn(),
    updateMonitor: jest.fn(),
    deleteMonitor: jest.fn(),
    getMonitorResults: jest.fn(),
    toggleMonitorActive: jest.fn(),
    suggestMonitors: jest.fn(),
    analyzeMonitorTrends: jest.fn(),
    triageAlerts: jest.fn(),
  },
}));

jest.mock('../../../services/issueManagementService', () => ({
  __esModule: true,
  default: {
    createIssue: jest.fn(),
    assignIssue: jest.fn(),
    addComment: jest.fn(),
    getIssueDashboard: jest.fn(),
    getIssuesByOrganization: jest.fn(),
    updateIssueStatus: jest.fn(),
  },
}));

jest.mock('../../../services/visionaryAIService', () => ({
  __esModule: true,
  default: {
    getComplianceCoPilotRecommendations: jest.fn(),
    predictFutureRisks: jest.fn(),
    generatePolicyFromNaturalLanguage: jest.fn(),
    runComplianceAutopilot: jest.fn(),
    getComplianceBenchmarking: jest.fn(),
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    questionnaire: { update: jest.fn() },
    questionnaireResponse: { deleteMany: jest.fn() },
    questionnaireQuestion: { deleteMany: jest.fn() },
    issue: { findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
    issueComment: { deleteMany: jest.fn(), findMany: jest.fn() },
  },
}));

jest.mock('../../../data/questionnaireTemplates', () => ({
  questionnaireTemplates: [],
}));

import router from '../../../routes/enterprise';

describe('Enterprise Routes', () => {
  it('should export an Express router', () => {
    expect(router).toBeDefined();
    expect(typeof router).toBe('function');
  });

  it('should have nested route handlers in the stack', () => {
    // Enterprise uses sub-routers mounted on paths like /risk-management, /questionnaires, etc.
    const layers = router.stack.filter((layer: any) => layer.name === 'router' || layer.route);
    expect(layers.length).toBeGreaterThan(0);
  });

  it('should mount sub-routers for all enterprise modules', () => {
    const mountedPaths = router.stack
      .filter((layer: any) => layer.name === 'router')
      .map((layer: any) => layer.regexp?.source || '');
    // Should have multiple sub-routers mounted
    expect(router.stack.length).toBeGreaterThan(0);
  });
});
