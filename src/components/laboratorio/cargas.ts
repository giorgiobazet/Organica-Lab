/**
 * Cargas parciais de Gasteiger–Marsili (Tetrahedron 1980, 36, 3219), calculadas a partir da
 * estrutura exibida (elemento, ligações e ordens de ligação). Base do mapa de cargas do
 * laboratório: uma aproximação qualitativa do potencial eletrostático, não um cálculo quântico.
 */

export interface AtomoCarga {
  elem: string;
  /** Índices dos vizinhos. */
  ligacoes: number[];
  /** Ordem de cada ligação (1, 2, 3; aromáticas em Kekulé). */
  ordens: number[];
  /** Carga formal (ex.: N⁺ do nitro). */
  cargaFormal?: number;
}

// Parâmetros a, b, c de χ = a + b·q + c·q² (Gasteiger & Marsili, 1980), por elemento e hibridização.
const PARAM: Record<string, [number, number, number]> = {
  H: [7.17, 6.24, -0.56],
  C3: [7.98, 9.18, 1.88],
  C2: [8.79, 9.32, 1.51],
  C1: [10.39, 9.45, 0.73],
  N3: [11.54, 10.82, 1.36],
  N2: [12.87, 11.15, 0.85],
  N1: [15.68, 11.7, -0.27],
  O3: [14.18, 12.92, 1.39],
  O2: [17.07, 13.79, 0.47],
  F: [14.66, 13.85, 2.31],
  Cl: [11.0, 9.69, 1.35],
  Br: [10.08, 8.47, 1.16],
  I: [9.9, 7.96, 0.96],
  S3: [10.14, 9.13, 1.38],
  S2: [10.88, 9.49, 1.33],
  P3: [8.9, 8.24, 0.96],
};

/** Hibridização pela ordem das ligações: tripla ou duas duplas → sp; uma dupla → sp²; senão sp³. */
function hibridizacao(a: AtomoCarga, atomos: AtomoCarga[]): 1 | 2 | 3 {
  const duplas = a.ordens.filter((o) => o === 2).length;
  if (a.ordens.includes(3) || duplas >= 2) return a.elem === "S" ? 3 : 1;
  if (duplas === 1) return 2;
  // N e O ligados a C ou N sp² conjugam o par livre (amida, anilina, ácido, éster, fenol): sp²,
  // como na percepção de hibridização por conjugação das implementações de referência. Sobre S e P
  // (sulfonas, fosfatos) não há essa conjugação.
  const conjugado = (j: number) => /^[CN]$/i.test(atomos[j].elem) && atomos[j].ordens.some((o) => o >= 2);
  if ((a.elem === "N" || a.elem === "O") && a.ligacoes.some(conjugado)) return 2;
  return 3;
}

function chave(a: AtomoCarga, atomos: AtomoCarga[]): string | null {
  const e = a.elem.length > 1 ? a.elem[0].toUpperCase() + a.elem.slice(1).toLowerCase() : a.elem.toUpperCase();
  if (e === "H" || e === "F" || e === "Cl" || e === "Br" || e === "I") return e;
  const h = hibridizacao({ ...a, elem: e }, atomos);
  if (e === "S" || e === "P") return `${e}${h === 3 ? 3 : 2}` in PARAM ? `${e}${h === 3 ? 3 : 2}` : `${e}3`;
  return `${e}${h}` in PARAM ? `${e}${h}` : null;
}

/** Cargas de Gasteiger (6 iterações, amortecimento 0,5ⁿ). Átomos sem parâmetros ficam com a carga formal. */
export function cargasGasteiger(atomos: AtomoCarga[], iteracoes = 6): number[] {
  const p = atomos.map((a) => {
    const k = chave(a, atomos);
    return k ? PARAM[k] : null;
  });
  const q = atomos.map((a) => a.cargaFormal ?? 0);
  // χ⁺ (eletronegatividade do cátion): a + b + c; para H, 20,02 (valor especial do método).
  const chiMais = p.map((x, i) => (x ? (atomos[i].elem.toUpperCase() === "H" ? 20.02 : x[0] + x[1] + x[2]) : 0));
  let fator = 1;
  for (let it = 0; it < iteracoes; it++) {
    fator *= 0.5;
    const chi = p.map((x, i) => (x ? x[0] + x[1] * q[i] + x[2] * q[i] * q[i] : 0));
    const dq = new Array<number>(atomos.length).fill(0);
    atomos.forEach((a, i) => {
      if (!p[i]) return;
      for (const j of a.ligacoes) {
        if (j <= i || !p[j]) continue;
        // A carga flui do menos para o mais eletronegativo, normalizada pelo χ⁺ do doador.
        const d = chi[j] > chi[i] ? (chi[j] - chi[i]) / chiMais[i] : (chi[j] - chi[i]) / chiMais[j];
        dq[i] += fator * d;
        dq[j] -= fator * d;
      }
    });
    for (let i = 0; i < q.length; i++) q[i] += dq[i];
  }
  return q;
}
