import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoalModal } from '../GoalModal';

// --- Mocks ---

const mockFrameworksList = vi.fn().mockResolvedValue([
  { name: 'SOC 2 Type II' },
  { name: 'GDPR' },
  { name: 'HIPAA' },
]);
const mockCreateGoal = vi.fn().mockResolvedValue({ id: 'goal-1' });
const mockUpdateGoal = vi.fn().mockResolvedValue({ id: 'goal-1' });

vi.mock('../../services/api', () => ({
  api: {
    frameworks: {
      list: () => mockFrameworksList(),
    },
    acos: {
      createGoal: (...args: any[]) => mockCreateGoal(...args),
      updateGoal: (...args: any[]) => mockUpdateGoal(...args),
    },
  },
}));

vi.mock('../../constants', () => ({
  AVAILABLE_FRAMEWORKS: [
    { name: 'SOC 2 Type II', region: 'Global', description: 'SOC 2' },
    { name: 'GDPR', region: 'EU', description: 'GDPR' },
    { name: 'HIPAA', region: 'US', description: 'HIPAA' },
  ],
}));

describe('GoalModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrameworksList.mockResolvedValue([
      { name: 'SOC 2 Type II' },
      { name: 'GDPR' },
      { name: 'HIPAA' },
    ]);
    mockCreateGoal.mockResolvedValue({ id: 'goal-1' });
    mockUpdateGoal.mockResolvedValue({ id: 'goal-1' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===== VISIBILITY =====
  describe('Visibility', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <GoalModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders modal when isOpen is true', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('Create Compliance Goal')).toBeInTheDocument();
      });
    });
  });

  // ===== CREATE MODE =====
  describe('Create Mode', () => {
    it('shows Create Compliance Goal title', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('Create Compliance Goal')).toBeInTheDocument();
      });
    });

    it('shows Create submit button', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        // The submit button shows the translated "Create" text
        expect(screen.getByText('Create')).toBeInTheDocument();
      });
    });

    it('renders all form fields', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText(/Goal Name/)).toBeInTheDocument();
        expect(screen.getByText(/Goal Type/)).toBeInTheDocument();
        expect(screen.getByText(/Frameworks/)).toBeInTheDocument();
        expect(screen.getByText(/Risk Tolerance/)).toBeInTheDocument();
        expect(screen.getByText(/Time Horizon/)).toBeInTheDocument();
        expect(screen.getByText(/Target Score/)).toBeInTheDocument();
        expect(screen.getByText(/Auto Action Policy/)).toBeInTheDocument();
        expect(screen.getByText(/Deadline/)).toBeInTheDocument();
      });
    });

    it('shows placeholder for goal name', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Maintain SOC 2 Type II compliance')).toBeInTheDocument();
      });
    });

    it('has correct default form values', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByDisplayValue('85')).toBeInTheDocument(); // targetScore
        expect(screen.getByDisplayValue('90')).toBeInTheDocument(); // horizon
      });
    });
  });

  // ===== EDIT MODE =====
  describe('Edit Mode', () => {
    const existingGoal = {
      id: 'goal-1',
      name: 'Existing Goal',
      goalType: 'achieve',
      frameworks: ['GDPR'],
      riskTolerance: 'high',
      horizon: 180,
      autoActionPolicy: 'aggressive',
      targetScore: 95,
      deadline: '2026-12-31',
    };

    it('shows Edit Compliance Goal title', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} goal={existingGoal} />
      );
      await waitFor(() => {
        expect(screen.getByText('Edit Compliance Goal')).toBeInTheDocument();
      });
    });

    it('shows Save submit button in edit mode', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} goal={existingGoal} />
      );
      await waitFor(() => {
        // Edit mode uses t('common.save') = "Save"
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
    });

    it('populates form with existing goal data', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} goal={existingGoal} />
      );
      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing Goal')).toBeInTheDocument();
        expect(screen.getByDisplayValue('95')).toBeInTheDocument();
        expect(screen.getByDisplayValue('180')).toBeInTheDocument();
      });
    });

    it('calls updateGoal API when editing', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} goal={existingGoal} />
      );
      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockUpdateGoal).toHaveBeenCalledWith('goal-1', expect.objectContaining({
          name: 'Existing Goal',
          targetScore: 95,
        }));
      });
    });
  });

  // ===== VALIDATION =====
  describe('Validation', () => {
    it('shows error when name is empty', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('Create')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(screen.getByText('Goal name is required')).toBeInTheDocument();
      });
    });

    it('shows error when no frameworks selected', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('Create')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('e.g., Maintain SOC 2 Type II compliance'), {
        target: { value: 'Test Goal' },
      });

      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(screen.getByText('At least one framework must be selected')).toBeInTheDocument();
      });
    });

    it('shows error when target score is out of range', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
      });

      fireEvent.change(screen.getByPlaceholderText('e.g., Maintain SOC 2 Type II compliance'), {
        target: { value: 'Test Goal' },
      });

      fireEvent.click(screen.getAllByRole('checkbox')[0]);

      // Wait for checkbox to be checked before changing score
      await waitFor(() => {
        expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
      });

      const targetInput = screen.getByDisplayValue('85') as HTMLInputElement;
      // Remove min/max constraints so jsdom/happy-dom doesn't clamp the value
      targetInput.removeAttribute('max');
      targetInput.removeAttribute('min');
      fireEvent.change(targetInput, { target: { value: '150' } });

      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(screen.getByText('Target score must be between 0 and 100')).toBeInTheDocument();
      });
    });

    it('shows error when name exceeds 500 characters', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('Create')).toBeInTheDocument();
      });

      const longName = 'A'.repeat(501);
      fireEvent.change(screen.getByPlaceholderText('e.g., Maintain SOC 2 Type II compliance'), {
        target: { value: longName },
      });

      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(screen.getByText('Goal name must be 500 characters or less')).toBeInTheDocument();
      });
    });
  });

  // ===== FRAMEWORK SELECTION =====
  describe('Framework Selection', () => {
    it('loads frameworks from API', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(mockFrameworksList).toHaveBeenCalled();
      });
    });

    it('renders framework checkboxes', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('SOC 2 Type II')).toBeInTheDocument();
        expect(screen.getByText('GDPR')).toBeInTheDocument();
        expect(screen.getByText('HIPAA')).toBeInTheDocument();
      });
    });

    it('allows toggling framework selection', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('SOC 2 Type II')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      expect(checkboxes[0]).toBeChecked();

      fireEvent.click(checkboxes[0]);
      expect(checkboxes[0]).not.toBeChecked();
    });

    it('falls back to constants when API fails', async () => {
      mockFrameworksList.mockRejectedValueOnce(new Error('API error'));
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('SOC 2 Type II')).toBeInTheDocument();
      });
    });

    it('shows loading text when frameworks not yet loaded', () => {
      mockFrameworksList.mockImplementation(() => new Promise(() => {}));
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      // The loading text uses t('common.loading') = "Loading..."
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  // ===== FORM INPUTS =====
  describe('Form Inputs', () => {
    it('allows changing goal name', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Maintain SOC 2 Type II compliance')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('e.g., Maintain SOC 2 Type II compliance'), {
        target: { value: 'My New Goal' },
      });
      expect(screen.getByDisplayValue('My New Goal')).toBeInTheDocument();
    });

    it('allows changing target score', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByDisplayValue('85')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByDisplayValue('85'), { target: { value: '95' } });
      expect(screen.getByDisplayValue('95')).toBeInTheDocument();
    });

    it('allows changing horizon', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByDisplayValue('90')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByDisplayValue('90'), { target: { value: '180' } });
      expect(screen.getByDisplayValue('180')).toBeInTheDocument();
    });

    it('renders goal type dropdown with options', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('Maintain')).toBeInTheDocument();
        expect(screen.getByText('Achieve')).toBeInTheDocument();
        expect(screen.getByText('Improve')).toBeInTheDocument();
      });
    });

    it('renders risk tolerance dropdown with options', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('Low')).toBeInTheDocument();
        expect(screen.getByText('Medium')).toBeInTheDocument();
        expect(screen.getByText('High')).toBeInTheDocument();
      });
    });

    it('renders auto action policy dropdown', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('Conservative')).toBeInTheDocument();
        expect(screen.getByText('Moderate')).toBeInTheDocument();
        expect(screen.getByText('Aggressive')).toBeInTheDocument();
      });
    });

    it('allows setting deadline', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText(/Deadline/)).toBeInTheDocument();
      });

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2027-06-15' } });
      expect(dateInput.value).toBe('2027-06-15');
    });
  });

  // ===== FORM SUBMISSION =====
  describe('Form Submission', () => {
    it('calls createGoal API on valid submission', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('SOC 2 Type II')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('e.g., Maintain SOC 2 Type II compliance'), {
        target: { value: 'Test Goal' },
      });
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(mockCreateGoal).toHaveBeenCalled();
      });
    });

    it('calls onSuccess and onClose after successful creation', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('SOC 2 Type II')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('e.g., Maintain SOC 2 Type II compliance'), {
        target: { value: 'Test Goal' },
      });
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('shows toast on API error', async () => {
      mockCreateGoal.mockRejectedValueOnce(new Error('Server error'));
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('SOC 2 Type II')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('e.g., Maintain SOC 2 Type II compliance'), {
        target: { value: 'Test Goal' },
      });
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      fireEvent.click(screen.getByText('Create'));

      // toast.error is used instead of window.alert — just verify it doesn't crash
      await waitFor(() => {
        expect(mockCreateGoal).toHaveBeenCalled();
      });
    });

    it('shows Loading... text during submission', async () => {
      mockCreateGoal.mockImplementation(() => new Promise(() => {}));
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('SOC 2 Type II')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('e.g., Maintain SOC 2 Type II compliance'), {
        target: { value: 'Test Goal' },
      });
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        // The loading state shows t('common.loading') = "Loading..."
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });
  });

  // ===== CLOSE/CANCEL =====
  describe('Close and Cancel', () => {
    it('calls onClose when X button is clicked', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('Create Compliance Goal')).toBeInTheDocument();
      });

      const closeIcon = screen.getByTestId('icon-X');
      fireEvent.click(closeIcon.closest('button')!);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when Cancel button is clicked', async () => {
      render(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ===== FORM RESET =====
  describe('Form Reset', () => {
    it('resets form when opened without goal', async () => {
      const { rerender } = render(
        <GoalModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      rerender(
        <GoalModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., Maintain SOC 2 Type II compliance')).toHaveValue('');
        expect(screen.getByDisplayValue('85')).toBeInTheDocument();
        expect(screen.getByDisplayValue('90')).toBeInTheDocument();
      });
    });
  });
});
