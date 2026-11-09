import json, sys
from rdkit import Chem
from rdkit.Chem import AllChem, Descriptors, rdMolDescriptors

# key, nome, cid (PubChem, só quando confirmado), smiles isomérico
MOLS = [
  ("aspirina", "Ácido acetilsalicílico (Aspirina)", 2244, "CC(=O)Oc1ccccc1C(=O)O"),
  ("ibuprofeno", "Ibuprofeno", 3672, "CC(C)Cc1ccc(cc1)C(C)C(=O)O"),
  ("s-ibuprofeno", "(S)-Ibuprofeno", None, "CC(C)Cc1ccc(cc1)[C@H](C)C(=O)O"),
  ("paracetamol", "Paracetamol", 1983, "CC(=O)Nc1ccc(O)cc1"),
  ("benzocaina", "Benzocaína", 2337, "CCOC(=O)c1ccc(N)cc1"),
  ("cafeina", "Cafeína", 2519, "Cn1cnc2c1c(=O)n(C)c(=O)n2C"),
  ("etano", "Etano", 6324, "CC"),
  ("butano", "Butano", 7843, "CCCC"),
  ("cicloexano", "Cicloexano", 8078, "C1CCCCC1"),
  ("benzeno", "Benzeno", 241, "c1ccccc1"),
  ("nitrometano", "Nitrometano", 6375, "C[N+](=O)[O-]"),
]

out = []
for key, nome, cid, smi in MOLS:
    m = Chem.AddHs(Chem.MolFromSmiles(smi))
    params = AllChem.ETKDGv3(); params.randomSeed = 42
    assert AllChem.EmbedMolecule(m, params) == 0, key
    assert AllChem.MMFFOptimizeMolecule(m, maxIters=2000) == 0, key
    m.SetProp("_Name", nome)
    sdf = Chem.MolToMolBlock(m) + "$$$$\n"
    out.append({
        "key": key, "nome": nome, "cid": cid, "smiles": smi,
        "formula": rdMolDescriptors.CalcMolFormula(m),
        "massaMolar": round(Descriptors.MolWt(Chem.RemoveHs(m)), 2),
        "sdf": sdf,
    })

ts = ["// Gerado por scripts/build3d.py (RDKit ETKDGv3 + otimização MMFF94).",
      "// Cache local de geometrias 3D: usado de imediato e como fallback quando o PubChem não responde.",
      "",
      "export interface CachedMolecule3D {",
      "  key: string;",
      "  nome: string;",
      "  /** CID oficial do PubChem, quando a molécula é o composto canônico. */",
      "  cid: number | null;",
      "  smiles: string;",
      "  formula: string;",
      "  massaMolar: number;",
      "  /** Bloco SDF V2000 com hidrogênios explícitos. */",
      "  sdf: string;",
      "}",
      "",
      "export const MOLECULES_3D: Record<string, CachedMolecule3D> = {"]
for o in out:
    ts.append(f"  {json.dumps(o['key'])}: {{")
    ts.append(f"    key: {json.dumps(o['key'])},")
    ts.append(f"    nome: {json.dumps(o['nome'], ensure_ascii=False)},")
    ts.append(f"    cid: {json.dumps(o['cid'])},")
    ts.append(f"    smiles: {json.dumps(o['smiles'])},")
    ts.append(f"    formula: {json.dumps(o['formula'])},")
    ts.append(f"    massaMolar: {o['massaMolar']},")
    ts.append(f"    sdf: {json.dumps(o['sdf'])},")
    ts.append("  },")
ts.append("};")
ts.append("")
ts.append("export function getCachedByCid(cid: number): CachedMolecule3D | undefined {")
ts.append("  return Object.values(MOLECULES_3D).find((m) => m.cid === cid);")
ts.append("}")
open(sys.argv[1], "w").write("\n".join(ts) + "\n")
print("ok", len(out))
