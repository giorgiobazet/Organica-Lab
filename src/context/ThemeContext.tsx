"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";
export type Estilo = "a" | "b" | "c";
export const ESTILOS: { id: Estilo; nome: string }[] = [
  { id: "a", nome: "Lab Glass" },
  { id: "b", nome: "Clínico" },
  { id: "c", nome: "Orbital" },
];

interface ThemeContextValue {
  theme: Theme;
  toggleTheme(): void;
  estilo: Estilo;
  setEstilo(e: Estilo): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "chempharm:theme";
const ESTILO_KEY = "chempharm:estilo";

/** Script inline no <head> que aplica tema e estilo antes da primeira pintura (evita flash). */
export const themeInitScript = `(function(){var d=document.documentElement;try{var q=new URLSearchParams(location.search);var t=q.get('tema')||localStorage.getItem('${STORAGE_KEY}');if(t!=='light'){d.classList.add('dark')}else{d.classList.remove('dark')}var e=q.get('estilo')||localStorage.getItem('${ESTILO_KEY}')||'a';if(['a','b','c'].indexOf(e)<0)e='a';d.setAttribute('data-estilo',e);if(q.get('estilo'))localStorage.setItem('${ESTILO_KEY}',e);if(q.get('tema'))localStorage.setItem('${STORAGE_KEY}',q.get('tema'))}catch(x){d.classList.add('dark');d.setAttribute('data-estilo','a')}})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [estilo, setEstiloState] = useState<Estilo>("a");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    const e = document.documentElement.getAttribute("data-estilo");
    if (e === "a" || e === "b" || e === "c") setEstiloState(e);
  }, []);

  const setEstilo = useCallback((e: Estilo) => {
    document.documentElement.setAttribute("data-estilo", e);
    try {
      localStorage.setItem(ESTILO_KEY, e);
    } catch {
      /* armazenamento indisponível */
    }
    setEstiloState(e);
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

  return <ThemeContext.Provider value={{ theme, toggleTheme, estilo, setEstilo }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme() precisa estar dentro de <ThemeProvider>.");
  return ctx;
}
