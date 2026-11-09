"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Eye, Gamepad2 } from "lucide-react";
import { LabHeader } from "@/components/LabHeader";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { Molecule3DViewer } from "@/components/Molecule3DViewer";
import { RequireVerified } from "@/components/RequireVerified";
import { COR_CLASSES, ICONE_DISCIPLINA, MODO_CLASSES } from "@/components/disciplinaStyles";
import { useAuth } from "@/context/AuthContext";
import { getDisciplina, type DisciplinaId } from "@/data/chemistryData";
import { cn } from "@/lib/utils";

export function ModulePage({ id }: { id: DisciplinaId }) {
  return (
    <RequireVerified>
      <LabHeader />
      <ModuleContent id={id} />
    </RequireVerified>
  );
}

function ModuleContent({ id }: { id: DisciplinaId }) {
  const d = getDisciplina(id);
  const cor = COR_CLASSES[d.cor];
  const Icon = ICONE_DISCIPLINA[d.id];
  const { registrarExperimento, profile } = useAuth();
  const registrado = useRef(false);
  const concluidos = new Set(profile?.progresso.modulos?.[d.id]?.concluidos ?? []);
  // Regra de Ouro: Análise Orgânica é 100% 2D.
  const usa3D = d.id !== "analise-organica" && Boolean(d.destaque.cacheKey);

  useEffect(() => {
    if (registrado.current || !profile) return;
    registrado.current = true;
    void registrarExperimento({ rota: d.rota, titulo: d.titulo });
  }, [profile, registrarExperimento, d.rota, d.titulo]);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
      <Link href="/hub" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-chem-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar ao Hub
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("glass relative mt-4 overflow-hidden bg-gradient-to-br to-transparent p-6 sm:p-8", cor.gradient)}
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
        <p className="mt-4 max-w-3xl text-muted">{d.resumo}</p>
        <p className="mt-4 flex max-w-3xl items-start gap-2 rounded-xl bg-white/50 p-3 text-sm dark:bg-lab-background/50">
          <Eye className={cn("mt-0.5 h-4 w-4 shrink-0", cor.text)} />
          <span>
            <span className="font-semibold">Regra de visualização: </span>
            {d.regraVisual}
          </span>
        </p>
      </motion.section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
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
          {d.jogos.map((j, i) => (
            <motion.article
              key={j.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="glass flex flex-col p-5"
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
              <p className="mt-4 text-xs font-medium text-muted">
                {concluidos.has(j.id) ? (
                  <span className="text-chem-success">Concluído</span>
                ) : (
                  "Próxima fase de desenvolvimento"
                )}
              </p>
            </motion.article>
          ))}
        </div>
      </section>
    </main>
  );
}
