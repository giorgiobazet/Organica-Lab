/**
 * Torre de Reatividade: substituição nucleofílica acílica nos derivados de ácido carboxílico.
 * Regra central: um derivado só se converte diretamente em outro igual ou menos reativo.
 */
export const FONTE_REATIVIDADE =
  "Bruice, Química Orgânica, cap. 15 (ácidos carboxílicos e derivados); Clayden, Organic Chemistry, cap. 10. pKa dos ácidos conjugados dos grupos de saída: Apêndice I de Bruice.";

export interface DerivadoOrdem {
  nome: string;
  smiles: string;
  grupoSaida: string;
}

/** Ordem correta: do mais reativo ao menos reativo. */
export const TORRE: DerivadoOrdem[] = [
  { nome: "Cloreto de acetila", smiles: "CC(Cl)=O", grupoSaida: "Cl⁻ (pKa do HCl ≈ −7)" },
  { nome: "Anidrido acético", smiles: "CC(=O)OC(C)=O", grupoSaida: "CH₃COO⁻ (pKa ≈ 4,8)" },
  { nome: "Acetato de etila", smiles: "CCOC(C)=O", grupoSaida: "CH₃CH₂O⁻ (pKa ≈ 16)" },
  { nome: "Acetamida", smiles: "CC(N)=O", grupoSaida: "NH₂⁻ (pKa ≈ 36)" },
];

export const EXPLICACAO_TORRE =
  "Quanto mais fraca a base que sai, melhor o grupo de saída e mais reativo o derivado. Além disso, N e O doam par de elétrons à carbonila por ressonância e a deixam menos eletrofílica; o N da amida doa mais, o Cl quase nada.";

export interface Opcao {
  texto: string;
  /** Estrutura do produto principal, quando a opção for uma molécula. */
  smiles?: string;
}

export interface QuestaoReacao {
  id: string;
  reagentes: string;
  smilesReagente?: string;
  pergunta: string;
  opcoes: Opcao[];
  correta: number;
  explicacao: string;
}

export const QUESTOES_REATIVIDADE: QuestaoReacao[] = [
  {
    id: "cloreto-etanol",
    reagentes: "Cloreto de acetila + etanol (piridina)",
    smilesReagente: "CC(Cl)=O",
    pergunta: "Qual é o produto orgânico?",
    opcoes: [
      { texto: "Acetato de etila", smiles: "CCOC(C)=O" },
      { texto: "Etanal", smiles: "CC=O" },
      { texto: "Cloroetano", smiles: "CCCl" },
      { texto: "Éter dietílico", smiles: "CCOCC" },
    ],
    correta: 0,
    explicacao:
      "O etanol ataca a carbonila, forma o intermediário tetraédrico e o Cl⁻ sai: forma-se o éster (menos reativo que o cloreto). A piridina neutraliza o HCl.",
  },
  {
    id: "cloreto-amonia",
    reagentes: "Cloreto de acetila + NH₃ (excesso)",
    smilesReagente: "CC(Cl)=O",
    pergunta: "Qual é o produto orgânico?",
    opcoes: [
      { texto: "Acetamida", smiles: "CC(N)=O" },
      { texto: "Metilamina", smiles: "CN" },
      { texto: "Etanal", smiles: "CC=O" },
      { texto: "Ácido acético", smiles: "CC(=O)O" },
    ],
    correta: 0,
    explicacao:
      "A amônia é melhor nucleófilo que a água e forma a amida, o derivado menos reativo. O segundo equivalente de NH₃ captura o HCl (NH₄Cl).",
  },
  {
    id: "anidrido-salicilico",
    reagentes: "Anidrido acético + ácido salicílico (H⁺)",
    smilesReagente: "OC(=O)C1=CC=CC=C1O",
    pergunta: "Qual fármaco se forma?",
    opcoes: [
      { texto: "Ácido acetilsalicílico (aspirina)", smiles: "CC(=O)OC1=CC=CC=C1C(=O)O" },
      { texto: "Salicilato de metila", smiles: "COC(=O)C1=CC=CC=C1O" },
      { texto: "Paracetamol", smiles: "CC(=O)NC1=CC=C(O)C=C1" },
      { texto: "Fenol", smiles: "OC1=CC=CC=C1" },
    ],
    correta: 0,
    explicacao:
      "O OH fenólico ataca o anidrido e recebe o grupo acetila (O-acetilação); o acetato sai como ácido acético. É a síntese industrial da aspirina: anidrido → éster, do mais para o menos reativo.",
  },
  {
    id: "saponificacao",
    reagentes: "Acetato de etila + NaOH(aq), aquecimento",
    smilesReagente: "CCOC(C)=O",
    pergunta: "Quais são os produtos?",
    opcoes: [
      { texto: "Acetato de sódio + etanol" },
      { texto: "Ácido acético + etanol" },
      { texto: "Acetamida + etanol" },
      { texto: "Etanal + metanol" },
    ],
    correta: 0,
    explicacao:
      "Na saponificação o OH⁻ ataca a carbonila e o etóxido sai; o ácido formado é desprotonado na hora, e o carboxilato (o derivado menos reativo de todos) torna a reação irreversível.",
  },
  {
    id: "amida-etanol",
    reagentes: "Acetamida + etanol (sem catalisador)",
    smilesReagente: "CC(N)=O",
    pergunta: "O que acontece?",
    opcoes: [
      { texto: "Não reage nessas condições" },
      { texto: "Forma acetato de etila", smiles: "CCOC(C)=O" },
      { texto: "Forma etilamina", smiles: "CCN" },
      { texto: "Forma anidrido acético", smiles: "CC(=O)OC(C)=O" },
    ],
    correta: 0,
    explicacao:
      "A amida é o derivado menos reativo e o NH₂⁻ é péssimo grupo de saída. Transformá-la em éster seria subir na torre de reatividade, o que não acontece por substituição direta.",
  },
  {
    id: "socl2",
    reagentes: "Ácido acético → cloreto de acetila",
    smilesReagente: "CC(=O)O",
    pergunta: "Qual reagente faz essa conversão?",
    opcoes: [
      { texto: "SOCl₂ (cloreto de tionila)" },
      { texto: "NaCl" },
      { texto: "HCl diluído" },
      { texto: "Cl₂ com luz" },
    ],
    correta: 0,
    explicacao:
      "Para subir na torre é preciso trocar o OH por um grupo de saída melhor: o SOCl₂ converte o OH em clorossulfito, que sai como SO₂ e Cl⁻. Cloreto de sódio e HCl não ativam o OH; Cl₂ com luz substitui H da metila (radicalar).",
  },
];
