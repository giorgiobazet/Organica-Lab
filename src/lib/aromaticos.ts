/**
 * Motor de regras do Deckbuilder de Reações Aromáticas (SEAr, oxidação, redução e SNAr).
 *
 * Efeitos orientadores (Klein cap. 19; McMurry cap. 16):
 *   ativadores fortes o/p: NH₂, OH · ativador fraco o/p: CH₃ · desativadores o/p: Cl, Br
 *   desativadores meta: NO₂, SO₃H, COOH, COCH₃
 * Com vários grupos, o ativador mais forte dita a posição; entre as posições que ele permite,
 * preferem-se as que os outros grupos também favorecem; a posição "entre" dois substituintes
 * (1,3) é evitada por impedimento estérico quando há alternativa.
 */
import { toMolBlock } from "./molblock";

export type Grupo = "NO2" | "Br" | "Cl" | "SO3H" | "CH3" | "COCH3" | "COOH" | "NH2" | "OH";
export type Anel = (Grupo | null)[]; // 6 posições, sentido horário

export const INFO_GRUPO: Record<Grupo, { rotulo: string; smiles: string; rank: number; orienta: "op" | "m"; efeito: string }> = {
  NH2: { rotulo: "NH₂", smiles: "N", rank: 5, orienta: "op", efeito: "ativador forte, orto/para" },
  OH: { rotulo: "OH", smiles: "O", rank: 5, orienta: "op", efeito: "ativador forte, orto/para" },
  CH3: { rotulo: "CH₃", smiles: "C", rank: 3, orienta: "op", efeito: "ativador fraco, orto/para" },
  Cl: { rotulo: "Cl", smiles: "Cl", rank: 2, orienta: "op", efeito: "desativador fraco, orto/para" },
  Br: { rotulo: "Br", smiles: "Br", rank: 2, orienta: "op", efeito: "desativador fraco, orto/para" },
  COCH3: { rotulo: "COCH₃", smiles: "C(C)=O", rank: 1, orienta: "m", efeito: "desativador, meta" },
  COOH: { rotulo: "COOH", smiles: "C(=O)O", rank: 1, orienta: "m", efeito: "desativador, meta" },
  SO3H: { rotulo: "SO₃H", smiles: "S(=O)(=O)O", rank: 1, orienta: "m", efeito: "desativador forte, meta" },
  NO2: { rotulo: "NO₂", smiles: "[N+](=O)[O-]", rank: 0, orienta: "m", efeito: "desativador forte, meta" },
};

const DESATIVA_FC: Grupo[] = ["NO2", "SO3H", "COOH", "COCH3"];

export type CartaId = "nitracao" | "bromacao" | "cloracao" | "sulfonacao" | "alquilacao" | "acilacao" | "oxidacao" | "reducao" | "snar";

export interface Carta {
  id: CartaId;
  nome: string;
  reagentes: string;
  tipo: "SEAr" | "oxidação" | "redução" | "SNAr";
  /** grupo adicionado (SEAr) */
  grupo?: Grupo;
  descricao: string;
}

export const CARTAS: Carta[] = [
  { id: "nitracao", nome: "Nitração", reagentes: "HNO₃ / H₂SO₄", tipo: "SEAr", grupo: "NO2", descricao: "Eletrófilo: íon nitrônio NO₂⁺." },
  { id: "bromacao", nome: "Bromação", reagentes: "Br₂ / FeBr₃", tipo: "SEAr", grupo: "Br", descricao: "O ácido de Lewis polariza o Br₂ e gera Br⁺." },
  { id: "cloracao", nome: "Cloração", reagentes: "Cl₂ / AlCl₃", tipo: "SEAr", grupo: "Cl", descricao: "O ácido de Lewis polariza o Cl₂ e gera Cl⁺." },
  { id: "sulfonacao", nome: "Sulfonação", reagentes: "SO₃ / H₂SO₄", tipo: "SEAr", grupo: "SO3H", descricao: "Eletrófilo: SO₃ (ou HSO₃⁺). Reação reversível." },
  { id: "alquilacao", nome: "Alquilação de Friedel-Crafts", reagentes: "CH₃Cl / AlCl₃", tipo: "SEAr", grupo: "CH3", descricao: "Carbocátion (ou complexo) metila como eletrófilo." },
  { id: "acilacao", nome: "Acilação de Friedel-Crafts", reagentes: "CH₃COCl / AlCl₃", tipo: "SEAr", grupo: "COCH3", descricao: "Íon acílio CH₃C≡O⁺, sem rearranjo." },
  { id: "oxidacao", nome: "Oxidação da cadeia lateral", reagentes: "KMnO₄ / H₂O, Δ", tipo: "oxidação", descricao: "Alquila com H benzílico vira COOH." },
  { id: "reducao", nome: "Redução do grupo nitro", reagentes: "Sn / HCl (ou H₂ / Pd)", tipo: "redução", descricao: "Ar–NO₂ → Ar–NH₂." },
  { id: "snar", nome: "Substituição nucleofílica aromática", reagentes: "NaOH, Δ (SNAr)", tipo: "SNAr", descricao: "Troca halogênio por OH quando há NO₂ em orto/para." },
];

const viz = (i: number, k: number) => (((i + k) % 6) + 6) % 6;

/** Posições para onde um grupo na posição i orienta. */
function orientadas(anel: Anel, i: number): number[] {
  const g = anel[i]!;
  return INFO_GRUPO[g].orienta === "op" ? [viz(i, 1), viz(i, -1), viz(i, 3)] : [viz(i, 2), viz(i, -2)];
}

export interface Resultado {
  ok: boolean;
  motivo?: string;
  /** posições válidas para o novo grupo (SEAr) */
  posicoes?: number[];
  /** anel após a reação (oxidação, redução, SNAr, ou SEAr em anel vazio) */
  anel?: Anel;
  nota?: string;
}

/** Avalia se a carta pode ser jogada e, para SEAr, quais posições ela atinge. */
export function avaliar(anel: Anel, carta: Carta): Resultado {
  const grupos = anel.map((g, i) => (g ? i : -1)).filter((i) => i >= 0);
  const tem = (g: Grupo) => anel.includes(g);

  if (carta.tipo === "SEAr") {
    if (grupos.length >= 3) return { ok: false, motivo: "O anel já tem três substituintes: os alvos deste jogo não passam disso." };
    if (tem("NH2")) {
      return {
        ok: false,
        motivo:
          "Anilina livre não serve para SEAr direta: com Br₂ ela tribromina na hora, o HNO₃ a oxida e o AlCl₃ se complexa com o nitrogênio. Reduza o NO₂ só no final.",
      };
    }
    if ((carta.id === "alquilacao" || carta.id === "acilacao") && anel.some((g) => g && DESATIVA_FC.includes(g))) {
      return { ok: false, motivo: "Friedel-Crafts não funciona em anéis desativados por NO₂, SO₃H, COOH ou C=O: o anel fica pobre demais em elétrons." };
    }
    if (!grupos.length) return { ok: true, posicoes: [0] };

    const maxRank = Math.max(...grupos.map((i) => INFO_GRUPO[anel[i]!].rank));
    const dominantes = grupos.filter((i) => INFO_GRUPO[anel[i]!].rank === maxRank);
    let pos = Array.from(new Set(dominantes.flatMap((i) => orientadas(anel, i)))).filter((p) => !anel[p]);
    const outros = grupos.filter((i) => !dominantes.includes(i));
    if (outros.length) {
      const reforco = pos.filter((p) => outros.every((i) => orientadas(anel, i).includes(p)));
      if (reforco.length) pos = reforco;
    }
    const semEntre = pos.filter((p) => !(anel[viz(p, 1)] && anel[viz(p, -1)]));
    if (semEntre.length) pos = semEntre;
    if (!pos.length) return { ok: false, motivo: "Nenhuma posição livre é ativada pelos grupos presentes." };
    const nota =
      grupos.length === 1 && INFO_GRUPO[anel[grupos[0]]!].orienta === "op"
        ? "Orto e para se formam; o para costuma ser o principal (menos impedimento estérico) e é separável por cristalização."
        : undefined;
    return { ok: true, posicoes: pos, nota };
  }

  if (carta.tipo === "oxidação") {
    if (tem("NH2") || tem("OH")) return { ok: false, motivo: "KMnO₄ quente destrói anéis com NH₂ ou OH livres (oxidação do anel)." };
    if (!tem("CH3")) return { ok: false, motivo: "Não há carbono benzílico com H para oxidar." };
    return { ok: true, anel: anel.map((g) => (g === "CH3" ? "COOH" : g)) };
  }

  if (carta.tipo === "redução") {
    if (!tem("NO2")) return { ok: false, motivo: "Não há grupo nitro para reduzir." };
    return { ok: true, anel: anel.map((g) => (g === "NO2" ? "NH2" : g)) };
  }

  // SNAr: halogênio com NO₂ em orto ou para
  const alvo = grupos.find((i) => (anel[i] === "Cl" || anel[i] === "Br") && [viz(i, 1), viz(i, -1), viz(i, 3)].some((p) => anel[p] === "NO2"));
  if (alvo === undefined) {
    return { ok: false, motivo: "SNAr exige um halogênio com grupo fortemente retirador (NO₂) em orto ou para, que estabiliza o complexo de Meisenheimer." };
  }
  const novo = [...anel];
  novo[alvo] = "OH";
  return { ok: true, anel: novo };
}

export function aplicarSEAr(anel: Anel, grupo: Grupo, pos: number): Anel {
  const novo = [...anel];
  novo[pos] = grupo;
  return novo;
}

/** Chave canônica (invariante a rotação e reflexão do anel). */
export function chave(anel: Anel): string {
  const strs: string[] = [];
  for (let r = 0; r < 6; r++) {
    for (const dir of [1, -1]) {
      strs.push(Array.from({ length: 6 }, (_, k) => anel[viz(r, dir * k)] ?? "H").join("|"));
    }
  }
  return strs.sort()[0];
}

/** SMILES de Kekulé (para o bastão 2D com ligações alternadas). */
export function smilesDe(anel: Anel): string {
  const sub = (i: number) => (anel[i] ? `(${INFO_GRUPO[anel[i]!].smiles})` : "");
  return `C1${sub(0)}=C${sub(1)}C${sub(2)}=C${sub(3)}C${sub(4)}=C1${sub(5)}`;
}

/** Pares de grupos não-H vizinhos (orto): impedimento estérico. */
export function paresOrto(anel: Anel): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < 6; i++) if (anel[i] && anel[viz(i, 1)]) out.push([i, viz(i, 1)]);
  return out;
}

// ---------------------------------------------------------------------------
// Geometria 3D (comprimentos e ângulos padrão, anel planar)
// ---------------------------------------------------------------------------

type V = [number, number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V, s: number): V => [a[0] * s, a[1] * s, a[2] * s];

export interface Geometria3D {
  sdf: string;
  /** átomos de cada substituinte, por posição do anel */
  atomosPorPosicao: number[][];
  /** átomo do anel (carbono) em cada posição */
  carbonos: number[];
}

export function geometria3D(anel: Anel): Geometria3D {
  const el: string[] = [];
  const xyz: V[] = [];
  const lig: [number, number, number][] = [];
  const add3 = (e: string, p: V) => {
    el.push(e);
    xyz.push(p);
    return el.length - 1;
  };
  const R = 1.39;
  const carbonos: number[] = [];
  const dirs: V[] = [];
  for (let i = 0; i < 6; i++) {
    const a = rad(90 - 60 * i);
    const u: V = [Math.cos(a), Math.sin(a), 0];
    dirs.push(u);
    carbonos.push(add3("C", mul(u, R)));
  }
  for (let i = 0; i < 6; i++) lig.push([carbonos[i], carbonos[(i + 1) % 6], i % 2 === 0 ? 2 : 1]);

  const atomosPorPosicao: number[][] = [];
  for (let i = 0; i < 6; i++) {
    const u = dirs[i];
    const w: V = [-u[1], u[0], 0]; // tangente no plano
    const n: V = [0, 0, 1];
    const c = xyz[carbonos[i]];
    const g = anel[i];
    const ats: number[] = [];
    const liga = (a: number, b: number, o = 1) => lig.push([a, b, o]);
    const plano = (base: V, dist: number, ang: number, lado: 1 | -1): V => add(base, add(mul(u, dist * Math.cos(rad(ang))), mul(w, lado * dist * Math.sin(rad(ang)))));
    const metila = (centro: V, idx: number, eixo: V) => {
      for (let k = 0; k < 3; k++) {
        const phi = rad(90 + 120 * k);
        const perp = add(mul(w, Math.cos(phi)), mul(n, Math.sin(phi)));
        const d = add(mul(eixo, Math.cos(rad(70.5))), mul(perp, Math.sin(rad(70.5))));
        const h = add3("H", add(centro, mul(d, 1.09)));
        liga(idx, h);
        ats.push(h);
      }
    };
    if (!g) {
      const h = add3("H", add(c, mul(u, 1.08)));
      liga(carbonos[i], h);
      atomosPorPosicao.push([]);
      continue;
    }
    if (g === "Br" || g === "Cl") {
      const x = add3(g, add(c, mul(u, g === "Br" ? 1.9 : 1.74)));
      liga(carbonos[i], x);
      ats.push(x);
    } else if (g === "CH3") {
      const p = add(c, mul(u, 1.51));
      const x = add3("C", p);
      liga(carbonos[i], x);
      ats.push(x);
      metila(p, x, u);
    } else if (g === "NO2" || g === "NH2") {
      const p = add(c, mul(u, g === "NO2" ? 1.47 : 1.4));
      const nN = add3("N", p);
      liga(carbonos[i], nN);
      ats.push(nN);
      for (const lado of [1, -1] as const) {
        const a = g === "NO2" ? add3("O", plano(p, 1.22, 62, lado)) : add3("H", plano(p, 1.01, 60, lado));
        liga(nN, a, g === "NO2" && lado === 1 ? 2 : 1);
        ats.push(a);
      }
    } else if (g === "OH") {
      const p = add(c, mul(u, 1.36));
      const o = add3("O", p);
      liga(carbonos[i], o);
      const h = add3("H", plano(p, 0.96, 71, 1));
      liga(o, h);
      ats.push(o, h);
    } else if (g === "COOH" || g === "COCH3") {
      const p = add(c, mul(u, 1.49));
      const cc = add3("C", p);
      liga(carbonos[i], cc);
      const o = add3("O", plano(p, 1.21, 60, 1));
      liga(cc, o, 2);
      ats.push(cc, o);
      if (g === "COOH") {
        const po = plano(p, 1.34, 60, -1);
        const oh = add3("O", po);
        liga(cc, oh);
        const h = add3("H", add(po, mul(u, 0.97)));
        liga(oh, h);
        ats.push(oh, h);
      } else {
        const pm = plano(p, 1.51, 60, -1);
        const m = add3("C", pm);
        liga(cc, m);
        ats.push(m);
        const eixo: V = mul(add(pm, mul(p, -1)), 1 / 1.51);
        metila(pm, m, eixo);
      }
    } else if (g === "SO3H") {
      const p = add(c, mul(u, 1.77));
      const s = add3("S", p);
      liga(carbonos[i], s);
      ats.push(s);
      for (let k = 0; k < 3; k++) {
        const phi = rad(90 + 120 * k);
        const perp = add(mul(w, Math.cos(phi)), mul(n, Math.sin(phi)));
        const d = add(mul(u, Math.cos(rad(73))), mul(perp, Math.sin(rad(73))));
        const dist = k === 2 ? 1.57 : 1.43;
        const po = add(p, mul(d, dist));
        const o = add3("O", po);
        liga(s, o, k === 2 ? 1 : 2);
        ats.push(o);
        if (k === 2) {
          const h = add3("H", add(po, mul(u, 0.97)));
          liga(o, h);
          ats.push(h);
        }
      }
    }
    atomosPorPosicao.push(ats);
  }

  // Cargas formais do nitro (N⁺, O⁻) para o SDF
  const cargas = el.map(() => 0);
  lig.forEach(([a, b, o]) => {
    if (el[a] === "N" && el[b] === "O" && o === 1 && anel.includes("NO2")) {
      cargas[a] = 1;
      cargas[b] = -1;
    }
  });
  return { sdf: toMolBlock(el, lig, xyz.flat(), "aromático", cargas), atomosPorPosicao, carbonos };
}
