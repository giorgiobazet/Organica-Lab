"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Gamepad2, History, Sparkles, Trophy, Zap } from "lucide-react";
import { LabHeader } from "@/components/LabHeader";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { RequireVerified } from "@/components/RequireVerified";
import { COR_CLASSES, ICONE_DISCIPLINA, MODO_CLASSES } from "@/components/disciplinaStyles";
import { useAuth } from "@/context/AuthContext";
import { DISCIPLINAS, type Disciplina } from "@/data/chemistryData";
import { nivelDoXp } from "@/lib/validation";
import { cn } from "@/lib/utils";

const TOTAL_JOGOS = DISCIPLINAS.reduce((n, d) => n + d.jogos.length, 0);

// Bento: 4 cards grandes, na ordem exata das disciplinas.
const BENTO_SPANS = ["md:col-span-4", "md:col-span-2", "md:col-span-2", "md:col-span-4"];

export default function HubPage() {
  return (
    <RequireVerified>
      <LabHeader />
      <HubContent />
    </RequireVerified>
  );
}

function HubContent() {
  const { profile } = useAuth();
  const xp = profile?.xp ?? 0;
  const { nivel } = nivelDoXp(xp);
  const primeiroNome = profile?.nome.split(" ")[0] ?? "";
  const modulos = profile?.progresso.modulos ?? {};
  const concluidos = Object.values(modulos).reduce((n, m) => n + m.concluidos.length, 0);
  const ultimo = profile?.progresso.ultimoExperimento;

  return (
    <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-grade [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass relative overflow-hidden p-6 sm:p-8"
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-chem-primary/20 blur-3xl decor" />
        <div className="absolute -bottom-24 right-40 h-64 w-64 rounded-full bg-chem-orbital/20 blur-3xl decor" />
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-chem-primary">
              <Sparkles className="h-3.5 w-3.5" /> Laboratório virtual de Química Orgânica
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Bem-vindo(a) ao <span className="titulo-marca text-chem-primary">ChemPharm Hub</span>, {primeiroNome}.
            </h1>
            <p className="mt-3 max-w-xl text-muted">
              Quatro disciplinas, jogos com moléculas reais do PubChem e uma regra simples: 3D onde a geometria muda a
              química, fórmula em bastão onde ela basta.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {ultimo ? (
                <Link href={ultimo.rota} className="btn-primary">
                  <History className="h-4 w-4" /> Continuar: {ultimo.titulo}
                </Link>
              ) : (
                <Link href="/organica-1" className="btn-primary">
                  Começar pela Orgânica 1 <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Stat icon={<Trophy className="h-4 w-4" />} label="Nível" value={String(nivel)} tone="text-chem-primary" />
            <Stat icon={<Zap className="h-4 w-4" />} label="XP total" value={xp.toLocaleString("pt-BR")} tone="text-chem-orbital" />
            <Stat icon={<Gamepad2 className="h-4 w-4" />} label="Jogos" value={`${concluidos}/${TOTAL_JOGOS}`} tone="text-chem-success" />
          </div>
        </div>
      </motion.section>

      {/* Bento grid das 4 disciplinas */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold">Disciplinas</h2>
          <p className="text-sm text-muted">Selecione um módulo para entrar no laboratório.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-6">
          {DISCIPLINAS.map((d, i) => (
            <DisciplinaCard key={d.id} d={d} span={BENTO_SPANS[i]} delay={0.05 * i} concluidos={modulos[d.id]?.concluidos.length ?? 0} />
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="glass-soft p-4">
      <p className={cn("flex items-center gap-1.5 text-xs font-medium", tone)}>
        {icon}
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-bold">{value}</p>
    </div>
  );
}

function DisciplinaCard({ d, span, delay, concluidos }: { d: Disciplina; span: string; delay: number; concluidos: number }) {
  const cor = COR_CLASSES[d.cor];
  const Icon = ICONE_DISCIPLINA[d.id];
  const wide = span === "md:col-span-4";
  const modos = Array.from(new Set(d.jogos.map((j) => j.modo)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={span}
    >
      <Link
        href={d.rota}
        className={cn(
          "glass group relative flex h-full min-h-[260px] overflow-hidden p-6 transition duration-300 hover:-translate-y-1",
          cor.border,
          wide ? "flex-col gap-4 sm:flex-row sm:items-center" : "flex-col gap-4",
        )}
      >
        <div className={cn("decor absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl transition-opacity group-hover:opacity-100 opacity-60", cor.glow)} />
        <div className="relative flex flex-1 flex-col">
          <div className="flex items-center gap-3">
            <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", cor.bg, cor.text)}>
              <Icon className="h-6 w-6" />
            </span>
            <span className="font-mono text-xs text-muted">0{d.ordem} · {d.rota}</span>
          </div>
          <h3 className="mt-4 text-xl font-bold">{d.titulo}</h3>
          <p className="mt-1 text-sm text-muted">{d.resumo}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {modos.map((m) => (
              <span key={m} className={cn("chip font-mono", MODO_CLASSES[m])}>
                {m}
              </span>
            ))}
          </div>
          <div className="mt-auto flex items-center justify-between pt-5">
            <span className="text-xs text-muted">
              {d.jogos.length} {d.jogos.length === 1 ? "jogo" : "jogos"} · {concluidos} concluído{concluidos === 1 ? "" : "s"}
            </span>
            <span className={cn("flex items-center gap-1 text-sm font-semibold", cor.text)}>
              Entrar <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
        <div className={cn("relative flex shrink-0 items-center justify-center rounded-xl bg-white/50 dark:bg-lab-background/40", wide ? "sm:w-[260px]" : "")}>
          <Molecule2DStick smiles={d.destaque.smiles} width={wide ? 240 : 220} height={140} explicitHydrogens={false} label={d.destaque.nome} />
        </div>
      </Link>
    </motion.div>
  );
}
