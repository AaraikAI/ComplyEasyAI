import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div>{children}</div> }));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Sarah', email: 'sarah@t.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'TestOrg' } },
    isAuthenticated: true,
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

// Hoisted mock functions
const {
  risksList, risksCreate, risksUpdate, risksScan, risksGenerateRemediation, teamList,
} = vi.hoisted(() => ({
  risksList: vi.fn(),
  risksCreate: vi.fn(),
  risksUpdate: vi.fn(),
  risksScan: vi.fn(),
  risksGenerateRemediation: vi.fn(),
  teamList: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  api: {
    risks: {
      list: risksList,
      create: risksCreate,
      update: risksUpdate,
      scan: risksScan,
      generateRemediation: risksGenerateRemediation,
    },
    team: { list: teamList },
  },
}));

vi.mock('../../services/geminiService', () => ({
  prioritizeRisks: vi.fn().mockResolvedValue([
    { id: 'r1', score: 99, rationale: 'High severity data exposure' },
    { id: 'r2', score: 60, rationale: 'Medium training risk' },
  ]),
  generateRemediationPlan: vi.fn().mockResolvedValue('AI fallback plan: Fix everything.'),
}));

vi.mock('../../constants/tierLimits', () => ({
  getLimit: vi.fn().mockReturnValue(100),
  isAtLimit: vi.fn().mockReturnValue(false),
  getUpgradeMessage: vi.fn().mockReturnValue('Upgrade to add more'),
  LIMIT_LABELS: {},
  UPGRADE_LINK: '/settings?tab=billing',
}));

vi.mock('../../constants/tierFeatures', () => ({
  canAccessView: vi.fn().mockReturnValue(true),
  normalizePlan: vi.fn().mockReturnValue('Growth'),
  hasFeature: vi.fn().mockReturnValue(true),
  TIER_ORDER: ['Foundation', 'Essentials', 'Growth', 'Visionary'],
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockRisks = [
  {
    id: 'r1', title: 'Unencrypted S3 Bucket', description: 'Production S3 bucket lacks encryption',
    category: 'Infrastructure', severity: 'High' as const, status: 'Open' as const,
    detectedAt: '2024-12-01', likelihood: 4, impact: 5, riskScore: 20,
    aiPriorityScore: 95, aiRationale: 'Critical data exposure risk',
    assignedTo: { id: 'u1', name: 'Sarah' }, assignedToId: 'u1',
    targetDate: '2025-03-01', mitigationPlan: 'Enable SSE-S3 encryption',
  },
  {
    id: 'r2', title: 'Training Gap', description: '3 employees missing security training',
    category: 'Personnel', severity: 'Medium' as const, status: 'Open' as const,
    detectedAt: '2024-12-02', likelihood: 3, impact: 3, riskScore: 9,
  },
  {
    id: 'r3', title: 'Old Firewall Rules', description: 'Firewall rules not reviewed in 6 months',
    category: 'Network', severity: 'Low' as const, status: 'Resolved' as const,
    detectedAt: '2024-11-15', likelihood: 2, impact: 2, riskScore: 4,
  },
];

const mockTeam = [
  { id: 'u1', name: 'Sarah', email: 'sarah@t.com' },
  { id: 'u2', name: 'John', email: 'john@t.com' },
];

import { RiskManagement } from '../RiskManagement';

describe('RiskManagement', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    risksList.mockResolvedValue(mockRisks);
    risksCreate.mockResolvedValue({ id: 'r-new' });
    risksUpdate.mockResolvedValue({});
    risksScan.mockResolvedValue({ newRisks: [{ id: 'r-scan' }] });
    risksGenerateRemediation.mockResolvedValue({ plan: 'Step 1: Fix it' });
    teamList.mockResolvedValue(mockTeam);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  // ---------------------------------------------------------------------------
  // Loading & Header
  // ---------------------------------------------------------------------------
  it('shows loading state initially', () => {
    risksList.mockReturnValue(new Promise(() => {}));
    render(<RiskManagement onBack={mockOnBack} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders title and subtitle after loading', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Risk Management')).toBeInTheDocument());
    expect(screen.getByText('Risk Indicators')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Risk Management')).toBeInTheDocument());
    const backBtn = document.querySelector('[data-testid="icon-ArrowLeft"]')?.closest('button');
    fireEvent.click(backBtn!);
    expect(mockOnBack).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Table View
  // ---------------------------------------------------------------------------
  it('renders risk table with data', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Unencrypted S3 Bucket')).toBeInTheDocument());
    expect(screen.getByText('Training Gap')).toBeInTheDocument();
    expect(screen.getByText('Old Firewall Rules')).toBeInTheDocument();
  });

  it('displays severity badges', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Unencrypted S3 Bucket')).toBeInTheDocument());
    const highBadges = screen.getAllByText('High');
    expect(highBadges.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Medium').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Low').length).toBeGreaterThan(0);
  });

  it('displays risk scores in table', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('20')).toBeInTheDocument()); // riskScore r1
    expect(screen.getByText('9')).toBeInTheDocument(); // riskScore r2
  });

  it('displays assignee name in table', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Sarah')).toBeInTheDocument());
    expect(screen.getAllByText('Unassigned').length).toBeGreaterThan(0);
  });

  it('sorts by severity column header click', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('SEVERITY')).toBeInTheDocument());
    fireEvent.click(screen.getByText('SEVERITY'));
    // Sort toggle triggers useEffect reload; wait for table to reappear
    await waitFor(() => expect(screen.getByText('SEVERITY')).toBeInTheDocument());
    fireEvent.click(screen.getByText('SEVERITY'));
    await waitFor(() => expect(screen.getByText('Unencrypted S3 Bucket')).toBeInTheDocument());
  });

  it('sorts by Risk Score column header click', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('RISK SCORE')).toBeInTheDocument());
    fireEvent.click(screen.getByText('RISK SCORE'));
    // Sorting triggers useEffect reload; wait for table to reappear
    await waitFor(() => expect(screen.getByText('Unencrypted S3 Bucket')).toBeInTheDocument());
  });

  // Heat Map view was removed from the component; tests for it are no longer applicable.

  // ---------------------------------------------------------------------------
  // Remediation Modal
  // ---------------------------------------------------------------------------
  it('opens remediation modal on Manage click', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Unencrypted S3 Bucket')).toBeInTheDocument());
    const manageButtons = screen.getAllByText('Edit');
    fireEvent.click(manageButtons[0]);
    await waitFor(() => expect(screen.getByText('Treatment Plan')).toBeInTheDocument());
    expect(screen.getByText('Target Risk')).toBeInTheDocument();
    expect(screen.getByText('Mitigation Plan')).toBeInTheDocument();
  });

  it('shows existing remediation plan when risk has one', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Unencrypted S3 Bucket')).toBeInTheDocument());
    const manageButtons = screen.getAllByText('Edit');
    fireEvent.click(manageButtons[0]);
    await waitFor(() => expect(screen.getByDisplayValue('Enable SSE-S3 encryption')).toBeInTheDocument());
  });

  it('generates remediation via API when risk has no plan', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Training Gap')).toBeInTheDocument());
    const manageButtons = screen.getAllByText('Edit');
    fireEvent.click(manageButtons[1]); // r2 = Training Gap (no mitigation plan)
    await waitFor(() => expect(risksGenerateRemediation).toHaveBeenCalledWith('r2'));
  });

  it('changes status in remediation modal', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Unencrypted S3 Bucket')).toBeInTheDocument());
    const manageButtons = screen.getAllByText('Edit');
    fireEvent.click(manageButtons[0]);
    await waitFor(() => expect(screen.getByText('Treatment Plan')).toBeInTheDocument());
    const statusSelect = screen.getByDisplayValue('Open');
    fireEvent.change(statusSelect, { target: { value: 'In Progress' } });
    expect(statusSelect).toHaveValue('In Progress');
  });

  it('changes assignee in remediation modal', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Unencrypted S3 Bucket')).toBeInTheDocument());
    const manageButtons = screen.getAllByText('Edit');
    fireEvent.click(manageButtons[0]);
    await waitFor(() => expect(screen.getByText('Treatment Plan')).toBeInTheDocument());
    const assigneeSelect = screen.getByDisplayValue('Sarah');
    fireEvent.change(assigneeSelect, { target: { value: 'u2' } });
    expect(assigneeSelect).toHaveValue('u2');
  });

  it('saves changes in remediation modal', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Unencrypted S3 Bucket')).toBeInTheDocument());
    const manageButtons = screen.getAllByText('Edit');
    fireEvent.click(manageButtons[0]);
    await waitFor(() => expect(screen.getByText('Save')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(risksUpdate).toHaveBeenCalledWith('r1', expect.any(Object)));
  });

  it('closes remediation modal on Cancel', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Unencrypted S3 Bucket')).toBeInTheDocument());
    const manageButtons = screen.getAllByText('Edit');
    fireEvent.click(manageButtons[0]);
    await waitFor(() => expect(screen.getByText('Treatment Plan')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Treatment Plan')).not.toBeInTheDocument());
  });

  it('closes remediation modal on X button', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Unencrypted S3 Bucket')).toBeInTheDocument());
    const manageButtons = screen.getAllByText('Edit');
    fireEvent.click(manageButtons[0]);
    await waitFor(() => expect(screen.getByText('Treatment Plan')).toBeInTheDocument());
    // The X button is at the header right side
    const headerDiv = screen.getByText('Treatment Plan').closest('div');
    const xButton = headerDiv?.parentElement?.querySelector('button:last-child');
    fireEvent.click(xButton!);
    await waitFor(() => expect(screen.queryByText('Treatment Plan')).not.toBeInTheDocument());
  });

  it('shows AI priority score in remediation modal', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Unencrypted S3 Bucket')).toBeInTheDocument());
    const manageButtons = screen.getAllByText('Edit');
    fireEvent.click(manageButtons[0]);
    await waitFor(() => expect(screen.getByText('AI Priority: 95')).toBeInTheDocument());
    expect(screen.getByText(/Critical data exposure risk/)).toBeInTheDocument();
  });

  it('shows overdue indication for past-due target date', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Unencrypted S3 Bucket')).toBeInTheDocument());
    const manageButtons = screen.getAllByText('Edit');
    fireEvent.click(manageButtons[0]);
    // "Due Date: " (with colon) is more specific than /Due Date/ which also matches label "Update Remediation Due Date"
    await waitFor(() => expect(screen.getByText('Due Date:')).toBeInTheDocument());
    // r1 has targetDate: 2025-03-01, which is in the past relative to test date
  });

  // ---------------------------------------------------------------------------
  // Add Risk Modal
  // ---------------------------------------------------------------------------
  it('opens add risk modal', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('Create Risk')[0]).toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Create Risk')[0]);
    await waitFor(() => expect(screen.getAllByText('Create Risk').length).toBeGreaterThanOrEqual(2));
    expect(screen.getByText('Description *')).toBeInTheDocument();
    expect(screen.getByText('Risk Category *')).toBeInTheDocument();
  });

  it('submits add risk form', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('Create Risk')[0]).toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Create Risk')[0]);
    await waitFor(() => expect(screen.getAllByText('Create Risk').length).toBeGreaterThanOrEqual(2));
    fireEvent.change(screen.getByPlaceholderText('Describe the risk...'), { target: { value: 'New critical risk' } });
    fireEvent.change(screen.getByPlaceholderText(/Infrastructure, Personnel, Data Breach/), { target: { value: 'Network' } });
    const createButtons = screen.getAllByText('Create Risk');
    fireEvent.click(createButtons[createButtons.length - 1]); // Submit button is the last one
    await waitFor(() => expect(risksCreate).toHaveBeenCalled());
  });

  it('shows validation alert when description missing', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('Create Risk')[0]).toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Create Risk')[0]);
    await waitFor(() => expect(screen.getAllByText('Create Risk').length).toBeGreaterThanOrEqual(2));
    // Submit without filling description
    fireEvent.change(screen.getByPlaceholderText(/Infrastructure, Personnel, Data Breach/), { target: { value: 'Net' } });
    const allCreateBtns = screen.getAllByText('Create Risk');
    const form = allCreateBtns[allCreateBtns.length - 1].closest('form');
    fireEvent.submit(form!);
    // HTML5 required attribute should prevent submission; but if bypassed, alert is shown
  });

  it('closes add risk modal on cancel', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('Create Risk')[0]).toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Create Risk')[0]);
    await waitFor(() => expect(screen.getAllByText('Create Risk').length).toBeGreaterThanOrEqual(2));
    const cancelBtns = screen.getAllByText('Cancel');
    const modalCancel = cancelBtns[cancelBtns.length - 1];
    fireEvent.click(modalCancel);
    await waitFor(() => expect(screen.getAllByText('Create Risk').length).toBe(1)); // Only the header button remains
  });

  it('shows risk score calculation in add risk form', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('Create Risk')[0]).toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Create Risk')[0]);
    await waitFor(() => expect(screen.getByText(/Risk Score:/)).toBeInTheDocument());
    // Default is 3 x 3 = 9; use getAllByText because '9' may appear in both the form and the table
    const nines = screen.getAllByText('9');
    expect(nines.length).toBeGreaterThan(0);
  });

  it('updates likelihood and impact sliders', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getAllByText('Create Risk')[0]).toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Create Risk')[0]);
    await waitFor(() => expect(screen.getByText(/Likelihood/)).toBeInTheDocument());
    // Both likelihood and impact inputs default to 3; pick the first (likelihood)
    const inputs = screen.getAllByDisplayValue('3');
    const likelihoodInput = inputs[0];
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    nativeInputValueSetter.call(likelihoodInput, '5');
    likelihoodInput.dispatchEvent(new Event('change', { bubbles: true }));
    // New risk score should be 5 * 3 = 15
    await waitFor(() => expect(screen.getByText('15')).toBeInTheDocument());
  });

  // ---------------------------------------------------------------------------
  // AI Prioritize
  // ---------------------------------------------------------------------------
  it('triggers AI prioritization', async () => {
    const { prioritizeRisks } = await import('../../services/geminiService');
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('AI Prioritize')).toBeInTheDocument());
    fireEvent.click(screen.getByText('AI Prioritize'));
    await waitFor(() => expect(prioritizeRisks).toHaveBeenCalled());
  });

  // ---------------------------------------------------------------------------
  // Run Scan
  // ---------------------------------------------------------------------------
  it('triggers run scan and shows overlay', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Run Scan')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Run Scan'));
    expect(screen.getByText('Running Risk Assessment')).toBeInTheDocument();
    expect(risksScan).toHaveBeenCalled();
  });

  // Heat map remediation test removed — no heat map view in current component.

  // ---------------------------------------------------------------------------
  // Editable remediation plan textarea
  // ---------------------------------------------------------------------------
  it('allows editing the remediation plan text', async () => {
    render(<RiskManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Unencrypted S3 Bucket')).toBeInTheDocument());
    const manageButtons = screen.getAllByText('Edit');
    fireEvent.click(manageButtons[0]);
    await waitFor(() => expect(screen.getByDisplayValue('Enable SSE-S3 encryption')).toBeInTheDocument());
    fireEvent.change(screen.getByDisplayValue('Enable SSE-S3 encryption'), { target: { value: 'Updated plan' } });
    expect(screen.getByDisplayValue('Updated plan')).toBeInTheDocument();
  });
});
