
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Settings } from '../Settings';
import { AuthProvider } from '../../contexts/AuthContext';
import { api } from '../../services/api';



import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../../services/api', () => ({
  api: {
    auth: { register: vi.fn() },
    billing: { createCheckout: vi.fn() }
  }
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

describe('Settings Component', () => {
  it('renders profile tab by default', () => {
    render(
      <AuthProvider>
        <Settings />
      </AuthProvider>
    );
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sarah Connor')).toBeInTheDocument();
  });

  it('switches tabs correctly', () => {
    render(
      <AuthProvider>
        <Settings />
      </AuthProvider>
    );
    fireEvent.click(screen.getByText('Team Members'));
    expect(screen.getByText('Invite Member')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Billing & Plan'));
    expect(screen.getByText('Available Plans')).toBeInTheDocument();
  });

  it('handles team member invitation', async () => {
    render(
      <AuthProvider>
        <Settings />
      </AuthProvider>
    );
    fireEvent.click(screen.getByText('Team Members'));
    fireEvent.click(screen.getByText('Invite Member'));

    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByPlaceholderText('john@company.com'), { target: { value: 'new@test.com' } });
    fireEvent.click(screen.getByText('Send Invitation'));

    await waitFor(() => {
      expect(api.auth.register).toHaveBeenCalled();
      expect(screen.getByText('New User')).toBeInTheDocument();
    });
  });

  it('billing upgrade flow', async () => {
    render(
      <AuthProvider>
        <Settings />
      </AuthProvider>
    );
    fireEvent.click(screen.getByText('Billing & Plan'));
    
    // Upgrade to Enterprise
    const upgradeBtns = screen.getAllByText('Upgrade');
    fireEvent.click(upgradeBtns[upgradeBtns.length - 1]); // Last one is Enterprise

    expect(screen.getByTestId('payment-modal')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Pay Success'));
    
    await waitFor(() => {
      expect(api.billing.createCheckout).toHaveBeenCalledWith('Enterprise');
    });
  });
});