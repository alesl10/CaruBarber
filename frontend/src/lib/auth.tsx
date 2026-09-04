'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, setToken } from './api';
import { Usuario } from './types';

interface AuthState {
  user: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  register: (data: {
    nombre: string;
    email: string;
    password: string;
    telefono?: string;
  }) => Promise<Usuario>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api<Usuario>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api<{ token: string; user: Usuario }>('/auth/login', {
      body: { email, password },
    });
    setToken(token);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(
    async (data: { nombre: string; email: string; password: string; telefono?: string }) => {
      const { token, user } = await api<{ token: string; user: Usuario }>('/auth/register', {
        body: data,
      });
      setToken(token);
      setUser(user);
      return user;
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, cargando, login, register, logout }),
    [user, cargando, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
