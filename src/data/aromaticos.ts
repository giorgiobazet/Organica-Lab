/**
 * Alvos do Deckbuilder de Reações Aromáticas. Pontos de fusão: Sigma-Aldrich / PubChem.
 * Posições no anel em sentido horário a partir do topo (0).
 */
import type { Anel } from "@/lib/aromaticos";

export interface AlvoAromatico {
  id: string;
  nome: string;
  iupac: string;
  anel: Anel;
  /** número mínimo de cartas */
  minimo: number;
  dica: string;
  contexto: string;
  propriedade?: string;
}

export const ALVOS_AROMATICOS: AlvoAromatico[] = [
  {
    id: "p-bromonitrobenzeno",
    nome: "p-Bromonitrobenzeno",
    iupac: "1-bromo-4-nitrobenzeno",
    anel: ["Br", null, null, "NO2", null, null],
    minimo: 2,
    dica: "Qual grupo orienta para a posição para? Ele precisa entrar primeiro.",
    contexto: "O Br (orto/para) entra primeiro e manda o NO₂ para a posição para. Na ordem inversa, o NO₂ (meta) levaria ao isômero meta.",
    propriedade: "PF 124–126 °C, contra 51–54 °C do isômero meta: a molécula para, simétrica, empacota melhor no cristal.",
  },
  {
    id: "m-bromonitrobenzeno",
    nome: "m-Bromonitrobenzeno",
    iupac: "1-bromo-3-nitrobenzeno",
    anel: ["NO2", null, "Br", null, null, null],
    minimo: 2,
    dica: "Para obter meta, o primeiro grupo precisa ser um orientador meta.",
    contexto: "O NO₂ entra primeiro e, como desativador meta, envia o Br para a posição 3.",
    propriedade: "PF 51–54 °C.",
  },
  {
    id: "acido-m-clorobenzoico",
    nome: "Ácido m-clorobenzoico",
    iupac: "ácido 3-clorobenzoico",
    anel: ["COOH", null, "Cl", null, null, null],
    minimo: 3,
    dica: "COOH é meta, CH₃ é orto/para: o carbono do COOH pode entrar como CH₃ e ser oxidado no momento certo.",
    contexto: "Friedel-Crafts (CH₃), oxidação a COOH (agora meta) e só então a cloração. Clorar antes da oxidação daria o isômero para.",
    propriedade: "PF 153–157 °C; o isômero para funde a 238–241 °C.",
  },
  {
    id: "2-bromo-4-nitrotolueno",
    nome: "2-Bromo-4-nitrotolueno",
    iupac: "2-bromo-1-metil-4-nitrobenzeno",
    anel: ["CH3", "Br", null, "NO2", null, null],
    minimo: 3,
    dica: "Na última etapa, o CH₃ (ativador) e o NO₂ (meta) precisam concordar sobre a mesma posição.",
    contexto: "Tolueno → nitração na para → bromação: o CH₃ manda para orto dele, e o NO₂ manda para meta dele, que é a mesma posição. Efeitos que se reforçam.",
  },
  {
    id: "paba",
    nome: "Ácido p-aminobenzoico (PABA)",
    iupac: "ácido 4-aminobenzoico",
    anel: ["COOH", null, null, "NH2", null, null],
    minimo: 4,
    dica: "Reduzir o NO₂ cedo demais deixa uma amina livre que o KMnO₄ destrói.",
    contexto: "Precursor da benzocaína e da procaína. Tolueno → nitração (para) → oxidação a COOH → redução do NO₂ por último.",
    propriedade: "PF 187–189 °C.",
  },
  {
    id: "4-aminofenol",
    nome: "4-Aminofenol",
    iupac: "4-aminofenol",
    anel: ["OH", null, null, "NH2", null, null],
    minimo: 4,
    dica: "O OH pode entrar por SNAr, desde que haja um NO₂ em para ao halogênio.",
    contexto: "Precursor direto do paracetamol (acetilação do NH₂). Cloração → nitração (para) → SNAr com NaOH → redução.",
    propriedade: "PF 186–189 °C.",
  },
];
