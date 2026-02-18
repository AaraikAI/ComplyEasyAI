
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithMagicLink: (email: string) => Promise<{ devToken?: string; message: string; email: string }>;
  verifyMagicLink: (token: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, organizationName?: string, password?: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial load - runs only once on mount
  useEffect(() => {
    // Session Check - look for auth token or session token
    const authToken = localStorage.getItem('authToken');
    const storedSession = localStorage.getItem('session_token');
    
    if (authToken || storedSession) {
      try {
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData && userData.id) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
        // Clear invalid data
        localStorage.removeItem('user_data');
      }
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
      } catch (_) {}
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [user?.id, user?.organization?.plan]);

  // Periodic token refresh - runs when user is set and refreshes every 6 hours
  useEffect(() => {
    if (!user) {
      return; // Don't set up refresh if no user
    }

    // Set up periodic token refresh (every 6 hours)
    const refreshInterval = setInterval(async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const newToken = await api.auth.refreshToken();
          // Token is automatically stored by the API service
          console.log('Token refreshed successfully');
        } catch (error) {
          console.error('Token refresh failed:', error);
          // If refresh fails, user will be logged out on next API call
        }
      }
    }, 6 * 60 * 60 * 1000); // 6 hours

    return () => clearInterval(refreshInterval);
  }, [user]); // Only runs when user changes

  const loginWithMagicLink = async (email: string) => {
    try {
      // Call API to send magic link email
      // In development, this returns the token for testing
      const response = await api.auth.requestMagicLink(email);
      console.log(`Magic Link sent to ${email}`);
      // Return response so we can access devToken in development
      return response;
    } catch (error) {
      console.error('Failed to send magic link:', error);
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
      console.error('Failed to verify magic link:', error);
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
        // Return the response so caller can handle the devToken if in development
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
      console.error('Failed to register:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear all auth-related storage
    localStorage.removeItem('session_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user_data');
    // Also call API logout to clear server-side session
    api.auth.logout();
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
