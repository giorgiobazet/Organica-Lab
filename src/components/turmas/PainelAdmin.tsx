"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Ban, Check, Loader2, RefreshCw, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  ROTULO_STATUS,
  aprovarProfessor,
  listarPedidos,
  recusarProfessor,
  revogarProfessor,
  turmasDisponiveis,
  type PedidoValidacao,
} from "@/lib/turmas";
import { cn } from "@/lib/utils";

const ORDEM: PedidoValidacao["status"][] = ["pendente", "aprovado", "recusado", "revogado"];

/** Painel do administrador: aprova, recusa ou revoga a validação de professores. */
export function PainelAdmin() {
  const { papel } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoValidacao[] | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setPedidos(await listarPedidos());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar.");
    }
  }, []);

  useEffect(() => {
    if (papel.admin) void carregar();
  }, [papel.admin, carregar]);

  if (!turmasDisponiveis() || (papel.carregado && !papel.admin)) {
    return (
      <section className="glass mx-auto max-w-xl p-6 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-chem-danger" />
        <h1 className="mt-2 text-xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-muted">Esta área é só do administrador do site.</p>
      </section>
    );
  }
  if (!papel.carregado || pedidos === null) {
    return (
      <p className="flex items-center justify-center gap-2 py-16 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" /> Carregando pedidos…
      </p>
    );
  }

  const agir = async (uid: string, fn: () => Promise<void>) => {
    setOcupado(uid);
    setErro(null);
    try {
      await fn();
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha na operação.");
    } finally {
      setOcupado(null);
    }
  };

  const pedirMotivo = (acao: string) => window.prompt(`Motivo (${acao}), visível para o professor:`, "");

  return (
    <div className="space-y-6">
      <section className="glass p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            <ShieldCheck className="h-6 w-6 text-chem-primary" /> Validação de professores
          </h1>
          <button onClick={() => void carregar()} className="btn-ghost ml-auto text-xs"><RefreshCw className="h-3.5 w-3.5" /> Atualizar</button>
        </div>
        <p className="mt-2 text-sm text-muted">
          Antes de aprovar, confira com a instituição se o nome e a matrícula funcional pertencem a um servidor e se o e-mail
          é dele. Professores aprovados podem criar turmas e ver o progresso dos alunos que entrarem nelas.
        </p>
        {erro && <p className="mt-3 rounded-lg bg-chem-danger/10 px-3 py-2 text-sm text-chem-danger" role="alert">{erro}</p>}
      </section>

      {ORDEM.map((st) => {
        const lista = pedidos.filter((p) => p.status === st);
        if (st !== "pendente" && lista.length === 0) return null;
        return (
          <section key={st} className="glass p-5">
            <h2 className="text-lg font-bold first-letter:uppercase">
              {ROTULO_STATUS[st]} <span className="font-mono text-sm text-muted">({lista.length})</span>
            </h2>
            {lista.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Nenhum pedido aguardando.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {lista.map((p) => (
                  <li key={p.uid} className="flex flex-col gap-3 rounded-xl bg-ui-border/10 p-4 md:flex-row md:items-center">
                    <div className="flex-1">
                      <p className="font-semibold">{p.nome}</p>
                      <p className="font-mono text-xs text-muted">
                        {p.email} · matrícula {p.matricula}
                        {p.criadoEm && ` · pedido em ${p.criadoEm.toDate().toLocaleDateString("pt-BR")}`}
                      </p>
                      {p.motivo && <p className="mt-1 text-xs text-chem-danger">Motivo: {p.motivo}</p>}
                    </div>
                    <div className={cn("flex gap-2", ocupado === p.uid && "pointer-events-none opacity-50")}>
                      {st === "pendente" && (
                        <>
                          <button className="btn-primary text-sm" onClick={() => agir(p.uid, () => aprovarProfessor(p))}>
                            <Check className="h-4 w-4" /> Aprovar
                          </button>
                          <button
                            className="btn-ghost text-sm hover:!border-chem-danger hover:!text-chem-danger"
                            onClick={() => {
                              const m = pedirMotivo("recusa");
                              if (m !== null) void agir(p.uid, () => recusarProfessor(p.uid, m));
                            }}
                          >
                            <X className="h-4 w-4" /> Recusar
                          </button>
                        </>
                      )}
                      {st === "aprovado" && (
                        <button
                          className="btn-ghost text-sm hover:!border-chem-danger hover:!text-chem-danger"
                          onClick={() => {
                            const m = pedirMotivo("revogação");
                            if (m !== null) void agir(p.uid, () => revogarProfessor(p.uid, m));
                          }}
                        >
                          <Ban className="h-4 w-4" /> Revogar
                        </button>
                      )}
                      {st === "aprovado" && <BadgeCheck className="h-5 w-5 self-center text-chem-success" />}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
