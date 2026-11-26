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
  navHome?: string;
  navAbout?: string;
  navHighlights?: string;
  navShowcase?: string;
  navContact?: string;
  headerCtaText?: string;
  headerCtaHref?: string;
  footerDesc?: string;
  footerBadge?: string;
  footerCtaText?: string;
  footerCopyright?: string;
  footerBgColor?: string;
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
  navHome: string;
  navAbout: string;
  navHighlights: string;
  navShowcase: string;
  navContact: string;
  headerCtaText: string;
  headerCtaHref: string;
  footerDesc: string;
  footerBadge: string;
  footerCtaText: string;
  footerCopyright: string;
  footerBgColor: string;
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
  isSuperAdmin: boolean;
  configVersion: number;
  adminOpen: boolean;
  setAdminOpen: (open: boolean) => void;
  setPreviewDraft: (draft: WebsiteConfig | null) => void;
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

function readTenantId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("salepay_website_tenant_id") || "";
}

function parseJwtPayload(token: string): Record<string, string> {
  try {
    const part = token.split(".")[1];
    if (!part) return {};
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

function checkIsSuperAdmin(token: string): boolean {
  const payload = parseJwtPayload(token);
  const role = (payload.roleName || "").toLowerCase();
  const email = (payload.email || "").toLowerCase();
  return role === "super admin" || role === "superadmin" || role === "system admin" || email === "admin@gmail.com";
}

export function WebsiteProvider({ children }: { children: React.ReactNode }) {
  const [savedConfig, setSavedConfig] = useState<WebsiteConfig>({});
  const [previewDraft, setPreviewDraft] = useState<WebsiteConfig | null>(null);
  const [tenantMeta, setTenantMeta] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<ShowcaseProduct[]>([]);
  const [categories, setCategories] = useState<ShowcaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [configVersion, setConfigVersion] = useState(0);
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

  const loadTenantData = async (tid: string, token: string, urlIndustry?: string | null) => {
    const headers: Record<string, string> = {};
    if (tid) headers["x-tenant-id"] = tid;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const [webRes, catRes, prodRes] = await Promise.all([
        fetch(`${API}/website`, { headers }).then((r) => r.json()).catch(() => ({})),
        fetch(`${API}/categories`, { headers }).then((r) => r.json()).catch(() => ({})),
        fetch(`${API}/products?limit=40`, { headers }).then((r) => r.json()).catch(() => ({})),
      ]);
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
      setConfigVersion((v) => v + 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = readToken();
    const params = new URLSearchParams(window.location.search);
    const urlIndustry = params.get("industry") || params.get("businessType");
    const urlTenant = params.get("tenant") || params.get("tenantId");
    const jwtPayload = token ? parseJwtPayload(token) : {};
    const tid = urlTenant || jwtPayload.tenantId || readTenantId();

    setIsAdmin(Boolean(token));
    setIsSuperAdmin(token ? checkIsSuperAdmin(token) : false);
    if (tid) {
      setTenantId(tid);
      localStorage.setItem("salepay_website_tenant_id", tid);
    }

    loadTenantData(tid, token, urlIndustry);
  }, []);

  const site = useMemo<ResolvedSiteState>(() => {
    const activeConfig = previewDraft ? { ...savedConfig, ...previewDraft } : savedConfig;
    const lockedByTenant = !isSuperAdmin && Boolean(tenantMeta.businessType);
    const industry = (
      lockedByTenant
        ? tenantMeta.businessType
        : activeConfig.industry || tenantMeta.businessType || "RETAIL"
    ).toUpperCase();
    const key = Object.keys(INDUSTRY_PRESETS).find((k) => industry.includes(k)) || "RETAIL";
    const preset = INDUSTRY_PRESETS[key];
    const staleFranchiseCopy =
      key !== "FRANCHISE" &&
      (activeConfig.heroTitle === "Unified Multi-Outlet Brand Experience" ||
        activeConfig.heroPill === "Multi-Branch Network");
    const configMatchesIndustry =
      !staleFranchiseCopy &&
      (!lockedByTenant ||
        !activeConfig.industry ||
        activeConfig.industry.toUpperCase() === key);
    const highlights =
      configMatchesIndustry && Array.isArray(activeConfig.highlights) && activeConfig.highlights.length === 3
        ? activeConfig.highlights
        : preset.highlights;

    return {
      key,
      preset,
      accent: (configMatchesIndustry ? activeConfig.accentColor : undefined) ?? preset.accent,
      storeName: activeConfig.businessName ?? tenantMeta.name ?? "SalePay Business",
      tagline: (configMatchesIndustry ? activeConfig.tagline : undefined) ?? preset.label,
      logoUrl: activeConfig.logoUrl ?? tenantMeta.logoUrl ?? "/logos/salepay-logo-blue.png",
      heroBgStyle: activeConfig.heroBgStyle || "constellation",
      heroImages: Array.isArray(activeConfig.heroImages) ? activeConfig.heroImages.filter(Boolean) : [],
      pill: (configMatchesIndustry ? activeConfig.heroPill : undefined) ?? preset.pill,
      title: (configMatchesIndustry ? activeConfig.heroTitle : undefined) ?? preset.title,
      desc: (configMatchesIndustry ? activeConfig.heroDesc : undefined) ?? preset.desc,
      cta: (configMatchesIndustry ? activeConfig.ctaText : undefined) ?? preset.cta,
      aboutTitle: activeConfig.aboutTitle ?? "Crafted With Quality & Care",
      aboutText:
        activeConfig.aboutText ??
        "We are committed to delivering exceptional quality, authentic products, and memorable customer experiences every single day.",
      years: activeConfig.years ?? "5+",
      phone: activeConfig.phone ?? tenantMeta.contactPhone ?? "+880 1700-000000",
      email: activeConfig.email ?? tenantMeta.contactEmail ?? "info@salepay.io",
      address: activeConfig.address ?? "Dhaka, Bangladesh",
      hours: activeConfig.hours ?? "Sat - Thu: 10:00 AM - 10:00 PM",
      highlights,
      navHome: activeConfig.navHome ?? "Home",
      navAbout: activeConfig.navAbout ?? "About Us",
      navHighlights: activeConfig.navHighlights ?? "Highlights",
      navShowcase: activeConfig.navShowcase ?? "Showcase",
      navContact: activeConfig.navContact ?? "Contact",
      headerCtaText: activeConfig.headerCtaText ?? "Book / Contact Us",
      headerCtaHref: activeConfig.headerCtaHref || "/contact",
      footerDesc:
        activeConfig.footerDesc ??
        activeConfig.aboutText ??
        "We are committed to delivering exceptional quality, authentic products, and memorable customer experiences every single day.",
      footerBadge: activeConfig.footerBadge ?? `${activeConfig.years || "5+"} Years of Trusted Service`,
      footerCtaText: activeConfig.footerCtaText ?? "Book / Contact Us",
      footerCopyright:
        activeConfig.footerCopyright ??
        `© ${new Date().getFullYear()} ${activeConfig.businessName || tenantMeta.name || "SalePay Business"}. All rights reserved.`,
      footerBgColor: activeConfig.footerBgColor || "#060913",
    };
  }, [savedConfig, previewDraft, tenantMeta, isSuperAdmin]);

  const setIndustryPreview = (industry: string) => {
    if (!isSuperAdmin) return;
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
        const jwtPayload = parseJwtPayload(token);
        const tid =
          json.user?.tenantId ||
          json.data?.user?.tenantId ||
          jwtPayload.tenantId ||
          readTenantId();
        const superFlag = checkIsSuperAdmin(token);
        if (tid) {
          localStorage.setItem("salepay_website_tenant_id", tid);
          setTenantId(tid);
        }
        setIsAdmin(true);
        setIsSuperAdmin(superFlag);
        setPreviewDraft(null);
        await loadTenantData(tid, token);
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
    setPreviewDraft(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setAdminOpen(false);
  };

  const saveConfig = async (payload: WebsiteConfig): Promise<boolean> => {
    const token = readToken();
    const tid = tenantId || readTenantId() || parseJwtPayload(token).tenantId || "";
    if (!token) return false;
    const finalPayload: WebsiteConfig =
      !isSuperAdmin && tenantMeta.businessType
        ? { ...payload, industry: tenantMeta.businessType }
        : payload;
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      if (tid) headers["x-tenant-id"] = tid;
      const res = await fetch(`${API}/website`, {
        method: "PUT",
        headers,
        body: JSON.stringify(finalPayload),
      });
      if (res.ok) {
        setSavedConfig(finalPayload);
        setPreviewDraft(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const submitInquiry = async (body: { name: string; phone: string; email?: string; message?: string }) => {
    try {
      const tid = tenantId || readTenantId();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (tid) headers["x-tenant-id"] = tid;
      const res = await fetch(`${API}/website/inquiry`, {
        method: "POST",
        headers,
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
    const tid = tenantId || readTenantId() || parseJwtPayload(token).tenantId || "";
    if (!token) return [];
    try {
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      if (tid) headers["x-tenant-id"] = tid;
      const res = await fetch(`${API}/website/inquiries`, {
        headers,
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
        isSuperAdmin,
        configVersion,
        adminOpen,
        setAdminOpen,
        setPreviewDraft,
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
