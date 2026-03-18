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

describe('api.incidents contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse({});
    });
  });

  describe('list', () => {
    it('should call GET /api/incidents', async () => {
      await api.incidents.list();
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/incidents');
      expect(options.method || 'GET').toBe('GET');
    });

    it('should pass query params', async () => {
      await api.incidents.list({ status: 'open' });
      const [url] = getCalls()[0];
      expect(url).toContain('status=open');
    });
  });

  describe('get', () => {
    it('should call GET /api/incidents/:id', async () => {
      await api.incidents.get('inc-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/incidents/inc-1');
    });
  });

  describe('create', () => {
    it('should call POST /api/incidents with payload', async () => {
      const data = { title: 'Incident 1', severity: 'critical' };
      await api.incidents.create(data);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/incidents');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('title', 'Incident 1');
      expect(body).toHaveProperty('severity', 'critical');
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('update', () => {
    it('should call PATCH /api/incidents/:id', async () => {
      await api.incidents.update('inc-1', { status: 'resolved' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/incidents/inc-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toHaveProperty('status', 'resolved');
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/incidents/:id', async () => {
      await api.incidents.delete('inc-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/incidents/inc-1');
      expect(options.method).toBe('DELETE');
    });
  });

  describe('addTimeline', () => {
    it('should call POST /api/incidents/:id/timeline', async () => {
      await api.incidents.addTimeline('inc-1', { event: 'Detected', timestamp: '2024-01-01' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/incidents/inc-1/timeline');
      expect(options.method).toBe('POST');
    });
  });

  describe('getTimeline', () => {
    it('should call GET /api/incidents/:id/timeline', async () => {
      await api.incidents.getTimeline('inc-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/incidents/inc-1/timeline');
    });
  });

  describe('createTask', () => {
    it('should call POST /api/incidents/:id/tasks', async () => {
      await api.incidents.createTask('inc-1', { title: 'Fix it' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/incidents/inc-1/tasks');
      expect(options.method).toBe('POST');
    });
  });

  describe('updateTask', () => {
    it('should call PATCH /api/incidents/:id/tasks/:taskId', async () => {
      await api.incidents.updateTask('inc-1', 'task-1', { status: 'done' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/incidents/inc-1/tasks/task-1');
      expect(options.method).toBe('PATCH');
    });
  });

  describe('getMetrics', () => {
    it('should call GET /api/incidents/metrics', async () => {
      await api.incidents.getMetrics();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/incidents/metrics');
    });
  });
});
