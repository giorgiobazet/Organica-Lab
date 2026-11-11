"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ArrowRight, CheckCircle2, MoveRight, Trophy, XCircle } from "lucide-react";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { Molecule3DViewer } from "@/components/Molecule3DViewer";
import { useAuth } from "@/context/AuthContext";
import { QUESTOES_ALCENOS, type QuestaoAlceno } from "@/data/alcenos";
import { toMolBlock } from "@/lib/molblock";
import { cn } from "@/lib/utils";

const DISCIPLINA = "organica-2";
const JOGO = "lab-alcenos";
const XP_ACERTO = 10;
const XP_CONCLUSAO = 100;
const EXPERIMENTO = { rota: "/organica-2#lab-alcenos", titulo: "Laboratório de Alcenos, Alcinos, Álcoois, Éteres e Epóxidos" };

const SECOES: { tipo: QuestaoAlceno["tipo"]; titulo: string; cor: string }[] = [
  { tipo: "regio", titulo: "Regiosseletividade", cor: "text-chem-primary" },
  { tipo: "estereo", titulo: "Estereosseletividade (3D)", cor: "text-chem-orbital" },
  { tipo: "epoxido", titulo: "Abertura de epóxidos", cor: "text-chem-success" },
];

export default function LaboratorioAlcenos() {
  const { addXp, concluirJogo, profile } = useAuth();
  const [idx, setIdx] = useState(0);
  const [feitos, setFeitos] = useState<string[]>([]);
  const [erradas, setErradas] = useState<number[]>([]);
  const [bonus, setBonus] = useState(false);
  const jaConcluido = profile?.progresso.modulos?.[DISCIPLINA]?.concluidos.includes(JOGO) ?? false;
  const q = QUESTOES_ALCENOS[idx];
  const resolvida = feitos.includes(q.id);

  useEffect(() => {
    if (feitos.length === QUESTOES_ALCENOS.length && !jaConcluido) {
      void concluirJogo(DISCIPLINA, JOGO, XP_CONCLUSAO).then((p) => p && setBonus(true));
    }
  }, [feitos, jaConcluido, concluirJogo]);

  const ir = (i: number) => {
    setIdx(i);
    setErradas([]);
  };

  const responder = (k: number) => {
    if (resolvida) return;
    if (k !== q.correta) {
      setErradas((e) => (e.includes(k) ? e : [...e, k]));
      return;
    }
    setFeitos((f) => [...f, q.id]);
    void addXp(XP_ACERTO, EXPERIMENTO);
  };

  const sdf3d = useMemo(
    () => (q.produto3d ? toMolBlock(q.produto3d.elementos, q.produto3d.ligacoes, q.produto3d.coords, q.opcoes[q.correta].nome) : null),
    [q],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-4">
        {SECOES.map((s) => (
          <div key={s.tipo}>
            <p className={cn("mb-1 text-xs font-semibold", s.cor)}>{s.titulo}</p>
            <div className="flex gap-1">
              {QUESTOES_ALCENOS.map((x, i) =>
                x.tipo === s.tipo ? (
                  <button
                    key={x.id}
                    onClick={() => ir(i)}
                    aria-label={`Questão ${i + 1}`}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs",
                      i === idx ? "bg-chem-primary text-lab-background" : feitos.includes(x.id) ? "bg-chem-success/15 text-chem-success" : "bg-slate-200/70 text-muted dark:bg-white/5",
                    )}
                  >
                    {feitos.includes(x.id) && i !== idx ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </button>
                ) : null,
              )}
            </div>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2 self-end">
          <span className="font-mono text-xs text-muted">
            {feitos.length}/{QUESTOES_ALCENOS.length}
          </span>
          {(jaConcluido || bonus) && (
            <span className="chip bg-chem-success/15 text-chem-success">
              <Trophy className="h-3.5 w-3.5" /> Jogo concluído{bonus ? ` · +${XP_CONCLUSAO} XP` : ""}
            </span>
          )}
        </div>
      </div>

      <div className="glass flex flex-wrap items-center justify-center gap-4 p-4">
        <Molecule2DStick smiles={q.substrato} width={220} height={120} explicitHydrogens={false} label={q.substratoNome} />
        <div className="flex flex-col items-center text-center">
          <span className="max-w-[220px] font-mono text-sm text-chem-primary">{q.reagentes}</span>
          <MoveRight className="h-8 w-16 text-muted" />
        </div>
        <span className="text-3xl text-muted">?</span>
      </div>

      <div className={cn("grid gap-3", q.opcoes.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
        {q.opcoes.map((o, k) => {
          const certa = resolvida && k === q.correta;
          const errada = erradas.includes(k);
          return (
            <button
              key={o.smiles}
              onClick={() => responder(k)}
              disabled={resolvida && !certa}
              className={cn(
                "glass flex flex-col items-center p-3 transition",
                certa && "ring-2 ring-chem-success",
                errada && "ring-2 ring-chem-danger opacity-60",
                !resolvida && !errada && "hover:-translate-y-0.5 hover:ring-1 hover:ring-chem-primary/50",
                resolvida && !certa && "opacity-40",
              )}
            >
              <Molecule2DStick smiles={o.smiles} width={240} height={130} explicitHydrogens={false} />
              <span className="mt-1 font-mono text-xs">{resolvida ? o.nome : `Produto ${String.fromCharCode(65 + k)}`}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {(resolvida || erradas.length > 0) && (
          <m.div key={`${q.id}-${resolvida}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {resolvida ? (
              <div className={cn("grid gap-4", sdf3d && "lg:grid-cols-[1fr_1.1fr]")}>
                <div className="glass space-y-3 p-4">
                  <p role="status" className="flex items-start gap-2 text-sm text-chem-success">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <span className="font-semibold">{q.opcoes[q.correta].nome}.</span> {q.explicacao}
                    </span>
                  </p>
                  {idx < QUESTOES_ALCENOS.length - 1 && (
                    <button className="btn-primary w-full" onClick={() => ir(idx + 1)}>
                      Próxima reação <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {sdf3d && (
                  <div className="glass flex min-h-[280px] flex-col overflow-hidden">
                    <p className="p-3 pb-0 text-sm font-semibold">Produto em 3D: veja de que lado os grupos entraram</p>
                    <div className="relative flex-1">
                      <Molecule3DViewer sdf={sdf3d} spin transparent={false} zoom={0.9} className="absolute inset-0" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p role="status" className="flex items-start gap-2 rounded-lg bg-chem-danger/10 px-3 py-2 text-sm text-chem-danger">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {q.tipo === "regio"
                  ? "Ainda não. Pergunte-se: o mecanismo passa por carbocátion (Markovnikov) ou não (radical, borano)?"
                  : q.tipo === "estereo"
                    ? "Ainda não. Os dois grupos entram pela mesma face (syn) ou por faces opostas (anti)?"
                    : "Ainda não. Em meio básico manda o impedimento estérico; em meio ácido, a estabilidade da carga positiva."}
              </p>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
