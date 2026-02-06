import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Frameworks } from '../Frameworks';
import { ComplianceFramework, ComplianceStatus, FrameworkType } from '../../types';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// --- Mocks ---

const mockFrameworksGetTemplates = vi.fn().mockResolvedValue({ templates: [] });
const mockFrameworksGetTemplateControls = vi.fn().mockResolvedValue({ categories: [], controlCount: 0 });
const mockFrameworksApplyTemplate = vi.fn().mockResolvedValue({ message: 'Applied', applied: 5, skipped: 0 });
const mockFrameworksGetById = vi.fn().mockResolvedValue({ controls: [{ id: 'c1', name: 'Control 1', controlId: 'AC-1' }] });
const mockFrameworksDelete = vi.fn().mockResolvedValue({});
const mockAiPerformGapAnalysis = vi.fn().mockResolvedValue({ analysis: '{"gaps":[],"prioritizedRoadmap":[],"overallScore":50,"summary":"Test summary"}' });
const mockAiChat = vi.fn().mockResolvedValue({ response: 'AI response' });
const mockEnterpriseCoPilot = vi.fn().mockResolvedValue({ recommendations: [] });

vi.mock('../../services/api', () => ({
  api: {
    frameworks: {
      getTemplates: () => mockFrameworksGetTemplates(),
      getTemplateControls: (...args: any[]) => mockFrameworksGetTemplateControls(...args),
      applyTemplate: (...args: any[]) => mockFrameworksApplyTemplate(...args),
      getById: (...args: any[]) => mockFrameworksGetById(...args),
      delete: (...args: any[]) => mockFrameworksDelete(...args),
    },
    ai: {
      performGapAnalysis: (...args: any[]) => mockAiPerformGapAnalysis(...args),
      chat: (...args: any[]) => mockAiChat(...args),
    },
    enterprise: {
      visionaryAI: {
        getCoPilotRecommendations: () => mockEnterpriseCoPilot(),
      },
    },
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin', organization: { plan: 'Growth' } },
    isAuthenticated: true,
  }),
}));

vi.mock('../../constants', () => ({
  AVAILABLE_FRAMEWORKS: [
    { name: 'SOC 2 Type II', region: 'Global', description: 'Service Organization Control 2' },
    { name: 'GDPR', region: 'EU', description: 'General Data Protection Regulation' },
    { name: 'HIPAA', region: 'US', description: 'Health Insurance Portability and Accountability Act' },
    { name: 'ISO 27001', region: 'Global', description: 'Information security management' },
    { name: 'PCI DSS', region: 'Global', description: 'Payment Card Industry Data Security Standard' },
  ],
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <div data-testid="markdown">{children}</div>,
}));

describe('Frameworks Component', () => {
  const mockActive: ComplianceFramework[] = [
    {
      id: '1',
      name: FrameworkType.SOC2,
      status: ComplianceStatus.COMPLIANT,
      progress: 100,
      nextAuditDate: '2026-12-31',
      region: 'Global',
    },
    {
      id: '2',
      name: FrameworkType.GDPR,
      status: ComplianceStatus.AT_RISK,
      progress: 85,
      nextAuditDate: '2026-06-30',
      region: 'EU',
    },
    {
      id: '3',
      name: FrameworkType.HIPAA,
      status: ComplianceStatus.IN_REVIEW,
      progress: 60,
      nextAuditDate: '2026-03-15',
    },
  ];

  const mockAdd = vi.fn();
  const mockSelect = vi.fn();
  const mockDeleted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===== RENDERING =====
  describe('Rendering', () => {
    it('renders active frameworks with names', () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      expect(screen.getByText(FrameworkType.SOC2)).toBeInTheDocument();
      expect(screen.getByText(FrameworkType.GDPR)).toBeInTheDocument();
      expect(screen.getByText(FrameworkType.HIPAA)).toBeInTheDocument();
    });

    it('renders progress percentages', () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('renders region badges when present', () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      expect(screen.getByText('Global')).toBeInTheDocument();
      expect(screen.getByText('EU')).toBeInTheDocument();
    });

    it('renders header text', () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      expect(screen.getByText('Active Frameworks')).toBeInTheDocument();
      expect(screen.getByText(/Monitor and manage your compliance standards/)).toBeInTheDocument();
    });

    it('renders export button', () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('renders Add Framework buttons', () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      const addButtons = screen.getAllByText('Add Framework');
      expect(addButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders empty state with Add Framework card', () => {
      render(<Frameworks activeFrameworks={[]} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      expect(screen.getByText('Browse catalog...')).toBeInTheDocument();
    });

    it('renders Manage button for each framework', () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      const manageButtons = screen.getAllByText('Manage');
      expect(manageButtons).toHaveLength(3);
    });

    it('renders AI Insights buttons for each framework', () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      const aiButtons = screen.getAllByText('AI Insights');
      expect(aiButtons).toHaveLength(3);
    });

    it('renders Classify Evidence buttons for each framework', () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      const classifyButtons = screen.getAllByText('Classify Evidence');
      expect(classifyButtons).toHaveLength(3);
    });
  });

  // ===== COMPLIANCE STATUS ICONS =====
  describe('Status Icons', () => {
    it('renders CheckCircle icon for COMPLIANT status', () => {
      render(<Frameworks activeFrameworks={[mockActive[0]]} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      expect(screen.getByTestId('icon-CheckCircle')).toBeInTheDocument();
    });

    it('renders AlertTriangle icon for AT_RISK status', () => {
      render(<Frameworks activeFrameworks={[mockActive[1]]} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      expect(screen.getByTestId('icon-AlertTriangle')).toBeInTheDocument();
    });

    it('renders Clock icon for IN_REVIEW status', () => {
      render(<Frameworks activeFrameworks={[mockActive[2]]} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      expect(screen.getByTestId('icon-Clock')).toBeInTheDocument();
    });
  });

  // ===== FRAMEWORK LIMIT =====
  describe('Framework Limit', () => {
    it('shows framework limit reached message when maxFrameworks is hit', () => {
      render(
        <Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} maxFrameworks={3} />
      );
      expect(screen.getByText(/Framework limit reached/)).toBeInTheDocument();
    });

    it('disables Add Framework button when limit reached', () => {
      render(
        <Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} maxFrameworks={3} />
      );
      const addButtons = screen.getAllByText('Add Framework');
      addButtons.forEach(btn => {
        expect(btn.closest('button')).toBeDisabled();
      });
    });

    it('shows limit text in add card when limit reached', () => {
      render(
        <Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} maxFrameworks={3} />
      );
      expect(screen.getByText(/Limit reached/)).toBeInTheDocument();
    });

    it('does not show limit message when maxFrameworks is -1', () => {
      render(
        <Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} maxFrameworks={-1} />
      );
      expect(screen.queryByText(/Framework limit reached/)).not.toBeInTheDocument();
    });
  });

  // ===== ADD FRAMEWORK MODAL =====
  describe('Add Framework Modal', () => {
    it('opens modal when Add Framework is clicked', async () => {
      render(<Frameworks activeFrameworks={[]} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      const addButtons = screen.getAllByText('Add Framework');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Add Compliance Framework')).toBeInTheDocument();
      });
    });

    it('shows search input in modal', async () => {
      render(<Frameworks activeFrameworks={[]} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      fireEvent.click(screen.getAllByText('Add Framework')[0]);

      const searchInput = await screen.findByPlaceholderText(/search standards/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('filters frameworks in modal by search term', async () => {
      render(<Frameworks activeFrameworks={[]} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      fireEvent.click(screen.getAllByText('Add Framework')[0]);

      const searchInput = await screen.findByPlaceholderText(/search standards/i);
      fireEvent.change(searchInput, { target: { value: 'HIPAA' } });

      await waitFor(() => {
        expect(screen.getByText('HIPAA')).toBeInTheDocument();
      });
    });

    it('shows "No matching frameworks found" when search has no results', async () => {
      render(<Frameworks activeFrameworks={[]} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      fireEvent.click(screen.getAllByText('Add Framework')[0]);

      const searchInput = await screen.findByPlaceholderText(/search standards/i);
      fireEvent.change(searchInput, { target: { value: 'NonExistentFramework12345' } });

      await waitFor(() => {
        expect(screen.getByText('No matching frameworks found.')).toBeInTheDocument();
      });
    });

    it('calls onAddFramework and closes modal when Add button clicked', async () => {
      render(<Frameworks activeFrameworks={[]} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      fireEvent.click(screen.getAllByText('Add Framework')[0]);

      const addButtons = await screen.findAllByText('Add');
      fireEvent.click(addButtons[0]);

      expect(mockAdd).toHaveBeenCalled();
    });

    it('closes modal when X button is clicked', async () => {
      render(<Frameworks activeFrameworks={[]} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      fireEvent.click(screen.getAllByText('Add Framework')[0]);

      await waitFor(() => {
        expect(screen.getByText('Add Compliance Framework')).toBeInTheDocument();
      });

      // Find the close button (X icon) in the modal header
      const closeButtons = screen.getAllByTestId('icon-X');
      fireEvent.click(closeButtons[0].closest('button')!);

      await waitFor(() => {
        expect(screen.queryByText('Add Compliance Framework')).not.toBeInTheDocument();
      });
    });

    it('excludes already active frameworks from the add modal list', async () => {
      render(
        <Frameworks
          activeFrameworks={[{ id: '1', name: 'HIPAA', status: ComplianceStatus.COMPLIANT, progress: 100, nextAuditDate: '2026-12-31' }]}
          onAddFramework={mockAdd}
          onSelectFramework={mockSelect}
        />
      );
      fireEvent.click(screen.getAllByText('Add Framework')[0]);

      const searchInput = await screen.findByPlaceholderText(/search standards/i);
      fireEvent.change(searchInput, { target: { value: 'HIPAA' } });

      // HIPAA should not appear in the list because it is already active
      await waitFor(() => {
        expect(screen.queryByText('No matching frameworks found.')).toBeInTheDocument();
      });
    });
  });

  // ===== FRAMEWORK ACTIONS =====
  describe('Framework Actions', () => {
    it('calls onSelectFramework when Manage is clicked', () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      const manageButtons = screen.getAllByText('Manage');
      fireEvent.click(manageButtons[0]);
      expect(mockSelect).toHaveBeenCalledWith('1');
    });

    it('shows delete button for admin users', () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      const trashIcons = screen.getAllByTestId('icon-Trash2');
      expect(trashIcons.length).toBeGreaterThan(0);
    });

    it('calls API to delete framework with confirmation', async () => {
      render(
        <Frameworks
          activeFrameworks={mockActive}
          onAddFramework={mockAdd}
          onSelectFramework={mockSelect}
          onFrameworkDeleted={mockDeleted}
        />
      );
      const trashIcons = screen.getAllByTestId('icon-Trash2');
      fireEvent.click(trashIcons[0].closest('button')!);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
        expect(mockFrameworksDelete).toHaveBeenCalledWith('1');
      });
    });

    it('calls onFrameworkDeleted callback after successful deletion', async () => {
      render(
        <Frameworks
          activeFrameworks={mockActive}
          onAddFramework={mockAdd}
          onSelectFramework={mockSelect}
          onFrameworkDeleted={mockDeleted}
        />
      );
      const trashIcons = screen.getAllByTestId('icon-Trash2');
      fireEvent.click(trashIcons[0].closest('button')!);

      await waitFor(() => {
        expect(mockDeleted).toHaveBeenCalled();
      });
    });

    it('does not delete when confirm is cancelled', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      const trashIcons = screen.getAllByTestId('icon-Trash2');
      fireEvent.click(trashIcons[0].closest('button')!);

      expect(mockFrameworksDelete).not.toHaveBeenCalled();
    });
  });

  // ===== AI EVIDENCE CLASSIFICATION MODAL =====
  describe('AI Evidence Classification', () => {
    it('opens evidence modal when Classify Evidence is clicked', async () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      const classifyButtons = screen.getAllByText('Classify Evidence');
      fireEvent.click(classifyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('AI Evidence Classification')).toBeInTheDocument();
      });
    });

    it('shows evidence description textarea in modal', async () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      fireEvent.click(screen.getAllByText('Classify Evidence')[0]);

      await waitFor(() => {
        expect(screen.getByText('Evidence Description')).toBeInTheDocument();
      });
    });

    it('shows Classify with AI button', async () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      fireEvent.click(screen.getAllByText('Classify Evidence')[0]);

      await waitFor(() => {
        expect(screen.getByText('Classify with AI')).toBeInTheDocument();
      });
    });

    it('closes evidence modal when X is clicked', async () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      fireEvent.click(screen.getAllByText('Classify Evidence')[0]);

      await waitFor(() => {
        expect(screen.getByText('AI Evidence Classification')).toBeInTheDocument();
      });

      // Find the close button in the evidence modal
      const closeButtons = screen.getAllByTestId('icon-X');
      const modalClose = closeButtons[closeButtons.length - 1].closest('button')!;
      fireEvent.click(modalClose);

      await waitFor(() => {
        expect(screen.queryByText('AI Evidence Classification')).not.toBeInTheDocument();
      });
    });
  });

  // ===== AI CO-PILOT =====
  describe('AI Co-Pilot', () => {
    it('opens co-pilot modal when AI Insights is clicked', async () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      const aiButtons = screen.getAllByText('AI Insights');
      fireEvent.click(aiButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('AI Compliance Co-Pilot')).toBeInTheDocument();
      });
    });

    it('shows loading state in co-pilot modal', async () => {
      mockEnterpriseCoPilot.mockImplementation(() => new Promise(() => {}));
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      fireEvent.click(screen.getAllByText('AI Insights')[0]);

      await waitFor(() => {
        expect(screen.getByText('AI is generating recommendations...')).toBeInTheDocument();
      });
    });

    it('shows empty state or generates recommendations', async () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      fireEvent.click(screen.getAllByText('AI Insights')[0]);

      // After CoPilot resolves with empty recommendations, the component falls through to AI chat
      // which either produces recommendations or shows the empty state
      await waitFor(() => {
        const hasEmptyState = screen.queryByText('No recommendations available at this time');
        const hasRecommendations = screen.queryByText('Refresh Recommendations');
        expect(hasEmptyState || hasRecommendations).toBeTruthy();
      });
    });

    it('shows Refresh Recommendations button', async () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      fireEvent.click(screen.getAllByText('AI Insights')[0]);

      await waitFor(() => {
        expect(screen.getByText('Refresh Recommendations')).toBeInTheDocument();
      });
    });
  });

  // ===== TEMPLATE SUPPORT =====
  describe('Template Support', () => {
    it('shows template badge when templates are loaded for a framework', async () => {
      mockFrameworksGetTemplates.mockResolvedValueOnce({
        templates: [{ frameworkType: 'SOC 2 Type II', displayName: 'SOC 2', description: 'SOC 2 Template', controlCount: 50, categories: [] }],
      });
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);

      await waitFor(() => {
        expect(screen.getByText('50 controls available')).toBeInTheDocument();
      });
    });

    it('shows Apply Template Controls button when template exists', async () => {
      mockFrameworksGetTemplates.mockResolvedValueOnce({
        templates: [{ frameworkType: 'SOC 2 Type II', displayName: 'SOC 2', description: 'SOC 2 Template', controlCount: 50, categories: [] }],
      });
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);

      await waitFor(() => {
        expect(screen.getByText('Apply 50 Template Controls')).toBeInTheDocument();
      });
    });
  });

  // ===== AUDIT DATE FORMATTING =====
  describe('Audit Date Formatting', () => {
    it('renders audit due date for each framework', () => {
      render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
      const auditTexts = screen.getAllByText(/Audit Due:/);
      expect(auditTexts).toHaveLength(3);
    });
  });
});
