/**
 * Camada de autenticação e perfil do OrgânicaLab.
 *
 * Modo Híbrido Resiliente:
 *  - "firebase": usa o SDK oficial quando as variáveis NEXT_PUBLIC_FIREBASE_* estão no .env.local.
 *  - "dev": sem essas variáveis, liga um provedor local espelhado em localStorage, com o mesmo
 *    contrato (cadastro, login, verificação de e-mail, perfil), para testar o fluxo inteiro logo
 *    após a instalação.
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendEmailVerification,
  updateProfile as fbUpdateProfile,
  reload,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, type Firestore } from "firebase/firestore";
import { perfilDaMatricula, type CadastroInput, type Perfil } from "./validation";

// ---------------------------------------------------------------------------
// Tipos compartilhados
// ---------------------------------------------------------------------------

export interface AppUser {
  uid: string;
  email: string;
  nome: string;
  emailVerified: boolean;
}

export interface UltimoExperimento {
  rota: string;
  titulo: string;
  em: number;
}

export interface ProgressoModulo {
  xp: number;
  concluidos: string[];
}

export interface Progresso {
  ultimoExperimento?: UltimoExperimento;
  modulos?: Record<string, ProgressoModulo>;
}

export interface UserProfile {
  nome: string;
  email: string;
  matricula: string;
  /** Derivado do formato da matrícula; perfis antigos sem o campo são de alunos. */
  perfil?: Perfil;
  xp: number;
  progresso: Progresso;
}

export type AuthMode = "firebase" | "dev";

export interface AuthBackend {
  mode: AuthMode;
  onAuthChange(cb: (user: AppUser | null) => void): () => void;
  signUp(input: CadastroInput): Promise<AppUser>;
  signIn(email: string, senha: string): Promise<AppUser>;
  signOut(): Promise<void>;
  resendVerification(): Promise<void>;
  /** Recarrega o usuário atual do provedor (atualiza emailVerified). */
  reloadUser(): Promise<AppUser | null>;
  getProfile(uid: string): Promise<UserProfile | null>;
  updateProfile(uid: string, patch: Partial<UserProfile>): Promise<void>;
  /** Só no Modo Dev: simula o clique no link enviado por e-mail. */
  devVerifyEmail?(): Promise<void>;
}

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

// Referências literais: o Next.js só embute variáveis NEXT_PUBLIC_* escritas assim.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

const PERFIL_INICIAL = (input: Omit<CadastroInput, "senha">): UserProfile => ({
  nome: input.nome.trim(),
  email: input.email.trim().toLowerCase(),
  matricula: input.matricula,
  perfil: perfilDaMatricula(input.matricula) ?? "aluno",
  xp: 0,
  progresso: {},
});

// ---------------------------------------------------------------------------
// Backend Firebase (produção)
// ---------------------------------------------------------------------------

const FIREBASE_ERROS: Record<string, string> = {
  "auth/email-already-in-use": "Este e-mail já está cadastrado.",
  "auth/invalid-email": "E-mail inválido.",
  "auth/weak-password": "Senha fraca: use 8+ caracteres com maiúscula, minúscula, número e símbolo.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
  "auth/network-request-failed": "Falha de rede. Verifique sua conexão.",
};

function traduzErroFirebase(err: unknown): AuthError {
  const code = (err as { code?: string })?.code ?? "auth/unknown";
  return new AuthError(code, FIREBASE_ERROS[code] ?? "Não foi possível concluir a operação.");
}

function toAppUser(u: User): AppUser {
  return {
    uid: u.uid,
    email: u.email ?? "",
    nome: u.displayName ?? "",
    emailVerified: u.emailVerified,
  };
}

class FirebaseBackend implements AuthBackend {
  mode: AuthMode = "firebase";
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;

  constructor() {
    this.app = getApps()[0] ?? initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    // E-mails de verificação e redefinição em português.
    this.auth.languageCode = "pt-BR";
    this.db = getFirestore(this.app);
  }

  onAuthChange(cb: (user: AppUser | null) => void) {
    return onAuthStateChanged(this.auth, (u) => cb(u ? toAppUser(u) : null));
  }

  async signUp(input: CadastroInput) {
    try {
      const cred = await createUserWithEmailAndPassword(
        this.auth,
        input.email.trim(),
        input.senha,
      );
      await fbUpdateProfile(cred.user, { displayName: input.nome.trim() });
      await setDoc(doc(this.db, "users", cred.user.uid), PERFIL_INICIAL(input));
      await sendEmailVerification(cred.user);
      return toAppUser(cred.user);
    } catch (err) {
      throw traduzErroFirebase(err);
    }
  }

  async signIn(email: string, senha: string) {
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email.trim(), senha);
      return toAppUser(cred.user);
    } catch (err) {
      throw traduzErroFirebase(err);
    }
  }

  async signOut() {
    await fbSignOut(this.auth);
  }

  async resendVerification() {
    const u = this.auth.currentUser;
    if (!u) throw new AuthError("auth/no-user", "Nenhum usuário conectado.");
    try {
      await sendEmailVerification(u);
    } catch (err) {
      throw traduzErroFirebase(err);
    }
  }

  async reloadUser() {
    const u = this.auth.currentUser;
    if (!u) return null;
    await reload(u);
    // Força a renovação do token para que as regras do Firestore vejam email_verified.
    await u.getIdToken(true);
    return toAppUser(u);
  }

  async getProfile(uid: string) {
    const snap = await getDoc(doc(this.db, "users", uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }

  async updateProfile(uid: string, patch: Partial<UserProfile>) {
    await updateDoc(doc(this.db, "users", uid), patch);
  }
}

// ---------------------------------------------------------------------------
// Backend Dev (fallback local espelhado em localStorage)
// ---------------------------------------------------------------------------

interface DevUserRecord {
  uid: string;
  email: string;
  nome: string;
  senhaHash: string;
  emailVerified: boolean;
}

const LS_USERS = "chempharm:dev:users";
const LS_PROFILES = "chempharm:dev:profiles";
const LS_SESSION = "chempharm:dev:session";

function lsRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsWrite(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

async function hashSenha(senha: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${senha}`);
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Contexto não seguro (ex.: IP da rede local via http): hash FNV-1a, suficiente para o Modo Dev.
  let h = 0x811c9dc5;
  for (const b of data) h = Math.imul(h ^ b, 0x01000193) >>> 0;
  return `fnv-${h.toString(16)}`;
}

function novoUid() {
  return globalThis.crypto?.randomUUID?.() ?? `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

class DevBackend implements AuthBackend {
  mode: AuthMode = "dev";
  private listeners = new Set<(user: AppUser | null) => void>();

  private users() {
    return lsRead<Record<string, DevUserRecord>>(LS_USERS, {});
  }

  private current(): DevUserRecord | null {
    const uid = lsRead<string | null>(LS_SESSION, null);
    if (!uid) return null;
    return Object.values(this.users()).find((u) => u.uid === uid) ?? null;
  }

  private emit() {
    const rec = this.current();
    const user = rec ? this.toAppUser(rec) : null;
    this.listeners.forEach((cb) => cb(user));
  }

  private toAppUser(r: DevUserRecord): AppUser {
    return { uid: r.uid, email: r.email, nome: r.nome, emailVerified: r.emailVerified };
  }

  onAuthChange(cb: (user: AppUser | null) => void) {
    this.listeners.add(cb);
    const rec = this.current();
    queueMicrotask(() => cb(rec ? this.toAppUser(rec) : null));
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_SESSION || e.key === LS_USERS) this.emit();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      this.listeners.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  }

  async signUp(input: CadastroInput) {
    const email = input.email.trim().toLowerCase();
    const users = this.users();
    if (users[email]) throw new AuthError("auth/email-already-in-use", FIREBASE_ERROS["auth/email-already-in-use"]);
    const uid = novoUid();
    const rec: DevUserRecord = {
      uid,
      email,
      nome: input.nome.trim(),
      senhaHash: await hashSenha(input.senha, uid),
      emailVerified: false,
    };
    users[email] = rec;
    lsWrite(LS_USERS, users);
    const profiles = lsRead<Record<string, UserProfile>>(LS_PROFILES, {});
    profiles[uid] = PERFIL_INICIAL(input);
    lsWrite(LS_PROFILES, profiles);
    lsWrite(LS_SESSION, uid);
    console.info(`[OrgânicaLab Modo Dev] E-mail de verificação "enviado" para ${email}.`);
    this.emit();
    return this.toAppUser(rec);
  }

  async signIn(email: string, senha: string) {
    const rec = this.users()[email.trim().toLowerCase()];
    if (!rec || rec.senhaHash !== (await hashSenha(senha, rec.uid))) {
      throw new AuthError("auth/invalid-credential", FIREBASE_ERROS["auth/invalid-credential"]);
    }
    lsWrite(LS_SESSION, rec.uid);
    this.emit();
    return this.toAppUser(rec);
  }

  async signOut() {
    window.localStorage.removeItem(LS_SESSION);
    this.emit();
  }

  async resendVerification() {
    const rec = this.current();
    if (!rec) throw new AuthError("auth/no-user", "Nenhum usuário conectado.");
    console.info(`[OrgânicaLab Modo Dev] E-mail de verificação reenviado para ${rec.email}.`);
  }

  async reloadUser() {
    const rec = this.current();
    return rec ? this.toAppUser(rec) : null;
  }

  async getProfile(uid: string) {
    return lsRead<Record<string, UserProfile>>(LS_PROFILES, {})[uid] ?? null;
  }

  async updateProfile(uid: string, patch: Partial<UserProfile>) {
    const profiles = lsRead<Record<string, UserProfile>>(LS_PROFILES, {});
    if (!profiles[uid]) return;
    profiles[uid] = { ...profiles[uid], ...patch };
    lsWrite(LS_PROFILES, profiles);
  }

  async devVerifyEmail() {
    const rec = this.current();
    if (!rec) throw new AuthError("auth/no-user", "Nenhum usuário conectado.");
    const users = this.users();
    users[rec.email] = { ...rec, emailVerified: true };
    lsWrite(LS_USERS, users);
    this.emit();
  }
}

// ---------------------------------------------------------------------------
// Singleton (só no navegador)
// ---------------------------------------------------------------------------

let backend: AuthBackend | null = null;

export function getAuthBackend(): AuthBackend {
  if (typeof window === "undefined") {
    throw new Error("getAuthBackend() só pode ser chamado no navegador.");
  }
  if (!backend) backend = isFirebaseConfigured ? new FirebaseBackend() : new DevBackend();
  return backend;
}
