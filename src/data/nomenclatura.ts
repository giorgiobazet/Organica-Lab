/**
 * Construtor de Nomenclatura IUPAC: montar o nome a partir de peças (com peças-armadilha).
 * Nomes conferidos com o IUPACName do PubChem (forma inglesa equivalente) e grafados conforme
 * as recomendações IUPAC de 2013 em português (locante antes do sufixo: propan-2-ol).
 */
export const FONTE_NOMENCLATURA = "IUPAC, Nomenclature of Organic Chemistry: Recommendations 2013 (P-31, P-14.4, P-14.5); nomes conferidos com o PubChem.";

export interface ItemNome {
  id: string;
  smiles: string;
  /** Peças do nome correto, na ordem. */
  pecas: string[];
  /** Peças-armadilha misturadas às corretas. */
  armadilhas: string[];
  regra: string;
}

export const NOMES: ItemNome[] = [
  {
    id: "2-metilbutano",
    smiles: "CC(C)CC",
    pecas: ["2-", "metil", "butano"],
    armadilhas: ["3-", "pentano", "etil"],
    regra: "Cadeia principal: a mais longa (4 C, butano). Numere pela ponta mais perto do ramo: metila no C2, não no C3.",
  },
  {
    id: "pent-1-eno",
    smiles: "C=CCCC",
    pecas: ["pent", "-1-", "eno"],
    armadilhas: ["-4-", "ano", "but"],
    regra: "A ligação dupla recebe o menor locante possível (1, não 4) e o sufixo -eno; o locante vem logo antes dele.",
  },
  {
    id: "propan-2-ol",
    smiles: "CC(C)O",
    pecas: ["propan", "-2-", "ol"],
    armadilhas: ["-1-", "al", "etan"],
    regra: "O grupo característico principal (OH) vira sufixo -ol, com o locante imediatamente antes dele.",
  },
  {
    id: "pentan-3-ona",
    smiles: "CCC(=O)CC",
    pecas: ["pentan", "-3-", "ona"],
    armadilhas: ["-2-", "al", "ol"],
    regra: "Cetona: sufixo -ona. A carbonila está no meio da cadeia de 5 C, no C3 de qualquer lado.",
  },
  {
    id: "3-metilbutanal",
    smiles: "CC(C)CC=O",
    pecas: ["3-", "metil", "butanal"],
    armadilhas: ["2-", "pentanal", "butan-1-ona"],
    regra: "No aldeído, o C da carbonila é sempre o C1 (dispensa locante); por isso a metila fica no C3.",
  },
  {
    id: "acido-2-metilpropanoico",
    smiles: "CC(C)C(=O)O",
    pecas: ["ácido ", "2-", "metil", "propan", "oico"],
    armadilhas: ["butan", "-2-", "ol"],
    regra: "Ácido carboxílico: “ácido … -oico”, com o C da carboxila como C1. A cadeia principal tem 3 C (propanoico) e a metila está no C2.",
  },
  {
    id: "4-metilpent-2-ino",
    smiles: "CC#CC(C)C",
    pecas: ["4-", "metil", "pent", "-2-", "ino"],
    armadilhas: ["2-", "-3-", "eno"],
    regra: "A ligação tripla (sufixo -ino) manda na numeração: locante 2 para ela, o que deixa a metila no C4.",
  },
  {
    id: "2-cloro-3-metilbutano",
    smiles: "CC(Cl)C(C)C",
    pecas: ["2-", "cloro", "-3-", "metil", "butano"],
    armadilhas: ["3-", "-2-", "pentano"],
    regra: "Halogênios entram como prefixo. Os locantes são {2,3} dos dois lados; o desempate é alfabético: cloro vem antes de metil e fica com o 2. Os prefixos também são citados em ordem alfabética.",
  },
  {
    id: "2,2,4-trimetilpentano",
    smiles: "CC(C)CC(C)(C)C",
    pecas: ["2,2,4-", "trimetil", "pentano"],
    armadilhas: ["2,4,4-", "dimetil", "hexano"],
    regra: "Três metilas: prefixo multiplicador tri-. Compare os conjuntos de locantes {2,2,4} e {2,4,4}: no primeiro ponto de diferença, 2 < 4, então vale 2,2,4 (o isoctano da gasolina).",
  },
];
