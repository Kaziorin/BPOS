"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, TENANT_STORAGE_KEY } from "./api";
import { AuthUser } from "./types";

export interface TenantSubscription {
  planCode: "STARTER" | "BUSINESS" | "ENTERPRISE" | string;
  planName: string;
  status: string;
  trialEndsAt?: string | null;
  enabledModules: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  subscription: TenantSubscription | null;
  loading: boolean;
  login: (email: string, password: string, tenantSlug?: string) => Promise<void>;
  register: (data: {
    name: string;
    businessName: string;
    businessType: string;
    email: string;
    password: string;
    phone?: string;
    planCode?: string;
    selectedAddons?: string[];
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeAuthUser(u: any): AuthUser | null {
  if (!u) return null;
  const role = u.roleName || u.role || "";
  return {
    ...u,
    role: role,
    roleName: role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("modernpos_user");
    const storedSub = localStorage.getItem("modernpos_subscription");
    const token = localStorage.getItem("modernpos_token");
    if (storedSub) {
      try {
        setSubscription(JSON.parse(storedSub));
      } catch (e) {}
    }
    if (stored && token) {
      try {
        const parsed = JSON.parse(stored);
        setUser(normalizeAuthUser(parsed));
      } catch (e) {}

      // Validate session with backend DB
      api.get<any>("/auth/me")
        .then((res) => {
          const u = res?.data?.user || res?.user;
          const sub = res?.data?.subscription || res?.subscription;
          if (u) {
            const norm = normalizeAuthUser(u);
            setUser(norm);
            if (norm) {
              localStorage.setItem("modernpos_user", JSON.stringify(norm));
            }
          }
          if (sub) {
            setSubscription(sub);
            localStorage.setItem("modernpos_subscription", JSON.stringify(sub));
          }
        })
        .catch((err: any) => {
          if (err?.status === 401) {
            localStorage.removeItem("modernpos_token");
            localStorage.removeItem("modernpos_user");
            localStorage.removeItem("modernpos_subscription");
            localStorage.removeItem(TENANT_STORAGE_KEY);
            setUser(null);
            setSubscription(null);
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
      subscription?: TenantSubscription;
    }>("/auth/login", {
      email,
      password,
      tenantSlug,
    });

    // Clear any previous tenant/user cache completely to prevent cross-account contamination
    if (typeof window !== "undefined") {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}
    }

    const normUser = normalizeAuthUser(res.user);
    localStorage.setItem("modernpos_token", res.token);
    if (normUser) {
      localStorage.setItem("modernpos_user", JSON.stringify(normUser));
      setUser(normUser);
    }

    if (res.subscription) {
      setSubscription(res.subscription);
      localStorage.setItem("modernpos_subscription", JSON.stringify(res.subscription));
    }

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
    window.location.href = "/dashboard";
  }

  async function register(data: {
    name: string;
    businessName: string;
    businessType: string;
    email: string;
    password: string;
    phone?: string;
    planCode?: string;
    selectedAddons?: string[];
  }) {
    const res = await api.post<{
      token: string;
      user: AuthUser;
      tenant?: { id: string; slug: string; name: string; businessType?: string };
      subscription?: TenantSubscription;
    }>("/auth/register", data);

    // Clear any previous tenant/user cache completely
    if (typeof window !== "undefined") {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}
    }

    localStorage.setItem("modernpos_token", res.token);
    localStorage.setItem("modernpos_user", JSON.stringify({
      ...res.user,
      role: res.user.roleName || res.user.role || "Owner",
    }));

    if (res.subscription) {
      setSubscription(res.subscription);
      localStorage.setItem("modernpos_subscription", JSON.stringify(res.subscription));
    }

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
    window.location.href = "/dashboard";
  }

  function logout() {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("modernpos_token");
        localStorage.removeItem("modernpos_user");
        localStorage.removeItem("modernpos_subscription");
        localStorage.removeItem(TENANT_STORAGE_KEY);
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}
      setUser(null);
      setSubscription(null);
      window.location.replace("/login");
    } else {
      setUser(null);
      setSubscription(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, subscription, loading, login, register, logout }}>
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
