import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null, XAxis: () => null, YAxis: () => null,
  CartesianGrid: () => null, Tooltip: () => null, Legend: () => null,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => null, Cell: () => null,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null, LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null, RadialBarChart: ({ children }: any) => <div>{children}</div>,
  RadialBar: () => null, RadarChart: ({ children }: any) => <div>{children}</div>,
  Radar: () => null, PolarGrid: () => null, PolarAngleAxis: () => null, PolarRadiusAxis: () => null,
}));

vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div data-testid="markdown">{children}</div> }));

const mockUser = {
  id: 'u1', name: 'Test Admin', email: 'admin@test.com', role: 'admin',
  organizationId: 'org-1',
  organization: { plan: 'Growth', name: 'Test Org' },
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: mockUser,
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

const mockIssues = [
  {
    id: 'iss-1', organizationId: 'org-1', title: 'Missing Encryption Policy',
    description: 'Data at rest is not encrypted', issueType: 'Compliance Gap',
    category: 'Data Protection', priority: 'Critical' as const, status: 'Open' as const,
    assignedToId: 'u1', assignedTo: { id: 'u1', name: 'Alice', email: 'alice@test.com' },
    createdById: 'u2', createdBy: { id: 'u2', name: 'Bob', email: 'bob@test.com' },
    dueDate: '2025-06-01', slaTarget: '2025-05-15', slaStatus: 'At_Risk',
    remediationPlan: 'Implement AES-256 encryption', tags: ['encryption', 'data'],
    comments: [
      { id: 'c1', issueId: 'iss-1', comment: 'Urgent fix needed', author: 'Alice', createdAt: '2025-01-01T00:00:00Z' },
    ],
    createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-02T00:00:00Z',
  },
  {
    id: 'iss-2', organizationId: 'org-1', title: 'Audit Finding on Access Control',
    description: 'MFA not enforced', issueType: 'Audit Finding',
    priority: 'High' as const, status: 'In_Progress' as const,
    createdById: 'u1', dueDate: undefined, slaStatus: undefined,
    tags: [], comments: [],
    createdAt: '2025-01-03T00:00:00Z', updatedAt: '2025-01-04T00:00:00Z',
  },
  {
    id: 'iss-3', organizationId: 'org-1', title: 'Resolved Item',
    description: 'Fixed vulnerability', issueType: 'Security Incident',
    priority: 'Low' as const, status: 'Closed' as const,
    createdById: 'u1', tags: [], comments: [],
    createdAt: '2025-01-05T00:00:00Z', updatedAt: '2025-01-06T00:00:00Z',
  },
];

const mockDashboard = {
  totalIssues: 3,
  statusDistribution: { open: 1, inProgress: 1, resolved: 0, closed: 1, reopened: 0 },
  priorityDistribution: { critical: 1, high: 1, medium: 0, low: 1 },
  typeDistribution: { 'Compliance Gap': 1, 'Audit Finding': 1 },
  slaMetrics: { onTrack: 1, atRisk: 1, breached: 0 },
  overdueIssues: 0,
  unassignedIssues: 1,
  averageResolutionTime: 5,
  issuesByAssignee: [],
  criticalIssues: [{ id: 'iss-1', title: 'Missing Encryption Policy', priority: 'Critical', status: 'Open', assignedTo: 'Alice', slaStatus: 'At_Risk' }],
};

const mockTeamUsers = [
  { id: 'u1', name: 'Alice', email: 'alice@test.com' },
  { id: 'u2', name: 'Bob', email: 'bob@test.com' },
];

const issuesList = vi.fn().mockResolvedValue(mockIssues);
const issuesGetDashboard = vi.fn().mockResolvedValue(mockDashboard);
const issuesCreate = vi.fn().mockResolvedValue({ id: 'iss-new' });
const issuesUpdate = vi.fn().mockResolvedValue({});
const issuesGetById = vi.fn().mockImplementation((id: string) =>
  Promise.resolve(mockIssues.find(i => i.id === id) || mockIssues[0])
);
const issuesDelete = vi.fn().mockResolvedValue({});
const issuesUpdateStatus = vi.fn().mockResolvedValue({});
const issuesAssign = vi.fn().mockResolvedValue({});
const issuesAddComment = vi.fn().mockResolvedValue({});
const teamList = vi.fn().mockResolvedValue(mockTeamUsers);
const aiChat = vi.fn().mockResolvedValue({ response: '{"severity":"High","category":"Access Control","affectedFrameworks":["SOC2"],"suggestedPriority":"High","confidenceScore":90,"reasoning":"Needs MFA"}' });

vi.mock('@/services/api', () => ({
  api: {
    enterprise: {
      issues: {
        list: issuesList,
        getDashboard: issuesGetDashboard,
        create: issuesCreate,
        update: issuesUpdate,
        getById: issuesGetById,
        delete: issuesDelete,
        updateStatus: issuesUpdateStatus,
        assign: issuesAssign,
        addComment: issuesAddComment,
      },
    },
    team: { list: teamList },
    ai: { chat: aiChat },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

vi.mock('@/constants/tierLimits', () => ({
  getLimit: vi.fn().mockReturnValue(100),
  isAtLimit: vi.fn().mockReturnValue(false),
  getUpgradeMessage: vi.fn().mockReturnValue('Upgrade needed'),
  LIMIT_LABELS: {},
  UPGRADE_LINK: '/settings?tab=billing',
}));

vi.mock('@/constants/tierFeatures', () => ({
  canAccessView: vi.fn().mockReturnValue(true),
  normalizePlan: vi.fn().mockReturnValue('Growth'),
  hasFeature: vi.fn().mockReturnValue(true),
  TIER_ORDER: ['Foundation', 'Essentials', 'Growth', 'Visionary'],
  VIEW_TO_FEATURE: {},
}));

import IssueManagement from '../IssueManagement';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('IssueManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    issuesList.mockResolvedValue(mockIssues);
    issuesGetDashboard.mockResolvedValue(mockDashboard);
    teamList.mockResolvedValue(mockTeamUsers);
    // reset confirm/alert
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  // -------------------------------------------------------------------------
  // Loading & Dashboard
  // -------------------------------------------------------------------------
  it('shows a loading spinner initially', () => {
    issuesList.mockReturnValue(new Promise(() => {})); // never resolves
    render(<IssueManagement />);
    expect(document.querySelector('[data-testid="icon-Loader2"]')).toBeTruthy();
  });

  it('renders the dashboard view after loading', async () => {
    render(<IssueManagement />);
    await waitFor(() => {
      expect(screen.getByText('Issue Management')).toBeInTheDocument();
    });
    expect(screen.getByText(/Track, analyze, and resolve/)).toBeInTheDocument();
  });

  it('displays dashboard stat cards with correct values', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('Total Issues')).toBeInTheDocument());
    expect(screen.getByText('3')).toBeInTheDocument(); // totalIssues
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('displays SLA status section when metrics present', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('SLA Status')).toBeInTheDocument());
    expect(screen.getByText('On Track')).toBeInTheDocument();
    expect(screen.getByText('At Risk')).toBeInTheDocument();
  });

  it('displays critical issues section', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/Critical Issues/)).toBeInTheDocument());
    expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument();
  });

  it('navigates to list view when "View All Issues" is clicked', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByPlaceholderText('Search issues...')).toBeInTheDocument());
  });

  it('renders the "New Issue" button on dashboard', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('New Issue')).toBeInTheDocument());
  });

  it('renders the "Find Related Issues" button on dashboard', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('Find Related Issues')).toBeInTheDocument());
  });

  // -------------------------------------------------------------------------
  // List View
  // -------------------------------------------------------------------------
  it('renders list view with issues after navigating', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => {
      expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument();
      expect(screen.getByText('Audit Finding on Access Control')).toBeInTheDocument();
    });
  });

  it('filters issues by search query', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByPlaceholderText('Search issues...')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Search issues...'), { target: { value: 'Encryption' } });
    await waitFor(() => {
      expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument();
      expect(screen.queryByText('Audit Finding on Access Control')).not.toBeInTheDocument();
    });
  });

  it('filters issues by status dropdown', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByDisplayValue('All Status')).toBeInTheDocument());
    fireEvent.change(screen.getByDisplayValue('All Status'), { target: { value: 'Open' } });
    await waitFor(() => {
      expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument();
      expect(screen.queryByText('Audit Finding on Access Control')).not.toBeInTheDocument();
    });
  });

  it('filters issues by priority dropdown', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByDisplayValue('All Priorities')).toBeInTheDocument());
    fireEvent.change(screen.getByDisplayValue('All Priorities'), { target: { value: 'Critical' } });
    await waitFor(() => {
      expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument();
      expect(screen.queryByText('Audit Finding on Access Control')).not.toBeInTheDocument();
    });
  });

  it('filters issues by type dropdown', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByDisplayValue('All Types')).toBeInTheDocument());
    fireEvent.change(screen.getByDisplayValue('All Types'), { target: { value: 'Audit Finding' } });
    await waitFor(() => {
      expect(screen.getByText('Audit Finding on Access Control')).toBeInTheDocument();
      expect(screen.queryByText('Missing Encryption Policy')).not.toBeInTheDocument();
    });
  });

  it('shows "No issues found" when filter matches nothing', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByPlaceholderText('Search issues...')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Search issues...'), { target: { value: 'zzzzzznotfound' } });
    await waitFor(() => expect(screen.getByText('No issues found')).toBeInTheDocument());
  });

  it('navigates back to dashboard from list view', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Dashboard'));
    await waitFor(() => expect(screen.getByText(/Track, analyze, and resolve/)).toBeInTheDocument());
  });

  // -------------------------------------------------------------------------
  // Detail View
  // -------------------------------------------------------------------------
  it('opens issue detail view when issue is clicked', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument());
    // Click on the issue title area
    fireEvent.click(screen.getByText('Missing Encryption Policy'));
    await waitFor(() => expect(screen.getByText('Back to List')).toBeInTheDocument());
    expect(screen.getByText('Update Status')).toBeInTheDocument();
    expect(screen.getByText('Assign Issue')).toBeInTheDocument();
  });

  it('shows remediation plan in detail view', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Missing Encryption Policy'));
    await waitFor(() => expect(screen.getByText('Remediation Plan')).toBeInTheDocument());
    expect(screen.getByText('Implement AES-256 encryption')).toBeInTheDocument();
  });

  it('displays comments in detail view', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Missing Encryption Policy'));
    await waitFor(() => expect(screen.getByText(/Comments \(1\)/)).toBeInTheDocument());
    expect(screen.getByText('Urgent fix needed')).toBeInTheDocument();
  });

  it('adds a comment from the detail view', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Missing Encryption Policy'));
    await waitFor(() => expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Add a comment...'), { target: { value: 'New comment here' } });
    fireEvent.click(screen.getByText('Add'));
    await waitFor(() => expect(issuesAddComment).toHaveBeenCalledWith('iss-1', 'New comment here'));
  });

  it('disables add comment button when comment is empty', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Missing Encryption Policy'));
    await waitFor(() => expect(screen.getByText('Add')).toBeInTheDocument());
    expect(screen.getByText('Add').closest('button')).toBeDisabled();
  });

  it('changes issue status from detail view', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Missing Encryption Policy'));
    await waitFor(() => expect(screen.getByText('Update Status')).toBeInTheDocument());
    // Click In Progress button
    const inProgressBtn = screen.getByRole('button', { name: /In Progress/i });
    fireEvent.click(inProgressBtn);
    await waitFor(() => expect(issuesUpdateStatus).toHaveBeenCalledWith('iss-1', 'In_Progress'));
  });

  it('assigns issue from detail view', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Missing Encryption Policy'));
    await waitFor(() => expect(screen.getByText('Assign Issue')).toBeInTheDocument());
    // Get the assign select (the one right after "Assign Issue")
    const assignSelect = screen.getByRole('combobox', { name: '' });
    // Find the correct select in the assign section
    const selectElements = document.querySelectorAll('select');
    const assignSelectEl = selectElements[selectElements.length - 1]; // last select is the assign one
    fireEvent.change(assignSelectEl, { target: { value: 'u2' } });
    await waitFor(() => expect(issuesAssign).toHaveBeenCalledWith('iss-1', 'u2'));
  });

  it('shows "No comments yet" when issue has no comments', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Audit Finding on Access Control')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Audit Finding on Access Control'));
    await waitFor(() => expect(screen.getByText('No comments yet')).toBeInTheDocument());
  });

  // -------------------------------------------------------------------------
  // Create Issue
  // -------------------------------------------------------------------------
  it('opens create issue form', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('New Issue')).toBeInTheDocument());
    fireEvent.click(screen.getByText('New Issue'));
    await waitFor(() => expect(screen.getByText('Create Issue')).toBeInTheDocument());
    expect(screen.getByPlaceholderText('Brief description of the issue')).toBeInTheDocument();
  });

  it('submits create issue form', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('New Issue')).toBeInTheDocument());
    fireEvent.click(screen.getByText('New Issue'));
    await waitFor(() => expect(screen.getByPlaceholderText('Brief description of the issue')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Brief description of the issue'), { target: { value: 'New Test Issue' } });
    fireEvent.change(screen.getByPlaceholderText('Detailed description of the issue...'), { target: { value: 'Test description' } });

    const submitBtn = screen.getAllByText('Create Issue').find(el => el.closest('button[type="submit"]'));
    fireEvent.click(submitBtn!);
    await waitFor(() => expect(issuesCreate).toHaveBeenCalled());
  });

  it('shows cancel button on create form that navigates back', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('New Issue')).toBeInTheDocument());
    fireEvent.click(screen.getByText('New Issue'));
    await waitFor(() => expect(screen.getByText('Cancel')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cancel'));
    // Should go back to list view - which shows the search input
    await waitFor(() => expect(screen.getByPlaceholderText('Search issues...')).toBeInTheDocument());
  });

  it('shows AI Classify Issue button when description is filled', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('New Issue')).toBeInTheDocument());
    fireEvent.click(screen.getByText('New Issue'));
    await waitFor(() => expect(screen.getByPlaceholderText('Detailed description of the issue...')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Detailed description of the issue...'), { target: { value: 'Some compliance issue' } });
    expect(screen.getByText('AI Classify Issue')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Edit Issue
  // -------------------------------------------------------------------------
  it('opens edit issue form from list view', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument());
    // Click the edit button (Edit3 icon)
    const editButtons = document.querySelectorAll('[title="Edit"]');
    fireEvent.click(editButtons[0]);
    await waitFor(() => expect(screen.getByText('Edit Issue')).toBeInTheDocument());
    expect(screen.getByDisplayValue('Missing Encryption Policy')).toBeInTheDocument();
  });

  it('submits edit issue form and updates', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument());
    const editButtons = document.querySelectorAll('[title="Edit"]');
    fireEvent.click(editButtons[0]);
    await waitFor(() => expect(screen.getByText('Update Issue')).toBeInTheDocument());
    fireEvent.change(screen.getByDisplayValue('Missing Encryption Policy'), { target: { value: 'Updated Title' } });
    const submitBtn = screen.getByText('Update Issue').closest('button');
    fireEvent.click(submitBtn!);
    await waitFor(() => expect(issuesUpdate).toHaveBeenCalled());
  });

  // -------------------------------------------------------------------------
  // Delete Issue
  // -------------------------------------------------------------------------
  it('deletes an issue from list view with confirmation', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument());
    const deleteButtons = document.querySelectorAll('[title="Delete"]');
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => expect(issuesDelete).toHaveBeenCalledWith('iss-1'));
  });

  it('cancels delete when confirm returns false', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument());
    const deleteButtons = document.querySelectorAll('[title="Delete"]');
    fireEvent.click(deleteButtons[0]);
    expect(issuesDelete).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // AI Classification
  // -------------------------------------------------------------------------
  it('triggers AI classification and shows results', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('New Issue')).toBeInTheDocument());
    fireEvent.click(screen.getByText('New Issue'));
    await waitFor(() => expect(screen.getByPlaceholderText('Detailed description of the issue...')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Detailed description of the issue...'), { target: { value: 'Access control gap' } });
    fireEvent.click(screen.getByText('AI Classify Issue'));
    await waitFor(() => expect(screen.getByText('AI Issue Classification')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Classification Results')).toBeInTheDocument());
    expect(screen.getByText(/Confidence: 90%/)).toBeInTheDocument();
  });

  it('applies AI classification and returns to create form', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('New Issue')).toBeInTheDocument());
    fireEvent.click(screen.getByText('New Issue'));
    await waitFor(() => expect(screen.getByPlaceholderText('Detailed description of the issue...')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Detailed description of the issue...'), { target: { value: 'Access control gap' } });
    fireEvent.click(screen.getByText('AI Classify Issue'));
    await waitFor(() => expect(screen.getByText('Apply Classification & Continue')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Apply Classification & Continue'));
    await waitFor(() => expect(screen.getByPlaceholderText('Brief description of the issue')).toBeInTheDocument());
  });

  it('handles AI classification with non-JSON response (fallback)', async () => {
    aiChat.mockResolvedValueOnce({ response: 'This is plain text, no JSON here' });
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('New Issue')).toBeInTheDocument());
    fireEvent.click(screen.getByText('New Issue'));
    await waitFor(() => expect(screen.getByPlaceholderText('Detailed description of the issue...')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Detailed description of the issue...'), { target: { value: 'Some issue' } });
    fireEvent.click(screen.getByText('AI Classify Issue'));
    await waitFor(() => expect(screen.getByText('Classification Results')).toBeInTheDocument());
    // Should use fallback values
    expect(screen.getByText(/Confidence: 75%/)).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // AI Root Cause
  // -------------------------------------------------------------------------
  it('triggers AI root cause analysis from list view', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument());
    const rcButtons = document.querySelectorAll('[title="AI Root Cause"]');
    fireEvent.click(rcButtons[0]);
    await waitFor(() => expect(screen.getByText('AI Root Cause Analysis')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Root Cause Analysis')).toBeInTheDocument());
  });

  // -------------------------------------------------------------------------
  // AI Remediation
  // -------------------------------------------------------------------------
  it('triggers AI remediation from list view', async () => {
    aiChat.mockResolvedValueOnce({ response: '{"steps":[{"step":"Fix it","effort":"1 day","priority":"High","dependencies":[]}],"totalEstimatedEffort":"1 day","criticalPath":["Fix it"],"risks":["Downtime"]}' });
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument());
    const remButtons = document.querySelectorAll('[title="AI Remediation"]');
    fireEvent.click(remButtons[0]);
    await waitFor(() => expect(screen.getByText('AI Remediation Plan')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Remediation Plan')).toBeInTheDocument());
  });

  it('applies AI remediation plan to issue', async () => {
    aiChat.mockResolvedValueOnce({ response: '{"steps":[{"step":"Fix DB","effort":"2 days","priority":"High","dependencies":[]}],"totalEstimatedEffort":"2 days","criticalPath":[],"risks":[]}' });
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument());
    const remButtons = document.querySelectorAll('[title="AI Remediation"]');
    fireEvent.click(remButtons[0]);
    await waitFor(() => expect(screen.getByText('Apply Plan to Issue')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Apply Plan to Issue'));
    await waitFor(() => expect(issuesUpdate).toHaveBeenCalled());
  });

  // -------------------------------------------------------------------------
  // AI Correlation
  // -------------------------------------------------------------------------
  it('triggers AI correlation analysis from dashboard', async () => {
    aiChat.mockResolvedValueOnce({ response: '{"relatedIssues":[],"patterns":["Common access control gap"],"systemicFixes":["Implement MFA"],"summary":"Pattern found"}' });
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('Find Related Issues')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Find Related Issues'));
    await waitFor(() => expect(screen.getByText('AI Issue Correlation')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Analysis Summary')).toBeInTheDocument());
    expect(screen.getByText('Pattern found')).toBeInTheDocument();
  });

  it('shows patterns and systemic fixes in correlation view', async () => {
    aiChat.mockResolvedValueOnce({ response: '{"relatedIssues":[],"patterns":["Lack of encryption"],"systemicFixes":["Add TLS everywhere"],"summary":"Summary"}' });
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('Find Related Issues')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Find Related Issues'));
    await waitFor(() => expect(screen.getByText('Identified Patterns')).toBeInTheDocument());
    expect(screen.getByText('Lack of encryption')).toBeInTheDocument();
    expect(screen.getByText('Systemic Fixes')).toBeInTheDocument();
    expect(screen.getByText('Add TLS everywhere')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------
  it('displays error banner and allows dismissal', async () => {
    issuesList.mockRejectedValueOnce(new Error('Network error'));
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
    // Close the error
    const closeBtn = screen.getByText('Network error').closest('div')?.querySelector('button');
    fireEvent.click(closeBtn!);
    await waitFor(() => expect(screen.queryByText('Network error')).not.toBeInTheDocument());
  });

  it('handles API error on create issue', async () => {
    issuesCreate.mockRejectedValueOnce(new Error('Create failed'));
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('New Issue')).toBeInTheDocument());
    fireEvent.click(screen.getByText('New Issue'));
    await waitFor(() => expect(screen.getByPlaceholderText('Brief description of the issue')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Brief description of the issue'), { target: { value: 'Fail Issue' } });
    fireEvent.change(screen.getByPlaceholderText('Detailed description of the issue...'), { target: { value: 'Will fail' } });
    const submitBtn = screen.getAllByText('Create Issue').find(el => el.closest('button[type="submit"]'));
    fireEvent.click(submitBtn!);
    await waitFor(() => expect(screen.getByText('Create failed')).toBeInTheDocument());
  });

  // -------------------------------------------------------------------------
  // Tier limit
  // -------------------------------------------------------------------------
  it('shows tier limit banner when at limit', async () => {
    const { isAtLimit } = await import('@/constants/tierLimits');
    (isAtLimit as any).mockReturnValue(true);
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('Issue Management')).toBeInTheDocument());
    // TierLimitBanner should show the upgrade message
    expect(screen.getByText('Upgrade needed')).toBeInTheDocument();
    (isAtLimit as any).mockReturnValue(false);
  });

  // -------------------------------------------------------------------------
  // Dashboard without data
  // -------------------------------------------------------------------------
  it('handles null dashboard gracefully', async () => {
    issuesGetDashboard.mockResolvedValueOnce(null);
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText('Issue Management')).toBeInTheDocument());
    // Stats should show 0 values
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Detail view - SLA display
  // -------------------------------------------------------------------------
  it('shows SLA status color correctly in detail', async () => {
    render(<IssueManagement />);
    await waitFor(() => expect(screen.getByText(/View All Issues/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/View All Issues/));
    await waitFor(() => expect(screen.getByText('Missing Encryption Policy')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Missing Encryption Policy'));
    await waitFor(() => expect(screen.getByText('SLA Status')).toBeInTheDocument());
    // slaStatus is At_Risk, which should display as "At Risk"
    expect(screen.getByText('At Risk')).toBeInTheDocument();
  });
});
