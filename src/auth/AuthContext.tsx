import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, setToken, clearToken, ApiError } from '../shared/api/client';

export interface AuthUser {
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  loginDemo: () => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => void;
}

const STORAGE_KEY = 'pharmaco_auth_user';

export const DEMO_USER: AuthUser = {
  name: 'Salil Timalsina',
  email: 'admin@gmail.com',
};

const DEMO_PASSWORD = 'password123';

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

interface LoginResponse {
  id: number;
  name: string;
  email: string;
  token: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const setSession = (u: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  };

  const login: AuthContextValue['login'] = async (email, password) => {
    if (!email.trim() || !password.trim()) {
      return { ok: false, message: 'Enter both email and password.' };
    }
    try {
      const res = await api.post<LoginResponse>('/login', { email, password });
      setToken(res.token);
      setSession({ name: res.name, email: res.email });
      return { ok: true };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Could not reach the server.';
      return { ok: false, message };
    }
  };

  const loginDemo: AuthContextValue['loginDemo'] = () => login(DEMO_USER.email, DEMO_PASSWORD);

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    clearToken();
    setUser(null);
  };

  // The API client clears the token on any 401 but has no way to reach this
  // context directly - it signals here instead, so a dead/expired session
  // drops the cached user and the route guard sends you back to /login.
  useEffect(() => {
    window.addEventListener('auth:unauthorized', logout);
    return () => window.removeEventListener('auth:unauthorized', logout);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
