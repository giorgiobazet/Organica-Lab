"""
Gera os dados do jogo "Estruturas, Carga Formal e Ressonância".

Cada íon tem duas estruturas de ressonância com a MESMA ordem de átomos.
A geometria vem do contribuinte A (RDKit ETKDGv3 + MMFF94) e é compartilhada
pelos dois contribuintes (ressonância não move núcleos, só elétrons).

Uso: python scripts/build_resonancia.py src/data/resonancia.ts
"""
import json, sys
from rdkit import Chem
from rdkit.Chem import AllChem

IONS = [
    {
        "key": "enolato", "nome": "Ânion enolato (do acetaldeído)", "formula": "C₂H₃O⁻",
        "smiles": ["C=C[O-]", "[CH2-]C=O"],
        "rotulos": ["C1", "C2", "O"],
        "hibridizacao": ["sp2", "sp2", "sp2"],
        "notaHibridizacao": "O oxigênio com carga participa da ressonância: seu par isolado ocupa um orbital p alinhado ao sistema π, então ele é sp², não sp³.",
        "cargaHibrido": [-0.5, 0, -0.5],
        "contexto": "Intermediário-chave das reações aldólicas: reage pelo carbono α (C1) mesmo com a maior parte da carga no oxigênio.",
    },
    {
        "key": "alila", "nome": "Cátion alila", "formula": "C₃H₅⁺",
        "smiles": ["C=C[CH2+]", "[CH2+]C=C"],
        "rotulos": ["C1", "C2", "C3"],
        "hibridizacao": ["sp2", "sp2", "sp2"],
        "notaHibridizacao": "Os três carbonos são sp²: cada um contribui com um orbital p para um sistema π de três centros com dois elétrons.",
        "cargaHibrido": [0.5, 0, 0.5],
        "contexto": "A deslocalização explica por que carbocátions alílicos são tão estáveis quanto os secundários em reações SN1.",
    },
    {
        "key": "acetato", "nome": "Íon acetato", "formula": "C₂H₃O₂⁻",
        "smiles": ["CC(=O)[O-]", "CC([O-])=O"],
        "rotulos": ["CH₃", "C", "O1", "O2"],
        "hibridizacao": ["sp3", "sp2", "sp2", "sp2"],
        "notaHibridizacao": "Só a metila é sp³. A carbonila e os dois oxigênios formam o sistema π deslocalizado (sp²): as duas ligações C–O medem o mesmo (≈1,26 Å).",
        "cargaHibrido": [0, 0, -0.5, -0.5],
        "contexto": "A carga dividida entre dois oxigênios equivalentes explica a acidez do ácido acético (pKa 4,76) frente ao etanol (pKa ≈ 16).",
    },
    {
        "key": "nitrometano", "nome": "Nitrometano", "formula": "CH₃NO₂",
        "smiles": ["C[N+](=O)[O-]", "C[N+]([O-])=O"],
        "rotulos": ["CH₃", "N", "O1", "O2"],
        "hibridizacao": ["sp3", "sp2", "sp2", "sp2"],
        "notaHibridizacao": "O nitrogênio é sp² (trigonal planar) e os dois oxigênios participam do sistema π; a metila é sp³.",
        "cargaHibrido": [0, 1, -0.5, -0.5],
        "contexto": "Molécula neutra com separação de cargas: +1 fixo no nitrogênio e −1 dividido entre os oxigênios. Por isso é muito polar (μ ≈ 3,5 D).",
    },
]

BOND = {Chem.BondType.SINGLE: 1, Chem.BondType.DOUBLE: 2, Chem.BondType.TRIPLE: 3}

out = []
for ion in IONS:
    mols = [Chem.AddHs(Chem.MolFromSmiles(s)) for s in ion["smiles"]]
    a, b = mols
    assert [x.GetSymbol() for x in a.GetAtoms()] == [x.GetSymbol() for x in b.GetAtoms()], ion["key"]
    p = AllChem.ETKDGv3(); p.randomSeed = 11
    assert AllChem.EmbedMolecule(a, p) == 0
    AllChem.MMFFOptimizeMolecule(a, maxIters=4000)
    pos = a.GetConformer().GetPositions()
    heavy = [x.GetIdx() for x in a.GetAtoms() if x.GetAtomicNum() > 1]
    contribs = []
    for m in mols:
        bonds = sorted([[bd.GetBeginAtomIdx(), bd.GetEndAtomIdx(), BOND[bd.GetBondType()]] for bd in m.GetBonds()])
        contribs.append({
            "ligacoes": bonds,
            "cargas": [x.GetFormalCharge() for x in m.GetAtoms()],
            "smiles": Chem.MolToSmiles(Chem.RemoveHs(m)),
        })
    # mesma topologia (só muda a ordem de ligação)
    assert [l[:2] for l in contribs[0]["ligacoes"]] == [l[:2] for l in contribs[1]["ligacoes"]]
    out.append({
        **{k: ion[k] for k in ("key", "nome", "formula", "rotulos", "hibridizacao", "notaHibridizacao", "cargaHibrido", "contexto")},
        "elementos": [x.GetSymbol() for x in a.GetAtoms()],
        "pesados": heavy,
        "coords": [round(float(v), 3) for v in pos.flatten()],
        "contribuintes": contribs,
    })
    print(ion["key"], "pesados", heavy, [c["cargas"][:len(heavy)] for c in contribs])

ts = [
    "// Gerado por scripts/build_resonancia.py (RDKit ETKDGv3 + MMFF94).",
    "// Geometria única por íon; os contribuintes de ressonância diferem só em ligações e cargas.",
    "",
    "export type Hibridizacao = \"sp3\" | \"sp2\" | \"sp\";",
    "export interface Contribuinte { ligacoes: [number, number, number][]; cargas: number[]; smiles: string }",
    "export interface IonResonancia {",
    "  key: string; nome: string; formula: string;",
    "  /** rótulos dos átomos pesados, na ordem de `pesados` */ rotulos: string[];",
    "  hibridizacao: Hibridizacao[]; notaHibridizacao: string;",
    "  /** carga parcial de cada átomo pesado no híbrido de ressonância */ cargaHibrido: number[];",
    "  contexto: string; elementos: string[]; pesados: number[]; coords: number[];",
    "  contribuintes: Contribuinte[];",
    "}",
    "",
    f"export const IONS_RESONANCIA: IonResonancia[] = {json.dumps(out, ensure_ascii=False, indent=1)};",
    "",
]
open(sys.argv[1], "w").write("\n".join(ts))
print("ok")
