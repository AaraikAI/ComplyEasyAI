import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TierLimitBanner } from '../TierLimitBanner';

vi.mock('@/constants/tierLimits', () => ({
  UPGRADE_LINK: '/settings?tab=billing',
}));

describe('TierLimitBanner', () => {
  it('should render message when provided', () => {
    render(<TierLimitBanner message="You have reached your limit" />);
    expect(screen.getByText(/You have reached your limit/)).toBeTruthy();
  });

  it('should render upgrade link', () => {
    render(<TierLimitBanner message="Limit reached" />);
    expect(screen.getByText('Upgrade')).toBeTruthy();
  });

  it('should return null for empty message', () => {
    const { container } = render(<TierLimitBanner message="" />);
    expect(container.innerHTML).toBe('');
  });

  it('should have correct link href', () => {
    render(<TierLimitBanner message="Test" />);
    const link = screen.getByText('Upgrade');
    expect(link.getAttribute('href')).toBe('/settings?tab=billing');
  });
});
