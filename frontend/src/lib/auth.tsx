/**
 * Auth context + hooks.
 *
 * Mirrors the original React Context (`UserContext.js`) but with:
 * - Strong typing
 * - Proper loading/error states
 * - Automatic refetch on mount and on window focus
 * - Exposed `login`, `register`, `logout` actions that refresh state
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { User } from "@/types";
import { authApi, HttpError } from "./api-client";

interface AuthContextValue {
  user: User | null;
  /** True once the initial whoami call has resolved (success or failure). */
  authChecked: boolean;
  loading: boolean;
  /** Force-refetch the current user. */
  refetch: () => Promise<User | null>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const u = await authApi.whoami();
      setUser(u ?? null);
      return u;
    } catch (err) {
      // 401 is expected when not logged in - don't log noise.
      if (!(err instanceof HttpError && err.status === 401)) {
        console.error("[auth] whoami failed:", err);
      }
      setUser(null);
      return null;
    } finally {
      setAuthChecked(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Refetch on window focus (catches logout in another tab).
  useEffect(() => {
    const onFocus = () => refetch();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refetch]);

  const login = useCallback(
    async (username: string, password: string) => {
      await authApi.login(username, password);
      await refetch();
    },
    [refetch],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      await authApi.register(username, email, password);
      // Don't auto-login - account must be activated first via email link.
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Even if the server call fails (e.g. already expired), clear locally.
      console.error("[auth] logout failed:", err);
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, authChecked, loading, refetch, login, register, logout }),
    [user, authChecked, loading, refetch, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }
  return ctx;
}

/** Convenience hook: is the current user a vendor? */
export function useIsVendor(): boolean {
  const { user } = useAuth();
  return Boolean(user && (user.is_vendor === 1 || user.is_vendor === true));
}
