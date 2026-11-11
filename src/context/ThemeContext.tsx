"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CHAVE_TEMA } from "@/lib/scriptsIniciais";

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme(): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = CHAVE_TEMA;


export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* armazenamento indisponível: o tema vale só nesta sessão */
      }
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme() precisa estar dentro de <ThemeProvider>.");
  return ctx;
}
