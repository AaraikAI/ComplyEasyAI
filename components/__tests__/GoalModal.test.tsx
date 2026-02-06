import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalModal } from '../GoalModal';

vi.mock('lucide-react', () => new Proxy({}, {
  get: (_, name) => {
    if (name === '__esModule') return true;
    return (props: any) => <span data-testid={`icon-${String(name)}`} {...props} />;
  },
}));

vi.mock('@/services/api', () => ({
  api: {
    acos: {
      createGoal: vi.fn().mockResolvedValue({ id: '1' }),
      updateGoal: vi.fn().mockResolvedValue({}),
    },
    frameworks: { getAll: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock('@/constants', () => ({
  AVAILABLE_FRAMEWORKS: [{ id: '1', name: 'SOC 2' }, { id: '2', name: 'GDPR' }],
}));

describe('GoalModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    expect(screen.getByText(/goal/i)).toBeTruthy();
  });

  it('should not render when closed', () => {
    const { container } = render(<GoalModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('should show form fields', () => {
    render(<GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    // Should have form inputs for goal creation
    const inputs = document.querySelectorAll('input, select, textarea');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should call onClose when close button clicked', () => {
    render(<GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    const closeBtn = screen.getByTestId('icon-X') || document.querySelector('button[aria-label*="close"]');
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });
});
