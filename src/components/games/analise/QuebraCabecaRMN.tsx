"use client";

import { useState } from "react";
import { CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { FONTE_RMN, PUZZLES_RMN, type SinalRMN } from "@/data/rmn";
import { cn } from "@/lib/utils";
import { NavEtapas, SeloConclusao, useProgressoJogo } from "../comum";

// Intensidades relativas das linhas (triângulo de Pascal para acoplamento com n H equivalentes).
const PADRAO: Record<SinalRMN["mult"], number[]> = { s: [1], d: [1, 1], t: [1, 2, 1], q: [1, 3, 3, 1], m: [1, 2, 3, 2, 1] };
const NOME_MULT: Record<SinalRMN["mult"], string> = { s: "singleto", d: "dubleto", t: "tripleto", q: "quarteto", m: "multipleto" };

/** Espectro em linhas: altura ∝ integração; multipletos com espaçamento ampliado para leitura. */
function Espectro({ sinais }: { sinais: SinalRMN[] }) {
  const W = 760;
  const H = 230;
  const ESQ = 20;
  const DIR = 20;
  const BASE = H - 34;
  const maxPpm = Math.max(10, Math.ceil(Math.max(...sinais.map((s) => s.delta)) + 1));
  const x = (d: number) => ESQ + ((maxPpm - d) / maxPpm) * (W - ESQ - DIR);
  const maxN = Math.max(...sinais.map((s) => s.n));
  const marcas = Array.from({ length: maxPpm + 1 }, (_, i) => maxPpm - i);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Espectro de RMN de ¹H">
      <line x1={ESQ} x2={W - DIR} y1={BASE} y2={BASE} stroke="#94A3B8" />
      {marcas.map((m) => (
        <g key={m}>
          <line x1={x(m)} x2={x(m)} y1={BASE} y2={BASE + 5} stroke="#94A3B8" />
          <text x={x(m)} y={BASE + 18} fontSize={11} fill="#94A3B8" textAnchor="middle">
            {m}
          </text>
        </g>
      ))}
      <text x={W / 2} y={H - 2} fontSize={11} fill="#94A3B8" textAnchor="middle">
        δ (ppm)
      </text>
      {sinais.map((s) => {
        const linhas = PADRAO[s.mult];
        const topo = Math.max(...linhas);
        const alt = Math.max(14, (s.n / maxN) * (BASE - 40));
        const passo = 0.06;
        return (
          <g key={s.delta}>
            {linhas.map((w, i) => {
              const d = s.delta + (i - (linhas.length - 1) / 2) * passo;
              return <line key={i} x1={x(d)} x2={x(d)} y1={BASE} y2={BASE - (alt * w) / topo} stroke="#06B6D4" strokeWidth={2} />;
            })}
            <text x={x(s.delta)} y={BASE - alt - 8} fontSize={11} fill="#8B5CF6" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
              {s.n}H
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function QuebraCabecaRMN() {
  const p = useProgressoJogo("analise-organica", "quebra-cabeca-rmn", "/analise-organica#quebra-cabeca-rmn", "Quebra-cabeça de RMN", PUZZLES_RMN.length);
  const [idx, setIdx] = useState(0);
  const [erradas, setErradas] = useState<number[]>([]);
  const z = PUZZLES_RMN[idx];
  const resolvido = p.feitos.includes(z.id);
  const ir = (i: number) => {
    setIdx(i);
    setErradas([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NavEtapas ids={PUZZLES_RMN.map((x) => x.id)} atual={idx} feitos={p.feitos} onIr={ir} />
        <SeloConclusao feitos={p.feitos.length} total={PUZZLES_RMN.length} jaConcluido={p.jaConcluido} bonus={p.bonus} xpConclusao={p.xpConclusao} />
      </div>

      <div className="glass space-y-3 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold">
            Amostra desconhecida · <span className="font-mono">{z.formula}</span>
          </h3>
          <span className="text-xs text-muted">RMN de ¹H (CDCl₃)</span>
        </div>
        <Espectro sinais={z.sinais} />
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="py-1">δ (ppm)</th>
              <th>Multiplicidade</th>
              <th>Integração</th>
              {resolvido && <th>Atribuição</th>}
            </tr>
          </thead>
          <tbody className="font-mono text-[12.5px]">
            {z.sinais.map((s) => (
              <tr key={s.delta} className="border-t border-ui-border/10">
                <td className="py-1">{s.delta.toLocaleString("pt-BR")}</td>
                <td>{NOME_MULT[s.mult]}</td>
                <td>{s.n}H</td>
                {resolvido && <td className="font-sans">{s.atrib}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass space-y-3 p-4">
        <h3 className="font-semibold">Qual destes isômeros dá este espectro?</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {z.candidatas.map((c, k) => {
            const certa = resolvido && k === z.correta;
            const errada = erradas.includes(k);
            return (
              <button
                key={c.nome}
                type="button"
                disabled={resolvido}
                onClick={() => {
                  if (k === z.correta) p.marcar(z.id);
                  else setErradas((e) => (e.includes(k) ? e : [...e, k]));
                }}
                className={cn(
                  "glass-soft flex flex-col items-center gap-1 p-3 text-center text-sm",
                  certa && "ring-2 ring-chem-success",
                  errada && "ring-2 ring-chem-danger",
                  !resolvido && !errada && "hover:ring-2 hover:ring-chem-primary/60",
                )}
              >
                <Molecule2DStick smiles={c.smiles} width={190} height={115} explicitHydrogens={false} />
                <span className="flex items-center gap-1 font-semibold">
                  {certa && <CheckCircle2 className="h-4 w-4 text-chem-success" />}
                  {errada && <XCircle className="h-4 w-4 text-chem-danger" />}
                  {c.nome}
                </span>
                {errada && c.porque && <span className="text-xs text-chem-danger">{c.porque}</span>}
              </button>
            );
          })}
        </div>
        {resolvido && (
          <p className="flex gap-2 rounded-lg bg-chem-success/10 px-3 py-2 text-sm">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-chem-success" />
            {z.resumo}
          </p>
        )}
      </div>
      <p className="font-mono text-[10.5px] text-muted">Fonte: {FONTE_RMN} Linhas dos multipletos com espaçamento ampliado para leitura.</p>
    </div>
  );
}
