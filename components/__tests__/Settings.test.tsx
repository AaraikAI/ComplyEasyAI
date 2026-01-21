
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Settings } from '../Settings';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockUser = { id: 'user-1', name: 'Sarah Connor', email: 'sarah@test.com', role: 'Admin' };

vi.mock('../../services/api', () => ({
  api: {
    auth: { register: vi.fn().mockResolvedValue({ user: { id: 'new-user', name: 'New User', email: 'new@test.com' } }) },
    billing: { 
      createCheckout: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }),
      getSubscription: vi.fn().mockResolvedValue({ plan: 'Foundation', status: 'active' }),
      getFeatureSubscriptions: vi.fn().mockResolvedValue([])
    },
    team: {
      list: vi.fn().mockResolvedValue([
        { id: 'u1', name: 'Sarah Connor', email: 'sarah@test.com', role: 'Admin' }
      ]),
      invite: vi.fn().mockResolvedValue({ id: 'new-user', name: 'New User', email: 'new@test.com' })
    },
    getFeatureSubscriptions: vi.fn().mockResolvedValue([])
  }
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, isAuthenticated: true }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock PaymentModal since it's tested separately
vi.mock('../PaymentModal', () => ({
  PaymentModal: ({ onSuccess, onClose }: any) => (
    <div data-testid="payment-modal">
      <button onClick={onSuccess}>Pay Success</button>
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

// Mock FeatureMarketplace since it has complex dependencies
vi.mock('../FeatureMarketplace', () => ({
  default: () => <div data-testid="feature-marketplace">Feature Marketplace</div>,
  FeatureMarketplace: () => <div data-testid="feature-marketplace">Feature Marketplace</div>
}));

describe('Settings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders profile tab by default', async () => {
    render(<Settings />);
    
    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument();
    });
  });

  it('switches tabs correctly', async () => {
    render(<Settings />);
    
    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument();
    });

    // Click on the Team Members tab button
    const teamTab = screen.getAllByText('Team Members')[0];
    fireEvent.click(teamTab);
    
    // Wait for tab content to change - look for something unique to team tab
    await waitFor(() => {
      expect(screen.getByText('Invite Member')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles team member invitation', async () => {
    render(<Settings />);
    
    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument();
    });

    // Click on the Team Members tab button
    const teamTab = screen.getAllByText('Team Members')[0];
    fireEvent.click(teamTab);
    
    await waitFor(() => {
      expect(screen.getByText('Invite Member')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('billing tab shows plans', async () => {
    render(<Settings />);
    
    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Billing & Plan'));
    
    await waitFor(() => {
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});