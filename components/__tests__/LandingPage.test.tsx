import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
    verifyMagicLink: vi.fn().mockResolvedValue({}),
    register: vi.fn().mockResolvedValue({}),
    loginWithMagicLink: vi.fn().mockResolvedValue({ devToken: 'test-token-123' }),
  }),
}));

vi.mock('@/services/api', () => ({
  api: {
    auth: {
      requestMagicLink: vi.fn().mockResolvedValue({}),
      register: vi.fn().mockResolvedValue({ devToken: 'reg-token-123' }),
      login: vi.fn().mockResolvedValue({}),
    },
    demo: { submit: vi.fn().mockResolvedValue({}) },
  },
  getAuthToken: vi.fn().mockReturnValue(null),
  clearAuthToken: vi.fn(),
}));

vi.mock('../PricingSection', () => ({ default: ({ onSelectTier }: any) => <div data-testid="pricing-section"><button onClick={() => onSelectTier('Growth')}>Select Growth</button></div> }));
vi.mock('../DemoBookingForm', () => ({ default: ({ isOpen, onClose }: any) => isOpen ? <div data-testid="demo-form"><button onClick={onClose}>Close Demo</button></div> : null }));

import { LandingPage } from '../LandingPage';

const renderWithRouter = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Prevent signup modal from auto-showing
    sessionStorage.setItem('hasSeenSignupModal', 'true');
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { ...window.location, href: '/', reload: vi.fn() },
      writable: true,
    });
  });

  // ---- Navbar ----

  it('renders the navbar with brand name', () => {
    renderWithRouter(<LandingPage />);
    // Brand appears in both navbar and footer
    expect(screen.getAllByText('ComplyEasy AI').length).toBeGreaterThanOrEqual(1);
  });

  it('renders navigation links', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getAllByText('Features').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pricing').length).toBeGreaterThan(0);
  });

  it('renders "Sign In / SSO" button', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Sign In / SSO')).toBeInTheDocument();
  });

  it('scrolls to top when brand logo is clicked', () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    renderWithRouter(<LandingPage />);
    // Brand appears in both navbar and footer
    const brands = screen.getAllByText('ComplyEasy AI');
    fireEvent.click(brands[0]);
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    scrollToSpy.mockRestore();
  });

  it('scrolls to features section on nav link click', () => {
    renderWithRouter(<LandingPage />);
    const featuresLink = screen.getAllByText('Features')[0];
    // scrollIntoView is mocked in setupTests
    fireEvent.click(featuresLink);
    // Should have been called (Element.prototype.scrollIntoView is mocked)
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  // ---- Hero Section ----

  it('renders the hero headline', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText(/Compliance that/)).toBeInTheDocument();
    expect(screen.getByText(/runs itself/)).toBeInTheDocument();
  });

  it('renders the hero subtext', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText(/Empower your SMB/)).toBeInTheDocument();
  });

  it('renders the aCOS badge', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText(/aCOS - Autonomous Compliance Operating System/)).toBeInTheDocument();
  });

  it('renders "Start Free Trial" button', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument();
  });

  it('renders "Book a Demo" button', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Book a Demo')).toBeInTheDocument();
  });

  it('opens demo modal when "Book a Demo" is clicked', () => {
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Book a Demo'));
    expect(screen.getByTestId('demo-form')).toBeInTheDocument();
  });

  it('closes demo modal via close button', () => {
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Book a Demo'));
    expect(screen.getByTestId('demo-form')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close Demo'));
    expect(screen.queryByTestId('demo-form')).not.toBeInTheDocument();
  });

  // ---- Features Section ----

  it('renders the features section heading', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Platform Features')).toBeInTheDocument();
    expect(screen.getByText('Everything you need to stay compliant')).toBeInTheDocument();
  });

  it('renders feature cards with titles', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('AI Automation')).toBeInTheDocument();
    expect(screen.getByText('Zero Trust Security')).toBeInTheDocument();
    expect(screen.getByText('Global Frameworks')).toBeInTheDocument();
    expect(screen.getByText('Real-time Analytics')).toBeInTheDocument();
    expect(screen.getByText('Vendor Management')).toBeInTheDocument();
    expect(screen.getByText('100+ Integrations')).toBeInTheDocument();
  });

  it('renders aCOS feature cards', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getAllByText(/Autonomous Compliance Operating System/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Agentic AI with Rollback/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Temporal Graph Networks/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders security features', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Zero-Knowledge Proofs')).toBeInTheDocument();
    expect(screen.getByText('BYOK Encryption')).toBeInTheDocument();
    expect(screen.getByText('Homomorphic AI')).toBeInTheDocument();
  });

  it('renders EU regulation features', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('EU AI Act Compliance')).toBeInTheDocument();
    expect(screen.getByText('Digital Markets Act (DMA)')).toBeInTheDocument();
    expect(screen.getByText('Digital Services Act (DSA)')).toBeInTheDocument();
  });

  // ---- Pricing Section ----

  it('renders the pricing section', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByTestId('pricing-section')).toBeInTheDocument();
  });

  it('opens registration modal when a pricing tier is selected', () => {
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Select Growth'));
    // Auth modal should be open with Create Account form
    expect(screen.getAllByText('Create Account').length).toBeGreaterThanOrEqual(1);
  });

  // ---- About Section ----

  it('renders the about section', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Our Mission')).toBeInTheDocument();
    expect(screen.getByText('Making compliance accessible to everyone.')).toBeInTheDocument();
  });

  it('renders about section statistics', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('Time Saved on Audits')).toBeInTheDocument();
    expect(screen.getByText('24/7')).toBeInTheDocument();
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders the security score in about section card', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Security Score')).toBeInTheDocument();
    expect(screen.getByText('98/100')).toBeInTheDocument();
  });

  // ---- Footer ----

  it('renders footer with brand', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('AI-powered compliance automation for modern businesses.')).toBeInTheDocument();
  });

  it('renders footer section headings', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
  });

  it('renders compliance badges', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('SOC 2 Type II')).toBeInTheDocument();
    expect(screen.getByText('ISO 27001')).toBeInTheDocument();
    expect(screen.getByText('GDPR Compliant')).toBeInTheDocument();
    expect(screen.getByText('HIPAA Ready')).toBeInTheDocument();
  });

  it('renders copyright notice', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText(/2026 ComplyEasy AI Inc/)).toBeInTheDocument();
  });

  it('renders support email', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('support@complyeasyai.com')).toBeInTheDocument();
  });

  // ---- Auth Modal - Email / Magic Link ----

  it('opens auth modal when "Sign In / SSO" is clicked', () => {
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Sign In / SSO'));
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('shows email input in magic link mode by default', () => {
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Sign In / SSO'));
    expect(screen.getByPlaceholderText('name@company.com')).toBeInTheDocument();
    expect(screen.getByText('Send Magic Link')).toBeInTheDocument();
  });

  it('closes auth modal when X is clicked', () => {
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Sign In / SSO'));
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    // Click the close button (X icon)
    const closeButtons = screen.getAllByTestId('icon-X');
    const closeButton = closeButtons[0].closest('button');
    if (closeButton) fireEvent.click(closeButton);
    expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument();
  });

  it('sends magic link when form is submitted', async () => {
    const { useAuth } = await import('@/contexts/AuthContext');
    const loginWithMagicLink = vi.fn().mockResolvedValue({ devToken: 'test-token' });
    (useAuth as any).mockReturnValue({
      user: null,
      isAuthenticated: false,
      verifyMagicLink: vi.fn(),
      register: vi.fn(),
      loginWithMagicLink,
      logout: vi.fn(),
    });
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Sign In / SSO'));
    fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: 'test@example.com' } });
    await act(async () => {
      fireEvent.click(screen.getByText('Send Magic Link'));
    });
    await waitFor(() => {
      expect(loginWithMagicLink).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows "Check your email" after magic link is sent', async () => {
    const { useAuth } = await import('@/contexts/AuthContext');
    (useAuth as any).mockReturnValue({
      user: null,
      isAuthenticated: false,
      verifyMagicLink: vi.fn(),
      register: vi.fn(),
      loginWithMagicLink: vi.fn().mockResolvedValue({ devToken: 'test-token' }),
      logout: vi.fn(),
    });
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Sign In / SSO'));
    fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: 'user@example.com' } });
    await act(async () => {
      fireEvent.click(screen.getByText('Send Magic Link'));
    });
    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });
  });

  it('shows simulate link button after magic link sent', async () => {
    const { useAuth } = await import('@/contexts/AuthContext');
    (useAuth as any).mockReturnValue({
      user: null,
      isAuthenticated: false,
      verifyMagicLink: vi.fn(),
      register: vi.fn(),
      loginWithMagicLink: vi.fn().mockResolvedValue({ devToken: 'mock-token' }),
      logout: vi.fn(),
    });
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Sign In / SSO'));
    fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: 'user@example.com' } });
    await act(async () => {
      fireEvent.click(screen.getByText('Send Magic Link'));
    });
    await waitFor(() => {
      expect(screen.getByText('(Simulate Clicking Link from Email)')).toBeInTheDocument();
    });
  });

  it('verifies magic link when simulate button is clicked', async () => {
    const { useAuth } = await import('@/contexts/AuthContext');
    const verifyMagicLink = vi.fn().mockResolvedValue({});
    (useAuth as any).mockReturnValue({
      user: null,
      isAuthenticated: false,
      verifyMagicLink,
      register: vi.fn(),
      loginWithMagicLink: vi.fn().mockResolvedValue({ devToken: 'mock-token' }),
      logout: vi.fn(),
    });
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Sign In / SSO'));
    fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: 'user@example.com' } });
    await act(async () => {
      fireEvent.click(screen.getByText('Send Magic Link'));
    });
    await waitFor(() => screen.getByText('(Simulate Clicking Link from Email)'));
    await act(async () => {
      fireEvent.click(screen.getByText('(Simulate Clicking Link from Email)'));
    });
    await waitFor(() => {
      expect(verifyMagicLink).toHaveBeenCalledWith('mock-token');
    });
  });

  // ---- Auth Modal - Password Login ----

  it('switches to password login mode', () => {
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Sign In / SSO'));
    fireEvent.click(screen.getByText('Password'));
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('shows Forgot password link in password mode', () => {
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Sign In / SSO'));
    fireEvent.click(screen.getByText('Password'));
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });

  it('switches between magic link and password modes', () => {
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Sign In / SSO'));
    expect(screen.getByText('Send Magic Link')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Password'));
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Magic Link'));
    expect(screen.getByText('Send Magic Link')).toBeInTheDocument();
  });

  // ---- Auth Modal - Registration ----

  it('shows registration form when pricing tier is selected', () => {
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Select Growth'));
    expect(screen.getAllByText('Create Account').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
  });

  it('submits registration form', async () => {
    const { api } = await import('@/services/api');
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Select Growth'));
    fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'New User' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    });
    await waitFor(() => {
      expect(api.auth.register).toHaveBeenCalledWith('New User', 'new@example.com', undefined, undefined);
    });
  });

  it('shows magic link sent after successful registration', async () => {
    const { api } = await import('@/services/api');
    (api.auth.register as any).mockResolvedValue({ devToken: 'new-token' });
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Select Growth'));
    fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'New User' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    });
    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });
  });

  it('handles existing user during registration', async () => {
    const { api } = await import('@/services/api');
    (api.auth.register as any).mockResolvedValueOnce({ existingUser: true, devToken: 'existing-token' });
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Select Growth'));
    fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'Existing User' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    });
    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });
  });

  it('shows error alert on registration network failure', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { api } = await import('@/services/api');
    (api.auth.register as any).mockRejectedValueOnce(new Error('Network error: Failed to fetch'));
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Select Growth'));
    fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: 'fail@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'Fail User' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    });
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Cannot connect to server'));
    });
    alertSpy.mockRestore();
  });

  // ---- Signup Modal (auto-show) ----

  it('shows signup modal on first visit', () => {
    sessionStorage.removeItem('hasSeenSignupModal');
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Start Your Free Trial')).toBeInTheDocument();
    expect(screen.getByText('Get 3 days of full access to ComplyEasyAI. No credit card required.')).toBeInTheDocument();
  });

  it('does not show signup modal on repeat visits', () => {
    sessionStorage.setItem('hasSeenSignupModal', 'true');
    renderWithRouter(<LandingPage />);
    expect(screen.queryByText('Start Your Free Trial')).not.toBeInTheDocument();
  });

  it('closes signup modal when X is clicked', () => {
    sessionStorage.removeItem('hasSeenSignupModal');
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Start Your Free Trial')).toBeInTheDocument();
    const closeButton = screen.getByLabelText('Close signup modal');
    fireEvent.click(closeButton);
    expect(screen.queryByText('Start Your Free Trial')).not.toBeInTheDocument();
  });

  it('shows signup modal feature list', () => {
    sessionStorage.removeItem('hasSeenSignupModal');
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('AI-powered compliance automation')).toBeInTheDocument();
    expect(screen.getByText('Up to 3 compliance frameworks')).toBeInTheDocument();
    expect(screen.getByText('Up to 10 team members')).toBeInTheDocument();
    expect(screen.getByText('24/7 automated evidence collection')).toBeInTheDocument();
  });

  it('opens auth modal when "Sign In" is clicked from signup modal', () => {
    sessionStorage.removeItem('hasSeenSignupModal');
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Start Your Free Trial')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Sign In'));
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    // Signup modal should be closed
    expect(screen.queryByText('Start Your Free Trial')).not.toBeInTheDocument();
  });

  it('renders "Get Started Free" button in signup modal', () => {
    sessionStorage.removeItem('hasSeenSignupModal');
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Get Started Free')).toBeInTheDocument();
  });

  // ---- Login Error Handling ----

  it('shows network error alert on login failure', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { useAuth } = await import('@/contexts/AuthContext');
    (useAuth as any).mockReturnValue({
      user: null,
      isAuthenticated: false,
      verifyMagicLink: vi.fn(),
      register: vi.fn(),
      loginWithMagicLink: vi.fn().mockRejectedValue(new Error('Network error')),
      logout: vi.fn(),
    });
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Sign In / SSO'));
    fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: 'test@test.com' } });
    await act(async () => {
      fireEvent.click(screen.getByText('Send Magic Link'));
    });
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Cannot connect to server'));
    });
    alertSpy.mockRestore();
  });

  it('shows generic error alert on login failure', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { useAuth } = await import('@/contexts/AuthContext');
    (useAuth as any).mockReturnValue({
      user: null,
      isAuthenticated: false,
      verifyMagicLink: vi.fn(),
      register: vi.fn(),
      loginWithMagicLink: vi.fn().mockRejectedValue(new Error('Server error')),
      logout: vi.fn(),
    });
    renderWithRouter(<LandingPage />);
    fireEvent.click(screen.getByText('Sign In / SSO'));
    fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: 'test@test.com' } });
    await act(async () => {
      fireEvent.click(screen.getByText('Send Magic Link'));
    });
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to send magic link'));
    });
    alertSpy.mockRestore();
  });
});
