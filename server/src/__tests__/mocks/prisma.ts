/**
 * Prisma Client Mock
 * Comprehensive mock for database operations in tests
 */

import { jest } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = jest.Mock<any>;

// Create a properly typed mock function
const createMockFn = (): MockFn => jest.fn();

// Mock data factories
export const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'Admin',
  organizationId: 'org-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  twoFactorEnabled: false,
  twoFactorSecret: null,
  ...overrides,
});

export const createMockOrganization = (overrides: Record<string, unknown> = {}) => ({
  id: 'org-123',
  name: 'Test Organization',
  plan: 'Pro',
  createdAt: new Date(),
  updatedAt: new Date(),
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionStatus: 'Active',
  ...overrides,
});

export const createMockRiskItem = (overrides: Record<string, unknown> = {}) => ({
  id: 'risk-123',
  title: 'Test Risk',
  description: 'Test risk description',
  category: 'Security',
  severity: 'High',
  likelihood: 4,
  impact: 4,
  status: 'Open',
  organizationId: 'org-123',
  assignedToId: 'user-123',
  mitigationPlan: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockVendor = (overrides: Record<string, unknown> = {}) => ({
  id: 'vendor-123',
  name: 'Test Vendor',
  category: 'Cloud Provider',
  status: 'Active',
  riskLevel: 'Medium',
  riskScore: 50,
  organizationId: 'org-123',
  hasDataAccess: true,
  dataTypes: ['PII', 'Financial'],
  soc2Report: true,
  iso27001Certified: false,
  gdprCompliant: true,
  hipaaBaa: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockFramework = (overrides: Record<string, unknown> = {}) => ({
  id: 'framework-123',
  name: 'SOC 2',
  description: 'SOC 2 Type II Compliance',
  status: 'In_Progress',
  organizationId: 'org-123',
  nextAuditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockControl = (overrides: Record<string, unknown> = {}) => ({
  id: 'control-123',
  name: 'CC1.1 - Control Environment',
  description: 'Management commitment to integrity',
  status: 'Implemented',
  evidence: 'Policy document uploaded',
  frameworkId: 'framework-123',
  mappedControls: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockPolicy = (overrides: Record<string, unknown> = {}) => ({
  id: 'policy-123',
  title: 'Information Security Policy',
  category: 'Security',
  content: 'Policy content here...',
  version: '1.0',
  status: 'Approved',
  organizationId: 'org-123',
  ownerId: 'user-123',
  approvalDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockIssue = (overrides: Record<string, unknown> = {}) => ({
  id: 'issue-123',
  title: 'Security Vulnerability',
  description: 'Critical vulnerability found',
  status: 'Open',
  priority: 'Critical',
  category: 'Security',
  issueType: 'Bug',
  organizationId: 'org-123',
  assignedToId: 'user-123',
  createdById: 'user-123',
  slaTarget: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockAuditLog = (overrides: Record<string, unknown> = {}) => ({
  id: 'audit-123',
  userId: 'user-123',
  organizationId: 'org-123',
  action: 'user.login',
  resourceType: 'User',
  resourceId: 'user-123',
  metadata: {},
  hash: 'sha256-hash',
  verified: true,
  timestamp: new Date(),
  ipAddress: '127.0.0.1',
  userAgent: 'Jest Test',
  ...overrides,
});

export const createMockQuestionnaire = (overrides: Record<string, unknown> = {}) => ({
  id: 'questionnaire-123',
  title: 'Security Assessment',
  description: 'Annual security questionnaire',
  status: 'In_Progress',
  organizationId: 'org-123',
  vendorId: 'vendor-123',
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockPersonnel = (overrides: Record<string, unknown> = {}) => ({
  id: 'personnel-123',
  userId: 'user-123',
  organizationId: 'org-123',
  department: 'Engineering',
  title: 'Software Engineer',
  startDate: new Date(),
  status: 'Active',
  securityTraining: true,
  backgroundCheck: true,
  systemAccess: { systems: ['AWS', 'GitHub'] },
  dataAccess: { categories: ['Code', 'Configs'] },
  physicalAccess: { locations: ['HQ'] },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock Prisma Client with properly typed mock functions
export const prismaMock = {
  user: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  organization: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
  },
  riskItem: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  riskAssessment: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
  },
  vendor: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  vendorAssessment: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
  },
  vendorReview: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
  },
  vendorMonitor: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
  },
  complianceFramework: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  frameworkControl: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  policy: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  issue: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  issueComment: {
    findMany: createMockFn(),
    create: createMockFn(),
  },
  questionnaire: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  questionnaireQuestion: {
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
  },
  questionnaireResponse: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
  },
  personnel: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  accessReview: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
  },
  auditLog: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    createMany: createMockFn(),
    delete: createMockFn(),
    deleteMany: createMockFn(),
    count: createMockFn(),
  },
  continuousMonitor: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
  },
  monitorResult: {
    findMany: createMockFn(),
    create: createMockFn(),
  },
  customReport: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
  },
  trustCertificate: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
  },
  integration: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    upsert: createMockFn(),
    delete: createMockFn(),
  },
  magicLink: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    deleteMany: createMockFn(),
  },
  twoFactorBackupCode: {
    findMany: createMockFn(),
    create: createMockFn(),
    createMany: createMockFn(),
    delete: createMockFn(),
    deleteMany: createMockFn(),
  },
  $transaction: createMockFn().mockImplementation((callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock)),
  $queryRaw: createMockFn(),
  $disconnect: createMockFn(),
};

// Mock the database module
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

export default prismaMock;
