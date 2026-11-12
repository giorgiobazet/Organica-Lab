/**
 * Otimize o Fármaco: compostos-modelo (exercícios, não fármacos reais) que violam a Regra dos 5
 * de Lipinski. O aluno edita a estrutura até zerar as violações sem perder o farmacóforo.
 * Propriedades calculadas no navegador com a OpenChemLib (mesmos modelos do Laboratório).
 */
export const FONTE_LIPINSKI = "Regra: Lipinski et al., Adv. Drug Deliv. Rev. 23 (1997) 3–25. Valores calculados com a OpenChemLib.";

export interface DesafioFarmaco {
  id: string;
  titulo: string;
  contexto: string;
  /** Composto-modelo inicial (exercício). */
  smilesInicial: string;
  /** Farmacóforo que precisa continuar na molécula (busca de subestrutura). */
  farmacoforo: { smiles: string; nome: string };
  dica: string;
  /** Uma solução possível, mostrada depois do acerto. */
  solucao: { nome: string; smiles: string };
}

export const DESAFIOS_FARMACO: DesafioFarmaco[] = [
  {
    id: "lipofilico",
    titulo: "Gordura demais",
    contexto: "Um análogo do ibuprofeno com uma cadeia alquila enorme: lipofílico demais para se dissolver no trato gastrointestinal.",
    smilesInicial: "CCCCCCCCCCCCCCCCCCCCCCc1ccc(cc1)C(C)C(=O)O",
    farmacoforo: { smiles: "CC(C(=O)O)C1=CC=CC=C1", nome: "ácido 2-arilpropanoico (o que liga na COX)" },
    dica: "Encurte a cadeia: cada CH₂ a menos baixa o logP em cerca de meia unidade.",
    solucao: { nome: "Ibuprofeno", smiles: "CC(C)CC1=CC=C(C(C)C(=O)O)C=C1" },
  },
  {
    id: "doadores",
    titulo: "Polar demais",
    contexto: "Um derivado do paracetamol cheio de hidroxilas: faz ligações de H demais com a água para atravessar a membrana.",
    smilesInicial: "OC[C@@H](O)[C@@H](O)[C@H](O)[C@H](O)CN(CC(O)CO)c1ccc(NC(C)=O)cc1",
    farmacoforo: { smiles: "CC(=O)NC1=CC=CC=C1", nome: "acetanilida (núcleo do paracetamol)" },
    dica: "Remova grupos OH (ou a cadeia inteira) até ter no máximo 5 doadores de ligação de H.",
    solucao: { nome: "Paracetamol", smiles: "CC(=O)NC1=CC=C(O)C=C1" },
  },
  {
    id: "grande",
    titulo: "Grande e gorduroso",
    contexto: "Um pró-fármaco do ibuprofeno esterificado com um tetrafenilo: pesado demais e lipofílico demais.",
    smilesInicial: "CC(C)Cc1ccc(cc1)C(C)C(=O)Oc1ccc(cc1)-c1ccc(cc1)-c1ccc(cc1)-c1ccc(cc1)C(C)(C)C",
    farmacoforo: { smiles: "CC(C(=O)O)C1=CC=CC=C1", nome: "ácido 2-arilpropanoico (o que liga na COX)" },
    dica: "Desfaça o éster: devolva o OH ao ácido carboxílico e remova o resto.",
    solucao: { nome: "Ibuprofeno", smiles: "CC(C)CC1=CC=C(C(C)C(=O)O)C=C1" },
  },
  {
    id: "aceptores",
    titulo: "Corrente de éteres",
    contexto: "A aspirina ligada a uma longa cadeia de polietilenoglicol: aceptores de H demais e massa acima de 500.",
    smilesInicial: "CC(=O)Oc1ccccc1C(=O)OCCOCCOCCOCCOCCOCCOCCOCCOC",
    farmacoforo: { smiles: "CC(=O)OC1=CC=CC=C1", nome: "acetato de arila (a acetila que a aspirina transfere)" },
    dica: "Encurte ou remova a cadeia de éteres (–CH₂CH₂O–) ligada à carboxila.",
    solucao: { nome: "Aspirina", smiles: "CC(=O)OC1=CC=CC=C1C(=O)O" },
  },
];
