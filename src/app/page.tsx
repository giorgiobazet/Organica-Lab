"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { Box, FlaskConical, Loader2, Moon, Sun } from "lucide-react";
import { Molecule3DViewer } from "@/components/Molecule3DViewer";
import { AuthCard } from "@/components/auth/AuthCard";
import { VerifyEmailGate } from "@/components/auth/VerifyEmailGate";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { BotaoModoLeve } from "@/components/BotaoModoLeve";
import { useLeve } from "@/context/LeveContext";
import { MOLECULES_3D } from "@/data/molecules3d";
import { cn } from "@/lib/utils";
import { SITE } from "@/config/site";
import { Rodape } from "@/components/Rodape";

const DESTAQUES = [
  {
    key: "aspirina",
    cid: 2244,
    classe: "Anti-inflamatório não esteroidal (AINE)",
    nota: "Acetila irreversivelmente a Ser530 da COX-1.",
  },
  {
    key: "ibuprofeno",
    cid: 3672,
    classe: "AINE derivado do ácido propiônico",
    nota: "Vendido como racemato; o enantiômero (S) é o ativo.",
  },
] as const;

export default function Home() {
  const { status, mode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  // O 3D entra depois da primeira pintura (ou no toque, no Modo Leve); até lá, um pôster estático
  // da mesma molécula ocupa o lugar. "pronto3D" guarda a molécula já desenhada pelo visualizador.
  const { leve } = useLeve();
  const [ativar3D, setAtivar3D] = useState(false);
  const [pronto3D, setPronto3D] = useState<string | null>(null);
  const atual = DESTAQUES[idx];
  const mol = MOLECULES_3D[atual.key];

  useEffect(() => {
    if (status === "verified") router.replace("/hub");
  }, [status, router]);

  useEffect(() => {
    if (document.documentElement.classList.contains("leve")) return;
    const ocioso = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 400));
    const cancelar = window.cancelIdleCallback ?? window.clearTimeout;
    const id = ocioso(() => setAtivar3D(true), { timeout: 2500 });
    return () => cancelar(id);
  }, []);

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      {/* Lado esquerdo: molécula 3D real com iluminação ciano/violeta */}
      <section className="relative flex flex-col overflow-hidden bg-ui-hero lg:min-h-screen">
        <div className="bg-grade absolute inset-0" />
        <div className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-chem-primary/25 blur-3xl decor" />
        <div className="absolute -right-16 bottom-10 h-96 w-96 rounded-full bg-chem-orbital/25 blur-3xl decor" />

        <header className="relative z-10 flex items-center justify-between p-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chem-primary/20 text-chem-primary">
              <FlaskConical className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              {SITE.marca.base}<span className="titulo-marca text-chem-primary">{SITE.marca.destaque}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BotaoModoLeve />
            <button
              onClick={toggleTheme}
              className="btn-ghost !p-2 text-muted"
              aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <div className="relative z-10 min-h-[300px] flex-1">
          {/* Pôster: imagem gerada do próprio visualizador, na orientação inicial da molécula. */}
          <div
            className={cn(
              "poster-3d pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500",
              pronto3D === atual.key ? "opacity-0" : "opacity-100",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/moleculas/${atual.key}.webp`} alt={`${mol.nome} em 3D`} className="aspect-square h-full max-h-full max-w-full object-contain" />
          </div>
          {ativar3D ? (
            <div className={cn("absolute inset-0 transition-opacity duration-500", pronto3D === atual.key ? "opacity-100" : "opacity-0")}>
              <Molecule3DViewer cid={atual.cid} cacheKey={atual.key} className="absolute inset-0" onCarregado={() => setPronto3D(atual.key)} />
            </div>
          ) : (
            leve && (
              <button onClick={() => setAtivar3D(true)} className="btn-ghost absolute bottom-3 left-1/2 -translate-x-1/2 bg-ui-surface/80 text-sm">
                <Box className="h-4 w-4" /> Ver em 3D
              </button>
            )
          )}
        </div>

        <div className="relative z-10 p-6">
          <div className="glass max-w-md p-4">
            <p className="text-xs uppercase tracking-widest text-chem-primary">Princípio ativo em destaque</p>
            <h2 className="mt-1 text-lg font-semibold">{mol.nome}</h2>
            <p className="font-mono text-sm text-muted">
              {mol.formula} · {mol.massaMolar.toFixed(2)} g/mol
            </p>
            <p className="mt-2 hidden text-sm text-muted sm:block">
              {atual.classe}. {atual.nota}
            </p>
            <div className="mt-3 flex gap-2">
              {DESTAQUES.map((d, i) => (
                <button
                  key={d.key}
                  onClick={() => setIdx(i)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition",
                    i === idx ? "bg-chem-primary text-lab-background" : "bg-ui-border/10 text-muted hover:text-chem-primary",
                  )}
                >
                  {MOLECULES_3D[d.key].nome.replace(/ \(.*\)$/, "")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Lado direito: Login / Cadastro em Glassmorphism */}
      <section className="relative flex items-center justify-center overflow-hidden p-6 sm:p-10">
        <div className="bg-grade absolute inset-0 opacity-70" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-chem-orbital/15 blur-3xl decor" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-chem-primary/15 blur-3xl decor" />

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 flex w-full flex-col items-center gap-6"
        >
          <div className="max-w-md text-center">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              O laboratório de <span className="titulo-marca text-chem-primary">Química Orgânica</span> que cabe na sua tela.
            </h1>
            <p className="mt-3 text-sm text-muted">
              Moléculas 3D reais onde a geometria importa, fórmulas em bastão onde elas bastam.
            </p>
          </div>

          {status === "loading" || status === "verified" ? (
            <div className="glass-strong flex w-full max-w-md items-center justify-center gap-3 p-10 text-muted">
              <Loader2 className="h-5 w-5 animate-spin text-chem-primary" />
              {status === "verified" ? "Abrindo o laboratório…" : "Carregando…"}
            </div>
          ) : status === "unverified" ? (
            <VerifyEmailGate />
          ) : (
            <AuthCard />
          )}

          {mode === "dev" && status === "signedOut" && (
            <p className="max-w-md text-center text-xs text-muted">
              <span className="font-semibold text-chem-orbital">Modo Dev:</span> Firebase não configurado. Os cadastros
              ficam salvos só neste navegador.
            </p>
          )}
          <Rodape className="pb-0 pt-2" />
        </m.div>
      </section>
    </main>
  );
}
