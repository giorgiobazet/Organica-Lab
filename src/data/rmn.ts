/**
 * Quebra-cabeça de RMN de ¹H: escolher, entre isômeros, a estrutura do espectro.
 * Sinais (CDCl₃) iguais aos do CSI Químico; faixas típicas usadas nas explicações: Pavia, tabelas de δ.
 */
export const FONTE_RMN = "RMN de ¹H em CDCl₃: valores de referência de Pavia (Introdução à Espectroscopia) e Silverstein; faixas típicas de δ: tabelas de Pavia.";

export interface SinalRMN {
  delta: number;
  mult: "s" | "d" | "t" | "q" | "m";
  n: number;
  atrib: string;
}

export interface Candidata {
  nome: string;
  smiles: string;
  /** Por que o espectro dela seria diferente (para as erradas). */
  porque?: string;
}

export interface PuzzleRMN {
  id: string;
  formula: string;
  sinais: SinalRMN[];
  candidatas: Candidata[];
  correta: number;
  resumo: string;
}

export const PUZZLES_RMN: PuzzleRMN[] = [
  {
    id: "etanol",
    formula: "C₂H₆O",
    sinais: [
      { delta: 3.69, mult: "q", n: 2, atrib: "CH₂–O (vizinho de CH₃)" },
      { delta: 2.1, mult: "s", n: 1, atrib: "O–H (largo, troca; δ varia)" },
      { delta: 1.22, mult: "t", n: 3, atrib: "CH₃ (vizinho de CH₂)" },
    ],
    candidatas: [
      { nome: "Etanol", smiles: "CCO" },
      { nome: "Éter dimetílico", smiles: "COC", porque: "Os 6 H são equivalentes: haveria um único singleto (~3,2 ppm), sem quarteto nem tripleto." },
    ],
    correta: 0,
    resumo: "Quarteto 2H + tripleto 3H é a assinatura de um grupo etila; o CH₂ em ~3,7 ppm está ligado a O, e o singleto que integra 1H é o OH.",
  },
  {
    id: "butanona",
    formula: "C₄H₈O",
    sinais: [
      { delta: 2.44, mult: "q", n: 2, atrib: "CH₂–C=O (vizinho de CH₃)" },
      { delta: 2.14, mult: "s", n: 3, atrib: "CH₃–C=O (sem vizinhos com H)" },
      { delta: 1.06, mult: "t", n: 3, atrib: "CH₃ do etila" },
    ],
    candidatas: [
      { nome: "Butanal", smiles: "CCCC=O", porque: "Aldeído: haveria um sinal de CHO em ~9,8 ppm, e nenhum CH₃ em singleto." },
      { nome: "Butanona", smiles: "CCC(C)=O" },
      { nome: "2-Metilpropanal", smiles: "CC(C)C=O", porque: "Teria o CHO em ~9,6 ppm e um dubleto de 6H (as duas metilas), não um tripleto de 3H." },
      { nome: "Tetra-hidrofurano", smiles: "C1CCOC1", porque: "Só CH₂: dois multipletos de 4H (~3,7 e ~1,8 ppm), sem CH₃." },
    ],
    correta: 1,
    resumo: "Singleto de 3H em ~2,1 ppm é CH₃ ligado à carbonila de cetona; o etila (q + t) completa a butanona. Não há sinal de aldeído acima de 9 ppm.",
  },
  {
    id: "acetato-de-etila",
    formula: "C₄H₈O₂",
    sinais: [
      { delta: 4.12, mult: "q", n: 2, atrib: "O–CH₂ do éster" },
      { delta: 2.04, mult: "s", n: 3, atrib: "CH₃–C=O" },
      { delta: 1.26, mult: "t", n: 3, atrib: "CH₃ do etila" },
    ],
    candidatas: [
      { nome: "Propanoato de metila", smiles: "CCC(=O)OC", porque: "O CH₃ do éster (O–CH₃) daria singleto em ~3,7 ppm, e o quarteto (CH₂–C=O) ficaria em ~2,3 ppm." },
      { nome: "Ácido butanoico", smiles: "CCCC(=O)O", porque: "Haveria o COOH em ~11–12 ppm e nenhum CH₂ acima de 4 ppm." },
      { nome: "Acetato de etila", smiles: "CCOC(C)=O" },
      { nome: "1,4-Dioxano", smiles: "C1COCCO1", porque: "Os 8 H são equivalentes: um singleto único em ~3,7 ppm." },
    ],
    correta: 2,
    resumo: "O quarteto em 4,1 ppm é um CH₂ ligado ao oxigênio do éster (desblindado), e o singleto em 2,0 ppm é o CH₃ do lado da carbonila: acetato de etila.",
  },
  {
    id: "acido-propanoico",
    formula: "C₃H₆O₂",
    sinais: [
      { delta: 11.7, mult: "s", n: 1, atrib: "COOH (largo)" },
      { delta: 2.38, mult: "q", n: 2, atrib: "CH₂–C=O" },
      { delta: 1.16, mult: "t", n: 3, atrib: "CH₃" },
    ],
    candidatas: [
      { nome: "Acetato de metila", smiles: "CC(=O)OC", porque: "Só dois singletos (CH₃–C=O ~2,0 e O–CH₃ ~3,7 ppm), sem acoplamento." },
      { nome: "Formiato de etila", smiles: "CCOC=O", porque: "Teria o H do formiato (H–C=O) em ~8,0 ppm e o O–CH₂ em ~4,2 ppm." },
      { nome: "Ácido propanoico", smiles: "CCC(=O)O" },
    ],
    correta: 2,
    resumo: "O singleto largo em ~12 ppm é típico de ácido carboxílico; o etila ligado à carbonila tem o CH₂ em ~2,4 ppm.",
  },
  {
    id: "acetofenona",
    formula: "C₈H₈O",
    sinais: [
      { delta: 7.96, mult: "d", n: 2, atrib: "H orto à carbonila" },
      { delta: 7.56, mult: "t", n: 1, atrib: "H para" },
      { delta: 7.46, mult: "t", n: 2, atrib: "H meta" },
      { delta: 2.61, mult: "s", n: 3, atrib: "CH₃–C=O" },
    ],
    candidatas: [
      { nome: "Fenilacetaldeído", smiles: "O=CCC1=CC=CC=C1", porque: "Teria o CHO em ~9,7 ppm (tripleto) e um CH₂ em ~3,7 ppm." },
      { nome: "4-Metilbenzaldeído", smiles: "CC1=CC=C(C=O)C=C1", porque: "Teria o CHO em ~9,9 ppm e só dois dubletos aromáticos (anel para-dissubstituído)." },
      { nome: "Acetofenona", smiles: "CC(=O)C1=CC=CC=C1" },
    ],
    correta: 2,
    resumo: "Cinco H aromáticos (2 + 1 + 2) indicam anel monossubstituído; o CH₃ em singleto a 2,6 ppm está ligado a uma carbonila conjugada com o anel.",
  },
  {
    id: "p-cloroanilina",
    formula: "C₆H₆ClN",
    sinais: [
      { delta: 7.1, mult: "d", n: 2, atrib: "H vizinhos ao Cl" },
      { delta: 6.61, mult: "d", n: 2, atrib: "H vizinhos ao NH₂ (blindados)" },
      { delta: 3.65, mult: "s", n: 2, atrib: "NH₂ (largo)" },
    ],
    candidatas: [
      { nome: "2-Cloroanilina", smiles: "NC1=CC=CC=C1Cl", porque: "Os 4 H aromáticos seriam todos diferentes: quatro sinais de 1H, não dois dubletos de 2H." },
      { nome: "3-Cloroanilina", smiles: "NC1=CC=CC(Cl)=C1", porque: "Também quatro H aromáticos diferentes, incluindo um quase singleto entre os substituintes." },
      { nome: "4-Cloroanilina", smiles: "NC1=CC=C(Cl)C=C1" },
    ],
    correta: 2,
    resumo: "Dois dubletos de 2H são a marca de um anel para-dissubstituído (simetria). O NH₂ doa elétrons e blinda os H vizinhos (6,6 ppm).",
  },
];
