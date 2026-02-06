import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingModal } from '../OnboardingModal';

vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => { if (name === '__esModule') return true; return (props: any) => <span data-testid={`icon-${String(name)}`} {...props} />; } }));

describe('OnboardingModal', () => {
  const defaultProps = { title: 'Test Title', description: 'Test Description' };

  it('should render title and description', () => { render(<OnboardingModal {...defaultProps} />); expect(screen.getByText('Test Title')).toBeTruthy(); expect(screen.getByText('Test Description')).toBeTruthy(); });
  it('should call primaryAction onClick', () => { const action = { label: 'Continue', onClick: vi.fn() }; render(<OnboardingModal {...defaultProps} primaryAction={action} />); fireEvent.click(screen.getByText('Continue')); expect(action.onClick).toHaveBeenCalled(); });
  it('should call onClose', () => { const onClose = vi.fn(); render(<OnboardingModal {...defaultProps} onClose={onClose} showCloseButton={true} />); const closeBtn = document.querySelector('button[aria-label*="close"], button[aria-label*="Close"]') || screen.getByTestId('icon-X'); if (closeBtn) { fireEvent.click(closeBtn); expect(onClose).toHaveBeenCalled(); } });
  it('should render children', () => { render(<OnboardingModal {...defaultProps}><div data-testid="child">Child</div></OnboardingModal>); expect(screen.getByTestId('child')).toBeTruthy(); });
});
