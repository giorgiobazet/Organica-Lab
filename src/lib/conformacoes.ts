/**
 * Análise conformacional de etano e butano em torno da ligação C2–C3.
 *
 * Geometria: carbonos sp³ ideais (109,47°), C–C 1,54 Å, C–H 1,09 Å.
 * Convenção do diedro φ (C1–C2–C3–C4 no butano; H–C–C–H de referência no etano):
 * 0° = eclipsada (sin-periplanar), 180° = anti.
 *
 * Energias de referência (kJ/mol), McMurry, "Química Orgânica", cap. 3–4:
 *   etano: barreira torsional 12 (3 interações H/H eclipsadas de 4,0 cada)
 *   butano: anti 0 · gauche 3,8 · eclipsada (CH₃/H) 16 · totalmente eclipsada (CH₃/CH₃) 19
 */
import { toMolBlock } from "./molblock";

export type Alcano = "etano" | "butano";

export type ConformacaoButano = "anti" | "gauche" | "eclipsada" | "totalmente eclipsada";
export type ConformacaoEtano = "alternada" | "eclipsada";

export const ENERGIAS_REF = {
  etano: { eclipsada: 12, alternada: 0 },
  butano: { anti: 0, gauche: 3.8, eclipsada: 16, "totalmente eclipsada": 19 },
  fonte: "McMurry, Química Orgânica (Cengage), cap. 3; Bruice, Química Orgânica, cap. 3",
} as const;

const rad = (d: number) => (d * Math.PI) / 180;

/**
 * Série de Fourier E(φ) = a0 + a1 cos φ + a2 cos 2φ + a3 cos 3φ ajustada exatamente aos
 * quatro valores de referência do butano (0°, 60°, 120°, 180°).
 */
const BUT = (() => {
  const { anti, gauche, eclipsada } = ENERGIAS_REF.butano;
  const total = ENERGIAS_REF.butano["totalmente eclipsada"];
  const a3 = ((total - anti) / 2 - (gauche - eclipsada)) / 3;
  const a1 = (total - anti) / 2 - a3;
  const a2 = ((total + anti) / 2 - (gauche + eclipsada) / 2) / 1.5;
  const a0 = (total + anti) / 2 - a2;
  return { a0, a1, a2, a3 };
})();

export function energia(alcano: Alcano, phiDeg: number): number {
  const p = rad(phiDeg);
  if (alcano === "etano") return (ENERGIAS_REF.etano.eclipsada / 2) * (1 + Math.cos(3 * p));
  const { a0, a1, a2, a3 } = BUT;
  return a0 + a1 * Math.cos(p) + a2 * Math.cos(2 * p) + a3 * Math.cos(3 * p);
}

export function curvaEnergia(alcano: Alcano, passo = 5) {
  const pts: { phi: number; energia: number }[] = [];
  for (let phi = 0; phi <= 360; phi += passo) pts.push({ phi, energia: +energia(alcano, phi).toFixed(2) });
  return pts;
}

/** Distância angular mínima entre dois ângulos (0–180). */
export function distAng(a: number, b: number) {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return Math.min(d, 360 - d);
}

export const ANGULOS_BUTANO: Record<ConformacaoButano, number[]> = {
  anti: [180],
  gauche: [60, 300],
  eclipsada: [120, 240],
  "totalmente eclipsada": [0, 360],
};

export const ANGULOS_ETANO: Record<ConformacaoEtano, number[]> = {
  alternada: [60, 180, 300],
  eclipsada: [0, 120, 240, 360],
};

/** Nome da conformação quando φ está a até `tol` graus de uma conformação-chave. */
export function nomeConformacao(alcano: Alcano, phi: number, tol = 8): string | null {
  const tabela: Record<string, number[]> = alcano === "butano" ? ANGULOS_BUTANO : ANGULOS_ETANO;
  for (const [nome, angs] of Object.entries(tabela)) {
    if (angs.some((a) => distAng(a, phi) <= tol)) return nome;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Geometria 3D
// ---------------------------------------------------------------------------

type V = [number, number, number];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V, s: number): V => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V): V => mul(a, 1 / Math.hypot(...a));

const CC = 1.54;
const CH = 1.09;
const TET = rad(109.47);

/** Posição de um substituinte de `centro`, a 109,47° do eixo `u` (centro → vizinho), girado `theta` em torno de u. */
function substituinte(centro: V, u: V, ref: V, theta: number, dist: number): V {
  const v = norm(sub(ref, mul(u, dot(ref, u))));
  const w = cross(u, v);
  const dir = add(mul(u, Math.cos(TET)), mul(add(mul(v, Math.cos(theta)), mul(w, Math.sin(theta))), Math.sin(TET)));
  return add(centro, mul(dir, dist));
}

export interface Geometria {
  elementos: string[];
  ligacoes: [number, number, number][];
  coords: number[];
  /** índices dos átomos ligados a cada carbono do eixo (frente = C2, trás = C3), para a projeção de Newman */
  frente: number[];
  tras: number[];
}

/**
 * Constrói etano ou butano com o diedro φ na ligação C2–C3.
 * Índices: 0 = C2 (frente), 1 = C3 (trás); no butano, 2 = C1 e 3 = C4.
 */
export function geometria(alcano: Alcano, phiDeg: number): Geometria {
  const phi = rad(phiDeg);
  const C2: V = [0, 0, 0];
  const C3: V = [CC, 0, 0];
  const ux: V = [1, 0, 0];
  const ref: V = [0, 1, 0];

  const elementos: string[] = ["C", "C"];
  const coords: V[] = [C2, C3];
  const ligacoes: [number, number, number][] = [[0, 1, 1]];
  const frente: number[] = [];
  const tras: number[] = [];
  const addAtom = (el: string, p: V, ligadoA: number) => {
    elementos.push(el);
    coords.push(p);
    ligacoes.push([ligadoA, coords.length - 1, 1]);
    return coords.length - 1;
  };

  if (alcano === "etano") {
    for (let k = 0; k < 3; k++) frente.push(addAtom("H", substituinte(C2, ux, ref, rad(120 * k), CH), 0));
    for (let k = 0; k < 3; k++) tras.push(addAtom("H", substituinte(C3, mul(ux, -1), ref, phi + rad(120 * k), CH), 1));
  } else {
    // C1 na frente (θ = 0), C4 atrás (θ = φ); H nos demais ângulos
    const C1 = substituinte(C2, ux, ref, 0, CC);
    const C4 = substituinte(C3, mul(ux, -1), ref, phi, CC);
    const i1 = addAtom("C", C1, 0);
    const i4 = addAtom("C", C4, 1);
    frente.push(i1);
    tras.push(i4);
    for (let k = 1; k < 3; k++) frente.push(addAtom("H", substituinte(C2, ux, ref, rad(120 * k), CH), 0));
    for (let k = 1; k < 3; k++) tras.push(addAtom("H", substituinte(C3, mul(ux, -1), ref, phi + rad(120 * k), CH), 1));
    // Hidrogênios das metilas, alternados em relação à ligação C2–C3
    for (const [ci, centro, viz] of [
      [i1, C1, C2],
      [i4, C4, C3],
    ] as [number, V, V][]) {
      const u = norm(sub(viz, centro));
      const outro = viz === C2 ? C3 : C2;
      const r = sub(outro, viz);
      for (let k = 0; k < 3; k++) addAtom("H", substituinte(centro, u, r, rad(180 + 120 * k), CH), ci);
    }
  }

  return { elementos, ligacoes, coords: coords.flat(), frente, tras };
}

export function sdfAlcano(alcano: Alcano, phiDeg: number): string {
  const g = geometria(alcano, phiDeg);
  return toMolBlock(g.elementos, g.ligacoes, g.coords, `${alcano} phi=${phiDeg}`);
}

/** Dados de referência dos confôrmeros do cicloexano (kJ/mol), McMurry/Klein. */
export const CICLOEXANO_REF = {
  cadeira: 0,
  "meia-cadeira": 45,
  "bote-torcido": 23,
  bote: 29,
  fonte: "McMurry, Química Orgânica, cap. 4; Klein, Química Orgânica, cap. 4",
} as const;

/**
 * Diferença experimental de energia entre as duas cadeiras (kJ/mol), McMurry cap. 4
 * (interação 1,3-diaxial CH₃/H = 3,8; gauche CH₃/CH₃ = 3,8; t-Bu/H = 11,4).
 */
export const CADEIRAS_REF: Record<
  string,
  { maisEstavel: "equatorial" | "diequatorial" | "iguais"; deltaE: number; explicacao: string }
> = {
  metilcicloexano: {
    maisEstavel: "equatorial",
    deltaE: 7.6,
    explicacao: "Metila axial sofre duas interações 1,3-diaxiais CH₃/H (2 × 3,8 kJ/mol). A 25 °C, ~95% das moléculas estão com a metila equatorial.",
  },
  "terc-butilcicloexano": {
    maisEstavel: "equatorial",
    deltaE: 22.8,
    explicacao: "O terc-butil é tão volumoso (2 × 11,4 kJ/mol de interações 1,3-diaxiais) que trava o anel: >99,9% com o grupo equatorial.",
  },
  "cis-12-dimetilcicloexano": {
    maisEstavel: "iguais",
    deltaE: 0,
    explicacao: "Nas duas cadeiras uma metila é axial e a outra equatorial: 1 gauche + 2 interações 1,3-diaxiais = 11,4 kJ/mol em ambas.",
  },
  "trans-12-dimetilcicloexano": {
    maisEstavel: "diequatorial",
    deltaE: 11.4,
    explicacao: "Diequatorial: só 1 interação gauche (3,8 kJ/mol). Diaxial: 4 interações 1,3-diaxiais (15,2 kJ/mol). Diferença de 11,4 kJ/mol.",
  },
};
