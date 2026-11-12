"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import { GALERIA } from "@/data/galeria";
import { NOMES_PT_EN, normalizarNome, traduzirNome } from "@/data/nomesQuimicos";
import { fetchAutocomplete } from "@/services/pubchem";
import { cn } from "@/lib/utils";
import type { RefMolecula } from "./molecula";

/** O que a busca entrega: uma molécula conhecida ou um texto livre (nome em pt/en) a resolver. */
export type EscolhaBusca = { ref: RefMolecula } | { nome: string; alternativas?: string[] };

interface Sugestao {
  rotulo: string;
  detalhe?: string;
  grupo: "Destaques" | "Nomes em português" | "PubChem";
  escolha: EscolhaBusca;
}

/** Só símbolos de elementos, dígitos de anel e sinais de SMILES: tratamos como estrutura. */
export function pareceSmiles(texto: string): boolean {
  const t = texto.trim();
  if (!t || /\s/.test(t)) return false;
  if (/[=#()[\]@/\\]/.test(t)) return true;
  return /^(?:Cl|Br|[BCNOSPFI]|[cnos]|\d)+$/.test(t) && /[A-Z]/.test(t);
}

export function BuscaMolecula({ onEscolher, ocupado }: { onEscolher: (e: EscolhaBusca) => void; ocupado: boolean }) {
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const [remotas, setRemotas] = useState<string[]>([]);
  const [buscandoRemoto, setBuscandoRemoto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const caixa = useRef<HTMLDivElement>(null);

  const consulta = normalizarNome(texto);

  const locais = useMemo<Sugestao[]>(() => {
    if (consulta.length < 2) return [];
    const galeria = GALERIA.filter(
      (g) => normalizarNome(g.nome).includes(consulta) || g.nomeEn.toLowerCase().includes(consulta) || g.chave.includes(consulta.replace(/ /g, "-")),
    )
      .slice(0, 5)
      .map<Sugestao>((g) => ({ rotulo: g.nome, detalhe: g.formula, grupo: "Destaques", escolha: { ref: { tipo: "galeria", chave: g.chave } } }));
    const nomes = Object.keys(NOMES_PT_EN)
      .filter((k) => k.startsWith(consulta) && !galeria.some((g) => normalizarNome(g.rotulo).startsWith(k)))
      .slice(0, 4)
      .map<Sugestao>((k) => ({ rotulo: k, detalhe: NOMES_PT_EN[k], grupo: "Nomes em português", escolha: { nome: k } }));
    return [...galeria, ...nomes];
  }, [consulta]);

  // Sugestões do PubChem (em inglês), a partir da tradução do que foi digitado.
  useEffect(() => {
    if (consulta.length < 3 || /^\d+$/.test(consulta) || pareceSmiles(texto)) {
      setRemotas([]);
      return;
    }
    let cancelado = false;
    const t = window.setTimeout(() => {
      setBuscandoRemoto(true);
      fetchAutocomplete(traduzirNome(texto)[0] ?? texto, 6)
        .then((r) => !cancelado && setRemotas(r))
        .catch(() => !cancelado && setRemotas([]))
        .finally(() => !cancelado && setBuscandoRemoto(false));
    }, 300);
    return () => {
      cancelado = true;
      window.clearTimeout(t);
    };
  }, [consulta, texto]);

  const sugestoes: Sugestao[] = [
    ...locais,
    ...remotas
      .filter((r) => !locais.some((l) => l.rotulo.toLowerCase() === r.toLowerCase()))
      .map<Sugestao>((r) => ({ rotulo: r, grupo: "PubChem", escolha: { nome: r } })),
  ];

  useEffect(() => {
    const fora = (e: PointerEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, []);

  const escolher = (e: EscolhaBusca) => {
    setAberto(false);
    setAtivo(-1);
    onEscolher(e);
  };

  const enviar = () => {
    const t = texto.trim();
    if (!t) return;
    if (ativo >= 0 && sugestoes[ativo]) return escolher(sugestoes[ativo].escolha);
    if (/^\d+$/.test(t)) return escolher({ ref: { tipo: "cid", cid: Number(t) } });
    if (pareceSmiles(t)) return escolher({ ref: { tipo: "smiles", smiles: t } });
    // Se o nome digitado não existir no PubChem, tenta as sugestões que ele mesmo ofereceu.
    escolher({ nome: t, alternativas: remotas.slice(0, 3) });
  };

  let grupoAnterior = "";
  return (
    <div ref={caixa} className="relative w-full max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
        className="flex items-center gap-2 rounded-xl border border-ui-border/40 bg-ui-bg/70 px-3 py-2 focus-within:border-chem-primary focus-within:ring-2 focus-within:ring-chem-primary/30"
        role="search"
      >
        {ocupado ? <Loader2 className="h-4 w-4 animate-spin text-chem-primary" /> : <Search className="h-4 w-4 text-muted" />}
        <input
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAberto(true);
            setAtivo(-1);
          }}
          onFocus={() => setAberto(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setAtivo((a) => Math.min(sugestoes.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setAtivo((a) => Math.max(-1, a - 1));
            } else if (e.key === "Escape") setAberto(false);
          }}
          className="w-full bg-transparent text-sm outline-none placeholder:text-ui-muted/80"
          placeholder="Nome (português ou inglês), SMILES ou CID do PubChem"
          aria-label="Buscar molécula"
          aria-autocomplete="list"
          aria-expanded={aberto && sugestoes.length > 0}
        />
        <button type="submit" className="rounded-lg bg-chem-primary/15 px-2.5 py-1 text-xs font-semibold text-chem-primary hover:bg-chem-primary/25">
          Buscar
        </button>
      </form>

      {aberto && (sugestoes.length > 0 || buscandoRemoto) && (
        <ul className="glass-strong absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto p-1.5" role="listbox">
          {sugestoes.map((s, i) => {
            const cabecalho = s.grupo !== grupoAnterior;
            grupoAnterior = s.grupo;
            return (
              <li key={`${s.grupo}-${s.rotulo}`} role="option" aria-selected={i === ativo}>
                {cabecalho && (
                  <p className="flex items-center gap-1 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {s.grupo === "Destaques" && <Sparkles className="h-3 w-3 text-chem-primary" />}
                    {s.grupo}
                  </p>
                )}
                <button
                  type="button"
                  onMouseEnter={() => setAtivo(i)}
                  onClick={() => escolher(s.escolha)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left text-sm",
                    i === ativo ? "bg-chem-primary/15 text-chem-primary" : "hover:bg-ui-border/10",
                  )}
                >
                  <span className={cn(s.grupo === "Nomes em português" && "capitalize")}>{s.rotulo}</span>
                  {s.detalhe && <span className="font-mono text-[11px] text-muted">{s.detalhe}</span>}
                </button>
              </li>
            );
          })}
          {buscandoRemoto && (
            <li className="flex items-center gap-2 px-2.5 py-2 text-xs text-muted">
              <Loader2 className="h-3 w-3 animate-spin" /> consultando o PubChem…
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
