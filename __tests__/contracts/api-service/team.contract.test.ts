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

describe('api.team contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse([]);
    });
  });

  describe('list', () => {
    it('should call GET /api/team', async () => {
      await api.team.list();
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/team');
      expect(options.method || 'GET').toBe('GET');
    });
  });

  describe('invite', () => {
    it('should call POST /api/team/invite with name, email, role', async () => {
      await api.team.invite('Jane', 'jane@test.com', 'viewer');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/team/invite');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toEqual({ name: 'Jane', email: 'jane@test.com', role: 'viewer' });
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('bulkInvite', () => {
    it('should call POST /api/team/bulk-invite with invitations array', async () => {
      const invites = [{ name: 'A', email: 'a@t.com' }, { name: 'B', email: 'b@t.com', role: 'admin' }];
      await api.team.bulkInvite(invites);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/team/bulk-invite');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('invitations');
      expect(body.invitations).toHaveLength(2);
    });
  });

  describe('updateRole', () => {
    it('should call PATCH /api/team/:userId with role', async () => {
      await api.team.updateRole('user-1', 'admin');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/team/user-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ role: 'admin' });
    });
  });

  describe('remove', () => {
    it('should call DELETE /api/team/:userId', async () => {
      await api.team.remove('user-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/team/user-1');
      expect(options.method).toBe('DELETE');
    });
  });
});
