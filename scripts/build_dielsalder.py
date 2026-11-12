"""Geometrias 3D (RDKit ETKDGv3 + MMFF94) dos adutos de Diels-Alder do jogo de Orgânica 2.

- Ciclopentadieno + anidrido maleico: os dois diastereoisômeros cis do aduto norborneno são
  gerados e classificados pela geometria: endo = anidrido do lado da ponte C=C (C5=C6), mais
  longe da ponte CH2 (C7); exo = o contrário. Nada de rótulo por convenção de SMILES.
- 1,3-Butadieno + anidrido maleico: aduto cis (a geometria do dienófilo se conserva), conferido
  pelo diedro H–C–C–H da junção dos anéis.

Uso: python scripts/build_dielsalder.py > src/data/dielsAlder3d.ts
"""
import json

import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem
from rdkit.Chem.EnumerateStereoisomers import EnumerateStereoisomers


def embutir(mol, nome):
    m = Chem.AddHs(mol)
    p = AllChem.ETKDGv3()
    p.randomSeed = 7
    assert AllChem.EmbedMolecule(m, p) == 0, nome
    assert AllChem.MMFFOptimizeMolecule(m, maxIters=5000) == 0, nome
    m.SetProp("_Name", nome)
    return m


def pos(m, i):
    return np.array(m.GetConformer().GetAtomPosition(i))


# Aduto norborneno: anidrido fundido em C2–C3; ponte C7 (CH2); C5=C6.
padrao = Chem.MolFromSmarts("O=C1OC(=O)[CH1:2][CH1:3]1")
saida = {}
for iso in EnumerateStereoisomers(Chem.MolFromSmiles("O=C1OC(=O)C2C1C1C=CC2C1")):
    try:
        m = embutir(iso, "aduto")
    except AssertionError:
        continue  # configurações impossíveis para o biciclo em ponte não embutem
    ponte = [a.GetIdx() for a in m.GetAtoms() if a.GetSymbol() == "C" and a.GetDegree() == 4 and a.GetTotalNumHs(includeNeighbors=True) == 2 and a.IsInRingSize(5)]
    dupla = [b for b in m.GetBonds() if b.GetBondType() == Chem.BondType.DOUBLE and b.GetBeginAtom().GetSymbol() == "C" and b.GetEndAtom().GetSymbol() == "C"]
    if len(ponte) != 1 or len(dupla) != 1:
        continue
    carbonilas = [a.GetIdx() for a in m.GetAtoms() if a.GetSymbol() == "C" and any(n.GetSymbol() == "O" and m.GetBondBetweenAtoms(a.GetIdx(), n.GetIdx()).GetBondType() == Chem.BondType.DOUBLE for n in a.GetNeighbors())]
    centro_anidrido = np.mean([pos(m, i) for i in carbonilas], axis=0)
    meio_dupla = (pos(m, dupla[0].GetBeginAtomIdx()) + pos(m, dupla[0].GetEndAtomIdx())) / 2
    d_dupla = np.linalg.norm(centro_anidrido - meio_dupla)
    d_ponte = np.linalg.norm(centro_anidrido - pos(m, ponte[0]))
    # Junção cis: os dois H dos carbonos de fusão do mesmo lado (diedro pequeno).
    fusao = m.GetSubstructMatch(padrao)
    if not fusao:
        continue
    c2, c3 = fusao[5], fusao[6]
    h2 = [n.GetIdx() for n in m.GetAtomWithIdx(c2).GetNeighbors() if n.GetSymbol() == "H"][0]
    h3 = [n.GetIdx() for n in m.GetAtomWithIdx(c3).GetNeighbors() if n.GetSymbol() == "H"][0]
    diedro = abs(Chem.rdMolTransforms.GetDihedralDeg(m.GetConformer(), h2, c2, c3, h3))
    if diedro > 60:
        continue  # trans: não vem do anidrido maleico (cis)
    tipo = "endo" if d_dupla < d_ponte else "exo"
    if tipo in saida:
        continue
    m.SetProp("_Name", f"aduto {tipo}")
    saida[tipo] = {"sdf": Chem.MolToMolBlock(m) + "$$$$\n", "dDupla": round(float(d_dupla), 2), "dPonte": round(float(d_ponte), 2), "smiles": Chem.MolToSmiles(iso)}

assert set(saida) == {"endo", "exo"}, saida.keys()

ciclo = embutir(Chem.MolFromSmiles("O=C1OC(=O)[C@@H]2CC=CC[C@H]12"), "aduto cis")
fus = ciclo.GetSubstructMatch(padrao)
hs = [[n.GetIdx() for n in ciclo.GetAtomWithIdx(i).GetNeighbors() if n.GetSymbol() == "H"][0] for i in (fus[5], fus[6])]
diedro_cis = abs(Chem.rdMolTransforms.GetDihedralDeg(ciclo.GetConformer(), hs[0], fus[5], fus[6], hs[1]))
assert diedro_cis < 60, diedro_cis
saida["butadieno"] = {"sdf": Chem.MolToMolBlock(ciclo) + "$$$$\n", "diedroHH": round(diedro_cis, 1)}

print("// Gerado por scripts/build_dielsalder.py (RDKit ETKDGv3 + MMFF94).")
print("// endo/exo classificados pela geometria (distância do anidrido à ponte C=C vs. à ponte CH2).")
print(f"export const ADUTO_ENDO = {json.dumps(saida['endo']['sdf'])};")
print(f"export const ADUTO_EXO = {json.dumps(saida['exo']['sdf'])};")
print(f"export const ADUTO_BUTADIENO_CIS = {json.dumps(saida['butadieno']['sdf'])};")
print(f"// endo: anidrido a {saida['endo']['dDupla']} Å da C=C e {saida['endo']['dPonte']} Å do CH2; exo: {saida['exo']['dDupla']} / {saida['exo']['dPonte']} Å; diedro H–C–C–H do aduto cis {saida['butadieno']['diedroHH']}°.")
