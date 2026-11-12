"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import { GraficoLinha } from "@/components/charts/GraficoSVG";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { CASOS_CSI } from "@/data/csi";
import { CLASSES_IV, CLASSE_DO_CASO, FONTE_ASSINATURAS_IV, type ClasseIV } from "@/data/detetive";
import { cn } from "@/lib/utils";
import { NavEtapas, SeloConclusao, useProgressoJogo } from "../comum";

export default function DetetiveIV() {
  const p = useProgressoJogo("analise-organica", "detetive-iv", "/analise-organica#detetive-iv", "Detetive do IV", CASOS_CSI.length);
  const [idx, setIdx] = useState(0);
  const [erradas, setErradas] = useState<ClasseIV[]>([]);
  const caso = CASOS_CSI[idx];
  const correta = CLASSE_DO_CASO[caso.id];
  const resolvido = p.feitos.includes(caso.id);
  useEffect(() => setErradas([]), [idx]);
  const dados = useMemo(() => caso.ir.map(([x, y]) => ({ x, y })), [caso]);
  const tDe = (x: number) => dados.reduce((m, d) => (Math.abs(d.x - x) < Math.abs(m.x - x) ? d : m), dados[0]).y;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NavEtapas ids={CASOS_CSI.map((c) => c.id)} atual={idx} feitos={p.feitos} onIr={setIdx} />
        <SeloConclusao feitos={p.feitos.length} total={CASOS_CSI.length} jaConcluido={p.jaConcluido} bonus={p.bonus} xpConclusao={p.xpConclusao} />
      </div>
      <div className="glass space-y-3 p-4">
        <h3 className="text-lg font-bold">
          Amostra {idx + 1} · <span className="font-mono">{caso.formula}</span>
        </h3>
        <p className="text-sm text-muted">Espectro de infravermelho (%T × número de onda). Qual grupo funcional ele revela?</p>
        <div className="h-72">
          <GraficoLinha
            dados={dados}
            dominioX={[450, 4000]}
            marcasX={[4000, 3500, 3000, 2500, 2000, 1500, 1000, 500]}
            invertidoX
            dominioY={[0, 100]}
            cor="#06B6D4"
            espessura={1.5}
            curva="reta"
            margens={{ top: 10, right: 12, bottom: 4, left: -16 }}
            destaques={resolvido ? caso.irPicos.map((pk) => ({ x: pk.x, y: tDe(pk.x), raio: 6, cor: "#10B981", rotulo: `${pk.x} cm⁻¹: ${pk.rotulo}` })) : []}
            dica={(pt) => [`${pt.x} cm⁻¹`, "Transmitância", `${pt.y} %T`]}
          />
        </div>
        <p className="font-mono text-[10.5px] text-muted">{caso.irFonte}</p>
      </div>
      <div className="glass space-y-3 p-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CLASSES_IV.map((c) => {
            const certa = resolvido && c.id === correta;
            const errada = erradas.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                disabled={resolvido}
                onClick={() => (c.id === correta ? p.marcar(caso.id) : setErradas((x) => (x.includes(c.id) ? x : [...x, c.id])))}
                className={cn(
                  "glass-soft p-3 text-left text-sm",
                  certa && "ring-2 ring-chem-success",
                  errada && "ring-2 ring-chem-danger",
                  !resolvido && !errada && "hover:ring-2 hover:ring-chem-primary/60",
                )}
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  {certa && <CheckCircle2 className="h-4 w-4 text-chem-success" />}
                  {errada && <XCircle className="h-4 w-4 text-chem-danger" />}
                  {c.nome}
                </span>
                {errada && <span className="mt-1 block text-xs text-chem-danger">Esperaríamos: {c.assinatura}</span>}
              </button>
            );
          })}
        </div>
        {resolvido && (
          <div className="flex flex-wrap items-center gap-4 rounded-lg bg-chem-success/10 p-3">
            <Molecule2DStick smiles={caso.smiles} width={160} height={100} explicitHydrogens={false} />
            <div className="flex-1 text-sm">
              <p className="font-semibold">{caso.nome}</p>
              <p className="flex gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-chem-success" />
                {CLASSES_IV.find((c) => c.id === correta)!.assinatura} Bandas marcadas em verde no espectro.
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="font-mono text-[10.5px] text-muted">Fonte: {FONTE_ASSINATURAS_IV}</p>
    </div>
  );
}
