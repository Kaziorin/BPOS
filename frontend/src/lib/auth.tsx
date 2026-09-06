"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, TENANT_STORAGE_KEY } from "./api";
import { AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, tenantSlug?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("modernpos_user");
    const token = localStorage.getItem("modernpos_token");
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string, tenantSlug?: string) {
    const res = await api.post<{ token: string; user: AuthUser }>("/auth/login", {
      email,
      password,
      tenantSlug,
    });
    localStorage.setItem("modernpos_token", res.token);
    localStorage.setItem("modernpos_user", JSON.stringify({ ...res.user, role: res.user.roleName }));

    // Set tenant context for multi-tenant API endpoints (v1)
    // Use the tenantId from the user object returned by the new auth system
    if (res.user.tenantId) {
      localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify({
        id: res.user.tenantId,
        slug: tenantSlug || "demo-shop", // Fallback if slug not provided
        name: "Blue Ocean POS",
      }));
    }

    setUser(res.user);
    router.push("/dashboard");
  }

  function logout() {
    localStorage.removeItem("modernpos_token");
    localStorage.removeItem("modernpos_user");
    localStorage.removeItem(TENANT_STORAGE_KEY);
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
