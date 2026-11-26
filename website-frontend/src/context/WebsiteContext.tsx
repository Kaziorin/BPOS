"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { INDUSTRY_PRESETS, IndustryPreset } from "@/lib/presets";

const API_ROOT = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const API = `${API_ROOT}/v1/storefront`;

export type HeroBgStyle = "constellation" | "aurora" | "particles" | "grid" | "slider";

export interface WebsiteConfig {
  businessName?: string;
  tagline?: string;
  logoUrl?: string;
  heroBgStyle?: HeroBgStyle;
  heroImages?: string[];
  industry?: string;
  accentColor?: string;
  heroPill?: string;
  heroTitle?: string;
  heroDesc?: string;
  aboutTitle?: string;
  aboutText?: string;
  years?: string;
  ctaText?: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  highlights?: [string, string][];
}

export interface ShowcaseProduct {
  id: string;
  name: string;
  sellingPrice?: number;
  price?: number;
  imageUrl?: string;
  categoryName?: string;
}

export interface ShowcaseCategory {
  id: string;
  name: string;
}

export interface ResolvedSiteState {
  key: string;
  preset: IndustryPreset;
  accent: string;
  storeName: string;
  tagline: string;
  logoUrl: string;
  heroBgStyle: HeroBgStyle;
  heroImages: string[];
  pill: string;
  title: string;
  desc: string;
  cta: string;
  aboutTitle: string;
  aboutText: string;
  years: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  highlights: [string, string][];
}

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface WebsiteContextValue {
  site: ResolvedSiteState;
  products: ShowcaseProduct[];
  categories: ShowcaseCategory[];
  loading: boolean;
  isAdmin: boolean;
  adminOpen: boolean;
  setAdminOpen: (open: boolean) => void;
  setIndustryPreview: (industry: string) => void;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  saveConfig: (payload: WebsiteConfig) => Promise<boolean>;
  submitInquiry: (body: { name: string; phone: string; email?: string; message?: string }) => Promise<{ ok: boolean; message: string }>;
  fetchInquiries: () => Promise<Array<{ id: string; name: string; phone: string; message?: string }>>;
  toasts: ToastMessage[];
  notify: (message: string, type?: ToastMessage["type"]) => void;
  dismissToast: (id: string) => void;
}

const WebsiteContext = createContext<WebsiteContextValue | undefined>(undefined);

function readToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("salepay_website_token") || localStorage.getItem("token") || "";
}

export function WebsiteProvider({ children }: { children: React.ReactNode }) {
  const [savedConfig, setSavedConfig] = useState<WebsiteConfig>({});
  const [tenantMeta, setTenantMeta] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<ShowcaseProduct[]>([]);
  const [categories, setCategories] = useState<ShowcaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const notify = (message: string, type: ToastMessage["type"] = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  useEffect(() => {
    setIsAdmin(Boolean(readToken()));
    const params = new URLSearchParams(window.location.search);
    const urlIndustry = params.get("industry") || params.get("businessType");

    Promise.all([
      fetch(`${API}/website`).then((r) => r.json()).catch(() => ({})),
      fetch(`${API}/categories`).then((r) => r.json()).catch(() => ({})),
      fetch(`${API}/products?limit=40`).then((r) => r.json()).catch(() => ({})),
    ])
      .then(([webRes, catRes, prodRes]) => {
        setTenantMeta(webRes?.data?.tenant || {});
        const cfg: WebsiteConfig = webRes?.data?.config || {};
        if (urlIndustry) cfg.industry = urlIndustry;
        setSavedConfig(cfg);
        setCategories(Array.isArray(catRes?.data) ? catRes.data : []);
        const prods = Array.isArray(prodRes?.data?.items)
          ? prodRes.data.items
          : Array.isArray(prodRes?.data)
          ? prodRes.data
          : [];
        setProducts(prods);
      })
      .finally(() => setLoading(false));
  }, []);

  const site = useMemo<ResolvedSiteState>(() => {
    const industry = (savedConfig.industry || tenantMeta.businessType || "RETAIL").toUpperCase();
    const key = Object.keys(INDUSTRY_PRESETS).find((k) => industry.includes(k)) || "RETAIL";
    const preset = INDUSTRY_PRESETS[key];
    const highlights =
      Array.isArray(savedConfig.highlights) && savedConfig.highlights.length === 3
        ? savedConfig.highlights
        : preset.highlights;

    return {
      key,
      preset,
      accent: savedConfig.accentColor || preset.accent,
      storeName: savedConfig.businessName || tenantMeta.name || "SalePay Business",
      tagline: savedConfig.tagline || preset.label,
      logoUrl: savedConfig.logoUrl || tenantMeta.logoUrl || "/logos/salepay-logo-blue.png",
      heroBgStyle: savedConfig.heroBgStyle || "constellation",
      heroImages: Array.isArray(savedConfig.heroImages) ? savedConfig.heroImages.filter(Boolean) : [],
      pill: savedConfig.heroPill || preset.pill,
      title: savedConfig.heroTitle || preset.title,
      desc: savedConfig.heroDesc || preset.desc,
      cta: savedConfig.ctaText || preset.cta,
      aboutTitle: savedConfig.aboutTitle || "Crafted With Quality & Care",
      aboutText:
        savedConfig.aboutText ||
        "We are committed to delivering exceptional quality, authentic products, and memorable customer experiences every single day.",
      years: savedConfig.years || "5+",
      phone: savedConfig.phone || tenantMeta.contactPhone || "+880 1700-000000",
      email: savedConfig.email || tenantMeta.contactEmail || "info@salepay.io",
      address: savedConfig.address || "Dhaka, Bangladesh",
      hours: savedConfig.hours || "Sat - Thu: 10:00 AM - 10:00 PM",
      highlights,
    };
  }, [savedConfig, tenantMeta]);

  const setIndustryPreview = (industry: string) => {
    setSavedConfig((prev) => ({
      ...prev,
      industry,
      accentColor: undefined,
      heroPill: undefined,
      heroTitle: undefined,
      heroDesc: undefined,
      ctaText: undefined,
      highlights: undefined,
    }));
  };

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_ROOT}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      const token = json.accessToken || json.token || json.data?.accessToken || json.data?.token;
      if (res.ok && token) {
        localStorage.setItem("salepay_website_token", token);
        setIsAdmin(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const adminLogout = () => {
    localStorage.removeItem("salepay_website_token");
    localStorage.removeItem("token");
    setIsAdmin(false);
    setAdminOpen(false);
  };

  const saveConfig = async (payload: WebsiteConfig): Promise<boolean> => {
    const token = readToken();
    if (!token) return false;
    try {
      const res = await fetch(`${API}/website`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSavedConfig(payload);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const submitInquiry = async (body: { name: string; phone: string; email?: string; message?: string }) => {
    try {
      const res = await fetch(`${API}/website/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      return {
        ok: res.ok,
        message: json?.data?.message || json?.message || (res.ok ? "Inquiry submitted!" : "Failed to submit."),
      };
    } catch {
      return { ok: false, message: "Failed to connect to server." };
    }
  };

  const fetchInquiries = async () => {
    const token = readToken();
    if (!token) return [];
    try {
      const res = await fetch(`${API}/website/inquiries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return json?.data?.inquiries || [];
    } catch {
      return [];
    }
  };

  return (
    <WebsiteContext.Provider
      value={{
        site,
        products,
        categories,
        loading,
        isAdmin,
        adminOpen,
        setAdminOpen,
        setIndustryPreview,
        adminLogin,
        adminLogout,
        saveConfig,
        submitInquiry,
        fetchInquiries,
        toasts,
        notify,
        dismissToast,
      }}
    >
      {children}
    </WebsiteContext.Provider>
  );
}

export function useWebsite() {
  const ctx = useContext(WebsiteContext);
  if (!ctx) throw new Error("useWebsite must be used within WebsiteProvider");
  return ctx;
}
