"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  Circle,
  ClipboardCopy,
  Clock,
  Download,
  ListOrdered,
  Loader2,
  Plus,
  RefreshCw,
  School,
  ShieldAlert,
  Trash2,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SITE } from "@/config/site";
import {
  CATALOGO_TAREFAS,
  LIMITES,
  ROTULO_STATUS,
  atualizarTurma,
  cancelarPedido,
  criarTurma,
  excluirTurma,
  membrosDaTurma,
  pedirValidacao,
  removerMembro,
  statusProfessor,
  turmasDisponiveis,
  turmasDoProfessor,
  type ListaTurma,
  type Membro,
  type PedidoValidacao,
  type Turma,
} from "@/lib/turmas";
import { cn } from "@/lib/utils";

const msgErro = (e: unknown) => (e instanceof Error && e.message ? e.message : "Algo deu errado. Tente de novo.");

export function PainelProfessor() {
  const { user, profile, papel, recarregarPapel } = useAuth();

  if (!turmasDisponiveis()) {
    return <Aviso titulo="Indisponível no Modo Dev">Turmas e validação de professores exigem o Firebase configurado.</Aviso>;
  }
  if (!user || !profile) return null;
  if (profile.perfil !== "servidor") {
    return (
      <Aviso titulo="Área de professores">
        Esta conta é de aluno. Para entrar numa turma, use o código do professor no{" "}
        <Link href="/hub" className="font-semibold text-chem-primary hover:underline">Hub</Link>.
      </Aviso>
    );
  }
  if (!papel.carregado) return <Carregando />;
  if (papel.professor !== "aprovado") return <Validacao onMudou={recarregarPapel} />;
  return <Turmas uid={user.uid} nomeProfessor={profile.nome} />;
}

function Carregando() {
  return (
    <p className="flex items-center justify-center gap-2 py-16 text-muted">
      <Loader2 className="h-5 w-5 animate-spin" /> Carregando…
    </p>
  );
}

function Aviso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="glass mx-auto max-w-2xl p-6 text-center">
      <ShieldAlert className="mx-auto h-8 w-8 text-chem-orbital" />
      <h1 className="mt-2 text-xl font-bold">{titulo}</h1>
      <p className="mt-2 text-muted">{children}</p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pedido de validação
// ---------------------------------------------------------------------------

function Validacao({ onMudou }: { onMudou: () => Promise<void> }) {
  const { user, profile } = useAuth();
  const [pedido, setPedido] = useState<PedidoValidacao | null | undefined>(undefined);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!user) return;
    const r = await statusProfessor(user.uid).catch(() => null);
    setPedido(r?.pedido ?? null);
  }, [user]);

  useEffect(() => void carregar(), [carregar]);
  if (!user || !profile || pedido === undefined) return <Carregando />;

  const agir = async (fn: () => Promise<void>) => {
    setEnviando(true);
    setErro(null);
    try {
      await fn();
      await carregar();
      await onMudou();
    } catch (e) {
      setErro(msgErro(e));
    } finally {
      setEnviando(false);
    }
  };

  const status = pedido?.status ?? "nenhum";
  return (
    <section className="glass mx-auto max-w-2xl p-6">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold">
        <BadgeCheck className="h-6 w-6 text-chem-orbital" /> Validação de professor
      </h1>
      <p className="mt-2 text-muted">
        Qualquer pessoa pode se cadastrar com matrícula de servidor; por isso, criar turmas e acompanhar alunos só é
        liberado depois que o administrador do {SITE.nome} confere os seus dados com a instituição.
      </p>

      <dl className="mt-4 grid gap-x-6 gap-y-1 rounded-xl bg-ui-border/10 p-4 text-sm sm:grid-cols-[150px_1fr]">
        <dt className="text-muted">Nome</dt><dd>{profile.nome}</dd>
        <dt className="text-muted">E-mail</dt><dd className="font-mono">{profile.email}</dd>
        <dt className="text-muted">Matrícula funcional</dt><dd className="font-mono">{profile.matricula}</dd>
        <dt className="text-muted">Situação</dt>
        <dd className={cn("font-semibold", status === "pendente" ? "text-chem-orbital" : status === "nenhum" ? "" : "text-chem-danger")}>
          {ROTULO_STATUS[status]}
        </dd>
      </dl>

      {pedido?.motivo && (status === "recusado" || status === "revogado") && (
        <p className="mt-3 rounded-lg bg-chem-danger/10 px-3 py-2 text-sm text-chem-danger">Motivo: {pedido.motivo}</p>
      )}
      {status === "pendente" && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Clock className="h-4 w-4" /> Pedido enviado. Assim que for aprovado, esta página mostra as suas turmas.
        </p>
      )}
      {erro && <p className="mt-3 rounded-lg bg-chem-danger/10 px-3 py-2 text-sm text-chem-danger" role="alert">{erro}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        {status === "pendente" ? (
          <>
            <button className="btn-primary btn-servidor" disabled={enviando} onClick={() => agir(async () => undefined)}>
              <RefreshCw className="h-4 w-4" /> Atualizar situação
            </button>
            <button className="btn-ghost" disabled={enviando} onClick={() => agir(() => cancelarPedido(user.uid))}>
              <X className="h-4 w-4" /> Cancelar pedido
            </button>
          </>
        ) : (
          <button className="btn-primary btn-servidor" disabled={enviando} onClick={() => agir(() => pedirValidacao(user.uid, profile))}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
            {status === "nenhum" ? "Pedir validação" : "Pedir de novo"}
          </button>
        )}
      </div>
      <p className="mt-4 text-xs text-muted">
        Dados errados? Corrija escrevendo para {SITE.contato} antes de pedir a validação.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Turmas
// ---------------------------------------------------------------------------

function Turmas({ uid, nomeProfessor }: { uid: string; nomeProfessor: string }) {
  const [turmas, setTurmas] = useState<Turma[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const ts = await turmasDoProfessor(uid);
    setTurmas(ts);
    setSel((s) => (s && ts.some((t) => t.codigo === s) ? s : (ts[0]?.codigo ?? null)));
  }, [uid]);

  useEffect(() => {
    carregar().catch((e) => setErro(msgErro(e)));
  }, [carregar]);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return setErro("Dê um nome à turma (ex.: Orgânica 1 · 2026/2 · Noite).");
    setEnviando(true);
    setErro(null);
    try {
      const codigo = await criarTurma(uid, nomeProfessor, nome);
      setNome("");
      await carregar();
      setSel(codigo);
    } catch (err) {
      setErro(msgErro(err));
    } finally {
      setEnviando(false);
    }
  };

  const turma = turmas?.find((t) => t.codigo === sel) ?? null;

  return (
    <div className="space-y-6">
      <section className="glass p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            <School className="h-6 w-6 text-chem-orbital" /> Minhas turmas
            <span className="chip bg-chem-success/15 text-chem-success"><BadgeCheck className="h-3.5 w-3.5" /> verificado(a)</span>
          </h1>
          <form onSubmit={criar} className="flex gap-2">
            <input className="lab-input w-full md:w-72" placeholder="Nome da nova turma" maxLength={LIMITES.nomeTurma} value={nome} onChange={(e) => setNome(e.target.value)} />
            <button type="submit" className="btn-primary btn-servidor shrink-0" disabled={enviando}>
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Criar
            </button>
          </form>
        </div>
        {erro && <p className="mt-3 rounded-lg bg-chem-danger/10 px-3 py-2 text-sm text-chem-danger" role="alert">{erro}</p>}
        {turmas === null ? (
          <Carregando />
        ) : turmas.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Crie a primeira turma: ela recebe um código de 6 caracteres que os alunos digitam no Hub. Depois indique os
            jogos e as Listas da Aula e acompanhe o progresso de cada aluno.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2" role="tablist">
            {turmas.map((t) => (
              <button
                key={t.codigo}
                role="tab"
                aria-selected={t.codigo === sel}
                onClick={() => setSel(t.codigo)}
                className={cn("btn-ghost text-sm", t.codigo === sel && "!border-chem-orbital !text-chem-orbital")}
              >
                {t.nome} <span className="font-mono text-xs opacity-70">{t.codigo}</span>
              </button>
            ))}
          </div>
        )}
      </section>
      {turma && <DetalheTurma key={turma.codigo} turma={turma} onMudou={carregar} />}
    </div>
  );
}

function DetalheTurma({ turma, onMudou }: { turma: Turma; onMudou: () => Promise<void> }) {
  const [membros, setMembros] = useState<Membro[] | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregarMembros = useCallback(async () => {
    setMembros(await membrosDaTurma(turma.codigo).catch(() => []));
  }, [turma.codigo]);
  useEffect(() => void carregarMembros(), [carregarMembros]);

  const convite = typeof window === "undefined" ? "" : `${window.location.origin}/hub?turma=${turma.codigo}`;
  const copiar = async () => {
    await navigator.clipboard.writeText(convite).catch(() => undefined);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const salvar = async (patch: Partial<Pick<Turma, "nome" | "tarefas" | "listas">>) => {
    setSalvando(true);
    setErro(null);
    try {
      await atualizarTurma(turma.codigo, patch);
      await onMudou();
    } catch (e) {
      setErro(msgErro(e));
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!window.confirm(`Excluir a turma “${turma.nome}”? Os alunos saem dela e o progresso registrado na turma é apagado (o XP deles continua).`)) return;
    await excluirTurma(turma.codigo);
    await onMudou();
  };

  return (
    <>
      <section className="glass grid gap-5 p-5 lg:grid-cols-[auto_1fr]">
        <div className="rounded-2xl bg-chem-orbital/10 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-chem-orbital">Código da turma</p>
          <p className="mt-1 font-mono text-4xl font-bold tracking-[0.25em]">{turma.codigo}</p>
          <button onClick={copiar} className="btn-ghost mt-3 text-xs">
            <ClipboardCopy className="h-3.5 w-3.5" /> {copiado ? "Link copiado!" : "Copiar link de convite"}
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <label className="text-sm">
            Nome da turma
            <input
              className="lab-input mt-1"
              defaultValue={turma.nome}
              maxLength={LIMITES.nomeTurma}
              onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== turma.nome && salvar({ nome: e.target.value.trim() })}
            />
          </label>
          <p className="text-sm text-muted">
            Os alunos entram pelo Hub (campo “Minhas turmas”) ou pelo link de convite. Você vê nome, matrícula, XP e jogos
            concluídos de quem entrar; o aluno pode sair quando quiser.
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-3">
            {salvando && <span className="flex items-center gap-1 text-xs text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> salvando…</span>}
            <button onClick={excluir} className="btn-ghost ml-auto text-xs hover:!border-chem-danger hover:!text-chem-danger">
              <Trash2 className="h-3.5 w-3.5" /> Excluir turma
            </button>
          </div>
          {erro && <p className="rounded-lg bg-chem-danger/10 px-3 py-2 text-sm text-chem-danger" role="alert">{erro}</p>}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <EscolhaTarefas tarefas={turma.tarefas} onSalvar={(tarefas) => salvar({ tarefas })} />
        <EditorListas listas={turma.listas} onSalvar={(listas) => salvar({ listas })} />
      </div>

      <Progresso turma={turma} membros={membros} onAtualizar={carregarMembros} />
    </>
  );
}

function EscolhaTarefas({ tarefas: salvas, onSalvar }: { tarefas: string[]; onSalvar: (t: string[]) => void }) {
  // Estado local: a caixa marca na hora, e o salvamento segue em segundo plano.
  const [tarefas, setTarefas] = useState(salvas);
  const marcadas = new Set(tarefas);
  const grupos = useMemo(() => {
    const g = new Map<string, typeof CATALOGO_TAREFAS>();
    for (const t of CATALOGO_TAREFAS) g.set(t.disciplina, [...(g.get(t.disciplina) ?? []), t]);
    return [...g.entries()];
  }, []);
  const alternar = (id: string) => {
    const novas = marcadas.has(id) ? tarefas.filter((t) => t !== id) : [...tarefas, id].slice(0, LIMITES.tarefas);
    setTarefas(novas);
    onSalvar(novas);
  };

  return (
    <section className="glass p-5">
      <h2 className="text-lg font-bold">Jogos indicados <span className="font-mono text-sm text-muted">({tarefas.length})</span></h2>
      <p className="mt-1 text-sm text-muted">Marque os jogos que a turma deve fazer. Eles aparecem no Hub de cada aluno, com o que já foi concluído.</p>
      <div className="mt-3 max-h-96 space-y-3 overflow-y-auto pr-1">
        {grupos.map(([disc, lista]) => (
          <fieldset key={disc}>
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted">{disc}</legend>
            {lista.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-ui-border/10">
                <input type="checkbox" checked={marcadas.has(t.id)} onChange={() => alternar(t.id)} className="accent-chem-orbital" />
                {t.titulo}
              </label>
            ))}
          </fieldset>
        ))}
      </div>
    </section>
  );
}

/** Aceita o link completo da Lista da Aula e guarda só o caminho interno (/laboratorio?…). */
function caminhoLaboratorio(url: string): string | null {
  try {
    const u = new URL(url.trim(), window.location.origin);
    const hosts = [window.location.host, "organicalab.web.app", "organicalab.firebaseapp.com"];
    if (!hosts.includes(u.host) || u.pathname.replace(/\/$/, "") !== "/laboratorio" || !u.search) return null;
    return `/laboratorio${u.search}`;
  } catch {
    return null;
  }
}

function EditorListas({ listas: salvas, onSalvar: salvar }: { listas: ListaTurma[]; onSalvar: (l: ListaTurma[]) => void }) {
  const [listas, setListas] = useState(salvas);
  const onSalvar = (l: ListaTurma[]) => {
    setListas(l);
    salvar(l);
  };
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const adicionar = (e: React.FormEvent) => {
    e.preventDefault();
    const caminho = caminhoLaboratorio(url);
    if (!caminho) return setErro("Cole o link gerado em Laboratório → Lista da Aula → Link da lista.");
    if (caminho.length > 1800) return setErro("Link longo demais; divida a lista em duas.");
    if (listas.length >= LIMITES.listas) return setErro(`Máximo de ${LIMITES.listas} listas por turma.`);
    setErro(null);
    onSalvar([...listas, { titulo: titulo.trim().slice(0, 80) || `Aula ${listas.length + 1}`, url: caminho }]);
    setTitulo("");
    setUrl("");
  };

  return (
    <section className="glass p-5">
      <h2 className="text-lg font-bold">Listas da aula <span className="font-mono text-sm text-muted">({listas.length})</span></h2>
      <p className="mt-1 text-sm text-muted">
        Monte a lista no <Link href="/laboratorio" className="font-semibold text-chem-primary hover:underline">Laboratório Molecular</Link>, copie o link e cole aqui.
      </p>
      <form onSubmit={adicionar} className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
        <input className="lab-input" placeholder="Título (ex.: Aula 3 · Quiralidade)" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={80} />
        <input className="lab-input font-mono text-xs" placeholder="https://…/laboratorio?lista=…" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button type="submit" className="btn-primary btn-servidor"><Plus className="h-4 w-4" /> Adicionar</button>
      </form>
      {erro && <p className="mt-2 rounded-lg bg-chem-danger/10 px-3 py-2 text-sm text-chem-danger" role="alert">{erro}</p>}
      <ul className="mt-3 space-y-1.5">
        {listas.map((l, i) => (
          <li key={`${l.url}-${i}`} className="flex items-center gap-2 rounded-lg bg-ui-border/10 px-3 py-2 text-sm">
            <ListOrdered className="h-4 w-4 shrink-0 text-chem-primary" />
            <a href={l.url} target="_blank" rel="noopener" className="flex-1 truncate hover:text-chem-primary">{l.titulo}</a>
            <button onClick={() => onSalvar(listas.filter((_, j) => j !== i))} className="text-muted hover:text-chem-danger" aria-label={`Remover ${l.titulo}`}>
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Progresso({ turma, membros, onAtualizar }: { turma: Turma; membros: Membro[] | null; onAtualizar: () => Promise<void> }) {
  const tarefas = turma.tarefas;

  const remover = async (m: Membro) => {
    if (!window.confirm(`Remover ${m.nome} da turma?`)) return;
    await removerMembro(turma.codigo, m.uid);
    await onAtualizar();
  };

  const baixarCsv = () => {
    const cab = ["Nome", "Matrícula", "XP", "Indicados concluídos", ...tarefas.map((t) => CATALOGO_TAREFAS.find((c) => c.id === t)?.titulo ?? t), "Atualizado em"];
    const linhas = (membros ?? []).map((m) => {
      const feitos = new Set(m.concluidos);
      return [
        m.nome,
        m.matricula,
        String(m.xp),
        `${tarefas.filter((t) => feitos.has(t)).length}/${tarefas.length}`,
        ...tarefas.map((t) => (feitos.has(t) ? "sim" : "não")),
        m.atualizadoEm?.toDate().toLocaleString("pt-BR") ?? "",
      ];
    });
    const csv = [cab, ...linhas].map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `turma-${turma.codigo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="glass p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Users className="h-5 w-5 text-chem-orbital" /> Progresso dos alunos <span className="font-mono text-sm text-muted">({membros?.length ?? 0})</span>
        </h2>
        <div className="ml-auto flex gap-2">
          <button onClick={() => void onAtualizar()} className="btn-ghost text-xs"><RefreshCw className="h-3.5 w-3.5" /> Atualizar</button>
          <button onClick={baixarCsv} disabled={!membros?.length} className="btn-ghost text-xs"><Download className="h-3.5 w-3.5" /> Planilha (CSV)</button>
        </div>
      </div>
      {membros === null ? (
        <Carregando />
      ) : membros.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nenhum aluno entrou ainda. Compartilhe o código {turma.codigo} ou o link de convite.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="py-2 pr-3">Aluno</th>
                <th className="py-2 pr-3">XP</th>
                <th className="py-2 pr-3">Indicados</th>
                {tarefas.map((t, i) => (
                  <th key={t} className="px-1 py-2 text-center font-mono" title={CATALOGO_TAREFAS.find((c) => c.id === t)?.titulo}>
                    {i + 1}
                  </th>
                ))}
                <th className="py-2 pr-3">Atualizado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {membros.map((m) => {
                const feitos = new Set(m.concluidos);
                const n = tarefas.filter((t) => feitos.has(t)).length;
                return (
                  <tr key={m.uid} className="border-t border-ui-border/20">
                    <td className="py-2 pr-3">
                      <p className="font-semibold">{m.nome}</p>
                      <p className="font-mono text-xs text-muted">{m.matricula}</p>
                    </td>
                    <td className="py-2 pr-3 font-mono">{m.xp.toLocaleString("pt-BR")}</td>
                    <td className="py-2 pr-3 font-mono">
                      {n}/{tarefas.length}
                    </td>
                    {tarefas.map((t) => (
                      <td key={t} className="px-1 py-2 text-center">
                        {feitos.has(t) ? <CheckCircle2 className="mx-auto h-4 w-4 text-chem-success" aria-label="concluído" /> : <Circle className="mx-auto h-4 w-4 text-muted" aria-label="pendente" />}
                      </td>
                    ))}
                    <td className="py-2 pr-3 text-xs text-muted">{m.atualizadoEm?.toDate().toLocaleDateString("pt-BR") ?? "—"}</td>
                    <td className="py-2 text-right">
                      <button onClick={() => remover(m)} className="text-muted hover:text-chem-danger" title="Remover da turma" aria-label={`Remover ${m.nome}`}>
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {tarefas.length > 0 && (
            <ol className="mt-3 grid gap-x-4 gap-y-0.5 text-xs text-muted sm:grid-cols-2">
              {tarefas.map((t, i) => (
                <li key={t}>
                  <span className="font-mono">{i + 1}.</span> {CATALOGO_TAREFAS.find((c) => c.id === t)?.titulo ?? t}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
