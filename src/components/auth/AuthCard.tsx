"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { AtSign, Check, Circle, Eye, EyeOff, FlaskConical, GraduationCap, Hash, KeyRound, Loader2, LogIn, User, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AuthError } from "@/lib/firebase";
import {
  EXEMPLO_MATRICULA,
  MATRICULA_MAX_PERFIL,
  REQUISITOS_SENHA,
  mascaraMatricula,
  validarCadastro,
  validarEmail,
  type CadastroErrors,
  type CadastroInput,
  type Perfil,
} from "@/lib/validation";
import { cn } from "@/lib/utils";

type Tela = "login" | "cadastro";

/** Textos e cores de cada sessão: ciano para aluno, violeta para professor/técnico. */
const SESSAO: Record<
  Perfil,
  {
    aba: string;
    icone: typeof GraduationCap;
    selo: string;
    titulo: Record<Tela, string>;
    subtitulo: Record<Tela, string>;
    entrar: string;
    criar: string;
    rotuloMatricula: string;
    dicaMatricula: string;
  }
> = {
  aluno: {
    aba: "Aluno",
    icone: GraduationCap,
    selo: "Sessão do aluno",
    titulo: { login: "Bem-vindo(a) ao laboratório", cadastro: "Cadastro de aluno" },
    subtitulo: {
      login: "Use o e-mail e a senha da sua conta de aluno.",
      cadastro: "Enviaremos um link de verificação para o seu e-mail.",
    },
    entrar: "Entrar como aluno",
    criar: "Criar conta de aluno",
    rotuloMatricula: "Matrícula (12 dígitos)",
    dicaMatricula: "A matrícula de aluno tem 12 dígitos.",
  },
  servidor: {
    aba: "Professor / Técnico",
    icone: FlaskConical,
    selo: "Sessão do servidor",
    titulo: { login: "Acesso de professores e técnicos", cadastro: "Cadastro de professor ou técnico" },
    subtitulo: {
      login: "Use o e-mail e a senha da sua conta de servidor.",
      cadastro: "Enviaremos um link de verificação para o seu e-mail.",
    },
    entrar: "Entrar como professor/técnico",
    criar: "Criar conta de servidor",
    rotuloMatricula: "Matrícula funcional",
    dicaMatricula: "Formato 00000-0; o hífen entra sozinho.",
  },
};

const ORDEM: Perfil[] = ["aluno", "servidor"];
const LS_SESSAO = "organicalab:sessao-login";

export function AuthCard() {
  const [perfil, setPerfil] = useState<Perfil>("aluno");
  const [tela, setTela] = useState<Tela>("login");
  const [aviso, setAviso] = useState<string | null>(null);

  // Lembra a última aba usada neste navegador (só conveniência).
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(LS_SESSAO);
      if (salvo === "aluno" || salvo === "servidor") setPerfil(salvo);
    } catch {
      /* armazenamento indisponível: fica na aba Aluno */
    }
  }, []);

  const trocarPerfil = (p: Perfil, mensagem: string | null = null) => {
    setPerfil(p);
    setAviso(mensagem);
    try {
      window.localStorage.setItem(LS_SESSAO, p);
    } catch {
      /* ignora */
    }
  };

  const s = SESSAO[perfil];

  return (
    <div className="w-full max-w-md">
      <div className="flex gap-1.5 pl-4" role="tablist" aria-label="Tipo de acesso">
        {ORDEM.map((p) => {
          const Icone = SESSAO[p].icone;
          const ativo = perfil === p;
          return (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => trocarPerfil(p)}
              className={cn("aba-pasta", p === "servidor" && "aba-servidor")}
            >
              <Icone className="h-4 w-4" />
              {SESSAO[p].aba}
            </button>
          );
        })}
      </div>

      <div className={cn("glass-strong p-6 sm:p-8", perfil === "aluno" ? "cartao-aluno" : "cartao-servidor")} role="tabpanel">
        <span className={cn("chip", perfil === "aluno" ? "bg-chem-primary/15 text-chem-primary" : "bg-chem-orbital/15 text-chem-orbital")}>
          <s.icone className="h-3.5 w-3.5" />
          {s.selo}
        </span>

        {aviso && (
          <p className="mt-3 rounded-lg bg-chem-orbital/10 px-3 py-2 text-sm text-chem-orbital" role="status">
            {aviso}
          </p>
        )}

        <AnimatePresence mode="wait">
          <m.div
            key={`${perfil}-${tela}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="mt-3"
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold">{s.titulo[tela]}</h2>
              <p className="text-sm text-muted">{s.subtitulo[tela]}</p>
            </div>
          </m.div>
        </AnimatePresence>

        {tela === "login" ? (
          <LoginForm
            perfil={perfil}
            onCriar={() => {
              setAviso(null);
              setTela("cadastro");
            }}
            onPerfilDiferente={(correto, msg) => trocarPerfil(correto, msg)}
          />
        ) : (
          <CadastroForm
            key={perfil}
            perfil={perfil}
            onEntrar={() => {
              setAviso(null);
              setTela("login");
            }}
          />
        )}
      </div>
    </div>
  );
}

function LoginForm({
  perfil,
  onCriar,
  onPerfilDiferente,
}: {
  perfil: Perfil;
  onCriar: () => void;
  onPerfilDiferente: (correto: Perfil, mensagem: string) => void;
}) {
  const { signIn, resetPassword, mode } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [infoSenha, setInfoSenha] = useState<string | null>(null);

  const esqueciSenha = async () => {
    setInfoSenha(null);
    const emailErr = validarEmail(email);
    if (emailErr) return setErro(email ? emailErr : "Digite o seu e-mail acima e toque de novo em “Esqueci minha senha”.");
    setErro(null);
    setEnviando(true);
    try {
      await resetPassword(email);
      // Mensagem neutra: não revela se existe conta com este e-mail.
      setInfoSenha(
        mode === "dev"
          ? "Modo Dev: o e-mail de redefinição foi apenas simulado (veja o console)."
          : `Se houver uma conta com ${email.trim()}, enviamos um link para criar uma nova senha. Veja também o spam.`,
      );
    } catch (err) {
      setErro(err instanceof AuthError ? err.message : "Não foi possível enviar o e-mail agora.");
    } finally {
      setEnviando(false);
    }
  };
  const s = SESSAO[perfil];

  useEffect(() => setErro(null), [perfil]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validarEmail(email);
    if (emailErr) return setErro(emailErr);
    if (!senha) return setErro("Informe a senha.");
    setEnviando(true);
    setErro(null);
    try {
      await signIn(email, senha, perfil);
    } catch (err) {
      if (err instanceof AuthError && err.code === "app/perfil-diferente") {
        // E-mail e senha continuam preenchidos: basta clicar em Entrar na aba certa.
        const correto: Perfil = perfil === "aluno" ? "servidor" : "aluno";
        onPerfilDiferente(correto, `${err.message} Mudamos para a aba ${SESSAO[correto].aba}: é só clicar em Entrar.`);
      } else {
        setErro(err instanceof AuthError ? err.message : "Não foi possível entrar.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field icon={<AtSign className="h-4 w-4" />} label="E-mail">
        <input className="lab-input pl-9" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu.email@exemplo.com" />
      </Field>
      <Field icon={<KeyRound className="h-4 w-4" />} label="Senha">
        <CampoSenha value={senha} onChange={setSenha} autoComplete="current-password" />
      </Field>
      <div className="-mt-2 text-right">
        <button type="button" onClick={esqueciSenha} disabled={enviando} className="text-xs font-medium text-muted hover:text-chem-primary hover:underline">
          Esqueci minha senha
        </button>
      </div>
      {infoSenha && <p className="rounded-lg bg-chem-success/10 px-3 py-2 text-sm text-chem-success" role="status">{infoSenha}</p>}
      {erro && <p className="rounded-lg bg-chem-danger/10 px-3 py-2 text-sm text-chem-danger" role="alert">{erro}</p>}
      <button type="submit" className={cn("btn-primary w-full", perfil === "servidor" && "btn-servidor")} disabled={enviando}>
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {s.entrar}
      </button>
      <p className="text-center text-sm text-muted">
        Ainda não tem conta?{" "}
        <button type="button" onClick={onCriar} className={cn("font-semibold hover:underline", perfil === "aluno" ? "text-chem-primary" : "text-chem-orbital")}>
          {s.criar}
        </button>
      </p>
    </form>
  );
}

function CadastroForm({ perfil, onEntrar }: { perfil: Perfil; onEntrar: () => void }) {
  const { signUp } = useAuth();
  const [form, setForm] = useState<CadastroInput>({ nome: "", email: "", matricula: "", senha: "" });
  const [errors, setErrors] = useState<CadastroErrors>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const s = SESSAO[perfil];

  const set = (k: keyof CadastroInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = k === "matricula" ? mascaraMatricula(e.target.value, perfil) : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validarCadastro(form, perfil);
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
      <Field icon={<User className="h-4 w-4" />} label="Nome completo" error={errors.nome}>
        <input className="lab-input pl-9" autoComplete="name" value={form.nome} onChange={set("nome")} placeholder="Nome e sobrenome" />
      </Field>
      <Field icon={<AtSign className="h-4 w-4" />} label="E-mail institucional ou pessoal" error={errors.email}>
        <input className="lab-input pl-9" type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="seu.email@exemplo.com" />
      </Field>
      <Field icon={<Hash className="h-4 w-4" />} label={s.rotuloMatricula} error={errors.matricula}>
        <input
          className="lab-input pl-9 font-mono"
          inputMode="numeric"
          autoComplete="off"
          maxLength={MATRICULA_MAX_PERFIL[perfil]}
          value={form.matricula}
          onChange={set("matricula")}
          placeholder={EXEMPLO_MATRICULA[perfil]}
        />
      </Field>
      {!errors.matricula && <p className="-mt-2 text-xs text-muted">{s.dicaMatricula}</p>}
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
      <p className="text-xs text-muted">
        Ao criar a conta, você concorda com o uso dos seus dados descrito na{" "}
        <a href="/privacidade" target="_blank" className="font-semibold underline-offset-2 hover:text-chem-primary hover:underline">
          Política de Privacidade
        </a>
        .
      </p>
      <button type="submit" className={cn("btn-primary w-full", perfil === "servidor" && "btn-servidor")} disabled={enviando}>
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        {s.criar}
      </button>
      <p className="text-center text-sm text-muted">
        Já tem conta?{" "}
        <button type="button" onClick={onEntrar} className={cn("font-semibold hover:underline", perfil === "aluno" ? "text-chem-primary" : "text-chem-orbital")}>
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
