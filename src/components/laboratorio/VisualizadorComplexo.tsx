"use client";

import { useEffect, useRef, useState } from "react";
import type { GLViewer } from "3dmol";
import { Globe2, Pause, Play, RotateCcw } from "lucide-react";
import type { Complexo } from "@/data/complexos";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const AMARELO = "#FBBF24";
// Fita por estrutura secundária: hélice em violeta (chem.orbital), folha em âmbar, alças em cinza.
const corFita = (a: { ss?: string }) => (a.ss === "h" ? "#8B5CF6" : a.ss === "s" ? "#F59E0B" : "#94A3B8");

function fundoOpaco(): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--viewer").trim() || "#17143a";
}

interface Opcoes {
  fita: boolean;
  sitio: boolean;
  ligacoes: boolean;
  superficie: boolean;
}

/**
 * Complexo fármaco–proteína do PDB: fita da proteína, resíduos do sítio em bastão, fármaco em
 * bola-e-bastão (carbono ciano, como no resto do site) e ligações de H tracejadas em amarelo.
 */
export function VisualizadorComplexo({ c, onViewerReady, className }: { c: Complexo; onViewerReady?: (v: GLViewer) => void; className?: string }) {
  const caixa = useRef<HTMLDivElement>(null);
  const viewer = useRef<GLViewer | null>(null);
  const [pronto, setPronto] = useState(false);
  const [carregado, setCarregado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [girando, setGirando] = useState(false);
  const [op, setOp] = useState<Opcoes>({ fita: true, sitio: true, ligacoes: true, superficie: false });
  const { theme } = useTheme();
  const readyRef = useRef(onViewerReady);
  readyRef.current = onViewerReady;

  useEffect(() => {
    let descartado = false;
    let ro: ResizeObserver | null = null;
    import("3dmol").then(($3Dmol) => {
      if (descartado || !caixa.current) return;
      const v = $3Dmol.createViewer(caixa.current, {
        backgroundColor: fundoOpaco(),
        antialias: !document.documentElement.classList.contains("leve"),
      });
      viewer.current = v;
      ro = new ResizeObserver(() => v.resize());
      ro.observe(caixa.current);
      readyRef.current?.(v);
      setPronto(true);
    });
    return () => {
      descartado = true;
      ro?.disconnect();
      viewer.current?.clear();
      viewer.current = null;
    };
  }, []);

  // Carrega o arquivo reduzido do complexo (servido pelo próprio site).
  useEffect(() => {
    if (!pronto || !viewer.current) return;
    let cancelado = false;
    setErro(null);
    setCarregado(null);
    fetch(`/complexos/${c.id}.pdb`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.text();
      })
      .then((pdb) => {
        const v = viewer.current;
        if (cancelado || !v) return;
        v.clear();
        v.addModel(pdb, "pdb");
        v.zoomTo({ resn: c.ligante.codigo, chain: c.ligante.cadeia, resi: c.ligante.numero });
        v.zoom(0.45);
        setCarregado(c.id);
      })
      .catch(() => !cancelado && setErro("Não foi possível carregar a estrutura do complexo."));
    return () => {
      cancelado = true;
    };
  }, [pronto, c]);

  // Estilos: refeitos a cada opção, tema ou complexo.
  useEffect(() => {
    const v = viewer.current;
    if (!v || carregado !== c.id) return;
    const escuro = theme === "dark";
    const lig = { resn: c.ligante.codigo, chain: c.ligante.cadeia, resi: c.ligante.numero };
    const corResiduo = { prop: "elem", map: { C: escuro ? "#CBD5E1" : "#475569", N: "#3B82F6", O: "#F43F5E", S: "#FACC15" } };
    v.setBackgroundColor(fundoOpaco(), 1);
    v.removeAllShapes();
    v.removeAllLabels();
    v.removeAllSurfaces();
    v.setStyle({}, {});
    if (op.fita) v.setStyle({ hetflag: false }, { cartoon: { colorfunc: corFita, opacity: 0.5 } });
    const porCadeia = new Map<string, number[]>();
    for (const s of c.sitio) porCadeia.set(s.cadeia, [...(porCadeia.get(s.cadeia) ?? []), s.numero]);
    if (op.sitio) {
      for (const [cadeia, resi] of porCadeia) v.addStyle({ chain: cadeia, resi, hetflag: false }, { stick: { radius: 0.13, colorscheme: corResiduo } });
    }
    v.setStyle(lig, { stick: { radius: 0.16, colorscheme: "cyanCarbon" }, sphere: { scale: 0.25, colorscheme: "cyanCarbon" } });
    if (op.superficie) {
      for (const [cadeia, resi] of porCadeia) v.addSurface(1, { opacity: 0.5, color: escuro ? "#64748B" : "#CBD5E1" }, { chain: cadeia, resi, hetflag: false });
    }
    if (op.ligacoes) {
      const rotulados = new Set<string>();
      for (const h of c.ligacoesH) {
        const [p] = v.selectedAtoms({ chain: h.cadeia, resi: h.numero, atom: h.atomoProteina, hetflag: false });
        const [l] = v.selectedAtoms({ ...lig, atom: h.atomoLigante });
        if (!p || !l) continue;
        v.addCylinder({ start: { x: p.x!, y: p.y!, z: p.z! }, end: { x: l.x!, y: l.y!, z: l.z! }, radius: 0.05, color: AMARELO, dashed: true, fromCap: 1, toCap: 1 });
        const chave = `${h.cadeia}${h.residuo}`;
        if (rotulados.has(chave)) continue;
        rotulados.add(chave);
        v.addLabel(`${h.residuo} · ${h.distancia.toLocaleString("pt-BR")} Å`, {
          position: { x: p.x!, y: p.y!, z: p.z! },
          backgroundColor: "#0B0F19",
          backgroundOpacity: 0.85,
          fontColor: AMARELO,
          fontSize: 12,
          font: "JetBrains Mono, monospace",
          inFront: true,
          alignment: "bottomCenter",
        });
      }
    }
    v.render();
  }, [carregado, c, op, theme]);

  useEffect(() => {
    const v = viewer.current;
    if (!v || !carregado) return;
    if (girando) v.spin("y", 0.5);
    else v.spin(false);
  }, [girando, carregado]);

  const recentralizar = () => {
    const v = viewer.current;
    if (!v) return;
    v.zoomTo({ resn: c.ligante.codigo, chain: c.ligante.cadeia, resi: c.ligante.numero });
    v.zoom(0.45);
    v.render();
  };

  const alternar = (k: keyof Opcoes) => setOp((o) => ({ ...o, [k]: !o[k] }));
  const BOTOES: [keyof Opcoes, string][] = [
    ["fita", "Proteína"],
    ["sitio", "Sítio"],
    ["ligacoes", "Ligações de H"],
    ["superficie", "Superfície"],
  ];

  return (
    <div className={cn("relative h-full w-full", className)}>
      <div ref={caixa} className="absolute inset-0 cursor-grab active:cursor-grabbing" role="img" aria-label={`${c.farmaco} no sítio de ${c.alvo} (PDB ${c.id})`} />
      {(erro || carregado !== c.id) && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-ui-surface/80 px-2 py-1 font-mono text-[11px] text-ui-muted">
          {erro ? <span className="text-chem-danger">{erro}</span> : "carregando o complexo…"}
        </div>
      )}
      <a
        href={`https://www.rcsb.org/structure/${c.id}`}
        target="_blank"
        rel="noreferrer"
        className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-ui-surface/80 px-2 py-1 font-mono text-[11px] text-ui-muted hover:text-chem-primary"
      >
        <Globe2 className="h-3 w-3 text-chem-primary" /> RCSB PDB {c.id}
      </a>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-xl border border-ui-border/20 bg-ui-surface/85 p-1 shadow-lg">
        {BOTOES.map(([k, rotulo]) => (
          <button
            key={k}
            type="button"
            onClick={() => alternar(k)}
            aria-pressed={op[k]}
            className={cn("rounded-lg px-2.5 py-1.5 text-xs font-semibold transition", op[k] ? "bg-chem-primary/20 text-chem-primary" : "text-muted hover:text-chem-primary")}
          >
            {rotulo}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-ui-border/30" />
        <button type="button" onClick={() => setGirando((g) => !g)} className="rounded-lg p-1.5 text-muted hover:text-chem-primary" title={girando ? "Pausar rotação" : "Girar"}>
          {girando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button type="button" onClick={recentralizar} className="rounded-lg p-1.5 text-muted hover:text-chem-primary" title="Recentralizar no fármaco">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
