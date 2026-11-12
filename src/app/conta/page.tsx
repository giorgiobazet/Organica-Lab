"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, KeyRound, Loader2, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { LabHeader } from "@/components/LabHeader";
import { RequireVerified } from "@/components/RequireVerified";
import { Rodape } from "@/components/Rodape";
import { useAuth } from "@/context/AuthContext";
import { AuthError } from "@/lib/firebase";
import { ROTULO_STATUS, concluidosDoPerfil, exportarDados } from "@/lib/turmas";
import { ROTULO_PERFIL } from "@/lib/validation";

export default function ContaPage() {
  return (
    <RequireVerified>
      <LabHeader />
      <Conta />
      <Rodape />
    </RequireVerified>
  );
}

function Conta() {
  const { user, profile, papel, deleteAccount, resetPassword } = useAuth();
  const [baixando, setBaixando] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  if (!user || !profile) return null;

  const baixar = async () => {
    setBaixando(true);
    try {
      const dados = await exportarDados(user.uid, profile);
      const url = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "meus-dados.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBaixando(false);
    }
  };

  const trocarSenha = async () => {
    await resetPassword(user.email);
    setInfo(`Enviamos para ${user.email} um link para criar uma nova senha.`);
  };

  const excluir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmar.trim().toUpperCase() !== "EXCLUIR") return setErro("Digite EXCLUIR para confirmar.");
    if (!senha) return setErro("Informe a sua senha.");
    setErro(null);
    setExcluindo(true);
    try {
      await deleteAccount(senha);
    } catch (err) {
      setErro(err instanceof AuthError ? err.message : "Não foi possível excluir a conta agora. Tente de novo.");
      setExcluindo(false);
    }
  };

  const linhas: [string, string][] = [
    ["Nome", profile.nome],
    ["E-mail", profile.email],
    ["Matrícula", profile.matricula],
    ["Perfil", ROTULO_PERFIL[profile.perfil ?? "aluno"]],
    ["XP", profile.xp.toLocaleString("pt-BR")],
    ["Jogos concluídos", String(concluidosDoPerfil(profile).length)],
    ["Turmas", profile.turmas?.length ? profile.turmas.join(", ") : "nenhuma"],
  ];
  if (profile.perfil === "servidor") linhas.push(["Validação de professor", ROTULO_STATUS[papel.professor]]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 pb-6 pt-8 sm:px-6">
      <section className="glass p-6">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold"><UserRound className="h-6 w-6 text-chem-primary" /> Minha conta</h1>
        <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-[180px_1fr]">
          {linhas.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-sm text-muted">{k}</dt>
              <dd className="font-mono text-sm">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted">
          Para corrigir nome ou matrícula, escreva para o contato indicado na{" "}
          <Link href="/privacidade" className="font-semibold hover:text-chem-primary hover:underline">Política de Privacidade</Link>.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={baixar} disabled={baixando} className="btn-primary">
            {baixando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Baixar meus dados (JSON)
          </button>
          <button onClick={trocarSenha} className="btn-ghost">
            <KeyRound className="h-4 w-4" /> Trocar senha por e-mail
          </button>
        </div>
        {info && <p className="mt-3 rounded-lg bg-chem-success/10 px-3 py-2 text-sm text-chem-success" role="status">{info}</p>}
      </section>

      <section className="glass border-chem-danger/40 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-chem-danger"><Trash2 className="h-5 w-5" /> Excluir conta</h2>
        <p className="mt-2 text-sm text-muted">
          Apaga para sempre o seu perfil, o progresso, a participação em turmas, as turmas que você criou e o pedido de
          validação de professor. Não dá para desfazer.
        </p>
        <form onSubmit={excluir} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Senha atual
            <input type="password" autoComplete="current-password" className="lab-input mt-1" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </label>
          <label className="text-sm">
            Digite <b className="font-mono">EXCLUIR</b>
            <input className="lab-input mt-1 font-mono" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
          </label>
          {erro && <p className="rounded-lg bg-chem-danger/10 px-3 py-2 text-sm text-chem-danger sm:col-span-2" role="alert">{erro}</p>}
          <button type="submit" disabled={excluindo} className="btn-ghost !border-chem-danger/60 !text-chem-danger sm:col-span-2">
            {excluindo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Excluir minha conta
          </button>
        </form>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><ShieldCheck className="h-3.5 w-3.5" /> Seus direitos pela LGPD estão na Política de Privacidade.</p>
      </section>
    </main>
  );
}
