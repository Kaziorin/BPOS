"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, TENANT_STORAGE_KEY } from "./api";
import { AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, tenantSlug?: string) => Promise<void>;
  register: (data: {
    name: string;
    businessName: string;
    businessType: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
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
      try {
        setUser(JSON.parse(stored));
      } catch (e) {}

      // Validate session with backend DB
      api.get<any>("/auth/me")
        .then((res) => {
          const u = res?.data?.user || res?.user;
          if (u) {
            setUser(u);
          }
        })
        .catch((err: any) => {
          if (err?.status === 401) {
            localStorage.removeItem("modernpos_token");
            localStorage.removeItem("modernpos_user");
            localStorage.removeItem(TENANT_STORAGE_KEY);
            setUser(null);
            router.push("/login");
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [router]);

  async function login(email: string, password: string, tenantSlug?: string) {
    const res = await api.post<{
      token: string;
      user: AuthUser;
      tenant?: { id: string; slug: string; name: string; businessType?: string };
    }>("/auth/login", {
      email,
      password,
      tenantSlug,
    });

    localStorage.setItem("modernpos_token", res.token);
    localStorage.setItem("modernpos_user", JSON.stringify({
      ...res.user,
      role: res.user.roleName || res.user.role,
    }));

    // Set tenant context for multi-tenant API endpoints (v1)
    const tenantInfo = res.tenant || {
      id: res.user.tenantId,
      slug: tenantSlug || res.user.tenantId,
      name: "Blue Ocean POS",
      businessType: res.user.businessType || "RETAIL",
    };

    localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify({
      id: tenantInfo.id || res.user.tenantId,
      slug: tenantInfo.slug || tenantInfo.id || res.user.tenantId,
      name: tenantInfo.name || "Blue Ocean POS",
      businessType: tenantInfo.businessType || res.user.businessType || "RETAIL",
    }));

    setUser(res.user);
    router.push("/dashboard");
  }

  async function register(data: {
    name: string;
    businessName: string;
    businessType: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const res = await api.post<{
      token: string;
      user: AuthUser;
      tenant?: { id: string; slug: string; name: string; businessType?: string };
    }>("/auth/register", data);

    localStorage.setItem("modernpos_token", res.token);
    localStorage.setItem("modernpos_user", JSON.stringify({
      ...res.user,
      role: res.user.roleName || res.user.role || "Owner",
    }));

    const tenantInfo = res.tenant || {
      id: res.user.tenantId,
      slug: res.user.tenantId,
      name: data.businessName || "Blue Ocean POS",
      businessType: data.businessType || "RETAIL",
    };

    localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify({
      id: tenantInfo.id || res.user.tenantId,
      slug: tenantInfo.slug || tenantInfo.id || res.user.tenantId,
      name: tenantInfo.name || data.businessName,
      businessType: tenantInfo.businessType || data.businessType || "RETAIL",
    }));

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
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
