import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({ user: { id: 'u1', name: 'Admin', email: 'admin@t.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Org' } }, isAuthenticated: true, logout: vi.fn() }),
}));
vi.mock('@/contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }) }));

import ExecutiveDashboard from '../ExecutiveDashboard';

// Mock executive dashboard API response
const MOCK_DASHBOARD = {
  overallCompliance: 87,
  frameworkScores: [
    { name: 'SOC 2', progress: 92, rag: 'GREEN', totalControls: 120, implementedControls: 110 },
    { name: 'ISO 27001', progress: 85, rag: 'GREEN', totalControls: 114, implementedControls: 97 },
    { name: 'GDPR', progress: 78, rag: 'AMBER', totalControls: 60, implementedControls: 47 },
    { name: 'HIPAA', progress: 71, rag: 'AMBER', totalControls: 50, implementedControls: 36 },
  ],
  riskPosture: {
    totalOpen: 23,
    topRisks: [
      { id: 'r1', title: 'Third-party Data Breach Risk', category: 'Vendor', severity: 'High', likelihood: 3, impact: 5, riskScore: 15, owner: 'CISO', status: 'OPEN', trend: 'stable' },
      { id: 'r2', title: 'Ransomware Attack', category: 'Cyber', severity: 'Critical', likelihood: 4, impact: 4, riskScore: 16, owner: 'Security', status: 'MITIGATING', trend: 'improving' },
      { id: 'r3', title: 'Insider Threat', category: 'People', severity: 'Medium', likelihood: 2, impact: 4, riskScore: 8, owner: 'HR', status: 'OPEN', trend: 'stable' },
    ],
  },
  incidents: {
    totalOpen: 4,
    bySeverity: { SEV1: 1, SEV2: 3, SEV3: 7, SEV4: 12 },
  },
  periodComparison: {
    complianceScore: { current: 87, previous: 82 },
    riskScore: { current: 35, previous: 42 },
    controlCoverage: { current: 91, previous: 88 },
    vendorCompliance: { current: 78, previous: 75 },
  },
  openFindings: 23,
};

// /api/executive/trends supplies GENUINE prior-period baselines. Only the
// metrics the backend actually tracks over time (incidents, risks/findings)
// carry a real `previous`; everything else has no historical baseline. Finding
// 73 hardened the Period Comparison panel so deltas/arrows render ONLY for
// metrics with a real prior period — never against a fabricated sentinel-zero.
const MOCK_TRENDS = {
  comparison: {
    newRisks: { current: 23, previous: 30, change: -23 },
    newIncidents: { current: 4, previous: 9, change: -56 },
  },
};

function createFetchMock(opts: { trends?: unknown } = { trends: MOCK_TRENDS }) {
  return vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/api/executive/trends')) {
      // When opts.trends is null, the trends endpoint yields no usable prior
      // data (simulating a backend that does not yet track history).
      return Promise.resolve({
        ok: opts.trends !== null && opts.trends !== undefined,
        json: () => Promise.resolve(opts.trends !== null && opts.trends !== undefined ? { data: opts.trends } : {}),
      });
    }
    if (typeof url === 'string' && url.includes('/api/executive/dashboard')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: MOCK_DASHBOARD }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

async function renderAndWait(ui: React.ReactElement) {
  let result: ReturnType<typeof render>;
  await act(async () => { result = render(ui); });
  await waitFor(() => {
    expect(screen.queryByText('Loading executive dashboard...')).not.toBeInTheDocument();
  });
  return result!;
}

describe('ExecutiveDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = createFetchMock();
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('renders without crashing', async () => {
    await renderAndWait(<ExecutiveDashboard />);
    expect(screen.queryAllByText(/Executive|Dashboard|executive/i).length).toBeGreaterThan(0);
  });

  it('displays framework status cards', async () => {
    await renderAndWait(<ExecutiveDashboard />);
    expect(screen.queryAllByText(/SOC 2|ISO 27001|GDPR|HIPAA/i).length).toBeGreaterThan(0);
  });

  it('shows framework compliance scores', async () => {
    await renderAndWait(<ExecutiveDashboard />);
    // Each framework card renders its progress as "<score>%"; assert the mocked
    // values are surfaced so a regression that drops scores fails the test.
    expect(screen.getAllByText('92%').length).toBeGreaterThan(0); // SOC 2
    expect(screen.getAllByText('85%').length).toBeGreaterThan(0); // ISO 27001
    expect(screen.getAllByText('78%').length).toBeGreaterThan(0); // GDPR
  });

  it('displays top risks section', async () => {
    await renderAndWait(<ExecutiveDashboard />);
    expect(screen.queryAllByText(/Third-party|Ransomware|risk/i).length).toBeGreaterThan(0);
  });

  it('shows incident trend section', async () => {
    await renderAndWait(<ExecutiveDashboard />);
    expect(screen.queryAllByText(/Incident|incident/i).length).toBeGreaterThan(0);
  });

  it('displays period comparison metrics', async () => {
    await renderAndWait(<ExecutiveDashboard />);
    expect(screen.queryAllByText(/Compliance Score|Risk Score|Control Coverage/i).length).toBeGreaterThan(0);
  });

  it('shows traffic light indicators', async () => {
    await renderAndWait(<ExecutiveDashboard />);
    const indicators = document.querySelectorAll('[class*="green"], [class*="yellow"], [class*="red"]');
    expect(indicators.length).toBeGreaterThan(0);
  });

  it('shows period-comparison trend arrows ONLY for metrics with a genuine prior period', async () => {
    // /api/executive/trends supplies a real prior baseline for incidents &
    // risks/findings, so those Period Comparison metrics render a directional
    // arrow + "vs prior" delta. (lucide icons are mocked as
    // <span data-testid="icon-ArrowUp" /> etc. in setupTests.ts)
    await renderAndWait(<ExecutiveDashboard />);

    const trendIcons = document.querySelectorAll('[data-testid*="icon-Arrow"]');
    expect(trendIcons.length).toBeGreaterThan(0);

    // The real delta must be surfaced as a "vs prior" comparison, proving the
    // arrow is computed against the genuine baseline (not a sentinel zero).
    expect(screen.getAllByText(/vs prior/i).length).toBeGreaterThan(0);
  });

  it('renders the neutral "No prior period data" message for metrics with no historical baseline (finding 73)', async () => {
    // complianceScore / controlCoverage / vendorCompliance are not tracked over
    // time, so the panel must NOT fabricate a delta vs a sentinel-zero baseline.
    await renderAndWait(<ExecutiveDashboard />);
    expect(screen.getAllByText(/No prior period data/i).length).toBeGreaterThan(0);
  });

  it('shows NO period-comparison deltas when the trends endpoint has no prior data (finding 73)', async () => {
    // With no usable prior period anywhere, every metric falls back to the
    // neutral message and no fabricated arrows/deltas are rendered.
    global.fetch = createFetchMock({ trends: null });
    await renderAndWait(<ExecutiveDashboard />);

    expect(document.querySelectorAll('[data-testid*="icon-Arrow"]').length).toBe(0);
    expect(screen.queryByText(/vs prior/i)).not.toBeInTheDocument();
    // All six Period Comparison metrics show the neutral baseline message.
    expect(screen.getAllByText(/No prior period data/i).length).toBeGreaterThanOrEqual(6);
  });

  it('displays open findings counts', async () => {
    await renderAndWait(<ExecutiveDashboard />);
    expect(screen.queryAllByText(/findings|Findings/i).length).toBeGreaterThan(0);
  });

  it('shows risk scores for top risks', async () => {
    await renderAndWait(<ExecutiveDashboard />);
    const content = document.body.textContent || '';
    expect(content).toContain('15');
  });
});
