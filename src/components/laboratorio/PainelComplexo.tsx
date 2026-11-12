"use client";

import { FlaskRound } from "lucide-react";
import type { Complexo } from "@/data/complexos";
import { cn } from "@/lib/utils";

const AROMATICOS = /^(Phe|Tyr|Trp|His)/;

/** Ficha do complexo: alvo, estrutura, interações calculadas e fonte. */
export function PainelComplexo({ c, onAbrirFarmaco }: { c: Complexo; onAbrirFarmaco: () => void }) {
  const aromaticos = c.sitio.filter((s) => AROMATICOS.test(s.residuo));
  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-chem-primary">Fármaco no alvo</p>
        <h2 className="text-lg font-bold">
          {c.farmaco} <span className="font-normal text-muted">·</span> {c.alvo}
        </h2>
        <p className="mt-1 text-muted">{c.nota}</p>
      </div>

      <table className="w-full">
        <tbody>
          {[
            ["Estrutura", `PDB ${c.id} · cristalografia de raios X`],
            ["Organismo da proteína", c.organismo ?? "—"],
            ["Resolução", c.resolucao ? `${c.resolucao.toLocaleString("pt-BR")} Å` : "—"],
            ["Código do ligante", c.ligante.codigo],
          ].map(([k, v]) => (
            <tr key={k} className="border-b border-ui-border/10 align-top">
              <td className="py-1.5 pr-3 text-muted">{k}</td>
              <td className={cn("py-1.5 text-right", k === "Organismo da proteína" ? "italic" : "font-mono text-[12.5px]")}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <h3 className="mb-1.5 font-semibold">Ligações de hidrogênio prováveis</h3>
        {c.ligacoesH.length ? (
          <ul className="space-y-1">
            {c.ligacoesH.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-amber-400/10 px-3 py-1.5">
                <span className="font-mono text-[12.5px]">
                  {h.residuo} <span className="text-muted">{h.atomoProteina}</span> ··· <span className="text-muted">{h.atomoLigante}</span>
                </span>
                <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">{h.distancia.toLocaleString("pt-BR")} Å</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-ui-border/30 px-3 py-2 text-muted">
            Nenhuma ligação de H direta com a proteína: a ligação ao sítio é dominada por contatos hidrofóbicos e
            aromáticos.
          </p>
        )}
      </div>

      {aromaticos.length > 0 && (
        <div>
          <h3 className="mb-1.5 font-semibold">Resíduos aromáticos no sítio</h3>
          <p className="mb-1.5 text-xs text-muted">Candidatos a empilhamento π e interações cátion–π com o fármaco.</p>
          <div className="flex flex-wrap gap-1.5">
            {aromaticos.map((s) => (
              <span key={`${s.cadeia}${s.residuo}`} className="chip bg-chem-orbital/15 font-mono text-chem-orbital">
                {s.residuo}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-1.5 font-semibold">Resíduos do sítio ({c.sitio.length})</h3>
        <div className="flex flex-wrap gap-1.5">
          {c.sitio.map((s) => (
            <span key={`${s.cadeia}${s.residuo}`} className="chip bg-ui-border/10 font-mono">
              {s.residuo}
              {c.cadeias.length > 1 && <span className="text-muted">/{s.cadeia}</span>}
            </span>
          ))}
        </div>
      </div>

      <button type="button" onClick={onAbrirFarmaco} className="btn-ghost w-full">
        <FlaskRound className="h-4 w-4" /> Abrir só o fármaco no laboratório
      </button>

      <p className="font-mono text-[10.5px] leading-relaxed text-muted">
        Estrutura: RCSB PDB {c.id} ({c.referencia}) Sítio: resíduos a até 4,5 Å do fármaco. Ligações de H: pares N/O a
        até 3,5 Å, critério só de distância, calculado das coordenadas cristalográficas.
      </p>
    </div>
  );
}
