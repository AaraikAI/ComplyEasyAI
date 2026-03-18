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

describe('api.vendors contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse([]);
    });
  });

  describe('list', () => {
    it('should call GET /api/vendors', async () => {
      await api.vendors.list();
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/vendors');
      expect(calls[0][1].method || 'GET').toBe('GET');
    });

    it('should pass query params', async () => {
      await api.vendors.list({ status: 'active' });
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('status=active');
    });
  });

  describe('getById', () => {
    it('should call GET /api/vendors/:id', async () => {
      await api.vendors.getById('v-1');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/vendors/v-1');
    });
  });

  describe('create', () => {
    it('should call POST /api/vendors with payload', async () => {
      const data = { name: 'Vendor A', category: 'SaaS' };
      await api.vendors.create(data);
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/vendors');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('name', 'Vendor A');
      expect(body).toHaveProperty('category', 'SaaS');
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('update', () => {
    it('should call PUT /api/vendors/:id', async () => {
      await api.vendors.update('v-1', { name: 'Updated Vendor' });
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/vendors/v-1');
      expect(options.method).toBe('PUT');
      expect(JSON.parse(options.body)).toHaveProperty('name', 'Updated Vendor');
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/vendors/:id', async () => {
      await api.vendors.delete('v-1');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/vendors/v-1');
      expect(calls[0][1].method).toBe('DELETE');
    });
  });

  describe('createAssessment', () => {
    it('should call POST /api/vendors/:id/assessments', async () => {
      await api.vendors.createAssessment('v-1', { score: 85 });
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/vendors/v-1/assessments');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('score', 85);
    });
  });

  describe('getScorecard', () => {
    it('should call GET /api/vendors/:id/scorecard', async () => {
      await api.vendors.getScorecard('v-1');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/vendors/v-1/scorecard');
    });
  });

  describe('getDashboard', () => {
    it('should call GET /api/vendors/dashboard', async () => {
      await api.vendors.getDashboard();
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/vendors/dashboard');
    });
  });
});
