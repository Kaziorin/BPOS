"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { GlobalThemeId, GLOBAL_THEMES } from "@/lib/theme";

interface ThemeContextType {
  theme: GlobalThemeId;
  setTheme: (theme: GlobalThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "ocean-teal",
  setTheme: () => {},
});

const STORAGE_KEY = "bpos_active_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<GlobalThemeId>("ocean-teal");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as GlobalThemeId;
    if (saved && GLOBAL_THEMES[saved]) {
      setThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.setAttribute("data-theme", "ocean-teal");
    }
  }, []);

  const setTheme = (newTheme: GlobalThemeId) => {
    if (!GLOBAL_THEMES[newTheme]) return;
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
