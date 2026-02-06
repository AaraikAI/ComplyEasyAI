import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingHint } from '../OnboardingHint';

vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => { if (name === '__esModule') return true; return (props: any) => <span data-testid={`icon-${String(name)}`} {...props} />; } }));

describe('OnboardingHint', () => {
  const defaultProps = { message: 'Try clicking here!', position: { top: 100, left: 200 }, isVisible: true, onDismiss: vi.fn(), onDisableAll: vi.fn() };

  it('should render message when visible', () => { render(<OnboardingHint {...defaultProps} />); expect(screen.getByText('Try clicking here!')).toBeTruthy(); });
  it('should not render when not visible', () => { render(<OnboardingHint {...defaultProps} isVisible={false} />); expect(screen.queryByText('Try clicking here!')).toBeNull(); });
  it('should call onDismiss when dismissed', () => { render(<OnboardingHint {...defaultProps} />); const dismissBtn = screen.getByTestId('icon-X') || document.querySelector('button'); if (dismissBtn) { fireEvent.click(dismissBtn); expect(defaultProps.onDismiss).toHaveBeenCalled(); } });
  it('should handle null position', () => { render(<OnboardingHint {...defaultProps} position={null} />); });
});
