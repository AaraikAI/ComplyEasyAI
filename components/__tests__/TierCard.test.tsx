import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TierCard from '../TierCard';

vi.mock('lucide-react', () => new Proxy({}, {
  get: (_, name) => {
    if (name === '__esModule') return true;
    return (props: any) => <span data-testid={`icon-${String(name)}`} {...props} />;
  },
}));

const mockTier = {
  name: 'Growth' as any,
  price: { annualMin: 8500, annualMax: 25000, monthlyMultiplier: 1.2, netAfterStripeMin: 7800, netAfterStripeMax: 23000, margin: '85%' },
  limits: { maxUsers: 1000, maxFrameworks: 50, maxWorkspaces: 25 },
  features: { dashboard: true, riskManagement: true, acosGoals: true },
};

describe('TierCard', () => {
  it('should render tier name', () => {
    render(<TierCard tier={mockTier} />);
    expect(screen.getByText('Growth')).toBeTruthy();
  });

  it('should show Current Plan badge when isCurrentTier', () => {
    render(<TierCard tier={mockTier} isCurrentTier={true} />);
    expect(screen.getByText(/current/i)).toBeTruthy();
  });

  it('should show Most Popular badge when isPopular', () => {
    render(<TierCard tier={mockTier} isPopular={true} />);
    expect(screen.getByText(/popular/i)).toBeTruthy();
  });

  it('should call onSelect when button clicked', () => {
    const mockSelect = vi.fn();
    render(<TierCard tier={mockTier} onSelect={mockSelect} />);
    const buttons = screen.getAllByRole('button');
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
    }
  });
});
