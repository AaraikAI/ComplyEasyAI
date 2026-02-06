import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { OnboardingTierBadge } from '../OnboardingTierBadge';


describe('OnboardingTierBadge', () => {
  it('should render Foundation tier', () => { render(<OnboardingTierBadge tier="Foundation" />); expect(screen.getByText('Foundation')).toBeTruthy(); });
  it('should render Essentials tier', () => { render(<OnboardingTierBadge tier="Essentials" />); expect(screen.getByText('Essentials')).toBeTruthy(); });
  it('should render Growth tier', () => { render(<OnboardingTierBadge tier="Growth" />); expect(screen.getByText('Growth')).toBeTruthy(); });
  it('should render Visionary tier', () => { render(<OnboardingTierBadge tier="Visionary" />); expect(screen.getByText('Visionary')).toBeTruthy(); });
  it('should support small variant', () => { const { container } = render(<OnboardingTierBadge tier="Growth" variant="small" />); expect(container.innerHTML).toBeTruthy(); });
  it('should support large variant', () => { const { container } = render(<OnboardingTierBadge tier="Growth" variant="large" />); expect(container.innerHTML).toBeTruthy(); });
});
