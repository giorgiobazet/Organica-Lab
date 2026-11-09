"use client";

import { useEffect, useRef, useState } from "react";
import type { GLViewer } from "3dmol";
import { Atom, Box, CircleDot, Cloud, Database, Globe2, Pause, Play, RotateCcw } from "lucide-react";
import { fetchSdf3D, pubchemCompoundUrl } from "@/services/pubchem";
import { MOLECULES_3D, getCachedByCid } from "@/data/molecules3d";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

/** Fundo opaco por tema (halos translúcidos precisam de fundo opaco para manter a cor). */
const FUNDO_OPACO = { dark: "#141C2C", light: "#EEF2F7" } as const;

export type MoleculeStyle = "ballAndStick" | "stick" | "spacefill";
export type MoleculeSurface = "none" | "vdw";

export interface AtomHighlight {
  /** índices 0-based dos átomos no SDF */
  atoms: number[];
  color: string;
  /** multiplica o raio do halo (padrão 1) */
  scale?: number;
}

export interface AtomLabel {
  atom: number;
  text: string;
  color?: string;
}

export interface Molecule3DViewerProps {
  /** CID do PubChem: busca o confôrmero 3D oficial. */
  cid?: number;
  /** Chave em src/data/molecules3d.ts: exibição instantânea e fallback offline. */
  cacheKey?: string;
  /** SDF explícito (ex.: geometria recalculada por uma animação conformacional). Tem prioridade. */
  sdf?: string;
  initialStyle?: MoleculeStyle;
  initialSurface?: MoleculeSurface;
  spin?: boolean;
  showControls?: boolean;
  /** Fundo transparente para compor sobre painéis glass. Use false em jogos com halos de destaque. */
  transparent?: boolean;
  className?: string;
  /** Acesso ao viewer 3Dmol para jogos que destacam átomos ou animam geometria. */
  onViewerReady?: (viewer: GLViewer) => void;
  /** Mantém câmera/zoom quando o SDF muda (animações conformacionais). */
  preserveView?: boolean;
  /** Átomos destacados em cor (ex.: interações 1,3-diaxiais em chem.danger). */
  highlight?: AtomHighlight[];
  /** Fator de zoom aplicado após enquadrar a molécula (padrão 0,9). */
  zoom?: number;
  /** Rótulos de texto ancorados em átomos (ex.: "C1", "O⁻"). */
  labels?: AtomLabel[];
}

type Source =
  | { kind: "pubchem"; cid: number }
  | { kind: "cache"; nome: string }
  | { kind: "inline" }
  | { kind: "none" };

// Carbono em ciano (chem.primary) e heteroátomos na convenção CPK/Jmol.
const COLOR_SCHEME = "cyanCarbon";

function applyStyle(
  viewer: GLViewer,
  style: MoleculeStyle,
  surface: MoleculeSurface,
  highlight: AtomHighlight[] = [],
  labels: AtomLabel[] = [],
) {
  viewer.removeAllSurfaces();
  if (style === "ballAndStick") {
    viewer.setStyle(
      {},
      {
        stick: { radius: 0.14, colorscheme: COLOR_SCHEME },
        sphere: { scale: 0.25, colorscheme: COLOR_SCHEME },
      },
    );
  } else if (style === "stick") {
    viewer.setStyle({}, { stick: { radius: 0.2, colorscheme: COLOR_SCHEME } });
  } else {
    // Raios de van der Waals reais (Bondi) são o padrão do estilo sphere do 3Dmol.
    viewer.setStyle({}, { sphere: { scale: 1.0, colorscheme: COLOR_SCHEME } });
  }
  // Destaques como halos translúcidos: o átomo mantém a cor CPK (vermelho sólido seria lido como oxigênio).
  viewer.removeAllShapes();
  for (const h of highlight) {
    if (!h.atoms.length) continue;
    for (const atom of viewer.selectedAtoms({ index: h.atoms })) {
      viewer.addSphere({
        center: { x: atom.x ?? 0, y: atom.y ?? 0, z: atom.z ?? 0 },
        radius: (atom.elem === "H" ? 0.6 : 0.9) * (h.scale ?? 1),
        color: h.color,
        opacity: 0.6,
      });
    }
  }
  viewer.removeAllLabels();
  for (const l of labels) {
    const [atom] = viewer.selectedAtoms({ index: l.atom });
    if (!atom) continue;
    viewer.addLabel(l.text, {
      position: { x: atom.x ?? 0, y: atom.y ?? 0, z: atom.z ?? 0 },
      backgroundColor: "#0B0F19",
      backgroundOpacity: 0.75,
      fontColor: l.color ?? "#F8FAFC",
      fontSize: 13,
      font: "JetBrains Mono, monospace",
      borderThickness: 0,
      inFront: true,
      alignment: "bottomCenter",
    });
  }
  if (surface === "vdw") {
    // Nuvem eletrônica em violeta neon (chem.orbital).
    // 3Dmol: SurfaceType.VDW = 1
    viewer.addSurface(1, { opacity: 0.32, color: "#8B5CF6" });
  }
  viewer.render();
}

export function Molecule3DViewer({
  cid,
  cacheKey,
  sdf,
  initialStyle = "ballAndStick",
  initialSurface = "none",
  spin = true,
  showControls = true,
  transparent = true,
  className,
  onViewerReady,
  preserveView = false,
  highlight,
  zoom = 0.9,
  labels,
}: Molecule3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<GLViewer | null>(null);
  const [ready, setReady] = useState(false);
  const [style, setStyle] = useState<MoleculeStyle>(initialStyle);
  const [surface, setSurface] = useState<MoleculeSurface>(initialSurface);
  const [spinning, setSpinning] = useState(spin);
  const [source, setSource] = useState<Source>({ kind: "none" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasModel = useRef(false);
  const { theme } = useTheme();
  const temaRef = useRef(theme);
  temaRef.current = theme;
  const highlightRef = useRef<AtomHighlight[] | undefined>(highlight);
  highlightRef.current = highlight;
  const labelsRef = useRef<AtomLabel[] | undefined>(labels);
  labelsRef.current = labels;
  const highlightKey = JSON.stringify([highlight ?? [], labels ?? []]);

  // Cria o viewer uma única vez (3Dmol depende de window/WebGL: só no cliente).
  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | null = null;
    import("3dmol").then(($3Dmol) => {
      if (disposed || !containerRef.current) return;
      const viewer = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: transparent ? "black" : FUNDO_OPACO[temaRef.current],
        backgroundAlpha: transparent ? 0 : 1,
        antialias: true,
      });
      viewerRef.current = viewer;
      observer = new ResizeObserver(() => viewer.resize());
      observer.observe(containerRef.current);
      setReady(true);
      onViewerReady?.(viewer);
    });
    return () => {
      disposed = true;
      observer?.disconnect();
      viewerRef.current?.clear();
      viewerRef.current = null;
    };
    // onViewerReady é lido só na criação.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transparent]);

  // Fundo opaco acompanha o tema claro/escuro.
  useEffect(() => {
    if (!ready || transparent || !viewerRef.current) return;
    viewerRef.current.setBackgroundColor(FUNDO_OPACO[theme], 1);
    viewerRef.current.render();
  }, [ready, transparent, theme]);

  // Carrega a molécula: SDF explícito > cache local instantâneo > PubChem (substitui o cache).
  useEffect(() => {
    if (!ready || !viewerRef.current) return;
    const viewer = viewerRef.current;
    let cancelled = false;

    const show = (data: string, src: Source) => {
      if (cancelled) return;
      const keepView = preserveView && hasModel.current;
      const view = keepView ? viewer.getView() : null;
      viewer.removeAllModels();
      viewer.addModel(data, "sdf");
      applyStyle(viewer, style, surface, highlightRef.current, labelsRef.current);
      if (view) {
        viewer.setView(view);
      } else {
        viewer.zoomTo();
        viewer.zoom(zoom);
      }
      viewer.render();
      hasModel.current = true;
      setSource(src);
      setError(null);
    };

    if (sdf) {
      show(sdf, { kind: "inline" });
      setLoading(false);
      return;
    }

    const cached = (cacheKey && MOLECULES_3D[cacheKey]) || (cid ? getCachedByCid(cid) : undefined);
    if (cached) show(cached.sdf, { kind: "cache", nome: cached.nome });

    if (cid) {
      setLoading(true);
      fetchSdf3D(cid)
        .then((data) => show(data, { kind: "pubchem", cid }))
        .catch(() => {
          if (!cancelled && !cached) setError("PubChem indisponível e molécula fora do cache local.");
        })
        .finally(() => !cancelled && setLoading(false));
    } else {
      setLoading(false);
      if (!cached) setError("Informe cid, cacheKey ou sdf.");
    }

    return () => {
      cancelled = true;
    };
    // style/surface são aplicados no efeito abaixo sem recarregar o modelo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, cid, cacheKey, sdf]);

  useEffect(() => {
    if (ready && viewerRef.current) applyStyle(viewerRef.current, style, surface, highlightRef.current, labelsRef.current);
  }, [ready, style, surface, highlightKey]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!ready || !viewer) return;
    if (spinning) viewer.spin("y", 0.6);
    else viewer.spin(false);
  }, [ready, spinning]);

  const resetView = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.zoomTo();
    viewer.zoom(zoom);
    viewer.render();
  };

  return (
    <div className={cn("relative h-full min-h-[240px] w-full", className)}>
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        aria-label="Visualizador molecular 3D interativo: arraste para girar, role para aproximar"
        role="img"
      />

      {(loading || error) && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-lab-background/70 px-2 py-1 font-mono text-[11px] text-lab-muted">
          {error ? <span className="text-chem-danger">{error}</span> : "carregando estrutura…"}
        </div>
      )}

      {source.kind !== "none" && !error && (
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-lab-background/70 px-2 py-1 font-mono text-[11px] text-lab-muted">
          {source.kind === "pubchem" ? (
            <a
              href={pubchemCompoundUrl(source.cid)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-chem-primary"
            >
              <Globe2 className="h-3 w-3 text-chem-primary" /> PubChem CID {source.cid}
            </a>
          ) : source.kind === "cache" ? (
            <>
              <Database className="h-3 w-3 text-chem-orbital" /> cache local · MMFF94
            </>
          ) : (
            <>
              <Atom className="h-3 w-3 text-chem-success" /> geometria calculada
            </>
          )}
        </div>
      )}

      {showControls && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-white/10 bg-lab-background/75 p-1 backdrop-blur-md">
          <ControlButton active={style === "ballAndStick"} onClick={() => setStyle("ballAndStick")} title="Bola e bastão">
            <CircleDot className="h-4 w-4" />
          </ControlButton>
          <ControlButton active={style === "stick"} onClick={() => setStyle("stick")} title="Bastão">
            <Box className="h-4 w-4" />
          </ControlButton>
          <ControlButton active={style === "spacefill"} onClick={() => setStyle("spacefill")} title="Preenchimento espacial (van der Waals)">
            <Atom className="h-4 w-4" />
          </ControlButton>
          <span className="mx-1 h-5 w-px bg-white/10" />
          <ControlButton
            active={surface === "vdw"}
            onClick={() => setSurface((s) => (s === "vdw" ? "none" : "vdw"))}
            title="Superfície de densidade eletrônica"
            tone="orbital"
          >
            <Cloud className="h-4 w-4" />
          </ControlButton>
          <ControlButton active={spinning} onClick={() => setSpinning((s) => !s)} title={spinning ? "Pausar rotação" : "Girar"}>
            {spinning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </ControlButton>
          <ControlButton active={false} onClick={resetView} title="Recentralizar">
            <RotateCcw className="h-4 w-4" />
          </ControlButton>
        </div>
      )}
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  title,
  tone = "primary",
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  tone?: "primary" | "orbital";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        "rounded-lg p-2 text-lab-muted transition hover:text-lab-light",
        active && tone === "primary" && "bg-chem-primary/20 text-chem-primary",
        active && tone === "orbital" && "bg-chem-orbital/20 text-chem-orbital",
      )}
    >
      {children}
    </button>
  );
}
