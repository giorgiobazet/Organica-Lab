"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const CHAVE_DESTINO = "organicalab:destino-apos-login";

/** Destino guardado antes do login, só se for um caminho interno do site (nunca outro domínio). */
export function destinoAposLogin(): string {
  try {
    const d = sessionStorage.getItem(CHAVE_DESTINO);
    sessionStorage.removeItem(CHAVE_DESTINO);
    if (d && /^\/(?!\/)[^\\]*$/.test(d) && !d.startsWith("/?")) return d;
  } catch {
    /* sem armazenamento */
  }
  return "/hub";
}

/**
 * Proteção de rotas: só renderiza os filhos para usuário logado com emailVerified === true.
 * Qualquer outro estado redireciona para "/".
 */
export function RequireVerified({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "signedOut" || status === "unverified") {
      try {
        // Volta para cá depois do login (ex.: link de molécula enviado pelo professor).
        sessionStorage.setItem(CHAVE_DESTINO, window.location.pathname + window.location.search + window.location.hash);
      } catch {
        /* sem armazenamento: depois do login vai para o Hub */
      }
      router.replace("/");
    }
  }, [status, router]);

  if (status !== "verified") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-muted">
          <FlaskConical className="h-5 w-5 animate-pulse text-chem-primary" />
          <span className="text-sm">Verificando credenciais do laboratório…</span>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
