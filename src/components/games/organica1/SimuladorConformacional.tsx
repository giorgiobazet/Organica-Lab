"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, Pause, Play, RotateCcw, Target, Trophy, XCircle } from "lucide-react";
import { Molecule3DViewer } from "@/components/Molecule3DViewer";
import { NewmanProjection } from "./NewmanProjection";
import { useAuth } from "@/context/AuthContext";
import {
  ANGULOS_BUTANO,
  CADEIRAS_REF,
  CICLOEXANO_REF,
  ENERGIAS_REF,
  curvaEnergia,
  distAng,
  energia,
  nomeConformacao,
  sdfAlcano,
  type Alcano,
  type ConformacaoButano,
} from "@/lib/conformacoes";
import { toMolBlock } from "@/lib/molblock";
import type { RingFlipData } from "@/data/ringFlip";
import { cn } from "@/lib/utils";

const DISCIPLINA = "organica-1";
const JOGO = "simulador-conformacional";
const XP_ACERTO = 25;
const XP_CONCLUSAO = 100;
const TOL_CRAVAR = 12; // graus

const DANGER = "#F43F5E";

type Aba = "alcanos" | "cicloalcanos";

export default function SimuladorConformacional() {
  const [aba, setAba] = useState<Aba>("alcanos");
  const [alcanosOk, setAlcanosOk] = useState(false);
  const [aneisOk, setAneisOk] = useState(false);
  const { concluirJogo, profile } = useAuth();
  const jaConcluido = profile?.progresso.modulos?.[DISCIPLINA]?.concluidos.includes(JOGO) ?? false;
  const [bonus, setBonus] = useState(false);

  useEffect(() => {
    if (alcanosOk && aneisOk && !jaConcluido) {
      void concluirJogo(DISCIPLINA, JOGO, XP_CONCLUSAO).then((primeira) => primeira && setBonus(true));
    }
  }, [alcanosOk, aneisOk, jaConcluido, concluirJogo]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-slate-200/60 p-1 dark:bg-ui-bg/60" role="tablist">
          {(
            [
              ["alcanos", "Alcanos · Newman", alcanosOk],
              ["cicloalcanos", "Cicloalcanos · Chair flip", aneisOk],
            ] as const
          ).map(([id, label, ok]) => (
            <button
              key={id}
              role="tab"
              aria-selected={aba === id}
              onClick={() => setAba(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                aba === id ? "bg-chem-primary text-lab-background" : "text-muted hover:text-chem-primary",
              )}
            >
              {ok && <CheckCircle2 className="h-3.5 w-3.5" />}
              {label}
            </button>
          ))}
        </div>
        {(jaConcluido || bonus) && (
          <span className="chip bg-chem-success/15 text-chem-success">
            <Trophy className="h-3.5 w-3.5" /> Jogo concluído{bonus ? ` · +${XP_CONCLUSAO} XP` : ""}
          </span>
        )}
      </div>

      {aba === "alcanos" ? <PainelAlcanos onConcluir={() => setAlcanosOk(true)} /> : <PainelCicloalcanos onConcluir={() => setAneisOk(true)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feedback compartilhado
// ---------------------------------------------------------------------------

type Feedback = { ok: boolean; texto: string } | null;

function FeedbackBox({ fb }: { fb: Feedback }) {
  return (
    <AnimatePresence mode="wait">
      {fb && (
        <motion.p
          key={fb.texto}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          role="status"
          className={cn(
            "flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
            fb.ok ? "bg-chem-success/10 text-chem-success" : "bg-chem-danger/10 text-chem-danger",
          )}
        >
          {fb.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          {fb.texto}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const tooltipStyle = {
  background: "rgba(15,23,42,0.92)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#F8FAFC",
  fontFamily: "'JetBrains Mono Variable', monospace",
  fontSize: 12,
};

// ---------------------------------------------------------------------------
// Alcanos: etano e butano
// ---------------------------------------------------------------------------

const ALVOS: ConformacaoButano[] = ["anti", "gauche", "eclipsada", "totalmente eclipsada"];

function PainelAlcanos({ onConcluir }: { onConcluir: () => void }) {
  const { addXp } = useAuth();
  const [alcano, setAlcano] = useState<Alcano>("butano");
  const [phi, setPhi] = useState(60);
  const [girando, setGirando] = useState(false);
  const [fila, setFila] = useState<ConformacaoButano[]>(() => embaralhar(ALVOS));
  const [acertos, setAcertos] = useState<ConformacaoButano[]>([]);
  const [fb, setFb] = useState<Feedback>(null);
  const raf = useRef<number | null>(null);

  const sdf = useMemo(() => sdfAlcano(alcano, phi), [alcano, phi]);
  const curva = useMemo(() => curvaEnergia(alcano), [alcano]);
  const e = energia(alcano, phi);
  const nome = nomeConformacao(alcano, phi);
  const alvo = fila[0];
  const desafioCompleto = acertos.length === ALVOS.length;

  // Metilas próximas (|φ| < 75°): repulsão estérica destacada em vermelho
  const highlight = useMemo(() => {
    if (alcano !== "butano" || distAng(phi, 0) >= 75) return [];
    return [{ atoms: [2, 3, 8, 9, 10, 11, 12, 13], color: DANGER }];
  }, [alcano, phi]);

  useEffect(() => {
    if (!girando) return;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = t - last;
      last = t;
      setPhi((p) => (p + dt * 0.06) % 360);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [girando]);

  const cravar = () => {
    if (!alvo) return;
    const ok = ANGULOS_BUTANO[alvo].some((a) => distAng(a, phi) <= TOL_CRAVAR);
    if (ok) {
      const novos = [...acertos, alvo];
      setAcertos(novos);
      setFila((f) => f.slice(1));
      void addXp(XP_ACERTO, { rota: "/organica-1#simulador-conformacional", titulo: "Simulador Conformacional" });
      setFb({ ok: true, texto: `Isso! φ = ${Math.round(phi)}° é ${alvo}: ${ENERGIAS_REF.butano[alvo]} kJ/mol acima da anti. +${XP_ACERTO} XP` });
      if (novos.length === ALVOS.length) onConcluir();
    } else {
      const atual = nomeConformacao("butano", phi, TOL_CRAVAR);
      setFb({
        ok: false,
        texto: atual
          ? `Esta é a conformação ${atual}, não ${alvo}. Gire mais.`
          : `φ = ${Math.round(phi)}° não é uma conformação-chave. Procure ${alvo}.`,
      });
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <div className="glass flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-0">
          <div className="inline-flex gap-1">
            {(["etano", "butano"] as const).map((a) => (
              <button
                key={a}
                onClick={() => {
                  setAlcano(a);
                  setFb(null);
                }}
                className={cn("chip px-3 py-1 text-sm capitalize", alcano === a ? "bg-chem-primary text-lab-background" : "bg-slate-200/70 text-muted dark:bg-white/5")}
              >
                {a}
              </button>
            ))}
          </div>
          <span className="font-mono text-xs text-muted">ligação C2–C3 · bola e bastão</span>
        </div>
        <div className="relative min-h-[320px] flex-1">
          <Molecule3DViewer sdf={sdf} preserveView spin={false} transparent={false} highlight={highlight} zoom={1.35} className="absolute inset-0" />
        </div>
        <div className="space-y-3 border-t border-slate-200/70 p-4 dark:border-white/5">
          <div className="flex items-center gap-3">
            <button className="btn-ghost !px-3 !py-2" onClick={() => setGirando((g) => !g)} aria-label={girando ? "Pausar rotação" : "Girar a ligação"}>
              {girando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={Math.round(phi)}
              onChange={(ev) => {
                setGirando(false);
                setPhi(Number(ev.target.value));
              }}
              className="flex-1 accent-chem-primary"
              aria-label="Ângulo diedro"
            />
            <span className="w-16 text-right font-mono text-sm">φ {Math.round(phi)}°</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              Conformação:{" "}
              <span className={cn("font-semibold", nome ? "text-chem-primary" : "text-muted")}>{nome ?? "intermediária"}</span>
            </span>
            <span className="font-mono">
              E = <span className={e > 10 ? "text-chem-danger" : e < 1 ? "text-chem-success" : ""}>{e.toFixed(1)}</span> kJ/mol
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="glass grid grid-cols-[minmax(0,220px)_1fr] items-center gap-2 p-4">
          <div className="aspect-square w-full">
            <NewmanProjection alcano={alcano} phi={phi} />
          </div>
          <div className="text-sm">
            <p className="font-semibold">Projeção de Newman</p>
            <p className="mt-1 text-muted">
              Olhando de C2 (frente, <span className="text-chem-primary">ciano</span>) para C3 (trás,{" "}
              <span className="text-chem-orbital">violeta</span>).
            </p>
            <p className="mt-2 font-mono text-xs text-muted">Fonte das energias: {ENERGIAS_REF.fonte}</p>
          </div>
        </div>

        <div className="glass p-4">
          <p className="mb-2 text-sm font-semibold">Energia potencial × ângulo diedro</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curva} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="phi" type="number" domain={[0, 360]} ticks={[0, 60, 120, 180, 240, 300, 360]} tick={{ fontSize: 11, fill: "#94A3B8" }} unit="°" />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} domain={[0, alcano === "butano" ? 20 : 13]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v).toFixed(1)} kJ/mol`, "E"]} labelFormatter={(l) => `φ = ${l}°`} />
                <Line type="monotone" dataKey="energia" stroke="#8B5CF6" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                <ReferenceDot x={Math.round(phi)} y={+e.toFixed(2)} r={6} fill="#06B6D4" stroke="#F8FAFC" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {alcano === "butano" ? (
          <div className="glass space-y-3 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-chem-primary" /> Desafio: cravar as 4 conformações do butano
              <span className="ml-auto font-mono text-xs text-muted">{acertos.length}/4</span>
            </p>
            {desafioCompleto ? (
              <FeedbackBox fb={{ ok: true, texto: "Você identificou anti, gauche, eclipsada e totalmente eclipsada. Agora vá para os cicloalcanos!" }} />
            ) : (
              <>
                <p className="text-sm">
                  Gire até a conformação <span className="font-semibold uppercase text-chem-primary">{alvo}</span> e clique em cravar.
                </p>
                <button className="btn-primary w-full" onClick={cravar}>
                  <Target className="h-4 w-4" /> Cravar conformação
                </button>
                <FeedbackBox fb={fb} />
              </>
            )}
            <div className="flex flex-wrap gap-1.5">
              {ALVOS.map((a) => (
                <span key={a} className={cn("chip font-mono", acertos.includes(a) ? "bg-chem-success/15 text-chem-success" : "bg-slate-200/70 text-muted dark:bg-white/5")}>
                  {a}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass p-4 text-sm text-muted">
            No etano, as três interações H/H eclipsadas somam uma barreira de <span className="font-mono text-lab-dark dark:text-lab-light">12 kJ/mol</span>. O
            desafio fica no butano, onde as metilas criam quatro conformações diferentes.
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cicloalcanos: inversão de cadeira
// ---------------------------------------------------------------------------

const DESAFIO_ANEIS = ["metilcicloexano", "terc-butilcicloexano", "cis-12-dimetilcicloexano", "trans-12-dimetilcicloexano"];
type Escolha = "A" | "B" | "iguais";

function PainelCicloalcanos({ onConcluir }: { onConcluir: () => void }) {
  const { addXp } = useAuth();
  const [dados, setDados] = useState<Record<string, RingFlipData> | null>(null);
  const [mol, setMol] = useState("metilcicloexano");
  const [frame, setFrame] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [acertos, setAcertos] = useState<string[]>([]);
  const [fb, setFb] = useState<Feedback>(null);
  const dir = useRef(1);

  useEffect(() => {
    import("@/data/ringFlip").then((m) => setDados(m.RING_FLIP));
  }, []);

  const d = dados?.[mol];
  const n = d?.frames.length ?? 1;
  const ultimo = n - 1;

  useEffect(() => {
    if (!tocando || !d) return;
    const id = setInterval(() => {
      setFrame((f) => {
        const next = f + dir.current;
        if (next > ultimo || next < 0) {
          dir.current *= -1;
          setTocando(false);
          return f;
        }
        return next;
      });
    }, 70);
    return () => clearInterval(id);
  }, [tocando, d, ultimo]);

  const sdf = useMemo(() => (d ? toMolBlock(d.elementos, d.ligacoes, d.frames[frame], d.nome) : undefined), [d, frame]);

  // Rótulo da conformação: chaves do caminho + estado de transição (≈ meia-cadeira) em cada metade
  const rotulo = useMemo(() => {
    if (!d) return "";
    const e = d.energiaMMFF;
    const metade = Math.floor(ultimo / 2);
    const ts1 = e.slice(0, Math.floor(ultimo / 4) + 1).reduce((bi, v, i, arr) => (v > arr[bi] ? i : bi), 0);
    const off = ultimo - Math.floor(ultimo / 4);
    const ts2 = off + e.slice(off).reduce((bi, v, i, arr) => (v > arr[bi] ? i : bi), 0);
    if (Math.abs(frame - ts1) <= 1 || Math.abs(frame - ts2) <= 1) return "≈ meia-cadeira (estado de transição)";
    let melhor = { i: 0, dist: Infinity };
    d.rotulos.forEach((r, i) => {
      if (r && Math.abs(i - frame) < melhor.dist) melhor = { i, dist: Math.abs(i - frame) };
    });
    const base = d.rotulos[melhor.i] ?? "";
    if (melhor.dist === 0) return base;
    return frame < metade && melhor.i === 0 ? "cadeira → meia-cadeira" : `próximo de: ${base.toLowerCase()}`;
  }, [d, frame, ultimo]);

  const naCadeiraA = frame <= 1;
  const naCadeiraB = frame >= ultimo - 1;
  const highlight = useMemo(() => {
    if (!d) return [];
    if (naCadeiraA) return [{ atoms: d.cadeiraA.diaxial, color: DANGER }];
    if (naCadeiraB) return [{ atoms: d.cadeiraB.diaxial, color: DANGER }];
    return [];
  }, [d, naCadeiraA, naCadeiraB]);

  const chart = useMemo(() => d?.energiaMMFF.map((energia, i) => ({ i, energia })) ?? [], [d]);
  const ref = CADEIRAS_REF[mol];

  const descrever = (c: RingFlipData["cadeiraA"]) =>
    c.substituintes.length ? c.substituintes.map((s) => `C${s.ringPos}: ${s.posicao}`).join(" · ") : "sem substituintes";

  const responder = (escolha: Escolha) => {
    if (!d || !ref) return;
    const todosEq = (c: RingFlipData["cadeiraA"]) => c.substituintes.every((s) => s.posicao === "equatorial");
    const certa: Escolha = ref.maisEstavel === "iguais" ? "iguais" : todosEq(d.cadeiraA) ? "A" : "B";
    if (escolha === certa) {
      if (!acertos.includes(mol)) {
        const novos = [...acertos, mol];
        setAcertos(novos);
        void addXp(XP_ACERTO, { rota: "/organica-1#simulador-conformacional", titulo: "Simulador Conformacional" });
        if (novos.length === DESAFIO_ANEIS.length) onConcluir();
      }
      setFb({ ok: true, texto: `Correto! ${ref.explicacao} (ΔE ≈ ${ref.deltaE} kJ/mol)` });
    } else {
      setFb({ ok: false, texto: "Ainda não. Leve o anel às duas cadeiras, observe onde ficam os grupos e procure as interações 1,3-diaxiais em vermelho." });
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <div className="glass flex flex-col overflow-hidden">
        <div className="flex flex-wrap gap-1.5 p-4 pb-0">
          {(dados ? Object.values(dados) : []).map((m) => (
            <button
              key={m.key}
              onClick={() => {
                setMol(m.key);
                setFrame(0);
                dir.current = 1;
                setTocando(false);
                setFb(null);
              }}
              className={cn(
                "chip px-3 py-1 text-xs",
                mol === m.key ? "bg-chem-primary text-lab-background" : "bg-slate-200/70 text-muted dark:bg-white/5",
              )}
            >
              {acertos.includes(m.key) && <CheckCircle2 className="h-3 w-3" />}
              {m.nome}
            </button>
          ))}
        </div>
        <div className="relative min-h-[320px] flex-1">
          {sdf ? (
            <Molecule3DViewer sdf={sdf} preserveView spin={false} transparent={false} highlight={highlight} zoom={1.35} className="absolute inset-0" />
          ) : (
            <p className="p-6 text-sm text-muted">Carregando trajetórias…</p>
          )}
        </div>
        <div className="space-y-3 border-t border-slate-200/70 p-4 dark:border-white/5">
          <div className="flex items-center gap-3">
            <button
              className="btn-ghost !px-3 !py-2"
              onClick={() => {
                if (frame >= ultimo) dir.current = -1;
                else if (frame <= 0) dir.current = 1;
                setTocando((t) => !t);
              }}
              aria-label={tocando ? "Pausar" : "Animar inversão de cadeira"}
            >
              {tocando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={ultimo}
              value={frame}
              onChange={(ev) => {
                setTocando(false);
                setFrame(Number(ev.target.value));
              }}
              className="flex-1 accent-chem-primary"
              aria-label="Coordenada da inversão de cadeira"
            />
            <button className="btn-ghost !px-3 !py-2" onClick={() => setFrame(0)} aria-label="Voltar à cadeira inicial">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-chem-primary">{rotulo}</span>
            <span className="font-mono">E (MMFF94) = {d ? d.energiaMMFF[frame].toFixed(1) : "–"} kJ/mol</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="glass p-4">
          <p className="mb-2 text-sm font-semibold">Perfil de energia da inversão (MMFF94)</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="i" type="number" domain={[0, ultimo]} tick={false} label={{ value: "coordenada de reação", position: "insideBottom", fill: "#94A3B8", fontSize: 11, offset: 0 }} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v).toFixed(1)} kJ/mol`, "E"]} labelFormatter={(l) => d?.rotulos[Number(l)] ?? `quadro ${l}`} />
                <Line type="monotone" dataKey="energia" stroke="#8B5CF6" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                {d && <ReferenceDot x={frame} y={d.energiaMMFF[frame]} r={6} fill="#06B6D4" stroke="#F8FAFC" strokeWidth={2} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 font-mono text-[11px] text-muted">
            Referência (cicloexano): cadeira {CICLOEXANO_REF.cadeira} · meia-cadeira {CICLOEXANO_REF["meia-cadeira"]} · bote-torcido{" "}
            {CICLOEXANO_REF["bote-torcido"]} · bote {CICLOEXANO_REF.bote} kJ/mol ({CICLOEXANO_REF.fonte})
          </p>
        </div>

        {d && (
          <div className="glass grid grid-cols-2 gap-3 p-4 text-sm">
            <div className={cn("rounded-lg p-3", naCadeiraA ? "bg-chem-primary/10 ring-1 ring-chem-primary/40" : "bg-slate-200/50 dark:bg-white/5")}>
              <p className="font-semibold">Cadeira inicial</p>
              <p className="mt-1 font-mono text-xs text-muted">{descrever(d.cadeiraA)}</p>
            </div>
            <div className={cn("rounded-lg p-3", naCadeiraB ? "bg-chem-primary/10 ring-1 ring-chem-primary/40" : "bg-slate-200/50 dark:bg-white/5")}>
              <p className="font-semibold">Cadeira invertida</p>
              <p className="mt-1 font-mono text-xs text-muted">{descrever(d.cadeiraB)}</p>
            </div>
            <p className="col-span-2 text-xs text-muted">
              Em <span className="font-semibold text-chem-danger">vermelho</span>: átomos em interação 1,3-diaxial (visíveis nas cadeiras).
            </p>
          </div>
        )}

        <div className="glass space-y-3 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Target className="h-4 w-4 text-chem-primary" /> Desafio: qual cadeira é a mais estável?
            <span className="ml-auto font-mono text-xs text-muted">{acertos.length}/4</span>
          </p>
          {ref ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["A", "Cadeira inicial"],
                    ["B", "Cadeira invertida"],
                    ["iguais", "Mesma energia"],
                  ] as const
                ).map(([k, label]) => (
                  <button key={k} className="btn-ghost !px-2 text-xs" onClick={() => responder(k)}>
                    {label}
                  </button>
                ))}
              </div>
              <FeedbackBox fb={fb} />
            </>
          ) : (
            <p className="text-sm text-muted">O cicloexano tem as duas cadeiras idênticas. Escolha uma molécula substituída para o desafio.</p>
          )}
        </div>
      </div>
    </div>
  );
}
