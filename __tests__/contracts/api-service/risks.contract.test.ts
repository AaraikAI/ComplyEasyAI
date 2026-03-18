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

describe('api.risks contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse([]);
    });
  });

  describe('list', () => {
    it('should call GET /api/risks', async () => {
      await api.risks.list();
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/risks');
      expect(url).not.toContain('?');
      expect(options.method || 'GET').toBe('GET');
      expect(options.credentials).toBe('include');
    });

    it('should pass query params when provided', async () => {
      await api.risks.list({ status: 'open', severity: 'High' });
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url] = calls[0];
      expect(url).toContain('status=open');
      expect(url).toContain('severity=High');
    });
  });

  describe('getById', () => {
    it('should call GET /api/risks/:id', async () => {
      await api.risks.getById('risk-123');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/risks/risk-123');
      expect(options.method || 'GET').toBe('GET');
    });
  });

  describe('create', () => {
    it('should call POST /api/risks with payload', async () => {
      const payload = { title: 'Test Risk', severity: 'High', likelihood: 4, impact: 4 };
      await api.risks.create(payload);
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/risks');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('title', 'Test Risk');
      expect(body).toHaveProperty('severity', 'High');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('update', () => {
    it('should call PATCH /api/risks/:id with updates', async () => {
      await api.risks.update('risk-123', { severity: 'Low' });
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/risks/risk-123');
      expect(options.method).toBe('PATCH');
      const body = JSON.parse(options.body);
      expect(body).toEqual({ severity: 'Low' });
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/risks/:id', async () => {
      await api.risks.delete('risk-123');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/risks/risk-123');
      expect(options.method).toBe('DELETE');
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('prioritize', () => {
    it('should call POST /api/risks/prioritize', async () => {
      await api.risks.prioritize();
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/risks/prioritize');
      expect(options.method).toBe('POST');
    });
  });

  describe('generateRemediation', () => {
    it('should call POST /api/risks/:id/remediation', async () => {
      await api.risks.generateRemediation('risk-456');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/risks/risk-456/remediation');
      expect(options.method).toBe('POST');
    });
  });

  describe('scan', () => {
    it('should call POST /api/risks/scan', async () => {
      await api.risks.scan();
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/risks/scan');
      expect(options.method).toBe('POST');
    });
  });
});
