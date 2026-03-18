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

describe('api.vendorMonitoring contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse({});
    });
  });

  describe('list', () => {
    it('should call GET /api/vendor-monitoring', async () => {
      await api.vendorMonitoring.list();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/vendor-monitoring');
    });
  });

  describe('create', () => {
    it('should call POST /api/vendor-monitoring', async () => {
      const data = { vendorId: 'v-1', checkType: 'security' };
      await api.vendorMonitoring.create(data);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/vendor-monitoring');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('vendorId', 'v-1');
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('getForVendor', () => {
    it('should call GET /api/vendor-monitoring/vendor/:vendorId', async () => {
      await api.vendorMonitoring.getForVendor('v-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/vendor-monitoring/vendor/v-1');
    });
  });

  describe('triggerCheck', () => {
    it('should call POST /api/vendor-monitoring/vendor/:vendorId/check', async () => {
      await api.vendorMonitoring.triggerCheck('v-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/vendor-monitoring/vendor/v-1/check');
      expect(options.method).toBe('POST');
    });
  });

  describe('getAlerts', () => {
    it('should call GET /api/vendor-monitoring/alerts', async () => {
      await api.vendorMonitoring.getAlerts();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/vendor-monitoring/alerts');
    });
  });

  describe('getStats', () => {
    it('should call GET /api/vendor-monitoring/stats', async () => {
      await api.vendorMonitoring.getStats();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/vendor-monitoring/stats');
    });
  });
});
