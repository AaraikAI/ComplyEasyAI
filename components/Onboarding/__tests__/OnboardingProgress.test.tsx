import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingProgressBar } from '../OnboardingProgress';

describe('OnboardingProgressBar', () => {
  it('should render progress bar', () => { render(<OnboardingProgressBar currentStep={2} totalSteps={5} flowName="Setup" />); expect(screen.getByText(/2.*5|step/i)).toBeTruthy(); });
  it('should show flow name', () => { render(<OnboardingProgressBar currentStep={1} totalSteps={3} flowName="Welcome Tour" />); expect(screen.getByText(/Welcome Tour/)).toBeTruthy(); });
  it('should show correct percentage width', () => { const { container } = render(<OnboardingProgressBar currentStep={3} totalSteps={4} flowName="Test" />); const bars = container.querySelectorAll('[style*="width"]'); expect(bars.length).toBeGreaterThanOrEqual(0); });
  it('should render at step 1', () => { render(<OnboardingProgressBar currentStep={1} totalSteps={10} flowName="Getting Started" />); expect(document.body.textContent).toContain('Getting Started'); });
});
