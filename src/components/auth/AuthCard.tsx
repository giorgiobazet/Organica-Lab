"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, Check, Circle, Eye, EyeOff, Hash, KeyRound, Loader2, LogIn, User, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AuthError } from "@/lib/firebase";
import { MATRICULA_DIGITOS, REQUISITOS_SENHA, validarCadastro, validarEmail, type CadastroErrors, type CadastroInput } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Tab = "login" | "cadastro";

export function AuthCard() {
  const [tab, setTab] = useState<Tab>("login");

  return (
    <div className="glass-strong w-full max-w-md p-6 sm:p-8">
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-200/60 p-1 dark:bg-lab-background/60" role="tablist">
        {(["login", "cadastro"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "relative rounded-lg py-2 text-sm font-semibold transition",
              tab === t ? "text-lab-background" : "text-muted hover:text-chem-primary",
            )}
          >
            {tab === t && (
              <motion.span
                layoutId="auth-tab"
                className="absolute inset-0 rounded-lg bg-chem-primary"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{t === "login" ? "Login" : "Cadastro Universitário"}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: tab === "login" ? -16 : 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: tab === "login" ? 16 : -16 }}
          transition={{ duration: 0.18 }}
        >
          {tab === "login" ? <LoginForm onSwitch={() => setTab("cadastro")} /> : <CadastroForm onSwitch={() => setTab("login")} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validarEmail(email);
    if (emailErr) return setErro(emailErr);
    if (!senha) return setErro("Informe a senha.");
    setEnviando(true);
    setErro(null);
    try {
      await signIn(email, senha);
    } catch (err) {
      setErro(err instanceof AuthError ? err.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <h2 className="text-xl font-bold">Entrar no Laboratório</h2>
        <p className="text-sm text-muted">Use o e-mail e a senha do seu cadastro.</p>
      </div>
      <Field icon={<AtSign className="h-4 w-4" />} label="E-mail">
        <input className="lab-input pl-9" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu.email@exemplo.com" />
      </Field>
      <Field icon={<KeyRound className="h-4 w-4" />} label="Senha">
        <CampoSenha value={senha} onChange={setSenha} autoComplete="current-password" />
      </Field>
      {erro && <p className="rounded-lg bg-chem-danger/10 px-3 py-2 text-sm text-chem-danger" role="alert">{erro}</p>}
      <button type="submit" className="btn-primary w-full" disabled={enviando}>
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        Entrar
      </button>
      <p className="text-center text-sm text-muted">
        Primeira vez?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-chem-primary hover:underline">
          Faça seu cadastro
        </button>
      </p>
    </form>
  );
}

function CadastroForm({ onSwitch }: { onSwitch: () => void }) {
  const { signUp } = useAuth();
  const [form, setForm] = useState<CadastroInput>({ nome: "", email: "", matricula: "", senha: "" });
  const [errors, setErrors] = useState<CadastroErrors>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const set = (k: keyof CadastroInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = k === "matricula" ? e.target.value.replace(/\D/g, "").slice(0, MATRICULA_DIGITOS) : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validarCadastro(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setEnviando(true);
    setErroGeral(null);
    try {
      await signUp(form);
    } catch (err) {
      setErroGeral(err instanceof AuthError ? err.message : "Não foi possível concluir o cadastro.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
      <div>
        <h2 className="text-xl font-bold">Cadastro Universitário</h2>
        <p className="text-sm text-muted">Enviaremos um link de verificação para o seu e-mail.</p>
      </div>
      <Field icon={<User className="h-4 w-4" />} label="Nome completo" error={errors.nome}>
        <input className="lab-input pl-9" autoComplete="name" value={form.nome} onChange={set("nome")} placeholder="Nome e sobrenome" />
      </Field>
      <Field icon={<AtSign className="h-4 w-4" />} label="E-mail institucional ou pessoal" error={errors.email}>
        <input className="lab-input pl-9" type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="seu.email@exemplo.com" />
      </Field>
      <Field icon={<Hash className="h-4 w-4" />} label={`Matrícula (${MATRICULA_DIGITOS} dígitos)`} error={errors.matricula}>
        <input
          className="lab-input pl-9 font-mono"
          inputMode="numeric"
          autoComplete="off"
          maxLength={MATRICULA_DIGITOS}
          value={form.matricula}
          onChange={set("matricula")}
          placeholder="202012345678"
        />
      </Field>
      <Field icon={<KeyRound className="h-4 w-4" />} label="Senha" error={errors.senha}>
        <CampoSenha value={form.senha} onChange={(v) => setForm((f) => ({ ...f, senha: v }))} autoComplete="new-password" />
      </Field>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs" aria-label="Requisitos da senha">
        {REQUISITOS_SENHA.map((r) => {
          const ok = r.ok(form.senha);
          return (
            <li key={r.id} className={cn("flex items-center gap-1.5 transition", ok ? "text-chem-success" : "text-muted")}>
              {ok ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
              {r.rotulo}
            </li>
          );
        })}
      </ul>
      {erroGeral && <p className="rounded-lg bg-chem-danger/10 px-3 py-2 text-sm text-chem-danger" role="alert">{erroGeral}</p>}
      <button type="submit" className="btn-primary w-full" disabled={enviando}>
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Criar conta
      </button>
      <p className="text-center text-sm text-muted">
        Já tem conta?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-chem-primary hover:underline">
          Entrar
        </button>
      </p>
    </form>
  );
}

function CampoSenha({ value, onChange, autoComplete }: { value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <span className="relative block">
      <input
        className="lab-input pl-9 pr-10"
        type={visivel ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Sua senha"
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-chem-primary"
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
      >
        {visivel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </span>
  );
}

function Field({
  icon,
  label,
  error,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        {children}
      </span>
      {error && <span className="mt-1 block text-xs text-chem-danger">{error}</span>}
    </label>
  );
}
