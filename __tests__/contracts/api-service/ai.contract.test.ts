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

describe('api.ai contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse({});
    });
  });

  describe('generateReport', () => {
    it('should call POST /api/ai/report', async () => {
      await api.ai.generateReport('SOC2', 'Acme', 'context');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/report');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toEqual({ framework: 'SOC2', companyName: 'Acme', context: 'context' });
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('generatePolicy', () => {
    it('should call POST /api/ai/policy', async () => {
      await api.ai.generatePolicy('privacy', 'Acme', 'formal');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/policy');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ type: 'privacy', company: 'Acme', tone: 'formal' });
    });
  });

  describe('analyzeContract', () => {
    it('should call POST /api/ai/contract', async () => {
      await api.ai.analyzeContract('contract text here');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/contract');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ text: 'contract text here' });
    });
  });

  describe('performGapAnalysis', () => {
    it('should call POST /api/ai/gap-analysis', async () => {
      await api.ai.performGapAnalysis(['ctrl1'], 'SOC2');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/gap-analysis');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body.current).toEqual(['ctrl1']);
      expect(body.target).toEqual(['SOC2']);
    });
  });

  describe('generateRFPResponse', () => {
    it('should call POST /api/ai/rfp', async () => {
      await api.ai.generateRFPResponse('question?', 'ctx');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/rfp');
      expect(JSON.parse(options.body)).toEqual({ question: 'question?', context: 'ctx' });
    });
  });

  describe('generatePhishing', () => {
    it('should call POST /api/ai/phishing', async () => {
      await api.ai.generatePhishing('email', 'finance', 'engineering', 'hard');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/phishing');
      expect(JSON.parse(options.body)).toEqual({ type: 'email', theme: 'finance', department: 'engineering', difficulty: 'hard' });
    });
  });

  describe('scoreVendor', () => {
    it('should call POST /api/ai/vendor-score', async () => {
      await api.ai.scoreVendor('VendorX', 'Cloud', 'PII');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/vendor-score');
      expect(JSON.parse(options.body)).toEqual({ vendor: 'VendorX', service: 'Cloud', dataAccess: 'PII' });
    });
  });

  describe('generateDataMap', () => {
    it('should call POST /api/ai/data-map', async () => {
      await api.ai.generateDataMap('user registration');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/data-map');
      expect(JSON.parse(options.body)).toEqual({ process: 'user registration' });
    });
  });

  describe('generateBCP', () => {
    it('should call POST /api/ai/bcp', async () => {
      await api.ai.generateBCP('ransomware', '4h', '1h');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/bcp');
      expect(JSON.parse(options.body)).toEqual({ scenario: 'ransomware', rto: '4h', rpo: '1h' });
    });
  });

  describe('chat', () => {
    it('should call POST /api/ai/chat', async () => {
      await api.ai.chat('How to comply?', [{ filename: 'f.txt', content: 'data', type: 'text' }]);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/chat');
      const body = JSON.parse(options.body);
      expect(body.message).toBe('How to comply?');
      expect(body.fileContext).toHaveLength(1);
    });
  });

  describe('crossFrameworkMapping', () => {
    it('should call POST /api/ai/cross-framework-mapping', async () => {
      await api.ai.crossFrameworkMapping('SOC2', 'ISO27001', [{ id: 'c1' }], [{ id: 'c2' }]);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/cross-framework-mapping');
      const body = JSON.parse(options.body);
      expect(body.sourceFramework).toBe('SOC2');
      expect(body.targetFramework).toBe('ISO27001');
    });
  });

  describe('autoRemediation', () => {
    it('should call POST /api/ai/auto-remediation', async () => {
      await api.ai.autoRemediation('SOC2', [{ gap: 'g1' }], 'startup');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/auto-remediation');
      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('framework', 'SOC2');
      expect(body).toHaveProperty('gaps');
      expect(body).toHaveProperty('organizationContext', 'startup');
    });
  });

  describe('evidenceCompleteness', () => {
    it('should call POST /api/ai/evidence-completeness', async () => {
      await api.ai.evidenceCompleteness('SOC2', [{ name: 'c1' }]);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/evidence-completeness');
      expect(JSON.parse(options.body)).toHaveProperty('framework', 'SOC2');
    });
  });

  describe('agenticVendorRisk', () => {
    it('should call POST /api/ai/agentic-vendor-risk', async () => {
      await api.ai.agenticVendorRisk({ name: 'V1' }, ['security']);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/agentic-vendor-risk');
      const body = JSON.parse(options.body);
      expect(body.vendor).toEqual({ name: 'V1' });
      expect(body.assessmentScope).toEqual(['security']);
    });
  });

  describe('auditSimulation', () => {
    it('should call POST /api/ai/audit-simulation', async () => {
      await api.ai.auditSimulation('SOC2', 'Access Control', [{ id: 'c1' }]);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/audit-simulation');
      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('framework', 'SOC2');
      expect(body).toHaveProperty('controlDomain', 'Access Control');
      expect(body).toHaveProperty('controlsToAudit');
    });
  });

  describe('naturalLanguageQuery', () => {
    it('should call POST /api/ai/nl-query', async () => {
      await api.ai.naturalLanguageQuery('show risks', { frameworks: [] });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/nl-query');
      expect(JSON.parse(options.body)).toHaveProperty('query', 'show risks');
    });
  });

  describe('complianceCopilot', () => {
    it('should call POST /api/ai/copilot', async () => {
      await api.ai.complianceCopilot('help', [], { page: 'dashboard' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/copilot');
      const body = JSON.parse(options.body);
      expect(body.message).toBe('help');
      expect(body.conversationHistory).toEqual([]);
    });
  });

  describe('forecastComplianceScore', () => {
    it('should call POST /api/ai/forecast', async () => {
      await api.ai.forecastComplianceScore([{ score: 80 }], ['new regulation'], []);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/forecast');
      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('currentScores');
      expect(body).toHaveProperty('upcomingChanges');
    });
  });

  describe('analyzeProcess', () => {
    it('should call POST /api/ai/analyze-process', async () => {
      await api.ai.analyzeProcess('User onboarding', 'HR', ['SOC2']);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/ai/analyze-process');
      const body = JSON.parse(options.body);
      expect(body).toEqual({ processDescription: 'User onboarding', category: 'HR', complianceFrameworks: ['SOC2'] });
    });
  });
});
