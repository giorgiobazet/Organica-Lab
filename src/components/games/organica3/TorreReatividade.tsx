"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { EXPLICACAO_TORRE, FONTE_REATIVIDADE, QUESTOES_REATIVIDADE, TORRE } from "@/data/reatividade";
import { cn } from "@/lib/utils";
import { NavEtapas, OrdenarCartas, SeloConclusao, useProgressoJogo } from "../comum";

const ETAPAS = ["torre", ...QUESTOES_REATIVIDADE.map((q) => q.id)];

export default function TorreReatividade() {
  const p = useProgressoJogo("organica-3", "torre-reatividade", "/organica-3#torre-reatividade", "Torre de Reatividade", ETAPAS.length);
  const [idx, setIdx] = useState(0);
  const [erradas, setErradas] = useState<number[]>([]);
  const ir = (i: number) => {
    setIdx(i);
    setErradas([]);
  };
  const cartas = useMemo(() => TORRE.map((d) => ({ chave: d.nome, nome: d.nome, smiles: d.smiles, revelado: `sai ${d.grupoSaida}` })), []);

  const q = idx > 0 ? QUESTOES_REATIVIDADE[idx - 1] : null;
  const resolvida = p.feitos.includes(ETAPAS[idx]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NavEtapas ids={ETAPAS} atual={idx} feitos={p.feitos} onIr={ir} />
        <SeloConclusao feitos={p.feitos.length} total={ETAPAS.length} jaConcluido={p.jaConcluido} bonus={p.bonus} xpConclusao={p.xpConclusao} />
      </div>

      {!q ? (
        <div className="glass p-4">
          <h3 className="mb-3 text-lg font-bold">Monte a torre</h3>
          <OrdenarCartas
            id="torre"
            cartas={cartas}
            ordemCorreta={TORRE.map((d) => d.nome)}
            resolvido={resolvida}
            onAcerto={() => p.marcar("torre")}
            instrucao="Toque nos derivados do MAIS reativo para o MENOS reativo frente a um nucleófilo (substituição nucleofílica acílica)."
          />
          {resolvida && (
            <p className="mt-4 flex gap-2 rounded-lg bg-chem-success/10 px-3 py-2 text-sm">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-chem-success" />
              {EXPLICACAO_TORRE} Regra de ouro: um derivado só vira diretamente outro igual ou mais abaixo na torre.
            </p>
          )}
        </div>
      ) : (
        <div className="glass space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {q.smilesReagente && <Molecule2DStick smiles={q.smilesReagente} width={180} height={110} explicitHydrogens={false} />}
            <div>
              <p className="font-mono text-sm text-chem-primary">{q.reagentes}</p>
              <h3 className="text-lg font-bold">{q.pergunta}</h3>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {q.opcoes.map((o, k) => {
              const certa = resolvida && k === q.correta;
              const errada = erradas.includes(k);
              return (
                <button
                  key={o.texto}
                  type="button"
                  disabled={resolvida}
                  onClick={() => {
                    if (k === q.correta) p.marcar(q.id);
                    else setErradas((e) => (e.includes(k) ? e : [...e, k]));
                  }}
                  className={cn(
                    "glass-soft flex items-center gap-3 p-3 text-left text-sm transition",
                    certa && "ring-2 ring-chem-success",
                    errada && "opacity-60 ring-2 ring-chem-danger",
                    !resolvida && !errada && "hover:ring-2 hover:ring-chem-primary/60",
                  )}
                >
                  {o.smiles && <Molecule2DStick smiles={o.smiles} width={120} height={80} explicitHydrogens={false} />}
                  <span className="flex-1 font-semibold">{o.texto}</span>
                  {certa && <CheckCircle2 className="h-5 w-5 text-chem-success" />}
                  {errada && <XCircle className="h-5 w-5 text-chem-danger" />}
                </button>
              );
            })}
          </div>
          {erradas.length > 0 && !resolvida && (
            <p className="text-sm text-chem-danger">Ainda não. Pense na torre: o produto precisa estar no mesmo nível ou abaixo do reagente.</p>
          )}
          {resolvida && (
            <p className="flex gap-2 rounded-lg bg-chem-success/10 px-3 py-2 text-sm">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-chem-success" />
              {q.explicacao}
            </p>
          )}
        </div>
      )}
      <p className="font-mono text-[10.5px] text-muted">Fonte: {FONTE_REATIVIDADE}</p>
    </div>
  );
}
