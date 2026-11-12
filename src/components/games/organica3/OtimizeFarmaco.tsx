"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasEditor } from "openchemlib";
import { CheckCircle2, Lightbulb, Loader2, RotateCcw, XCircle } from "lucide-react";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { carregarOCL, avaliarLipinski, type AvaliacaoLipinski } from "@/components/laboratorio/ocl";
import { DESAFIOS_FARMACO, FONTE_LIPINSKI } from "@/data/otimizeFarmaco";
import { cn } from "@/lib/utils";
import { NavEtapas, SeloConclusao, useProgressoJogo } from "../comum";

const fmt = (n: number, c = 2) => n.toLocaleString("pt-BR", { minimumFractionDigits: c, maximumFractionDigits: c });

export default function OtimizeFarmaco() {
  const p = useProgressoJogo("organica-3", "otimize-farmaco", "/organica-3#otimize-farmaco", "Otimize o Fármaco", DESAFIOS_FARMACO.length);
  const [idx, setIdx] = useState(0);
  const z = DESAFIOS_FARMACO[idx];
  const resolvido = p.feitos.includes(z.id);
  const area = useRef<HTMLDivElement>(null);
  const editor = useRef<CanvasEditor | null>(null);
  const [aval, setAval] = useState<AvaliacaoLipinski | null>(null);
  const [erroCarga, setErroCarga] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [tentou, setTentou] = useState(false);
  const temporizador = useRef<number | undefined>(undefined);

  const avaliar = useCallback(() => {
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => {
      const ed = editor.current;
      if (!ed) return;
      void avaliarLipinski(ed.getMolecule(), z.farmacoforo.smiles).then(setAval).catch(() => setAval(null));
    }, 250);
  }, [z]);

  // Editor com o composto-modelo do desafio atual.
  useEffect(() => {
    let cancelado = false;
    setAval(null);
    setTentou(false);
    carregarOCL()
      .then((OCL) => {
        if (cancelado || !area.current) return;
        editor.current?.destroy();
        const ed = new OCL.CanvasEditor(area.current, { initialMode: "molecule" });
        const mol = OCL.Molecule.fromSmiles(z.smilesInicial);
        mol.inventCoordinates();
        ed.setMolecule(mol);
        ed.setOnChangeListener(() => {
          setTentou(false);
          avaliar();
        });
        editor.current = ed;
        setPronto(true);
        avaliar();
      })
      .catch(() => !cancelado && setErroCarga(true));
    return () => {
      cancelado = true;
      editor.current?.destroy();
      editor.current = null;
    };
  }, [z, avaliar]);

  const recomecar = async () => {
    const OCL = await carregarOCL();
    const mol = OCL.Molecule.fromSmiles(z.smilesInicial);
    mol.inventCoordinates();
    editor.current?.setMolecule(mol);
    avaliar();
  };

  const aprovado = aval !== null && aval.violacoes === 0 && aval.temFarmacoforo && aval.fragmentos === 1;
  const verificar = () => {
    setTentou(true);
    if (aprovado) p.marcar(z.id);
  };

  const regras = aval
    ? [
        { rotulo: "Massa molar ≤ 500", valor: `${fmt(aval.massaMolar)} g/mol`, ok: aval.massaMolar <= 500 },
        { rotulo: "logP ≤ 5", valor: fmt(aval.logP), ok: aval.logP <= 5 },
        { rotulo: "Doadores de H ≤ 5", valor: String(aval.doadoresH), ok: aval.doadoresH <= 5 },
        { rotulo: "Aceptores de H ≤ 10", valor: String(aval.aceptoresH), ok: aval.aceptoresH <= 10 },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NavEtapas ids={DESAFIOS_FARMACO.map((x) => x.id)} atual={idx} feitos={p.feitos} onIr={setIdx} />
        <SeloConclusao feitos={p.feitos.length} total={DESAFIOS_FARMACO.length} jaConcluido={p.jaConcluido} bonus={p.bonus} xpConclusao={p.xpConclusao} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="glass space-y-3 p-4">
          <div>
            <h3 className="text-lg font-bold">{z.titulo}</h3>
            <p className="text-sm text-muted">{z.contexto}</p>
          </div>
          <div className="relative h-[52vh] min-h-[320px] overflow-hidden rounded-xl border border-ui-border/30 bg-white">
            <div ref={area} className="absolute inset-0" />
            {!pronto && !erroCarga && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> carregando o editor…
              </div>
            )}
            {erroCarga && <p className="absolute inset-0 flex items-center justify-center text-sm text-chem-danger">Não foi possível carregar o editor.</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={verificar} disabled={!aval || resolvido} className="btn-primary disabled:opacity-50">
              Verificar candidato
            </button>
            <button type="button" onClick={recomecar} className="btn-ghost">
              <RotateCcw className="h-4 w-4" /> Recomeçar
            </button>
          </div>
        </div>

        <aside className="glass space-y-3 p-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-chem-orbital">Mantenha o farmacóforo</p>
            <div className="flex justify-center">
              <Molecule2DStick smiles={z.farmacoforo.smiles} width={220} height={110} explicitHydrogens={false} />
            </div>
            <p className={cn("text-center text-xs", aval?.temFarmacoforo === false ? "text-chem-danger" : "text-muted")}>
              {z.farmacoforo.nome}
              {aval?.temFarmacoforo === false && " · removido!"}
            </p>
          </div>
          <div>
            <p className="mb-1.5 font-semibold">Regra dos 5 de Lipinski</p>
            <ul className="space-y-1.5">
              {regras.map((r) => (
                <li key={r.rotulo} className={cn("flex items-center justify-between rounded-lg px-3 py-1.5", r.ok ? "bg-chem-success/10" : "bg-chem-danger/10")}>
                  <span className="flex items-center gap-1.5">
                    {r.ok ? <CheckCircle2 className="h-4 w-4 text-chem-success" /> : <XCircle className="h-4 w-4 text-chem-danger" />}
                    {r.rotulo}
                  </span>
                  <span className="font-mono text-[12.5px]">{r.valor}</span>
                </li>
              ))}
            </ul>
            {aval && (
              <p className={cn("mt-2 font-semibold", aval.violacoes === 0 ? "text-chem-success" : "text-chem-danger")}>
                {aval.violacoes === 0 ? "Nenhuma violação" : `${aval.violacoes} violação(ões)`}
              </p>
            )}
          </div>
          {tentou && !aprovado && aval && (
            <p className="rounded-lg bg-chem-danger/10 px-3 py-2 text-chem-danger">
              {aval.fragmentos !== 1
                ? "Deixe uma única molécula no desenho (sem pedaços soltos)."
                : !aval.temFarmacoforo
                  ? "O farmacóforo sumiu: sem ele, o composto perde a atividade."
                  : "Ainda há violações da regra."}
            </p>
          )}
          {!resolvido && (
            <p className="flex gap-2 text-muted">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-chem-orbital" /> {z.dica}
            </p>
          )}
          {resolvido && (
            <div className="rounded-lg bg-chem-success/10 p-3">
              <p className="font-semibold text-chem-success">Candidato oral aprovado!</p>
              <p className="mt-1 text-xs text-muted">Uma solução possível: {z.solucao.nome}</p>
              <div className="flex justify-center">
                <Molecule2DStick smiles={z.solucao.smiles} width={220} height={110} explicitHydrogens={false} />
              </div>
            </div>
          )}
          <p className="font-mono text-[10.5px] text-muted">{FONTE_LIPINSKI} Compostos iniciais são modelos de exercício.</p>
        </aside>
      </div>
    </div>
  );
}
