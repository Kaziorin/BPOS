"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  GlobalThemeId,
  GLOBAL_THEMES,
  resolveThemeForTenant,
  isUserAdmin,
  getRouteBusinessType,
} from "@/lib/theme";
import { TENANT_STORAGE_KEY } from "@/lib/api";

interface ThemeContextType {
  theme: GlobalThemeId;
  setTheme: (theme: GlobalThemeId) => void;
  businessType: string | null;
  resetToBusinessDefault: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "ocean-teal",
  setTheme: () => {},
  businessType: null,
  resetToBusinessDefault: () => {},
});

const STORAGE_KEY = "bpos_active_theme";
const ADMIN_STORAGE_KEY = "bpos_admin_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<GlobalThemeId>("ocean-teal");
  const [businessType, setBusinessType] = useState<string | null>(null);
  const pathname = usePathname();

  const applyTheme = useCallback((themeId: GlobalThemeId) => {
    if (!GLOBAL_THEMES[themeId]) return;
    setThemeState(themeId);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", themeId);
    }
  }, []);

  const syncThemeFromContext = useCallback(() => {
    try {
      let bType: string | null = null;
      let tenantId: string | null = null;
      let currentUser: any = null;

      // 1. Read current user from localStorage
      if (typeof window !== "undefined") {
        const rawUser = localStorage.getItem("modernpos_user");
        if (rawUser) {
          try {
            currentUser = JSON.parse(rawUser);
            bType = currentUser.businessType || null;
            tenantId = currentUser.tenantId || null;
          } catch {}
        }

        // 2. Read tenant storage
        const rawTenant = localStorage.getItem(TENANT_STORAGE_KEY);
        if (rawTenant) {
          try {
            const parsed = JSON.parse(rawTenant);
            if (parsed.businessType) bType = parsed.businessType;
            if (parsed.id) tenantId = parsed.id;
          } catch {}
        }
      }

      setBusinessType(bType);

      // A. If navigating inside a specific business vertical route, apply that business theme
      const routeTheme = getRouteBusinessType(pathname);
      if (routeTheme) {
        applyTheme(routeTheme);
        return;
      }

      // B. If user is Admin / Super Administrator, default to 'ocean-teal' (Blue Ocean Default)
      const admin = isUserAdmin(currentUser);
      if (admin) {
        const adminSaved = typeof window !== "undefined"
          ? (localStorage.getItem(ADMIN_STORAGE_KEY) as GlobalThemeId)
          : null;
        if (adminSaved && GLOBAL_THEMES[adminSaved]) {
          applyTheme(adminSaved);
        } else {
          applyTheme("ocean-teal");
        }
        return;
      }

      // C. If tenant user (dedicated business vertical account), apply business theme
      const tenantThemeKey = tenantId ? `${STORAGE_KEY}_${tenantId}` : STORAGE_KEY;
      const saved = typeof window !== "undefined"
        ? ((localStorage.getItem(tenantThemeKey) || localStorage.getItem(STORAGE_KEY)) as GlobalThemeId)
        : null;

      const resolved = resolveThemeForTenant(bType, saved);
      applyTheme(resolved);
    } catch {
      applyTheme("ocean-teal");
    }
  }, [applyTheme, pathname]);

  useEffect(() => {
    syncThemeFromContext();

    const handleTenantChanged = () => syncThemeFromContext();
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === TENANT_STORAGE_KEY ||
        e.key === STORAGE_KEY ||
        e.key === ADMIN_STORAGE_KEY ||
        e.key?.startsWith(STORAGE_KEY) ||
        e.key === "modernpos_user"
      ) {
        syncThemeFromContext();
      }
    };

    window.addEventListener("bpos:tenant-changed", handleTenantChanged);
    window.addEventListener("bpos:theme-changed", handleTenantChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("bpos:tenant-changed", handleTenantChanged);
      window.removeEventListener("bpos:theme-changed", handleTenantChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, [syncThemeFromContext]);

  const setTheme = (newTheme: GlobalThemeId) => {
    if (!GLOBAL_THEMES[newTheme]) return;
    try {
      if (typeof window !== "undefined") {
        let currentUser: any = null;
        let tenantId: string | null = null;

        const rawUser = localStorage.getItem("modernpos_user");
        if (rawUser) {
          try {
            currentUser = JSON.parse(rawUser);
            tenantId = currentUser.tenantId || null;
          } catch {}
        }
        const rawTenant = localStorage.getItem(TENANT_STORAGE_KEY);
        if (rawTenant) {
          try {
            const parsed = JSON.parse(rawTenant);
            if (parsed.id) tenantId = parsed.id;
          } catch {}
        }

        if (isUserAdmin(currentUser)) {
          localStorage.setItem(ADMIN_STORAGE_KEY, newTheme);
        } else {
          const tenantThemeKey = tenantId ? `${STORAGE_KEY}_${tenantId}` : STORAGE_KEY;
          localStorage.setItem(tenantThemeKey, newTheme);
          localStorage.setItem(STORAGE_KEY, newTheme);
        }
      }
    } catch {}

    applyTheme(newTheme);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("bpos:theme-changed"));
    }
  };

  const resetToBusinessDefault = () => {
    try {
      if (typeof window !== "undefined") {
        let currentUser: any = null;
        let tenantId: string | null = null;
        const rawUser = localStorage.getItem("modernpos_user");
        if (rawUser) {
          try {
            currentUser = JSON.parse(rawUser);
            tenantId = currentUser.tenantId || null;
          } catch {}
        }
        const rawTenant = localStorage.getItem(TENANT_STORAGE_KEY);
        if (rawTenant) {
          try {
            const parsed = JSON.parse(rawTenant);
            if (parsed.id) tenantId = parsed.id;
          } catch {}
        }

        if (isUserAdmin(currentUser)) {
          localStorage.removeItem(ADMIN_STORAGE_KEY);
        } else {
          if (tenantId) localStorage.removeItem(`${STORAGE_KEY}_${tenantId}`);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {}

    syncThemeFromContext();
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, businessType, resetToBusinessDefault }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
