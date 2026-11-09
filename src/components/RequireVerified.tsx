"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Proteção de rotas: só renderiza os filhos para usuário logado com emailVerified === true.
 * Qualquer outro estado redireciona para "/".
 */
export function RequireVerified({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "signedOut" || status === "unverified") router.replace("/");
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
