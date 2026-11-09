"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  getAuthBackend,
  type AppUser,
  type AuthBackend,
  type AuthMode,
  type UltimoExperimento,
  type UserProfile,
} from "@/lib/firebase";
import type { CadastroInput } from "@/lib/validation";

export type AuthStatus = "loading" | "signedOut" | "unverified" | "verified";

interface AuthContextValue {
  status: AuthStatus;
  mode: AuthMode | null;
  user: AppUser | null;
  profile: UserProfile | null;
  signUp(input: CadastroInput): Promise<void>;
  signIn(email: string, senha: string): Promise<void>;
  signOut(): Promise<void>;
  resendVerification(): Promise<void>;
  /** Recarrega o status de verificação; devolve true se o e-mail já foi verificado. */
  refreshVerification(): Promise<boolean>;
  /** Só existe no Modo Dev. */
  devVerifyEmail?: () => Promise<void>;
  /** Soma XP e, opcionalmente, registra o último experimento acessado. */
  addXp(amount: number, experimento?: Omit<UltimoExperimento, "em">): Promise<void>;
  registrarExperimento(experimento: Omit<UltimoExperimento, "em">): Promise<void>;
  /**
   * Marca um jogo como concluído e soma o bônus de XP só na primeira vez.
   * Devolve true se foi a primeira conclusão.
   */
  concluirJogo(disciplinaId: string, jogoId: string, xpBonus: number): Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function statusOf(user: AppUser | null): AuthStatus {
  if (!user) return "signedOut";
  return user.emailVerified ? "verified" : "unverified";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [backend, setBackend] = useState<AuthBackend | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const b = getAuthBackend();
    setBackend(b);
    return b.onAuthChange(async (u) => {
      setUser(u);
      setProfile(u ? await b.getProfile(u.uid) : null);
      setStatus(statusOf(u));
    });
  }, []);

  const requireBackend = useCallback(() => {
    if (!backend) throw new Error("Autenticação ainda carregando.");
    return backend;
  }, [backend]);

  const signUp = useCallback(
    async (input: CadastroInput) => {
      const b = requireBackend();
      const u = await b.signUp(input);
      setUser(u);
      setProfile(await b.getProfile(u.uid));
      setStatus(statusOf(u));
    },
    [requireBackend],
  );

  const signIn = useCallback(
    async (email: string, senha: string) => {
      const b = requireBackend();
      const u = await b.signIn(email, senha);
      setUser(u);
      setProfile(await b.getProfile(u.uid));
      setStatus(statusOf(u));
    },
    [requireBackend],
  );

  const signOut = useCallback(async () => {
    await requireBackend().signOut();
    setUser(null);
    setProfile(null);
    setStatus("signedOut");
  }, [requireBackend]);

  const resendVerification = useCallback(
    () => requireBackend().resendVerification(),
    [requireBackend],
  );

  const refreshVerification = useCallback(async () => {
    const u = await requireBackend().reloadUser();
    setUser(u);
    setStatus(statusOf(u));
    return Boolean(u?.emailVerified);
  }, [requireBackend]);

  const devVerifyEmail = useMemo(() => {
    if (!backend?.devVerifyEmail) return undefined;
    return async () => {
      await backend.devVerifyEmail!();
      const u = await backend.reloadUser();
      setUser(u);
      setStatus(statusOf(u));
    };
  }, [backend]);

  // Ref com o perfil mais recente: várias atualizações seguidas não se sobrescrevem.
  const profileRef = useRef<UserProfile | null>(profile);
  profileRef.current = profile;

  const persist = useCallback(
    async (patchFn: (p: UserProfile) => Partial<UserProfile>) => {
      const atual = profileRef.current;
      if (!backend || !user || !atual) return;
      const patch = patchFn(atual);
      const next = { ...atual, ...patch };
      profileRef.current = next;
      setProfile(next);
      await backend.updateProfile(user.uid, patch);
    },
    [backend, user],
  );

  const registrarExperimento = useCallback(
    (experimento: Omit<UltimoExperimento, "em">) =>
      persist((p) => ({
        progresso: { ...p.progresso, ultimoExperimento: { ...experimento, em: Date.now() } },
      })),
    [persist],
  );

  const addXp = useCallback(
    (amount: number, experimento?: Omit<UltimoExperimento, "em">) =>
      persist((p) => ({
        xp: Math.max(0, Math.round(p.xp + amount)),
        progresso: experimento
          ? { ...p.progresso, ultimoExperimento: { ...experimento, em: Date.now() } }
          : p.progresso,
      })),
    [persist],
  );

  const concluirJogo = useCallback(
    async (disciplinaId: string, jogoId: string, xpBonus: number) => {
      const p0 = profileRef.current;
      if (!p0 || p0.progresso.modulos?.[disciplinaId]?.concluidos.includes(jogoId)) return false;
      await persist((p) => {
        const modulos = p.progresso.modulos ?? {};
        const atual = modulos[disciplinaId] ?? { xp: 0, concluidos: [] };
        return {
          xp: Math.max(0, Math.round(p.xp + xpBonus)),
          progresso: {
            ...p.progresso,
            modulos: {
              ...modulos,
              [disciplinaId]: { xp: atual.xp + xpBonus, concluidos: [...atual.concluidos, jogoId] },
            },
          },
        };
      });
      return true;
    },
    [persist],
  );

  const value: AuthContextValue = {
    status,
    mode: backend?.mode ?? null,
    user,
    profile,
    signUp,
    signIn,
    signOut,
    resendVerification,
    refreshVerification,
    devVerifyEmail,
    addXp,
    registrarExperimento,
    concluirJogo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() precisa estar dentro de <AuthProvider>.");
  return ctx;
}
