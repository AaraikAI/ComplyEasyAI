/**
 * Authentication Context
 *
 * Provides authentication state management for the entire mobile app.
 * Handles login, logout, token persistence with expo-secure-store,
 * and automatic session restoration on app launch.
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { api, setTokens, clearTokens, getAccessToken } from '../services/api';

// ============================================================================
// TYPES
// ============================================================================

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  organizationName?: string;
  avatar?: string;
  tier?: string;
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_UPDATE_USER'; payload: Partial<User> };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  updateUser: (data: Partial<User>) => void;
}

// ============================================================================
// REDUCER
// ============================================================================

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'AUTH_CLEAR_ERROR':
      return { ...state, error: null };
    case 'AUTH_UPDATE_USER':
      return state.user
        ? { ...state, user: { ...state.user, ...action.payload } }
        : state;
    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// SECURE STORAGE HELPERS
// ============================================================================

import * as SecureStore from 'expo-secure-store';

async function saveSecure(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

async function getSecure(key: string): Promise<string | null> {
  return await SecureStore.getItemAsync(key);
}

async function deleteSecure(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

// ============================================================================
// PROVIDER
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const savedAccessToken = await getSecure('accessToken');
      const savedRefreshToken = await getSecure('refreshToken');

      if (savedAccessToken && savedRefreshToken) {
        setTokens({
          accessToken: savedAccessToken,
          refreshToken: savedRefreshToken,
        });

        const result = await api.auth.me();
        if (result.data) {
          dispatch({ type: 'AUTH_SUCCESS', payload: normalizeUser(result.data) });
          return;
        }
      }
    } catch {
      // Token expired or invalid - clear and continue to login
      await clearStoredTokens();
    }

    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const normalizeUser = (data: any): User => ({
    id: data.id,
    email: data.email,
    firstName: data.firstName || data.first_name || '',
    lastName: data.lastName || data.last_name || '',
    role: data.role || 'user',
    organizationId: data.organizationId || data.organization_id || '',
    organizationName: data.organizationName || data.organization?.name,
    avatar: data.avatar || data.profileImage,
    tier: data.tier || data.organization?.tier,
    permissions: data.permissions || [],
  });

  const clearStoredTokens = async () => {
    clearTokens();
    await deleteSecure('accessToken');
    await deleteSecure('refreshToken');
  };

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'AUTH_LOADING' });

    try {
      const result = await api.auth.login({ email, password });

      if (result.data?.token) {
        await saveSecure('accessToken', result.data.token);
        if (result.data.refreshToken) {
          await saveSecure('refreshToken', result.data.refreshToken);
        }
      }

      if (result.data?.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: normalizeUser(result.data.user) });
      } else {
        // Fetch user profile if not included in login response
        const meResult = await api.auth.me();
        dispatch({ type: 'AUTH_SUCCESS', payload: normalizeUser(meResult.data) });
      }
    } catch (error: any) {
      const message =
        error.message || 'Login failed. Please check your credentials.';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore logout API errors
    }

    await clearStoredTokens();
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) return;

    try {
      const result = await api.auth.me();
      if (result.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: normalizeUser(result.data) });
      }
    } catch {
      // Silently fail - user data will be stale but app continues
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    dispatch({ type: 'AUTH_UPDATE_USER', payload: data });
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      login,
      logout,
      refreshUser,
      clearError,
      updateUser,
    }),
    [state, login, logout, refreshUser, clearError, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
