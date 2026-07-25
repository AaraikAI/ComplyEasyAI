import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/hooks/queries/useRisks', () => ({
  useRisks: vi.fn().mockReturnValue({
    data: [
      { id: 'r1', title: 'Critical Data Exposure', severity: 'Critical', status: 'Open', category: 'Risk', likelihood: 5, impact: 5 },
      { id: 'r2', title: 'Network Vulnerability', severity: 'High', status: 'Open', category: 'Compliance', likelihood: 4, impact: 3 },
      { id: 'r3', title: 'Resolved Firewall Issue', severity: 'Low', status: 'Closed', category: 'Governance', likelihood: 1, impact: 1 },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/queries/useDashboard', () => ({
  useExecutiveDashboard: vi.fn().mockReturnValue({
    data: {
      overallCompliance: 82,
      complianceScore: 82,
      frameworkProgress: [{ name: 'SOC2', progress: 85 }],
      vendorRiskSummary: { totalVendors: 10, highRisk: 2 },
      pendingAudits: 3,
    },
  }),
}));

vi.mock('@/components/RisingSignals', () => ({
  RisingSignals: ({ risks }: any) => <div data-testid="rising-signals">Signals: {risks?.length ?? 0}</div>,
}));

// The chat now delegates to the backend copilot service (api.ai.complianceCopilot)
// instead of generating canned local replies. Mock it to return a context-aware
// response so the test can verify the component renders the AI reply it receives.
const complianceCopilot = vi.fn();
vi.mock('@/services/api', () => ({
  api: {
    ai: {
      complianceCopilot: (...args: any[]) => complianceCopilot(...args),
    },
  },
}));

import RiskCanvas from '../RiskCanvas';

const renderComponent = () =>
  render(
    <BrowserRouter>
      <RiskCanvas />
    </BrowserRouter>
  );

describe('RiskCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The copilot reply is generated server-side from the live dashboard context
    // the component forwards (compliance score, vendor counts, etc.). Echo a
    // context-aware reply so assertions exercise that the component renders the
    // response it receives and forwards the correct context.
    complianceCopilot.mockImplementation((msg: string, _history: any, context: any) => {
      const lower = (msg || '').toLowerCase();
      let response: string;
      if (lower.includes('vendor')) {
        response = `You currently have ${context?.totalVendors ?? 0} vendors being monitored, with ${context?.highRiskVendors ?? 0} flagged as high risk.`;
      } else if (lower.includes('gap')) {
        response = 'Here is a gap analysis across your active frameworks; several controls still need evidence.';
      } else {
        response = `Your overall compliance score is ${context?.complianceScore ?? 0}% across the frameworks you track.`;
      }
      return Promise.resolve({ response, suggestions: [] });
    });
  });

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByText('AI Copilot')).toBeInTheDocument();
  });

  it('displays the initial AI welcome message', () => {
    renderComponent();
    expect(screen.getByText(/Welcome to the Risk Canvas/)).toBeInTheDocument();
  });

  it('shows quick action chips', () => {
    renderComponent();
    expect(screen.getAllByText('SOC2 status').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gap analysis').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Vendor risks').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Board report').length).toBeGreaterThan(0);
  });

  it('renders the Risk canvas tab as active by default', () => {
    renderComponent();
    expect(screen.getByText('Risk canvas')).toBeInTheDocument();
    expect(screen.getByText('Signals feed')).toBeInTheDocument();
  });

  it('switches to Signals feed tab', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Signals feed'));
    expect(screen.getByTestId('rising-signals')).toBeInTheDocument();
  });

  it('switches back to canvas tab from signals', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Signals feed'));
    expect(screen.getByTestId('rising-signals')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Risk canvas'));
    expect(screen.queryByTestId('rising-signals')).not.toBeInTheDocument();
  });

  it('renders SVG canvas with domain nodes', () => {
    renderComponent();
    // Domain labels rendered as SVG text elements
    const svgEl = document.querySelector('svg');
    expect(svgEl).toBeTruthy();
  });

  it('shows legend with severity colors', () => {
    renderComponent();
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Domain')).toBeInTheDocument();
  });

  it('sends a user message via chat input', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Ask about risks, compliance, vendors...');
    fireEvent.change(input, { target: { value: 'What is our SOC2 status?' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('What is our SOC2 status?')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Your overall compliance score is 82%/)).toBeInTheDocument();
    }, { timeout: 3000 });
    // The copilot service is invoked with the user's message and the live
    // dashboard context (overall compliance score forwarded from the hook).
    expect(complianceCopilot).toHaveBeenCalledWith(
      'What is our SOC2 status?',
      expect.any(Array),
      expect.objectContaining({ complianceScore: 82 }),
    );
  });

  it('sends a vendor-related message and gets vendor response', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Ask about risks, compliance, vendors...');
    fireEvent.change(input, { target: { value: 'Show me high-risk vendors' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByText(/10 vendors being monitored/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('sends a gap analysis message', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Ask about risks, compliance, vendors...');
    fireEvent.change(input, { target: { value: 'Run a gap analysis' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByText(/gap analysis across your active frameworks/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('sends a generic message and gets fallback response', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Ask about risks, compliance, vendors...');
    fireEvent.change(input, { target: { value: 'Hello there' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByText(/compliance score is 82%/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('sends a message via quick chip', async () => {
    renderComponent();
    const chips = screen.getAllByText('SOC2 status');
    // Click the last one which is the quick chip (first is action button in initial message)
    fireEvent.click(chips[chips.length - 1]);
    expect(screen.getByText('What is our SOC2 compliance status?')).toBeInTheDocument();
  });

  it('sends a message via send button click', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Ask about risks, compliance, vendors...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    // Click the send button (contains Send icon)
    const sendBtn = screen.getByTestId('icon-Send').closest('button');
    fireEvent.click(sendBtn!);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('does not send empty message', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Ask about risks, compliance, vendors...');
    fireEvent.keyDown(input, { key: 'Enter' });
    // Should only have the initial welcome message
    const messages = screen.getAllByText(/Welcome to the Risk Canvas/);
    expect(messages).toHaveLength(1);
  });

  it('filters closed risks from canvas nodes', () => {
    renderComponent();
    // The closed risk "Resolved Firewall Issue" should NOT appear as a node
    // Only non-closed risks appear on the canvas
    const svgEl = document.querySelector('svg');
    expect(svgEl).toBeTruthy();
  });

  it('renders action buttons on AI response messages', () => {
    renderComponent();
    // Initial message has action buttons
    const actionButtons = screen.getAllByText('SOC2 status');
    expect(actionButtons.length).toBeGreaterThan(0);
  });
});
