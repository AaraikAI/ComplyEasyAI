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
    },
    getAvailableBundles: vi.fn().mockResolvedValue({ bundles: [] })
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
    expect(screen.getByText('$99/per month')).toBeInTheDocument();
  });

  it('displays plan and price information', () => {
    render(
      <PaymentModal plan="Enterprise" price="$299" onClose={mockClose} onSuccess={mockSuccess} />
    );
    expect(screen.getByText('$299/per month')).toBeInTheDocument();
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

    // The modal defaults to the annual cycle when no billingCycle prop is supplied.
    const { api } = await import('../../services/api');
    expect(api.billing.createCheckout).toHaveBeenCalledWith('Pro', 'annual', []);
  });

  it('forwards the selected billing cycle to createCheckout', async () => {
    // Drive the cycle through the prop so the assertion verifies real wiring
    // rather than coupling to whichever default the modal currently uses.
    const { api } = await import('../../services/api');
    for (const cycle of ['monthly', 'annual'] as const) {
      (api.billing.createCheckout as ReturnType<typeof vi.fn>).mockClear();
      const { unmount } = render(
        <PaymentModal plan="Enterprise" price="$299" billingCycle={cycle} onClose={mockClose} onSuccess={mockSuccess} />
      );
      fireEvent.click(screen.getByText(/Continue to Secure Checkout/i));
      await waitFor(() => {
        expect(api.billing.createCheckout).toHaveBeenCalledWith('Enterprise', cycle, []);
      });
      unmount();
    }
  });

  it('renders available bundles and forwards the selected bundle ids to createCheckout', async () => {
    const { api } = await import('../../services/api');
    (api.getAvailableBundles as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      bundles: [
        { id: 'bundle-a', name: 'Security Bundle', description: 'Extra security controls', basePriceAnnual: 1200 },
        { id: 'bundle-b', name: 'Privacy Bundle', description: 'Privacy add-ons', basePriceAnnual: 800 },
      ],
    });

    render(
      <PaymentModal plan="Pro" price="$99" onClose={mockClose} onSuccess={mockSuccess} />
    );

    // Bundles render as checkboxes once loaded.
    const securityCheckbox = await screen.findByLabelText('Security Bundle');
    expect(screen.getByText('Add-on bundles')).toBeInTheDocument();
    expect(screen.getByLabelText('Privacy Bundle')).toBeInTheDocument();

    // Select one bundle.
    fireEvent.click(securityCheckbox);

    fireEvent.click(screen.getByText(/Continue to Secure Checkout/i));

    await waitFor(() => {
      expect(api.billing.createCheckout).toHaveBeenCalledWith('Pro', 'annual', ['bundle-a']);
    });
  });
});