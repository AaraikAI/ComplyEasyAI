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

describe('api.exceptions contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse({});
    });
  });

  describe('list', () => {
    it('should call GET /api/exceptions', async () => {
      await api.exceptions.list();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/exceptions');
    });

    it('should pass query params', async () => {
      await api.exceptions.list({ status: 'pending' });
      const [url] = getCalls()[0];
      expect(url).toContain('status=pending');
    });
  });

  describe('get', () => {
    it('should call GET /api/exceptions/:id', async () => {
      await api.exceptions.get('exc-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/exceptions/exc-1');
    });
  });

  describe('create', () => {
    it('should call POST /api/exceptions', async () => {
      const data = { title: 'Exception 1', reason: 'Business need', expiresAt: '2025-01-01' };
      await api.exceptions.create(data);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/exceptions');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('title', 'Exception 1');
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('update', () => {
    it('should call PATCH /api/exceptions/:id', async () => {
      await api.exceptions.update('exc-1', { reason: 'Updated reason' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/exceptions/exc-1');
      expect(options.method).toBe('PATCH');
    });
  });

  describe('approve', () => {
    it('should call PATCH /api/exceptions/:id/approve', async () => {
      await api.exceptions.approve('exc-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/exceptions/exc-1/approve');
      expect(options.method).toBe('PATCH');
    });
  });

  describe('reject', () => {
    it('should call PATCH /api/exceptions/:id/reject', async () => {
      await api.exceptions.reject('exc-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/exceptions/exc-1/reject');
      expect(options.method).toBe('PATCH');
    });
  });

  describe('getExpiring', () => {
    it('should call GET /api/exceptions/expiring with days param', async () => {
      await api.exceptions.getExpiring(30);
      const [url] = getCalls()[0];
      expect(url).toContain('/api/exceptions/expiring');
      expect(url).toContain('days=30');
    });
  });

  describe('getStats', () => {
    it('should call GET /api/exceptions/stats', async () => {
      await api.exceptions.getStats();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/exceptions/stats');
    });
  });
});
