import React, { createContext, useContext } from "react";

import { ThemeConfig } from "@/types";

export const DEFAULT_THEME: Required<ThemeConfig> = {
  primaryColor: "#162b4e",
  accentColor:  "#bfa15a",
  actionColor:  "#466691",
  textColor:    "#374151",
  fontSpecial:  '"Great Vibes", cursive, serif',
};

const ThemeContext = createContext<Required<ThemeConfig>>(DEFAULT_THEME);

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  theme: ThemeConfig;
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ theme, children }) => {
  const merged: Required<ThemeConfig> = {
    primaryColor: theme.primaryColor?.trim() || DEFAULT_THEME.primaryColor,
    accentColor:  theme.accentColor?.trim()  || DEFAULT_THEME.accentColor,
    actionColor:  theme.actionColor?.trim()  || DEFAULT_THEME.actionColor,
    textColor:    theme.textColor?.trim()    || DEFAULT_THEME.textColor,
    fontSpecial:  theme.fontSpecial?.trim()  || DEFAULT_THEME.fontSpecial,
  };

  const cssVars = {
    "--color-primary": merged.primaryColor,
    "--color-accent":  merged.accentColor,
    "--color-action":  merged.actionColor,
    "--color-text":    merged.textColor,
    "--font-special":  merged.fontSpecial,
  } as React.CSSProperties;

  return (
    <ThemeContext.Provider value={merged}>
      <div style={cssVars}>{children}</div>
    </ThemeContext.Provider>
  );
};
