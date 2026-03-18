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

describe('api.cicdGates contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse({});
    });
  });

  describe('listPolicies', () => {
    it('should call GET /api/cicd-gates/policies', async () => {
      await api.cicdGates.listPolicies();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/cicd-gates/policies');
    });
  });

  describe('getPolicy', () => {
    it('should call GET /api/cicd-gates/policies/:id', async () => {
      await api.cicdGates.getPolicy('pol-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/cicd-gates/policies/pol-1');
    });
  });

  describe('createPolicy', () => {
    it('should call POST /api/cicd-gates/policies', async () => {
      const data = { name: 'Security Gate', rules: [] };
      await api.cicdGates.createPolicy(data);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/cicd-gates/policies');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('name', 'Security Gate');
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('updatePolicy', () => {
    it('should call PATCH /api/cicd-gates/policies/:id', async () => {
      await api.cicdGates.updatePolicy('pol-1', { name: 'Updated' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/cicd-gates/policies/pol-1');
      expect(options.method).toBe('PATCH');
    });
  });

  describe('deletePolicy', () => {
    it('should call DELETE /api/cicd-gates/policies/:id', async () => {
      await api.cicdGates.deletePolicy('pol-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/cicd-gates/policies/pol-1');
      expect(options.method).toBe('DELETE');
    });
  });

  describe('check', () => {
    it('should call POST /api/cicd-gates/check', async () => {
      const data = { repository: 'my-repo', branch: 'main', commitSha: 'abc123' };
      await api.cicdGates.check(data);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/cicd-gates/check');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('repository', 'my-repo');
    });
  });

  describe('report', () => {
    it('should call POST /api/cicd-gates/report', async () => {
      const data = { pipelineId: 'pipe-1', results: [] };
      await api.cicdGates.report(data);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/cicd-gates/report');
      expect(options.method).toBe('POST');
    });
  });

  describe('listResults', () => {
    it('should call GET /api/cicd-gates/results', async () => {
      await api.cicdGates.listResults();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/cicd-gates/results');
    });
  });

  describe('getResult', () => {
    it('should call GET /api/cicd-gates/results/:id', async () => {
      await api.cicdGates.getResult('res-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/cicd-gates/results/res-1');
    });
  });
});
