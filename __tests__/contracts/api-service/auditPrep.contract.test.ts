import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;
(globalThis as any).localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() };

import { api, __clearCsrfCacheForTest } from '../../../services/api';

function mockOkResponse(data: any = {}) {
  return {
    ok: true, status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({ 'content-type': 'application/json' }),
  };
}

function getCalls() {
  return mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
}

describe('api.auditPrep contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse({});
    });
  });

  describe('getReadiness', () => {
    it('should call GET /api/audit-prep/readiness/:frameworkId', async () => {
      await api.auditPrep.getReadiness('fw-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/audit-prep/readiness/fw-1');
      expect(options.method || 'GET').toBe('GET');
    });
  });

  describe('getGaps', () => {
    it('should call GET /api/audit-prep/gaps/:frameworkId', async () => {
      await api.auditPrep.getGaps('fw-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/audit-prep/gaps/fw-1');
    });
  });

  describe('getMockQuestions', () => {
    it('should call POST /api/audit-prep/mock-questions/:frameworkId', async () => {
      await api.auditPrep.getMockQuestions('fw-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/audit-prep/mock-questions/fw-1');
      expect(options.method).toBe('POST');
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('getEvidencePackage', () => {
    it('should call POST /api/audit-prep/evidence-package/:frameworkId', async () => {
      await api.auditPrep.getEvidencePackage('fw-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/audit-prep/evidence-package/fw-1');
      expect(options.method).toBe('POST');
    });
  });

  describe('getTimeline', () => {
    it('should call GET /api/audit-prep/timeline/:frameworkId', async () => {
      await api.auditPrep.getTimeline('fw-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/audit-prep/timeline/fw-1');
    });
  });
});
