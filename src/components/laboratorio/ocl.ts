/**
 * OpenChemLib (BSD-3): editor de estruturas e geração de 3D no próprio navegador.
 * Carregada sob demanda, só quando alguém desenha ou abre um SMILES fora do PubChem.
 *
 * Geometria: ConformerGenerator (torsões estatísticas do Crystallography Open Database) seguido
 * de otimização MMFF94s+, a mesma família de campo de força do restante do site.
 */
import type { Molecule } from "openchemlib";

type OCLModulo = typeof import("openchemlib");

let modulo: Promise<OCLModulo> | null = null;
let recursos: Promise<void> | null = null;

export function carregarOCL(): Promise<OCLModulo> {
  modulo ??= import("openchemlib");
  return modulo;
}

/** Dados de torsões e do MMFF94 (~470 KB comprimidos), baixados só na primeira geração de 3D. */
async function carregarRecursos(OCL: OCLModulo): Promise<void> {
  recursos ??= OCL.Resources.registerFromUrl("/ocl/recursos.json").catch((e) => {
    recursos = null;
    throw e;
  });
  return recursos;
}

export interface DadosCalculados {
  formula: string;
  massaMolar: number;
  logP: number;
  tpsa: number;
  doadoresH: number;
  aceptoresH: number;
}

export const FONTE_CALCULADO =
  "Calculado no navegador com OpenChemLib: geometria pelo ConformerGenerator (torsões do COD) + MMFF94s+; logP, área polar (TPSA), doadores e aceptores de H pelos modelos da OpenChemLib.";

export interface MoleculaGerada {
  /** SMILES isomérico (para o PubChem e para links). */
  smiles: string;
  /** SMILES em Kekulé, para o bastão 2D. */
  smilesKekule: string;
  /** Molfile V2000 com hidrogênios e coordenadas 3D. */
  molfile: string;
  calculado: DadosCalculados;
}

function propriedades(OCL: OCLModulo, mol: Molecule): DadosCalculados {
  const f = mol.getMolecularFormula();
  const p = new OCL.MoleculeProperties(mol);
  return {
    formula: f.formula,
    massaMolar: Math.round(f.relativeWeight * 100) / 100,
    logP: Math.round(p.logP * 100) / 100,
    tpsa: Math.round(p.polarSurfaceArea * 10) / 10,
    doadoresH: p.donorCount,
    aceptoresH: p.acceptorCount,
  };
}

/** Gera 3D e propriedades a partir de uma molécula do editor ou de um SMILES. */
export async function gerarMolecula(entrada: Molecule | string): Promise<MoleculaGerada> {
  const OCL = await carregarOCL();
  const mol = typeof entrada === "string" ? OCL.Molecule.fromSmiles(entrada) : entrada.getCompactCopy();
  if (mol.getAllAtoms() === 0) throw new Error("Desenhe uma molécula antes de gerar o 3D.");
  if (mol.getFragments().length > 1) {
    throw new Error("Há mais de uma estrutura no desenho. Deixe só uma molécula (sem fragmentos soltos).");
  }
  await carregarRecursos(OCL);
  const smiles = mol.toIsomericSmiles();
  const smilesKekule = mol.toIsomericSmiles({ kekulizedOutput: true });
  const calculado = propriedades(OCL, mol);

  const conf = new OCL.ConformerGenerator(42).getOneConformerAsMolecule(mol.getCompactCopy());
  if (!conf) throw new Error("Não foi possível gerar uma geometria 3D para esta estrutura (confira valências e cargas).");
  new OCL.ForceFieldMMFF94(conf, OCL.ForceFieldMMFF94.MMFF94SPLUS, {}).minimise({ maxIts: 4000 });
  return { smiles, smilesKekule, molfile: `${conf.toMolfile()}$$$$\n`, calculado };
}

export interface AvaliacaoLipinski extends DadosCalculados {
  violacoes: number;
  temFarmacoforo: boolean;
  fragmentos: number;
  smiles: string;
}

/** Lipinski + presença do farmacóforo (busca de subestrutura) para a molécula do editor. */
export async function avaliarLipinski(mol: Molecule, farmacoforoSmiles: string): Promise<AvaliacaoLipinski> {
  const OCL = await carregarOCL();
  const m = mol.getCompactCopy();
  const dados = propriedades(OCL, m);
  const violacoes = [dados.massaMolar > 500, dados.logP > 5, dados.doadoresH > 5, dados.aceptoresH > 10].filter(Boolean).length;
  const frag = OCL.Molecule.fromSmiles(farmacoforoSmiles);
  frag.setFragment(true);
  const busca = new OCL.SSSearcher();
  busca.setFragment(frag);
  busca.setMolecule(m);
  return { ...dados, violacoes, temFarmacoforo: busca.isFragmentInMolecule(), fragmentos: m.getAllAtoms() ? m.getFragments().length : 0, smiles: m.toIsomericSmiles() };
}
