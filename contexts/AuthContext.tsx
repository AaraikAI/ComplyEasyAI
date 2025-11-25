
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
  register: (name: string, email: string) => Promise<void>;
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
    // In production: Call API to send email with token
    // Simulation: We just verify the user exists
    const user = await api.auth.login(email);
    // Store temp token to simulate "Check your email" state if needed
    console.log(`Magic Link sent to ${email} (Simulated)`);
  };

  const verifyMagicLink = async (email: string) => {
    // Simulation: This would be called when user clicks email link
    const user = await api.auth.login(email);
    if (user) {
      localStorage.setItem('session_token', `jwt_${Date.now()}`); // Mock JWT
      localStorage.setItem('user_data', JSON.stringify(user));
      setUser(user);
    }
  };

  const register = async (name: string, email: string) => {
    const newUser: User = {
      id: `u_${Date.now()}`,
      name,
      email,
      role: 'admin', // First user is admin
      avatar: name.substring(0, 2).toUpperCase(),
      organizationId: 'org1'
    };
    await api.auth.register(newUser);
    // Auto login
    localStorage.setItem('session_token', `jwt_${Date.now()}`);
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
