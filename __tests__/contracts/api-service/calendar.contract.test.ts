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

describe('api.calendar contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse({});
    });
  });

  describe('listDeadlines', () => {
    it('should call GET /api/calendar/deadlines', async () => {
      await api.calendar.listDeadlines();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/calendar/deadlines');
    });

    it('should pass query params', async () => {
      await api.calendar.listDeadlines({ framework: 'SOC2' });
      const [url] = getCalls()[0];
      expect(url).toContain('framework=SOC2');
    });
  });

  describe('getDeadline', () => {
    it('should call GET /api/calendar/deadlines/:id', async () => {
      await api.calendar.getDeadline('dl-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/calendar/deadlines/dl-1');
    });
  });

  describe('createDeadline', () => {
    it('should call POST /api/calendar/deadlines', async () => {
      const data = { title: 'Audit Due', dueDate: '2024-06-01' };
      await api.calendar.createDeadline(data);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/calendar/deadlines');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('title', 'Audit Due');
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('updateDeadline', () => {
    it('should call PATCH /api/calendar/deadlines/:id', async () => {
      await api.calendar.updateDeadline('dl-1', { title: 'Updated' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/calendar/deadlines/dl-1');
      expect(options.method).toBe('PATCH');
    });
  });

  describe('deleteDeadline', () => {
    it('should call DELETE /api/calendar/deadlines/:id', async () => {
      await api.calendar.deleteDeadline('dl-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/calendar/deadlines/dl-1');
      expect(options.method).toBe('DELETE');
    });
  });

  describe('getUpcoming', () => {
    it('should call GET /api/calendar/upcoming', async () => {
      await api.calendar.getUpcoming(30);
      const [url] = getCalls()[0];
      expect(url).toContain('/api/calendar/upcoming');
      expect(url).toContain('days=30');
    });
  });

  describe('getOverdue', () => {
    it('should call GET /api/calendar/overdue', async () => {
      await api.calendar.getOverdue();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/calendar/overdue');
    });
  });

  describe('completeDeadline', () => {
    it('should call PATCH /api/calendar/deadlines/:id/complete', async () => {
      await api.calendar.completeDeadline('dl-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/calendar/deadlines/dl-1/complete');
      expect(options.method).toBe('PATCH');
    });
  });
});
