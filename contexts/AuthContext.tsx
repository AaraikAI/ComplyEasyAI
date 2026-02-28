
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithMagicLink: (email: string) => Promise<{ message: string; email: string; devToken?: string }>;
  verifyMagicLink: (token: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, organizationName?: string, password?: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial load - runs only once on mount
  // Auth tokens are in httpOnly cookies (not accessible from JS).
  // We restore the cached user profile from localStorage (non-sensitive display data).
  useEffect(() => {
    try {
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData && userData.id) {
          setUser(userData);
        }
      }
    } catch {
      // Invalid cached user data, clear it
      localStorage.removeItem('user_data');
    }
    setIsLoading(false);
  }, []); // Empty dependency array - runs only once on mount

  // When user has no organization.plan (e.g. from old session), fetch org to get plan for tier gating
  useEffect(() => {
    if (!user || user.organization?.plan) return;
    let isMounted = true;
    api.organization.get().then((org: any) => {
      if (!isMounted || !org?.id) return;
      const updated = { ...user, organization: { id: org.id, name: org.name || '', plan: org.plan || 'Foundation' } };
      setUser(updated);
      try {
        localStorage.setItem('user_data', JSON.stringify(updated));
      } catch {
        // localStorage write failed, continue without caching
      }
    }).catch(() => {
      // Organization fetch failed, user will work without plan info
    });
    return () => { isMounted = false; };
  }, [user?.id, user?.organization?.plan]);

  // Periodic token refresh - runs when user is set and refreshes every 6 hours
  // Refresh token is in httpOnly cookie — sent automatically by the browser
  useEffect(() => {
    if (!user) {
      return;
    }

    const refreshInterval = setInterval(async () => {
      try {
        await api.auth.refreshToken();
      } catch {
        // Token refresh failed - user will be prompted to re-authenticate on next API call
      }
    }, 6 * 60 * 60 * 1000); // 6 hours

    return () => clearInterval(refreshInterval);
  }, [user]);

  const loginWithMagicLink = async (email: string) => {
    try {
      // Call API to send magic link email
      const response = await api.auth.requestMagicLink(email);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const verifyMagicLink = async (token: string) => {
    try {
      // Call API to verify magic link token
      const user = await api.auth.verifyMagicLink(token);
      if (user) {
        // The API service already handles storing the token and user data
        setUser(user);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, organizationName?: string, password?: string) => {
    try {
      // Call API to register new user
      const response: any = await api.auth.register(name, email, organizationName, password);
      
      // Check if user already exists - backend now sends magic link automatically
      if (response?.existingUser) {
        // User already exists, backend sent magic link
        return response;
      }
      
      // Registration returns user info, and backend already sent a magic link
      // The user will need to verify via the magic link sent to their email
      if (response && response.user) {
        // Store partial user data (will be completed after magic link verification)
        const partialUser: User = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: 'admin',
          avatar: name.substring(0, 2).toUpperCase(),
          organizationId: response.user.organizationId || 'org1' // Will be updated after verification
        };
        localStorage.setItem('user_data', JSON.stringify(partialUser));
        // Don't set user yet - wait for magic link verification
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    // Call backend to clear httpOnly cookies and blacklist tokens
    await api.auth.logout();
    // Clear non-sensitive cached user profile data
    localStorage.removeItem('user_data');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      loginWithMagicLink, 
      verifyMagicLink,
      logout,
      register
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
