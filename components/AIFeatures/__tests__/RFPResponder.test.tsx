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

vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('dompurify', () => ({ default: { sanitize: (s: string) => s } }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: '1', name: 'Test', email: 'test@test.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Test Org' } },
    isAuthenticated: true,
  }),
}));

vi.mock('@/services/api', () => ({
  api: {
    ai: { generateRFPResponse: vi.fn().mockResolvedValue({ response: 'Yes, AES-256', confidence: 0.95 }) },
    frameworks: { getAll: vi.fn().mockResolvedValue([]) },
    onboarding: { getProgress: vi.fn().mockResolvedValue(null) },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
}));

vi.mock('@/services/geminiService', () => ({
  generateRFPResponse: vi.fn().mockResolvedValue({ answer: 'Yes, AES-256', confidence: 0.95 }),
}));

vi.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: vi.fn().mockReturnValue({ isOnboarding: false }),
  useOnboardingFlow: vi.fn().mockReturnValue({ isActive: false }),
  useOnboardingTrigger: vi.fn(),
  useOnboardingHint: vi.fn().mockReturnValue({ isVisible: false }),
  useOnboardingChecklist: vi.fn().mockReturnValue({ items: [], completedCount: 0, totalCount: 0, percentage: 0, isComplete: false, startFlowForItem: vi.fn() }),
  useConfetti: vi.fn().mockReturnValue({ trigger: vi.fn(), dismiss: vi.fn(), isShowing: false }),
}));

vi.mock('@/contexts/OnboardingContext', () => ({
  OnboardingProvider: ({ children }: any) => <>{children}</>,
  useOnboardingContext: vi.fn().mockReturnValue({ isOnboarding: false, currentFlow: null, isLoaded: true }),
}));

vi.mock('@/constants/tierFeatures', () => ({
  canAccessView: vi.fn().mockReturnValue(true),
  normalizePlan: vi.fn().mockReturnValue('Growth'),
  hasFeature: vi.fn().mockReturnValue(true),
  TIER_ORDER: ['Foundation', 'Essentials', 'Growth', 'Visionary'],
}));

import { RFPResponder } from '../RFPResponder';
import { api } from '@/services/api';

describe('RFPResponder', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading', () => {
    render(<RFPResponder onBack={mockOnBack} />);
    expect(screen.getByText('RFP Auto-Responder')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<RFPResponder onBack={mockOnBack} />);
    const backBtn = screen.getByTestId('icon-ArrowLeft').closest('button')!;
    fireEvent.click(backBtn);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('disables generate button when textarea is empty', () => {
    render(<RFPResponder onBack={mockOnBack} />);
    const generateBtn = screen.getByText(/Generate Answer/i).closest('button')!;
    expect(generateBtn).toBeDisabled();
  });

  it('calls API and shows answers when questions are entered', async () => {
    render(<RFPResponder onBack={mockOnBack} />);
    const textarea = screen.getByPlaceholderText(/Paste the question/i);
    fireEvent.change(textarea, { target: { value: 'Do you encrypt data at rest?' } });

    const generateBtn = screen.getByText(/Generate Answer/i).closest('button')!;
    expect(generateBtn).not.toBeDisabled();
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(api.ai.generateRFPResponse).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('shows placeholder when no responses generated', () => {
    render(<RFPResponder onBack={mockOnBack} />);
    expect(screen.getByText(/Generated answer\(s\) will appear here/i)).toBeInTheDocument();
  });
});
