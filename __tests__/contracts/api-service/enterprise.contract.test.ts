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

describe('api.enterprise contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse({});
    });
  });

  // === Questionnaires ===
  describe('questionnaires.list', () => {
    it('should call GET /api/enterprise/questionnaires', async () => {
      await api.enterprise.questionnaires.list();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/questionnaires');
    });
  });

  describe('questionnaires.getById', () => {
    it('should call GET /api/enterprise/questionnaires/:id', async () => {
      await api.enterprise.questionnaires.getById('q-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/questionnaires/q-1');
    });
  });

  describe('questionnaires.getMetrics', () => {
    it('should call GET /api/enterprise/questionnaires/metrics', async () => {
      await api.enterprise.questionnaires.getMetrics();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/questionnaires/metrics');
    });
  });

  describe('questionnaires.getTemplates', () => {
    it('should call GET /api/enterprise/questionnaires/templates', async () => {
      await api.enterprise.questionnaires.getTemplates();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/questionnaires/templates');
    });
  });

  describe('questionnaires.create', () => {
    it('should call POST /api/enterprise/questionnaires', async () => {
      await api.enterprise.questionnaires.create({ title: 'Q1', type: 'security' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/questionnaires');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('title', 'Q1');
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('questionnaires.createFromTemplate', () => {
    it('should call POST /api/enterprise/questionnaires/from-template', async () => {
      await api.enterprise.questionnaires.createFromTemplate({ templateId: 'tpl-1', title: 'From Template' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/questionnaires/from-template');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('templateId', 'tpl-1');
    });
  });

  describe('questionnaires.update', () => {
    it('should call PUT /api/enterprise/questionnaires/:id', async () => {
      await api.enterprise.questionnaires.update('q-1', { title: 'Updated' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/questionnaires/q-1');
      expect(options.method).toBe('PUT');
    });
  });

  describe('questionnaires.delete', () => {
    it('should call DELETE /api/enterprise/questionnaires/:id', async () => {
      await api.enterprise.questionnaires.delete('q-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/questionnaires/q-1');
      expect(options.method).toBe('DELETE');
    });
  });

  describe('questionnaires.addQuestions', () => {
    it('should call POST /api/enterprise/questionnaires/:id/questions', async () => {
      await api.enterprise.questionnaires.addQuestions('q-1', [{ text: 'Q?' }]);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/questionnaires/q-1/questions');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('questions');
    });
  });

  describe('questionnaires.submitResponse', () => {
    it('should call POST /api/enterprise/questionnaires/:id/responses', async () => {
      await api.enterprise.questionnaires.submitResponse('q-1', { questionId: 'qn-1', responseText: 'Yes' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/questionnaires/q-1/responses');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('questionId', 'qn-1');
    });
  });

  describe('questionnaires.aiGenerate', () => {
    it('should call POST /api/enterprise/questionnaires/:id/ai-generate', async () => {
      await api.enterprise.questionnaires.aiGenerate('q-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/questionnaires/q-1/ai-generate');
      expect(options.method).toBe('POST');
    });
  });

  describe('questionnaires.complete', () => {
    it('should call POST /api/enterprise/questionnaires/:id/complete', async () => {
      await api.enterprise.questionnaires.complete('q-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/questionnaires/q-1/complete');
      expect(options.method).toBe('POST');
    });
  });

  // === Policies ===
  describe('policies.list', () => {
    it('should call GET /api/enterprise/policies', async () => {
      await api.enterprise.policies.list();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/policies');
    });
  });

  describe('policies.getById', () => {
    it('should call GET /api/enterprise/policies/:id', async () => {
      await api.enterprise.policies.getById('pol-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/policies/pol-1');
    });
  });

  describe('policies.create', () => {
    it('should call POST /api/enterprise/policies', async () => {
      await api.enterprise.policies.create({ title: 'Privacy Policy', category: 'privacy' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/policies');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('title', 'Privacy Policy');
    });
  });

  describe('policies.update', () => {
    it('should call PUT /api/enterprise/policies/:id', async () => {
      await api.enterprise.policies.update('pol-1', { title: 'Updated' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/policies/pol-1');
      expect(options.method).toBe('PUT');
    });
  });

  describe('policies.delete', () => {
    it('should call DELETE /api/enterprise/policies/:id', async () => {
      await api.enterprise.policies.delete('pol-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/policies/pol-1');
      expect(options.method).toBe('DELETE');
    });
  });

  describe('policies.approve', () => {
    it('should call POST /api/enterprise/policies/:id/approve', async () => {
      await api.enterprise.policies.approve('pol-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/policies/pol-1/approve');
      expect(options.method).toBe('POST');
    });
  });

  describe('policies.submitForReview', () => {
    it('should call POST /api/enterprise/policies/:id/submit-review', async () => {
      await api.enterprise.policies.submitForReview('pol-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/policies/pol-1/submit-review');
      expect(options.method).toBe('POST');
    });
  });

  describe('policies.duplicate', () => {
    it('should call POST /api/enterprise/policies/:id/duplicate', async () => {
      await api.enterprise.policies.duplicate('pol-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/policies/pol-1/duplicate');
      expect(options.method).toBe('POST');
    });
  });

  describe('policies.getTemplates', () => {
    it('should call GET /api/enterprise/policies/templates', async () => {
      await api.enterprise.policies.getTemplates();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/policies/templates');
    });

    it('should pass category param', async () => {
      await api.enterprise.policies.getTemplates('security');
      const [url] = getCalls()[0];
      expect(url).toContain('category=security');
    });
  });

  describe('policies.getMetrics', () => {
    it('should call GET /api/enterprise/policies/metrics', async () => {
      await api.enterprise.policies.getMetrics();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/policies/metrics');
    });
  });

  describe('policies.generatePolicy', () => {
    it('should call POST /api/enterprise/visionary-ai/generate-policy', async () => {
      await api.enterprise.policies.generatePolicy({ description: 'Data handling', category: 'privacy' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/visionary-ai/generate-policy');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('description', 'Data handling');
    });
  });

  // === Monitoring ===
  describe('monitoring.list', () => {
    it('should call GET /api/enterprise/monitoring', async () => {
      await api.enterprise.monitoring.list();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/monitoring');
    });
  });

  describe('monitoring.getById', () => {
    it('should call GET /api/enterprise/monitoring/:id', async () => {
      await api.enterprise.monitoring.getById('mon-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/monitoring/mon-1');
    });
  });

  describe('monitoring.getDashboard', () => {
    it('should call GET /api/enterprise/monitoring/dashboard', async () => {
      await api.enterprise.monitoring.getDashboard();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/monitoring/dashboard');
    });
  });

  describe('monitoring.create', () => {
    it('should call POST /api/enterprise/monitoring', async () => {
      await api.enterprise.monitoring.create({ name: 'Monitor 1', type: 'api' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/monitoring');
      expect(options.method).toBe('POST');
    });
  });

  describe('monitoring.update', () => {
    it('should call PATCH /api/enterprise/monitoring/:id', async () => {
      await api.enterprise.monitoring.update('mon-1', { name: 'Updated' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/monitoring/mon-1');
      expect(options.method).toBe('PATCH');
    });
  });

  describe('monitoring.delete', () => {
    it('should call DELETE /api/enterprise/monitoring/:id', async () => {
      await api.enterprise.monitoring.delete('mon-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/monitoring/mon-1');
      expect(options.method).toBe('DELETE');
    });
  });

  describe('monitoring.execute', () => {
    it('should call POST /api/enterprise/monitoring/:id/execute', async () => {
      await api.enterprise.monitoring.execute('mon-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/monitoring/mon-1/execute');
      expect(options.method).toBe('POST');
    });
  });

  describe('monitoring.getResults', () => {
    it('should call GET /api/enterprise/monitoring/:id/results', async () => {
      await api.enterprise.monitoring.getResults('mon-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/monitoring/mon-1/results');
      expect(url).toContain('limit=30');
    });
  });

  describe('monitoring.toggle', () => {
    it('should call PATCH /api/enterprise/monitoring/:id/toggle', async () => {
      await api.enterprise.monitoring.toggle('mon-1', true);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/monitoring/mon-1/toggle');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ active: true });
    });
  });

  describe('monitoring.aiSuggest', () => {
    it('should call POST /api/enterprise/monitoring/ai-suggest', async () => {
      await api.enterprise.monitoring.aiSuggest();
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/monitoring/ai-suggest');
      expect(options.method).toBe('POST');
    });
  });

  describe('monitoring.aiAnalyze', () => {
    it('should call POST /api/enterprise/monitoring/:id/ai-analyze', async () => {
      await api.enterprise.monitoring.aiAnalyze('mon-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/monitoring/mon-1/ai-analyze');
      expect(options.method).toBe('POST');
    });
  });

  describe('monitoring.aiTriage', () => {
    it('should call POST /api/enterprise/monitoring/ai-triage', async () => {
      await api.enterprise.monitoring.aiTriage();
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/monitoring/ai-triage');
      expect(options.method).toBe('POST');
    });
  });

  // === Issues ===
  describe('issues.list', () => {
    it('should call GET /api/enterprise/issues', async () => {
      await api.enterprise.issues.list();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/issues');
    });
  });

  describe('issues.getById', () => {
    it('should call GET /api/enterprise/issues/:id', async () => {
      await api.enterprise.issues.getById('iss-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/issues/iss-1');
    });
  });

  describe('issues.getDashboard', () => {
    it('should call GET /api/enterprise/issues/dashboard', async () => {
      await api.enterprise.issues.getDashboard();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/issues/dashboard');
    });
  });

  describe('issues.create', () => {
    it('should call POST /api/enterprise/issues', async () => {
      await api.enterprise.issues.create({ title: 'Issue 1', severity: 'high' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/issues');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('title', 'Issue 1');
    });
  });

  describe('issues.update', () => {
    it('should call PATCH /api/enterprise/issues/:id', async () => {
      await api.enterprise.issues.update('iss-1', { status: 'closed' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/issues/iss-1');
      expect(options.method).toBe('PATCH');
    });
  });

  describe('issues.updateStatus', () => {
    it('should call PATCH /api/enterprise/issues/:id/status', async () => {
      await api.enterprise.issues.updateStatus('iss-1', 'resolved');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/issues/iss-1/status');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ status: 'resolved' });
    });
  });

  describe('issues.delete', () => {
    it('should call DELETE /api/enterprise/issues/:id', async () => {
      await api.enterprise.issues.delete('iss-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/issues/iss-1');
      expect(options.method).toBe('DELETE');
    });
  });

  describe('issues.assign', () => {
    it('should call POST /api/enterprise/issues/:id/assign', async () => {
      await api.enterprise.issues.assign('iss-1', 'user-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/issues/iss-1/assign');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ assignedToId: 'user-1' });
    });
  });

  describe('issues.addComment', () => {
    it('should call POST /api/enterprise/issues/:id/comments', async () => {
      await api.enterprise.issues.addComment('iss-1', 'This is a comment');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/issues/iss-1/comments');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ comment: 'This is a comment' });
    });
  });

  describe('issues.getComments', () => {
    it('should call GET /api/enterprise/issues/:id/comments', async () => {
      await api.enterprise.issues.getComments('iss-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/issues/iss-1/comments');
    });
  });

  // === Reports ===
  describe('reports.list', () => {
    it('should call GET /api/enterprise/reports', async () => {
      await api.enterprise.reports.list();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/reports');
    });
  });

  describe('reports.getExecutiveSummary', () => {
    it('should call GET /api/enterprise/reports/executive-summary', async () => {
      await api.enterprise.reports.getExecutiveSummary();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/reports/executive-summary');
    });
  });

  describe('reports.getRiskReport', () => {
    it('should call GET /api/enterprise/reports/risk', async () => {
      await api.enterprise.reports.getRiskReport();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/reports/risk');
    });
  });

  describe('reports.getVendorRiskReport', () => {
    it('should call GET /api/enterprise/reports/vendor-risk', async () => {
      await api.enterprise.reports.getVendorRiskReport();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/reports/vendor-risk');
    });
  });

  describe('reports.getComplianceReport', () => {
    it('should call GET /api/enterprise/reports/compliance', async () => {
      await api.enterprise.reports.getComplianceReport('fw-1');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/reports/compliance');
      expect(url).toContain('frameworkId=fw-1');
    });
  });

  describe('reports.create', () => {
    it('should call POST /api/enterprise/reports', async () => {
      await api.enterprise.reports.create({ title: 'Report 1', type: 'executive' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/reports');
      expect(options.method).toBe('POST');
    });
  });

  // === Autopilot ===
  describe('autopilot.run', () => {
    it('should call POST /api/enterprise/visionary-ai/autopilot/run', async () => {
      await api.enterprise.autopilot.run({ scope: 'full' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/visionary-ai/autopilot/run');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toHaveProperty('options');
    });
  });

  // === Risk Assessments ===
  describe('riskAssessments.create', () => {
    it('should call POST /api/enterprise/risk-management/assessments', async () => {
      await api.enterprise.riskAssessments.create({ riskId: 'r-1', score: 7 });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/risk-management/assessments');
      expect(options.method).toBe('POST');
    });
  });

  // === Workspaces ===
  describe('workspaces.getHierarchy', () => {
    it('should call GET /api/enterprise/workspace/hierarchy', async () => {
      await api.enterprise.workspaces.getHierarchy();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/workspace/hierarchy');
    });
  });

  describe('workspaces.getConsolidatedMetrics', () => {
    it('should call GET /api/enterprise/workspace/consolidated-metrics', async () => {
      await api.enterprise.workspaces.getConsolidatedMetrics();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/workspace/consolidated-metrics');
    });
  });

  describe('workspaces.createChild', () => {
    it('should call POST /api/enterprise/workspace/child-organizations', async () => {
      await api.enterprise.workspaces.createChild({ name: 'Child Org' });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/workspace/child-organizations');
      expect(options.method).toBe('POST');
    });
  });

  describe('workspaces.moveUser', () => {
    it('should call POST /api/enterprise/workspace/move-user', async () => {
      await api.enterprise.workspaces.moveUser('user-1', 'org-2');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/workspace/move-user');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ userId: 'user-1', targetOrganizationId: 'org-2' });
    });
  });

  describe('workspaces.cloneFramework', () => {
    it('should call POST /api/enterprise/workspace/clone-framework', async () => {
      await api.enterprise.workspaces.cloneFramework('fw-1', ['org-2']);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/workspace/clone-framework');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ frameworkId: 'fw-1', targetOrganizationIds: ['org-2'] });
    });
  });

  // === Visionary AI ===
  describe('visionaryAI.getCoPilotRecommendations', () => {
    it('should call GET /api/enterprise/visionary-ai/copilot/recommendations', async () => {
      await api.enterprise.visionaryAI.getCoPilotRecommendations();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/visionary-ai/copilot/recommendations');
    });
  });

  describe('visionaryAI.predictRisks', () => {
    it('should call POST /api/enterprise/visionary-ai/predict-risks', async () => {
      await api.enterprise.visionaryAI.predictRisks(60);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/enterprise/visionary-ai/predict-risks');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ timeHorizonDays: 60 });
    });
  });

  describe('visionaryAI.getBenchmarking', () => {
    it('should call GET /api/enterprise/visionary-ai/benchmarking', async () => {
      await api.enterprise.visionaryAI.getBenchmarking('Healthcare');
      const [url] = getCalls()[0];
      expect(url).toContain('/api/enterprise/visionary-ai/benchmarking');
      expect(url).toContain('industry=Healthcare');
    });
  });
});
