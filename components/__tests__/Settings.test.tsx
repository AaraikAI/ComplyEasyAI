
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Settings } from '../Settings';
import { api } from '../../services/api';

declare const describe: any;
declare const test: any;
declare const expect: any;
declare const jest: any;

jest.mock('../../services/api', () => ({
  api: {
    auth: { register: jest.fn() },
    billing: { upgrade: jest.fn() }
  }
}));

// Mock PaymentModal since it's tested separately
jest.mock('../PaymentModal', () => ({
  PaymentModal: ({ onSuccess, onClose }: any) => (
    <div data-testid="payment-modal">
      <button onClick={onSuccess}>Pay Success</button>
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

describe('Settings Component', () => {
  test('renders profile tab by default', () => {
    render(<Settings />);
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sarah Connor')).toBeInTheDocument();
  });

  test('switches tabs correctly', () => {
    render(<Settings />);
    fireEvent.click(screen.getByText('Team Members'));
    expect(screen.getByText('Invite Member')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Billing & Plan'));
    expect(screen.getByText('Available Plans')).toBeInTheDocument();
  });

  test('handles team member invitation', async () => {
    render(<Settings />);
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

  test('billing upgrade flow', async () => {
    render(<Settings />);
    fireEvent.click(screen.getByText('Billing & Plan'));
    
    // Upgrade to Enterprise
    const upgradeBtns = screen.getAllByText('Upgrade');
    fireEvent.click(upgradeBtns[upgradeBtns.length - 1]); // Last one is Enterprise

    expect(screen.getByTestId('payment-modal')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Pay Success'));
    
    await waitFor(() => {
      expect(api.billing.upgrade).toHaveBeenCalledWith('Enterprise');
    });
  });
});