"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ArrowRight, CheckCircle2, FlaskConical, Scissors, Shield, Trophy, XCircle } from "lucide-react";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { Molecule3DViewer } from "@/components/Molecule3DViewer";
import { useAuth } from "@/context/AuthContext";
import { ALVOS_BISTURI, PROTECOES, type AlvoBisturi, type Fragmento, type Protecao } from "@/data/bisturi";
import { toMolBlock } from "@/lib/molblock";
import { cn } from "@/lib/utils";

const DISCIPLINA = "organica-3";
const JOGO = "bisturi-quimico";
const XP_FASE = 10;
const XP_CONCLUSAO = 100;
const EXPERIMENTO = { rota: "/organica-3#bisturi-quimico", titulo: "Bisturi Químico" };
const CIANO = "#06B6D4";

type Fase = "corte" | "protecao" | "synthons" | "feito";
type Feedback = { ok: boolean; texto: string } | null;

const FASES: { id: Fase; label: string }[] = [
  { id: "corte", label: "1 · Corte (2D)" },
  { id: "protecao", label: "2 · Proteção" },
  { id: "synthons", label: "3 · Synthons (3D)" },
];
const ORDEM: Fase[] = ["corte", "protecao", "synthons", "feito"];

export default function BisturiQuimico() {
  const { concluirJogo, profile } = useAuth();
  const [idx, setIdx] = useState(0);
  const [feitos, setFeitos] = useState<string[]>([]);
  const [bonus, setBonus] = useState(false);
  const jaConcluido = profile?.progresso.modulos?.[DISCIPLINA]?.concluidos.includes(JOGO) ?? false;
  const alvo = ALVOS_BISTURI[idx];

  useEffect(() => {
    if (feitos.length === ALVOS_BISTURI.length && !jaConcluido) {
      void concluirJogo(DISCIPLINA, JOGO, XP_CONCLUSAO).then((p) => p && setBonus(true));
    }
  }, [feitos, jaConcluido, concluirJogo]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {ALVOS_BISTURI.map((a, i) => (
          <button
            key={a.id}
            onClick={() => setIdx(i)}
            className={cn("chip px-3 py-1.5 text-sm", i === idx ? "bg-chem-primary text-lab-background" : "bg-slate-200/70 text-muted dark:bg-white/5")}
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
      <PainelAlvo
        key={alvo.id}
        alvo={alvo}
        jaFeito={feitos.includes(alvo.id)}
        onFeito={() => setFeitos((f) => (f.includes(alvo.id) ? f : [...f, alvo.id]))}
        onProximo={idx < ALVOS_BISTURI.length - 1 ? () => setIdx(idx + 1) : undefined}
      />
    </div>
  );
}

function PainelAlvo({ alvo, jaFeito, onFeito, onProximo }: { alvo: AlvoBisturi; jaFeito: boolean; onFeito: () => void; onProximo?: () => void }) {
  const { addXp } = useAuth();
  const [fase, setFase] = useState<Fase>(jaFeito ? "feito" : "corte");
  const [sel, setSel] = useState<number | null>(jaFeito ? alvo.cortes.findIndex((c) => c.correta) : null);
  const [fb, setFb] = useState<Feedback>(null);
  const corteCerto = alvo.cortes.findIndex((c) => c.correta);
  const smiles2d = sel !== null ? alvo.cortes[sel].smilesMapeado : alvo.smiles;
  const destaque: [number, string][] = sel !== null ? [[1, CIANO], [2, CIANO]] : [];

  const avancar = (proxima: Fase, texto: string) => {
    void addXp(XP_FASE, EXPERIMENTO);
    setFase(proxima);
    setFb({ ok: true, texto: `${texto} +${XP_FASE} XP` });
    if (proxima === "feito") onFeito();
  };

  const cortar = () => {
    if (sel === null) return setFb({ ok: false, texto: "Escolha uma ligação para o bisturi." });
    const c = alvo.cortes[sel];
    if (!c.correta) return setFb({ ok: false, texto: c.explicacao });
    avancar("protecao", c.explicacao);
  };

  const proteger = (p: Protecao) => {
    if (p !== alvo.protecao) {
      return setFb({
        ok: false,
        texto:
          p === "nenhuma"
            ? "Há um grupo que reagiria no lugar errado. Procure uma função que o reagente da etapa-chave também atacaria."
            : "Essa proteção não resolve o conflito desta síntese (ou não há conflito). Pense em qual grupo competiria com a reação-chave.",
      });
    }
    avancar("synthons", alvo.protecaoExplicacao);
  };

  const escolherReagentes = (k: number) => {
    if (k !== alvo.reagenteCorreto) return setFb({ ok: false, texto: "Esses reagentes não reproduzem os synthons acima. Compare o nucleófilo e o eletrófilo com cada opção." });
    avancar("feito", alvo.reacao);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {FASES.map((f) => {
          const feito = ORDEM.indexOf(fase) > ORDEM.indexOf(f.id);
          return (
            <span
              key={f.id}
              className={cn(
                "chip flex-1 justify-center py-1.5 text-xs",
                fase === f.id ? "bg-chem-primary/20 text-chem-primary" : feito ? "bg-chem-success/15 text-chem-success" : "bg-slate-200/70 text-muted dark:bg-white/5",
              )}
            >
              {feito && <CheckCircle2 className="h-3 w-3" />}
              {f.label}
            </span>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        {/* Fase 1 sempre visível: a molécula-alvo em bastão 2D */}
        <div className="glass flex flex-col p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Molécula-alvo</p>
          <p className="font-semibold">{alvo.nome}</p>
          <p className="text-xs text-muted">{alvo.uso}</p>
          <div className="my-2 flex flex-1 items-center justify-center rounded-xl bg-white/50 dark:bg-ui-bg/40">
            <Molecule2DStick smiles={smiles2d} width={360} height={200} explicitHydrogens={false} highlightAtoms={destaque} />
          </div>
          {fase === "corte" ? (
            <>
              <p className="mb-2 text-sm font-semibold">Onde passar o bisturi? (a ligação aparece em ciano)</p>
              <div className="grid gap-1.5">
                {alvo.cortes.map((c, k) => (
                  <button
                    key={k}
                    onClick={() => {
                      setSel(k);
                      setFb(null);
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left font-mono text-sm transition",
                      sel === k ? "border-chem-primary bg-chem-primary/10 text-chem-primary" : "border-slate-300/70 hover:border-chem-primary/50 dark:border-white/10",
                    )}
                  >
                    {c.rotulo}
                  </button>
                ))}
              </div>
              <button className="btn-primary mt-3 w-full" onClick={cortar}>
                <Scissors className="h-4 w-4" /> Cortar
              </button>
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-chem-success">
              <Scissors className="h-4 w-4" /> Corte: <span className="font-mono">{alvo.cortes[corteCerto].rotulo}</span>
            </p>
          )}
        </div>

        <div className="glass space-y-3 p-4">
          {fase === "corte" && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted">
              <Scissors className="h-8 w-8 text-chem-primary/60" />
              Na retroanálise trabalhamos de trás para a frente: escolha a ligação estratégica cuja formação seja uma reação conhecida.
            </div>
          )}
          {fase === "protecao" && (
            <>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Shield className="h-4 w-4 text-chem-orbital" /> Algum grupo precisa de escudo químico antes da etapa-chave?
              </p>
              <div className="grid gap-2">
                {(Object.keys(PROTECOES) as Protecao[]).map((p) => (
                  <button key={p} className="btn-ghost justify-start text-left text-sm" onClick={() => proteger(p)}>
                    {PROTECOES[p]}
                  </button>
                ))}
              </div>
            </>
          )}
          {fase === "synthons" && (
            <>
              <p className="text-sm font-semibold">Escolha os reagentes reais da síntese direta</p>
              <div className="grid gap-2">
                {alvo.reagentes.map((r, k) => (
                  <button key={k} className="btn-ghost justify-start text-left text-sm" onClick={() => escolherReagentes(k)}>
                    <FlaskConical className="h-4 w-4 shrink-0" /> {r}
                  </button>
                ))}
              </div>
            </>
          )}
          {fase === "feito" && (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-chem-success">
                <CheckCircle2 className="h-4 w-4" /> Rota de {alvo.nome} planejada
              </p>
              <p className="text-sm">{alvo.reagentes[alvo.reagenteCorreto]}</p>
              <p className="text-xs text-muted">{alvo.reacao}</p>
              {onProximo && (
                <button className="btn-primary w-full" onClick={onProximo}>
                  Próxima molécula <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          <AnimatePresence mode="wait">
            {fb && (
              <m.p
                key={fb.texto}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="status"
                className={cn("flex items-start gap-2 rounded-lg px-3 py-2 text-sm", fb.ok ? "bg-chem-success/10 text-chem-success" : "bg-chem-danger/10 text-chem-danger")}
              >
                {fb.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                {fb.texto}
              </m.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Fase 3: gatilho 3D obrigatório pós-desconexão */}
      {(fase === "synthons" || fase === "feito") && (
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 md:grid-cols-2">
          <PainelFragmento f={alvo.nucleofilo} polo="δ−" cor="text-chem-orbital" />
          <PainelFragmento f={alvo.eletrofilo} polo="δ+" cor="text-chem-primary" />
        </m.div>
      )}
    </div>
  );
}

function PainelFragmento({ f, polo, cor }: { f: Fragmento; polo: string; cor: string }) {
  const sdf = useMemo(() => toMolBlock(f.geo.elementos, f.geo.ligacoes, f.geo.coords, f.nome, f.geo.cargas), [f]);
  return (
    <div className="glass flex flex-col overflow-hidden">
      <div className="p-4 pb-0">
        <p className="text-xs text-muted">Synthon</p>
        <p className={cn("font-mono text-lg font-semibold", cor)}>
          {f.sinton} <span className="text-sm">({polo})</span>
        </p>
        <p className="text-sm">
          Equivalente sintético: <span className="font-semibold">{f.nome}</span>
        </p>
        <p className="text-xs text-muted">{f.papel}</p>
      </div>
      <div className="relative h-[260px]">
        <Molecule3DViewer sdf={sdf} spin transparent={false} zoom={0.95} className="absolute inset-0" />
      </div>
      {f.geo.campoDeForca !== "MMFF94" && <p className="px-4 pb-2 font-mono text-[10px] text-muted">geometria {f.geo.campoDeForca}</p>}
    </div>
  );
}
