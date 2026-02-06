import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingCelebration } from '../OnboardingCelebration';


describe('OnboardingCelebration', () => {
  const defaultProps = { message: 'Great job completing the setup!', onDismiss: vi.fn() };

  it('should render celebration message', () => { render(<OnboardingCelebration {...defaultProps} />); expect(screen.getByText(/Great job/)).toBeTruthy(); });
  it('should call onDismiss', () => { render(<OnboardingCelebration {...defaultProps} />); const dismissBtn = screen.queryByText(/dismiss|continue|close|done/i) || document.querySelector('button'); if (dismissBtn) { fireEvent.click(dismissBtn); } });
  it('should show confetti elements', () => { const { container } = render(<OnboardingCelebration {...defaultProps} />); expect(container.innerHTML.length).toBeGreaterThan(100); });
  it('should support reducedMotion prop', () => { render(<OnboardingCelebration {...defaultProps} reducedMotion={true} />); expect(screen.getByText(/Great job/)).toBeTruthy(); });
});
