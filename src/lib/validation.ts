export interface CadastroInput {
  nome: string;
  email: string;
  matricula: string;
  senha: string;
}

export type CadastroErrors = Partial<Record<keyof CadastroInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/**
 * Matrícula institucional define o perfil:
 *   aluno    → 12 dígitos (ex.: 202012345678)
 *   servidor → 5 dígitos, hífen e dígito verificador (ex.: 12345-6), para professores e técnicos
 * O formato só identifica o perfil: ele não comprova vínculo e não concede nenhum acesso extra.
 */
export type Perfil = "aluno" | "servidor";
const MATRICULA_ALUNO_RE = /^\d{12}$/;
const MATRICULA_SERVIDOR_RE = /^\d{5}-\d$/;
export const EXEMPLO_MATRICULA = { aluno: "202012345678", servidor: "12345-6" } as const;
export const ROTULO_PERFIL: Record<Perfil, string> = { aluno: "Aluno(a)", servidor: "Professor(a) / Técnico(a)" };
/** Tamanho máximo do campo de matrícula em cada sessão (servidor: 00000-0). */
export const MATRICULA_MAX_PERFIL: Record<Perfil, number> = { aluno: 12, servidor: 7 };

/** Formata o que foi digitado no campo de matrícula da sessão escolhida. */
export function mascaraMatricula(valor: string, perfil: Perfil): string {
  const digitos = valor.replace(/\D/g, "");
  if (perfil === "aluno") return digitos.slice(0, 12);
  const d = digitos.slice(0, 6);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function perfilDaMatricula(matricula: string): Perfil | null {
  if (MATRICULA_ALUNO_RE.test(matricula)) return "aluno";
  if (MATRICULA_SERVIDOR_RE.test(matricula)) return "servidor";
  return null;
}

/** Política de senha atual (recomendações usuais de mercado). */
export const REQUISITOS_SENHA: { id: string; rotulo: string; ok: (s: string) => boolean }[] = [
  { id: "tamanho", rotulo: "8 caracteres ou mais", ok: (s) => s.length >= 8 },
  { id: "maiuscula", rotulo: "uma letra maiúscula", ok: (s) => /[A-ZÀ-Ý]/.test(s) },
  { id: "minuscula", rotulo: "uma letra minúscula", ok: (s) => /[a-zà-ý]/.test(s) },
  { id: "numero", rotulo: "um número", ok: (s) => /\d/.test(s) },
  { id: "simbolo", rotulo: "um símbolo (!@#$%…)", ok: (s) => /[^A-Za-zÀ-ÿ0-9\s]/.test(s) },
];

export function validarNome(nome: string): string | undefined {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length < 2) return "Informe nome e sobrenome.";
  if (nome.trim().length > 120) return "Nome muito longo.";
  return undefined;
}

export function validarEmail(email: string): string | undefined {
  if (!EMAIL_RE.test(email.trim())) return "E-mail inválido.";
  return undefined;
}

export function validarMatricula(matricula: string, perfil?: Perfil): string | undefined {
  if (!/^[\d-]*$/.test(matricula)) return "A matrícula aceita apenas números (e o hífen, para servidores).";
  if (perfil === "aluno" && perfilDaMatricula(matricula) !== "aluno") {
    return `A matrícula de aluno tem 12 dígitos (ex.: ${EXEMPLO_MATRICULA.aluno}).`;
  }
  if (perfil === "servidor" && perfilDaMatricula(matricula) !== "servidor") {
    return `A matrícula de professor/técnico segue o formato 00000-0 (ex.: ${EXEMPLO_MATRICULA.servidor}).`;
  }
  if (!perfilDaMatricula(matricula)) {
    return `Use a matrícula de aluno (12 dígitos, ex.: ${EXEMPLO_MATRICULA.aluno}) ou de professor/técnico (ex.: ${EXEMPLO_MATRICULA.servidor}).`;
  }
  return undefined;
}

export function validarSenha(senha: string): string | undefined {
  const faltando = REQUISITOS_SENHA.filter((r) => !r.ok(senha));
  if (faltando.length) return `A senha precisa de: ${faltando.map((r) => r.rotulo).join(", ")}.`;
  return undefined;
}

export function validarCadastro(input: CadastroInput, perfil?: Perfil): CadastroErrors {
  const errors: CadastroErrors = {
    nome: validarNome(input.nome),
    email: validarEmail(input.email),
    matricula: validarMatricula(input.matricula, perfil),
    senha: validarSenha(input.senha),
  };
  for (const k of Object.keys(errors) as (keyof CadastroInput)[]) {
    if (!errors[k]) delete errors[k];
  }
  return errors;
}

/** Nível a partir do XP: cada nível custa 500 XP. */
export const XP_POR_NIVEL = 500;

export function nivelDoXp(xp: number) {
  const nivel = Math.floor(xp / XP_POR_NIVEL) + 1;
  const xpNoNivel = xp % XP_POR_NIVEL;
  return { nivel, xpNoNivel, xpParaProximo: XP_POR_NIVEL, progresso: xpNoNivel / XP_POR_NIVEL };
}
