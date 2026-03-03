import React, { createContext, useContext, useEffect } from "react";

import { ThemeConfig } from "@/types";

export const DEFAULT_THEME: Required<ThemeConfig> = {
  primaryColor: "#162b4e",
  accentColor:  "#bfa15a",
  actionColor:  "#466691",
  textColor:    "#374151",
  fontSpecial:  '"Great Vibes", cursive, serif',
  fontSerif:    "",
};

// Google Fonts disponibles como preset (deben coincidir exactamente con el nombre en Google Fonts)
export const SERIF_PRESETS = [
  "Playfair Display",
  "Cormorant Garamond",
  "EB Garamond",
  "Lora",
  "Merriweather",
  "Libre Baskerville",
  "Cardo",
  "Crimson Text",
];

const ThemeContext = createContext<Required<ThemeConfig>>(DEFAULT_THEME);

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  theme: ThemeConfig;
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ theme, children }) => {
  const fontSerif = theme.fontSerif?.trim() || "";

  // Carga dinámica de Google Fonts cuando se elige un preset
  useEffect(() => {
    if (!fontSerif || !SERIF_PRESETS.includes(fontSerif)) return;
    const id = `gfont-${fontSerif.replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${fontSerif.replace(/ /g, "+")}:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap`;
    document.head.appendChild(link);
  }, [fontSerif]);

  const merged: Required<ThemeConfig> = {
    primaryColor: theme.primaryColor?.trim() || DEFAULT_THEME.primaryColor,
    accentColor:  theme.accentColor?.trim()  || DEFAULT_THEME.accentColor,
    actionColor:  theme.actionColor?.trim()  || DEFAULT_THEME.actionColor,
    textColor:    theme.textColor?.trim()    || DEFAULT_THEME.textColor,
    fontSpecial:  theme.fontSpecial?.trim()  || DEFAULT_THEME.fontSpecial,
    fontSerif,
  };

  const cssVars = {
    "--color-primary": merged.primaryColor,
    "--color-accent":  merged.accentColor,
    "--color-action":  merged.actionColor,
    "--color-text":    merged.textColor,
    "--font-special":  merged.fontSpecial,
    // Solo inyectar --font-serif cuando hay una fuente personalizada
    ...(fontSerif ? { "--font-serif": `"${fontSerif}"` } : {}),
  } as React.CSSProperties;

  return (
    <ThemeContext.Provider value={merged}>
      <div style={cssVars}>{children}</div>
    </ThemeContext.Provider>
  );
};
