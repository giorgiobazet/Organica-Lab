"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

/**
 * Fórmula em bastão 2D em padrão IUPAC (Gold Book), via smiles-drawer:
 * ângulos de 120°, ligações duplas/triplas proporcionais e, com SMILES isomérico,
 * cunhas cheias (para frente) e tracejadas (para trás) nos estereocentros.
 */
export interface Molecule2DStickProps {
  smiles: string;
  width?: number;
  height?: number;
  /** Índices de átomos (ordem do SMILES) a destacar em ciano. */
  highlightAtoms?: number[];
  /** Mostra os hidrogênios explícitos escritos no SMILES. */
  explicitHydrogens?: boolean;
  label?: string;
  className?: string;
}

// Paletas do bastão em sintonia com "Clean Sci-Tech Lab".
const LAB_THEMES = {
  labDark: {
    FOREGROUND: "#F8FAFC",
    BACKGROUND: "#1E293B",
    C: "#F8FAFC",
    O: "#F43F5E",
    N: "#06B6D4",
    F: "#10B981",
    CL: "#10B981",
    BR: "#F59E0B",
    I: "#8B5CF6",
    P: "#F59E0B",
    S: "#FACC15",
    B: "#F59E0B",
    SI: "#F59E0B",
    H: "#94A3B8",
  },
  labLight: {
    FOREGROUND: "#0F172A",
    BACKGROUND: "#FFFFFF",
    C: "#0F172A",
    O: "#E11D48",
    N: "#0891B2",
    F: "#059669",
    CL: "#059669",
    BR: "#D97706",
    I: "#7C3AED",
    P: "#D97706",
    S: "#CA8A04",
    B: "#D97706",
    SI: "#D97706",
    H: "#64748B",
  },
};

export function Molecule2DStick({
  smiles,
  width = 320,
  height = 220,
  highlightAtoms,
  explicitHydrogens = true,
  label,
  className,
}: Molecule2DStickProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  useEffect(() => {
    let cancelled = false;
    const svg = svgRef.current;
    if (!svg) return;

    import("smiles-drawer").then(({ default: SmilesDrawer }) => {
      if (cancelled) return;
      const drawer = new SmilesDrawer.SvgDrawer({
        width,
        height,
        bondThickness: 1.4,
        bondLength: 30,
        isomeric: true,
        explicitHydrogens,
        terminalCarbons: false,
        compactDrawing: false,
        fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
        fontSizeLarge: 11,
        fontSizeSmall: 5,
        padding: 16,
        themes: LAB_THEMES,
      });
      SmilesDrawer.parse(
        smiles,
        (tree) => {
          if (cancelled) return;
          while (svg.firstChild) svg.removeChild(svg.firstChild);
          try {
            drawer.draw(
              tree,
              svg,
              theme === "dark" ? "labDark" : "labLight",
              null,
              false,
              highlightAtoms ?? [],
            );
            setError(null);
          } catch (e) {
            setError((e as Error).message);
          }
        },
        (e) => !cancelled && setError(`SMILES inválido: ${e.message}`),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [smiles, width, height, theme, highlightAtoms, explicitHydrogens]);

  return (
    <figure className={cn("flex flex-col items-center gap-2", className)}>
      <svg
        ref={svgRef}
        role="img"
        aria-labelledby={label ? titleId : undefined}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="max-w-full"
      />
      {error && <p className="text-xs text-chem-danger">{error}</p>}
      {label && (
        <figcaption id={titleId} className="font-mono text-xs text-muted">
          {label}
        </figcaption>
      )}
    </figure>
  );
}
