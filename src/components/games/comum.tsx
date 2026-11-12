"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, Trophy } from "lucide-react";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

/** Progresso de um jogo: etapas resolvidas nesta sessão, XP por acerto e bônus de conclusão (uma vez). */
export function useProgressoJogo(disciplina: string, jogo: string, rota: string, titulo: string, total: number, xpAcerto = 10, xpConclusao = 100) {
  const { addXp, concluirJogo, profile } = useAuth();
  const [feitos, setFeitos] = useState<string[]>([]);
  const [bonus, setBonus] = useState(false);
  const jaConcluido = profile?.progresso.modulos?.[disciplina]?.concluidos.includes(jogo) ?? false;

  useEffect(() => {
    if (feitos.length === total && !jaConcluido) void concluirJogo(disciplina, jogo, xpConclusao).then((p) => p && setBonus(true));
  }, [feitos, total, jaConcluido, concluirJogo, disciplina, jogo, xpConclusao]);

  const marcar = (id: string) => {
    if (feitos.includes(id)) return;
    setFeitos((f) => [...f, id]);
    void addXp(xpAcerto, { rota, titulo });
  };
  return { feitos, marcar, jaConcluido, bonus, xpConclusao };
}

export function SeloConclusao({ feitos, total, jaConcluido, bonus, xpConclusao }: { feitos: number; total: number; jaConcluido: boolean; bonus: boolean; xpConclusao: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-muted">
        {feitos}/{total}
      </span>
      {(jaConcluido || bonus) && (
        <span className="chip bg-chem-success/15 text-chem-success">
          <Trophy className="h-3.5 w-3.5" /> Jogo concluído{bonus ? ` · +${xpConclusao} XP` : ""}
        </span>
      )}
    </div>
  );
}

/** Botões numerados de navegação entre etapas. */
export function NavEtapas({ ids, atual, feitos, onIr }: { ids: string[]; atual: number; feitos: string[]; onIr: (i: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {ids.map((id, i) => (
        <button
          key={id}
          type="button"
          onClick={() => onIr(i)}
          aria-label={`Etapa ${i + 1}`}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs",
            i === atual ? "bg-chem-primary text-lab-background" : feitos.includes(id) ? "bg-chem-success/15 text-chem-success" : "bg-slate-200/70 text-muted dark:bg-white/5",
          )}
        >
          {feitos.includes(id) && i !== atual ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
        </button>
      ))}
    </div>
  );
}

export interface CartaOrdenavel {
  chave: string;
  nome: string;
  smiles: string;
  /** Texto revelado depois do acerto (ex.: "pKa 4,8"). */
  revelado: string;
}

/** Embaralhamento estável (mesma ordem a cada visita), para a ordem da tela não entregar a resposta. */
function embaralhar<T>(itens: T[], semente: string): T[] {
  let h = 0;
  for (const c of semente) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = [...itens];
  for (let i = a.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Toque nas cartas na ordem pedida; ao completar, confere. Errou: as posições erradas ficam
 * vermelhas e dá para tentar de novo. Acertou: revela os valores e chama onAcerto.
 */
export function OrdenarCartas({
  id,
  cartas,
  ordemCorreta,
  instrucao,
  resolvido,
  onAcerto,
}: {
  id: string;
  cartas: CartaOrdenavel[];
  /** Chaves na ordem correta. */
  ordemCorreta: string[];
  instrucao: string;
  resolvido: boolean;
  onAcerto: () => void;
}) {
  const embaralhadas = useMemo(() => embaralhar(cartas, id), [cartas, id]);
  const [escolha, setEscolha] = useState<string[]>([]);
  const [conferido, setConferido] = useState(false);

  useEffect(() => {
    setEscolha(resolvido ? ordemCorreta : []);
    setConferido(resolvido);
  }, [id, resolvido, ordemCorreta]);

  const tocar = (k: string) => {
    if (conferido) return;
    setEscolha((e) => (e.includes(k) ? (e[e.length - 1] === k ? e.slice(0, -1) : e) : [...e, k]));
  };
  const acertou = conferido && escolha.every((k, i) => k === ordemCorreta[i]);
  const conferir = () => {
    setConferido(true);
    if (escolha.every((k, i) => k === ordemCorreta[i])) onAcerto();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{instrucao}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {embaralhadas.map((c) => {
          const pos = escolha.indexOf(c.chave);
          const certo = conferido && pos >= 0 && ordemCorreta[pos] === c.chave;
          return (
            <button
              key={c.chave}
              type="button"
              onClick={() => tocar(c.chave)}
              className={cn(
                "glass-soft relative flex flex-col items-center gap-1 p-3 text-center transition",
                pos >= 0 && !conferido && "ring-2 ring-chem-primary",
                conferido && (certo ? "ring-2 ring-chem-success" : "ring-2 ring-chem-danger"),
              )}
            >
              {pos >= 0 && (
                <span
                  className={cn(
                    "absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full font-mono text-sm font-bold text-lab-background",
                    conferido ? (certo ? "bg-chem-success" : "bg-chem-danger") : "bg-chem-primary",
                  )}
                >
                  {pos + 1}
                </span>
              )}
              <Molecule2DStick smiles={c.smiles} width={200} height={120} explicitHydrogens={false} />
              <span className="text-sm font-semibold">{c.nome}</span>
              {acertou && <span className="font-mono text-sm text-chem-success">{c.revelado}</span>}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        {!conferido && (
          <button type="button" onClick={conferir} disabled={escolha.length !== cartas.length} className="btn-primary disabled:opacity-50">
            Conferir a ordem
          </button>
        )}
        {conferido && !acertou && (
          <button
            type="button"
            onClick={() => {
              setEscolha([]);
              setConferido(false);
            }}
            className="btn-ghost"
          >
            <RotateCcw className="h-4 w-4" /> Tentar de novo
          </button>
        )}
        {!conferido && escolha.length > 0 && (
          <button type="button" onClick={() => setEscolha([])} className="text-xs text-muted hover:text-chem-danger">
            limpar
          </button>
        )}
      </div>
    </div>
  );
}
