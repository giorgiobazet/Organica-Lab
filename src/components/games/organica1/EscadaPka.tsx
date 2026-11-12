"use client";

import { useMemo, useState } from "react";
import { Lightbulb } from "lucide-react";
import { FONTE_PKA, RODADAS_PKA } from "@/data/pka";
import { NavEtapas, OrdenarCartas, SeloConclusao, useProgressoJogo } from "../comum";

const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export default function EscadaPka() {
  const p = useProgressoJogo("organica-1", "escada-pka", "/organica-1#escada-pka", "Escada de pKa", RODADAS_PKA.length);
  const [idx, setIdx] = useState(0);
  const r = RODADAS_PKA[idx];
  const resolvida = p.feitos.includes(r.id);

  const cartas = useMemo(
    () => r.itens.map((it) => ({ chave: it.nome, nome: it.nome, smiles: it.smiles, revelado: `${r.tipo === "base" ? "pKaH" : "pKa"} ${fmt(it.pKa)}` })),
    [r],
  );
  // Ácidos: do menor pKa (mais ácido) ao maior. Bases: do maior pKaH (base mais forte) ao menor.
  const ordem = useMemo(() => [...r.itens].sort((a, b) => (r.tipo === "acido" ? a.pKa - b.pKa : b.pKa - a.pKa)).map((i) => i.nome), [r]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NavEtapas ids={RODADAS_PKA.map((x) => x.id)} atual={idx} feitos={p.feitos} onIr={setIdx} />
        <SeloConclusao feitos={p.feitos.length} total={RODADAS_PKA.length} jaConcluido={p.jaConcluido} bonus={p.bonus} xpConclusao={p.xpConclusao} />
      </div>

      <div className="glass p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold">{r.titulo}</h3>
          <span className="chip bg-chem-orbital/15 text-chem-orbital">{r.fator}</span>
        </div>
        <OrdenarCartas
          id={r.id}
          cartas={cartas}
          ordemCorreta={ordem}
          resolvido={resolvida}
          onAcerto={() => p.marcar(r.id)}
          instrucao={
            r.tipo === "acido"
              ? "Toque nas moléculas do MAIS ácido (menor pKa) para o MENOS ácido."
              : "Toque nas moléculas da base MAIS forte para a MAIS fraca (compare o pKa dos ácidos conjugados)."
          }
        />
        {resolvida && (
          <p className="mt-4 flex gap-2 rounded-lg bg-chem-success/10 px-3 py-2 text-sm">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-chem-success" />
            {r.explicacao}
          </p>
        )}
      </div>
      <p className="font-mono text-[10.5px] text-muted">Fonte: {FONTE_PKA}</p>
    </div>
  );
}
