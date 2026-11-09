"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Lightbulb, RotateCcw, Trophy, Undo2, X, XCircle } from "lucide-react";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { Molecule3DViewer, type AtomHighlight, type AtomLabel } from "@/components/Molecule3DViewer";
import { useAuth } from "@/context/AuthContext";
import { ALVOS_AROMATICOS } from "@/data/aromaticos";
import { CARTAS, INFO_GRUPO, aplicarSEAr, avaliar, chave, geometria3D, paresOrto, smilesDe, type Anel, type Carta } from "@/lib/aromaticos";
import { cn } from "@/lib/utils";

const DISCIPLINA = "organica-2";
const JOGO = "deckbuilder-aromaticos";
const XP_ALVO = 30;
const XP_ROTA_MINIMA = 10;
const XP_CONCLUSAO = 100;
const EXPERIMENTO = { rota: "/organica-2#deckbuilder-aromaticos", titulo: "Deckbuilder de Reações Aromáticas" };
const VAZIO: Anel = [null, null, null, null, null, null];

type Feedback = { ok: boolean; texto: string } | null;
interface Passo {
  carta: Carta;
  anel: Anel;
  pos?: number;
}

const COR_TIPO: Record<Carta["tipo"], string> = {
  SEAr: "bg-chem-primary/15 text-chem-primary",
  oxidação: "bg-chem-danger/15 text-chem-danger",
  redução: "bg-chem-success/15 text-chem-success",
  SNAr: "bg-chem-orbital/15 text-chem-orbital",
};

export default function DeckbuilderAromaticos() {
  const { addXp, concluirJogo, profile } = useAuth();
  const [alvoIdx, setAlvoIdx] = useState(0);
  const [passos, setPassos] = useState<Passo[]>([]);
  const [pendente, setPendente] = useState<{ carta: Carta; posicoes: number[]; nota?: string } | null>(null);
  const [fb, setFb] = useState<Feedback>(null);
  const [dica, setDica] = useState(false);
  const [feitos, setFeitos] = useState<string[]>([]);
  const [bonus, setBonus] = useState(false);
  const jaConcluido = profile?.progresso.modulos?.[DISCIPLINA]?.concluidos.includes(JOGO) ?? false;

  const alvo = ALVOS_AROMATICOS[alvoIdx];
  const anel = passos.length ? passos[passos.length - 1].anel : VAZIO;
  const sintetizado = chave(anel) === chave(alvo.anel);
  const geo = useMemo(() => geometria3D(anel), [anel]);
  const ultimaPos = passos[passos.length - 1]?.pos;

  useEffect(() => {
    if (feitos.length === ALVOS_AROMATICOS.length && !jaConcluido) {
      void concluirJogo(DISCIPLINA, JOGO, XP_CONCLUSAO).then((p) => p && setBonus(true));
    }
  }, [feitos, jaConcluido, concluirJogo]);

  const reiniciar = (idx = alvoIdx) => {
    setAlvoIdx(idx);
    setPassos([]);
    setPendente(null);
    setFb(null);
    setDica(false);
  };

  const registrar = (novo: Anel, carta: Carta, pos?: number) => {
    const lista = [...passos, { carta, anel: novo, pos }];
    setPassos(lista);
    setPendente(null);
    if (chave(novo) === chave(alvo.anel)) {
      const minima = lista.length === alvo.minimo;
      const xp = XP_ALVO + (minima ? XP_ROTA_MINIMA : 0);
      if (!feitos.includes(alvo.id)) {
        setFeitos((f) => [...f, alvo.id]);
        void addXp(xp, EXPERIMENTO);
      }
      setFb({
        ok: true,
        texto: `${alvo.nome} sintetizado em ${lista.length} etapa(s)${minima ? " (rota mínima!)" : ""}. ${alvo.contexto}${feitos.includes(alvo.id) ? "" : ` +${xp} XP`}`,
      });
    } else {
      const ortos = paresOrto(novo);
      setFb({
        ok: true,
        texto: `${carta.nome}: ${carta.descricao}${ortos.length ? " Atenção ao impedimento estérico entre grupos em orto (halo vermelho)." : ""}`,
      });
    }
  };

  const jogar = (carta: Carta) => {
    if (sintetizado) return;
    const r = avaliar(anel, carta);
    if (!r.ok) return setFb({ ok: false, texto: r.motivo ?? "Esta carta não funciona aqui." });
    if (r.anel) return registrar(r.anel, carta);
    const posicoes = r.posicoes!;
    // Posições equivalentes por simetria dão o mesmo produto: se todas forem equivalentes, aplica direto.
    const produtos = new Set(posicoes.map((p) => chave(aplicarSEAr(anel, carta.grupo!, p))));
    if (produtos.size === 1) return registrar(aplicarSEAr(anel, carta.grupo!, posicoes[0]), carta, posicoes[0]);
    setPendente({ carta, posicoes, nota: r.nota });
    setFb(null);
  };

  const labels: AtomLabel[] = anel.flatMap((g, i) => (g ? [{ atom: geo.atomosPorPosicao[i][0], text: INFO_GRUPO[g].rotulo }] : []));
  const highlight: AtomHighlight[] = [
    ...(pendente ? [{ atoms: pendente.posicoes.map((p) => geo.carbonos[p]), color: "#06B6D4", scale: 1.1 }] : []),
    ...(paresOrto(anel).length
      ? [{ atoms: Array.from(new Set(paresOrto(anel).flat())).map((p) => geo.atomosPorPosicao[p][0]), color: "#F43F5E" }]
      : []),
    ...(ultimaPos !== undefined && !pendente ? [{ atoms: [geo.atomosPorPosicao[ultimaPos][0]], color: "#10B981", scale: 0.9 }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {ALVOS_AROMATICOS.map((a, i) => (
          <button
            key={a.id}
            onClick={() => reiniciar(i)}
            className={cn("chip px-3 py-1.5 text-sm", i === alvoIdx ? "bg-chem-primary text-lab-background" : "bg-slate-200/70 text-muted dark:bg-white/5")}
          >
            {feitos.includes(a.id) && <CheckCircle2 className="h-3.5 w-3.5" />}
            {a.nome}
          </button>
        ))}
        {(jaConcluido || bonus) && (
          <span className="chip ml-auto bg-chem-success/15 text-chem-success">
            <Trophy className="h-3.5 w-3.5" /> Jogo concluído{bonus ? ` · +${XP_CONCLUSAO} XP` : ""}
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
        {/* Alvo + histórico (2D) */}
        <div className="glass space-y-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Alvo da síntese</p>
          <div className="flex justify-center rounded-xl bg-white/50 dark:bg-lab-background/40">
            <Molecule2DStick smiles={smilesDe(alvo.anel)} width={260} height={160} explicitHydrogens={false} />
          </div>
          <div>
            <p className="font-semibold">{alvo.nome}</p>
            <p className="font-mono text-xs text-muted">{alvo.iupac}</p>
          </div>
          <button className="flex items-center gap-1.5 text-xs text-muted hover:text-chem-primary" onClick={() => setDica((d) => !d)}>
            <Lightbulb className="h-3.5 w-3.5" /> {dica ? alvo.dica : "Mostrar dica"}
          </button>
          <div>
            <p className="mb-1 text-xs font-semibold text-muted">Rota ({passos.length} etapa{passos.length === 1 ? "" : "s"} · mínimo {alvo.minimo})</p>
            <ol className="space-y-1 font-mono text-xs">
              <li className="text-muted">0. benzeno</li>
              {passos.map((p, i) => (
                <li key={i}>
                  {i + 1}. {p.carta.reagentes}
                </li>
              ))}
            </ol>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-ghost flex-1 !py-1.5 text-xs"
              disabled={!passos.length}
              onClick={() => {
                setPassos((p) => p.slice(0, -1));
                setPendente(null);
                setFb(null);
              }}
            >
              <Undo2 className="h-3.5 w-3.5" /> Desfazer
            </button>
            <button className="btn-ghost flex-1 !py-1.5 text-xs" onClick={() => reiniciar()}>
              <RotateCcw className="h-3.5 w-3.5" /> Recomeçar
            </button>
          </div>
        </div>

        {/* Molécula atual em 3D */}
        <div className="glass flex flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-0">
            <p className="font-semibold">Bancada: {passos.length ? "produto atual" : "benzeno"}</p>
            <div className="flex flex-wrap gap-1">
              {anel.map((g, i) =>
                g ? (
                  <span key={i} className="chip bg-slate-200/70 font-mono text-[11px] text-muted dark:bg-white/5">
                    {INFO_GRUPO[g].rotulo}: {INFO_GRUPO[g].efeito}
                  </span>
                ) : null,
              )}
            </div>
          </div>
          <div className="relative min-h-[340px] flex-1">
            <Molecule3DViewer sdf={geo.sdf} preserveView spin={false} transparent={false} zoom={0.95} labels={labels} highlight={highlight} className="absolute inset-0" />
            <AnimatePresence>
              {pendente && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-3 left-3 right-3 rounded-xl border border-chem-primary/40 bg-lab-background/90 p-3 text-lab-light backdrop-blur-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm">
                      <span className="font-semibold text-chem-primary">{pendente.carta.nome}:</span> escolha a posição (carbonos em ciano no 3D).
                      {pendente.nota && <span className="block text-xs text-lab-muted">{pendente.nota}</span>}
                    </p>
                    <button onClick={() => setPendente(null)} aria-label="Cancelar" className="text-lab-muted hover:text-chem-danger">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <SeletorAnel anel={anel} posicoes={pendente.posicoes} onEscolher={(p) => registrar(aplicarSEAr(anel, pendente.carta.grupo!, p), pendente.carta, p)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence mode="wait">
            {fb && (
              <motion.p
                key={fb.texto}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                role="status"
                className={cn(
                  "m-3 mt-0 flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
                  fb.ok ? (sintetizado ? "bg-chem-success/10 text-chem-success" : "bg-slate-200/60 text-lab-dark dark:bg-white/5 dark:text-lab-light") : "bg-chem-danger/10 text-chem-danger",
                )}
              >
                {fb.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>
                  {fb.texto}
                  {sintetizado && alvo.propriedade && <span className="mt-1 block text-xs opacity-80">{alvo.propriedade}</span>}
                </span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mão de cartas (2D) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
        {CARTAS.map((c) => (
          <motion.button
            key={c.id}
            whileHover={{ y: sintetizado ? 0 : -4 }}
            onClick={() => jogar(c)}
            disabled={sintetizado}
            className={cn(
              "glass flex min-h-[132px] flex-col items-start gap-1.5 p-3 text-left transition disabled:opacity-40",
              pendente?.carta.id === c.id && "ring-2 ring-chem-primary",
            )}
          >
            <span className={cn("chip text-[10px]", COR_TIPO[c.tipo])}>{c.tipo}</span>
            <span className="text-sm font-semibold leading-tight">{c.nome}</span>
            <span className="mt-auto font-mono text-xs text-muted">{c.reagentes}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/** Seletor 2D de posição no anel (mesma orientação do modelo 3D: posição 0 no topo, sentido horário). */
function SeletorAnel({ anel, posicoes, onEscolher }: { anel: Anel; posicoes: number[]; onEscolher: (p: number) => void }) {
  const S = 150;
  const c = S / 2;
  const R = 32;
  const pt = (i: number, r: number) => {
    const a = ((90 - 60 * i) * Math.PI) / 180;
    return [c + r * Math.cos(a), c - r * Math.sin(a)] as const;
  };
  const ref = anel.findIndex((g) => g);
  const relacao = (p: number) => {
    if (ref < 0) return "";
    const d = Math.min((p - ref + 6) % 6, (ref - p + 6) % 6);
    return d === 1 ? "orto" : d === 2 ? "meta" : d === 3 ? "para" : "";
  };
  return (
    <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} className="shrink-0" role="group" aria-label="Escolha a posição no anel">
      <polygon points={Array.from({ length: 6 }, (_, i) => pt(i, R).join(",")).join(" ")} fill="none" stroke="#94A3B8" strokeWidth={2} />
      {anel.map((g, i) => {
        if (!g) return null;
        const [x1, y1] = pt(i, R);
        const [x2, y2] = pt(i, R + 22);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94A3B8" strokeWidth={2} />
            <text x={x2} y={y2} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#F8FAFC" className="font-mono">
              {INFO_GRUPO[g].rotulo}
            </text>
          </g>
        );
      })}
      {posicoes.map((p) => {
        const [x, y] = pt(p, R);
        const [tx, ty] = pt(p, R + 24);
        const [hx, hy] = pt(p, R + 12);
        return (
          <g key={p} onClick={() => onEscolher(p)} className="cursor-pointer" role="button" aria-label={`Posição ${relacao(p) || p + 1}`}>
            <circle cx={hx} cy={hy} r={20} fill="transparent" />
            <circle cx={x} cy={y} r={9} fill="#06B6D4" opacity={0.9} />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central" fontSize={10} fill="#06B6D4">
              {relacao(p)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
