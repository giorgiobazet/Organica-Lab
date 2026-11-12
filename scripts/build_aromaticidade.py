"""Geometria 3D do ciclo-octatetraeno (RDKit ETKDGv3 + MMFF94) para o jogo de aromaticidade.

Confere que a molécula NÃO é planar (conformação de banheira): mede o maior desvio de um átomo
de carbono em relação ao plano médio do anel. O benzeno vem do cache existente (molecules3d.ts).

Uso: python scripts/build_aromaticidade.py > src/data/aromaticidade3d.ts
"""
import json

import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem

m = Chem.AddHs(Chem.MolFromSmiles("C1=CC=CC=CC=C1"))
p = AllChem.ETKDGv3()
p.randomSeed = 11
assert AllChem.EmbedMolecule(m, p) == 0
assert AllChem.MMFFOptimizeMolecule(m, maxIters=5000) == 0
m.SetProp("_Name", "Ciclo-octatetraeno")
c = np.array([list(m.GetConformer().GetAtomPosition(a.GetIdx())) for a in m.GetAtoms() if a.GetSymbol() == "C"])
centro = c.mean(axis=0)
_, _, vt = np.linalg.svd(c - centro)
desvio = float(np.max(np.abs((c - centro) @ vt[2])))
assert desvio > 0.3, desvio  # banheira: bem fora do plano
print("// Gerado por scripts/build_aromaticidade.py (RDKit ETKDGv3 + MMFF94).")
print(f"// Maior desvio de um C em relação ao plano médio do anel: {desvio:.2f} Å (não planar).")
print(f"export const COT_SDF = {json.dumps(Chem.MolToMolBlock(m) + '$$$$' + chr(10))};")
print(f"export const COT_DESVIO = {round(desvio, 2)};")
