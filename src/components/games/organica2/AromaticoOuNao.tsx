"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { Molecule3DViewer } from "@/components/Molecule3DViewer";
import { ESPECIES, FONTE_AROMATICIDADE, ROTULO_CLASSE, type Classe } from "@/data/aromaticidade";
import { COT_DESVIO, COT_SDF } from "@/data/aromaticidade3d";
import { cn } from "@/lib/utils";
import { NavEtapas, SeloConclusao, useProgressoJogo } from "../comum";

const CLASSES: Classe[] = ["aromatico", "antiaromatico", "nao-aromatico"];

export default function AromaticoOuNao() {
  const p = useProgressoJogo("organica-2", "aromatico-ou-nao", "/organica-2#aromatico-ou-nao", "Aromático ou Não?", ESPECIES.length);
  const [idx, setIdx] = useState(0);
  const [erradas, setErradas] = useState<Classe[]>([]);
  const e = ESPECIES[idx];
  const resolvida = p.feitos.includes(e.id);
  useEffect(() => setErradas([]), [idx]);

  const criterios = [
    { rotulo: "Cíclico", ok: true },
    { rotulo: "Planar", ok: e.planar },
    { rotulo: "Conjugação contínua no anel", ok: e.conjugado },
    { rotulo: `${e.eletronsPi} elétrons π (${(e.eletronsPi - 2) % 4 === 0 ? "4n + 2" : "4n"})`, ok: (e.eletronsPi - 2) % 4 === 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NavEtapas ids={ESPECIES.map((x) => x.id)} atual={idx} feitos={p.feitos} onIr={setIdx} />
        <SeloConclusao feitos={p.feitos.length} total={ESPECIES.length} jaConcluido={p.jaConcluido} bonus={p.bonus} xpConclusao={p.xpConclusao} />
      </div>
      <div className="glass space-y-4 p-4">
        <h3 className="text-lg font-bold">{e.nome}</h3>
        <div className={cn("grid gap-3", e.modelo3d && "md:grid-cols-2")}>
          <div className="flex justify-center rounded-xl bg-ui-border/5 p-2">
            <Molecule2DStick smiles={e.smiles} width={260} height={170} explicitHydrogens />
          </div>
          {e.modelo3d && (
            <div className="relative h-[230px] overflow-hidden rounded-xl">
              <Molecule3DViewer sdf={COT_SDF} spin transparent={false} zoom={1.1} linkLaboratorio={false} className="absolute inset-0" />
            </div>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {CLASSES.map((c) => {
            const certa = resolvida && c === e.classe;
            const errada = erradas.includes(c);
            return (
              <button
                key={c}
                type="button"
                disabled={resolvida}
                onClick={() => (c === e.classe ? p.marcar(e.id) : setErradas((x) => (x.includes(c) ? x : [...x, c])))}
                className={cn(
                  "glass-soft flex items-center justify-center gap-2 p-3 font-semibold",
                  certa && "ring-2 ring-chem-success",
                  errada && "opacity-60 ring-2 ring-chem-danger",
                  !resolvida && !errada && "hover:ring-2 hover:ring-chem-primary/60",
                )}
              >
                {certa && <CheckCircle2 className="h-4 w-4 text-chem-success" />}
                {errada && <XCircle className="h-4 w-4 text-chem-danger" />}
                {ROTULO_CLASSE[c]}
              </button>
            );
          })}
        </div>
        {erradas.length > 0 && !resolvida && <p className="text-sm text-chem-danger">Ainda não. Conte os elétrons π e confira se o anel é planar e conjugado por inteiro.</p>}
        {resolvida && (
          <div className="space-y-2">
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {criterios.map((k) => (
                <li key={k.rotulo} className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm", k.ok ? "bg-chem-success/10" : "bg-chem-danger/10")}>
                  {k.ok ? <CheckCircle2 className="h-4 w-4 text-chem-success" /> : <XCircle className="h-4 w-4 text-chem-danger" />}
                  {k.rotulo}
                </li>
              ))}
            </ul>
            <p className="flex gap-2 rounded-lg bg-chem-success/10 px-3 py-2 text-sm">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-chem-success" />
              {e.explicacao}
              {e.modelo3d && ` No modelo, um carbono chega a ${COT_DESVIO.toLocaleString("pt-BR")} Å fora do plano médio do anel.`}
            </p>
          </div>
        )}
      </div>
      <p className="font-mono text-[10.5px] text-muted">Fonte: {FONTE_AROMATICIDADE}</p>
    </div>
  );
}
