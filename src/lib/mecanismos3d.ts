/**
 * Geometrias 3D dos momentos-chave da Arena de Mecanismos.
 *
 * SN2: carbono central na origem, grupo abandonador no eixo +x, nucleófilo chegando por −x
 * (ataque dorsal a 180°). Os três substituintes "viram o guarda-chuva": o ângulo com o eixo +x
 * passa de 109,47° (tetraédrico, apontando para longe do abandonador) por 90° (estado de
 * transição bipiramidal trigonal) até 70,53° (tetraédrico invertido).
 *
 * SN1: carbocátion trigonal planar (sp²) com o orbital p vazio perpendicular ao plano,
 * acessível pelas duas faces.
 */
import type { Visual3D } from "@/data/mecanismos";

type V = [number, number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const DIST_CH = 1.09;
const DIST_CC = 1.53;
const DIST_C_BR = 1.94;
const LONGE = 3.6;

/** Rotação rígida para enquadrar a cena (não altera distâncias, ângulos nem quiralidade). */
function inclinar(p: V, ax: number, ay: number): V {
  const [x, y, z] = p;
  const y1 = y * Math.cos(ax) - z * Math.sin(ax);
  const z1 = y * Math.sin(ax) + z * Math.cos(ax);
  return [x * Math.cos(ay) + z1 * Math.sin(ay), y1, -x * Math.sin(ay) + z1 * Math.cos(ay)];
}
const VISTA_SN2 = { ax: rad(-35), ay: rad(-25) };
const VISTA_SN1 = { ax: rad(-68), ay: rad(15) };

export interface Quadro {
  elementos: string[];
  ligacoes: [number, number, number][];
  coords: number[];
  rotulos: { atom: number; text: string }[];
  /** configuração R/S do carbono central, quando definida (só com `prioridades`) */
  configuracao?: "R" | "S";
  fase: "reagentes" | "estado de transição" | "produtos";
}

/** R/S a partir de vetores (centro → grupos) ordenados por prioridade 1..4. */
export function rsDeVetores(p: V[]): "R" | "S" {
  const [a, b, c, d] = p;
  const ac: V = [a[0] - c[0], a[1] - c[1], a[2] - c[2]];
  const bc: V = [b[0] - c[0], b[1] - c[1], b[2] - c[2]];
  const cr: V = [ac[1] * bc[2] - ac[2] * bc[1], ac[2] * bc[0] - ac[0] * bc[2], ac[0] * bc[1] - ac[1] * bc[0]];
  const vol = -(cr[0] * d[0] + cr[1] * d[1] + cr[2] * d[2]);
  return vol > 0 ? "S" : "R";
}

type SN2 = Extract<Visual3D, { tipo: "sn2" }>;

function direcao(theta: number, phi: number): V {
  return [Math.cos(theta), Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi)];
}

/**
 * Azimutes dos substituintes. Com prioridades definidas, a ordem é escolhida para que o
 * reagente tenha a configuração `alvo` (a do SMILES do substrato).
 */
function azimutes(v: SN2, alvo: "R" | "S"): number[] {
  const base = [0, 120, 240].map(rad);
  if (!v.prioridades) return base;
  const cfg = configuracaoEm(v, base, 0);
  return cfg === alvo ? base : [base[0], base[2], base[1]];
}

function configuracaoEm(v: SN2, phis: number[], t: number): "R" | "S" | undefined {
  if (!v.prioridades) return undefined;
  const theta = rad(lerp(109.47, 70.53, easeInOut(t)));
  const subs = phis.map((phi) => direcao(theta, phi));
  // Antes do ET o grupo 1 é o abandonador (+x); depois, o nucleófilo (−x).
  const g1: V = t < 0.5 ? [1, 0, 0] : [-1, 0, 0];
  const ordem = [2, 3, 4].map((p) => subs[v.prioridades!.indexOf(p)]);
  return rsDeVetores([g1, ...ordem]);
}

export function quadroSN2(v: SN2, t: number, configuracaoInicial: "R" | "S" = "R"): Quadro {
  const e = easeInOut(t);
  const theta = rad(lerp(109.47, 70.53, e));
  const phis = azimutes(v, configuracaoInicial);
  const dLG = lerp(DIST_C_BR, LONGE, e);
  const dNu = lerp(LONGE, v.nucleofilo.distFinal, e);

  const elementos = ["C", v.abandonador.el, v.nucleofilo.el, ...v.substituintes.map((s) => s.el)];
  const coords: V[] = [
    [0, 0, 0],
    [dLG, 0, 0],
    [-dNu, 0, 0],
    ...v.substituintes.map((s, k) => {
      const d = direcao(theta, phis[k]);
      const r = s.el === "H" ? DIST_CH : DIST_CC;
      return [d[0] * r, d[1] * r, d[2] * r] as V;
    }),
  ];
  const ligacoes: [number, number, number][] = [
    [0, 3, 1],
    [0, 4, 1],
    [0, 5, 1],
  ];
  if (t < 0.6) ligacoes.push([0, 1, 1]);
  if (t > 0.4) ligacoes.push([0, 2, 1]);

  const fase = t < 0.4 ? "reagentes" : t > 0.6 ? "produtos" : "estado de transição";
  return {
    elementos,
    ligacoes,
    coords: coords.map((p) => inclinar(p, VISTA_SN2.ax, VISTA_SN2.ay)).flat(),
    rotulos: [
      { atom: 1, text: v.abandonador.rotulo },
      { atom: 2, text: v.nucleofilo.rotulo },
      ...v.substituintes.map((s, k) => ({ atom: 3 + k, text: s.rotulo })).filter((r) => r.text !== "H"),
    ],
    configuracao: t < 0.4 || t > 0.6 ? configuracaoEm(v, phis, t) : undefined,
    fase,
  };
}

type SN1 = Extract<Visual3D, { tipo: "sn1" }>;

export function geometriaSN1(v: SN1) {
  const elementos = ["C", ...v.substituintes.map(() => "C"), "O", "O"];
  const coords: V[] = [
    [0, 0, 0],
    ...[0, 120, 240].map((a) => [1.47 * Math.cos(rad(a)), 1.47 * Math.sin(rad(a)), 0] as V),
    [0, 0, 3.1],
    [0, 0, -3.1],
  ];
  return {
    elementos,
    ligacoes: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
    ] as [number, number, number][],
    coords: coords.map((p) => inclinar(p, VISTA_SN1.ax, VISTA_SN1.ay)).flat(),
    rotulos: [
      { atom: 0, text: "C⁺" },
      ...v.substituintes.map((s, k) => ({ atom: 1 + k, text: s })),
      { atom: 4, text: v.nucleofilo },
      { atom: 5, text: v.nucleofilo },
    ],
    /** lobos do orbital p vazio */
    lobos: ([1.05, -1.05] as const).map((z) => {
      const [x, y, zz] = inclinar([0, 0, z], VISTA_SN1.ax, VISTA_SN1.ay);
      return { center: { x, y, z: zz }, radius: 0.85 };
    }),
  };
}
