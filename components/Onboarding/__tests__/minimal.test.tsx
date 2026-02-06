import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// This local vi.mock with Proxy should override the global one - will it hang?

import { OnboardingCelebration } from '../OnboardingCelebration';

describe('Minimal', () => {
  it('should pass', () => {
    render(<OnboardingCelebration message="Test" onDismiss={() => {}} />);
    expect(screen.getByText(/Test/)).toBeTruthy();
  });
});
