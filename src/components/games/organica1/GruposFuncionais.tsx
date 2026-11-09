"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, CheckCircle2, Droplets, Flame, Magnet, Trophy, XCircle } from "lucide-react";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { useAuth } from "@/context/AuthContext";
import {
  COMPOSTOS,
  DUELOS,
  FONTE_PROPRIEDADES,
  GRUPOS,
  QUESTOES_NOMENCLATURA,
  SERIES,
  type CompostoPropriedades,
  type Forca,
} from "@/data/gruposFuncionais";
import { cn } from "@/lib/utils";

const DISCIPLINA = "organica-1";
const JOGO = "grupos-funcionais";
const XP_ACERTO = 10;
const XP_CONCLUSAO = 100;
const EXPERIMENTO = { rota: "/organica-1#grupos-funcionais", titulo: "Grupos Funcionais, Nomenclatura e Propriedades Físicas" };

type Aba = "nomenclatura" | "propriedades";
type Feedback = { ok: boolean; texto: string } | null;

const COR_FORCA: Record<Forca, string> = {
  "dispersão de London": "bg-slate-200/70 text-lab-dark dark:bg-white/10 dark:text-lab-light",
  "dipolo-dipolo": "bg-chem-orbital/15 text-chem-orbital",
  "ligação de hidrogênio": "bg-chem-primary/15 text-chem-primary",
};

const tooltipStyle = {
  background: "rgba(15,23,42,0.92)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#F8FAFC",
  fontFamily: "'JetBrains Mono Variable', monospace",
  fontSize: 12,
};

function embaralhar<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const fmtNum = (n: number, casas = 1) => n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
const fmtSolub = (c: CompostoPropriedades) =>
  c.solubilidade === null ? "miscível" : c.solubilidade < 0.01 ? `${fmtNum(c.solubilidade * 10000, 0)} mg/L` : `${fmtNum(c.solubilidade)} g/100 mL`;

export default function GruposFuncionais() {
  const [aba, setAba] = useState<Aba>("nomenclatura");
  const [nomeFeitos, setNomeFeitos] = useState<string[]>([]);
  const [duelosFeitos, setDuelosFeitos] = useState<number[]>([]);
  const [bonus, setBonus] = useState(false);
  const { concluirJogo, profile } = useAuth();
  const jaConcluido = profile?.progresso.modulos?.[DISCIPLINA]?.concluidos.includes(JOGO) ?? false;

  useEffect(() => {
    if (nomeFeitos.length === QUESTOES_NOMENCLATURA.length && duelosFeitos.length === DUELOS.length && !jaConcluido) {
      void concluirJogo(DISCIPLINA, JOGO, XP_CONCLUSAO).then((p) => p && setBonus(true));
    }
  }, [nomeFeitos, duelosFeitos, jaConcluido, concluirJogo]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-slate-200/60 p-1 dark:bg-ui-bg/60" role="tablist">
          {(
            [
              ["nomenclatura", `Grupos e nomenclatura · ${nomeFeitos.length}/${QUESTOES_NOMENCLATURA.length}`],
              ["propriedades", `Propriedades físicas · ${duelosFeitos.length}/${DUELOS.length}`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={aba === id}
              onClick={() => setAba(id)}
              className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold transition", aba === id ? "bg-chem-primary text-lab-background" : "text-muted hover:text-chem-primary")}
            >
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
      {aba === "nomenclatura" ? (
        <Nomenclatura feitos={nomeFeitos} onFeito={(id) => setNomeFeitos((f) => (f.includes(id) ? f : [...f, id]))} />
      ) : (
        <Propriedades feitos={duelosFeitos} onFeito={(i) => setDuelosFeitos((f) => (f.includes(i) ? f : [...f, i]))} />
      )}
    </div>
  );
}

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
          className={cn("flex items-start gap-2 rounded-lg px-3 py-2 text-sm", fb.ok ? "bg-chem-success/10 text-chem-success" : "bg-chem-danger/10 text-chem-danger")}
        >
          {fb.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          {fb.texto}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Nomenclatura
// ---------------------------------------------------------------------------

function Nomenclatura({ feitos, onFeito }: { feitos: string[]; onFeito: (id: string) => void }) {
  const { addXp } = useAuth();
  const [idx, setIdx] = useState(0);
  const [grupoOk, setGrupoOk] = useState(false);
  const [nomeOk, setNomeOk] = useState(false);
  const [fb, setFb] = useState<Feedback>(null);
  const q = QUESTOES_NOMENCLATURA[idx];
  const opcoes = useMemo(() => embaralhar([q.nome, ...q.distratores], idx * 31 + 7), [q, idx]);

  useEffect(() => {
    const feito = feitos.includes(q.id);
    setGrupoOk(feito);
    setNomeOk(feito);
    setFb(null);
    // reinicia ao trocar de questão
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const escolherGrupo = (g: string) => {
    if (grupoOk) return;
    if (g !== q.grupo) return setFb({ ok: false, texto: `Não é ${g}. Procure o heteroátomo e o que está ligado a ele (C=O? O–H? N?).` });
    setGrupoOk(true);
    void addXp(XP_ACERTO, EXPERIMENTO);
    setFb({ ok: true, texto: `Isso, é ${q.grupo}! +${XP_ACERTO} XP. Agora o nome IUPAC.` });
  };

  const escolherNome = (n: string) => {
    if (!grupoOk || nomeOk) return;
    if (n !== q.nome) return setFb({ ok: false, texto: `${n} não está certo. ${q.dica}` });
    setNomeOk(true);
    void addXp(XP_ACERTO, EXPERIMENTO);
    onFeito(q.id);
    setFb({ ok: true, texto: `Correto: ${q.nome}. ${q.dica} +${XP_ACERTO} XP` });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {QUESTOES_NOMENCLATURA.map((x, i) => (
          <button
            key={x.id}
            onClick={() => setIdx(i)}
            aria-label={`Questão ${i + 1}`}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs transition",
              i === idx ? "bg-chem-primary text-lab-background" : feitos.includes(x.id) ? "bg-chem-success/15 text-chem-success" : "bg-slate-200/70 text-muted dark:bg-white/5",
            )}
          >
            {feitos.includes(x.id) && i !== idx ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="glass flex flex-col items-center justify-center p-6">
          <Molecule2DStick smiles={q.smiles} width={360} height={240} explicitHydrogens={false} />
          <p className="mt-2 text-xs text-muted">Fórmula em bastão (IUPAC): cada vértice é um carbono com os H implícitos.</p>
        </div>
        <div className="glass space-y-4 p-4">
          <div>
            <p className="mb-2 text-sm font-semibold">1 · Qual é o grupo funcional?</p>
            <div className="flex flex-wrap gap-1.5">
              {GRUPOS.map((g) => (
                <button
                  key={g}
                  onClick={() => escolherGrupo(g)}
                  disabled={grupoOk}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition",
                    grupoOk && g === q.grupo ? "bg-chem-success text-white disabled:opacity-100" : "bg-slate-200/70 text-muted hover:text-chem-primary disabled:opacity-50 dark:bg-white/5",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className={cn(!grupoOk && "pointer-events-none opacity-40")}>
            <p className="mb-2 text-sm font-semibold">2 · Qual é o nome IUPAC?</p>
            <div className="grid grid-cols-2 gap-2">
              {opcoes.map((n) => (
                <button
                  key={n}
                  onClick={() => escolherNome(n)}
                  className={cn(
                    "rounded-lg border px-3 py-2 font-mono text-sm transition",
                    nomeOk && n === q.nome ? "border-chem-success bg-chem-success/15 text-chem-success" : "border-slate-300/70 hover:border-chem-primary hover:text-chem-primary dark:border-white/10",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <FeedbackBox fb={fb} />
          {nomeOk && idx < QUESTOES_NOMENCLATURA.length - 1 && (
            <button className="btn-primary w-full" onClick={() => setIdx(idx + 1)}>
              Próxima molécula <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Propriedades físicas
// ---------------------------------------------------------------------------

function Propriedades({ feitos, onFeito }: { feitos: number[]; onFeito: (i: number) => void }) {
  const [serieId, setSerieId] = useState(SERIES[0].id);
  const serie = SERIES.find((s) => s.id === serieId)!;
  const [selId, setSelId] = useState(serie.compostos[0]);
  const sel = COMPOSTOS[selId] ?? COMPOSTOS[serie.compostos[0]];

  useEffect(() => {
    setSelId(serie.compostos[0]);
  }, [serie]);

  const dados = serie.compostos.map((id) => {
    const c = COMPOSTOS[id];
    return { id, nome: c.nome, pe: c.pe, dipolo: c.dipolo };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {SERIES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSerieId(s.id)}
            className={cn("chip px-3 py-1.5 text-sm", s.id === serieId ? "bg-chem-primary text-lab-background" : "bg-slate-200/70 text-muted dark:bg-white/5")}
          >
            {s.titulo}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">{serie.descricao}</p>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="glass space-y-3 p-4">
          <div className="flex flex-wrap gap-1.5">
            {serie.compostos.map((id) => (
              <button
                key={id}
                onClick={() => setSelId(id)}
                className={cn("rounded-md px-2.5 py-1 text-xs transition", id === sel.id ? "bg-chem-orbital text-white" : "bg-slate-200/70 text-muted hover:text-chem-orbital dark:bg-white/5")}
              >
                {COMPOSTOS[id].nome}
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <Molecule2DStick smiles={sel.smiles} width={300} height={170} explicitHydrogens={false} label={`${sel.nome} · ${sel.formula} · ${fmtNum(sel.massaMolar, 2)} g/mol`} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Medida icone={<Flame className="h-4 w-4 text-chem-danger" />} rotulo="Ebulição" valor={`${fmtNum(sel.pe)} °C`} />
            <Medida icone={<Magnet className="h-4 w-4 text-chem-orbital" />} rotulo="Dipolo" valor={`${fmtNum(sel.dipolo, 2)} D`} />
            <Medida icone={<Droplets className="h-4 w-4 text-chem-primary" />} rotulo="Solub. em água" valor={fmtSolub(sel)} />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted">Forças intermoleculares</p>
            <div className="flex flex-wrap gap-1.5">
              {(["dispersão de London", "dipolo-dipolo", "ligação de hidrogênio"] as Forca[]).map((f) => (
                <span key={f} className={cn("chip", sel.forcas.includes(f) ? COR_FORCA[f] : "bg-transparent text-muted line-through opacity-50")}>
                  {f}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              {sel.lhComAgua ? "Faz ligação de hidrogênio com a água (pelo par isolado do O/N ou pelo H–O)." : "Não interage por ligação de hidrogênio com a água: praticamente insolúvel."}
            </p>
          </div>
        </div>

        <div className="glass p-4">
          <p className="mb-2 text-sm font-semibold">Ponto de ebulição (°C)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 40, left: -8 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 11, fill: "#94A3B8" }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(148,163,184,0.08)" }} formatter={(v) => [`${fmtNum(Number(v))} °C`, "PE"]} />
                <Bar dataKey="pe" radius={[6, 6, 0, 0]} onClick={(d) => setSelId((d as unknown as { id: string }).id)} cursor="pointer">
                  {dados.map((d) => (
                    <Cell key={d.id} fill={d.id === sel.id ? "#06B6D4" : "#8B5CF6"} fillOpacity={d.id === sel.id ? 1 : 0.55} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 font-mono text-[11px] text-muted">Fonte: {FONTE_PROPRIEDADES}</p>
        </div>
      </div>

      <Duelos feitos={feitos} onFeito={onFeito} />
    </div>
  );
}

function Medida({ icone, rotulo, valor }: { icone: React.ReactNode; rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-slate-200/50 p-2 dark:bg-white/5">
      <p className="flex items-center justify-center gap-1 text-[11px] text-muted">
        {icone}
        {rotulo}
      </p>
      <p className="mt-0.5 font-mono text-sm font-semibold">{valor}</p>
    </div>
  );
}

function Duelos({ feitos, onFeito }: { feitos: number[]; onFeito: (i: number) => void }) {
  const { addXp } = useAuth();
  const [i, setI] = useState(0);
  const [fb, setFb] = useState<Feedback>(null);
  const d = DUELOS[i];
  const lados = useMemo(() => embaralhar([d.a, d.b], i * 13 + 3), [d, i]);
  const resolvido = feitos.includes(i);

  const escolher = (id: string) => {
    const vencedor = COMPOSTOS[d.a].pe > COMPOSTOS[d.b].pe ? d.a : d.b;
    if (id !== vencedor) return setFb({ ok: false, texto: "Não. Pense em qual força intermolecular cada um consegue fazer e na área de contato." });
    if (!resolvido) {
      void addXp(XP_ACERTO, EXPERIMENTO);
      onFeito(i);
    }
    setFb({ ok: true, texto: `${d.explicacao}${resolvido ? "" : ` +${XP_ACERTO} XP`}` });
  };

  return (
    <div className="glass space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Desafio: quem tem o MAIOR ponto de ebulição?</p>
        <div className="flex gap-1">
          {DUELOS.map((_, k) => (
            <button
              key={k}
              onClick={() => {
                setI(k);
                setFb(null);
              }}
              className={cn(
                "h-7 w-7 rounded-md font-mono text-xs",
                k === i ? "bg-chem-primary text-lab-background" : feitos.includes(k) ? "bg-chem-success/15 text-chem-success" : "bg-slate-200/70 text-muted dark:bg-white/5",
              )}
            >
              {k + 1}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {lados.map((id) => {
          const c = COMPOSTOS[id];
          return (
            <button
              key={id}
              onClick={() => escolher(id)}
              className="flex flex-col items-center rounded-xl border border-slate-300/70 p-3 transition hover:border-chem-primary dark:border-white/10"
            >
              <Molecule2DStick smiles={c.smiles} width={240} height={120} explicitHydrogens={false} />
              <span className="mt-1 font-semibold">{c.nome}</span>
              <span className="font-mono text-xs text-muted">
                {c.formula} · {fmtNum(c.massaMolar, 2)} g/mol{resolvido ? ` · PE ${fmtNum(c.pe)} °C` : ""}
              </span>
            </button>
          );
        })}
      </div>
      <FeedbackBox fb={fb} />
      {resolvido && i < DUELOS.length - 1 && (
        <button
          className="btn-primary w-full"
          onClick={() => {
            setI(i + 1);
            setFb(null);
          }}
        >
          Próximo duelo <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
