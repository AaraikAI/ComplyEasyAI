import { jest, describe, it, expect } from '@jest/globals';

// Mock all dependencies before importing the router
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn((..._roles: string[]) => (req: any, res: any, next: any) => next()),
}));

jest.mock('../../../controllers/securityController', () => ({
  __esModule: true,
  default: {
    verifyDeviceTrust: jest.fn(),
    evaluateAccessRequest: jest.fn(),
    createZeroTrustPolicy: jest.fn(),
    getZeroTrustPolicies: jest.fn(),
    getZeroTrustPolicy: jest.fn(),
    updateZeroTrustPolicy: jest.fn(),
    deleteZeroTrustPolicy: jest.fn(),
    getDeviceTrusts: jest.fn(),
    getDeviceTrust: jest.fn(),
    createNetworkSegment: jest.fn(),
    getNetworkSegments: jest.fn(),
    continuousVerification: jest.fn(),
    generateComplianceProof: jest.fn(),
    verifyComplianceProof: jest.fn(),
    generateCredentialProof: jest.fn(),
    verifyCredentialProof: jest.fn(),
    generateOwnershipProof: jest.fn(),
    verifyOwnershipProof: jest.fn(),
    getZKProofs: jest.fn(),
    getZKProof: jest.fn(),
    generateBYOKKey: jest.fn(),
    importBYOKKey: jest.fn(),
    getBYOKKeys: jest.fn(),
    getBYOKKey: jest.fn(),
    rotateBYOKKey: jest.fn(),
    deleteBYOKKey: jest.fn(),
    encryptWithBYOK: jest.fn(),
    decryptWithBYOK: jest.fn(),
    getBYOKConfig: jest.fn(),
    updateBYOKConfig: jest.fn(),
    createCompliancePolicy: jest.fn(),
    getCompliancePolicies: jest.fn(),
    getCompliancePolicy: jest.fn(),
    updateCompliancePolicy: jest.fn(),
    deleteCompliancePolicy: jest.fn(),
    evaluateCompliancePolicy: jest.fn(),
    evaluateCompliancePoliciesBatch: jest.fn(),
    generateComplianceReport: jest.fn(),
    getComplianceReports: jest.fn(),
    getComplianceReport: jest.fn(),
    handleCICDWebhook: jest.fn(),
    getCICDIntegrations: jest.fn(),
    createCICDIntegration: jest.fn(),
    deleteCICDIntegration: jest.fn(),
    detectDrift: jest.fn(),
  },
}));

import router from '../../../routes/security';

describe('Security Routes', () => {
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

  it('should have zero trust routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/zero-trust/verify-device');
    expect(routes).toContain('/zero-trust/evaluate-access');
    expect(routes).toContain('/zero-trust/policies');
    expect(routes).toContain('/zero-trust/devices');
  });

  it('should have ZKP routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/zkp/compliance-proof/generate');
    expect(routes).toContain('/zkp/compliance-proof/verify');
    expect(routes).toContain('/zkp/proofs');
  });

  it('should have BYOK routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/byok/keys/generate');
    expect(routes).toContain('/byok/keys/import');
    expect(routes).toContain('/byok/keys');
    expect(routes).toContain('/byok/encrypt');
    expect(routes).toContain('/byok/decrypt');
  });

  it('should have compliance-as-code routes', () => {
    const routes = router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);
    expect(routes).toContain('/compliance-as-code/policies');
    expect(routes).toContain('/compliance-as-code/drift/detect');
    expect(routes).toContain('/compliance-as-code/ci-cd/webhook');
  });
});
