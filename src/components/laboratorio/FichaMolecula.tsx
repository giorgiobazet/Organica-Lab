"use client";

import { CheckCircle2, Database, Globe2, XCircle } from "lucide-react";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { FONTE_GALERIA } from "@/data/galeria";
import { pubchemCompoundUrl } from "@/services/pubchem";
import { cn } from "@/lib/utils";
import { fmt, formulaSubscrita, type MoleculaLab } from "./molecula";

/** Valores exibidos na ficha, com a origem de cada conjunto (PubChem ou cálculo local). */
export function dadosDaMolecula(m: MoleculaLab) {
  const p = m.props;
  if (p) {
    return {
      fonte: "pubchem" as const,
      formula: p.MolecularFormula,
      massa: Number(p.MolecularWeight),
      iupac: p.IUPACName,
      smiles: p.SMILES ?? p.IsomericSMILES ?? p.CanonicalSMILES ?? m.smiles2D,
      logP: p.XLogP,
      rotuloLogP: "XLogP3",
      tpsa: p.TPSA,
      doadores: p.HBondDonorCount,
      aceptores: p.HBondAcceptorCount,
    };
  }
  const l = m.local;
  if (l) {
    return {
      fonte: "local" as const,
      formula: l.formula,
      massa: l.massaMolar,
      iupac: undefined,
      smiles: l.smilesIsomerico,
      logP: l.logP,
      rotuloLogP: "logP (Crippen)",
      tpsa: l.tpsa,
      doadores: l.doadoresH,
      aceptores: l.aceptoresH,
    };
  }
  return null;
}

export function SeloFonte({ m }: { m: MoleculaLab }) {
  const d = dadosDaMolecula(m);
  if (!d) return null;
  return d.fonte === "pubchem" && m.cid ? (
    <a
      href={pubchemCompoundUrl(m.cid)}
      target="_blank"
      rel="noreferrer"
      className="chip bg-chem-primary/15 font-mono text-chem-primary hover:underline"
    >
      <Globe2 className="h-3 w-3" /> PubChem CID {m.cid}
    </a>
  ) : (
    <span className="chip bg-chem-orbital/15 font-mono text-chem-orbital" title={FONTE_GALERIA}>
      <Database className="h-3 w-3" /> dados locais (RDKit)
    </span>
  );
}

export function FichaMolecula({ m, compacta = false }: { m: MoleculaLab; compacta?: boolean }) {
  const d = dadosDaMolecula(m);
  const linhas: [string, React.ReactNode][] = d
    ? [
        ["Fórmula molecular", formulaSubscrita(d.formula)],
        ["Massa molar", `${fmt(d.massa)} g/mol`],
        ["Nome IUPAC", d.iupac ?? <span className="text-muted">disponível com o PubChem</span>],
        ["SMILES", <span key="s" className="break-all">{d.smiles}</span>],
        [d.rotuloLogP, d.logP !== undefined ? fmt(d.logP, d.fonte === "pubchem" ? 1 : 2) : "—"],
        ["TPSA", d.tpsa !== undefined ? `${fmt(d.tpsa, 1)} Å²` : "—"],
      ]
    : [];

  return (
    <div className="space-y-3">
      {m.smiles2D && !compacta && (
        <div className="flex justify-center rounded-xl bg-ui-border/5 p-2">
          <Molecule2DStick smiles={m.smiles2D} width={340} height={170} />
        </div>
      )}
      {d ? (
        <table className="w-full text-sm">
          <tbody>
            {linhas.map(([k, v]) => (
              <tr key={k} className="border-b border-ui-border/10 align-top">
                <td className="py-1.5 pr-3 text-muted">{k}</td>
                <td className="py-1.5 text-right font-mono text-[12.5px]">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-muted">{m.consultando ? "Consultando o PubChem…" : "Sem dados para esta molécula."}</p>
      )}
      {d && (
        <p className="font-mono text-[10.5px] leading-relaxed text-muted">
          Fonte: {d.fonte === "pubchem" ? `PubChem (CID ${m.cid}); XLogP3 e TPSA computados pelo PubChem.` : FONTE_GALERIA}
        </p>
      )}
    </div>
  );
}

const REGRAS = [
  { chave: "massa", rotulo: "Massa molar", limite: "≤ 500 g/mol", ok: (v: number) => v <= 500, fmt: (v: number) => `${fmt(v)} g/mol` },
  { chave: "logP", rotulo: "logP", limite: "≤ 5", ok: (v: number) => v <= 5, fmt: (v: number) => fmt(v, 2) },
  { chave: "doadores", rotulo: "Doadores de ligação de H", limite: "≤ 5", ok: (v: number) => v <= 5, fmt: (v: number) => String(v) },
  { chave: "aceptores", rotulo: "Aceptores de ligação de H", limite: "≤ 10", ok: (v: number) => v <= 10, fmt: (v: number) => String(v) },
] as const;

export function PainelLipinski({ m }: { m: MoleculaLab }) {
  const d = dadosDaMolecula(m);
  if (!d) return <p className="text-sm text-muted">{m.consultando ? "Consultando o PubChem…" : "Sem dados para esta molécula."}</p>;
  const valores: Record<string, number | undefined> = { massa: d.massa, logP: d.logP, doadores: d.doadores, aceptores: d.aceptores };
  const avaliadas = REGRAS.filter((r) => valores[r.chave] !== undefined);
  const violacoes = avaliadas.filter((r) => !r.ok(valores[r.chave]!)).length;
  const completa = avaliadas.length === REGRAS.length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        A Regra dos 5 de Lipinski estima se um composto tende a ter boa absorção e permeação por via oral. No máximo
        uma violação é compatível com um fármaco oral; duas ou mais indicam provável baixa biodisponibilidade.
      </p>
      <ul className="space-y-1.5">
        {REGRAS.map((r) => {
          const v = valores[r.chave];
          const ok = v !== undefined && r.ok(v);
          return (
            <li
              key={r.chave}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm",
                v === undefined ? "bg-ui-border/10" : ok ? "bg-chem-success/10" : "bg-chem-danger/10",
              )}
            >
              <span className="flex items-center gap-2">
                {v === undefined ? null : ok ? <CheckCircle2 className="h-4 w-4 text-chem-success" /> : <XCircle className="h-4 w-4 text-chem-danger" />}
                {r.rotulo} <span className="text-xs text-muted">{r.limite}</span>
              </span>
              <span className="font-mono text-[12.5px]">{v === undefined ? "—" : r.fmt(v)}</span>
            </li>
          );
        })}
      </ul>
      {completa && (
        <p className={cn("rounded-lg px-3 py-2 text-sm font-semibold", violacoes <= 1 ? "bg-chem-success/10 text-chem-success" : "bg-chem-danger/10 text-chem-danger")}>
          {violacoes === 0 ? "Nenhuma violação" : violacoes === 1 ? "1 violação" : `${violacoes} violações`}:{" "}
          {violacoes <= 1 ? "perfil compatível com fármaco oral." : "provável baixa absorção oral."}
        </p>
      )}
      <p className="font-mono text-[10.5px] leading-relaxed text-muted">
        Regra: Lipinski et al., Adv. Drug Deliv. Rev. 23 (1997) 3–25. Valores:{" "}
        {d.fonte === "pubchem"
          ? "PubChem (XLogP3; doadores e aceptores de H calculados pelo Cactvs)."
          : "RDKit (logP de Crippen; doadores = NH + OH e aceptores = N + O, contagem original de Lipinski)."}
      </p>
    </div>
  );
}
