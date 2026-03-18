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

describe('api.frameworks contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse([]);
    });
  });

  describe('list', () => {
    it('should call GET /api/frameworks', async () => {
      await api.frameworks.list();
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/frameworks');
      expect(options.method || 'GET').toBe('GET');
    });
  });

  describe('getById', () => {
    it('should call GET /api/frameworks/:id', async () => {
      await api.frameworks.getById('fw-1');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/frameworks/fw-1');
    });

    it('should append query params when provided', async () => {
      await api.frameworks.getById('fw-1', 'includeControls=true');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/frameworks/fw-1?includeControls=true');
    });
  });

  describe('create', () => {
    it('should call POST /api/frameworks', async () => {
      await api.frameworks.create({ name: 'SOC2' } as any);
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/frameworks');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('name', 'SOC2');
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('update', () => {
    it('should call PATCH /api/frameworks/:id', async () => {
      await api.frameworks.update('fw-1', { name: 'Updated' } as any);
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/frameworks/fw-1');
      expect(options.method).toBe('PATCH');
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/frameworks/:id', async () => {
      await api.frameworks.delete('fw-1');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/frameworks/fw-1');
      expect(options.method).toBe('DELETE');
    });
  });

  describe('createControl', () => {
    it('should call POST /api/frameworks/:fwId/controls', async () => {
      await api.frameworks.createControl('fw-1', { name: 'Control 1', description: 'desc' });
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/frameworks/fw-1/controls');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('name', 'Control 1');
    });
  });

  describe('updateControl', () => {
    it('should call PATCH /api/frameworks/:fwId/controls/:ctrlId', async () => {
      await api.frameworks.updateControl('fw-1', 'ctrl-1', { status: 'implemented' });
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/frameworks/fw-1/controls/ctrl-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toHaveProperty('status', 'implemented');
    });
  });

  describe('deleteControl', () => {
    it('should call DELETE /api/frameworks/:fwId/controls/:ctrlId', async () => {
      await api.frameworks.deleteControl('fw-1', 'ctrl-1');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/frameworks/fw-1/controls/ctrl-1');
      expect(options.method).toBe('DELETE');
    });
  });

  describe('bulkUpdateControls', () => {
    it('should call POST /api/frameworks/:fwId/controls/bulk-update', async () => {
      await api.frameworks.bulkUpdateControls('fw-1', { controlIds: ['c1', 'c2'], status: 'implemented' });
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/frameworks/fw-1/controls/bulk-update');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body.controlIds).toEqual(['c1', 'c2']);
      expect(body.status).toBe('implemented');
    });
  });

  describe('exportControl', () => {
    it('should call GET /api/frameworks/:fwId/controls/:ctrlId/export', async () => {
      await api.frameworks.exportControl('fw-1', 'ctrl-1');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/frameworks/fw-1/controls/ctrl-1/export');
    });
  });

  describe('getEvidenceUrl', () => {
    it('should call GET /api/frameworks/:fwId/controls/:ctrlId/evidence/url', async () => {
      await api.frameworks.getEvidenceUrl('fw-1', 'ctrl-1');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/frameworks/fw-1/controls/ctrl-1/evidence/url');
    });
  });

  describe('getSuggestions', () => {
    it('should call GET /api/frameworks/:fwId/suggestions', async () => {
      await api.frameworks.getSuggestions('fw-1');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/frameworks/fw-1/suggestions');
    });
  });

  describe('acceptSuggestion', () => {
    it('should call POST /api/frameworks/suggestions/:id/accept', async () => {
      await api.frameworks.acceptSuggestion('sug-1');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/frameworks/suggestions/sug-1/accept');
      expect(calls[0][1].method).toBe('POST');
    });
  });

  describe('rejectSuggestion', () => {
    it('should call POST /api/frameworks/suggestions/:id/reject with feedback', async () => {
      await api.frameworks.rejectSuggestion('sug-1', 'Not relevant');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/frameworks/suggestions/sug-1/reject');
      expect(calls[0][1].method).toBe('POST');
      expect(JSON.parse(calls[0][1].body)).toEqual({ feedback: 'Not relevant' });
    });
  });

  describe('getControlMappings', () => {
    it('should call GET /api/control-mappings/control/:ctrlId', async () => {
      await api.frameworks.getControlMappings('ctrl-1');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/control-mappings/control/ctrl-1');
    });
  });

  describe('createControlMapping', () => {
    it('should call POST /api/control-mappings', async () => {
      await api.frameworks.createControlMapping({ sourceControlId: 'c1', targetControlId: 'c2', mappingType: 'equivalent', confidence: 0.9 });
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/control-mappings');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('sourceControlId', 'c1');
      expect(body).toHaveProperty('targetControlId', 'c2');
    });
  });

  describe('deleteControlMapping', () => {
    it('should call DELETE /api/control-mappings/:id', async () => {
      await api.frameworks.deleteControlMapping('map-1');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/control-mappings/map-1');
      expect(calls[0][1].method).toBe('DELETE');
    });
  });

  describe('getEvidenceVersions', () => {
    it('should call GET /api/evidence-versions/control/:ctrlId', async () => {
      await api.frameworks.getEvidenceVersions('ctrl-1');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/evidence-versions/control/ctrl-1');
    });
  });

  describe('restoreEvidenceVersion', () => {
    it('should call POST with correct path', async () => {
      await api.frameworks.restoreEvidenceVersion('ctrl-1', 'v-1');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/evidence-versions/control/ctrl-1/restore/v-1');
      expect(calls[0][1].method).toBe('POST');
    });
  });

  describe('deleteEvidenceVersion', () => {
    it('should call DELETE with correct path', async () => {
      await api.frameworks.deleteEvidenceVersion('ctrl-1', 'v-1');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/evidence-versions/control/ctrl-1/v-1');
      expect(calls[0][1].method).toBe('DELETE');
    });
  });

  describe('getTemplates', () => {
    it('should call GET /api/frameworks/templates', async () => {
      await api.frameworks.getTemplates();
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/frameworks/templates');
    });
  });

  describe('applyTemplate', () => {
    it('should call POST /api/frameworks/:fwId/apply-template', async () => {
      await api.frameworks.applyTemplate('fw-1', 'SOC2');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/frameworks/fw-1/apply-template');
      expect(calls[0][1].method).toBe('POST');
      expect(JSON.parse(calls[0][1].body)).toEqual({ frameworkType: 'SOC2' });
    });
  });

  describe('regenerateMappings', () => {
    it('should call POST /api/frameworks/:fwId/regenerate-mappings', async () => {
      await api.frameworks.regenerateMappings('fw-1');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls[0][0]).toContain('/api/frameworks/fw-1/regenerate-mappings');
      expect(calls[0][1].method).toBe('POST');
    });
  });
});
