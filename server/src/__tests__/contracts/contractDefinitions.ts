/**
 * Contract Definitions
 * Single source of truth for API contract shapes between frontend and backend
 */

export interface EndpointContract {
  path: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  auth: boolean;
  roles?: string[];
  joiSchemaName?: string;
  prismaModel?: string;
  validPayload?: Record<string, unknown>;
  invalidPayloads?: Array<{ payload: Record<string, unknown>; expectedError: string }>;
  expectedResponseShape?: Record<string, unknown>;
}

/**
 * Risk endpoint contracts
 */
export const RISK_CONTRACTS: EndpointContract[] = [
  {
    path: '/api/risks',
    method: 'GET',
    auth: true,
    prismaModel: 'riskItem',
    expectedResponseShape: { data: expect.any(Array), total: expect.any(Number) },
  },
  {
    path: '/api/risks/:id',
    method: 'GET',
    auth: true,
    prismaModel: 'riskItem',
    expectedResponseShape: { id: expect.any(String), title: expect.any(String) },
  },
  {
    path: '/api/risks',
    method: 'POST',
    auth: true,
    roles: ['Admin', 'Editor'],
    joiSchemaName: 'createRiskSchema',
    prismaModel: 'riskItem',
    validPayload: {
      title: 'Test Risk',
      description: 'A test risk description',
      severity: 'High',
      likelihood: 4,
      impact: 4,
      category: 'Security',
    },
    invalidPayloads: [
      { payload: {}, expectedError: '"title" is required' },
      { payload: { title: '' }, expectedError: '"title" is not allowed to be empty' },
    ],
  },
];

/**
 * Auth endpoint contracts
 */
export const AUTH_CONTRACTS: EndpointContract[] = [
  {
    path: '/api/auth/magic-link',
    method: 'POST',
    auth: false,
    joiSchemaName: 'magicLinkSchema',
    validPayload: { email: 'test@example.com' },
    invalidPayloads: [
      { payload: {}, expectedError: '"email" is required' },
      { payload: { email: 'not-an-email' }, expectedError: '"email" must be a valid email' },
    ],
  },
];

/**
 * Vendor endpoint contracts
 */
export const VENDOR_CONTRACTS: EndpointContract[] = [
  {
    path: '/api/vendors',
    method: 'GET',
    auth: true,
    prismaModel: 'vendor',
  },
  {
    path: '/api/vendors',
    method: 'POST',
    auth: true,
    roles: ['Admin', 'Editor'],
    joiSchemaName: 'createVendorSchema',
    prismaModel: 'vendor',
    validPayload: {
      name: 'Test Vendor',
      category: 'Cloud Provider',
      status: 'Active',
      riskLevel: 'Medium',
    },
    invalidPayloads: [
      { payload: {}, expectedError: '"name" is required' },
    ],
  },
];
