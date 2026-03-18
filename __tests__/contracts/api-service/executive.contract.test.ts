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

describe('api.executive contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse({});
    });
  });

  describe('getDashboard', () => {
    it('should call GET /api/executive/dashboard', async () => {
      await api.executive.getDashboard();
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/executive/dashboard');
      expect(options.method || 'GET').toBe('GET');
    });
  });

  describe('getRAGStatus', () => {
    it('should call GET /api/executive/rag-status', async () => {
      await api.executive.getRAGStatus();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/executive/rag-status');
    });
  });

  describe('generateBoardPack', () => {
    it('should call POST /api/executive/board-pack', async () => {
      await api.executive.generateBoardPack();
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/executive/board-pack');
      expect(options.method).toBe('POST');
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('getTrends', () => {
    it('should call GET /api/executive/trends', async () => {
      await api.executive.getTrends();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/executive/trends');
    });
  });
});
