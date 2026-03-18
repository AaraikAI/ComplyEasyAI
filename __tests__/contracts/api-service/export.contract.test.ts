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

describe('api.dataExport contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse({});
    });
  });

  describe('vendors', () => {
    it('should call GET /api/export/vendors', async () => {
      await api.dataExport.vendors();
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/export/vendors');
      expect(options.method || 'GET').toBe('GET');
    });
  });

  describe('policies', () => {
    it('should call GET /api/export/policies', async () => {
      await api.dataExport.policies();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/export/policies');
    });
  });

  describe('issues', () => {
    it('should call GET /api/export/issues', async () => {
      await api.dataExport.issues();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/export/issues');
    });
  });

  describe('risks', () => {
    it('should call GET /api/export/risks', async () => {
      await api.dataExport.risks();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/export/risks');
    });
  });

  describe('frameworks', () => {
    it('should call GET /api/export/frameworks', async () => {
      await api.dataExport.frameworks();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/export/frameworks');
    });
  });

  describe('auditLogs', () => {
    it('should call GET /api/export/audit-logs', async () => {
      await api.dataExport.auditLogs();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/export/audit-logs');
    });
  });

  describe('monitors', () => {
    it('should call GET /api/export/monitors', async () => {
      await api.dataExport.monitors();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/export/monitors');
    });
  });
});
