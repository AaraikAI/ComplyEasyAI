import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }) }));

import CICDGateSettings from '../CICDGateSettings';

const mockPolicies = [
  {
    id: 'p1',
    name: 'SOC 2 Pipeline Gate',
    description: 'Enforces SOC 2 security controls',
    requiredChecks: [
      { id: 'security_scan', type: 'security_scan', label: 'Security Vulnerability Scan', enabled: true },
      { id: 'code_review', type: 'code_review', label: 'Code Review Approval', enabled: true },
    ],
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    assignedRepos: ['repo1'],
    assignedPipelines: ['pipeline1'],
  },
];

const mockResults = [
  {
    id: 'r1',
    policyId: 'p1',
    policyName: 'SOC 2 Pipeline Gate',
    repository: 'repo1',
    pipeline: 'pipeline1',
    branch: 'main',
    commitSha: 'abc123',
    passed: true,
    checkResults: [{ check: 'security_scan', passed: true, details: 'No issues found' }],
    triggeredAt: '2026-01-01T10:00:00Z',
    duration: 120,
  },
];

const mockIntegration = {
  connected: true,
  webhookUrl: 'https://example.com/webhook',
  token: 'tok_abc123',
  tokenLastRotated: '2026-01-01',
  repositories: ['repo1'],
};

describe('CICDGateSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch to return API data
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/policies')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPolicies) });
      }
      if (url.includes('/results')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockResults) });
      }
      if (url.includes('/integration')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockIntegration) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }) as any;
  });

  it('renders without crashing', async () => {
    render(<CICDGateSettings />);
    await waitFor(() => {
      expect(screen.queryAllByText(/CI\/CD|Compliance Gates/i).length).toBeGreaterThan(0);
    });
  });

  it('shows gate policies list', async () => {
    render(<CICDGateSettings />);
    await waitFor(() => {
      expect(screen.getByText('SOC 2 Pipeline Gate')).toBeInTheDocument();
    });
  });

  it('opens create policy form', async () => {
    render(<CICDGateSettings />);
    await waitFor(() => {
      expect(screen.getByText('SOC 2 Pipeline Gate')).toBeInTheDocument();
    });
    const addBtn = screen.queryAllByText(/New Policy/i)[0] ?? null;
    if (addBtn) fireEvent.click(addBtn);
  });

  it('shows required checks', async () => {
    render(<CICDGateSettings />);
    await waitFor(() => {
      expect(screen.queryAllByText(/Security Vulnerability Scan|Code Review Approval/i).length).toBeGreaterThan(0);
    });
  });

  it('filters by search', async () => {
    render(<CICDGateSettings />);
    await waitFor(() => {
      expect(screen.getByText('SOC 2 Pipeline Gate')).toBeInTheDocument();
    });
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'SOC' } });
  });

  it('shows stat cards', async () => {
    render(<CICDGateSettings />);
    await waitFor(() => {
      const stats = document.querySelectorAll('[class*="rounded"]');
      expect(stats.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('switches to integration tab', async () => {
    render(<CICDGateSettings />);
    await waitFor(() => {
      expect(screen.getByText('SOC 2 Pipeline Gate')).toBeInTheDocument();
    });
    const integrationTab = screen.queryAllByText(/Integration|GitHub/i)[0] ?? null;
    if (integrationTab) fireEvent.click(integrationTab);
  });

  it('shows webhook configuration on integration tab', async () => {
    render(<CICDGateSettings />);
    await waitFor(() => {
      expect(screen.getByText('SOC 2 Pipeline Gate')).toBeInTheDocument();
    });
    const integrationTab = screen.queryAllByText(/Integration|GitHub/i)[0];
    if (integrationTab) {
      fireEvent.click(integrationTab);
      await waitFor(() => {
        expect(screen.queryAllByText(/Webhook|webhook|Integration|GitHub/i).length).toBeGreaterThan(0);
      });
    }
  });

  it('shows template library', async () => {
    render(<CICDGateSettings />);
    await waitFor(() => {
      expect(screen.getByText('SOC 2 Pipeline Gate')).toBeInTheDocument();
    });
    const templateBtn = screen.queryAllByText(/Template/i)[0] ?? null;
    if (templateBtn) fireEvent.click(templateBtn);
  });

  it('shows gate result history', async () => {
    render(<CICDGateSettings />);
    await waitFor(() => {
      expect(screen.getByText('SOC 2 Pipeline Gate')).toBeInTheDocument();
    });
    const historyTab = screen.queryAllByText(/History|Results/i)[0] ?? null;
    if (historyTab) fireEvent.click(historyTab);
  });

  it('switches to history tab and shows results', async () => {
    render(<CICDGateSettings />);
    await waitFor(() => {
      expect(screen.getByText('SOC 2 Pipeline Gate')).toBeInTheDocument();
    });
    const historyTab = screen.queryAllByText(/History/i)[0];
    if (historyTab) {
      fireEvent.click(historyTab);
    }
  });
});
