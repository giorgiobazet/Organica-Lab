"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, CheckCircle2, Eye, Gamepad2, LayoutGrid, Lock, Play } from "lucide-react";
import { LabHeader } from "@/components/LabHeader";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { Molecule3DViewer } from "@/components/Molecule3DViewer";
import { RequireVerified } from "@/components/RequireVerified";
import { COR_CLASSES, ICONE_DISCIPLINA, MODO_CLASSES } from "@/components/disciplinaStyles";
import { JOGOS_DISPONIVEIS } from "@/components/games/registry";
import { useAuth } from "@/context/AuthContext";
import { getDisciplina, type Disciplina, type DisciplinaId } from "@/data/chemistryData";
import { cn } from "@/lib/utils";

export function ModulePage({ id }: { id: DisciplinaId }) {
  return (
    <RequireVerified>
      <LabHeader />
      <ModuleContent id={id} />
    </RequireVerified>
  );
}

const VISAO_GERAL = "visao-geral";

function ModuleContent({ id }: { id: DisciplinaId }) {
  const d = getDisciplina(id);
  const cor = COR_CLASSES[d.cor];
  const Icon = ICONE_DISCIPLINA[d.id];
  const { registrarExperimento, profile } = useAuth();
  const concluidos = new Set(profile?.progresso.modulos?.[d.id]?.concluidos ?? []);
  const [aba, setAba] = useState<string>(VISAO_GERAL);
  const registrado = useRef<string | null>(null);

  // A aba ativa vive no hash da URL (#simulador-conformacional), para link direto e "Continuar".
  useEffect(() => {
    const ler = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      setAba(h && JOGOS_DISPONIVEIS[h] && d.jogos.some((j) => j.id === h) ? h : VISAO_GERAL);
    };
    ler();
    window.addEventListener("hashchange", ler);
    return () => window.removeEventListener("hashchange", ler);
  }, [d.jogos]);

  const abrir = useCallback((novo: string) => {
    setAba(novo);
    const url = novo === VISAO_GERAL ? window.location.pathname : `${window.location.pathname}#${novo}`;
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Registra o último experimento (uma vez por aba aberta).
  useEffect(() => {
    if (!profile || registrado.current === aba) return;
    registrado.current = aba;
    const jogo = d.jogos.find((j) => j.id === aba);
    void registrarExperimento(
      jogo ? { rota: `${d.rota}#${jogo.id}`, titulo: jogo.titulo } : { rota: d.rota, titulo: d.titulo },
    );
  }, [aba, profile, registrarExperimento, d]);

  const jogoAtivo = d.jogos.find((j) => j.id === aba);
  const JogoComponente = jogoAtivo ? JOGOS_DISPONIVEIS[jogoAtivo.id] : null;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
      <Link href="/hub" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-chem-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar ao Hub
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("glass relative mt-4 overflow-hidden bg-gradient-to-br to-transparent p-6", cor.gradient)}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl", cor.bg, cor.text)}>
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <p className="font-mono text-xs text-muted">Módulo 0{d.ordem} · {d.rota}</p>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{d.titulo}</h1>
          </div>
        </div>
        <p className="mt-3 flex max-w-3xl items-start gap-2 text-sm text-muted">
          <Eye className={cn("mt-0.5 h-4 w-4 shrink-0", cor.text)} />
          <span>{d.regraVisual}</span>
        </p>
      </motion.section>

      {/* Abas: visão geral + jogos */}
      <nav className="mt-5 flex gap-1.5 overflow-x-auto pb-1" aria-label="Jogos da disciplina">
        <TabButton ativo={aba === VISAO_GERAL} onClick={() => abrir(VISAO_GERAL)}>
          <LayoutGrid className="h-4 w-4" /> Visão geral
        </TabButton>
        {d.jogos.map((j, i) => {
          const disponivel = Boolean(JOGOS_DISPONIVEIS[j.id]);
          return (
            <TabButton key={j.id} ativo={aba === j.id} onClick={() => disponivel && abrir(j.id)} disabled={!disponivel} title={disponivel ? j.titulo : "Em desenvolvimento"}>
              {concluidos.has(j.id) ? (
                <CheckCircle2 className="h-4 w-4 text-chem-success" />
              ) : disponivel ? (
                <span className="font-mono text-xs">{i + 1}</span>
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              <span className="max-w-[220px] truncate">{j.titulo}</span>
            </TabButton>
          );
        })}
      </nav>

      <div className="mt-4">
        {JogoComponente && jogoAtivo ? (
          <section>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">{jogoAtivo.titulo}</h2>
              <span className={cn("chip font-mono", MODO_CLASSES[jogoAtivo.modo])}>{jogoAtivo.modo}</span>
            </div>
            <p className="mb-4 max-w-4xl text-sm text-muted">{jogoAtivo.descricao}</p>
            <JogoComponente />
          </section>
        ) : (
          <VisaoGeral d={d} concluidos={concluidos} onJogar={abrir} />
        )}
      </div>
    </main>
  );
}

function TabButton({
  ativo,
  disabled,
  onClick,
  title,
  children,
}: {
  ativo: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition",
        ativo
          ? "border-chem-primary bg-chem-primary/15 text-chem-primary"
          : "border-slate-300/70 text-muted hover:border-chem-primary/50 hover:text-chem-primary dark:border-white/10",
        disabled && "cursor-not-allowed opacity-50 hover:border-slate-300/70 hover:text-muted dark:hover:border-white/10",
      )}
    >
      {children}
    </button>
  );
}

function VisaoGeral({ d, concluidos, onJogar }: { d: Disciplina; concluidos: Set<string>; onJogar: (id: string) => void }) {
  const cor = COR_CLASSES[d.cor];
  // Regra de Ouro: Análise Orgânica é 100% 2D.
  const usa3D = d.id !== "analise-organica" && Boolean(d.destaque.cacheKey);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="glass p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <BookOpen className={cn("h-5 w-5", cor.text)} /> Ementa coberta
          </h2>
          <ul className="mt-4 space-y-2">
            {d.ementa.map((item) => (
              <li key={item} className="flex gap-2 text-sm">
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", cor.dot)} />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="glass flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-0">
            <h2 className="text-lg font-bold">{d.destaque.nome}</h2>
            <span className={cn("chip font-mono", usa3D ? MODO_CLASSES["3D"] : MODO_CLASSES["2D"])}>{usa3D ? "3D" : "2D"}</span>
          </div>
          <div className="relative flex min-h-[300px] flex-1 items-center justify-center">
            {usa3D ? (
              <Molecule3DViewer cid={d.destaque.cid} cacheKey={d.destaque.cacheKey} className="absolute inset-0" spin={false} />
            ) : (
              <Molecule2DStick smiles={d.destaque.smiles} width={380} height={260} explicitHydrogens={false} />
            )}
          </div>
          <p className="border-t border-slate-200/70 p-4 text-sm text-muted dark:border-white/5">{d.destaque.legenda}</p>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Gamepad2 className={cn("h-5 w-5", cor.text)} /> Jogos interativos
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {d.jogos.map((j, i) => {
            const disponivel = Boolean(JOGOS_DISPONIVEIS[j.id]);
            return (
              <motion.article
                key={j.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className={cn("glass flex flex-col p-5", disponivel && "ring-1 ring-chem-primary/30")}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">
                    <span className="mr-2 font-mono text-muted">{i + 1}.</span>
                    {j.titulo}
                  </h3>
                  <span className={cn("chip shrink-0 font-mono", MODO_CLASSES[j.modo])}>{j.modo}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{j.descricao}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {j.topicos.map((t) => (
                    <span key={t} className="chip bg-slate-200/70 font-mono font-normal text-lab-dark dark:bg-white/5 dark:text-lab-muted">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  {concluidos.has(j.id) ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-chem-success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
                    </span>
                  ) : (
                    <span className="text-xs text-muted">{disponivel ? "Disponível" : "Em desenvolvimento"}</span>
                  )}
                  {disponivel && (
                    <button className="btn-primary !py-1.5" onClick={() => onJogar(j.id)}>
                      <Play className="h-4 w-4" /> Jogar
                    </button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>
    </>
  );
}
