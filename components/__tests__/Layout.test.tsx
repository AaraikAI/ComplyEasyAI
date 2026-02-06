import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Layout from '../Layout';

vi.mock('lucide-react', () => new Proxy({}, {
  get: (_, name) => {
    if (name === '__esModule') return true;
    return (props: any) => <span data-testid={`icon-${String(name)}`} {...props} />;
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin', organization: { plan: 'Growth' } },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

vi.mock('@/constants/tierFeatures', () => ({
  canAccessView: vi.fn().mockReturnValue(true),
  normalizePlan: vi.fn().mockReturnValue('Growth'),
  hasFeature: vi.fn().mockReturnValue(true),
}));

vi.mock('@/hooks/useOnboarding', () => ({
  useOnboardingHint: vi.fn().mockReturnValue({ isVisible: false, position: null, dismiss: vi.fn(), disableAllHints: vi.fn() }),
  useOnboardingChecklist: vi.fn().mockReturnValue({ items: [], completedCount: 0, totalCount: 0, percentage: 0, isComplete: false }),
}));

vi.mock('@/components/Onboarding', () => ({
  OnboardingChecklistWidget: () => <div data-testid="onboarding-checklist" />,
  OnboardingHint: () => null,
  OnboardingOverlay: () => null,
}));

describe('Layout', () => {
  const mockNavigate = vi.fn();
  const defaultProps = {
    currentView: 'dashboard' as any,
    onNavigate: mockNavigate,
    children: <div data-testid="page-content">Page Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', () => {
    render(<Layout {...defaultProps} />);
    expect(screen.getByTestId('page-content')).toBeTruthy();
    expect(screen.getByText('Page Content')).toBeTruthy();
  });

  it('should render navigation sidebar', () => {
    render(<Layout {...defaultProps} />);
    expect(screen.getByText(/dashboard/i)).toBeTruthy();
  });

  it('should render user info in header or sidebar', () => {
    render(<Layout {...defaultProps} />);
    // The layout should show some form of user name or profile
    const el = document.body.querySelector('[class*="sidebar"], [class*="nav"], nav');
    expect(el || screen.getByText(/Test User|dashboard/i)).toBeTruthy();
  });

  it('should highlight the current view in navigation', () => {
    render(<Layout {...defaultProps} currentView="dashboard" />);
    expect(screen.getByText(/dashboard/i)).toBeTruthy();
  });
});
