"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Lightbulb, RotateCcw, XCircle } from "lucide-react";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { FONTE_NOMENCLATURA, NOMES } from "@/data/nomenclatura";
import { cn } from "@/lib/utils";
import { NavEtapas, SeloConclusao, useProgressoJogo } from "../comum";

function misturar(pecas: string[], semente: string): string[] {
  let h = 0;
  for (const c of semente) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  const a = [...pecas];
  for (let i = a.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ConstrutorNomes() {
  const p = useProgressoJogo("organica-1", "construtor-nomes", "/organica-1#construtor-nomes", "Construtor de Nomenclatura IUPAC", NOMES.length);
  const [idx, setIdx] = useState(0);
  const item = NOMES[idx];
  const resolvido = p.feitos.includes(item.id);
  const banco = useMemo(() => misturar([...item.pecas, ...item.armadilhas].map((t, i) => `${i}|${t}`), item.id), [item]);
  const [usadas, setUsadas] = useState<string[]>([]);
  const [conferido, setConferido] = useState(false);

  useEffect(() => {
    setUsadas(resolvido ? item.pecas.map((t) => `${[...item.pecas, ...item.armadilhas].indexOf(t)}|${t}`) : []);
    setConferido(false);
  }, [item, resolvido]);

  const texto = (u: string) => u.slice(u.indexOf("|") + 1);
  const nome = usadas.map(texto).join("");
  const correto = item.pecas.join("");
  const conferir = () => {
    setConferido(true);
    if (nome === correto) p.marcar(item.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NavEtapas ids={NOMES.map((x) => x.id)} atual={idx} feitos={p.feitos} onIr={setIdx} />
        <SeloConclusao feitos={p.feitos.length} total={NOMES.length} jaConcluido={p.jaConcluido} bonus={p.bonus} xpConclusao={p.xpConclusao} />
      </div>
      <div className="glass space-y-4 p-4">
        <div className="flex justify-center">
          <Molecule2DStick smiles={item.smiles} width={280} height={160} explicitHydrogens={false} />
        </div>
        <div
          className={cn(
            "flex min-h-14 flex-wrap items-center justify-center gap-1 rounded-xl border-2 border-dashed px-3 py-2 font-mono text-xl",
            resolvido ? "border-chem-success text-chem-success" : conferido ? "border-chem-danger" : "border-ui-border/40",
          )}
          aria-live="polite"
        >
          {usadas.length ? (
            usadas.map((u) => (
              <button key={u} type="button" disabled={resolvido} onClick={() => { setUsadas((x) => x.filter((y) => y !== u)); setConferido(false); }} className="rounded-md bg-chem-primary/15 px-1.5 py-0.5 hover:bg-chem-danger/15">
                {texto(u)}
              </button>
            ))
          ) : (
            <span className="font-sans text-sm text-muted">Toque nas peças abaixo, na ordem, para montar o nome</span>
          )}
        </div>
        {!resolvido && (
          <div className="flex flex-wrap justify-center gap-2">
            {banco
              .filter((u) => !usadas.includes(u))
              .map((u) => (
                <button key={u} type="button" onClick={() => { setUsadas((x) => [...x, u]); setConferido(false); }} className="btn-ghost !px-3 !py-1.5 font-mono">
                  {texto(u)}
                </button>
              ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {!resolvido && (
            <button type="button" onClick={conferir} disabled={!usadas.length} className="btn-primary disabled:opacity-50">
              Conferir o nome
            </button>
          )}
          {!resolvido && usadas.length > 0 && (
            <button type="button" onClick={() => { setUsadas([]); setConferido(false); }} className="btn-ghost">
              <RotateCcw className="h-4 w-4" /> Limpar
            </button>
          )}
        </div>
        {conferido && !resolvido && (
          <p className="flex items-center justify-center gap-2 text-sm text-chem-danger">
            <XCircle className="h-4 w-4" /> Ainda não. Confira a cadeia principal, a numeração e a ordem das peças.
          </p>
        )}
        {resolvido && (
          <div className="space-y-2">
            <p className="flex items-center justify-center gap-2 font-semibold text-chem-success">
              <CheckCircle2 className="h-5 w-5" /> {correto}
            </p>
            <p className="flex gap-2 rounded-lg bg-chem-success/10 px-3 py-2 text-sm">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-chem-success" />
              {item.regra}
            </p>
          </div>
        )}
      </div>
      <p className="font-mono text-[10.5px] text-muted">Fonte: {FONTE_NOMENCLATURA}</p>
    </div>
  );
}
