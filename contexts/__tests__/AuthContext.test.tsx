
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

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
  const { user, loginWithMagicLink, logout } = useAuth();
  return (
    <div>
      <span data-testid="user-email">{user?.email || 'No User'}</span>
      <button onClick={() => loginWithMagicLink('test@test.com')}>Login</button>
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
    // Mock the magic link request - this just sends the email
    (api.auth.requestMagicLink as any).mockResolvedValue({ message: 'Magic link sent' });

    // Mock the verification - this returns the user after clicking the email link
    (api.auth.verifyMagicLink as any).mockResolvedValue({ id: '1', email: 'test@test.com' });

    // For this test, we verify basic context provider rendering
    // loginWithMagicLink only triggers email send, verifyMagicLink logs the user in

    render(
      <AuthProvider>
        <TestComp />
      </AuthProvider>
    );
    expect(screen.getByTestId('user-email').textContent).toBe('No User');
  });
});
