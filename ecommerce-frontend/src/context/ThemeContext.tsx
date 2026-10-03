"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ThemeConfig, DEFAULT_VIBRANT_THEME } from "@/lib/builderTypes";
import { fetchActiveTheme, saveActiveTheme } from "@/lib/builderStore";

interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (t: ThemeConfig | ((prev: ThemeConfig) => ThemeConfig)) => void;
  primaryColor: string;
  accentColor: string;
  isDarkMode: boolean;
  headerLogo?: string;
  headerLogoText?: string;
  refreshTheme: () => Promise<void>;
  saveTheme: (t?: ThemeConfig) => Promise<boolean>;
  isSaving: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_VIBRANT_THEME,
  setTheme: () => {},
  primaryColor: "#2563eb",
  accentColor: "#f59e0b",
  isDarkMode: false,
  refreshTheme: async () => {},
  saveTheme: async () => false,
  isSaving: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_VIBRANT_THEME);
  const [isSaving, setIsSaving] = useState(false);

  const applyCssVariables = (cfg: ThemeConfig) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const primary = cfg.primaryColor || "#2563eb";
    const accent = cfg.accentColor || "#f59e0b";

    root.style.setProperty("--theme-primary", primary);
    root.style.setProperty("--theme-accent", accent);

    if (cfg.isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const refreshTheme = async () => {
    try {
      const active = await fetchActiveTheme();
      setTheme(active);
      applyCssVariables(active);
    } catch (e) {
      console.warn("Failed to load active theme in ThemeProvider", e);
    }
  };

  useEffect(() => {
    refreshTheme();
  }, []);

  useEffect(() => {
    applyCssVariables(theme);
  }, [theme.primaryColor, theme.accentColor, theme.isDarkMode]);

  const saveTheme = async (customTheme?: ThemeConfig): Promise<boolean> => {
    const toSave = customTheme || theme;
    try {
      setIsSaving(true);
      const res = await saveActiveTheme(toSave);
      setTheme(toSave);
      applyCssVariables(toSave);
      return res;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        primaryColor: theme.primaryColor || "#2563eb",
        accentColor: theme.accentColor || "#f59e0b",
        isDarkMode: !!theme.isDarkMode,
        headerLogo: theme.headerLogo,
        headerLogoText: theme.headerLogoText,
        refreshTheme,
        saveTheme,
        isSaving,
      }}
    >
      {/* Global Dynamic Stylesheet for Theme Elements */}
      <style
        id="theme-dynamic-styles"
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --theme-primary: ${theme.primaryColor || "#2563eb"};
              --theme-accent: ${theme.accentColor || "#f59e0b"};
            }
            .bg-theme-primary {
              background-color: var(--theme-primary, ${theme.primaryColor || "#2563eb"}) !important;
            }
            .text-theme-primary {
              color: var(--theme-primary, ${theme.primaryColor || "#2563eb"}) !important;
            }
            .border-theme-primary {
              border-color: var(--theme-primary, ${theme.primaryColor || "#2563eb"}) !important;
            }
            .ring-theme-primary {
              --tw-ring-color: var(--theme-primary, ${theme.primaryColor || "#2563eb"}) !important;
            }
            .bg-theme-accent {
              background-color: var(--theme-accent, ${theme.accentColor || "#f59e0b"}) !important;
            }
            .text-theme-accent {
              color: var(--theme-accent, ${theme.accentColor || "#f59e0b"}) !important;
            }
            .border-theme-accent {
              border-color: var(--theme-accent, ${theme.accentColor || "#f59e0b"}) !important;
            }
          `,
        }}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
