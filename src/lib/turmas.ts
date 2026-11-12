/**
 * Turmas do professor e validação de professores (Firestore).
 *
 * Quem se cadastra com matrícula de servidor só identifica o perfil: para criar turmas, o professor
 * pede validação e o administrador aprova (coleção `professores`, escrita só pelo admin).
 * As mesmas restrições valem em `firestore.rules`.
 */
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
  type Timestamp,
} from "firebase/firestore/lite";
import { getFirestoreDb, type UserProfile } from "@/lib/firebase";
import { DISCIPLINAS } from "@/data/chemistryData";

export type StatusProfessor = "nenhum" | "pendente" | "aprovado" | "recusado" | "revogado";

export const ROTULO_STATUS: Record<StatusProfessor, string> = {
  nenhum: "não solicitada",
  pendente: "aguardando análise",
  aprovado: "professor(a) verificado(a)",
  recusado: "recusada",
  revogado: "revogada",
};

export interface PedidoValidacao {
  uid: string;
  nome: string;
  email: string;
  matricula: string;
  status: Exclude<StatusProfessor, "nenhum">;
  motivo?: string;
  criadoEm?: Timestamp;
  decididoEm?: Timestamp;
}

export interface ListaTurma {
  titulo: string;
  url: string;
}

export interface Turma {
  codigo: string;
  nome: string;
  professorUid: string;
  professorNome: string;
  /** Jogos indicados, como "disciplina/jogo" (ex.: "organica-1/pka"). */
  tarefas: string[];
  /** Links da Lista da Aula. */
  listas: ListaTurma[];
  criadoEm?: Timestamp;
}

export interface Membro {
  uid: string;
  nome: string;
  matricula: string;
  xp: number;
  concluidos: string[];
  entrouEm?: Timestamp;
  atualizadoEm?: Timestamp;
}

export const LIMITES = { nomeTurma: 80, tarefas: 60, listas: 30, turmasPorAluno: 20 } as const;

/** Código de turma: 6 caracteres sem os ambíguos (0/O, 1/I/L). */
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const REGEX_CODIGO = /^[A-HJKMNP-Z2-9]{6}$/;

/** Só links internos do Laboratório (evita javascript: e sites externos nas listas da turma). */
export function linkListaSeguro(url: unknown): string | null {
  return typeof url === "string" && url.length <= 1800 && /^\/laboratorio\?[^\s"'<>]*$/.test(url) ? url : null;
}

export function normalizarCodigo(c: string) {
  return c.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function gerarCodigo() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

export class TurmaErro extends Error {}

function db(): Firestore {
  const d = getFirestoreDb();
  if (!d) throw new TurmaErro("Turmas e validação de professores só funcionam com o Firebase configurado (não no Modo Dev).");
  return d;
}

export const turmasDisponiveis = () => getFirestoreDb() !== null;

/** Todos os jogos, para o professor escolher as tarefas. */
export const CATALOGO_TAREFAS = DISCIPLINAS.flatMap((d) =>
  d.jogos.map((j) => ({ id: `${d.id}/${j.id}`, disciplina: d.tituloCurto, titulo: j.titulo, rota: `${d.rota}#${j.id}` })),
);
export const tarefaPorId = (id: string) => CATALOGO_TAREFAS.find((t) => t.id === id);

/** Jogos concluídos do perfil, no formato "disciplina/jogo". */
export function concluidosDoPerfil(p: UserProfile): string[] {
  return Object.entries(p.progresso.modulos ?? {}).flatMap(([disc, m]) => m.concluidos.map((j) => `${disc}/${j}`));
}

// ---------------------------------------------------------------------------
// Papéis
// ---------------------------------------------------------------------------

export async function souAdmin(uid: string) {
  try {
    return (await getDoc(doc(db(), "admins", uid))).exists();
  } catch {
    return false;
  }
}

export async function statusProfessor(uid: string): Promise<{ status: StatusProfessor; pedido: PedidoValidacao | null }> {
  const d = db();
  const [prof, ped] = await Promise.all([getDoc(doc(d, "professores", uid)), getDoc(doc(d, "verificacoes", uid))]);
  const pedido = ped.exists() ? ({ uid, ...ped.data() } as PedidoValidacao) : null;
  if (prof.exists()) return { status: "aprovado", pedido };
  return { status: pedido?.status === "aprovado" ? "revogado" : (pedido?.status ?? "nenhum"), pedido };
}

export async function pedirValidacao(uid: string, p: UserProfile) {
  const d = db();
  const ref = doc(d, "verificacoes", uid);
  // Um pedido recusado ou revogado é apagado antes de pedir de novo.
  if ((await getDoc(ref)).exists()) await deleteDoc(ref);
  await setDoc(ref, { nome: p.nome, email: p.email, matricula: p.matricula, status: "pendente", criadoEm: serverTimestamp() });
}

export async function cancelarPedido(uid: string) {
  await deleteDoc(doc(db(), "verificacoes", uid));
}

// ---------------------------------------------------------------------------
// Administrador
// ---------------------------------------------------------------------------

export async function listarPedidos(): Promise<PedidoValidacao[]> {
  const snap = await getDocs(collection(db(), "verificacoes"));
  return snap.docs
    .map((s) => ({ uid: s.id, ...s.data() }) as PedidoValidacao)
    .sort((a, b) => (b.criadoEm?.toMillis() ?? 0) - (a.criadoEm?.toMillis() ?? 0));
}

export async function aprovarProfessor(ped: PedidoValidacao) {
  const d = db();
  const lote = writeBatch(d);
  lote.set(doc(d, "professores", ped.uid), { nome: ped.nome, email: ped.email, matricula: ped.matricula, aprovadoEm: serverTimestamp() });
  lote.update(doc(d, "verificacoes", ped.uid), { status: "aprovado", motivo: "", decididoEm: serverTimestamp() });
  await lote.commit();
}

export async function recusarProfessor(uid: string, motivo: string) {
  await updateDoc(doc(db(), "verificacoes", uid), { status: "recusado", motivo: motivo.trim().slice(0, 300), decididoEm: serverTimestamp() });
}

/** Retira a validação: o professor deixa de criar e editar turmas (as existentes continuam visíveis aos alunos). */
export async function revogarProfessor(uid: string, motivo: string) {
  const d = db();
  const lote = writeBatch(d);
  lote.delete(doc(d, "professores", uid));
  lote.update(doc(d, "verificacoes", uid), { status: "revogado", motivo: motivo.trim().slice(0, 300), decididoEm: serverTimestamp() });
  await lote.commit();
}

// ---------------------------------------------------------------------------
// Turmas (professor)
// ---------------------------------------------------------------------------

export async function criarTurma(uid: string, professorNome: string, nome: string): Promise<string> {
  const d = db();
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const codigo = gerarCodigo();
    const ref = doc(d, "turmas", codigo);
    if ((await getDoc(ref)).exists()) continue;
    await setDoc(ref, {
      nome: nome.trim().slice(0, LIMITES.nomeTurma),
      professorUid: uid,
      professorNome,
      tarefas: [],
      listas: [],
      criadoEm: serverTimestamp(),
    });
    return codigo;
  }
  throw new TurmaErro("Não foi possível gerar um código livre. Tente de novo.");
}

export async function turmasDoProfessor(uid: string): Promise<Turma[]> {
  const snap = await getDocs(query(collection(db(), "turmas"), where("professorUid", "==", uid)));
  return snap.docs
    .map((s) => ({ codigo: s.id, ...s.data() }) as Turma)
    .sort((a, b) => (b.criadoEm?.toMillis() ?? 0) - (a.criadoEm?.toMillis() ?? 0));
}

export async function atualizarTurma(codigo: string, patch: Partial<Pick<Turma, "nome" | "tarefas" | "listas">>) {
  await updateDoc(doc(db(), "turmas", codigo), patch);
}

export async function membrosDaTurma(codigo: string): Promise<Membro[]> {
  const snap = await getDocs(collection(db(), "turmas", codigo, "membros"));
  return snap.docs.map((s) => ({ uid: s.id, ...s.data() }) as Membro).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function removerMembro(codigo: string, uid: string) {
  await deleteDoc(doc(db(), "turmas", codigo, "membros", uid));
}

export async function excluirTurma(codigo: string) {
  const d = db();
  const membros = await getDocs(collection(d, "turmas", codigo, "membros"));
  await Promise.all(membros.docs.map((m) => deleteDoc(m.ref)));
  await deleteDoc(doc(d, "turmas", codigo));
}

// ---------------------------------------------------------------------------
// Turmas (aluno)
// ---------------------------------------------------------------------------

export async function buscarTurma(codigo: string): Promise<Turma | null> {
  const c = normalizarCodigo(codigo);
  if (!REGEX_CODIGO.test(c)) return null;
  const s = await getDoc(doc(db(), "turmas", c));
  return s.exists() ? ({ codigo: c, ...s.data() } as Turma) : null;
}

export async function entrarNaTurma(codigo: string, uid: string, p: UserProfile): Promise<Turma> {
  const d = db();
  const turma = await buscarTurma(codigo);
  if (!turma) throw new TurmaErro("Turma não encontrada. Confira o código com o professor.");
  if ((p.turmas ?? []).length >= LIMITES.turmasPorAluno && !p.turmas?.includes(turma.codigo)) {
    throw new TurmaErro(`Limite de ${LIMITES.turmasPorAluno} turmas atingido. Saia de alguma antes.`);
  }
  await setDoc(doc(d, "turmas", turma.codigo, "membros", uid), {
    nome: p.nome,
    matricula: p.matricula,
    xp: p.xp,
    concluidos: concluidosDoPerfil(p),
    entrouEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
  await updateDoc(doc(d, "users", uid), { turmas: arrayUnion(turma.codigo) });
  return turma;
}

export async function sairDaTurma(codigo: string, uid: string) {
  const d = db();
  await deleteDoc(doc(d, "turmas", codigo, "membros", uid)).catch(() => undefined);
  await updateDoc(doc(d, "users", uid), { turmas: arrayRemove(codigo) });
}

export async function turmasDoAluno(codigos: string[]): Promise<Turma[]> {
  const d = db();
  const snaps = await Promise.all(codigos.map((c) => getDoc(doc(d, "turmas", c)).catch(() => null)));
  return snaps.filter((s) => s?.exists()).map((s) => ({ codigo: s!.id, ...s!.data() }) as Turma);
}

/** Copia XP e jogos concluídos para as turmas do aluno (o painel do professor lê daí). */
export async function sincronizarProgresso(uid: string, p: UserProfile) {
  const d = getFirestoreDb();
  if (!d || !p.turmas?.length) return;
  const concluidos = concluidosDoPerfil(p);
  await Promise.all(
    p.turmas.map((c) =>
      updateDoc(doc(d, "turmas", c, "membros", uid), { xp: p.xp, concluidos, atualizadoEm: serverTimestamp() }).catch(() => undefined),
    ),
  );
}

// ---------------------------------------------------------------------------
// Conta (LGPD)
// ---------------------------------------------------------------------------

/** Apaga tudo o que está ligado à conta, antes de excluir o perfil e o login. */
export async function apagarDadosVinculados(uid: string, p: UserProfile | null) {
  const d = getFirestoreDb();
  if (!d) return;
  for (const c of p?.turmas ?? []) await deleteDoc(doc(d, "turmas", c, "membros", uid)).catch(() => undefined);
  const minhas = await getDocs(query(collection(d, "turmas"), where("professorUid", "==", uid))).catch(() => null);
  for (const t of minhas?.docs ?? []) await excluirTurma(t.id);
  await deleteDoc(doc(d, "verificacoes", uid)).catch(() => undefined);
  await deleteDoc(doc(d, "professores", uid)).catch(() => undefined);
}

/** Dados da conta para download (direito de acesso e portabilidade). */
export async function exportarDados(uid: string, p: UserProfile | null) {
  const d = getFirestoreDb();
  const extra: Record<string, unknown> = {};
  if (d) {
    const ped = await getDoc(doc(d, "verificacoes", uid)).catch(() => null);
    if (ped?.exists()) extra.validacaoProfessor = ped.data();
    extra.turmasComoAluno = await Promise.all(
      (p?.turmas ?? []).map(async (c) => {
        const m = await getDoc(doc(d, "turmas", c, "membros", uid)).catch(() => null);
        return { codigo: c, registro: m?.exists() ? m.data() : null };
      }),
    );
    const minhas = await getDocs(query(collection(d, "turmas"), where("professorUid", "==", uid))).catch(() => null);
    if (minhas?.size) extra.turmasComoProfessor = minhas.docs.map((s) => ({ codigo: s.id, ...s.data() }));
  }
  return { exportadoEm: new Date().toISOString(), uid, perfil: p, ...extra };
}
