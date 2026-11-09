"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, ClipboardList, FileSearch, FlaskConical, Trophy, XCircle } from "lucide-react";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { useAuth } from "@/context/AuthContext";
import { CASOS_CSI, type CasoCSI, type SinalH, type TesteId } from "@/data/csi";
import { cn } from "@/lib/utils";

const DISCIPLINA = "analise-organica";
const JOGO = "csi-quimico";
const XP_CASO = 40;
const XP_CONCLUSAO = 100;
const EXPERIMENTO = { rota: "/analise-organica#csi-quimico", titulo: "CSI Químico" };

type Aba = "bancada" | "iv" | "em" | "h1" | "c13" | "conclusao";
const ABAS: { id: Aba; label: string }[] = [
  { id: "bancada", label: "Bancada (via úmida)" },
  { id: "iv", label: "IV" },
  { id: "em", label: "EM" },
  { id: "h1", label: "RMN ¹H" },
  { id: "c13", label: "RMN ¹³C" },
  { id: "conclusao", label: "Conclusão" },
];

const TESTES: { id: TesteId; nome: string; alvo: string; positivo: string; cor: string }[] = [
  { id: "dnph", nome: "2,4-DNPH", alvo: "aldeídos e cetonas", positivo: "precipitado amarelo/laranja", cor: "#F59E0B" },
  { id: "tollens", nome: "Tollens", alvo: "aldeídos", positivo: "espelho de prata", cor: "#CBD5E1" },
  { id: "lucas", nome: "Lucas (ZnCl₂/HCl)", alvo: "álcoois 2° e 3°", positivo: "turvação", cor: "#E2E8F0" },
  { id: "nahco3", nome: "NaHCO₃", alvo: "ácidos carboxílicos", positivo: "efervescência (CO₂)", cor: "#06B6D4" },
  { id: "beilstein", nome: "Beilstein / AgNO₃", alvo: "haletos", positivo: "chama verde / AgX", cor: "#10B981" },
];

/** Estruturas candidatas: os 6 compostos dos casos + isômeros e parentes que confundem. */
const CANDIDATOS: { id: string; nome: string; smiles: string }[] = [
  ...CASOS_CSI.map((c) => ({ id: c.id, nome: c.nome, smiles: c.smiles })),
  { id: "butanal", nome: "Butanal", smiles: "CCCC=O" },
  { id: "propanoato-de-metila", nome: "Propanoato de metila", smiles: "CCC(=O)OC" },
  { id: "acido-acetico", nome: "Ácido acético", smiles: "CC(=O)O" },
  { id: "benzaldeido", nome: "Benzaldeído", smiles: "O=CC1=CC=CC=C1" },
  { id: "anilina", nome: "Anilina", smiles: "NC1=CC=CC=C1" },
  { id: "propan-2-ol", nome: "Propan-2-ol", smiles: "CC(C)O" },
];
const ORDEM_CANDIDATOS = [...CANDIDATOS].sort((a, b) => a.smiles.length - b.smiles.length || a.id.localeCompare(b.id));

const tooltipStyle = {
  background: "rgba(15,23,42,0.92)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#F8FAFC",
  fontFamily: "'JetBrains Mono Variable', monospace",
  fontSize: 12,
};
const fmt = (n: number, c = 2) => n.toLocaleString("pt-BR", { minimumFractionDigits: c, maximumFractionDigits: c });
const MULT: Record<SinalH["mult"], string> = { s: "singleto", d: "dubleto", t: "tripleto", q: "quarteto", m: "multipleto" };

export default function CSIQuimico() {
  const { concluirJogo, profile } = useAuth();
  const [idx, setIdx] = useState(0);
  const [resolvidos, setResolvidos] = useState<string[]>([]);
  const [bonus, setBonus] = useState(false);
  const jaConcluido = profile?.progresso.modulos?.[DISCIPLINA]?.concluidos.includes(JOGO) ?? false;
  const caso = CASOS_CSI[idx];

  useEffect(() => {
    if (resolvidos.length === CASOS_CSI.length && !jaConcluido) {
      void concluirJogo(DISCIPLINA, JOGO, XP_CONCLUSAO).then((p) => p && setBonus(true));
    }
  }, [resolvidos, jaConcluido, concluirJogo]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {CASOS_CSI.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setIdx(i)}
            className={cn("chip px-3 py-1.5 font-mono text-sm", i === idx ? "bg-chem-primary text-lab-background" : "bg-slate-200/70 text-muted dark:bg-white/5")}
          >
            {resolvidos.includes(c.id) ? <CheckCircle2 className="h-3.5 w-3.5" /> : <FileSearch className="h-3.5 w-3.5" />}
            Caso {String(i + 1).padStart(2, "0")}
          </button>
        ))}
        <span className="ml-auto font-mono text-xs text-muted">
          {resolvidos.length}/{CASOS_CSI.length} casos
        </span>
        {(jaConcluido || bonus) && (
          <span className="chip bg-chem-success/15 text-chem-success">
            <Trophy className="h-3.5 w-3.5" /> Jogo concluído{bonus ? ` · +${XP_CONCLUSAO} XP` : ""}
          </span>
        )}
      </div>
      <Investigacao
        key={caso.id}
        caso={caso}
        numero={idx + 1}
        resolvido={resolvidos.includes(caso.id)}
        onResolvido={() => setResolvidos((r) => (r.includes(caso.id) ? r : [...r, caso.id]))}
        onProximo={idx < CASOS_CSI.length - 1 ? () => setIdx(idx + 1) : undefined}
      />
    </div>
  );
}

interface Evidencia {
  chave: string;
  fonte: string;
  texto: string;
}

function Investigacao({
  caso,
  numero,
  resolvido,
  onResolvido,
  onProximo,
}: {
  caso: CasoCSI;
  numero: number;
  resolvido: boolean;
  onResolvido: () => void;
  onProximo?: () => void;
}) {
  const { addXp } = useAuth();
  const [aba, setAba] = useState<Aba>("bancada");
  const [evid, setEvid] = useState<Evidencia[]>([]);
  const [feitos, setFeitos] = useState<TesteId[]>([]);
  const [fb, setFb] = useState<{ ok: boolean; texto: string } | null>(null);
  const [acertou, setAcertou] = useState(resolvido);

  const carimbar = (e: Evidencia) => setEvid((lista) => (lista.some((x) => x.chave === e.chave) ? lista : [...lista, e]));

  const concluir = (id: string) => {
    if (acertou) return;
    if (id !== caso.id) {
      const nome = CANDIDATOS.find((c) => c.id === id)?.nome;
      return setFb({ ok: false, texto: `${nome} não bate com todas as evidências. Confira M⁺ no EM, a carbonila no IV e os deslocamentos de RMN.` });
    }
    setAcertou(true);
    setFb({ ok: true, texto: `Caso encerrado: a amostra é ${caso.nome}. +${XP_CASO} XP` });
    if (!resolvido) {
      void addXp(XP_CASO, EXPERIMENTO);
      onResolvido();
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        <div className="glass flex flex-wrap items-center gap-3 p-4">
          <FlaskConical className="h-6 w-6 text-chem-danger" />
          <div>
            <p className="font-semibold">Caso {String(numero).padStart(2, "0")}: amostra desconhecida</p>
            <p className="text-xs text-muted">Líquido ou sólido puro, recebido do almoxarifado sem rótulo. Use a bancada e a central espectrométrica.</p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto" aria-label="Instrumentos">
          {ABAS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-1.5 text-sm transition",
                aba === a.id ? "border-chem-primary bg-chem-primary/15 text-chem-primary" : "border-slate-300/70 text-muted hover:text-chem-primary dark:border-white/10",
              )}
            >
              {a.label}
            </button>
          ))}
        </nav>

        <div className="glass p-4">
          {aba === "bancada" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TESTES.map((t) => {
                const r = caso.testes[t.id];
                const feito = feitos.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setFeitos((f) => (f.includes(t.id) ? f : [...f, t.id]));
                      carimbar({ chave: `t-${t.id}`, fonte: t.nome, texto: `${r.positivo ? "POSITIVO" : "negativo"}: ${r.observacao}` });
                    }}
                    className="flex gap-3 rounded-xl border border-slate-300/70 p-3 text-left transition hover:border-chem-primary dark:border-white/10"
                  >
                    <Tubo cor={feito && r.positivo ? t.cor : undefined} feito={feito} />
                    <span className="text-sm">
                      <span className="block font-semibold">{t.nome}</span>
                      <span className="block text-xs text-muted">Detecta {t.alvo}; positivo: {t.positivo}.</span>
                      {feito && (
                        <span className={cn("mt-1 block text-xs font-semibold", r.positivo ? "text-chem-success" : "text-muted")}>
                          {r.positivo ? "Positivo" : "Negativo"}: {r.observacao}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {aba === "iv" && <EspectroIV caso={caso} onCarimbar={carimbar} />}
          {aba === "em" && <EspectroEM caso={caso} onCarimbar={carimbar} />}
          {aba === "h1" && <EspectroH1 caso={caso} onCarimbar={carimbar} />}
          {aba === "c13" && <EspectroC13 caso={caso} onCarimbar={carimbar} />}
          {aba === "conclusao" && (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Qual é a fórmula em bastão da substância misteriosa?</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                {ORDEM_CANDIDATOS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => concluir(c.id)}
                    disabled={acertou && c.id !== caso.id}
                    className={cn(
                      "flex flex-col items-center rounded-xl border p-2 transition",
                      acertou && c.id === caso.id ? "border-chem-success bg-chem-success/10" : "border-slate-300/70 hover:border-chem-primary disabled:opacity-30 dark:border-white/10",
                    )}
                  >
                    <Molecule2DStick smiles={c.smiles} width={150} height={90} explicitHydrogens={false} />
                    <span className="text-xs">{acertou ? c.nome : ""}</span>
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                {fb && (
                  <motion.p
                    key={fb.texto}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="status"
                    className={cn("flex items-start gap-2 rounded-lg px-3 py-2 text-sm", fb.ok ? "bg-chem-success/10 text-chem-success" : "bg-chem-danger/10 text-chem-danger")}
                  >
                    {fb.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                    {fb.texto}
                  </motion.p>
                )}
              </AnimatePresence>
              {acertou && <Laudo caso={caso} />}
              {acertou && onProximo && (
                <button className="btn-primary w-full" onClick={onProximo}>
                  Próximo caso
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <aside className="glass h-fit space-y-2 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <ClipboardList className="h-4 w-4 text-chem-primary" /> Quadro de evidências
        </p>
        {evid.length === 0 ? (
          <p className="text-xs text-muted">Faça testes e clique nos picos dos espectros para carimbar evidências aqui.</p>
        ) : (
          <ul className="space-y-1.5">
            {evid.map((e) => (
              <li key={e.chave} className="rounded-lg bg-slate-200/60 px-2 py-1.5 text-xs dark:bg-white/5">
                <span className="font-mono font-semibold text-chem-primary">{e.fonte}</span> · {e.texto}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function Tubo({ cor, feito }: { cor?: string; feito: boolean }) {
  return (
    <svg viewBox="0 0 30 70" width={30} height={70} className="shrink-0" aria-hidden>
      <path d="M6 4 h18 v50 a9 9 0 0 1 -18 0 z" fill="none" stroke="#94A3B8" strokeWidth={2} />
      <path d="M8 30 h14 v24 a7 7 0 0 1 -14 0 z" fill={feito ? (cor ?? "rgba(148,163,184,0.25)") : "rgba(148,163,184,0.12)"} opacity={0.85} />
    </svg>
  );
}

function EspectroIV({ caso, onCarimbar }: { caso: CasoCSI; onCarimbar: (e: Evidencia) => void }) {
  const [vistos, setVistos] = useState<number[]>([]);
  const dados = useMemo(() => caso.ir.map(([x, t]) => ({ x, t })), [caso]);
  const tDe = (x: number) => dados.reduce((m, d) => (Math.abs(d.x - x) < Math.abs(m.x - x) ? d : m), dados[0]).t;
  return (
    <div>
      <p className="mb-1 text-sm font-semibold">Espectro de infravermelho · %T × número de onda (cm⁻¹)</p>
      <p className="mb-2 text-xs text-muted">Clique nos marcadores das bandas para carimbar o grupo funcional.</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={{ top: 10, right: 12, bottom: 4, left: -16 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="x" type="number" reversed domain={[450, 4000]} ticks={[4000, 3500, 3000, 2500, 2000, 1500, 1000, 500]} tick={{ fontSize: 11, fill: "#94A3B8" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94A3B8" }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} %T`, "Transmitância"]} labelFormatter={(l) => `${l} cm⁻¹`} />
            <Line type="linear" dataKey="t" stroke="#06B6D4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            {caso.irPicos.map((p) => (
              <ReferenceDot
                key={p.x}
                x={p.x}
                y={tDe(p.x)}
                r={7}
                fill={vistos.includes(p.x) ? "#10B981" : "#F43F5E"}
                stroke="#F8FAFC"
                strokeWidth={2}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setVistos((v) => [...v, p.x]);
                  onCarimbar({ chave: `iv-${p.x}`, fonte: "IV", texto: `${p.x} cm⁻¹: ${p.rotulo}` });
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {caso.irPicos.map((p) => (
          <button
            key={p.x}
            onClick={() => {
              setVistos((v) => [...v, p.x]);
              onCarimbar({ chave: `iv-${p.x}`, fonte: "IV", texto: `${p.x} cm⁻¹: ${p.rotulo}` });
            }}
            className={cn("chip font-mono", vistos.includes(p.x) ? "bg-chem-success/15 text-chem-success" : "bg-chem-danger/10 text-chem-danger")}
          >
            {p.x} cm⁻¹{vistos.includes(p.x) ? ` · ${p.rotulo}` : ""}
          </button>
        ))}
      </div>
      <p className="mt-2 font-mono text-[10px] text-muted">Fonte: {caso.irFonte}</p>
    </div>
  );
}

function EspectroEM({ caso, onCarimbar }: { caso: CasoCSI; onCarimbar: (e: Evidencia) => void }) {
  const notas = new Map(caso.msNotas.map((n) => [n.mz, n.rotulo]));
  const max = Math.max(...caso.ms.map((p) => p.mz));
  const dados = caso.ms.map((p) => ({ ...p, nota: notas.get(p.mz) }));
  const clicar = (mz: number, int: number) => {
    const n = notas.get(mz);
    onCarimbar({ chave: `em-${mz}`, fonte: "EM", texto: `m/z ${mz} (${fmt(int, 0)}%)${n ? `: ${n}` : ": fragmento sem atribuição"}` });
  };
  return (
    <div>
      <p className="mb-1 text-sm font-semibold">Espectro de massas (IE, 70 eV) · abundância relativa × m/z</p>
      <p className="mb-2 text-xs text-muted">Clique nas barras. Procure o íon molecular (maior m/z relevante), o pico base e padrões isotópicos (M+2).</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 10, right: 12, bottom: 4, left: -16 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
            <XAxis dataKey="mz" type="number" domain={[10, max + 10]} tick={{ fontSize: 11, fill: "#94A3B8" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94A3B8" }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "abundância"]} labelFormatter={(l) => `m/z ${l}`} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
            <Bar dataKey="int" barSize={4} onClick={(d) => clicar((d as unknown as { mz: number }).mz, (d as unknown as { int: number }).int)} cursor="pointer">
              {dados.map((d) => (
                <Cell key={d.mz} fill={d.nota ? "#8B5CF6" : "#64748B"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {caso.msNotas.map((n) => (
          <button key={n.mz} onClick={() => clicar(n.mz, caso.ms.find((p) => p.mz === n.mz)?.int ?? 0)} className="chip bg-chem-orbital/15 font-mono text-chem-orbital">
            m/z {n.mz}
          </button>
        ))}
      </div>
      <p className="mt-2 font-mono text-[10px] text-muted">Fonte: {caso.msFonte}</p>
    </div>
  );
}

const PASCAL: Record<SinalH["mult"], number[]> = { s: [1], d: [1, 1], t: [1, 2, 1], q: [1, 3, 3, 1], m: [1, 2, 3, 2, 1] };
const MHZ = 400;

function EspectroH1({ caso, onCarimbar }: { caso: CasoCSI; onCarimbar: (e: Evidencia) => void }) {
  const [sel, setSel] = useState<number | null>(null);
  const W = 760;
  const H = 230;
  const dMax = Math.max(10, Math.ceil(Math.max(...caso.h1.map((s) => s.delta)) + 0.5));
  const xDe = (d: number) => 30 + ((dMax - d) / dMax) * (W - 60);
  const nMax = Math.max(...caso.h1.map((s) => s.n));
  const escolher = (k: number) => {
    const s = caso.h1[k];
    setSel(k);
    onCarimbar({
      chave: `h1-${s.delta}`,
      fonte: "RMN ¹H",
      texto: `δ ${fmt(s.delta)} (${s.n}H, ${MULT[s.mult]}${s.J ? `, J = ${fmt(s.J, 1)} Hz` : ""}): ${s.atrib}`,
    });
  };
  return (
    <div>
      <p className="mb-1 text-sm font-semibold">RMN de ¹H (400 MHz, CDCl₃) · intensidade × δ (ppm)</p>
      <p className="mb-2 text-xs text-muted">Clique em cada sinal: o desdobramento n + 1 e a integração (número de H) aparecem no quadro.</p>
      <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full rounded-lg bg-white/40 dark:bg-lab-background/40" role="img" aria-label="Espectro de RMN de hidrogênio">
        <line x1={30} y1={H} x2={W - 30} y2={H} stroke="#94A3B8" />
        {Array.from({ length: dMax + 1 }, (_, i) => dMax - i).map((d) => (
          <g key={d}>
            <line x1={xDe(d)} y1={H} x2={xDe(d)} y2={H + 5} stroke="#94A3B8" />
            <text x={xDe(d)} y={H + 18} textAnchor="middle" fontSize={11} fill="#94A3B8" className="font-mono">
              {d}
            </text>
          </g>
        ))}
        {caso.h1.map((s, k) => {
          // área de clique limitada pela distância ao sinal vizinho; rótulos escalonados quando colidem
          const vizinhos = caso.h1.filter((_, j) => j !== k).map((o) => Math.abs(xDe(o.delta) - xDe(s.delta)));
          const larg = Math.min(36, Math.max(8, Math.min(...vizinhos, 72) - 2));
          const escalona = caso.h1.some((o, j) => j < k && Math.abs(xDe(o.delta) - xDe(s.delta)) < 24) ? 16 * k : 0;
          const p = PASCAL[s.mult];
          const soma = p.reduce((a, b) => a + b, 0);
          const sepPpm = (s.J ?? 0) / MHZ;
          const alturaTotal = ((H - 40) * s.n) / nMax;
          const centro = (p.length - 1) / 2;
          return (
            <g key={k} onClick={() => escolher(k)} className="cursor-pointer">
              <rect x={xDe(s.delta) - larg / 2} y={10} width={larg} height={H - 10} fill={sel === k ? "rgba(6,182,212,0.12)" : "transparent"} />
              {p.map((c, i) => {
                const x = xDe(s.delta + (i - centro) * sepPpm * 8);
                const h = (alturaTotal * c) / Math.max(...p) / (soma > 4 ? 1.2 : 1);
                return <line key={i} x1={x} y1={H} x2={x} y2={H - h} stroke={sel === k ? "#06B6D4" : "#8B5CF6"} strokeWidth={2} />;
              })}
              <text x={xDe(s.delta)} y={H - alturaTotal - 8 - escalona} textAnchor="middle" fontSize={11} fill="#F43F5E" className="font-mono">
                {s.n}H
              </text>
            </g>
          );
        })}
        <text x={W - 30} y={H - 6} textAnchor="end" fontSize={10} fill="#94A3B8">
          δ (ppm)
        </text>
      </svg>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {caso.h1.map((s, k) => (
          <button
            key={k}
            onClick={() => escolher(k)}
            className={cn("chip font-mono", sel === k ? "bg-chem-primary/20 text-chem-primary" : "bg-chem-orbital/15 text-chem-orbital")}
          >
            δ {fmt(s.delta)}
          </button>
        ))}
      </div>
      <p className="mt-1 text-[10px] text-muted">
        Multipletos desenhados com espaçamento ampliado (8×) para leitura. Valores de referência em CDCl₃ (Pavia; Silverstein).
      </p>
    </div>
  );
}

function EspectroC13({ caso, onCarimbar }: { caso: CasoCSI; onCarimbar: (e: Evidencia) => void }) {
  const carimbar = (c: CasoCSI["c13"][number]) => onCarimbar({ chave: `c13-${c.delta}`, fonte: "RMN ¹³C", texto: `δ ${fmt(c.delta, 1)}: ${c.atrib}` });
  const W = 760;
  const H = 200;
  const xDe = (d: number) => 30 + ((220 - d) / 220) * (W - 60);
  const regioes = [
    { de: 210, ate: 165, rotulo: "carbonilas", cor: "rgba(244,63,94,0.10)" },
    { de: 160, ate: 110, rotulo: "aromáticos / alcenos", cor: "rgba(139,92,246,0.10)" },
    { de: 60, ate: 10, rotulo: "alifáticos", cor: "rgba(6,182,212,0.10)" },
  ];
  return (
    <div>
      <p className="mb-1 text-sm font-semibold">RMN de ¹³C desacoplado (100 MHz, CDCl₃) · δ de 220 a 0 ppm</p>
      <p className="mb-2 text-xs text-muted">Cada linha é um carbono quimicamente diferente. Clique para carimbar.</p>
      <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full rounded-lg bg-white/40 dark:bg-lab-background/40" role="img" aria-label="Espectro de RMN de carbono 13">
        {regioes.map((r) => (
          <g key={r.rotulo}>
            <rect x={xDe(r.de)} y={10} width={xDe(r.ate) - xDe(r.de)} height={H - 10} fill={r.cor} />
            <text x={(xDe(r.de) + xDe(r.ate)) / 2} y={24} textAnchor="middle" fontSize={10} fill="#94A3B8">
              {r.rotulo}
            </text>
          </g>
        ))}
        <line x1={30} y1={H} x2={W - 30} y2={H} stroke="#94A3B8" />
        {[220, 200, 180, 160, 140, 120, 100, 80, 60, 40, 20, 0].map((d) => (
          <text key={d} x={xDe(d)} y={H + 18} textAnchor="middle" fontSize={11} fill="#94A3B8" className="font-mono">
            {d}
          </text>
        ))}
        {caso.c13.map((c, k) => {
          // linhas muito próximas (ex.: 128,6 e 128,3): rótulos escalonados para não se sobrepor
          const nivel = caso.c13.slice(0, k).filter((o) => Math.abs(xDe(o.delta) - xDe(c.delta)) < 30).length;
          return (
            <g key={c.delta} className="cursor-pointer" onClick={() => carimbar(c)}>
              <line x1={xDe(c.delta)} y1={H} x2={xDe(c.delta)} y2={60 + 14 * nivel} stroke="#06B6D4" strokeWidth={2.5} />
              <text x={xDe(c.delta)} y={52 + 14 * nivel} textAnchor="middle" fontSize={10} fill="#06B6D4" className="font-mono">
                {fmt(c.delta, 1)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {caso.c13.map((c) => (
          <button key={c.delta} onClick={() => carimbar(c)} className="chip bg-chem-primary/15 font-mono text-chem-primary">
            δ {fmt(c.delta, 1)}
          </button>
        ))}
      </div>
      <p className="mt-1 text-[10px] text-muted">Valores de referência em CDCl₃ (Pavia; Silverstein).</p>
    </div>
  );
}

function Laudo({ caso }: { caso: CasoCSI }) {
  return (
    <div className="space-y-2 rounded-xl border border-chem-success/40 p-4">
      <p className="text-sm font-semibold">Laudo pericial: {caso.nome}</p>
      <div className="flex justify-center">
        <Molecule2DStick smiles={caso.smiles} width={240} height={120} explicitHydrogens={false} label={`${caso.formula} · ${fmt(caso.massaMolar)} g/mol`} />
      </div>
      <p className="text-sm">{caso.laudo}</p>
      <div className="grid gap-2 text-xs md:grid-cols-2">
        <div>
          <p className="font-semibold text-muted">IV</p>
          {caso.irPicos.map((p) => (
            <p key={p.x} className="font-mono">
              {p.x} cm⁻¹ · {p.rotulo}
            </p>
          ))}
        </div>
        <div>
          <p className="font-semibold text-muted">EM</p>
          {caso.msNotas.map((n) => (
            <p key={n.mz} className="font-mono">
              m/z {n.mz} · {n.rotulo}
            </p>
          ))}
        </div>
        <div>
          <p className="font-semibold text-muted">RMN ¹H</p>
          {caso.h1.map((s) => (
            <p key={s.delta} className="font-mono">
              δ {fmt(s.delta)} ({s.n}H, {s.mult}) · {s.atrib}
            </p>
          ))}
        </div>
        <div>
          <p className="font-semibold text-muted">RMN ¹³C</p>
          {caso.c13.map((c) => (
            <p key={c.delta} className="font-mono">
              δ {fmt(c.delta, 1)} · {c.atrib}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
