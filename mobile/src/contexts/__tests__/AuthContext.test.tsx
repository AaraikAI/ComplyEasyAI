/**
 * AuthContext Tests
 *
 * Tests authentication state management including login, logout,
 * session restoration from secure storage, and error handling.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';

// ============================================================================
// MOCKS
// ============================================================================

// Mock secure store with persistent implementations
const secureStoreData: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async (key: string, value: string) => {
    secureStoreData[key] = value;
  }),
  getItemAsync: jest.fn(async (key: string) => {
    return secureStoreData[key] || null;
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    delete secureStoreData[key];
  }),
}));

const mockLogin = jest.fn();
const mockLogout = jest.fn();
const mockMe = jest.fn();
const mockSetTokens = jest.fn();
const mockClearTokens = jest.fn();
const mockGetAccessToken = jest.fn(() => null);

jest.mock('../../services/api', () => ({
  api: {
    auth: {
      get login() { return mockLogin; },
      get logout() { return mockLogout; },
      get me() { return mockMe; },
    },
  },
  setTokens: (...args: any[]) => mockSetTokens(...args),
  clearTokens: (...args: any[]) => mockClearTokens(...args),
  getAccessToken: (...args: any[]) => mockGetAccessToken(...args),
}));

import * as SecureStore from 'expo-secure-store';

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function clearSecureStore() {
  Object.keys(secureStoreData).forEach(k => delete secureStoreData[k]);
}

beforeEach(() => {
  mockLogin.mockReset();
  mockLogout.mockReset();
  mockMe.mockReset();
  mockSetTokens.mockReset();
  mockClearTokens.mockReset();
  mockGetAccessToken.mockReset().mockReturnValue(null);
  clearSecureStore();
  // Restore mock implementations (mockClear/mockReset on the jest.mock factory fns
  // doesn't wipe the factory, but mockImplementation overrides in tests do)
  (SecureStore.setItemAsync as jest.Mock).mockImplementation(async (key: string, value: string) => {
    secureStoreData[key] = value;
  });
  (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
    return secureStoreData[key] || null;
  });
  (SecureStore.deleteItemAsync as jest.Mock).mockImplementation(async (key: string) => {
    delete secureStoreData[key];
  });
});

// ============================================================================
// INITIAL STATE
// ============================================================================

describe('Initial State', () => {
  test('starts with isLoading=true', () => {
    // Make restore session hang so we can observe initial state
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test('throws error when useAuth is used outside AuthProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    spy.mockRestore();
  });
});

// ============================================================================
// SESSION RESTORATION
// ============================================================================

describe('Session Restoration', () => {
  test('restores session when tokens exist in secure store', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      organizationId: 'org-1',
    };

    // Pre-populate the store
    secureStoreData['accessToken'] = 'stored-access';
    secureStoreData['refreshToken'] = 'stored-refresh';

    mockMe.mockResolvedValue({ data: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('test@example.com');
    expect(mockSetTokens).toHaveBeenCalledWith({
      accessToken: 'stored-access',
      refreshToken: 'stored-refresh',
    });
  });

  test('logs out when no stored tokens', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test('clears tokens when session restore fails (expired token)', async () => {
    secureStoreData['accessToken'] = 'expired-token';
    secureStoreData['refreshToken'] = 'expired-refresh';

    mockMe.mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(mockClearTokens).toHaveBeenCalled();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('accessToken');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
  });
});

// ============================================================================
// LOGIN
// ============================================================================

describe('Login', () => {
  test('successful login with user in response', async () => {
    const loginResponse = {
      data: {
        token: 'new-jwt',
        refreshToken: 'new-refresh',
        user: {
          id: 'u1',
          email: 'admin@company.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          organizationId: 'org-1',
        },
      },
    };

    mockLogin.mockResolvedValue(loginResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('admin@company.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('admin@company.com');
    expect(result.current.user?.role).toBe('admin');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('accessToken', 'new-jwt');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', 'new-refresh');
  });

  test('login fetches user profile when not in login response', async () => {
    const loginResponse = { data: { token: 'jwt', refreshToken: 'ref' } };
    const meResponse = {
      data: {
        id: 'u2',
        email: 'user@co.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'user',
        organizationId: 'org-2',
      },
    };

    mockLogin.mockResolvedValue(loginResponse);
    mockMe.mockResolvedValue(meResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('user@co.com', 'pass');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.firstName).toBe('Jane');
  });

  test('login failure sets error state', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      try {
        await result.current.login('bad@email.com', 'wrong');
      } catch {
        // expected
      }
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });
});

// ============================================================================
// LOGOUT
// ============================================================================

describe('Logout', () => {
  test('clears all auth state and tokens', async () => {
    const loginResponse = {
      data: {
        token: 'jwt',
        refreshToken: 'ref',
        user: { id: '1', email: 'x@y.com', firstName: 'X', lastName: 'Y', role: 'user', organizationId: 'o' },
      },
    };
    mockLogin.mockResolvedValue(loginResponse);
    mockLogout.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('x@y.com', 'pass');
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(mockClearTokens).toHaveBeenCalled();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('accessToken');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
  });

  test('logout succeeds even if API call fails', async () => {
    mockLogout.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(mockClearTokens).toHaveBeenCalled();
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

describe('Error Handling', () => {
  test('clearError removes error message', async () => {
    mockLogin.mockRejectedValue(new Error('Bad login'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      try {
        await result.current.login('bad@e.com', 'bad');
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Bad login');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});

// ============================================================================
// UPDATE USER
// ============================================================================

describe('Update User', () => {
  test('updateUser merges partial data into existing user', async () => {
    const loginResponse = {
      data: {
        token: 't',
        refreshToken: 'r',
        user: {
          id: '1', email: 'user@co.com', firstName: 'John', lastName: 'Doe',
          role: 'user', organizationId: 'org-1',
        },
      },
    };

    mockLogin.mockResolvedValue(loginResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('user@co.com', 'pass');
    });

    act(() => {
      result.current.updateUser({ firstName: 'Jane', avatar: 'pic.png' });
    });

    expect(result.current.user?.firstName).toBe('Jane');
    expect(result.current.user?.avatar).toBe('pic.png');
    expect(result.current.user?.lastName).toBe('Doe');
  });

  test('updateUser is a no-op when user is null', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.updateUser({ firstName: 'Ghost' });
    });

    expect(result.current.user).toBeNull();
  });
});

// ============================================================================
// REFRESH USER
// ============================================================================

describe('Refresh User', () => {
  test('refreshUser updates user data from API', async () => {
    mockGetAccessToken.mockReturnValue('valid-token');

    const loginResponse = {
      data: {
        token: 't',
        refreshToken: 'r',
        user: {
          id: '1', email: 'x@y.com', firstName: 'Old', lastName: 'Name',
          role: 'user', organizationId: 'o',
        },
      },
    };

    mockLogin.mockResolvedValue(loginResponse);
    mockMe.mockResolvedValue({
      data: {
        id: '1', email: 'x@y.com', firstName: 'New', lastName: 'Name',
        role: 'admin', organizationId: 'o',
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('x@y.com', 'pass');
    });

    // Clear mockMe call from login/restore and set fresh mock
    mockMe.mockClear();
    mockMe.mockResolvedValue({
      data: {
        id: '1', email: 'x@y.com', firstName: 'New', lastName: 'Name',
        role: 'admin', organizationId: 'o',
      },
    });

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(result.current.user?.firstName).toBe('New');
    expect(result.current.user?.role).toBe('admin');
  });

  test('refreshUser skips when no access token', async () => {
    mockGetAccessToken.mockReturnValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Clear any mockMe calls from session restore
    mockMe.mockClear();

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(mockMe).not.toHaveBeenCalled();
  });
});
