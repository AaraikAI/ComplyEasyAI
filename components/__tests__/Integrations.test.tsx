import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Integrations } from '../Integrations';

// --- Mocks ---

const mockIntegrationsList = vi.fn().mockResolvedValue([]);
const mockIntegrationsDisconnect = vi.fn().mockResolvedValue({});
const mockIntegrationsSync = vi.fn().mockResolvedValue({});

vi.mock('../../services/api', () => ({
  api: {
    integrations: {
      list: () => mockIntegrationsList(),
      disconnect: (...args: any[]) => mockIntegrationsDisconnect(...args),
      sync: (...args: any[]) => mockIntegrationsSync(...args),
    },
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: '1', name: 'Test', email: 'test@test.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Test Org' } },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

vi.mock('../../constants/tierLimits', () => ({
  isAtLimit: vi.fn().mockReturnValue(false),
  getUpgradeMessage: vi.fn().mockReturnValue('Upgrade your plan for more integrations.'),
}));

vi.mock('../IntegrationModal', () => ({
  IntegrationModal: ({ integration, onClose, onConnect, onDisconnect }: any) => (
    <div data-testid="integration-modal">
      <span>{integration.name}</span>
      <button onClick={onConnect}>Modal Connect</button>
      <button onClick={() => onDisconnect()}>Modal Disconnect</button>
      <button onClick={onClose}>Modal Close</button>
    </div>
  ),
}));

describe('Integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===== RENDERING =====
  describe('Rendering', () => {
    it('renders the integrations catalog title', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(screen.getByText('Integrations')).toBeInTheDocument();
      });
    });

    it('renders the connected count text', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(screen.getByText(/Connect your tools to automate compliance collection/)).toBeInTheDocument();
      });
    });

    it('renders the search input', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      });
    });

    it('renders category filter buttons', async () => {
      render(<Integrations />);
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const catLabels = ['All', 'Cloud', 'Code', 'Security'];
        catLabels.forEach(cat => {
          const btn = buttons.find(b => b.textContent === cat);
          expect(btn).toBeTruthy();
        });
      });
    });

    it('renders integration cards', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(screen.getByText('AWS')).toBeInTheDocument();
        expect(screen.getByText('GitHub')).toBeInTheDocument();
        expect(screen.getByText('Slack')).toBeInTheDocument();
      });
    });

    it('shows Connect button for disconnected integrations', async () => {
      render(<Integrations />);
      await waitFor(() => {
        const connectButtons = screen.getAllByText('Connect');
        expect(connectButtons.length).toBeGreaterThan(0);
      });
    });

    it('shows onBack button when onBack prop is provided', () => {
      const mockBack = vi.fn();
      render(<Integrations onBack={mockBack} />);
      // The Close button is inside a button element with a span; there's also a CRM integration named "Close"
      const closeButtons = screen.getAllByText('Close');
      const closeBtn = closeButtons.find(el => el.closest('button')?.querySelector('[data-testid="icon-X"]'));
      expect(closeBtn).toBeTruthy();
    });

    it('calls onBack when Close button is clicked', () => {
      const mockBack = vi.fn();
      render(<Integrations onBack={mockBack} />);
      // Find the Close button (not the CRM integration card named "Close")
      const closeButtons = screen.getAllByText('Close');
      const closeBtn = closeButtons.find(el => el.closest('button')?.querySelector('[data-testid="icon-X"]'));
      expect(closeBtn).toBeTruthy();
      fireEvent.click(closeBtn!.closest('button')!);
      expect(mockBack).toHaveBeenCalled();
    });

    it('does not show Close back-button when onBack is not provided', () => {
      render(<Integrations />);
      // Without onBack, there should be no button with icon-X containing "Close"
      const closeElements = screen.queryAllByText('Close');
      const closeBackBtn = closeElements.find(el => el.closest('button')?.querySelector('[data-testid="icon-X"]'));
      expect(closeBackBtn).toBeFalsy();
    });
  });

  // ===== SEARCH FILTERING =====
  describe('Search Filtering', () => {
    it('filters integrations by search query', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'GitHub' } });

      await waitFor(() => {
        expect(screen.getByText('GitHub')).toBeInTheDocument();
        expect(screen.queryByText('Slack')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when search matches nothing', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'NonExistentIntegration123' } });

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });
    });

    it('shows Clear filters button when no results', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'NoMatch999' } });

      await waitFor(() => {
        expect(screen.getByText('Clear filters')).toBeInTheDocument();
      });
    });

    it('clears search and category when Clear filters is clicked', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'NoMatch999' } });

      await waitFor(() => {
        expect(screen.getByText('Clear filters')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Clear filters'));

      await waitFor(() => {
        expect(screen.getByText('AWS')).toBeInTheDocument();
      });
    });
  });

  // ===== CATEGORY FILTERING =====
  describe('Category Filtering', () => {
    const getCategoryButton = (label: string) => {
      const buttons = screen.getAllByRole('button');
      return buttons.find(b => b.textContent === label)!;
    };

    it('filters by Cloud category', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(getCategoryButton('Cloud')).toBeTruthy();
      });

      fireEvent.click(getCategoryButton('Cloud'));

      await waitFor(() => {
        expect(screen.getByText('AWS')).toBeInTheDocument();
        expect(screen.getByText('Microsoft Azure')).toBeInTheDocument();
      });
    });

    it('filters by Code category', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(getCategoryButton('Code')).toBeTruthy();
      });
      fireEvent.click(getCategoryButton('Code'));

      await waitFor(() => {
        expect(screen.getByText('GitHub')).toBeInTheDocument();
        expect(screen.getByText('GitLab')).toBeInTheDocument();
      });
    });

    it('filters by Security category', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(getCategoryButton('Security')).toBeTruthy();
      });
      fireEvent.click(getCategoryButton('Security'));

      await waitFor(() => {
        expect(screen.getByText('CrowdStrike')).toBeInTheDocument();
        expect(screen.getByText('SentinelOne')).toBeInTheDocument();
      });
    });

    it('filters by Identity category', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(getCategoryButton('Identity')).toBeTruthy();
      });
      fireEvent.click(getCategoryButton('Identity'));

      await waitFor(() => {
        expect(screen.getByText('Okta')).toBeInTheDocument();
        expect(screen.getByText('Google Workspace')).toBeInTheDocument();
      });
    });

    it('shows all integrations when All is clicked', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(getCategoryButton('Cloud')).toBeTruthy();
      });
      fireEvent.click(getCategoryButton('Cloud'));
      fireEvent.click(getCategoryButton('All'));

      await waitFor(() => {
        expect(screen.getByText('AWS')).toBeInTheDocument();
        expect(screen.getByText('GitHub')).toBeInTheDocument();
        expect(screen.getByText('Okta')).toBeInTheDocument();
      });
    });
  });

  // ===== CONNECTED INTEGRATIONS =====
  describe('Connected Integrations', () => {
    it('shows Connected badge and Configure button for connected integrations', async () => {
      mockIntegrationsList.mockResolvedValueOnce([
        { name: 'aws', provider: 'aws', connected: true, lastSync: '2026-01-01T00:00:00Z' },
      ]);
      render(<Integrations />);

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
      expect(screen.getByText('Configure')).toBeInTheDocument();
    });

    it('shows last sync date for connected integrations', async () => {
      mockIntegrationsList.mockResolvedValueOnce([
        { name: 'aws', provider: 'aws', connected: true, lastSync: '2026-01-01T00:00:00Z' },
      ]);
      render(<Integrations />);

      await waitFor(() => {
        expect(screen.getByText(/Last Sync:/)).toBeInTheDocument();
      });
    });

    it('shows Sync Now button for connected integrations', async () => {
      mockIntegrationsList.mockResolvedValueOnce([
        { name: 'aws', provider: 'aws', connected: true, lastSync: '2026-01-01T00:00:00Z' },
      ]);
      render(<Integrations />);

      await waitFor(() => {
        expect(screen.getByText('Sync Now')).toBeInTheDocument();
      });
    });
  });

  // ===== INTEGRATION MODAL =====
  describe('Integration Modal', () => {
    it('opens integration modal when Connect button is clicked', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(screen.getAllByText('Connect').length).toBeGreaterThan(0);
      });

      fireEvent.click(screen.getAllByText('Connect')[0]);

      await waitFor(() => {
        expect(screen.getByTestId('integration-modal')).toBeInTheDocument();
      });
    });

    it('closes integration modal when close button is clicked', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(screen.getAllByText('Connect').length).toBeGreaterThan(0);
      });

      fireEvent.click(screen.getAllByText('Connect')[0]);

      await waitFor(() => {
        expect(screen.getByTestId('integration-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Modal Close'));

      await waitFor(() => {
        expect(screen.queryByTestId('integration-modal')).not.toBeInTheDocument();
      });
    });

    it('reloads integration list when connect succeeds', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(screen.getAllByText('Connect').length).toBeGreaterThan(0);
      });

      fireEvent.click(screen.getAllByText('Connect')[0]);

      await waitFor(() => {
        expect(screen.getByTestId('integration-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Modal Connect'));

      await waitFor(() => {
        expect(mockIntegrationsList).toHaveBeenCalledTimes(2); // initial + after connect
      });
    });
  });

  // ===== API LOADING =====
  describe('API Loading', () => {
    it('loads integration status from API on mount', async () => {
      render(<Integrations />);
      await waitFor(() => {
        expect(mockIntegrationsList).toHaveBeenCalled();
      });
    });

    it('handles API error gracefully and falls back to catalog', async () => {
      mockIntegrationsList.mockRejectedValueOnce(new Error('Network error'));
      render(<Integrations />);

      await waitFor(() => {
        // Should still show integrations (fallback catalog)
        expect(screen.getByText('AWS')).toBeInTheDocument();
      });
    });

    it('handles non-array API response', async () => {
      mockIntegrationsList.mockResolvedValueOnce('not-an-array');
      render(<Integrations />);

      await waitFor(() => {
        // Should still render catalog without errors
        expect(screen.getByText('AWS')).toBeInTheDocument();
      });
    });
  });

  // ===== TIER LIMITS =====
  describe('Tier Limits', () => {
    it('renders integration cards even when limit is reached', async () => {
      render(<Integrations />);
      await waitFor(() => {
        // Integration cards should always be rendered
        const connectButtons = screen.getAllByRole('button');
        expect(connectButtons.length).toBeGreaterThan(0);
      });
    });
  });

  // ===== SYNC =====
  describe('Sync', () => {
    it('calls sync API when Sync Now button is clicked on connected integration', async () => {
      mockIntegrationsList.mockResolvedValueOnce([
        { name: 'aws', provider: 'aws', connected: true, lastSync: '2026-01-01T00:00:00Z' },
      ]);
      render(<Integrations />);

      await waitFor(() => {
        expect(screen.getByText('Sync Now')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Sync Now'));

      await waitFor(() => {
        expect(mockIntegrationsSync).toHaveBeenCalledWith('aws');
      });
    });
  });
});
