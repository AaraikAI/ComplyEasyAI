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

describe('api.certifications contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse({});
    });
  });

  describe('list', () => {
    it('should call GET /api/certifications', async () => {
      await api.certifications.list();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/certifications');
    });
  });

  describe('get', () => {
    it('should call GET /api/certifications/:id', async () => {
      await api.certifications.get('cert-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/certifications/cert-1');
    });
  });

  describe('create', () => {
    it('should call POST /api/certifications', async () => {
      const data = { name: 'ISO 27001', expiresAt: '2025-01-01' };
      await api.certifications.create(data);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/certifications');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('name', 'ISO 27001');
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('update', () => {
    it('should call PATCH /api/certifications/:id', async () => {
      await api.certifications.update('cert-1', { status: 'expired' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/certifications/cert-1');
      expect(options.method).toBe('PATCH');
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/certifications/:id', async () => {
      await api.certifications.delete('cert-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/certifications/cert-1');
      expect(options.method).toBe('DELETE');
    });
  });

  describe('scheduleAudit', () => {
    it('should call POST /api/certifications/:id/audits', async () => {
      await api.certifications.scheduleAudit('cert-1', { date: '2024-06-01', auditor: 'EY' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/certifications/cert-1/audits');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('auditor', 'EY');
    });
  });

  describe('updateAudit', () => {
    it('should call PATCH /api/certifications/:id/audits/:auditId', async () => {
      await api.certifications.updateAudit('cert-1', 'audit-1', { status: 'completed' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/certifications/cert-1/audits/audit-1');
      expect(options.method).toBe('PATCH');
    });
  });

  describe('getExpiring', () => {
    it('should call GET /api/certifications/expiring with days param', async () => {
      await api.certifications.getExpiring(60);
      const [url] = getCalls()[0];
      expect(url).toContain('/api/certifications/expiring');
      expect(url).toContain('days=60');
    });
  });
});
