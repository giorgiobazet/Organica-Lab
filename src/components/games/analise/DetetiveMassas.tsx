"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import { GraficoBarras } from "@/components/charts/GraficoSVG";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { CASOS_CSI } from "@/data/csi";
import { cn } from "@/lib/utils";
import { NavEtapas, SeloConclusao, useProgressoJogo } from "../comum";

/** Duas perguntas por amostra: o íon molecular e a identidade do pico base. */
export default function DetetiveMassas() {
  const p = useProgressoJogo("analise-organica", "detetive-massas", "/analise-organica#detetive-massas", "Detetive de Massas", CASOS_CSI.length);
  const [idx, setIdx] = useState(0);
  const [passo, setPasso] = useState<0 | 1>(0);
  const [erradas, setErradas] = useState<string[]>([]);
  const caso = CASOS_CSI[idx];
  const resolvido = p.feitos.includes(caso.id);
  useEffect(() => {
    setPasso(resolvido ? 1 : 0);
    setErradas([]);
  }, [idx, resolvido]);

  const base = useMemo(() => caso.ms.reduce((m, x) => (x.int > m.int ? x : m), caso.ms[0]), [caso]);
  const molecular = caso.msNotas[0].mz; // a primeira nota de cada caso é o M⁺•
  const opcoesM = useMemo(() => Array.from(new Set([molecular, ...caso.msNotas.slice(1).map((n) => n.mz), base.mz])).slice(0, 4).sort((a, b) => b - a), [caso, molecular, base]);
  const notaBase = caso.msNotas.find((n) => n.mz === base.mz);
  const max = Math.max(...caso.ms.map((x) => x.mz));
  const notas = new Map(caso.msNotas.map((n) => [n.mz, n.rotulo]));
  const mostrarNotas = passo === 1;

  const escolher = (chave: string, certo: boolean) => {
    if (!certo) return setErradas((e) => (e.includes(chave) ? e : [...e, chave]));
    setErradas([]);
    if (passo === 0) setPasso(1);
    else p.marcar(caso.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NavEtapas ids={CASOS_CSI.map((c) => c.id)} atual={idx} feitos={p.feitos} onIr={setIdx} />
        <SeloConclusao feitos={p.feitos.length} total={CASOS_CSI.length} jaConcluido={p.jaConcluido} bonus={p.bonus} xpConclusao={p.xpConclusao} />
      </div>
      <div className="glass space-y-3 p-4">
        <h3 className="text-lg font-bold">
          Amostra {idx + 1} · massa molar {caso.massaMolar.toLocaleString("pt-BR")} g/mol
        </h3>
        <div className="h-64">
          <GraficoBarras
            modo="numerico"
            dominioX={[10, max + 10]}
            dominioY={[0, 100]}
            larguraBarra={4}
            margens={{ top: 10, right: 12, bottom: 4, left: -16 }}
            barras={caso.ms.map((d) => ({ chave: d.mz, x: d.mz, valor: d.int, cor: mostrarNotas && notas.has(d.mz) ? "#8B5CF6" : "#64748B" }))}
            dica={(b) => [`m/z ${b.x}`, "abundância", `${b.valor}%`]}
          />
        </div>
        <p className="font-mono text-[10.5px] text-muted">Espectro de massas (IE, 70 eV) · {caso.msFonte}</p>
      </div>

      <div className="glass space-y-3 p-4">
        {passo === 0 ? (
          <>
            <p className="font-semibold">1. Qual pico é o íon molecular (M⁺•)?</p>
            <div className="flex flex-wrap gap-2">
              {opcoesM.map((mz) => (
                <button
                  key={mz}
                  type="button"
                  onClick={() => escolher(String(mz), mz === molecular)}
                  className={cn("btn-ghost font-mono", erradas.includes(String(mz)) && "!border-chem-danger text-chem-danger")}
                >
                  m/z {mz}
                </button>
              ))}
            </div>
            {erradas.length > 0 && (
              <p className="text-sm text-chem-danger">Ainda não. O íon molecular corresponde à massa da molécula inteira (compare com a massa molar) e costuma ser o último pico relevante.</p>
            )}
          </>
        ) : (
          <>
            <p className="flex items-center gap-2 text-sm text-chem-success">
              <CheckCircle2 className="h-4 w-4" /> M⁺• em m/z {molecular}
            </p>
            <p className="font-semibold">2. O pico base (100%) está em m/z {base.mz}. O que ele é?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {caso.msNotas.map((n) => {
                const certo = n.mz === base.mz;
                return (
                  <button
                    key={n.mz}
                    type="button"
                    disabled={resolvido}
                    onClick={() => escolher(n.rotulo, certo)}
                    className={cn(
                      "glass-soft p-2.5 text-left text-sm",
                      resolvido && certo && "ring-2 ring-chem-success",
                      erradas.includes(n.rotulo) && "ring-2 ring-chem-danger",
                    )}
                  >
                    {erradas.includes(n.rotulo) && <XCircle className="mr-1 inline h-4 w-4 text-chem-danger" />}
                    {n.rotulo}
                  </button>
                );
              })}
            </div>
            {resolvido && (
              <div className="flex flex-wrap items-center gap-4 rounded-lg bg-chem-success/10 p-3 text-sm">
                <Molecule2DStick smiles={caso.smiles} width={160} height={100} explicitHydrogens={false} />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold">{caso.nome}</p>
                  <p className="flex gap-2">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-chem-success" />
                    Pico base: {notaBase?.rotulo}. Os picos em violeta no espectro são os fragmentos anotados:
                  </p>
                  <ul className="font-mono text-xs">
                    {caso.msNotas.map((n) => (
                      <li key={n.mz}>
                        m/z {n.mz}: {n.rotulo}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
