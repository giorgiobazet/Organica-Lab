"use client";

import { useState } from "react";
import { CheckCircle2, FlaskConical, Loader2, LogOut, MailCheck, RefreshCw, Send, Wand2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AuthError } from "@/lib/firebase";

/** Tela de bloqueio enquanto emailVerified === false. */
export function VerifyEmailGate() {
  const { user, mode, refreshVerification, resendVerification, devVerifyEmail, signOut } = useAuth();
  const [busy, setBusy] = useState<null | "check" | "resend" | "dev">(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "erro"; text: string } | null>(null);

  const run = async (kind: "check" | "resend" | "dev", fn: () => Promise<void>) => {
    setBusy(kind);
    setMsg(null);
    try {
      await fn();
    } catch (err) {
      setMsg({ tone: "erro", text: err instanceof AuthError ? err.message : "Algo deu errado. Tente de novo." });
    } finally {
      setBusy(null);
    }
  };

  const check = () =>
    run("check", async () => {
      const ok = await refreshVerification();
      if (!ok) setMsg({ tone: "erro", text: "Ainda não encontramos a verificação. Confira a caixa de entrada e o spam." });
    });

  const resend = () =>
    run("resend", async () => {
      await resendVerification();
      setMsg({ tone: "ok", text: `Novo e-mail enviado para ${user?.email}.` });
    });

  return (
    <div className="glass-strong w-full max-w-md p-6 text-center sm:p-8">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-chem-primary/15 text-chem-primary shadow-glow">
        <MailCheck className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold">Verifique sua caixa de entrada para liberar o acesso ao Laboratório</h2>
      <p className="mt-2 text-sm text-muted">
        Enviamos um link de verificação para <span className="font-mono text-chem-primary">{user?.email}</span>. Depois de
        clicar nele, atualize o status abaixo.
      </p>

      <div className="mt-6 space-y-2.5">
        <button className="btn-primary w-full" onClick={check} disabled={busy !== null}>
          {busy === "check" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Já verifiquei meu e-mail (Atualizar status)
        </button>
        <button className="btn-ghost w-full" onClick={resend} disabled={busy !== null}>
          {busy === "resend" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Reenviar e-mail
        </button>
      </div>

      {mode === "dev" && devVerifyEmail && (
        <div className="mt-5 rounded-xl border border-dashed border-chem-orbital/60 bg-chem-orbital/10 p-4 text-left">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-chem-orbital">
            <FlaskConical className="h-3.5 w-3.5" /> Modo Dev · Firebase não configurado
          </p>
          <p className="mb-3 text-xs text-muted">
            Nenhum e-mail real é enviado. Preencha o <span className="font-mono">.env.local</span> para usar o Firebase em produção.
          </p>
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-chem-orbital px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 hover:shadow-glow-orbital disabled:opacity-50"
            onClick={() => run("dev", devVerifyEmail)}
            disabled={busy !== null}
          >
            {busy === "dev" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Simular Clique no Link de Verificação de E-mail (Modo Dev)
          </button>
        </div>
      )}

      {msg && (
        <p
          role="status"
          className={`mt-4 flex items-center justify-center gap-2 text-sm ${msg.tone === "ok" ? "text-chem-success" : "text-chem-danger"}`}
        >
          {msg.tone === "ok" && <CheckCircle2 className="h-4 w-4" />}
          {msg.text}
        </p>
      )}

      <button onClick={() => signOut()} className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted hover:text-chem-danger">
        <LogOut className="h-3.5 w-3.5" /> Sair e usar outra conta
      </button>
    </div>
  );
}
