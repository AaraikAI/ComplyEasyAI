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

describe('api.costs contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse({});
    });
  });

  describe('list', () => {
    it('should call GET /api/costs', async () => {
      await api.costs.list();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/costs');
    });

    it('should pass query params', async () => {
      await api.costs.list({ category: 'tools' });
      const [url] = getCalls()[0];
      expect(url).toContain('category=tools');
    });
  });

  describe('create', () => {
    it('should call POST /api/costs', async () => {
      const data = { name: 'License', amount: 5000, category: 'tools' };
      await api.costs.create(data);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/costs');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('name', 'License');
      expect(body).toHaveProperty('amount', 5000);
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('update', () => {
    it('should call PATCH /api/costs/:id', async () => {
      await api.costs.update('cost-1', { amount: 6000 });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/costs/cost-1');
      expect(options.method).toBe('PATCH');
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/costs/:id', async () => {
      await api.costs.delete('cost-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/costs/cost-1');
      expect(options.method).toBe('DELETE');
    });
  });

  describe('getSummary', () => {
    it('should call GET /api/costs/summary', async () => {
      await api.costs.getSummary();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/costs/summary');
    });
  });

  describe('getTrend', () => {
    it('should call GET /api/costs/trend', async () => {
      await api.costs.getTrend();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/costs/trend');
    });
  });

  describe('getBudget', () => {
    it('should call GET /api/costs/budget', async () => {
      await api.costs.getBudget();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/costs/budget');
    });
  });
});
