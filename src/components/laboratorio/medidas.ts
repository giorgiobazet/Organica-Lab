/** Geometria das medições feitas clicando nos átomos do modelo 3D. */

export type TipoMedida = "distancia" | "angulo" | "torcao";

export interface Ponto {
  x: number;
  y: number;
  z: number;
}

export interface AtomoMedido extends Ponto {
  indice: number;
  rotulo: string;
}

export interface Medida {
  tipo: TipoMedida;
  atomos: AtomoMedido[];
  valor: number;
}

export const ATOMOS_POR_MEDIDA: Record<TipoMedida, number> = { distancia: 2, angulo: 3, torcao: 4 };

export const NOME_MEDIDA: Record<TipoMedida, string> = {
  distancia: "Distância",
  angulo: "Ângulo de ligação",
  torcao: "Ângulo de torção (diedro)",
};

const sub = (a: Ponto, b: Ponto): Ponto => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: Ponto, b: Ponto) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Ponto, b: Ponto): Ponto => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const norma = (a: Ponto) => Math.sqrt(dot(a, a));
const graus = (rad: number) => (rad * 180) / Math.PI;

/** Distância em Å. */
export function distancia(a: Ponto, b: Ponto): number {
  return norma(sub(a, b));
}

/** Ângulo a–b–c (vértice em b), em graus. */
export function angulo(a: Ponto, b: Ponto, c: Ponto): number {
  const u = sub(a, b);
  const v = sub(c, b);
  const cos = dot(u, v) / (norma(u) * norma(v));
  return graus(Math.acos(Math.min(1, Math.max(-1, cos))));
}

/** Ângulo diedro a–b–c–d (convenção IUPAC, de −180° a +180°). */
export function torcao(a: Ponto, b: Ponto, c: Ponto, d: Ponto): number {
  const b1 = sub(b, a);
  const b2 = sub(c, b);
  const b3 = sub(d, c);
  const n1 = cross(b1, b2);
  const n2 = cross(b2, b3);
  // φ = atan2(|b2| b1·(b2×b3), (b1×b2)·(b2×b3)): positivo quando a ligação da frente gira no
  // sentido horário para eclipsar a de trás, olhando de b para c (IUPAC Gold Book, "torsion angle").
  return graus(Math.atan2(norma(b2) * dot(b1, n2), dot(n1, n2)));
}

export function calcular(tipo: TipoMedida, p: Ponto[]): number {
  if (tipo === "distancia") return distancia(p[0], p[1]);
  if (tipo === "angulo") return angulo(p[0], p[1], p[2]);
  return torcao(p[0], p[1], p[2], p[3]);
}

export function textoValor(m: Medida): string {
  const v = m.valor.toLocaleString("pt-BR", { minimumFractionDigits: m.tipo === "distancia" ? 3 : 1, maximumFractionDigits: m.tipo === "distancia" ? 3 : 1 });
  return m.tipo === "distancia" ? `${v} Å` : `${v}°`;
}

export function centro(p: Ponto[]): Ponto {
  const n = p.length;
  return { x: p.reduce((s, a) => s + a.x, 0) / n, y: p.reduce((s, a) => s + a.y, 0) / n, z: p.reduce((s, a) => s + a.z, 0) / n };
}
