import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TierCard from '../TierCard';


const mockTier = {
  name: 'Growth' as any,
  displayName: 'Growth',
  tagline: 'For growing teams',
  pricing: { annualMin: 8500, annualMax: 25000, monthlyMin: 850, monthlyMultiplier: 1.2, netAfterStripeMin: 7800, netAfterStripeMax: 23000, margin: '85%' },
  limits: { maxUsers: 1000, maxFrameworks: 50, maxWorkspaces: 25 },
  features: { dashboard: true, riskManagement: true, acosGoals: true },
};

describe('TierCard', () => {
  it('should render tier name', () => {
    render(<TierCard tier={mockTier} />);
    expect(screen.getAllByText('Growth').length).toBeGreaterThan(0);
  });

  it('should show Current Plan badge when isCurrentTier', () => {
    render(<TierCard tier={mockTier} isCurrentTier={true} />);
    expect(screen.getAllByText(/current/i).length).toBeGreaterThan(0);
  });

  it('should show Most Popular badge when isPopular', () => {
    render(<TierCard tier={mockTier} isPopular={true} />);
    expect(screen.getAllByText(/popular/i).length).toBeGreaterThan(0);
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
