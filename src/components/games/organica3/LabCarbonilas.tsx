"use client";

import { useState } from "react";
import { MoveRight } from "lucide-react";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { FONTE_CARBONILAS, QUESTOES_CARBONILAS } from "@/data/carbonilas";
import { EscolhaMultipla, NavEtapas, SeloConclusao, useProgressoJogo } from "../comum";

export default function LabCarbonilas() {
  const p = useProgressoJogo("organica-3", "lab-carbonilas", "/organica-3#lab-carbonilas", "Laboratório de Carbonilas", QUESTOES_CARBONILAS.length);
  const [idx, setIdx] = useState(0);
  const q = QUESTOES_CARBONILAS[idx];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NavEtapas ids={QUESTOES_CARBONILAS.map((x) => x.id)} atual={idx} feitos={p.feitos} onIr={setIdx} />
        <SeloConclusao feitos={p.feitos.length} total={QUESTOES_CARBONILAS.length} jaConcluido={p.jaConcluido} bonus={p.bonus} xpConclusao={p.xpConclusao} />
      </div>
      <div className="glass space-y-4 p-4">
        <span className="chip bg-chem-success/15 text-chem-success">{q.tipo}</span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col items-center">
            <Molecule2DStick smiles={q.substrato.smiles} width={190} height={115} explicitHydrogens={false} />
            <span className="text-sm font-semibold">{q.substrato.nome}</span>
          </div>
          <MoveRight className="h-6 w-6 text-chem-primary" />
          <span className="rounded-lg bg-chem-primary/10 px-3 py-2 font-mono text-sm text-chem-primary">{q.reagentes}</span>
          <MoveRight className="h-6 w-6 text-chem-primary" />
          <span className="text-2xl font-bold text-muted">?</span>
        </div>
        <EscolhaMultipla
          id={q.id}
          opcoes={q.opcoes}
          correta={q.correta}
          resolvida={p.feitos.includes(q.id)}
          explicacao={q.explicacao}
          dicaErro="Ainda não. Onde está o carbono eletrofílico e qual é o nucleófilo do reagente?"
          onAcerto={() => p.marcar(q.id)}
        />
      </div>
      <p className="font-mono text-[10.5px] text-muted">Fonte: {FONTE_CARBONILAS}</p>
    </div>
  );
}
