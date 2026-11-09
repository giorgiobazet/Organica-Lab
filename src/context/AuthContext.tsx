"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

  const persist = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (!backend || !user || !profile) return;
      const next = { ...profile, ...patch };
      setProfile(next);
      await backend.updateProfile(user.uid, patch);
    },
    [backend, user, profile],
  );

  const registrarExperimento = useCallback(
    (experimento: Omit<UltimoExperimento, "em">) =>
      persist({
        progresso: {
          ...profile?.progresso,
          ultimoExperimento: { ...experimento, em: Date.now() },
        },
      }),
    [persist, profile],
  );

  const addXp = useCallback(
    (amount: number, experimento?: Omit<UltimoExperimento, "em">) =>
      persist({
        xp: Math.max(0, Math.round((profile?.xp ?? 0) + amount)),
        progresso: experimento
          ? { ...profile?.progresso, ultimoExperimento: { ...experimento, em: Date.now() } }
          : (profile?.progresso ?? {}),
      }),
    [persist, profile],
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() precisa estar dentro de <AuthProvider>.");
  return ctx;
}
