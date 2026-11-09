"""
Gera a trajetória de inversão de anel (chair flip) do cicloexano e derivados.

Método: interpolação das 6 torsões do anel entre conformações-chave
(cadeira A -> bote-torcido -> bote -> bote-torcido' -> cadeira B), com otimização
MMFF94 restrita em cada passo (RDKit). As torsões do bote/bote-torcido seguem a
pseudorrotação tau_j = A cos(theta + 4*pi*j/3) (A ~ 63.5 graus).

Uso: python scripts/build_ringflip.py src/data/ringFlip.ts
"""
import json, math, sys
import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem
from rdkit.Chem import rdMolTransforms as T
from rdkit.ForceField import rdForceField  # noqa: F401

STEPS = 10  # passos entre conformações-chave
A = 63.5

def pseudo(theta):
    return [A * math.cos(theta + 4 * math.pi * j / 3) for j in range(6)]

CHAIR_A = [55, -55, 55, -55, 55, -55]
TB1 = pseudo(math.pi / 3)
BOAT = pseudo(math.pi / 2)
TB2 = pseudo(2 * math.pi / 3)
CHAIR_B = [-x for x in CHAIR_A]
KEYS = [("Cadeira", CHAIR_A), ("Bote-torcido", TB1), ("Bote", BOAT), ("Bote-torcido", TB2), ("Cadeira invertida", CHAIR_B)]

MOLS = [
    ("cicloexano", "Cicloexano", "C1CCCCC1"),
    ("metilcicloexano", "Metilcicloexano", "CC1CCCCC1"),
    ("terc-butilcicloexano", "terc-Butilcicloexano", "CC(C)(C)C1CCCCC1"),
    ("cis-12-dimetilcicloexano", "cis-1,2-Dimetilcicloexano", "C[C@@H]1CCCC[C@@H]1C"),
    ("trans-12-dimetilcicloexano", "trans-1,2-Dimetilcicloexano", "C[C@@H]1CCCC[C@H]1C"),
]

def ring_atoms(m):
    ri = m.GetRingInfo()
    ring = [r for r in ri.AtomRings() if len(r) == 6][0]
    # ordena pelo caminho do anel começando no carbono substituído (se houver)
    start = min(ring, key=lambda a: (m.GetAtomWithIdx(a).GetDegree() <= 2 + m.GetAtomWithIdx(a).GetTotalNumHs() and 1, a))
    order = [start]
    prev = None
    while len(order) < 6:
        cur = order[-1]
        nxt = [n.GetIdx() for n in m.GetAtomWithIdx(cur).GetNeighbors() if n.GetIdx() in ring and n.GetIdx() != prev and n.GetIdx() not in order]
        prev = cur
        order.append(nxt[0])
    # Regra dos menores localizadores (IUPAC): escolhe o sentido que numera os substituintes mais baixo.
    def locs(o):
        return sorted(i + 1 for i, a in enumerate(o) if any(n.GetIdx() not in ring and n.GetAtomicNum() != 1 for n in m.GetAtomWithIdx(a).GetNeighbors()))
    rev = [order[0]] + order[1:][::-1]
    return rev if locs(rev) < locs(order) else order

def constrained_opt(m, conf_id, ring, torsions, k=200.0):
    props = AllChem.MMFFGetMoleculeProperties(m)
    ff = AllChem.MMFFGetMoleculeForceField(m, props, confId=conf_id)
    for j in range(6):
        a, b, c, d = ring[j], ring[(j + 1) % 6], ring[(j + 2) % 6], ring[(j + 3) % 6]
        t = torsions[j]
        ff.MMFFAddTorsionConstraint(a, b, c, d, False, t - 1.0, t + 1.0, k)
    ff.Minimize(maxIts=4000)
    # energia sem as restrições
    ff2 = AllChem.MMFFGetMoleculeForceField(m, props, confId=conf_id)
    return ff2.CalcEnergy() * 4.184  # kcal -> kJ

def kabsch(P, Q):
    Pc, Qc = P - P.mean(0), Q - Q.mean(0)
    H = Pc.T @ Qc
    U, S, Vt = np.linalg.svd(H)
    d = np.sign(np.linalg.det(Vt.T @ U.T))
    D = np.diag([1, 1, d])
    R = Vt.T @ D @ U.T
    return (R @ Pc.T).T + Q.mean(0)

def ring_normal(pos, ring):
    P = pos[ring]
    c = P.mean(0)
    _, _, vt = np.linalg.svd(P - c)
    return vt[2], c

def classify_subst(m, pos, ring):
    """Para cada substituinte pesado do anel: 'axial' ou 'equatorial'."""
    n, _ = ring_normal(pos, ring)
    out = []
    for i, ra in enumerate(ring):
        for nb in m.GetAtomWithIdx(ra).GetNeighbors():
            if nb.GetIdx() in ring or nb.GetAtomicNum() == 1:
                continue
            v = pos[nb.GetIdx()] - pos[ra]
            cosang = abs(np.dot(v, n)) / np.linalg.norm(v)
            out.append({"ringPos": i + 1, "atom": nb.GetIdx(), "ringAtom": ra, "posicao": "axial" if cosang > 0.75 else "equatorial"})
    return out

def diaxial_atoms(m, pos, ring):
    """Átomos envolvidos em interações 1,3-diaxiais com substituintes axiais pesados."""
    n, _ = ring_normal(pos, ring)
    hits = set()
    for s in classify_subst(m, pos, ring):
        if s["posicao"] != "axial":
            continue
        i = s["ringPos"] - 1
        side = np.sign(np.dot(pos[s["atom"]] - pos[s["ringAtom"]], n))
        for k in (2, 4):
            ra = ring[(i + k) % 6]
            for nb in m.GetAtomWithIdx(ra).GetNeighbors():
                if nb.GetIdx() in ring:
                    continue
                v = pos[nb.GetIdx()] - pos[ra]
                if abs(np.dot(v, n)) / np.linalg.norm(v) > 0.75 and np.sign(np.dot(v, n)) == side:
                    hits.add(nb.GetIdx())
                    hits.add(s["atom"])
    return sorted(hits)

result = {}
for key, nome, smi in MOLS:
    m = Chem.AddHs(Chem.MolFromSmiles(smi))
    p = AllChem.ETKDGv3(); p.randomSeed = 7
    AllChem.EmbedMolecule(m, p)
    AllChem.MMFFOptimizeMolecule(m)
    ring = ring_atoms(m)

    # trajetória em torsões
    path, labels = [], []
    for (la, ta), (lb, tb) in zip(KEYS[:-1], KEYS[1:]):
        for s in range(STEPS):
            t = s / STEPS
            path.append([a + (b - a) * t for a, b in zip(ta, tb)])
            labels.append(la if s == 0 else None)
    path.append(CHAIR_B); labels.append(KEYS[-1][0])

    frames, energias = [], []
    prev = None
    for tors in path:
        e = constrained_opt(m, 0, ring, tors)
        pos = np.array(m.GetConformer().GetPositions())
        if prev is not None:
            pos = kabsch(pos, prev)
        prev = pos
        frames.append(pos)
        energias.append(e)

    # cadeiras finais relaxadas sem restrição (energia real dos mínimos)
    def relaxed(pos):
        m2 = Chem.Mol(m); c = m2.GetConformer()
        for i, q in enumerate(pos): c.SetAtomPosition(i, q.tolist())
        AllChem.MMFFOptimizeMolecule(m2, maxIters=4000)
        props = AllChem.MMFFGetMoleculeProperties(m2)
        return AllChem.MMFFGetMoleculeForceField(m2, props).CalcEnergy() * 4.184, np.array(m2.GetConformer().GetPositions())
    eA, posA = relaxed(frames[0]); eB, posB = relaxed(frames[-1])
    frames[0] = kabsch(posA, frames[1]); frames[-1] = kabsch(posB, frames[-2])
    energias[0], energias[-1] = eA, eB
    e0 = min(energias)
    energias = [round(e - e0, 2) for e in energias]

    result[key] = {
        "key": key, "nome": nome, "smiles": smi,
        "anel": ring,
        "rotulos": labels,
        "energiaMMFF": energias,
        "elementos": [a.GetSymbol() for a in m.GetAtoms()],
        "ligacoes": [[b.GetBeginAtomIdx(), b.GetEndAtomIdx(), int(b.GetBondTypeAsDouble())] for b in m.GetBonds()],
        "frames": [[round(float(x), 3) for x in f.flatten()] for f in frames],
        "cadeiraA": {"substituintes": classify_subst(m, frames[0], ring), "diaxial": diaxial_atoms(m, frames[0], ring)},
        "cadeiraB": {"substituintes": classify_subst(m, frames[-1], ring), "diaxial": diaxial_atoms(m, frames[-1], ring)},
    }
    sa = result[key]["cadeiraA"]["substituintes"]; sb = result[key]["cadeiraB"]["substituintes"]
    print(f"{key}: frames={len(frames)} Emax={max(energias):.1f} kJ  ΔE(B-A)={energias[-1]-energias[0]:+.1f} kJ  "
          f"A={[s['posicao'] for s in sa]} B={[s['posicao'] for s in sb]} diaxA={len(result[key]['cadeiraA']['diaxial'])} diaxB={len(result[key]['cadeiraB']['diaxial'])}")
    kidx = [i for i, l in enumerate(labels) if l]
    print("   chaves:", [(labels[i], energias[i]) for i in kidx])

out = sys.argv[1]
lines = [
    "// Gerado por scripts/build_ringflip.py (RDKit, MMFF94 com restrição das torsões do anel).",
    "// Trajetória cadeira -> bote-torcido -> bote -> bote-torcido -> cadeira invertida.",
    "",
    "export interface SubstituinteAnel { ringPos: number; atom: number; ringAtom: number; posicao: \"axial\" | \"equatorial\" }",
    "export interface CadeiraInfo { substituintes: SubstituinteAnel[]; /** índices (0-based) de átomos em interação 1,3-diaxial */ diaxial: number[] }",
    "export interface RingFlipData {",
    "  key: string; nome: string; smiles: string; anel: number[];",
    "  /** rótulo da conformação-chave em cada quadro (null nos intermediários) */ rotulos: (string | null)[];",
    "  /** energia MMFF94 relativa (kJ/mol) de cada quadro */ energiaMMFF: number[];",
    "  elementos: string[]; ligacoes: [number, number, number][];",
    "  /** coordenadas xyz achatadas (Å) de cada quadro */ frames: number[][];",
    "  cadeiraA: CadeiraInfo; cadeiraB: CadeiraInfo;",
    "}",
    "",
    f"export const RING_FLIP: Record<string, RingFlipData> = {json.dumps(result, ensure_ascii=False, separators=(",", ":"))};",
    "",
]
open(out, "w").write("\n".join(lines))
print("ok", out)
