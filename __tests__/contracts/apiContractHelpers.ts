/**
 * Frontend API Contract Test Helpers
 * Utilities for testing that frontend API calls match backend Joi schemas
 */

import { vi } from 'vitest';

/**
 * Creates a mock fetch that captures request details
 */
export function createMockFetch() {
  const calls: Array<{ url: string; options: RequestInit }> = [];

  const mockFetch = vi.fn(async (url: string | URL | Request, options?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
    calls.push({ url: urlStr, options: options || {} });

    return {
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
      headers: new Headers({ 'content-type': 'application/json' }),
    } as Response;
  });

  return { mockFetch, calls };
}

/**
 * Extracts the request body from a fetch mock call
 */
export function getRequestBody(calls: Array<{ url: string; options: RequestInit }>, index = 0): Record<string, unknown> | null {
  const call = calls[index];
  if (!call?.options?.body) return null;
  try {
    return JSON.parse(call.options.body as string);
  } catch {
    return null;
  }
}

/**
 * Extracts the request method from a fetch mock call
 */
export function getRequestMethod(calls: Array<{ url: string; options: RequestInit }>, index = 0): string {
  return calls[index]?.options?.method || 'GET';
}

/**
 * Asserts that a fetch call was made to the expected URL with expected method
 */
export function assertApiCall(
  calls: Array<{ url: string; options: RequestInit }>,
  expectedUrl: string,
  expectedMethod: string,
  index = 0
) {
  expect(calls.length).toBeGreaterThan(index);
  expect(calls[index].url).toContain(expectedUrl);
  expect(calls[index].options.method || 'GET').toBe(expectedMethod);
}

/**
 * Common mock response factories matching backend response shapes
 */
export const mockResponses = {
  risk: (overrides: Record<string, unknown> = {}) => ({
    id: 'risk-123',
    title: 'Test Risk',
    description: 'Test description',
    severity: 'High',
    likelihood: 4,
    impact: 4,
    status: 'Open',
    category: 'Security',
    organizationId: 'org-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  vendor: (overrides: Record<string, unknown> = {}) => ({
    id: 'vendor-123',
    name: 'Test Vendor',
    category: 'Cloud Provider',
    status: 'Active',
    riskLevel: 'Medium',
    riskScore: 50,
    organizationId: 'org-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  framework: (overrides: Record<string, unknown> = {}) => ({
    id: 'framework-123',
    name: 'SOC 2',
    description: 'SOC 2 Type II',
    status: 'In_Progress',
    organizationId: 'org-123',
    controls: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  user: (overrides: Record<string, unknown> = {}) => ({
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'Admin',
    organizationId: 'org-123',
    ...overrides,
  }),

  paginatedList: (items: unknown[] = [], total?: number) => ({
    data: items,
    total: total ?? items.length,
  }),

  success: (data: unknown = {}) => data,

  error: (message = 'Error', status = 400) => ({
    error: message,
    status,
  }),
};
