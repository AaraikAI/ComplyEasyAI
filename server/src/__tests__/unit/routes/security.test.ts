import { jest, describe, it, expect } from '@jest/globals';

// Mock auth with IDENTIFIABLE tagged middleware so each guard is recognizable on a
// route's handler stack. (The previous version asserted on authorize.mock.calls, which
// recorded zero calls because the imported reference differed from the module the router
// captured — inspecting the router stack is deterministic instead.)
const authenticateMw: any = (_req: any, _res: any, next: any) => next();
authenticateMw.__guard = 'authenticate';

jest.mock('../../../middleware/auth', () => ({
  authenticate: authenticateMw,
  authorize: jest.fn((...roles: string[]) => {
    const mw: any = (_req: any, _res: any, next: any) => next();
    mw.__guard = 'authorize';
    mw.__roles = roles;
    return mw;
  }),
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

// `router.use(authenticate)` registers a middleware layer (no `.route`) whose handle
// is the tagged authenticate fn. Locate it so we can assert the guard is mounted and
// that every route is registered behind it.
function authenticateLayerIndex(): number {
  return router.stack.findIndex(
    (layer: any) => !layer.route && layer.handle === authenticateMw
  );
}

function routeLayerIndices(path: string): number[] {
  const out: number[] = [];
  router.stack.forEach((layer: any, i: number) => {
    if (layer.route && layer.route.path === path) out.push(i);
  });
  return out;
}

// Returns the roles the authorize() guard on a given method+path was wired with, or
// undefined if the route has no authorize guard.
function authorizeRolesFor(method: string, path: string): string[] | undefined {
  const layer = (router.stack as any[]).find(
    (l) => l.route && l.route.path === path && l.route.methods[method]
  );
  if (!layer) return undefined;
  const entry = (layer.route.stack as any[]).find((s) => s.handle && s.handle.__guard === 'authorize');
  return entry ? entry.handle.__roles : undefined;
}

describe('Security Routes', () => {
  it('should export an Express router', () => {
    expect(router).toBeDefined();
    expect(typeof router).toBe('function');
  });

  // -------------------------------------------------------------------------
  // Security wiring — catch accidental removal of an auth/authz guard.
  // -------------------------------------------------------------------------
  it('should mount the authenticate guard as a router-level middleware', () => {
    expect(authenticateLayerIndex()).toBeGreaterThanOrEqual(0);
  });

  it('should register every route behind the authenticate guard (no public security route)', () => {
    const authIdx = authenticateLayerIndex();
    expect(authIdx).toBeGreaterThanOrEqual(0);
    const routeLayers = router.stack
      .map((layer: any, i: number) => ({ i, isRoute: !!layer.route }))
      .filter((l: { isRoute: boolean }) => l.isRoute);
    // Each registered route must come after the global authenticate layer.
    for (const { i } of routeLayers) {
      expect(i).toBeGreaterThan(authIdx);
    }
  });

  it('should restrict mutating policy/key routes via authorize("admin")', () => {
    // BYOK key management and zero-trust policy mutations must carry an authorize('admin')
    // guard on their route stack. Asserting on the stack (not a mock-call count) deterministically
    // catches an accidental removal of the admin guard.
    const adminOnlyRoutes: Array<[string, string]> = [
      ['post', '/zero-trust/policies'],
      ['delete', '/zero-trust/policies/:policyId'],
      ['post', '/byok/keys/generate'],
      ['post', '/byok/keys/import'],
      ['delete', '/byok/keys/:keyId'],
      ['post', '/byok/keys/:keyId/rotate'],
    ];
    for (const [method, path] of adminOnlyRoutes) {
      const roles = authorizeRolesFor(method, path);
      expect(roles).toBeDefined();
      expect(roles).toContain('admin');
    }
  });

  it('should require authorize("admin","editor") for ZKP proof generation routes', () => {
    // ZKP generate endpoints are gated to admin/editor; verify that combination is wired
    // directly on each generate route's stack.
    for (const path of [
      '/zkp/compliance-proof/generate',
      '/zkp/credential-proof/generate',
      '/zkp/ownership-proof/generate',
    ]) {
      const roles = authorizeRolesFor('post', path);
      expect(roles).toEqual(expect.arrayContaining(['admin', 'editor']));
    }
    // The generate route should also be registered behind the global authenticate guard.
    const genIdx = routeLayerIndices('/zkp/compliance-proof/generate');
    const authIdx = authenticateLayerIndex();
    expect(genIdx.length).toBeGreaterThan(0);
    expect(Math.min(...genIdx)).toBeGreaterThan(authIdx);
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
