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

describe('api.controlTesting contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse({});
    });
  });

  describe('list', () => {
    it('should call GET /api/control-testing', async () => {
      await api.controlTesting.list();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/control-testing');
    });
  });

  describe('get', () => {
    it('should call GET /api/control-testing/:id', async () => {
      await api.controlTesting.get('ct-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/control-testing/ct-1');
    });
  });

  describe('create', () => {
    it('should call POST /api/control-testing', async () => {
      const data = { controlId: 'ctrl-1', testType: 'automated', schedule: 'daily' };
      await api.controlTesting.create(data);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/control-testing');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('controlId', 'ctrl-1');
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('update', () => {
    it('should call PATCH /api/control-testing/:id', async () => {
      await api.controlTesting.update('ct-1', { schedule: 'weekly' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/control-testing/ct-1');
      expect(options.method).toBe('PATCH');
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/control-testing/:id', async () => {
      await api.controlTesting.delete('ct-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/control-testing/ct-1');
      expect(options.method).toBe('DELETE');
    });
  });

  describe('run', () => {
    it('should call POST /api/control-testing/:id/run', async () => {
      await api.controlTesting.run('ct-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/control-testing/ct-1/run');
      expect(options.method).toBe('POST');
    });
  });

  describe('getResults', () => {
    it('should call GET /api/control-testing/:id/results', async () => {
      await api.controlTesting.getResults('ct-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/control-testing/ct-1/results');
    });
  });

  describe('getCoverage', () => {
    it('should call GET /api/control-testing/coverage', async () => {
      await api.controlTesting.getCoverage();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/control-testing/coverage');
    });
  });

  describe('getStats', () => {
    it('should call GET /api/control-testing/stats', async () => {
      await api.controlTesting.getStats();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/control-testing/stats');
    });
  });
});
