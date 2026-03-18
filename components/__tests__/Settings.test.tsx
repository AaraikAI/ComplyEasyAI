import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Settings } from '../Settings';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { toast } from 'sonner';

// --- Mocks ---

const mockUser = {
  id: 'user-1',
  name: 'Sarah Connor',
  email: 'sarah@test.com',
  role: 'admin',
  avatar: 'SC',
  organizationId: 'org-1',
  organization: { id: 'org-1', name: 'Test Org', plan: 'Growth' },
};

const mockTeamList = vi.fn().mockResolvedValue([
  { id: 'u1', name: 'Sarah Connor', email: 'sarah@test.com', role: 'admin', avatar: 'SC', organizationId: 'org-1' },
  { id: 'u2', name: 'John Doe', email: 'john@test.com', role: 'editor', avatar: 'JD', organizationId: 'org-1' },
]);
const mockTeamInvite = vi.fn().mockResolvedValue({ id: 'new-user', name: 'New User', email: 'new@test.com' });
const mockTeamBulkInvite = vi.fn().mockResolvedValue({ successful: [], failed: [], summary: { total: 0, successful: 0, failed: 0 } });
const mockTeamUpdateRole = vi.fn().mockResolvedValue({});
const mockTeamRemove = vi.fn().mockResolvedValue({});
const mockBillingGetSubscription = vi.fn().mockResolvedValue({ tier: 'Growth', status: 'active', billingCycle: 'annual', currentPeriodEnd: '2026-12-31', cancelAtPeriodEnd: false });
const mockBillingGetUsageMetrics = vi.fn().mockResolvedValue({ users: 5, frameworks: 3, aiRequestsThisMonth: 120, storageGB: 2.5 });
const mockBillingCreateCheckout = vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' });
const mockBillingGetFeatureSubscriptions = vi.fn().mockResolvedValue({ subscriptions: [], totalAnnualCost: 0, totalMonthlyCost: 0 });
const mockBillingPreviewTierChange = vi.fn().mockResolvedValue({ stripePreview: { proratedAmount: 10, newMonthlyAmount: 99, immediateCharge: 5, nextBillingDate: '2026-03-01' } });
const mockBillingCreatePortalSession = vi.fn().mockResolvedValue({ url: 'https://portal.stripe.com/test' });
const mockIntegrationsList = vi.fn().mockResolvedValue([]);
const mockOrganizationGet = vi.fn().mockResolvedValue({ name: 'Test Org', plan: 'Growth' });
const mockOrganizationUpdate = vi.fn().mockResolvedValue({});
const mockTwoFactorGetStatus = vi.fn().mockResolvedValue({ enabled: false, verified: false });
const mockTwoFactorSetup = vi.fn().mockResolvedValue({ qrCode: 'data:image/png;base64,abc', backupCodes: ['CODE1', 'CODE2'] });
const mockTwoFactorVerifyAndEnable = vi.fn().mockResolvedValue({});
const mockTwoFactorDisable = vi.fn().mockResolvedValue({});
const mockTwoFactorRegenerateCodes = vi.fn().mockResolvedValue({ backupCodes: ['NEW1', 'NEW2'] });
const mockUserUpdateProfile = vi.fn().mockResolvedValue({ id: 'user-1', name: 'Updated Name', email: 'updated@test.com' });
const mockUserChangePassword = vi.fn().mockResolvedValue({});
const mockAuthUploadAvatar = vi.fn().mockResolvedValue({ user: { id: 'user-1', avatar: 'http://img.com/a.png' } });

vi.mock('../../services/api', () => ({
  api: {
    auth: {
      register: vi.fn(),
      uploadAvatar: (...args: any[]) => mockAuthUploadAvatar(...args),
      updateProfile: (...args: any[]) => mockUserUpdateProfile(...args),
      changePassword: (...args: any[]) => mockUserChangePassword(...args),
    },
    billing: {
      createCheckout: (...args: any[]) => mockBillingCreateCheckout(...args),
      getSubscription: () => mockBillingGetSubscription(),
      getUsageMetrics: () => mockBillingGetUsageMetrics(),
      getFeatureSubscriptions: () => mockBillingGetFeatureSubscriptions(),
      previewTierChange: (...args: any[]) => mockBillingPreviewTierChange(...args),
      createPortalSession: () => mockBillingCreatePortalSession(),
    },
    team: {
      list: () => mockTeamList(),
      invite: (...args: any[]) => mockTeamInvite(...args),
      bulkInvite: (...args: any[]) => mockTeamBulkInvite(...args),
      updateRole: (...args: any[]) => mockTeamUpdateRole(...args),
      remove: (...args: any[]) => mockTeamRemove(...args),
    },
    integrations: { list: () => mockIntegrationsList() },
    organization: {
      get: () => mockOrganizationGet(),
      update: (...args: any[]) => mockOrganizationUpdate(...args),
    },
    twoFactor: {
      getStatus: () => mockTwoFactorGetStatus(),
      setup: () => mockTwoFactorSetup(),
      verifyAndEnable: (...args: any[]) => mockTwoFactorVerifyAndEnable(...args),
      disable: () => mockTwoFactorDisable(),
      regenerateCodes: () => mockTwoFactorRegenerateCodes(),
    },
    user: {
      updateProfile: (...args: any[]) => mockUserUpdateProfile(...args),
      changePassword: (...args: any[]) => mockUserChangePassword(...args),
    },
    getFeatureSubscriptions: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, isAuthenticated: true }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../PaymentModal', () => ({
  PaymentModal: ({ onSuccess, onClose }: any) => (
    <div data-testid="payment-modal">
      <button onClick={onSuccess}>Pay Success</button>
      <button onClick={onClose}>Close Payment</button>
    </div>
  ),
}));

vi.mock('../PricingSection', () => ({
  default: ({ currentTier, onSelectTier }: any) => (
    <div data-testid="pricing-section">
      <span>Current: {currentTier}</span>
      <button onClick={() => onSelectTier('Essentials', 'annual')}>Select Essentials</button>
      <button onClick={() => onSelectTier('Visionary', 'annual')}>Select Visionary</button>
    </div>
  ),
}));

vi.mock('../FeatureMarketplace', () => ({
  default: () => <div data-testid="feature-marketplace">Feature Marketplace</div>,
  FeatureMarketplace: () => <div data-testid="feature-marketplace">Feature Marketplace</div>,
}));

vi.mock('../../constants/tierLimits', () => ({
  isAtLimit: vi.fn().mockReturnValue(false),
  getUpgradeMessage: vi.fn().mockReturnValue('Upgrade your plan for more.'),
}));

describe('Settings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===== PROFILE TAB =====
  describe('Profile Tab', () => {
    it('renders profile tab by default with user info', async () => {
      render(<Settings />);
      await waitFor(() => {
        expect(screen.getAllByText('Profile').length).toBeGreaterThanOrEqual(1);
      });
      expect(screen.getByDisplayValue('Sarah Connor')).toBeInTheDocument();
      expect(screen.getByDisplayValue('sarah@test.com')).toBeInTheDocument();
    });

    it('renders avatar initials when no http avatar', async () => {
      render(<Settings />);
      await waitFor(() => {
        expect(screen.getAllByText('Profile').length).toBeGreaterThanOrEqual(1);
      });
      // The initials "SA" should show (first 2 chars of profileName)
      expect(screen.getByText('SA')).toBeInTheDocument();
    });

    it('allows editing profile name and email', async () => {
      render(<Settings />);
      await waitFor(() => {
        expect(screen.getByDisplayValue('Sarah Connor')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Sarah Connor');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      expect(nameInput).toHaveValue('Updated Name');

      const emailInput = screen.getByDisplayValue('sarah@test.com');
      fireEvent.change(emailInput, { target: { value: 'updated@test.com' } });
      expect(emailInput).toHaveValue('updated@test.com');
    });

    it('saves profile when save button is clicked', async () => {
      render(<Settings />);
      await waitFor(() => {
        expect(screen.getAllByText('Profile').length).toBeGreaterThanOrEqual(1);
      });

      const saveBtn = screen.getByText('Save');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockUserUpdateProfile).toHaveBeenCalledWith({
          name: 'Sarah Connor',
          email: 'sarah@test.com',
        });
      });
    });

    it('shows validation error for empty name on save', async () => {
      render(<Settings />);
      await waitFor(() => {
        expect(screen.getByDisplayValue('Sarah Connor')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Sarah Connor');
      fireEvent.change(nameInput, { target: { value: '' } });

      const saveBtn = screen.getByText('Save');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith('Name is required');
      });
    });

    it('shows validation error for invalid email on save', async () => {
      render(<Settings />);
      await waitFor(() => {
        expect(screen.getByDisplayValue('sarah@test.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByDisplayValue('sarah@test.com');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const saveBtn = screen.getByText('Save');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith('Please enter a valid email address');
      });
    });

    it('handles profile save API error', async () => {
      mockUserUpdateProfile.mockRejectedValueOnce(new Error('Server error'));
      render(<Settings />);
      await waitFor(() => {
        expect(screen.getAllByText('Profile').length).toBeGreaterThanOrEqual(1);
      });

      const saveBtn = screen.getByText('Save');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to update profile: Server error');
      });
    });

    it('shows role field as disabled', async () => {
      render(<Settings />);
      await waitFor(() => {
        expect(screen.getByDisplayValue('Administrator')).toBeDisabled();
      });
    });
  });

  // ===== TAB NAVIGATION =====
  describe('Tab Navigation', () => {
    it('renders all navigation tabs for admin user', async () => {
      render(<Settings />);
      await waitFor(() => {
        expect(screen.getAllByText('Profile').length).toBeGreaterThanOrEqual(1);
      });
      expect(screen.getAllByText('Security').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Organization').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Team Members')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getAllByText('Billing').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Feature Marketplace')).toBeInTheDocument();
    });

    it('switches to Security tab', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Security')[0]);
      await waitFor(() => {
        expect(screen.getAllByText('Security').length).toBeGreaterThanOrEqual(2); // tab + heading
      });
    });

    it('switches to Team Members tab', async () => {
      render(<Settings />);
      const teamTab = screen.getAllByText('Team Members')[0];
      fireEvent.click(teamTab);
      await waitFor(() => {
        expect(screen.getByText('Invite Team Member')).toBeInTheDocument();
      });
    });

    it('switches to Billing tab', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Billing')[0]);
      await waitFor(() => {
        expect(screen.getAllByText('Billing').length).toBeGreaterThanOrEqual(2); // tab + heading
      });
    });

    it('switches to Organization tab', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Organization')[0]);
      await waitFor(() => {
        expect(screen.getAllByText('Organization').length).toBeGreaterThanOrEqual(2); // tab + heading
      });
    });

    it('switches to Features tab', async () => {
      render(<Settings />);
      fireEvent.click(screen.getByText('Feature Marketplace'));
      await waitFor(() => {
        expect(screen.getByTestId('feature-marketplace')).toBeInTheDocument();
      });
    });
  });

  // ===== SECURITY TAB =====
  describe('Security Tab', () => {
    it('shows 2FA as Disabled when not enabled', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Security')[0]);
      await waitFor(() => {
        expect(screen.getByText('Disabled')).toBeInTheDocument();
      });
    });

    it('shows 2FA as Enabled when enabled', async () => {
      mockTwoFactorGetStatus.mockResolvedValueOnce({ enabled: true, verified: true });
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Security')[0]);
      await waitFor(() => {
        expect(screen.getByText('Enabled')).toBeInTheDocument();
      });
    });

    it('shows Enable Two-Factor Authentication button when 2FA disabled', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Security')[0]);
      await waitFor(() => {
        expect(screen.getByText('Enable 2FA')).toBeInTheDocument();
      });
    });

    it('starts 2FA setup when Enable button is clicked', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Security')[0]);
      await waitFor(() => {
        expect(screen.getByText('Enable 2FA')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Enable 2FA'));
      await waitFor(() => {
        expect(mockTwoFactorSetup).toHaveBeenCalled();
      });
    });

    it('renders change password section on Security tab', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Security')[0]);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter current password')).toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText('Enter new password (min 8 characters)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument();
    });

    it('validates all password fields are required', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Security')[0]);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter current password')).toBeInTheDocument();
      });

      // The change password button should be disabled when fields are empty
      const changeBtns = screen.getAllByText('Change Password');
      const changeBtn = changeBtns.find(el => el.tagName === 'BUTTON');
      expect(changeBtn).toBeDisabled();
    });

    it('validates new password minimum length', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Security')[0]);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter current password')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'oldpass123' } });
      fireEvent.change(screen.getByPlaceholderText('Enter new password (min 8 characters)'), { target: { value: 'short' } });
      fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'short' } });

      const changeBtn = screen.getAllByText('Change Password').find(el => el.tagName === 'BUTTON')!;
      fireEvent.click(changeBtn);

      await waitFor(() => {
        expect(screen.getByText('New password must be at least 8 characters')).toBeInTheDocument();
      });
    });

    it('validates password mismatch', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Security')[0]);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter current password')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'oldpass123' } });
      fireEvent.change(screen.getByPlaceholderText('Enter new password (min 8 characters)'), { target: { value: 'newpassword1' } });
      fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'different123' } });

      const changeBtn = screen.getAllByText('Change Password').find(el => el.tagName === 'BUTTON')!;
      fireEvent.click(changeBtn);

      await waitFor(() => {
        expect(screen.getByText('New passwords do not match')).toBeInTheDocument();
      });
    });
  });

  // ===== TEAM TAB =====
  describe('Team Tab', () => {
    it('loads and displays team members', async () => {
      render(<Settings />);
      const teamTab = screen.getAllByText('Team Members')[0];
      fireEvent.click(teamTab);

      await waitFor(() => {
        expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('shows loading state for team members', async () => {
      mockTeamList.mockImplementation(() => new Promise(() => {})); // never resolves
      render(<Settings />);
      const teamTab = screen.getAllByText('Team Members')[0];
      fireEvent.click(teamTab);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });

    it('shows invite member button', async () => {
      render(<Settings />);
      const teamTab = screen.getAllByText('Team Members')[0];
      fireEvent.click(teamTab);

      await waitFor(() => {
        expect(screen.getByText('Invite Team Member')).toBeInTheDocument();
      });
    });

    it('shows bulk invite button', async () => {
      render(<Settings />);
      const teamTab = screen.getAllByText('Team Members')[0];
      fireEvent.click(teamTab);

      await waitFor(() => {
        expect(screen.getByText('Bulk Invite (CSV)')).toBeInTheDocument();
      });
    });

    it('falls back to current user when team loading fails', async () => {
      mockTeamList.mockRejectedValueOnce(new Error('API error'));
      render(<Settings />);
      const teamTab = screen.getAllByText('Team Members')[0];
      fireEvent.click(teamTab);

      await waitFor(() => {
        expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
      });
    });
  });

  // ===== BILLING TAB =====
  describe('Billing Tab', () => {
    it('displays current subscription info', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Billing')[0]);

      await waitFor(() => {
        expect(screen.getByText('Growth')).toBeInTheDocument();
      });
    });

    it('shows Active subscription status', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Billing')[0]);

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('shows billing cycle as Annual', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Billing')[0]);

      await waitFor(() => {
        expect(screen.getByText('Annual billing')).toBeInTheDocument();
      });
    });

    it('shows usage metrics when available', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Billing')[0]);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // users
        expect(screen.getByText('3')).toBeInTheDocument(); // frameworks
        expect(screen.getByText('120')).toBeInTheDocument(); // AI requests
        expect(screen.getByText('2.5 GB')).toBeInTheDocument(); // storage
      });
    });

    it('shows pricing section', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Billing')[0]);

      await waitFor(() => {
        expect(screen.getByTestId('pricing-section')).toBeInTheDocument();
      });
    });

    it('handles billing error gracefully', async () => {
      mockBillingGetSubscription.mockRejectedValueOnce(new Error('Payment gateway down'));
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Billing')[0]);

      await waitFor(() => {
        expect(screen.getByText('Error loading billing information')).toBeInTheDocument();
      });
    });

    it('opens payment modal when tier is selected', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Billing')[0]);

      await waitFor(() => {
        expect(screen.getByTestId('pricing-section')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select Essentials'));

      await waitFor(() => {
        expect(screen.getByTestId('payment-modal')).toBeInTheDocument();
      });
    });

    it('opens contact sales for Visionary tier', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Billing')[0]);

      await waitFor(() => {
        expect(screen.getByTestId('pricing-section')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select Visionary'));

      await waitFor(() => {
        expect(openSpy).toHaveBeenCalledWith('/contact-sales?tier=Visionary', '_blank');
      });
    });

    it('shows feature subscriptions when available', async () => {
      mockBillingGetFeatureSubscriptions.mockResolvedValueOnce({
        subscriptions: [
          { id: 'fs1', featureId: 'f1', featureName: 'Custom Reports', billingCycle: 'annual', price: 199, status: 'active' },
        ],
        totalAnnualCost: 199,
        totalMonthlyCost: 16.58,
      });
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Billing')[0]);

      await waitFor(() => {
        expect(screen.getByText('Custom Reports')).toBeInTheDocument();
        expect(screen.getByText('Active Feature Subscriptions')).toBeInTheDocument();
      });
    });
  });

  // ===== ORGANIZATION TAB =====
  describe('Organization Tab', () => {
    it('renders organization settings for admin users', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Organization')[0]);

      await waitFor(() => {
        expect(screen.getAllByText('Organization').length).toBeGreaterThanOrEqual(2);
      });
    });

    it('loads organization name from API', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Organization')[0]);

      await waitFor(() => {
        expect(mockOrganizationGet).toHaveBeenCalled();
      });
    });

    it('shows current plan in organization tab', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Organization')[0]);

      await waitFor(() => {
        expect(screen.getByText('Current Plan')).toBeInTheDocument();
      });
    });

    it('allows editing organization name', async () => {
      render(<Settings />);
      fireEvent.click(screen.getAllByText('Organization')[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter organization name')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Enter organization name'), { target: { value: 'New Org Name' } });
      expect(screen.getByPlaceholderText('Enter organization name')).toHaveValue('New Org Name');
    });
  });

  // ===== INTEGRATIONS TAB =====
  describe('Integrations Tab', () => {
    it('loads integrations when tab is selected', async () => {
      render(<Settings />);
      fireEvent.click(screen.getByText('General'));

      await waitFor(() => {
        expect(mockIntegrationsList).toHaveBeenCalled();
      });
    });
  });
});
