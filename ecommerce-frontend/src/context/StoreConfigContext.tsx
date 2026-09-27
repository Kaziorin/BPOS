"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { StorefrontAPI, StoreConfig, getTenantSlug } from "@/lib/api";

interface StoreConfigContextType {
  config: StoreConfig | null;
  loading: boolean;
  tenantSlug: string;
  businessType: string;
  storeName: string;
  currency: string;
  formatPrice: (amount: number) => string;
  refreshConfig: () => Promise<void>;
}

const StoreConfigContext = createContext<StoreConfigContextType | undefined>(undefined);

export function StoreConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantSlug, setTenantSlug] = useState<string>("");

  const loadConfig = async () => {
    try {
      setLoading(true);
      const slug = getTenantSlug();
      setTenantSlug(slug);
      const res = await StorefrontAPI.getConfig();
      setConfig(res);
    } catch (err) {
      console.error("Failed to load store config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const businessType = config?.businessType || config?.tenant?.businessType || "RETAIL";
  const storeName = config?.tenant?.name || "Store";
  const currency = config?.tenant?.currency || "BDT";

  const formatPrice = (amount: number) => {
    const sym = currency === "BDT" ? "৳" : currency === "USD" ? "$" : currency;
    return `${sym}${Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <StoreConfigContext.Provider
      value={{
        config,
        loading,
        tenantSlug,
        businessType,
        storeName,
        currency,
        formatPrice,
        refreshConfig: loadConfig,
      }}
    >
      {children}
    </StoreConfigContext.Provider>
  );
}

export function useStoreConfig() {
  const ctx = useContext(StoreConfigContext);
  if (!ctx) {
    throw new Error("useStoreConfig must be used within a StoreConfigProvider");
  }
  return ctx;
}
