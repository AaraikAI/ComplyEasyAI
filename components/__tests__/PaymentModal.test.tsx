import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentModal } from '../PaymentModal';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the API service - define mock inline to avoid hoisting issues
vi.mock('../../services/api', () => ({
  api: {
    billing: {
      createCheckout: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' })
    }
  }
}));

describe('PaymentModal Component', () => {
  const mockClose = vi.fn();
  const mockSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<PaymentModal plan="Pro" price="Contact Us" onClose={mockClose} onSuccess={mockSuccess} />);
    expect(screen.getByText('Secure Checkout')).toBeInTheDocument();
    expect(screen.getByText(/Pay \Contact Us/i)).toBeInTheDocument();
  });

  it('formats card input', () => {
    render(<PaymentModal plan="Pro" price="Contact Us" onClose={mockClose} onSuccess={mockSuccess} />);
    const input = screen.getByPlaceholderText('0000 0000 0000 0000');
    fireEvent.change(input, { target: { value: '1234567812345678' } });
    expect(input).toHaveValue('1234 5678 1234 5678');
  });

  it('submits payment successfully', async () => {
    render(<PaymentModal plan="Pro" price="Contact Us" onClose={mockClose} onSuccess={mockSuccess} />);
    
    // Fill form
    const cardInput = screen.getByPlaceholderText('0000 0000 0000 0000');
    const expiryInput = screen.getByPlaceholderText('MM / YY');
    const cvcInput = screen.getByPlaceholderText('123');
    
    fireEvent.change(cardInput, { target: { value: '4242424242424242' } });
    fireEvent.change(expiryInput, { target: { value: '12/30' } });
    fireEvent.change(cvcInput, { target: { value: '123' } });

    const submitButton = screen.getByText(/Pay \Contact Us/i);
    fireEvent.click(submitButton);

    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Payment Successful')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Wait for callbacks after timeout
    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    }, { timeout: 3000 });
    
    // Verify the checkout was called (accessing the mock through the module)
    const { api } = await import('../../services/api');
    expect(api.billing.createCheckout).toHaveBeenCalledWith('Pro');
  });
});