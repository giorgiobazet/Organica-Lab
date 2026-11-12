import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { SITE } from "@/config/site";
import { Rodape } from "@/components/Rodape";

export const metadata: Metadata = { title: `Política de Privacidade · ${SITE.nome}` };

const ATUALIZADA = "12 de novembro de 2026";

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-10 pt-8 sm:px-6">
      <Link href="/" className="btn-ghost mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <article className="glass space-y-6 p-6 sm:p-8 [&_h2]:text-lg [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed [&_ul]:space-y-1">
        <header>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-chem-primary">
            <ShieldCheck className="h-4 w-4" /> LGPD · Lei nº 13.709/2018
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Política de Privacidade</h1>
          <p className="mt-1 text-sm text-muted">Atualizada em {ATUALIZADA}.</p>
        </header>

        <section className="space-y-2">
          <h2>1. Quem cuida dos seus dados</h2>
          <p>
            O {SITE.nome} é um projeto educacional idealizado e desenvolvido por {SITE.autor.nome}, que é o controlador
            dos dados descritos aqui. Contato para qualquer assunto de privacidade:{" "}
            <a className="font-semibold text-chem-primary hover:underline" href={`mailto:${SITE.contato}`}>
              {SITE.contato}
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2>2. Quais dados coletamos</h2>
          <ul>
            <li><b>Cadastro:</b> nome completo, e-mail, matrícula e o perfil derivado dela (aluno ou professor/técnico).</li>
            <li><b>Estudo:</b> XP, jogos concluídos e o último jogo acessado.</li>
            <li><b>Turmas:</b> os códigos das turmas em que você entrou.</li>
            <li><b>Professores:</b> o pedido de validação (nome, e-mail e matrícula funcional) e a decisão tomada.</li>
            <li><b>Login:</b> a senha é guardada pelo Firebase Authentication de forma cifrada; nós nunca temos acesso a ela.</li>
          </ul>
          <p>
            Ficam só no seu navegador, sem ir para o servidor: tema claro/escuro, Modo Leve, a última aba de login usada e a
            Lista da Aula do Laboratório Molecular.
          </p>
        </section>

        <section className="space-y-2">
          <h2>3. Para que usamos</h2>
          <ul>
            <li>Identificar você e manter a conta segura (verificação de e-mail e redefinição de senha).</li>
            <li>Guardar o seu progresso nos jogos.</li>
            <li>Mostrar ao professor da turma em que você entrou o seu progresso nos jogos indicados.</li>
            <li>Conferir que quem pede acesso de professor é de fato servidor da instituição.</li>
          </ul>
          <p>
            A base legal é a execução do serviço que você solicitou ao criar a conta e o seu consentimento (art. 7º, I e
            V, da LGPD). Não usamos os dados para publicidade nem os vendemos.
          </p>
        </section>

        <section className="space-y-2">
          <h2>4. Com quem os dados são compartilhados</h2>
          <ul>
            <li>
              <b>Google Firebase</b> (Authentication, Firestore e Hosting), que armazena e processa os dados como operador.
            </li>
            <li>
              <b>Professor da turma:</b> ao entrar numa turma com o código, ele passa a ver o seu nome, matrícula, XP e os
              jogos concluídos. Você pode sair da turma quando quiser.
            </li>
            <li>
              <b>PubChem (NIH) e RCSB PDB:</b> recebem apenas os nomes ou estruturas de moléculas que você busca no
              Laboratório, sem nenhum dado pessoal.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2>5. Por quanto tempo</h2>
          <p>
            Enquanto a conta existir. Ao excluir a conta, apagamos na hora o perfil, o progresso, a sua participação em
            turmas, as turmas que você criou e o pedido de validação de professor.
          </p>
        </section>

        <section className="space-y-2">
          <h2>6. Seus direitos</h2>
          <p>
            A LGPD (art. 18) garante acesso, correção, portabilidade e eliminação dos seus dados. Em{" "}
            <Link href="/conta" className="font-semibold text-chem-primary hover:underline">Minha conta</Link> você vê os
            dados guardados, baixa uma cópia em JSON e exclui a conta. Para corrigir nome ou matrícula, escreva para{" "}
            {SITE.contato}.
          </p>
        </section>

        <section className="space-y-2">
          <h2>7. Segurança</h2>
          <p>
            A conexão é sempre cifrada (HTTPS), o acesso ao banco é limitado por regras de segurança (cada pessoa só lê os
            próprios dados; o professor só lê os da sua turma) e o site usa cabeçalhos de proteção contra injeção de
            conteúdo.
          </p>
        </section>
      </article>
      <Rodape />
    </main>
  );
}
