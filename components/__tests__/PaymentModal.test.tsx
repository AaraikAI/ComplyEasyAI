import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentModal } from '../PaymentModal';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock window.location
const mockLocationAssign = vi.fn();
Object.defineProperty(window, 'location', {
  value: { href: '', assign: mockLocationAssign },
  writable: true
});

// Mock the API service
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
    window.location.href = '';
  });

  it('renders correctly', () => {
    render(
      <PaymentModal plan="Pro" price="$99" onClose={mockClose} onSuccess={mockSuccess} />
    );
    expect(screen.getByText('Secure Checkout')).toBeInTheDocument();
    expect(screen.getByText('$99/mo')).toBeInTheDocument();
  });

  it('displays plan and price information', () => {
    render(
      <PaymentModal plan="Enterprise" price="$299" onClose={mockClose} onSuccess={mockSuccess} />
    );
    expect(screen.getByText('$299/mo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue to Secure Checkout/i })).toBeInTheDocument();
  });

  it('redirects to Stripe checkout on submit', async () => {
    render(
      <PaymentModal plan="Pro" price="$99" onClose={mockClose} onSuccess={mockSuccess} />
    );
    
    const submitButton = screen.getByText(/Continue to Secure Checkout/i);
    fireEvent.click(submitButton);

    // Wait for redirect
    await waitFor(() => {
      expect(window.location.href).toBe('https://checkout.stripe.com/test');
    }, { timeout: 3000 });
    
    // Verify the checkout was called
    const { api } = await import('../../services/api');
    expect(api.billing.createCheckout).toHaveBeenCalledWith('Pro', 'annual');
  });
});