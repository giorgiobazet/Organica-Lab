"use client";

import { SITE } from "@/config/site";
import Link from "next/link";
import { motion } from "framer-motion";
import { FlaskConical, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { nivelDoXp } from "@/lib/validation";

export function LabHeader() {
  const { profile, user, mode, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const xp = profile?.xp ?? 0;
  const { nivel, xpNoNivel, xpParaProximo, progresso } = nivelDoXp(xp);
  const nome = profile?.nome ?? user?.nome ?? "";

  return (
    <header className="sticky top-0 z-40 border-b border-ui-border/20 bg-ui-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/hub" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-chem-primary/15 text-chem-primary">
            <FlaskConical className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            {SITE.marca.base}<span className="titulo-marca text-chem-primary">{SITE.marca.destaque}</span>
          </span>
          {mode === "dev" && (
            <span className="chip bg-chem-orbital/15 text-chem-orbital" title="Firebase não configurado: dados salvos neste navegador">
              Modo Dev
            </span>
          )}
        </Link>

        <div className="order-3 flex min-w-[220px] flex-1 items-center gap-3 sm:order-none">
          <span className="chip shrink-0 bg-chem-primary/15 font-mono text-chem-primary">Nv. {nivel}</span>
          <div className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={xpParaProximo} aria-valuenow={xpNoNivel} aria-label="XP no nível atual">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-chem-primary to-chem-orbital"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(progresso * 100, 2)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
          <span className="shrink-0 font-mono text-xs text-muted">
            {xpNoNivel}/{xpParaProximo} XP
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="max-w-[180px] truncate text-sm font-semibold">{nome}</p>
            <p className="font-mono text-xs text-muted">
              {profile?.perfil === "servidor" && <span className="chip mr-1.5 bg-chem-orbital/15 font-sans text-chem-orbital">Professor(a) / Técnico(a)</span>}
              Matrícula {profile?.matricula ?? "—"}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="btn-ghost !p-2 text-muted"
            aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => signOut()}
            className="btn-ghost !p-2 text-muted hover:!border-chem-danger hover:!text-chem-danger"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
