import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// --- Mocks ---

const mockRegister = vi.fn();
const mockAuthRegister = vi.fn().mockResolvedValue({});
const mockRequestMagicLink = vi.fn().mockResolvedValue({});

vi.mock('../../services/api', () => ({
  api: {
    auth: {
      register: (...args: any[]) => mockAuthRegister(...args),
      requestMagicLink: (...args: any[]) => mockRequestMagicLink(...args),
    },
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister, user: null, isAuthenticated: false }),
}));

import { SignupPage } from '../SignupPage';

const VALID_PASSWORD = 'SecureP@ss1234';

const fillStep1 = () => {
  fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'test@company.com' } });
  fireEvent.change(screen.getByPlaceholderText('Create a strong password'), { target: { value: VALID_PASSWORD } });
  fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { target: { value: VALID_PASSWORD } });
};

const submitCurrentForm = () => {
  // Use fireEvent.submit on the form to bypass HTML5 required attribute validation in jsdom
  const forms = document.querySelectorAll('form');
  const form = forms[forms.length - 1]; // get the currently visible form
  fireEvent.submit(form);
};

const submitForm = () => {
  submitCurrentForm();
};

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===== STEP 1: Account Credentials =====
  describe('Step 1: Account Credentials', () => {
    it('renders step 1 by default', () => {
      render(<SignupPage />);
      expect(screen.getByText('Start free')).toBeInTheDocument();
      expect(screen.getByText(/Enter your work email/)).toBeInTheDocument();
    });

    it('renders email input', () => {
      render(<SignupPage />);
      expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    });

    it('renders password input', () => {
      render(<SignupPage />);
      expect(screen.getByPlaceholderText('Create a strong password')).toBeInTheDocument();
    });

    it('renders confirm password input', () => {
      render(<SignupPage />);
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
    });

    it('renders password requirements', () => {
      render(<SignupPage />);
      expect(screen.getByText('12+ characters')).toBeInTheDocument();
      expect(screen.getByText('Uppercase letter')).toBeInTheDocument();
      expect(screen.getByText('Lowercase letter')).toBeInTheDocument();
      expect(screen.getByText('Number')).toBeInTheDocument();
      expect(screen.getByText('Special character')).toBeInTheDocument();
    });

    it('toggles password visibility', () => {
      render(<SignupPage />);
      const pwInput = screen.getByPlaceholderText('Create a strong password');
      expect(pwInput).toHaveAttribute('type', 'password');

      // Click the eye icon button
      const toggleBtn = pwInput.parentElement?.querySelector('button');
      fireEvent.click(toggleBtn!);
      expect(pwInput).toHaveAttribute('type', 'text');
    });

    it('shows error if email is empty on submit', () => {
      render(<SignupPage />);
      submitForm();
      expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
    });

    it('shows error if password is empty', () => {
      render(<SignupPage />);
      fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'test@test.com' } });
      submitForm();
      expect(screen.getByText('Please enter a password')).toBeInTheDocument();
    });

    it('shows error if password does not meet requirements', () => {
      render(<SignupPage />);
      fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByPlaceholderText('Create a strong password'), { target: { value: 'weak' } });
      fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { target: { value: 'weak' } });
      submitForm();
      expect(screen.getByText('Please meet all password requirements')).toBeInTheDocument();
    });

    it('shows error if passwords do not match', () => {
      render(<SignupPage />);
      fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByPlaceholderText('Create a strong password'), { target: { value: VALID_PASSWORD } });
      fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { target: { value: 'DifferentP@ss1234' } });
      submitForm();
      // Both the inline warning and form error show "Passwords do not match"
      const matches = screen.getAllByText('Passwords do not match');
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('shows inline mismatch warning while typing confirm password', () => {
      render(<SignupPage />);
      fireEvent.change(screen.getByPlaceholderText('Create a strong password'), { target: { value: 'Pass1' } });
      fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { target: { value: 'Diff' } });
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('moves to step 2 on valid submission', () => {
      render(<SignupPage />);
      fillStep1();
      submitForm();
      expect(screen.getByPlaceholderText('John Smith')).toBeInTheDocument();
    });

    it('renders the step indicator with the current step label', () => {
      render(<SignupPage />);
      expect(screen.getByText(/Step 1 of 4/)).toBeInTheDocument();
      expect(screen.getByText(/Account/)).toBeInTheDocument();
    });

    it('renders Sign In link', () => {
      render(<SignupPage />);
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });

    it('renders the ComplyEasyAI wordmark', () => {
      render(<SignupPage />);
      const wordmark = screen.getByText('ComplyEasy', { exact: false });
      expect(wordmark).toBeInTheDocument();
      expect(wordmark).toHaveTextContent('ComplyEasyAI');
    });

    it('renders the legal notice referencing Terms and Privacy Policy', () => {
      render(<SignupPage />);
      expect(screen.getByText(/Terms and Privacy Policy/)).toBeInTheDocument();
    });

    it('allows typing into email field', () => {
      render(<SignupPage />);
      const emailInput = screen.getByPlaceholderText('you@company.com') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      expect(emailInput.value).toBe('user@example.com');
    });

    it('clears error when input changes', () => {
      render(<SignupPage />);
      submitForm(); // triggers error
      expect(screen.getByText('Please enter your email address')).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'a' } });
      expect(screen.queryByText('Please enter your email address')).not.toBeInTheDocument();
    });
  });

  // ===== STEP 2: Personal Info =====
  describe('Step 2: Personal Info', () => {
    const goToStep2 = () => {
      render(<SignupPage />);
      fillStep1();
      submitForm();
    };

    it('renders step 2 fields', () => {
      goToStep2();
      expect(screen.getByText('Full name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('John Smith')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Acme Inc.')).toBeInTheDocument();
    });

    it('shows error if full name is empty', () => {
      goToStep2();
      submitCurrentForm();
      expect(screen.getByText('Please enter your full name')).toBeInTheDocument();
    });

    it('shows error if organization name is empty', () => {
      goToStep2();
      fireEvent.change(screen.getByPlaceholderText('John Smith'), { target: { value: 'John Smith' } });
      submitCurrentForm();
      expect(screen.getByText('Please enter your organization name')).toBeInTheDocument();
    });

    it('goes back to step 1 when Back button is clicked', () => {
      goToStep2();
      fireEvent.click(screen.getByText('Back'));
      expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    });

    it('moves to step 3 on valid submission', () => {
      goToStep2();
      fireEvent.change(screen.getByPlaceholderText('John Smith'), { target: { value: 'John Smith' } });
      fireEvent.change(screen.getByPlaceholderText('Acme Inc.'), { target: { value: 'Acme Inc' } });
      submitForm();
      expect(screen.getByText('Industry')).toBeInTheDocument();
    });
  });

  // ===== STEP 3: Company Details =====
  describe('Step 3: Company Details', () => {
    const goToStep3 = () => {
      render(<SignupPage />);
      fillStep1();
      submitForm();
      fireEvent.change(screen.getByPlaceholderText('John Smith'), { target: { value: 'John Smith' } });
      fireEvent.change(screen.getByPlaceholderText('Acme Inc.'), { target: { value: 'Acme Inc' } });
      submitForm();
    };

    it('renders step 3 with industry selection', () => {
      goToStep3();
      expect(screen.getByText('Industry')).toBeInTheDocument();
      expect(screen.getByText('Company size')).toBeInTheDocument();
    });

    it('renders all industry options', () => {
      goToStep3();
      expect(screen.getByText('FinTech')).toBeInTheDocument();
      expect(screen.getByText('HealthTech')).toBeInTheDocument();
      expect(screen.getByText('SaaS / Software')).toBeInTheDocument();
      expect(screen.getByText('AI / Machine Learning')).toBeInTheDocument();
      expect(screen.getByText('E-Commerce')).toBeInTheDocument();
    });

    it('renders company size options', () => {
      goToStep3();
      expect(screen.getByText('1-10 employees')).toBeInTheDocument();
      expect(screen.getByText('11-50 employees')).toBeInTheDocument();
      expect(screen.getByText('51-200 employees')).toBeInTheDocument();
    });

    it('renders primary compliance goal options', () => {
      goToStep3();
      expect(screen.getByText('SOC 2 Certification')).toBeInTheDocument();
      expect(screen.getByText('HIPAA Compliance')).toBeInTheDocument();
      expect(screen.getByText('GDPR Compliance')).toBeInTheDocument();
      expect(screen.getByText('Just Exploring')).toBeInTheDocument();
    });

    it('shows error if industry is not selected', () => {
      goToStep3();
      submitForm();
      expect(screen.getByText('Please select your industry')).toBeInTheDocument();
    });

    it('shows error if company size is not selected', () => {
      goToStep3();
      fireEvent.click(screen.getByText('FinTech'));
      submitForm();
      expect(screen.getByText('Please select your company size')).toBeInTheDocument();
    });

    it('shows error if primary goal is not selected', () => {
      goToStep3();
      fireEvent.click(screen.getByText('FinTech'));
      fireEvent.click(screen.getByText('1-10 employees'));
      submitForm();
      expect(screen.getByText('Please select your primary compliance goal')).toBeInTheDocument();
    });

    it('proceeds to step 4 when all selections are made', () => {
      goToStep3();
      fireEvent.click(screen.getByText('FinTech'));
      fireEvent.click(screen.getByText('1-10 employees'));
      fireEvent.click(screen.getByText('SOC 2 Certification'));
      submitForm();
      expect(screen.getByText('3-day free trial')).toBeInTheDocument();
    });

    it('goes back to step 2 when Back is clicked', () => {
      goToStep3();
      fireEvent.click(screen.getByText('Back'));
      expect(screen.getByPlaceholderText('John Smith')).toBeInTheDocument();
    });

    it('shows framework details for selected goal', () => {
      goToStep3();
      // SOC 2 Certification shows associated frameworks
      expect(screen.getByText('SOC 2 Type I, SOC 2 Type II')).toBeInTheDocument();
    });
  });

  // ===== STEP 4: Review & Confirm =====
  describe('Step 4: Review & Confirm', () => {
    const goToStep4 = () => {
      render(<SignupPage />);
      fillStep1();
      submitForm();
      fireEvent.change(screen.getByPlaceholderText('John Smith'), { target: { value: 'John Smith' } });
      fireEvent.change(screen.getByPlaceholderText('Acme Inc.'), { target: { value: 'Acme Inc' } });
      submitForm();
      fireEvent.click(screen.getByText('FinTech'));
      fireEvent.click(screen.getByText('1-10 employees'));
      fireEvent.click(screen.getByText('SOC 2 Certification'));
      submitForm();
    };

    it('renders step 4 with review details', () => {
      goToStep4();
      expect(screen.getByText('3-day free trial')).toBeInTheDocument();
    });

    it('displays entered email in review', () => {
      goToStep4();
      expect(screen.getByText('test@company.com')).toBeInTheDocument();
    });

    it('displays entered name in review', () => {
      goToStep4();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    it('displays organization name in review', () => {
      goToStep4();
      expect(screen.getByText('Acme Inc')).toBeInTheDocument();
    });

    it('displays industry in review', () => {
      goToStep4();
      expect(screen.getByText('FinTech')).toBeInTheDocument();
    });

    it('shows trial details section', () => {
      goToStep4();
      expect(screen.getByText('3-day free trial')).toBeInTheDocument();
      // "No credit card required" may appear in more than one place
      const matches = screen.getAllByText('No credit card required');
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('shows Terms of Service and Privacy Policy links', () => {
      goToStep4();
      expect(screen.getByText(/I agree to the/)).toBeInTheDocument();
      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });

    it('shows marketing checkbox', () => {
      goToStep4();
      expect(screen.getByText(/Send me product updates/)).toBeInTheDocument();
    });

    it('disables Submit button when terms not accepted', () => {
      goToStep4();
      const submitBtn = screen.getByText('Email me a magic link');
      expect(submitBtn.closest('button')).toBeDisabled();
    });

    it('enables Submit button when terms are accepted', () => {
      goToStep4();
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      const submitBtn = screen.getByText('Email me a magic link');
      expect(submitBtn.closest('button')).toBeEnabled();
    });

    it('shows error if form submitted without accepting terms', () => {
      goToStep4();
      const form = screen.getByText('Email me a magic link').closest('form')!;
      fireEvent.submit(form);
      expect(screen.getByText('Please accept the terms of service and privacy policy')).toBeInTheDocument();
    });

    it('goes back to step 3 when Back is clicked', () => {
      goToStep4();
      fireEvent.click(screen.getByText('Back'));
      expect(screen.getByText('Industry')).toBeInTheDocument();
    });

    it('calls API on form submission with all fields', async () => {
      goToStep4();
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      fireEvent.click(screen.getByText('Email me a magic link'));

      await waitFor(() => {
        expect(mockAuthRegister).toHaveBeenCalledWith(
          'John Smith',
          'test@company.com',
          'Acme Inc',
          VALID_PASSWORD,
          'fintech',
          '1-10',
          'soc2',
          undefined,
        );
      });
    });

    it('shows verification sent screen after successful registration', async () => {
      goToStep4();
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      fireEvent.click(screen.getByText('Email me a magic link'));

      await waitFor(() => {
        expect(screen.getByText('Check your inbox')).toBeInTheDocument();
      });
    });

    it('shows error message on API failure', async () => {
      mockAuthRegister.mockRejectedValueOnce(new Error('Email already exists'));
      goToStep4();
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      fireEvent.click(screen.getByText('Email me a magic link'));

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });
  });

  // ===== VERIFICATION SENT SCREEN =====
  describe('Verification Sent Screen', () => {
    const goToVerification = async () => {
      render(<SignupPage />);
      fillStep1();
      submitForm();
      fireEvent.change(screen.getByPlaceholderText('John Smith'), { target: { value: 'John Smith' } });
      fireEvent.change(screen.getByPlaceholderText('Acme Inc.'), { target: { value: 'Acme Inc' } });
      submitForm();
      fireEvent.click(screen.getByText('FinTech'));
      fireEvent.click(screen.getByText('1-10 employees'));
      fireEvent.click(screen.getByText('SOC 2 Certification'));
      submitForm();
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(screen.getByText('Email me a magic link'));
      await waitFor(() => {
        expect(screen.getByText('Check your inbox')).toBeInTheDocument();
      });
    };

    it('shows email address in verification screen', async () => {
      await goToVerification();
      expect(screen.getByText('test@company.com')).toBeInTheDocument();
    });

    it('shows sign-in link instructions', async () => {
      await goToVerification();
      expect(screen.getByText(/We sent a secure sign-in link/)).toBeInTheDocument();
      expect(screen.getByText('Use a different email')).toBeInTheDocument();
    });

    it('shows a resend link', async () => {
      await goToVerification();
      expect(screen.getByText('resend')).toBeInTheDocument();
    });

    it('resends the verification email when resend is clicked', async () => {
      await goToVerification();
      fireEvent.click(screen.getByText('resend'));

      await waitFor(() => {
        expect(mockRequestMagicLink).toHaveBeenCalledWith('test@company.com');
      });
      expect(await screen.findByText(/Verification email resent/)).toBeInTheDocument();
    });
  });

  // ===== PASSWORD VALIDATION =====
  describe('Password Validation', () => {
    it('shows unmet requirement in muted color for weak password', () => {
      render(<SignupPage />);
      fireEvent.change(screen.getByPlaceholderText('Create a strong password'), { target: { value: 'Short1!' } });
      const lengthCheck = screen.getByText('12+ characters');
      expect(lengthCheck.closest('div')).toHaveClass('text-signal-muted');
    });

    it('shows met requirement in green for strong password', () => {
      render(<SignupPage />);
      fireEvent.change(screen.getByPlaceholderText('Create a strong password'), { target: { value: VALID_PASSWORD } });
      const lengthCheck = screen.getByText('12+ characters');
      expect(lengthCheck.closest('div')).toHaveClass('text-signal-green');
    });

    it('validates uppercase requirement', () => {
      render(<SignupPage />);
      fireEvent.change(screen.getByPlaceholderText('Create a strong password'), { target: { value: 'alllowercase1!' } });
      const uppercaseCheck = screen.getByText('Uppercase letter');
      expect(uppercaseCheck.closest('div')).toHaveClass('text-signal-muted');
    });

    it('validates number requirement', () => {
      render(<SignupPage />);
      fireEvent.change(screen.getByPlaceholderText('Create a strong password'), { target: { value: 'NoNumbersHere!' } });
      const numberCheck = screen.getByText('Number');
      expect(numberCheck.closest('div')).toHaveClass('text-signal-muted');
    });

    it('validates special character requirement', () => {
      render(<SignupPage />);
      fireEvent.change(screen.getByPlaceholderText('Create a strong password'), { target: { value: 'NoSpecialChar1A' } });
      const specialCheck = screen.getByText('Special character');
      expect(specialCheck.closest('div')).toHaveClass('text-signal-muted');
    });
  });
});
