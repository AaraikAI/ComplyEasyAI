
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import { vi, describe, it, expect, beforeEach } from 'vitest';

// Override the global AuthContext mock from setupTests to use real implementation
vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return actual;
});

vi.mock('../../services/api', () => ({
  api: {
    auth: {
      requestMagicLink: vi.fn(),
      verifyMagicLink: vi.fn(),
      register: vi.fn(),
      refreshToken: vi.fn(),
      logout: vi.fn()
    },
    organization: {
      get: vi.fn().mockResolvedValue({ id: 'org-1', name: 'Test Org', plan: 'Growth' }),
    },
  }
}));

import { AuthProvider, useAuth } from '../AuthContext';
import { api } from '../../services/api';

const TestComp = () => {
  const { user, isAuthenticated, loginWithMagicLink, verifyMagicLink, logout } = useAuth();
  return (
    <div>
      <span data-testid="user-email">{user?.email || 'No User'}</span>
      <span data-testid="is-auth">{isAuthenticated ? 'yes' : 'no'}</span>
      <button onClick={() => loginWithMagicLink('test@test.com')}>Login</button>
      <button onClick={() => verifyMagicLink('magic-token')}>Verify</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('login flow', async () => {
    // requestMagicLink only triggers the email send
    (api.auth.requestMagicLink as any).mockResolvedValue({ message: 'Magic link sent', email: 'test@test.com' });

    // verifyMagicLink returns the authenticated user after the email link is used
    (api.auth.verifyMagicLink as any).mockResolvedValue({
      id: '1',
      name: 'Test User',
      email: 'test@test.com',
      role: 'admin',
      avatar: 'TU',
      organizationId: 'org-1',
    });

    render(
      <AuthProvider>
        <TestComp />
      </AuthProvider>
    );

    // Initial state: unauthenticated until the magic link is verified
    expect(screen.getByTestId('user-email').textContent).toBe('No User');
    expect(screen.getByTestId('is-auth').textContent).toBe('no');

    // Step 1: requesting the magic link sends an email but does NOT log in
    fireEvent.click(screen.getByText('Login'));
    await waitFor(() => expect(api.auth.requestMagicLink).toHaveBeenCalledWith('test@test.com'));
    expect(screen.getByTestId('is-auth').textContent).toBe('no');

    // Step 2: verifying the magic link token authenticates the user
    fireEvent.click(screen.getByText('Verify'));
    await waitFor(() => expect(api.auth.verifyMagicLink).toHaveBeenCalledWith('magic-token'));
    await waitFor(() => expect(screen.getByTestId('user-email').textContent).toBe('test@test.com'));
    expect(screen.getByTestId('is-auth').textContent).toBe('yes');

    // Step 3: logout clears the authenticated user
    (api.auth.logout as any).mockResolvedValue({});
    fireEvent.click(screen.getByText('Logout'));
    await waitFor(() => expect(screen.getByTestId('user-email').textContent).toBe('No User'));
    expect(screen.getByTestId('is-auth').textContent).toBe('no');
  });
});
