import {
  ThemeConfig,
  DEFAULT_VIBRANT_THEME,
  DEFAULT_SIDEBAR_THEME,
  DEFAULT_DARK_LUXURY_THEME,
  SectionItem,
} from "./builderTypes";
import api, { getTenantSlug } from "./api";

const STORAGE_KEY_PREFIX = "shopease_builder_theme_";

export async function fetchActiveTheme(): Promise<ThemeConfig> {
  const tenantSlug = getTenantSlug();
  const localKey = `${STORAGE_KEY_PREFIX}${tenantSlug}`;

  // 1. Try local storage cache first for instant load
  let cachedTheme: ThemeConfig | null = null;
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        cachedTheme = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to parse cached theme", e);
    }
  }

  // 2. Try fetching from Backend API
  try {
    const res = await api.get("/builder-theme");
    const serverTheme = res.data?.data;
    if (serverTheme && serverTheme.sections) {
      if (typeof window !== "undefined") {
        localStorage.setItem(localKey, JSON.stringify(serverTheme));
      }
      return serverTheme;
    }
  } catch (err) {
    // API not reachable or no server theme saved yet
  }

  if (cachedTheme && cachedTheme.sections) {
    return cachedTheme;
  }

  return DEFAULT_VIBRANT_THEME;
}

export async function saveActiveTheme(theme: ThemeConfig): Promise<boolean> {
  const tenantSlug = getTenantSlug();
  const localKey = `${STORAGE_KEY_PREFIX}${tenantSlug}`;

  // 1. Save to local storage
  if (typeof window !== "undefined") {
    localStorage.setItem(localKey, JSON.stringify(theme));
  }

  // 2. Persist to backend database
  try {
    await api.post("/builder-theme", { theme });
    return true;
  } catch (err) {
    console.warn("Could not persist theme to server database, saved locally", err);
    return true;
  }
}

export function getPresetTheme(preset: "shopease-vibrant" | "shopease-sidebar-grocery" | "shopease-dark-luxury"): ThemeConfig {
  switch (preset) {
    case "shopease-sidebar-grocery":
      return JSON.parse(JSON.stringify(DEFAULT_SIDEBAR_THEME));
    case "shopease-dark-luxury":
      return JSON.parse(JSON.stringify(DEFAULT_DARK_LUXURY_THEME));
    case "shopease-vibrant":
    default:
      return JSON.parse(JSON.stringify(DEFAULT_VIBRANT_THEME));
  }
}
