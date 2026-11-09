"""
Gera os dados do Desafio Espacial de Estereoquímica.

- Rótulos R/S pelo rdCIPLabeler (algoritmo CIP novo do RDKit, Hanson et al. 2018).
- Prioridade dos 4 vizinhos de cada estereocentro pelo ranking CIP legado do RDKit,
  conferida contra o rótulo: com o grupo 4 para trás, 1→2→3 horário deve dar R.
- Geometria 3D: ETKDGv3 + MMFF94.

Uso: python scripts/build_estereo.py src/data/estereo.ts
"""
import json, sys
import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem
from rdkit.Chem import rdCIPLabeler

def embed(smi, seed=5):
    m = Chem.AddHs(Chem.MolFromSmiles(smi))
    p = AllChem.ETKDGv3(); p.randomSeed = seed
    assert AllChem.EmbedMolecule(m, p) == 0, smi
    AllChem.MMFFOptimizeMolecule(m, maxIters=4000)
    return m

def label_from_geometry(pos, center, ranked):
    """ranked = [p1, p2, p3, p4] índices. Retorna 'R' ou 'S' pela geometria."""
    c = pos[center]
    a, b, d4 = pos[ranked[0]] - c, pos[ranked[1]] - c, pos[ranked[3]] - c
    c3 = pos[ranked[2]] - c
    # Olhando com o grupo 4 para trás (observador em -d4): 1→2→3 horário = R
    vol = np.dot(np.cross(a - c3, b - c3), -d4)
    return "S" if vol > 0 else "R"

def centros(m):
    rdCIPLabeler.AssignCIPLabels(m)
    Chem.AssignStereochemistry(m, cleanIt=True, force=True)  # _CIPRank legado
    pos = m.GetConformer().GetPositions()
    out = []
    for at in m.GetAtoms():
        if not at.HasProp("_CIPCode"):
            continue
        label = at.GetProp("_CIPCode")
        if label not in ("R", "S"):
            continue
        viz = [n.GetIdx() for n in at.GetNeighbors()]
        assert len(viz) == 4, "estereocentro sem 4 vizinhos explícitos"
        ranks = {i: int(m.GetAtomWithIdx(i).GetProp("_CIPRank")) for i in viz}
        assert len(set(ranks.values())) == 4, "empate no ranking legado"
        ranked = sorted(viz, key=lambda i: -ranks[i])  # maior rank = prioridade 1
        geo = label_from_geometry(pos, at.GetIdx(), ranked)
        assert geo == label, f"inconsistência CIP em {Chem.MolToSmiles(Chem.RemoveHs(m))}: geo={geo} cip={label}"
        out.append({"atom": at.GetIdx(), "label": label, "prioridades": ranked})
    return out

def pack(m, nome, extra=None):
    d = {
        "nome": nome,
        "smiles": Chem.MolToSmiles(Chem.RemoveHs(m)),
        "elementos": [a.GetSymbol() for a in m.GetAtoms()],
        "ligacoes": sorted([[b.GetBeginAtomIdx(), b.GetEndAtomIdx(), int(b.GetBondTypeAsDouble())] for b in m.GetBonds()]),
        "coords": [round(float(v), 3) for v in m.GetConformer().GetPositions().flatten()],
        "centros": centros(m),
    }
    if extra: d.update(extra)
    return d

def com_rotulo(smiles_opcoes, alvo):
    """Escolhe, entre SMILES isoméricos, o que dá exatamente os rótulos `alvo` (ex.: 'S' ou 'RR')."""
    for s in smiles_opcoes:
        m = embed(s)
        cs = centros(m)
        if "".join(c["label"] for c in sorted(cs, key=lambda c: c["atom"])) == alvo:
            return s, m
    raise SystemExit(f"nenhum SMILES com rótulo {alvo}: {smiles_opcoes}")

# --------------------------- Modo R/S ---------------------------
RS = []
for key, nome, opcoes, alvo, contexto in [
    ("bclf", "Bromoclorofluorometano", ["F[C@H](Cl)Br", "F[C@@H](Cl)Br"], "R",
     "O quiral mais simples possível: quatro substituintes diferentes (Br > Cl > F > H) em um único carbono."),
    ("s-ibuprofeno", "(S)-Ibuprofeno", ["CC(C)Cc1ccc(cc1)[C@H](C)C(=O)O", "CC(C)Cc1ccc(cc1)[C@@H](C)C(=O)O"], "S",
     "Só o (S)-ibuprofeno inibe a COX; o (R) é convertido in vivo no (S) pela enzima AMACR, por isso o racemato funciona."),
    ("r-talidomida", "(R)-Talidomida", ["O=C1CC[C@@H](N2C(=O)c3ccccc3C2=O)C(=O)N1", "O=C1CC[C@H](N2C(=O)c3ccccc3C2=O)C(=O)N1"], "R",
     "O (R) é sedativo e o (S) é teratogênico, mas os dois se interconvertem no organismo: separar os enantiômeros não teria evitado a tragédia."),
    ("tartarico-rr", "Ácido (2R,3R)-tartárico", ["O=C(O)[C@H](O)[C@@H](O)C(=O)O", "O=C(O)[C@@H](O)[C@H](O)C(=O)O", "O=C(O)[C@H](O)[C@H](O)C(=O)O"], "RR",
     "É o ácido L-(+)-tartárico natural da uva. Os dois centros são equivalentes, por isso têm o mesmo descritor."),
    ("s-alanina", "L-Alanina ((S)-alanina)", ["C[C@H](N)C(=O)O", "C[C@@H](N)C(=O)O"], "S",
     "Quase todos os aminoácidos das proteínas são L, que no CIP corresponde a (S); a exceção é a L-cisteína, que é (R)."),
]:
    s, m = com_rotulo(opcoes, alvo)
    RS.append(pack(m, nome, {"key": key, "contexto": contexto}))
    print("RS", key, s, [(c["atom"], c["label"]) for c in RS[-1]["centros"]])

# --------------------------- Modo pares ---------------------------
def rel(sa, sb):
    ma, mb = Chem.MolFromSmiles(sa), Chem.MolFromSmiles(sb)
    if Chem.MolToSmiles(ma, isomericSmiles=False) != Chem.MolToSmiles(mb, isomericSmiles=False):
        return "constitucionais"
    ca, cb = Chem.MolToSmiles(ma), Chem.MolToSmiles(mb)
    if ca == cb:
        return "identicos"
    mirror = Chem.MolFromSmiles(sa.replace("@@", "!").replace("@", "@@").replace("!", "@"))
    return "enantiomeros" if Chem.MolToSmiles(mirror) == cb else "diastereoisomeros"

PARES = []
for key, sa, na, sb, nb, expl, seed_b in [
    ("ibu", "CC(C)Cc1ccc(cc1)[C@H](C)C(=O)O", "(S)-Ibuprofeno", "CC(C)Cc1ccc(cc1)[C@@H](C)C(=O)O", "(R)-Ibuprofeno",
     "Imagens especulares não sobreponíveis: o único centro tem configuração oposta.", 5),
    ("tart-enant", "O=C(O)[C@H](O)[C@@H](O)C(=O)O", "Ácido (2R,3R)-tartárico", "O=C(O)[C@@H](O)[C@H](O)C(=O)O", "Ácido (2S,3S)-tartárico",
     "Todos os centros invertidos: enantiômeros (L- e D-tartárico).", 5),
    ("tart-meso", "O=C(O)[C@H](O)[C@@H](O)C(=O)O", "Ácido (2R,3R)-tartárico", "O=C(O)[C@H](O)[C@H](O)C(=O)O", "Ácido meso-tartárico (2R,3S)",
     "Só um dos dois centros mudou: estereoisômeros que não são imagens especulares, ou seja, diastereoisômeros, com propriedades físicas diferentes (pontos de fusão 168–170 °C vs. 146–148 °C, McMurry).", 5),
    ("meso-meso", "O=C(O)[C@H](O)[C@H](O)C(=O)O", "Ácido meso-tartárico", "O=C(O)[C@@H](O)[C@@H](O)C(=O)O", "Ácido meso-tartárico (outra orientação)",
     "O composto meso tem plano de simetria interno: é idêntico à sua imagem especular, mesmo tendo dois estereocentros.", 9),
    ("dimetil", "C[C@@H]1CCCC[C@@H]1C", "cis-1,2-Dimetilcicloexano", "C[C@@H]1CCCC[C@H]1C", "trans-1,2-Dimetilcicloexano",
     "Cis e trans no anel são diastereoisômeros: mesma conectividade, arranjo espacial diferente, e não são imagens especulares.", 5),
    ("butanol", "CCCCO", "Butan-1-ol", "CCOCC", "Etoxietano (éter dietílico)",
     "Mesma fórmula (C₄H₁₀O), conectividade diferente: álcool vs. éter. Isômeros constitucionais (de função).", 5),
    ("talid", "O=C1CC[C@@H](N2C(=O)c3ccccc3C2=O)C(=O)N1", "Talidomida (enantiômero A)", "O=C1CC[C@H](N2C(=O)c3ccccc3C2=O)C(=O)N1", "Talidomida (enantiômero B)",
     "Os enantiômeros da talidomida: mesma conectividade, configuração oposta no único estereocentro.", 5),
]:
    r = rel(sa, sb)
    PARES.append({"key": key, "relacao": r, "explicacao": expl,
                  "a": pack(embed(sa, 5), na), "b": pack(embed(sb, seed_b), nb)})
    print("PAR", key, r)

ts = [
    "// Gerado por scripts/build_estereo.py (RDKit: rdCIPLabeler + ETKDGv3/MMFF94).",
    "",
    "export interface Estereocentro { atom: number; label: \"R\" | \"S\"; /** vizinhos em ordem de prioridade CIP (1→4) */ prioridades: number[] }",
    "export interface MoleculaEstereo { nome: string; smiles: string; elementos: string[]; ligacoes: [number, number, number][]; coords: number[]; centros: Estereocentro[] }",
    "export interface DesafioRS extends MoleculaEstereo { key: string; contexto: string }",
    "export type Relacao = \"enantiomeros\" | \"diastereoisomeros\" | \"identicos\" | \"constitucionais\";",
    "export interface ParEstereo { key: string; relacao: Relacao; explicacao: string; a: MoleculaEstereo; b: MoleculaEstereo }",
    "",
    f"export const DESAFIOS_RS: DesafioRS[] = {json.dumps(RS, ensure_ascii=False, separators=(',', ':'))};",
    "",
    f"export const PARES_ESTEREO: ParEstereo[] = {json.dumps(PARES, ensure_ascii=False, separators=(',', ':'))};",
    "",
]
open(sys.argv[1], "w").write("\n".join(ts))
print("ok")
