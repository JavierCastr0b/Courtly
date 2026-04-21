import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { getToken, setToken, removeToken } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getToken()
      .then(token => {
        if (token) return usersApi.me();
        return null;
      })
      .then(me => setUser(me))
      .catch(() => removeToken())
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const { token } = await authApi.login(username, password);
    await setToken(token);
    const me = await usersApi.me();
    setUser(me);
  };

  const register = async (name: string, username: string, email: string, password: string) => {
    const { token } = await authApi.register(name, username, email, password);
    await setToken(token);
    const me = await usersApi.me();
    setUser(me);
  };

  const logout = async () => {
    await removeToken();
    setUser(null);
  };

  const refreshUser = async () => {
    const me = await usersApi.me();
    setUser(me);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
