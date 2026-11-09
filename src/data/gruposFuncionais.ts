/**
 * Dados do jogo "Grupos Funcionais, Nomenclatura e Propriedades Físicas" (Orgânica 1, 2D).
 *
 * Propriedades a 1 atm / 20–25 °C. Fontes:
 *  - Ponto de ebulição e momento dipolar: CRC Handbook of Chemistry and Physics, 97ª ed.;
 *    NIST Chemistry WebBook (SRD 69).
 *  - Solubilidade em água: CRC Handbook, 97ª ed. (seção "Aqueous Solubility of Organic Compounds").
 */

export type GrupoFuncional =
  | "alcano"
  | "alceno"
  | "álcool"
  | "éter"
  | "aldeído"
  | "cetona"
  | "ácido carboxílico"
  | "éster"
  | "amina"
  | "amida";

export const GRUPOS: GrupoFuncional[] = [
  "alcano",
  "alceno",
  "álcool",
  "éter",
  "aldeído",
  "cetona",
  "ácido carboxílico",
  "éster",
  "amina",
  "amida",
];

export interface QuestaoNomenclatura {
  id: string;
  smiles: string;
  grupo: GrupoFuncional;
  nome: string;
  distratores: [string, string, string];
  dica: string;
}

export const QUESTOES_NOMENCLATURA: QuestaoNomenclatura[] = [
  { id: "butan-2-ol", smiles: "CC(O)CC", grupo: "álcool", nome: "butan-2-ol", distratores: ["butan-1-ol", "butan-3-ol", "2-metilpropan-1-ol"], dica: "Numere a cadeia pela ponta mais próxima da hidroxila: o OH fica no C2, nunca no C3." },
  { id: "2-metilpropan-1-ol", smiles: "CC(C)CO", grupo: "álcool", nome: "2-metilpropan-1-ol", distratores: ["2-metilpropan-2-ol", "2-metilbutan-1-ol", "butan-1-ol"], dica: "A cadeia principal tem 3 carbonos e contém o C ligado ao OH; a metila fica no C2." },
  { id: "butanal", smiles: "CCCC=O", grupo: "aldeído", nome: "butanal", distratores: ["butanona", "butan-1-ona", "butan-1-ol"], dica: "Carbonila na ponta da cadeia (C–H) é aldeído: sufixo -al, sem número (é sempre C1)." },
  { id: "butanona", smiles: "CCC(C)=O", grupo: "cetona", nome: "butanona", distratores: ["butanal", "butan-3-ona", "propanona"], dica: "Carbonila no meio da cadeia é cetona (-ona). Em 4 carbonos só existe uma posição possível, então o número pode ser omitido." },
  { id: "acido-propanoico", smiles: "CCC(=O)O", grupo: "ácido carboxílico", nome: "ácido propanoico", distratores: ["ácido butanoico", "ácido etanoico", "propanal"], dica: "O carbono da carboxila conta na cadeia: são 3 carbonos, prefixo prop-." },
  { id: "etoxietano", smiles: "CCOCC", grupo: "éter", nome: "etoxietano", distratores: ["metoxipropano", "propoxietano", "butan-1-ol"], dica: "Éter: o grupo menor vira prefixo alcóxi (etoxi-) e o maior é o nome base (etano)." },
  { id: "propanoato-de-metila", smiles: "CCC(=O)OC", grupo: "éster", nome: "propanoato de metila", distratores: ["etanoato de propila", "butanoato de metila", "metanoato de propila"], dica: "Éster: a parte com a carbonila dá o nome -oato (propanoato), o grupo ligado ao O vira 'de alquila'." },
  { id: "butan-1-amina", smiles: "CCCCN", grupo: "amina", nome: "butan-1-amina", distratores: ["butan-2-amina", "butanamida", "N-propilmetanamina"], dica: "Amina primária: nome do alcano + sufixo -amina com a posição do N." },
  { id: "n-metiletanamida", smiles: "CC(=O)NC", grupo: "amida", nome: "N-metiletanamida", distratores: ["propanamida", "N-etilmetanamida", "N,N-dimetilmetanamida"], dica: "A cadeia da amida contém a carbonila (etanamida); a metila no nitrogênio recebe o localizador N-." },
  { id: "3-metilbutan-1-ol", smiles: "CC(C)CCO", grupo: "álcool", nome: "3-metilbutan-1-ol", distratores: ["2-metilbutan-4-ol", "3-metilbutan-2-ol", "pentan-1-ol"], dica: "O OH tem prioridade na numeração: C1 é o carbono do OH, então a metila cai no C3. É o 'álcool isoamílico', aroma de banana dos ésteres." },
  { id: "but-1-eno", smiles: "C=CCC", grupo: "alceno", nome: "but-1-eno", distratores: ["but-2-eno", "but-3-eno", "butano"], dica: "A dupla começa no C1 quando numeramos pela ponta mais próxima dela." },
  { id: "2,2-dimetilpropano", smiles: "CC(C)(C)C", grupo: "alcano", nome: "2,2-dimetilpropano", distratores: ["2-metilbutano", "pentano", "1,1-dimetilpropano"], dica: "Cadeia principal de 3 carbonos com duas metilas no C2 (neopentano)." },
];

// ---------------------------------------------------------------------------
// Propriedades físicas
// ---------------------------------------------------------------------------

export type Forca = "dispersão de London" | "dipolo-dipolo" | "ligação de hidrogênio";

export interface CompostoPropriedades {
  id: string;
  nome: string;
  smiles: string;
  formula: string;
  grupo: GrupoFuncional;
  massaMolar: number;
  /** °C */
  pe: number;
  /** debye (fase gasosa) */
  dipolo: number;
  /** g/100 mL de água; null = miscível em qualquer proporção */
  solubilidade: number | null;
  forcas: Forca[];
  /** faz ligação de hidrogênio com a água (aceptor ou doador) */
  lhComAgua: boolean;
}

const C = (c: CompostoPropriedades) => c;

export const COMPOSTOS: Record<string, CompostoPropriedades> = {
  metano: C({ id: "metano", nome: "Metano", smiles: "C", formula: "CH₄", grupo: "alcano", massaMolar: 16.04, pe: -161.5, dipolo: 0, solubilidade: 0.0023, forcas: ["dispersão de London"], lhComAgua: false }),
  etano: C({ id: "etano", nome: "Etano", smiles: "CC", formula: "C₂H₆", grupo: "alcano", massaMolar: 30.07, pe: -88.6, dipolo: 0, solubilidade: 0.006, forcas: ["dispersão de London"], lhComAgua: false }),
  propano: C({ id: "propano", nome: "Propano", smiles: "CCC", formula: "C₃H₈", grupo: "alcano", massaMolar: 44.1, pe: -42.1, dipolo: 0.08, solubilidade: 0.0062, forcas: ["dispersão de London"], lhComAgua: false }),
  butano: C({ id: "butano", nome: "Butano", smiles: "CCCC", formula: "C₄H₁₀", grupo: "alcano", massaMolar: 58.12, pe: -0.5, dipolo: 0, solubilidade: 0.0061, forcas: ["dispersão de London"], lhComAgua: false }),
  pentano: C({ id: "pentano", nome: "Pentano", smiles: "CCCCC", formula: "C₅H₁₂", grupo: "alcano", massaMolar: 72.15, pe: 36.1, dipolo: 0, solubilidade: 0.0038, forcas: ["dispersão de London"], lhComAgua: false }),
  hexano: C({ id: "hexano", nome: "Hexano", smiles: "CCCCCC", formula: "C₆H₁₄", grupo: "alcano", massaMolar: 86.18, pe: 68.7, dipolo: 0, solubilidade: 0.0011, forcas: ["dispersão de London"], lhComAgua: false }),
  "2-metilbutano": C({ id: "2-metilbutano", nome: "2-Metilbutano", smiles: "CCC(C)C", formula: "C₅H₁₂", grupo: "alcano", massaMolar: 72.15, pe: 27.8, dipolo: 0.13, solubilidade: 0.0048, forcas: ["dispersão de London"], lhComAgua: false }),
  "2,2-dimetilpropano": C({ id: "2,2-dimetilpropano", nome: "2,2-Dimetilpropano", smiles: "CC(C)(C)C", formula: "C₅H₁₂", grupo: "alcano", massaMolar: 72.15, pe: 9.5, dipolo: 0, solubilidade: 0.0033, forcas: ["dispersão de London"], lhComAgua: false }),
  etoxietano: C({ id: "etoxietano", nome: "Etoxietano", smiles: "CCOCC", formula: "C₄H₁₀O", grupo: "éter", massaMolar: 74.12, pe: 34.6, dipolo: 1.15, solubilidade: 6.9, forcas: ["dispersão de London", "dipolo-dipolo"], lhComAgua: true }),
  butanal: C({ id: "butanal", nome: "Butanal", smiles: "CCCC=O", formula: "C₄H₈O", grupo: "aldeído", massaMolar: 72.11, pe: 74.8, dipolo: 2.72, solubilidade: 7.1, forcas: ["dispersão de London", "dipolo-dipolo"], lhComAgua: true }),
  butanona: C({ id: "butanona", nome: "Butanona", smiles: "CCC(C)=O", formula: "C₄H₈O", grupo: "cetona", massaMolar: 72.11, pe: 79.6, dipolo: 2.78, solubilidade: 27.5, forcas: ["dispersão de London", "dipolo-dipolo"], lhComAgua: true }),
  metanol: C({ id: "metanol", nome: "Metanol", smiles: "CO", formula: "CH₄O", grupo: "álcool", massaMolar: 32.04, pe: 64.7, dipolo: 1.7, solubilidade: null, forcas: ["dispersão de London", "dipolo-dipolo", "ligação de hidrogênio"], lhComAgua: true }),
  etanol: C({ id: "etanol", nome: "Etanol", smiles: "CCO", formula: "C₂H₆O", grupo: "álcool", massaMolar: 46.07, pe: 78.4, dipolo: 1.69, solubilidade: null, forcas: ["dispersão de London", "dipolo-dipolo", "ligação de hidrogênio"], lhComAgua: true }),
  "propan-1-ol": C({ id: "propan-1-ol", nome: "Propan-1-ol", smiles: "CCCO", formula: "C₃H₈O", grupo: "álcool", massaMolar: 60.1, pe: 97.2, dipolo: 1.55, solubilidade: null, forcas: ["dispersão de London", "dipolo-dipolo", "ligação de hidrogênio"], lhComAgua: true }),
  "butan-1-ol": C({ id: "butan-1-ol", nome: "Butan-1-ol", smiles: "CCCCO", formula: "C₄H₁₀O", grupo: "álcool", massaMolar: 74.12, pe: 117.7, dipolo: 1.66, solubilidade: 7.3, forcas: ["dispersão de London", "dipolo-dipolo", "ligação de hidrogênio"], lhComAgua: true }),
  "pentan-1-ol": C({ id: "pentan-1-ol", nome: "Pentan-1-ol", smiles: "CCCCCO", formula: "C₅H₁₂O", grupo: "álcool", massaMolar: 88.15, pe: 138.0, dipolo: 1.7, solubilidade: 2.2, forcas: ["dispersão de London", "dipolo-dipolo", "ligação de hidrogênio"], lhComAgua: true }),
  "hexan-1-ol": C({ id: "hexan-1-ol", nome: "Hexan-1-ol", smiles: "CCCCCCO", formula: "C₆H₁₄O", grupo: "álcool", massaMolar: 102.17, pe: 157.0, dipolo: 1.65, solubilidade: 0.59, forcas: ["dispersão de London", "dipolo-dipolo", "ligação de hidrogênio"], lhComAgua: true }),
  "acido-propanoico": C({ id: "acido-propanoico", nome: "Ácido propanoico", smiles: "CCC(=O)O", formula: "C₃H₆O₂", grupo: "ácido carboxílico", massaMolar: 74.08, pe: 141.2, dipolo: 1.75, solubilidade: null, forcas: ["dispersão de London", "dipolo-dipolo", "ligação de hidrogênio"], lhComAgua: true }),
};

export const FONTE_PROPRIEDADES = "CRC Handbook of Chemistry and Physics, 97ª ed.; NIST Chemistry WebBook";

export interface Serie {
  id: string;
  titulo: string;
  descricao: string;
  compostos: string[];
}

export const SERIES: Serie[] = [
  {
    id: "funcao",
    titulo: "Grupo funcional",
    descricao: "Massas molares parecidas (72–74 g/mol): a diferença vem só das forças intermoleculares.",
    compostos: ["pentano", "etoxietano", "butanal", "butanona", "butan-1-ol", "acido-propanoico"],
  },
  {
    id: "cadeia-alcool",
    titulo: "Tamanho da cadeia · álcoois",
    descricao: "Cada CH₂ a mais aumenta a dispersão de London e a parte apolar: sobe o PE, cai a solubilidade.",
    compostos: ["metanol", "etanol", "propan-1-ol", "butan-1-ol", "pentan-1-ol", "hexan-1-ol"],
  },
  {
    id: "cadeia-alcano",
    titulo: "Tamanho da cadeia · alcanos",
    descricao: "Só dispersão de London: o PE cresce com a área de contato entre as moléculas.",
    compostos: ["metano", "etano", "propano", "butano", "pentano", "hexano"],
  },
  {
    id: "ramificacao",
    titulo: "Ramificação · C₅H₁₂",
    descricao: "Mesma fórmula: quanto mais ramificada (mais esférica), menor a área de contato e menor o PE.",
    compostos: ["pentano", "2-metilbutano", "2,2-dimetilpropano"],
  },
];

/** Pares do desafio "Quem ferve primeiro?" (escolher o de MAIOR ponto de ebulição). */
export const DUELOS: { a: string; b: string; explicacao: string }[] = [
  { a: "etoxietano", b: "butan-1-ol", explicacao: "Mesma fórmula (C₄H₁₀O), mas só o álcool tem O–H para fazer ligação de hidrogênio entre suas moléculas: 117,7 °C contra 34,6 °C." },
  { a: "pentano", b: "2,2-dimetilpropano", explicacao: "Mesma fórmula, mas a cadeia linear tem mais área de contato para a dispersão de London: 36,1 °C contra 9,5 °C." },
  { a: "butanal", b: "butan-1-ol", explicacao: "O aldeído é até mais polar (2,72 D), mas não tem H ligado a O: ligação de hidrogênio vence dipolo-dipolo (117,7 °C contra 74,8 °C)." },
  { a: "acido-propanoico", b: "butan-1-ol", explicacao: "O ácido forma dímeros com duas ligações de hidrogênio, o que vale quase uma molécula com o dobro da massa: 141,2 °C contra 117,7 °C." },
  { a: "hexano", b: "pentano", explicacao: "Mesma força (só dispersão), cadeia maior: um CH₂ a mais eleva o PE em cerca de 30 °C nessa faixa (68,7 °C contra 36,1 °C)." },
  { a: "pentano", b: "butanal", explicacao: "Massas quase iguais, mas o butanal tem um dipolo forte na carbonila (2,72 D) que o pentano não tem: 74,8 °C contra 36,1 °C." },
];
