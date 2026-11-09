export interface CadastroInput {
  nome: string;
  email: string;
  matricula: string;
  senha: string;
}

export type CadastroErrors = Partial<Record<keyof CadastroInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MATRICULA_RE = /^\d{8,12}$/;

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

export function validarMatricula(matricula: string): string | undefined {
  if (!/^\d*$/.test(matricula)) return "A matrícula aceita apenas números.";
  if (!MATRICULA_RE.test(matricula)) return "A matrícula deve ter de 8 a 12 dígitos.";
  return undefined;
}

export function validarSenha(senha: string): string | undefined {
  if (senha.length < 6) return "A senha precisa de pelo menos 6 caracteres.";
  return undefined;
}

export function validarCadastro(input: CadastroInput): CadastroErrors {
  const errors: CadastroErrors = {
    nome: validarNome(input.nome),
    email: validarEmail(input.email),
    matricula: validarMatricula(input.matricula),
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
