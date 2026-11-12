/**
 * Escada de pKa: séries clássicas para ordenar acidez/basicidade.
 * Valores em água a 25 °C, arredondados a 0,1 (hidrocarbonetos: estimativas de livro-texto).
 */
export const FONTE_PKA =
  "Bruice, Química Orgânica, Apêndice I (pKa); CRC Handbook of Chemistry and Physics, 97ª ed. Água, 25 °C; pKa de hidrocarbonetos são estimativas de livro-texto.";

export interface ItemPka {
  nome: string;
  /** SMILES em Kekulé. */
  smiles: string;
  pKa: number;
  /** Em séries de bases, o pKa é o do ácido conjugado (pKaH). */
  destaque?: string;
}

export interface RodadaPka {
  id: string;
  titulo: string;
  /** "acido": ordenar do mais ácido (menor pKa) ao menos ácido. "base": da base mais forte (maior pKaH) à mais fraca. */
  tipo: "acido" | "base";
  fator: string;
  itens: ItemPka[];
  explicacao: string;
}

export const RODADAS_PKA: RodadaPka[] = [
  {
    id: "hibridizacao",
    titulo: "Hidrocarbonetos",
    tipo: "acido",
    fator: "Hibridização",
    itens: [
      { nome: "Etano", smiles: "CC", pKa: 50 },
      { nome: "Eteno", smiles: "C=C", pKa: 44 },
      { nome: "Etino", smiles: "C#C", pKa: 25 },
    ],
    explicacao:
      "Quanto maior o caráter s do orbital que abriga o par de elétrons da base conjugada (sp 50% > sp² 33% > sp³ 25%), mais perto do núcleo ele fica e mais estável é o carbânion. Por isso o etino é o mais ácido.",
  },
  {
    id: "inducao-numero",
    titulo: "Ácidos cloroacéticos",
    tipo: "acido",
    fator: "Efeito indutivo (número de halogênios)",
    itens: [
      { nome: "Ácido acético", smiles: "CC(=O)O", pKa: 4.8 },
      { nome: "Ácido cloroacético", smiles: "OC(=O)CCl", pKa: 2.9 },
      { nome: "Ácido dicloroacético", smiles: "OC(=O)C(Cl)Cl", pKa: 1.3 },
      { nome: "Ácido tricloroacético", smiles: "OC(=O)C(Cl)(Cl)Cl", pKa: 0.7 },
    ],
    explicacao:
      "Cada cloro retira densidade eletrônica por indução e espalha a carga negativa do carboxilato. Mais cloros, base conjugada mais estável, ácido mais forte.",
  },
  {
    id: "inducao-distancia",
    titulo: "Ácidos clorobutanoicos",
    tipo: "acido",
    fator: "Efeito indutivo (distância)",
    itens: [
      { nome: "Ácido butanoico", smiles: "CCCC(=O)O", pKa: 4.8 },
      { nome: "Ácido 2-clorobutanoico", smiles: "CCC(Cl)C(=O)O", pKa: 2.9 },
      { nome: "Ácido 3-clorobutanoico", smiles: "CC(Cl)CC(=O)O", pKa: 4.1 },
      { nome: "Ácido 4-clorobutanoico", smiles: "ClCCCC(=O)O", pKa: 4.5 },
    ],
    explicacao:
      "O efeito indutivo cai rapidamente com a distância: o cloro no carbono 2 (vizinho à carboxila) estabiliza muito mais o carboxilato do que no carbono 3 ou 4.",
  },
  {
    id: "ressonancia",
    titulo: "Álcool, fenóis e ácido carboxílico",
    tipo: "acido",
    fator: "Ressonância",
    itens: [
      { nome: "Cicloexanol", smiles: "OC1CCCCC1", pKa: 16.0 },
      { nome: "Fenol", smiles: "OC1=CC=CC=C1", pKa: 10.0 },
      { nome: "p-Nitrofenol", smiles: "OC1=CC=C(C=C1)[N+](=O)[O-]", pKa: 7.1 },
      { nome: "Ácido acético", smiles: "CC(=O)O", pKa: 4.8 },
    ],
    explicacao:
      "No alcóxido a carga fica no oxigênio; no fenóxido ela se espalha pelo anel; o grupo nitro em para a recebe também por ressonância. No carboxilato ela se divide igualmente entre dois oxigênios, a deslocalização mais eficiente da série.",
  },
  {
    id: "bases",
    titulo: "Aminas e piridina",
    tipo: "base",
    fator: "Disponibilidade do par de elétrons",
    itens: [
      { nome: "Metilamina", smiles: "CN", pKa: 10.6 },
      { nome: "Amônia", smiles: "N", pKa: 9.2 },
      { nome: "Piridina", smiles: "C1=CC=NC=C1", pKa: 5.2 },
      { nome: "Anilina", smiles: "NC1=CC=CC=C1", pKa: 4.6 },
    ],
    explicacao:
      "Aqui o pKa é o do ácido conjugado (pKaH): quanto maior, mais forte a base. A metila doa elétrons e reforça o par livre; na piridina o par está num orbital sp², mais preso ao núcleo; na anilina ele se deslocaliza pelo anel por ressonância.",
  },
];
