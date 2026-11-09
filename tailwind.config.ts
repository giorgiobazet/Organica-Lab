import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lab: {
          background: "#0B0F19",
          surface: "#1E293B",
          light: "#F8FAFC",
          muted: "#94A3B8",
          dark: "#0F172A",
        },
        ui: {
          bg: "rgb(var(--bg) / <alpha-value>)",
          surface: "rgb(var(--surface) / <alpha-value>)",
          border: "rgb(var(--border) / <alpha-value>)",
          text: "rgb(var(--text) / <alpha-value>)",
          muted: "rgb(var(--muted) / <alpha-value>)",
          hero: "rgb(var(--hero) / <alpha-value>)",
        },
        chem: {
          primary: "#06B6D4",
          orbital: "#8B5CF6",
          success: "#10B981",
          danger: "#F43F5E",
        },
      },
      fontFamily: {
        sans: ["\"Inter Variable\"", "Inter", "system-ui", "sans-serif"],
        mono: ["\"JetBrains Mono Variable\"", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 32px -8px rgba(6, 182, 212, 0.55)",
        "glow-orbital": "0 0 32px -8px rgba(139, 92, 246, 0.55)",
      },
      backgroundImage: {
        "lab-grid":
          "linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
    },
  },
  plugins: [],
};

export default config;
