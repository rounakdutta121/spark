"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AuthContextValue,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from "@/types/auth";
import {
  apiGetMe,
  apiLogin,
  apiLogout,
  apiRegister,
} from "@/services/auth/auth.api";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await apiGetMe();
      setUser(me);
    } catch {
      setUser(null);
      try {
        await apiLogout();
      } catch {
        // ignore — cookies may already be cleared
      }
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const loggedInUser = await apiLogin(credentials);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const newUser = await apiRegister(credentials);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      register,
      refreshUser,
    }),
    [user, loading, login, logout, register, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
