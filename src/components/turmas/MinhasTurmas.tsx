"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ListOrdered, Loader2, LogOut, School, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  REGEX_CODIGO,
  TurmaErro,
  concluidosDoPerfil,
  entrarNaTurma,
  normalizarCodigo,
  sairDaTurma,
  tarefaPorId,
  turmasDisponiveis,
  turmasDoAluno,
  type Turma,
} from "@/lib/turmas";

/** Card do Hub: entrar numa turma pelo código e ver os jogos e listas indicados pelo professor. */
export function MinhasTurmas() {
  const { user, profile, recarregarPerfil } = useAuth();
  const [turmas, setTurmas] = useState<Turma[] | null>(null);
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const codigos = (profile?.turmas ?? []).join(",");

  const carregar = useCallback(async () => {
    if (!codigos) return setTurmas([]);
    setTurmas(await turmasDoAluno(codigos.split(",")).catch(() => []));
  }, [codigos]);

  useEffect(() => {
    if (turmasDisponiveis()) void carregar();
  }, [carregar]);

  // Link de convite do professor: /hub?turma=CODIGO
  useEffect(() => {
    const c = normalizarCodigo(new URLSearchParams(window.location.search).get("turma") ?? "");
    if (REGEX_CODIGO.test(c)) setCodigo(c);
  }, []);

  if (!turmasDisponiveis() || !user || !profile) return null;
  const feitos = new Set(concluidosDoPerfil(profile));

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = normalizarCodigo(codigo);
    if (!REGEX_CODIGO.test(c)) return setErro("O código tem 6 letras e números, como K7QM2P.");
    if (profile.turmas?.includes(c)) return setErro("Você já está nesta turma.");
    setEnviando(true);
    setErro(null);
    try {
      await entrarNaTurma(c, user.uid, profile);
      setCodigo("");
      window.history.replaceState(null, "", window.location.pathname);
      await recarregarPerfil();
    } catch (err) {
      setErro(err instanceof TurmaErro ? err.message : "Não foi possível entrar na turma agora.");
    } finally {
      setEnviando(false);
    }
  };

  const sair = async (t: Turma) => {
    if (!window.confirm(`Sair da turma “${t.nome}”? O professor deixa de ver o seu progresso.`)) return;
    await sairDaTurma(t.codigo, user.uid);
    await recarregarPerfil();
  };

  return (
    <section className="glass mt-6 p-5" aria-labelledby="titulo-turmas">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="titulo-turmas" className="flex items-center gap-2 text-lg font-bold">
          <School className="h-5 w-5 text-chem-orbital" /> Minhas turmas
        </h2>
        <form onSubmit={entrar} className="flex gap-2">
          <input
            className="lab-input w-36 font-mono uppercase tracking-widest"
            placeholder="CÓDIGO"
            maxLength={8}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            aria-label="Código da turma"
          />
          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Entrar
          </button>
        </form>
      </div>
      {erro && <p className="mt-3 rounded-lg bg-chem-danger/10 px-3 py-2 text-sm text-chem-danger" role="alert">{erro}</p>}

      {turmas === null ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Carregando turmas…</p>
      ) : turmas.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Recebeu um código do professor? Digite acima para ver os jogos indicados. Ao entrar, o professor passa a ver o seu
          nome, matrícula, XP e jogos concluídos.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {turmas.map((t) => {
            const feitas = t.tarefas.filter((id) => feitos.has(id)).length;
            return (
              <article key={t.codigo} className="glass-soft p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{t.nome}</p>
                    <p className="text-xs text-muted">
                      Prof. {t.professorNome} · <span className="font-mono">{t.codigo}</span>
                    </p>
                  </div>
                  <button onClick={() => sair(t)} className="btn-ghost !p-1.5 text-muted hover:!text-chem-danger" title="Sair da turma" aria-label={`Sair da turma ${t.nome}`}>
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
                {t.tarefas.length > 0 && (
                  <>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">
                      Jogos indicados · {feitas}/{t.tarefas.length}
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {t.tarefas.map((id) => {
                        const tf = tarefaPorId(id);
                        if (!tf) return null;
                        const ok = feitos.has(id);
                        return (
                          <li key={id}>
                            <Link href={tf.rota} className="flex items-center gap-2 text-sm hover:text-chem-primary">
                              {ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-chem-success" /> : <Circle className="h-4 w-4 shrink-0 text-muted" />}
                              <span className={ok ? "text-muted line-through" : ""}>{tf.titulo}</span>
                              <span className="chip ml-auto bg-ui-border/10 text-[10px]">{tf.disciplina}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
                {t.listas.length > 0 && (
                  <>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">Listas da aula</p>
                    <ul className="mt-1.5 space-y-1">
                      {t.listas.map((l) => (
                        <li key={l.url}>
                          <a href={l.url} className="flex items-center gap-2 text-sm hover:text-chem-primary">
                            <ListOrdered className="h-4 w-4 shrink-0 text-chem-primary" /> {l.titulo}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {t.tarefas.length === 0 && t.listas.length === 0 && <p className="mt-3 text-sm text-muted">O professor ainda não indicou atividades.</p>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
