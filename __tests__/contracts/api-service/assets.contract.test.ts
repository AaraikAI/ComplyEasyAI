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

describe('api.assets contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse({});
    });
  });

  describe('list', () => {
    it('should call GET /api/assets', async () => {
      await api.assets.list();
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/assets');
      expect(options.method || 'GET').toBe('GET');
    });

    it('should pass query params', async () => {
      await api.assets.list({ type: 'hardware' });
      const [url] = getCalls()[0];
      expect(url).toContain('type=hardware');
    });
  });

  describe('get', () => {
    it('should call GET /api/assets/:id', async () => {
      await api.assets.get('asset-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/assets/asset-1');
    });
  });

  describe('create', () => {
    it('should call POST /api/assets with payload', async () => {
      const data = { name: 'Server A', type: 'hardware', status: 'active' };
      await api.assets.create(data);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/assets');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('name', 'Server A');
      expect(body).toHaveProperty('type', 'hardware');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('update', () => {
    it('should call PATCH /api/assets/:id', async () => {
      await api.assets.update('asset-1', { status: 'retired' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/assets/asset-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toHaveProperty('status', 'retired');
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/assets/:id', async () => {
      await api.assets.delete('asset-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/assets/asset-1');
      expect(options.method).toBe('DELETE');
    });
  });

  describe('getStats', () => {
    it('should call GET /api/assets/stats', async () => {
      await api.assets.getStats();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/assets/stats');
    });
  });
});
