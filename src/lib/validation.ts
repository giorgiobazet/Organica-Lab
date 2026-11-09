export interface CadastroInput {
  nome: string;
  email: string;
  matricula: string;
  senha: string;
}

export type CadastroErrors = Partial<Record<keyof CadastroInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Matrícula institucional: exatamente 12 dígitos (ex.: 202012345678). */
export const MATRICULA_DIGITOS = 12;
const MATRICULA_RE = new RegExp(`^\\d{${MATRICULA_DIGITOS}}$`);

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

export function validarMatricula(matricula: string): string | undefined {
  if (!/^\d*$/.test(matricula)) return "A matrícula aceita apenas números.";
  if (!MATRICULA_RE.test(matricula)) return `A matrícula deve ter exatamente ${MATRICULA_DIGITOS} dígitos.`;
  return undefined;
}

export function validarSenha(senha: string): string | undefined {
  const faltando = REQUISITOS_SENHA.filter((r) => !r.ok(senha));
  if (faltando.length) return `A senha precisa de: ${faltando.map((r) => r.rotulo).join(", ")}.`;
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
