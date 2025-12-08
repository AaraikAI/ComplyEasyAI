
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, organizationName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Session Check (Simulate HttpOnly Cookie check)
    const storedSession = localStorage.getItem('session_token');
    if (storedSession) {
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      if (userData.id) {
        setUser(userData);
      }
    }
    setIsLoading(false);
  }, []);

  const loginWithMagicLink = async (email: string) => {
    // In production: Call API to send email with magic link token
    await api.auth.requestMagicLink(email);
    // Store temp token to simulate "Check your email" state if needed
    console.log(`Magic Link sent to ${email}`);
  };

  const verifyMagicLink = async (token: string) => {
    // Called when user clicks magic link from email
    const verifiedUser = await api.auth.verifyMagicLink(token);
    if (verifiedUser) {
      localStorage.setItem('session_token', `jwt_${Date.now()}`); // Mock JWT
      localStorage.setItem('user_data', JSON.stringify(verifiedUser));
      setUser(verifiedUser);
    }
  };

  const register = async (name: string, email: string, organizationName?: string) => {
    // Call the API to register the user
    const response: any = await api.auth.register(name, email, organizationName);

    // Create user object from response or construct from input
    const newUser: User = response?.user || {
      id: response?.id || `u_${Date.now()}`,
      name,
      email,
      role: 'admin', // First user is admin
      avatar: name.substring(0, 2).toUpperCase(),
      organizationId: response?.organizationId || 'org1'
    };

    // Auto login after registration
    localStorage.setItem('session_token', response?.accessToken || `jwt_${Date.now()}`);
    localStorage.setItem('user_data', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('session_token');
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
