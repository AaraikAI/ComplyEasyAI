import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Track mock authentication state
let mockIsAuthenticated = false;
const mockLogin = vi.fn(() => { mockIsAuthenticated = true; });
const mockLogout = vi.fn(() => { mockIsAuthenticated = false; });

// Mock AuthContext
vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: mockIsAuthenticated ? { id: '1', email: 'test@test.com', name: 'Test User' } : null,
    isLoading: false,
    login: mockLogin,
    logout: mockLogout,
    verifyMagicLink: vi.fn(),
    register: vi.fn(),
    loginWithMagicLink: vi.fn(),
  }),
}));

// Mock sub-components that make network calls or complex renders
vi.mock('./components/Dashboard', () => ({
  Dashboard: () => <div>Dashboard Component</div>
}));
vi.mock('./components/LandingPage', () => ({
  LandingPage: () => <div data-testid="landing-page">Landing Page</div>
}));

// Mock api calls
vi.mock('./services/api', () => ({
  api: {
    frameworks: { list: vi.fn().mockResolvedValue([]) },
    risks: { list: vi.fn().mockResolvedValue([]) },
  }
}));

describe('App', () => {
  beforeEach(() => {
    mockIsAuthenticated = false;
    vi.clearAllMocks();
  });

  it('renders landing page when not authenticated', () => {
    mockIsAuthenticated = false;
    render(<App />);
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  it('renders dashboard when authenticated', () => {
    mockIsAuthenticated = true;
    render(<App />);
    expect(screen.getByText('Dashboard Component')).toBeInTheDocument();
  });
});
