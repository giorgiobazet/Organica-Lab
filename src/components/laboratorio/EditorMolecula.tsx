"use client";

import { useEffect, useRef, useState } from "react";
import type { CanvasEditor } from "openchemlib";
import { Box, Loader2, PenLine, Trash2, X } from "lucide-react";
import { carregarOCL, gerarMolecula, type MoleculaGerada } from "./ocl";

/**
 * Janela de desenho (editor da OpenChemLib). "Ver em 3D" gera a geometria no navegador e devolve
 * SMILES, molfile 3D e propriedades calculadas para o laboratório.
 */
export function EditorMolecula({
  smilesInicial,
  onGerado,
  onFechar,
}: {
  smilesInicial?: string;
  onGerado: (m: MoleculaGerada) => void;
  onFechar: () => void;
}) {
  const area = useRef<HTMLDivElement>(null);
  const editor = useRef<CanvasEditor | null>(null);
  const [pronto, setPronto] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    carregarOCL()
      .then((OCL) => {
        if (cancelado || !area.current) return;
        const ed = new OCL.CanvasEditor(area.current, { initialMode: "molecule" });
        if (smilesInicial) {
          try {
            const mol = OCL.Molecule.fromSmiles(smilesInicial);
            mol.inventCoordinates();
            ed.setMolecule(mol);
          } catch {
            /* SMILES que a biblioteca não lê: começa com o editor vazio */
          }
        }
        ed.setOnChangeListener(() => setErro(null));
        editor.current = ed;
        setPronto(true);
      })
      .catch(() => !cancelado && setErro("Não foi possível carregar o editor. Verifique a conexão e tente de novo."));
    return () => {
      cancelado = true;
      editor.current?.destroy();
      editor.current = null;
    };
  }, [smilesInicial]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  const gerar = async () => {
    if (!editor.current) return;
    setGerando(true);
    setErro(null);
    try {
      onGerado(await gerarMolecula(editor.current.getMolecule()));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível gerar o 3D.");
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Desenhar molécula">
      <div className="glass-strong flex max-h-full w-full max-w-4xl flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <PenLine className="h-5 w-5 text-chem-primary" /> Desenhar molécula
            </h2>
            <p className="text-sm text-muted">
              Use a barra do editor para ligações (simples, dupla, tripla e cunhas), anéis, cadeias, elementos e cargas.
              Os hidrogênios entram sozinhos no 3D.
            </p>
          </div>
          <button type="button" onClick={onFechar} className="btn-ghost !p-2" aria-label="Fechar o editor">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* O editor desenha em fundo claro (convenção das fórmulas em papel), nos dois temas. */}
        <div className="relative h-[58vh] min-h-[320px] overflow-hidden rounded-xl border border-ui-border/30 bg-white">
          <div ref={area} className="absolute inset-0" />
          {!pronto && !erro && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> carregando o editor…
            </div>
          )}
        </div>

        {erro && (
          <p className="rounded-lg bg-chem-danger/10 px-3 py-2 text-sm text-chem-danger" role="alert">
            {erro}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={() => editor.current?.clearAll()} disabled={!pronto} className="btn-ghost text-sm disabled:opacity-50">
            <Trash2 className="h-4 w-4" /> Limpar
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onFechar} className="btn-ghost text-sm">
              Cancelar
            </button>
            <button type="button" onClick={gerar} disabled={!pronto || gerando} className="btn-primary text-sm disabled:opacity-50">
              {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Box className="h-4 w-4" />} Ver em 3D
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
