/**
 * Laboratório de Carbonilas (Orgânica 3): adição nucleofílica a aldeídos e cetonas e reações
 * relacionadas. Tudo em 2D (Regra de Ouro): o foco é a conectividade do produto.
 */
export const FONTE_CARBONILAS = "Bruice, Química Orgânica, caps. 16–17 (aldeídos, cetonas e carbono α); Clayden, Organic Chemistry, caps. 6, 9, 11 e 26.";

export interface OpcaoCarbonila {
  texto: string;
  smiles: string;
}

export interface QuestaoCarbonila {
  id: string;
  substrato: { nome: string; smiles: string };
  reagentes: string;
  tipo: string;
  opcoes: OpcaoCarbonila[];
  correta: number;
  explicacao: string;
}

export const QUESTOES_CARBONILAS: QuestaoCarbonila[] = [
  {
    id: "nabh4",
    substrato: { nome: "Propanona", smiles: "CC(C)=O" },
    reagentes: "1) NaBH₄  2) H₂O",
    tipo: "Redução (hidreto)",
    opcoes: [
      { texto: "Propan-2-ol", smiles: "CC(C)O" },
      { texto: "Propan-1-ol", smiles: "CCCO" },
      { texto: "Propanal", smiles: "CCC=O" },
      { texto: "Propeno", smiles: "CC=C" },
    ],
    correta: 0,
    explicacao: "O hidreto (H⁻) ataca o carbono da carbonila; a protonação do alcóxido dá o álcool. Cetona vira álcool secundário, sem mudar o esqueleto.",
  },
  {
    id: "grignard",
    substrato: { nome: "Benzaldeído", smiles: "O=CC1=CC=CC=C1" },
    reagentes: "1) CH₃MgBr  2) H₃O⁺",
    tipo: "Reagente de Grignard",
    opcoes: [
      { texto: "1-Feniletanol", smiles: "CC(O)C1=CC=CC=C1" },
      { texto: "2-Feniletanol", smiles: "OCCC1=CC=CC=C1" },
      { texto: "Acetofenona", smiles: "CC(=O)C1=CC=CC=C1" },
      { texto: "Tolueno", smiles: "CC1=CC=CC=C1" },
    ],
    correta: 0,
    explicacao: "O carbono do Grignard (carbânion) forma uma nova ligação C–C com o carbono da carbonila. Aldeído (exceto metanal) + Grignard dá álcool secundário: a metila e o OH ficam no mesmo carbono.",
  },
  {
    id: "ester-grignard",
    substrato: { nome: "Acetato de etila", smiles: "CCOC(C)=O" },
    reagentes: "1) CH₃MgBr (2 equivalentes)  2) H₃O⁺",
    tipo: "Grignard em éster",
    opcoes: [
      { texto: "2-Metilpropan-2-ol", smiles: "CC(C)(C)O" },
      { texto: "Propanona", smiles: "CC(C)=O" },
      { texto: "Butan-2-ol", smiles: "CCC(C)O" },
      { texto: "Etanol apenas", smiles: "CCO" },
    ],
    correta: 0,
    explicacao: "O primeiro equivalente substitui o etóxido e forma a cetona (propanona), mais reativa que o éster; o segundo ataca essa cetona. Resultado: álcool terciário com duas metilas vindas do Grignard (o etanol sai como subproduto).",
  },
  {
    id: "aldolica",
    substrato: { nome: "Etanal", smiles: "CC=O" },
    reagentes: "NaOH diluído, frio",
    tipo: "Adição aldólica",
    opcoes: [
      { texto: "3-Hidroxibutanal", smiles: "CC(O)CC=O" },
      { texto: "Butanal", smiles: "CCCC=O" },
      { texto: "Ácido acético", smiles: "CC(=O)O" },
      { texto: "Etanol", smiles: "CCO" },
    ],
    correta: 0,
    explicacao: "A base forma o enolato (carbono α), que ataca a carbonila de outra molécula de etanal: nasce a ligação C2–C3 e um β-hidroxialdeído (o aldol). Com aquecimento, ele desidrataria a but-2-enal (condensação).",
  },
  {
    id: "cianidrina",
    substrato: { nome: "Cicloexanona", smiles: "O=C1CCCCC1" },
    reagentes: "HCN (KCN catalítico)",
    tipo: "Cianidrina",
    opcoes: [
      { texto: "1-Hidroxicicloexano-1-carbonitrila", smiles: "N#CC1(O)CCCCC1" },
      { texto: "Cicloexanocarbonitrila", smiles: "N#CC1CCCCC1" },
      { texto: "Cicloexanol", smiles: "OC1CCCCC1" },
      { texto: "Cicloexeno", smiles: "C1=CCCCC1" },
    ],
    correta: 0,
    explicacao: "O cianeto (nucleófilo) ataca a carbonila e o alcóxido é protonado pelo HCN: o OH e o CN ficam no mesmo carbono. É uma forma de adicionar um carbono à cadeia.",
  },
  {
    id: "acetal",
    substrato: { nome: "Propanona", smiles: "CC(C)=O" },
    reagentes: "Etano-1,2-diol, H⁺, remoção de água",
    tipo: "Acetal (proteção)",
    opcoes: [
      { texto: "2,2-Dimetil-1,3-dioxolano", smiles: "CC1(C)OCCO1" },
      { texto: "Hemiacetal aberto", smiles: "CC(C)(O)OCCO" },
      { texto: "Propan-2-ol", smiles: "CC(C)O" },
      { texto: "Éter dimetílico", smiles: "COC" },
    ],
    correta: 0,
    explicacao: "Em meio ácido, as duas hidroxilas do diol substituem o O da carbonila e forma-se o acetal cíclico (o hemiacetal é só intermediário). Retirar a água desloca o equilíbrio. É o grupo de proteção usado no Bisturi Químico.",
  },
  {
    id: "wittig",
    substrato: { nome: "Benzaldeído", smiles: "O=CC1=CC=CC=C1" },
    reagentes: "Ph₃P=CH₂ (ilídeo de Wittig)",
    tipo: "Reação de Wittig",
    opcoes: [
      { texto: "Estireno (etenilbenzeno)", smiles: "C=CC1=CC=CC=C1" },
      { texto: "1-Feniletanol", smiles: "CC(O)C1=CC=CC=C1" },
      { texto: "Acetofenona", smiles: "CC(=O)C1=CC=CC=C1" },
      { texto: "Tolueno", smiles: "CC1=CC=CC=C1" },
    ],
    correta: 0,
    explicacao: "O ilídeo troca o O da carbonila pelo CH₂: passa por oxafosfetano e libera óxido de trifenilfosfina (Ph₃P=O). Resultado: um alceno exatamente onde estava o C=O.",
  },
];
