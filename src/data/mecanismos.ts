/**
 * Cenários da Arena de Mecanismos (SN1, SN2, E1, E2).
 * Previsões segundo Klein, "Química Orgânica", cap. 7–8, e McMurry, cap. 11:
 * o mecanismo dominante depende do substrato, do caráter do reagente (nucleófilo × base)
 * e do solvente.
 */

export type ClasseSubstrato = "metílico" | "primário" | "secundário" | "terciário";
export type TipoReagente = "nucleófilo forte, base fraca" | "base forte (e nucleófilo forte)" | "base forte volumosa" | "nucleófilo e base fracos";
export type Mecanismo = "SN1" | "SN2" | "E1" | "E2";

export const CLASSES: ClasseSubstrato[] = ["metílico", "primário", "secundário", "terciário"];
export const TIPOS: TipoReagente[] = ["nucleófilo forte, base fraca", "base forte (e nucleófilo forte)", "base forte volumosa", "nucleófilo e base fracos"];
export const MECANISMOS: Mecanismo[] = ["SN1", "SN2", "E1", "E2"];

/** Visualização 3D do momento-chave (só onde a geometria muda a química). */
export type Visual3D =
  | {
      tipo: "sn2";
      /** substituintes que "viram o guarda-chuva": elemento e rótulo */
      substituintes: { el: "H" | "C"; rotulo: string }[];
      /** prioridades CIP dos substituintes (1 = maior), na mesma ordem; o nucleófilo e o grupo abandonador ficam acima de todos */
      prioridades?: number[];
      nucleofilo: { el: string; rotulo: string; distFinal: number };
      abandonador: { el: string; rotulo: string };
    }
  | { tipo: "sn1"; substituintes: string[]; nucleofilo: string };

export interface Cenario {
  id: string;
  titulo: string;
  substratoSmiles: string;
  substratoNome: string;
  reagente: string;
  solvente: string;
  condicao?: string;
  classe: ClasseSubstrato;
  tipoReagente: TipoReagente;
  mecanismo: Mecanismo;
  produtoSmiles: string;
  produtoNome: string;
  explicacao: string;
  visual?: Visual3D;
}

export const CENARIOS: Cenario[] = [
  {
    id: "metil-tiolato",
    titulo: "Bromometano + metanotiolato de sódio",
    substratoSmiles: "CBr",
    substratoNome: "bromometano",
    reagente: "CH₃S⁻ Na⁺",
    solvente: "DMF (aprótico polar)",
    classe: "metílico",
    tipoReagente: "nucleófilo forte, base fraca",
    mecanismo: "SN2",
    produtoSmiles: "CSC",
    produtoNome: "dimetilsulfeto",
    explicacao: "Substrato metílico não forma carbocátion e não tem H em carbono β: só sobra SN2. Tiolatos são ótimos nucleófilos e o solvente aprótico os deixa 'nus' e reativos.",
    visual: {
      tipo: "sn2",
      substituintes: [
        { el: "H", rotulo: "H" },
        { el: "H", rotulo: "H" },
        { el: "H", rotulo: "H" },
      ],
      nucleofilo: { el: "S", rotulo: "CH₃S⁻", distFinal: 1.82 },
      abandonador: { el: "Br", rotulo: "Br⁻" },
    },
  },
  {
    id: "finkelstein",
    titulo: "1-Bromobutano + iodeto de sódio",
    substratoSmiles: "CCCCBr",
    substratoNome: "1-bromobutano",
    reagente: "NaI",
    solvente: "acetona (aprótico polar)",
    classe: "primário",
    tipoReagente: "nucleófilo forte, base fraca",
    mecanismo: "SN2",
    produtoSmiles: "CCCCI",
    produtoNome: "1-iodobutano",
    explicacao: "Reação de Finkelstein: substrato primário pouco impedido + I⁻ (nucleófilo excelente, base muito fraca). O NaBr insolúvel em acetona precipita e desloca o equilíbrio.",
    visual: {
      tipo: "sn2",
      substituintes: [
        { el: "H", rotulo: "H" },
        { el: "H", rotulo: "H" },
        { el: "C", rotulo: "C₃H₇" },
      ],
      nucleofilo: { el: "I", rotulo: "I⁻", distFinal: 2.14 },
      abandonador: { el: "Br", rotulo: "Br⁻" },
    },
  },
  {
    id: "walden",
    titulo: "(R)-2-Bromobutano + hidrogenossulfeto de sódio",
    substratoSmiles: "C[C@@H](Br)CC",
    substratoNome: "(R)-2-bromobutano",
    reagente: "NaSH",
    solvente: "DMF (aprótico polar)",
    classe: "secundário",
    tipoReagente: "nucleófilo forte, base fraca",
    mecanismo: "SN2",
    produtoSmiles: "C[C@H](S)CC",
    produtoNome: "(S)-butano-2-tiol",
    explicacao: "Secundário + nucleófilo forte e base fraca em solvente aprótico: SN2. O ataque dorsal inverte o guarda-chuva (inversão de Walden): o (R) vira (S), porque SH ocupa a prioridade 1 que era do Br.",
    visual: {
      tipo: "sn2",
      substituintes: [
        { el: "H", rotulo: "H" },
        { el: "C", rotulo: "CH₃" },
        { el: "C", rotulo: "C₂H₅" },
      ],
      prioridades: [4, 3, 2],
      nucleofilo: { el: "S", rotulo: "HS⁻", distFinal: 1.82 },
      abandonador: { el: "Br", rotulo: "Br⁻" },
    },
  },
  {
    id: "isopropil-etoxido",
    titulo: "2-Bromopropano + etóxido de sódio",
    substratoSmiles: "CC(C)Br",
    substratoNome: "2-bromopropano",
    reagente: "NaOCH₂CH₃",
    solvente: "etanol",
    classe: "secundário",
    tipoReagente: "base forte (e nucleófilo forte)",
    mecanismo: "E2",
    produtoSmiles: "C=CC",
    produtoNome: "propeno",
    explicacao: "Secundário + base forte: E2 predomina (~80% de propeno) sobre SN2, porque o C secundário já dificulta o ataque dorsal e a base encontra seis H β disponíveis.",
  },
  {
    id: "bromobutano-tbuok",
    titulo: "1-Bromobutano + terc-butóxido de potássio",
    substratoSmiles: "CCCCBr",
    substratoNome: "1-bromobutano",
    reagente: "(CH₃)₃CO⁻ K⁺",
    solvente: "terc-butanol",
    classe: "primário",
    tipoReagente: "base forte volumosa",
    mecanismo: "E2",
    produtoSmiles: "C=CCC",
    produtoNome: "but-1-eno",
    explicacao: "Mesmo em substrato primário, uma base volumosa não consegue chegar ao carbono para o SN2: ela arranca um H β da periferia e dá E2.",
  },
  {
    id: "tbubr-etoxido",
    titulo: "2-Bromo-2-metilpropano + etóxido de sódio",
    substratoSmiles: "CC(C)(C)Br",
    substratoNome: "2-bromo-2-metilpropano",
    reagente: "NaOCH₂CH₃",
    solvente: "etanol",
    classe: "terciário",
    tipoReagente: "base forte (e nucleófilo forte)",
    mecanismo: "E2",
    produtoSmiles: "C=C(C)C",
    produtoNome: "2-metilpropeno",
    explicacao: "Terciário bloqueia o SN2. Com base forte presente, a eliminação concertada (E2) é muito mais rápida que esperar a formação do carbocátion.",
  },
  {
    id: "solvolise",
    titulo: "2-Bromo-2-metilpropano em água/acetona",
    substratoSmiles: "CC(C)(C)Br",
    substratoNome: "2-bromo-2-metilpropano",
    reagente: "H₂O",
    solvente: "água/acetona (prótico)",
    condicao: "25 °C, sem base forte",
    classe: "terciário",
    tipoReagente: "nucleófilo e base fracos",
    mecanismo: "SN1",
    produtoSmiles: "CC(C)(C)O",
    produtoNome: "2-metilpropan-2-ol",
    explicacao: "Solvólise: o solvente prótico estabiliza o carbocátion terciário e a água, nucleófilo fraco, captura o cátion planar. Em temperatura baixa, SN1 domina sobre E1.",
    visual: { tipo: "sn1", substituintes: ["CH₃", "CH₃", "CH₃"], nucleofilo: "H₂O" },
  },
  {
    id: "desidratacao",
    titulo: "2-Metilbutan-2-ol + H₂SO₄ concentrado",
    substratoSmiles: "CCC(C)(C)O",
    substratoNome: "2-metilbutan-2-ol",
    reagente: "H₂SO₄ (cat.)",
    solvente: "sem solvente",
    condicao: "aquecimento",
    classe: "terciário",
    tipoReagente: "nucleófilo e base fracos",
    mecanismo: "E1",
    produtoSmiles: "CC=C(C)C",
    produtoNome: "2-metilbut-2-eno",
    explicacao: "O ácido protona o OH, que sai como água e gera o carbocátion terciário. Sem nucleófilo bom e com calor, a eliminação vence (E1) e dá o alceno mais substituído (Zaitsev).",
  },
];
