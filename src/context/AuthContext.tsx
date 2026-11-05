import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AuthContextType, AuditorRole } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_USER: UserProfile = {
  id: 'usr-default-01',
  name: 'Security Lead',
  email: 'santhu246kumar@gmail.com',
  role: 'Lead Security Architect',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  joinedAt: 'Nov 2026',
  totalAuditsRun: 12
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('sentinel_auth_user');
      if (stored) {
        return JSON.parse(stored);
      }
      return DEFAULT_USER; // Default logged in as security auditor
    } catch {
      return DEFAULT_USER;
    }
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('sentinel_auth_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('sentinel_auth_user');
      }
    } catch {
      // Ignore storage errors
    }
  }, [user]);

  const login = (email: string, name?: string, role?: AuditorRole) => {
    const formattedName = name && name.trim() ? name.trim() : email.split('@')[0];
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: formattedName,
      email: email.trim(),
      role: role || 'Lead Security Architect',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      totalAuditsRun: 0
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  const incrementAuditCount = () => {
    setUser(prev => prev ? { ...prev, totalAuditsRun: prev.totalAuditsRun + 1 } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        login,
        logout,
        incrementAuditCount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
