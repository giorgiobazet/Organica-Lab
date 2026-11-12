import type { PubChemProperties } from "@/services/pubchem";
import type { MoleculaGaleria } from "@/data/galeria";
import type { DadosCalculados } from "./ocl";

/** Como uma molécula é identificada em links e na Lista da Aula. */
export type RefMolecula = { tipo: "galeria"; chave: string } | { tipo: "cid"; cid: number } | { tipo: "smiles"; smiles: string };

/** Molécula aberta no laboratório: o que já se sabe dela e de onde veio cada dado. */
export interface MoleculaLab {
  ref: RefMolecula;
  nome: string;
  cid?: number;
  /** Geometria 3D exibida e sua origem. */
  sdf?: string;
  origemSdf?: { tipo: "pubchem"; cid: number } | { tipo: "local" };
  /** SMILES em Kekulé para o bastão 2D. */
  smiles2D?: string;
  /** Dados oficiais do PubChem (quando disponível). */
  props?: PubChemProperties;
  /** Dados calculados localmente (moléculas da galeria). */
  local?: MoleculaGaleria;
  /** Dados calculados no navegador (moléculas desenhadas ou SMILES fora do PubChem). */
  calculado?: DadosCalculados;
  /** Busca no PubChem em andamento. */
  consultando: boolean;
  aviso?: string;
}

export function refParaTexto(ref: RefMolecula): string {
  if (ref.tipo === "galeria") return `g:${ref.chave}`;
  if (ref.tipo === "cid") return `c:${ref.cid}`;
  return `s:${ref.smiles}`;
}

export function textoParaRef(texto: string): RefMolecula | null {
  const [tipo, ...resto] = texto.split(":");
  const valor = resto.join(":");
  if (!valor) return null;
  if (tipo === "g") return { tipo: "galeria", chave: valor };
  if (tipo === "c" && /^\d+$/.test(valor)) return { tipo: "cid", cid: Number(valor) };
  if (tipo === "s") return { tipo: "smiles", smiles: valor };
  return null;
}

export function mesmaRef(a: RefMolecula, b: RefMolecula): boolean {
  return refParaTexto(a) === refParaTexto(b);
}

/** Fórmula com números subscritos (C9H8O4 → C₉H₈O₄). */
export function formulaSubscrita(formula: string): string {
  return formula.replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[Number(d)]);
}

export const fmt = (n: number, casas = 2) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
