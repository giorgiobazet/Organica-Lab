"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Link2, ListPlus, Presentation, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { mesmaRef, refParaTexto, textoParaRef, type RefMolecula } from "./molecula";

export interface ItemLista {
  ref: RefMolecula;
  nome: string;
}

export interface ListaAula {
  titulo: string;
  itens: ItemLista[];
}

const CHAVE = "organicalab:lista-aula";
const VAZIA: ListaAula = { titulo: "", itens: [] };

/** Link que abre a lista (e a primeira molécula) em qualquer navegador. */
export function linkDaLista(lista: ListaAula): string {
  const p = new URLSearchParams();
  p.set("lista", lista.itens.map((i) => refParaTexto(i.ref)).join(","));
  if (lista.titulo) p.set("t", lista.titulo);
  p.set("n", lista.itens.map((i) => i.nome).join("|"));
  return `${window.location.origin}/laboratorio?${p.toString()}`;
}

/** Lista recebida por link (?lista=…&t=…&n=…), ou null. */
export function listaDaUrl(params: URLSearchParams): ListaAula | null {
  const bruto = params.get("lista");
  if (!bruto) return null;
  const nomes = (params.get("n") ?? "").split("|");
  const itens = bruto
    .split(",")
    .map((t, i) => {
      const ref = textoParaRef(t);
      return ref ? { ref, nome: nomes[i]?.slice(0, 80) || t } : null;
    })
    .filter((x): x is ItemLista => x !== null)
    .slice(0, 50);
  return itens.length ? { titulo: (params.get("t") ?? "").slice(0, 80), itens } : null;
}

/** Lista da Aula guardada neste navegador. Uma lista recebida por link só é salva quando editada. */
export function useListaAula() {
  const [lista, setLista] = useState<ListaAula>(VAZIA);

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE);
      if (salvo) {
        const l = JSON.parse(salvo) as ListaAula;
        if (Array.isArray(l.itens)) setLista({ titulo: String(l.titulo ?? ""), itens: l.itens.filter((i) => i?.ref && i?.nome) });
      }
    } catch {
      /* lista salva ilegível ou armazenamento indisponível: começa vazia */
    }
  }, []);

  const editar = useCallback((f: (l: ListaAula) => ListaAula) => {
    setLista((atual) => {
      const nova = f(atual);
      try {
        window.localStorage.setItem(CHAVE, JSON.stringify(nova));
      } catch {
        /* sem armazenamento: a lista vale só nesta sessão */
      }
      return nova;
    });
  }, []);

  return { lista, setLista, editar };
}

export function PainelLista({
  lista,
  editar,
  atual,
  nomeAtual,
  onAbrir,
  onApresentar,
  onCopiarLink,
}: {
  lista: ListaAula;
  editar: (f: (l: ListaAula) => ListaAula) => void;
  atual: RefMolecula | null;
  nomeAtual: string;
  onAbrir: (ref: RefMolecula) => void;
  onApresentar: () => void;
  onCopiarLink: (url: string) => void;
}) {
  const jaNaLista = atual ? lista.itens.some((i) => mesmaRef(i.ref, atual)) : true;
  const mover = (i: number, d: -1 | 1) =>
    editar((l) => {
      const itens = [...l.itens];
      const j = i + d;
      if (j < 0 || j >= itens.length) return l;
      [itens[i], itens[j]] = [itens[j], itens[i]];
      return { ...l, itens };
    });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Separe as moléculas da aula na ordem em que vai mostrá-las. Em <strong>Apresentar</strong>, passe de uma para
        outra com as setas, como slides. O link leva a lista inteira para os alunos revisarem.
      </p>
      <input
        className="lab-input"
        value={lista.titulo}
        onChange={(e) => editar((l) => ({ ...l, titulo: e.target.value.slice(0, 80) }))}
        placeholder="Título da aula (ex.: Estereoquímica: talidomida)"
        aria-label="Título da aula"
      />
      <button
        type="button"
        disabled={!atual || jaNaLista}
        onClick={() => atual && editar((l) => ({ ...l, itens: [...l.itens, { ref: atual, nome: nomeAtual }].slice(0, 50) }))}
        className="btn-ghost w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ListPlus className="h-4 w-4" /> {jaNaLista && atual ? "Molécula atual já está na lista" : "Adicionar a molécula atual"}
      </button>

      {lista.itens.length ? (
        <ol className="space-y-1.5">
          {lista.itens.map((item, i) => {
            const ativa = atual ? mesmaRef(item.ref, atual) : false;
            return (
              <li
                key={refParaTexto(item.ref)}
                className={cn("flex items-center gap-1 rounded-lg border px-2 py-1.5 text-sm", ativa ? "border-chem-primary/60 bg-chem-primary/10" : "border-ui-border/20")}
              >
                <span className="w-6 font-mono text-xs text-muted">{i + 1}.</span>
                <button type="button" onClick={() => onAbrir(item.ref)} className="flex-1 truncate text-left hover:text-chem-primary">
                  {item.nome}
                </button>
                <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} className="p-1 text-muted hover:text-chem-primary disabled:opacity-30" aria-label="Subir">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => mover(i, 1)} disabled={i === lista.itens.length - 1} className="p-1 text-muted hover:text-chem-primary disabled:opacity-30" aria-label="Descer">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editar((l) => ({ ...l, itens: l.itens.filter((_, j) => j !== i) }))}
                  className="p-1 text-muted hover:text-chem-danger"
                  aria-label={`Remover ${item.nome}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-lg border border-dashed border-ui-border/30 px-3 py-4 text-center text-sm text-muted">
          A lista está vazia. Abra uma molécula e toque em “Adicionar a molécula atual”.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onApresentar} disabled={!lista.itens.length} className="btn-primary disabled:opacity-50">
          <Presentation className="h-4 w-4" /> Apresentar
        </button>
        <button type="button" onClick={() => onCopiarLink(linkDaLista(lista))} disabled={!lista.itens.length} className="btn-ghost disabled:opacity-50">
          <Link2 className="h-4 w-4" /> Link da lista
        </button>
      </div>
      {lista.itens.length > 0 && (
        <button type="button" onClick={() => editar(() => VAZIA)} className="flex items-center gap-1.5 text-xs text-muted hover:text-chem-danger">
          <Trash2 className="h-3.5 w-3.5" /> Limpar lista
        </button>
      )}
    </div>
  );
}
