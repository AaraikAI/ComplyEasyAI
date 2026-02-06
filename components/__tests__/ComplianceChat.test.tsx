import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

vi.mock('@/services/geminiService', () => ({
  chatWithComplianceBot: vi.fn().mockResolvedValue('AI response about compliance'),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Test Org' } },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

vi.mock('@/services/api', () => ({
  api: {
    risks: { create: vi.fn().mockResolvedValue({ description: 'New risk', severity: 'Medium', status: 'Open' }), update: vi.fn().mockResolvedValue({}) },
    frameworks: { list: vi.fn().mockResolvedValue([{ id: 'fw1', name: 'GDPR', controls: [{ id: 'c1', name: 'Encryption Control' }] }]) },
    ai: { chat: vi.fn().mockResolvedValue({ response: 'Backend AI response' }) },
    acos: {
      createGoal: vi.fn().mockResolvedValue({ name: 'New Goal', targetScore: 85 }),
      createControlLoop: vi.fn().mockResolvedValue({ id: 'loop-1' }),
      runSimulation: vi.fn().mockResolvedValue({ scenarioType: 'Control Change', impact: 'High', recommendations: ['rec1'] }),
      runAutomatedScan: vi.fn().mockResolvedValue({ gaps: ['gap1'], misconfigurations: [], violations: [] }),
      executeControlLoop: vi.fn().mockResolvedValue({ status: 'Completed', confidence: 0.95 }),
      updateGoal: vi.fn().mockResolvedValue({}),
    },
    team: { list: vi.fn().mockResolvedValue([]) },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import { ComplianceChat } from '@/components/ComplianceChat';

const openChat = () => {
  const toggleButton = screen.getByTestId('icon-MessageSquare').closest('button');
  if (toggleButton) fireEvent.click(toggleButton);
};

const typeAndSend = async (text: string) => {
  const input = screen.getByPlaceholderText(/Try:|Ask about|Executing/i);
  fireEvent.change(input, { target: { value: text } });
  const sendButton = screen.getByTestId('icon-Send').closest('button');
  if (sendButton) {
    await act(async () => {
      fireEvent.click(sendButton);
    });
  }
};

describe('ComplianceChat', () => {
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Rendering & Toggle ----

  it('renders the chat toggle button in closed state', () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} currentView="dashboard" />);
    expect(screen.getByTestId('icon-MessageSquare')).toBeInTheDocument();
  });

  it('opens chat panel when toggle button is clicked', () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    expect(screen.getByText('Compliance Assistant')).toBeInTheDocument();
  });

  it('closes chat panel when X button is clicked', () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    expect(screen.getByText('Compliance Assistant')).toBeInTheDocument();
    // Click the X in the header (not the toggle)
    const closeButton = screen.getAllByTestId('icon-X')[0].closest('button');
    if (closeButton) fireEvent.click(closeButton);
    expect(screen.queryByText('Compliance Assistant')).not.toBeInTheDocument();
  });

  it('shows X icon on toggle when chat is open', () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    // The toggle button should now have the X icon (at least one X icon for toggle)
    const xIcons = screen.getAllByTestId('icon-X');
    expect(xIcons.length).toBeGreaterThanOrEqual(1);
  });

  it('displays the welcome message when chat opens', () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    expect(screen.getByText(/ComplyEasy AI assistant/i)).toBeInTheDocument();
    expect(screen.getByText(/Navigate/)).toBeInTheDocument();
    expect(screen.getByText(/Create/)).toBeInTheDocument();
  });

  it('has an input field and send button', () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    expect(screen.getByPlaceholderText(/Try:/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-Send')).toBeInTheDocument();
  });

  it('shows "Ready to help" status text', () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    expect(screen.getByText('Ready to help')).toBeInTheDocument();
  });

  it('shows current view when currentView prop is provided', () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} currentView="dashboard" />);
    openChat();
    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it('does not show current view when currentView is not provided', () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    expect(screen.queryByText('Current view:')).not.toBeInTheDocument();
  });

  // ---- Input behavior ----

  it('updates input value when user types', () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    const input = screen.getByPlaceholderText(/Try:/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(input.value).toBe('hello');
  });

  it('disables send button when input is empty', () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    const sendButton = screen.getByTestId('icon-Send').closest('button');
    expect(sendButton).toHaveAttribute('disabled');
  });

  it('enables send button when input has text', () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    const input = screen.getByPlaceholderText(/Try:/i);
    fireEvent.change(input, { target: { value: 'hello' } });
    const sendButton = screen.getByTestId('icon-Send').closest('button');
    expect(sendButton).not.toHaveAttribute('disabled');
  });

  it('clears input after sending a message', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Go to dashboard');
    const input = screen.getByPlaceholderText(/Try:/i) as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('sends message on Enter key press', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    const input = screen.getByPlaceholderText(/Try:/i);
    fireEvent.change(input, { target: { value: 'Go to dashboard' } });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });
    await waitFor(() => {
      expect(mockOnNavigate).toHaveBeenCalledWith('dashboard');
    });
  });

  // ---- Navigation commands ----

  it('navigates to dashboard when user says "Go to dashboard"', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Go to dashboard');
    await waitFor(() => {
      expect(mockOnNavigate).toHaveBeenCalledWith('dashboard');
    });
  });

  it('navigates to risks when user says "Open risks"', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Open risks');
    await waitFor(() => {
      expect(mockOnNavigate).toHaveBeenCalledWith('risks');
    });
  });

  it('navigates to frameworks when user says "Show frameworks"', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Show frameworks');
    await waitFor(() => {
      expect(mockOnNavigate).toHaveBeenCalledWith('frameworks');
    });
  });

  it('navigates to reports when user says "Go to reports"', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Go to reports');
    await waitFor(() => {
      expect(mockOnNavigate).toHaveBeenCalledWith('reports');
    });
  });

  it('navigates to EU AI Act when requested', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Go to EU AI Act');
    await waitFor(() => {
      expect(mockOnNavigate).toHaveBeenCalledWith('eu-ai-act');
    });
  });

  it('navigates to DMA when requested', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Go to DMA');
    await waitFor(() => {
      expect(mockOnNavigate).toHaveBeenCalledWith('dma');
    });
  });

  it('navigates to DSA when requested', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Go to DSA');
    await waitFor(() => {
      expect(mockOnNavigate).toHaveBeenCalledWith('dsa');
    });
  });

  it('navigates to analytics when requested', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Go to analytics');
    await waitFor(() => {
      expect(mockOnNavigate).toHaveBeenCalledWith('analytics');
    });
  });

  it('navigates to NIST AI RMF when requested', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Go to AI RMF');
    await waitFor(() => {
      expect(mockOnNavigate).toHaveBeenCalledWith('ai-rmf');
    });
  });

  it('shows navigation unavailable message when no onNavigate prop', async () => {
    render(<ComplianceChat />);
    openChat();
    await typeAndSend('Go to dashboard');
    await waitFor(() => {
      expect(screen.getByText(/Navigation is not available/i)).toBeInTheDocument();
    });
  });

  // ---- Delete blocking ----

  it('blocks delete commands', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Delete this risk');
    await waitFor(() => {
      const markdowns = screen.getAllByTestId('markdown');
      const lastMarkdown = markdowns[markdowns.length - 1];
      expect(lastMarkdown.textContent).toContain('Delete operations are not available via chat');
    });
  });

  // ---- Create commands ----

  it('creates a risk when user says "Create a risk"', async () => {
    const { api } = await import('@/services/api');
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Create a risk for missing encryption');
    await waitFor(() => {
      expect(api.risks.create).toHaveBeenCalled();
    });
  });

  it('creates a goal when user says "Create a goal"', async () => {
    const { api } = await import('@/services/api');
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Create a goal for GDPR');
    await waitFor(() => {
      expect(api.acos.createGoal).toHaveBeenCalled();
    });
  });

  // ---- Run commands ----

  it('runs a simulation when user says "Run simulation"', async () => {
    const { api } = await import('@/services/api');
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Run a simulation');
    await waitFor(() => {
      expect(api.acos.runSimulation).toHaveBeenCalled();
    });
  });

  it('runs a scan when user says "Run a scan"', async () => {
    const { api } = await import('@/services/api');
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Run a scan');
    await waitFor(() => {
      expect(api.acos.runAutomatedScan).toHaveBeenCalled();
    });
  });

  // ---- Edit commands ----

  it('handles edit risk status command', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Update risk status to Resolved');
    await waitFor(() => {
      expect(screen.getByText(/Status update requested/i)).toBeInTheDocument();
    });
  });

  it('shows error when edit goal without ID', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Edit goal target score to 90');
    await waitFor(() => {
      expect(screen.getByText(/specify the goal ID/i)).toBeInTheDocument();
    });
  });

  // ---- General query (AI) ----

  it('falls back to AI for unrecognized queries', async () => {
    const { api } = await import('@/services/api');
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('What is GDPR?');
    await waitFor(() => {
      expect(api.ai.chat).toHaveBeenCalledWith('What is GDPR?', undefined);
    });
  });

  // ---- Clear chat ----

  it('clears chat history when clear button is clicked', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    // Send a message first so clear button is enabled
    await typeAndSend('Go to dashboard');
    await waitFor(() => {
      expect(screen.getByText(/Navigated to Dashboard/i)).toBeInTheDocument();
    });
    // Click clear button (Trash2 icon)
    const clearButton = screen.getByTestId('icon-Trash2').closest('button');
    if (clearButton) fireEvent.click(clearButton);
    await waitFor(() => {
      expect(screen.getByText(/Chat history cleared/i)).toBeInTheDocument();
    });
  });

  it('disables clear button when only welcome message exists', () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    const clearButton = screen.getByTestId('icon-Trash2').closest('button');
    expect(clearButton).toHaveAttribute('disabled');
  });

  // ---- Paperclip / File upload ----

  it('shows paperclip button for file attachment', () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    expect(screen.getByTestId('icon-Paperclip')).toBeInTheDocument();
  });

  // ---- aCOS sub-tab navigation ----

  it('navigates to aCOS overview tab', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Go to aCOS overview');
    await waitFor(() => {
      const markdowns = screen.getAllByTestId('markdown');
      const hasAcosNav = markdowns.some(el => el.textContent?.includes('Navigated to aCOS'));
      expect(hasAcosNav).toBe(true);
    });
  });

  // ---- Security sub-tab navigation ----

  it('navigates to security zero trust', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Go to zero trust');
    await waitFor(() => {
      const markdowns = screen.getAllByTestId('markdown');
      const hasSecurityNav = markdowns.some(el => el.textContent?.includes('Security Features'));
      expect(hasSecurityNav).toBe(true);
    });
  });

  // ---- Settings sub-tab navigation ----

  it('navigates to settings billing', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Go to settings billing');
    await waitFor(() => {
      const markdowns = screen.getAllByTestId('markdown');
      const hasSettingsNav = markdowns.some(el => el.textContent?.includes('Navigated to Settings'));
      expect(hasSettingsNav).toBe(true);
    });
  });

  // ---- AI tool navigation ----

  it('navigates to policy generator', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Open policy generator');
    await waitFor(() => {
      expect(mockOnNavigate).toHaveBeenCalledWith('ai-policy');
    });
  });

  // ---- Error handling ----

  it('displays error message when AI chat fails', async () => {
    const { api } = await import('@/services/api');
    const { chatWithComplianceBot } = await import('@/services/geminiService');
    (api.ai.chat as any).mockRejectedValueOnce(new Error('API down'));
    (chatWithComplianceBot as any).mockRejectedValueOnce(new Error('Service error'));
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('What is SOC2?');
    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });
  });

  it('shows user message in chat after sending', async () => {
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    await typeAndSend('Go to dashboard');
    await waitFor(() => {
      expect(screen.getByText('Go to dashboard')).toBeInTheDocument();
    });
  });

  // ---- Multiple messages ----

  it('shows typing indicator while processing', async () => {
    const { api } = await import('@/services/api');
    let resolveChat: (val: any) => void;
    (api.ai.chat as any).mockImplementation(() => new Promise(r => { resolveChat = r; }));
    render(<ComplianceChat onNavigate={mockOnNavigate} />);
    openChat();
    const input = screen.getByPlaceholderText(/Try:/i);
    fireEvent.change(input, { target: { value: 'What is compliance?' } });
    const sendButton = screen.getByTestId('icon-Send').closest('button');
    if (sendButton) {
      fireEvent.click(sendButton);
    }
    // Input should be disabled while typing
    await waitFor(() => {
      const inputField = screen.getByPlaceholderText(/Try:|Ask about|Executing/i) as HTMLInputElement;
      expect(inputField.disabled).toBe(true);
    });
    // Resolve the promise
    await act(async () => {
      resolveChat!({ response: 'Done' });
    });
  });
});
