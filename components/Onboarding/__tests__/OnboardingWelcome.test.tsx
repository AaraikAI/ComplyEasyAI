import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingWelcome } from '../OnboardingWelcome';

vi.mock('@/components/Onboarding/OnboardingTierBadge', () => ({ OnboardingTierBadge: ({ tier }: any) => <span>{tier}</span> }));

describe('OnboardingWelcome', () => {
  const defaultProps = { userName: 'John', organizationName: 'Acme Corp', tier: 'Growth' as any, onStart: vi.fn(), onSkip: vi.fn(), showHints: true, onToggleHints: vi.fn() };

  it('should render welcome message with user name', () => { render(<OnboardingWelcome {...defaultProps} />); expect(screen.getByText(/John|Welcome/i)).toBeTruthy(); });
  it('should show organization name', () => { render(<OnboardingWelcome {...defaultProps} />); expect(screen.getByText(/Acme Corp/)).toBeTruthy(); });
  it('should call onStart when start button clicked', () => { render(<OnboardingWelcome {...defaultProps} />); const startBtn = screen.getByText(/start|begin|get started/i); fireEvent.click(startBtn); expect(defaultProps.onStart).toHaveBeenCalled(); });
  it('should call onSkip when skip clicked', () => { render(<OnboardingWelcome {...defaultProps} />); const skipBtn = screen.getByText(/skip/i); fireEvent.click(skipBtn); expect(defaultProps.onSkip).toHaveBeenCalled(); });
  it('should show tier badge', () => { render(<OnboardingWelcome {...defaultProps} />); expect(screen.getByText('Growth')).toBeTruthy(); });
});
