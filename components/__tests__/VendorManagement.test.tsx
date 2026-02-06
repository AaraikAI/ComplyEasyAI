import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null, XAxis: () => null, YAxis: () => null,
  CartesianGrid: () => null, Tooltip: () => null, Legend: () => null,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => null, Cell: () => null,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null, LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
}));

vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div data-testid="md">{children}</div> }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 'u1', name: 'Admin', email: 'admin@t.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Org' } },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

// Hoisted mock functions
const {
  vendorsList, vendorsGetDashboard, vendorsCreate, vendorsUpdate,
  vendorsDelete, vendorsGetById, vendorsCreateAssessment,
  aiScoreVendor, aiAnalyzeContract, aiGenerateReport, aiChat,
} = vi.hoisted(() => ({
  vendorsList: vi.fn(),
  vendorsGetDashboard: vi.fn(),
  vendorsCreate: vi.fn(),
  vendorsUpdate: vi.fn(),
  vendorsDelete: vi.fn(),
  vendorsGetById: vi.fn(),
  vendorsCreateAssessment: vi.fn(),
  aiScoreVendor: vi.fn(),
  aiAnalyzeContract: vi.fn(),
  aiGenerateReport: vi.fn(),
  aiChat: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  api: {
    vendors: {
      list: vendorsList,
      getDashboard: vendorsGetDashboard,
      create: vendorsCreate,
      update: vendorsUpdate,
      delete: vendorsDelete,
      getById: vendorsGetById,
      createAssessment: vendorsCreateAssessment,
    },
    ai: {
      scoreVendor: aiScoreVendor,
      analyzeContract: aiAnalyzeContract,
      generateReport: aiGenerateReport,
      chat: aiChat,
    },
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

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockVendors = [
  {
    id: 'v1', name: 'CloudCorp', organizationId: 'org-1', website: 'https://cloudcorp.io',
    contactName: 'Jane Doe', contactEmail: 'jane@cloud.io', contactPhone: '555-1111',
    riskLevel: 'High' as const, riskScore: 72, status: 'Active' as const,
    category: 'Cloud Infrastructure', serviceDescription: 'IaaS provider',
    contractStart: '2024-01-01', contractEnd: '2025-12-31', annualSpend: 120000,
    hasDataAccess: true, dataTypes: ['PII', 'Payment'],
    securityContact: 'sec@cloud.io', soc2Report: true, iso27001Certified: false,
    gdprCompliant: true, hipaaBaa: false,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z',
    assessments: [{ id: 'a1', assessmentType: 'Security Review', status: 'Completed', score: 85, assessedDate: '2024-03-01' }],
    reviews: [], monitors: [],
  },
  {
    id: 'v2', name: 'DataPipe', organizationId: 'org-1',
    riskLevel: 'Low' as const, riskScore: 22, status: 'Onboarding' as const,
    category: 'Data Analytics', hasDataAccess: false,
    soc2Report: false, iso27001Certified: false, gdprCompliant: false, hipaaBaa: false,
    createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-06-02T00:00:00Z',
    assessments: [], reviews: [], monitors: [],
  },
];

const mockDashboard = {
  totalVendors: 2,
  riskDistribution: { critical: 0, high: 1, medium: 0, low: 1 },
  statusDistribution: { active: 1, onboarding: 1, offboarding: 0, suspended: 0 },
  assessmentMetrics: { totalAssessments: 1, pendingAssessments: 0 },
  reviewMetrics: { totalReviews: 0 },
  monitoringMetrics: { activeMonitors: 3, alertsDetected: 1 },
  complianceCertifications: { soc2: 1, iso27001: 0, gdpr: 1, hipaa: 0 },
  topRiskVendors: [{ id: 'v1', name: 'CloudCorp', riskScore: 72, riskLevel: 'High', hasDataAccess: true }],
};

import VendorManagement from '../VendorManagement';

describe('VendorManagement', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vendorsList.mockResolvedValue(mockVendors);
    vendorsGetDashboard.mockResolvedValue(mockDashboard);
    vendorsGetById.mockImplementation((id: string) =>
      Promise.resolve(mockVendors.find(v => v.id === id) || mockVendors[0])
    );
    vendorsCreate.mockResolvedValue({ id: 'v-new' });
    vendorsUpdate.mockResolvedValue({ ...mockVendors[0], name: 'Updated' });
    vendorsDelete.mockResolvedValue({});
    vendorsCreateAssessment.mockResolvedValue({});
    aiScoreVendor.mockResolvedValue({ analysis: 'Risk score: 65. Moderate risk.' });
    aiAnalyzeContract.mockResolvedValue({ analysis: 'Contract looks good.' });
    aiGenerateReport.mockResolvedValue({ report: 'Due diligence complete.' });
    aiChat.mockResolvedValue({ response: '1. Monitor uptime\n2. Check certs' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------
  it('shows loading spinner initially', () => {
    vendorsList.mockReturnValue(new Promise(() => {}));
    render(<VendorManagement onBack={mockOnBack} />);
    expect(screen.getByText(/Loading vendor management/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------------
  it('renders dashboard with stat cards', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Total Vendors')).toBeInTheDocument());
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Pending Assessments')).toBeInTheDocument();
    expect(screen.getByText('Active Monitors')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
  });

  it('renders risk distribution chart section', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Risk Distribution')).toBeInTheDocument());
  });

  it('renders compliance certifications chart', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Compliance Certifications')).toBeInTheDocument());
  });

  it('renders vendor status summary', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendor Status Summary')).toBeInTheDocument());
  });

  it('renders top risk vendors section', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Top Risk Vendors')).toBeInTheDocument());
    expect(screen.getByText('CloudCorp')).toBeInTheDocument();
    expect(screen.getByText('Data Access')).toBeInTheDocument();
  });

  it('handles null dashboard gracefully', async () => {
    vendorsGetDashboard.mockResolvedValueOnce(null);
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendor Management')).toBeInTheDocument());
    // Dashboard content should not render when null
  });

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  it('calls onBack when back arrow is clicked on dashboard', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendor Management')).toBeInTheDocument());
    const backBtn = document.querySelector('[data-testid="icon-ArrowLeft"]')?.closest('button');
    fireEvent.click(backBtn!);
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('toggles between dashboard and list views', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByPlaceholderText('Search vendors...')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Dashboard'));
    await waitFor(() => expect(screen.getByText('Total Vendors')).toBeInTheDocument());
  });

  // ---------------------------------------------------------------------------
  // List View
  // ---------------------------------------------------------------------------
  it('renders vendor list with correct data', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => {
      expect(screen.getByText('CloudCorp')).toBeInTheDocument();
      expect(screen.getByText('DataPipe')).toBeInTheDocument();
    });
  });

  it('filters vendors by search query', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByPlaceholderText('Search vendors...')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Search vendors...'), { target: { value: 'Cloud' } });
    await waitFor(() => {
      expect(screen.getByText('CloudCorp')).toBeInTheDocument();
      expect(screen.queryByText('DataPipe')).not.toBeInTheDocument();
    });
  });

  it('filters vendors by risk level', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByDisplayValue('All Risk Levels')).toBeInTheDocument());
    fireEvent.change(screen.getByDisplayValue('All Risk Levels'), { target: { value: 'Low' } });
    await waitFor(() => {
      expect(screen.queryByText('CloudCorp')).not.toBeInTheDocument();
      expect(screen.getByText('DataPipe')).toBeInTheDocument();
    });
  });

  it('filters vendors by status', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument());
    fireEvent.change(screen.getByDisplayValue('All Statuses'), { target: { value: 'Onboarding' } });
    await waitFor(() => {
      expect(screen.queryByText('CloudCorp')).not.toBeInTheDocument();
      expect(screen.getByText('DataPipe')).toBeInTheDocument();
    });
  });

  it('shows empty state when no vendors match', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByPlaceholderText('Search vendors...')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Search vendors...'), { target: { value: 'nonexistent' } });
    await waitFor(() => expect(screen.getByText(/No vendors match your filters/)).toBeInTheDocument());
  });

  it('shows empty state with no vendors', async () => {
    vendorsList.mockResolvedValueOnce([]);
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText(/No vendors yet/)).toBeInTheDocument());
  });

  it('sorts vendors by name when header clicked', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText('CloudCorp')).toBeInTheDocument());
    const vendorHeader = screen.getByText('Vendor').closest('th');
    fireEvent.click(vendorHeader!);
    // Sort toggled
    fireEvent.click(vendorHeader!);
    // Assert no crash after double sort toggle
    expect(screen.getByText('CloudCorp')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Detail View
  // ---------------------------------------------------------------------------
  it('opens vendor detail when vendor name is clicked', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText('CloudCorp')).toBeInTheDocument());
    fireEvent.click(screen.getByText('CloudCorp'));
    await waitFor(() => expect(screen.getByText('Contact Information')).toBeInTheDocument());
    expect(screen.getByText('jane@cloud.io')).toBeInTheDocument();
    expect(screen.getByText('Contract Details')).toBeInTheDocument();
    expect(screen.getByText('Compliance Certifications')).toBeInTheDocument();
  });

  it('shows assessment history in detail view', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText('CloudCorp')).toBeInTheDocument());
    fireEvent.click(screen.getByText('CloudCorp'));
    await waitFor(() => expect(screen.getByText('Assessment History')).toBeInTheDocument());
    expect(screen.getByText('Security Review')).toBeInTheDocument();
  });

  it('shows AI-Powered Actions buttons in detail', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText('CloudCorp')).toBeInTheDocument());
    fireEvent.click(screen.getByText('CloudCorp'));
    await waitFor(() => expect(screen.getByText('AI-Powered Actions')).toBeInTheDocument());
    expect(screen.getByText('AI Risk Score')).toBeInTheDocument();
    expect(screen.getByText('Analyze Contract')).toBeInTheDocument();
    expect(screen.getByText('Due Diligence Report')).toBeInTheDocument();
    expect(screen.getByText('AI Monitoring Setup')).toBeInTheDocument();
  });

  it('navigates back from detail to list', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText('CloudCorp')).toBeInTheDocument());
    fireEvent.click(screen.getByText('CloudCorp'));
    await waitFor(() => expect(screen.getByText('Contact Information')).toBeInTheDocument());
    // Click back arrow
    const backBtn = document.querySelector('[data-testid="icon-ArrowLeft"]')?.closest('button');
    fireEvent.click(backBtn!);
    await waitFor(() => expect(screen.getByPlaceholderText('Search vendors...')).toBeInTheDocument());
  });

  // ---------------------------------------------------------------------------
  // Create Vendor
  // ---------------------------------------------------------------------------
  it('opens create vendor form when Add Vendor is clicked', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Add Vendor')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Add Vendor'));
    await waitFor(() => expect(screen.getByText('Add New Vendor')).toBeInTheDocument());
    expect(screen.getByText('Vendor Name *')).toBeInTheDocument();
  });

  it('submits create vendor form', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Add Vendor')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Add Vendor'));
    await waitFor(() => expect(screen.getByText('Add New Vendor')).toBeInTheDocument());
    const nameInput = document.querySelector('input[required]') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'NewVendor Co' } });
    fireEvent.click(screen.getByText('Add Vendor', { selector: 'button[type="submit"] *' }).closest('button')!);
    await waitFor(() => expect(vendorsCreate).toHaveBeenCalled());
  });

  it('cancel on create form navigates back to list', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Add Vendor')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Add Vendor'));
    await waitFor(() => expect(screen.getByText('Cancel')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.getByPlaceholderText('Search vendors...')).toBeInTheDocument());
  });

  it('toggles data access checkbox and shows data type chips', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Add Vendor')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Add Vendor'));
    await waitFor(() => expect(screen.getByText('Vendor has access to sensitive data')).toBeInTheDocument());
    const checkbox = screen.getByText('Vendor has access to sensitive data').closest('label')!.querySelector('input')!;
    fireEvent.click(checkbox);
    await waitFor(() => expect(screen.getByText('PII')).toBeInTheDocument());
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Edit Vendor
  // ---------------------------------------------------------------------------
  it('opens edit vendor form from list view', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText('CloudCorp')).toBeInTheDocument());
    const editBtns = document.querySelectorAll('[title="Edit"]');
    fireEvent.click(editBtns[0]);
    await waitFor(() => expect(screen.getByText('Edit Vendor')).toBeInTheDocument());
    expect(screen.getByDisplayValue('CloudCorp')).toBeInTheDocument();
  });

  it('submits edit vendor form', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText('CloudCorp')).toBeInTheDocument());
    const editBtns = document.querySelectorAll('[title="Edit"]');
    fireEvent.click(editBtns[0]);
    await waitFor(() => expect(screen.getByText('Save Changes')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Save Changes').closest('button')!);
    await waitFor(() => expect(vendorsUpdate).toHaveBeenCalled());
  });

  // ---------------------------------------------------------------------------
  // Archive Vendor
  // ---------------------------------------------------------------------------
  it('archives vendor from list view with confirmation', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText('CloudCorp')).toBeInTheDocument());
    const archiveBtns = document.querySelectorAll('[title="Archive"]');
    fireEvent.click(archiveBtns[0]);
    await waitFor(() => expect(vendorsDelete).toHaveBeenCalledWith('v1'));
  });

  it('cancels archive when confirm returns false', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText('CloudCorp')).toBeInTheDocument());
    const archiveBtns = document.querySelectorAll('[title="Archive"]');
    fireEvent.click(archiveBtns[0]);
    expect(vendorsDelete).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // AI Features
  // ---------------------------------------------------------------------------
  it('triggers AI risk score from list view', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText('CloudCorp')).toBeInTheDocument());
    const aiBtns = document.querySelectorAll('[title="AI Risk Score"]');
    fireEvent.click(aiBtns[0]);
    await waitFor(() => expect(aiScoreVendor).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/AI Risk Analysis: CloudCorp/)).toBeInTheDocument());
  });

  it('handles AI score error gracefully', async () => {
    aiScoreVendor.mockRejectedValueOnce(new Error('AI service down'));
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText('CloudCorp')).toBeInTheDocument());
    const aiBtns = document.querySelectorAll('[title="AI Risk Score"]');
    fireEvent.click(aiBtns[0]);
    await waitFor(() => expect(screen.getByText(/Error: AI service down/)).toBeInTheDocument());
  });

  it('triggers AI contract analysis from detail', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText('CloudCorp')).toBeInTheDocument());
    fireEvent.click(screen.getByText('CloudCorp'));
    await waitFor(() => expect(screen.getByText('Analyze Contract')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Analyze Contract'));
    await waitFor(() => expect(screen.getByText('Contract Analyzer')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/Paste the vendor contract/), { target: { value: 'Sample contract text here' } });
    fireEvent.click(screen.getByText(/Analyze for Compliance Risks/));
    await waitFor(() => expect(aiAnalyzeContract).toHaveBeenCalledWith('Sample contract text here'));
    await waitFor(() => expect(screen.getByText('AI Analysis Report')).toBeInTheDocument());
  });

  it('shows empty state when no contract text is pasted', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText('CloudCorp')).toBeInTheDocument());
    fireEvent.click(screen.getByText('CloudCorp'));
    await waitFor(() => expect(screen.getByText('Analyze Contract')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Analyze Contract'));
    await waitFor(() => expect(screen.getByText(/Paste contract text to detect/)).toBeInTheDocument());
  });

  it('triggers AI due diligence from detail', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText('CloudCorp')).toBeInTheDocument());
    fireEvent.click(screen.getByText('CloudCorp'));
    await waitFor(() => expect(screen.getByText('Due Diligence Report')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Due Diligence Report'));
    await waitFor(() => expect(screen.getByText('AI Due Diligence Report')).toBeInTheDocument());
    await waitFor(() => expect(aiGenerateReport).toHaveBeenCalled());
  });

  it('triggers AI monitoring setup from detail', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText('CloudCorp')).toBeInTheDocument());
    fireEvent.click(screen.getByText('CloudCorp'));
    await waitFor(() => expect(screen.getByText('AI Monitoring Setup')).toBeInTheDocument());
    fireEvent.click(screen.getByText('AI Monitoring Setup'));
    await waitFor(() => expect(screen.getByText('AI-Suggested Monitoring Controls')).toBeInTheDocument());
    await waitFor(() => expect(aiChat).toHaveBeenCalled());
  });

  // ---------------------------------------------------------------------------
  // Assessment creation
  // ---------------------------------------------------------------------------
  it('creates an assessment from detail view', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Vendors')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Vendors'));
    await waitFor(() => expect(screen.getByText('CloudCorp')).toBeInTheDocument());
    fireEvent.click(screen.getByText('CloudCorp'));
    await waitFor(() => expect(screen.getByText('New Assessment')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Assessment'));
    await waitFor(() => expect(vendorsCreateAssessment).toHaveBeenCalledWith('v1', { assessmentType: 'Security Review' }));
  });

  // ---------------------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------------------
  it('shows error banner when vendor loading fails', async () => {
    vendorsList.mockRejectedValueOnce(new Error('Network error'));
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
    const closeBtn = screen.getByText('Network error').closest('div')?.querySelector('button');
    fireEvent.click(closeBtn!);
    await waitFor(() => expect(screen.queryByText('Network error')).not.toBeInTheDocument());
  });

  it('shows error on failed create', async () => {
    vendorsCreate.mockRejectedValueOnce(new Error('Create failed'));
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Add Vendor')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Add Vendor'));
    await waitFor(() => expect(screen.getByText('Add New Vendor')).toBeInTheDocument());
    const nameInput = document.querySelector('input[required]') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Fail Corp' } });
    fireEvent.click(screen.getByText('Add Vendor', { selector: 'button[type="submit"] *' }).closest('button')!);
    await waitFor(() => expect(screen.getByText('Create failed')).toBeInTheDocument());
  });

  // ---------------------------------------------------------------------------
  // Vendor count display
  // ---------------------------------------------------------------------------
  it('shows vendor count in header', async () => {
    render(<VendorManagement onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('2 vendors tracked')).toBeInTheDocument());
  });
});
