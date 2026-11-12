"use client";

import { useState } from "react";
import { Molecule3DViewer } from "@/components/Molecule3DViewer";
import { FONTE_DIELS_ALDER, QUESTOES_DA } from "@/data/dielsAlder";
import { ADUTO_BUTADIENO_CIS, ADUTO_ENDO, ADUTO_EXO } from "@/data/dielsAlder3d";
import { EscolhaMultipla, NavEtapas, SeloConclusao, useProgressoJogo } from "../comum";

function Modelo({ sdf, rotulo }: { sdf: string; rotulo: string }) {
  return (
    <div className="glass-soft overflow-hidden p-2">
      <p className="mb-1 text-center text-sm font-semibold">{rotulo}</p>
      <div className="relative h-[260px]">
        <Molecule3DViewer sdf={sdf} spin={false} transparent={false} zoom={1.1} className="absolute inset-0" linkLaboratorio={false} />
      </div>
    </div>
  );
}

export default function DielsAlder() {
  const p = useProgressoJogo("organica-2", "diels-alder", "/organica-2#diels-alder", "Diels-Alder em 3D", QUESTOES_DA.length);
  const [idx, setIdx] = useState(0);
  const q = QUESTOES_DA[idx];
  const resolvida = p.feitos.includes(q.id);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NavEtapas ids={QUESTOES_DA.map((x) => x.id)} atual={idx} feitos={p.feitos} onIr={setIdx} />
        <SeloConclusao feitos={p.feitos.length} total={QUESTOES_DA.length} jaConcluido={p.jaConcluido} bonus={p.bonus} xpConclusao={p.xpConclusao} />
      </div>
      <div className="glass space-y-4 p-4">
        <div>
          <p className="font-mono text-sm text-chem-primary">{q.reacao}</p>
          <h3 className="text-lg font-bold">{q.pergunta}</h3>
        </div>
        {q.modelo3d === "endo-exo" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Modelo sdf={ADUTO_EXO} rotulo={resolvida ? "Aduto A · exo" : "Aduto A"} />
            <Modelo sdf={ADUTO_ENDO} rotulo={resolvida ? "Aduto B · endo" : "Aduto B"} />
          </div>
        )}
        <EscolhaMultipla
          id={q.id}
          opcoes={q.opcoes}
          correta={q.correta}
          resolvida={resolvida}
          explicacao={q.explicacao}
          dicaErro="Ainda não. Gire os modelos e lembre: a reação é concertada, num só passo."
          onAcerto={() => p.marcar(q.id)}
        />
        {q.modelo3d === "cis" && resolvida && <Modelo sdf={ADUTO_BUTADIENO_CIS} rotulo="Produto cis em 3D: gire e compare os dois H da junção" />}
      </div>
      <p className="font-mono text-[10.5px] text-muted">Fonte: {FONTE_DIELS_ALDER}</p>
    </div>
  );
}
