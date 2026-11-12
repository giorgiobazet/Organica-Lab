"""Gera src/data/galeria.ts: moléculas de destaque do Laboratório Molecular.

Cada entrada traz geometria 3D (RDKit ETKDGv3 + MMFF94, como em build3d.py), SMILES em
Kekulé (para o bastão 2D) e descritores calculados localmente, usados quando o PubChem não
responde. Com o PubChem disponível, o laboratório troca tudo pelos dados oficiais (o CID é
resolvido pela estrutura, via SMILES isomérico).

Descritores locais (RDKit):
  - logP: Crippen (Wildman & Crippen, J. Chem. Inf. Comput. Sci. 1999, 39, 868);
  - TPSA: Ertl et al., J. Med. Chem. 2000, 43, 3714;
  - doadores/aceptores de H: contagens originais de Lipinski (NH+OH e N+O),
    Lipinski et al., Adv. Drug Deliv. Rev. 1997, 23, 3.

Os rótulos R/S das moléculas quirais são conferidos com o rotulador CIP do próprio RDKit.

Uso: python scripts/build_galeria.py > src/data/galeria.ts
"""
import json

from rdkit import Chem
from rdkit.Chem import AllChem, Crippen, Descriptors, Lipinski, rdMolDescriptors
from rdkit.Chem import rdCIPLabeler

# chave, nome em português, nome em inglês (busca no PubChem), tema, SMILES isomérico,
# rótulos CIP esperados (para conferência) ou None
MOLS = [
    # Fármacos
    ("aspirina", "Ácido acetilsalicílico (Aspirina)", "aspirin", "farmacos", "CC(=O)Oc1ccccc1C(=O)O", None),
    ("paracetamol", "Paracetamol", "acetaminophen", "farmacos", "CC(=O)Nc1ccc(O)cc1", None),
    ("ibuprofeno", "Ibuprofeno", "ibuprofen", "farmacos", "CC(C)Cc1ccc(cc1)C(C)C(=O)O", None),
    ("dipirona", "Dipirona (metamizol, forma ácida)", "metamizole", "farmacos", "CN(CS(=O)(=O)O)c1c(C)n(C)n(-c2ccccc2)c1=O", None),
    ("diclofenaco", "Diclofenaco", "diclofenac", "farmacos", "OC(=O)Cc1ccccc1Nc1c(Cl)cccc1Cl", None),
    ("cafeina", "Cafeína", "caffeine", "farmacos", "Cn1cnc2c1c(=O)n(C)c(=O)n2C", None),
    ("benzocaina", "Benzocaína", "benzocaine", "farmacos", "CCOC(=O)c1ccc(N)cc1", None),
    ("acido-salicilico", "Ácido salicílico", "salicylic acid", "farmacos", "OC(=O)c1ccccc1O", None),
    # Grupos funcionais
    ("etanol", "Etanol (álcool)", "ethanol", "grupos", "CCO", None),
    ("fenol", "Fenol", "phenol", "grupos", "Oc1ccccc1", None),
    ("eter-dietilico", "Éter dietílico (éter)", "diethyl ether", "grupos", "CCOCC", None),
    ("etanal", "Etanal (aldeído)", "acetaldehyde", "grupos", "CC=O", None),
    ("propanona", "Propanona (cetona)", "acetone", "grupos", "CC(C)=O", None),
    ("acido-acetico", "Ácido acético (ácido carboxílico)", "acetic acid", "grupos", "CC(=O)O", None),
    ("acetato-de-etila", "Acetato de etila (éster)", "ethyl acetate", "grupos", "CCOC(C)=O", None),
    ("metilamina", "Metilamina (amina)", "methylamine", "grupos", "CN", None),
    ("acetamida", "Acetamida (amida)", "acetamide", "grupos", "CC(N)=O", None),
    # Estereoquímica
    ("r-talidomida", "(R)-Talidomida", "(R)-thalidomide", "estereo", "O=C1CC[C@@H](N2C(=O)c3ccccc3C2=O)C(=O)N1", ["R"]),
    ("s-talidomida", "(S)-Talidomida", "(S)-thalidomide", "estereo", "O=C1CC[C@H](N2C(=O)c3ccccc3C2=O)C(=O)N1", ["S"]),
    ("acido-l-latico", "Ácido (S)-lático (L-lático)", "L-lactic acid", "estereo", "C[C@H](O)C(=O)O", ["S"]),
    ("acido-d-latico", "Ácido (R)-lático (D-lático)", "D-lactic acid", "estereo", "C[C@@H](O)C(=O)O", ["R"]),
    ("s-ibuprofeno", "(S)-Ibuprofeno", "dexibuprofen", "estereo", "CC(C)Cc1ccc(cc1)[C@H](C)C(=O)O", ["S"]),
    # Conformações e aromáticos
    ("etano", "Etano", "ethane", "conformacoes", "CC", None),
    ("butano", "Butano", "butane", "conformacoes", "CCCC", None),
    ("cicloexano", "Cicloexano", "cyclohexane", "conformacoes", "C1CCCCC1", None),
    ("benzeno", "Benzeno", "benzene", "conformacoes", "c1ccccc1", None),
    ("tolueno", "Tolueno", "toluene", "conformacoes", "Cc1ccccc1", None),
]

TEMAS = {
    "farmacos": "Fármacos",
    "grupos": "Grupos funcionais",
    "estereo": "Estereoquímica",
    "conformacoes": "Conformações e aromáticos",
}


def kekule(mol):
    m = Chem.Mol(mol)
    Chem.Kekulize(m, clearAromaticFlags=True)
    return Chem.MolToSmiles(m, kekuleSmiles=True, isomericSmiles=True)


out = []
for chave, nome, nome_en, tema, smi, cip in MOLS:
    base = Chem.MolFromSmiles(smi)
    assert base is not None, chave
    if cip is not None:
        rdCIPLabeler.AssignCIPLabels(base)
        rotulos = [a.GetProp("_CIPCode") for a in base.GetAtoms() if a.HasProp("_CIPCode")]
        assert rotulos == cip, f"{chave}: CIP {rotulos} != {cip}"
    m = Chem.AddHs(base)
    params = AllChem.ETKDGv3()
    params.randomSeed = 42
    assert AllChem.EmbedMolecule(m, params) == 0, chave
    assert AllChem.MMFFOptimizeMolecule(m, maxIters=2000) == 0, chave
    m.SetProp("_Name", nome)
    out.append(
        {
            "chave": chave,
            "nome": nome,
            "nomeEn": nome_en,
            "tema": tema,
            "smiles": kekule(base),
            "smilesIsomerico": Chem.MolToSmiles(base),
            "formula": rdMolDescriptors.CalcMolFormula(base),
            "massaMolar": round(Descriptors.MolWt(base), 2),
            "logP": round(Crippen.MolLogP(base), 2) + 0.0,
            "tpsa": round(rdMolDescriptors.CalcTPSA(base), 1),
            "doadoresH": Lipinski.NHOHCount(base),
            "aceptoresH": Lipinski.NOCount(base),
            "sdf": Chem.MolToMolBlock(m) + "$$$$\n",
        }
    )

L = [
    "// Gerado por scripts/build_galeria.py (RDKit: ETKDGv3 + MMFF94; descritores Crippen/Ertl/Lipinski).",
    "// Moléculas de destaque do Laboratório Molecular, disponíveis mesmo sem o PubChem.",
    "",
    "export type TemaGaleria = " + " | ".join(json.dumps(t) for t in TEMAS) + ";",
    "",
    "export const TEMAS_GALERIA: Record<TemaGaleria, string> = " + json.dumps(TEMAS, ensure_ascii=False) + ";",
    "",
    "export interface MoleculaGaleria {",
    "  chave: string;",
    "  nome: string;",
    "  /** Nome em inglês (como no PubChem), usado na busca. */",
    "  nomeEn: string;",
    "  tema: TemaGaleria;",
    "  /** SMILES em Kekulé, com estereoquímica, para o bastão 2D. */",
    "  smiles: string;",
    "  /** SMILES isomérico canônico (RDKit), usado para achar o CID no PubChem. */",
    "  smilesIsomerico: string;",
    "  formula: string;",
    "  massaMolar: number;",
    "  /** logP de Crippen (RDKit). */",
    "  logP: number;",
    "  /** TPSA de Ertl (Å²). */",
    "  tpsa: number;",
    "  /** Contagens originais de Lipinski: NH + OH e N + O. */",
    "  doadoresH: number;",
    "  aceptoresH: number;",
    "  sdf: string;",
    "}",
    "",
    "export const FONTE_GALERIA =",
    '  "Calculado com RDKit: geometria ETKDGv3 + MMFF94; logP de Crippen (1999); TPSA de Ertl (2000); doadores e aceptores de H pela contagem original de Lipinski (1997).";',
    "",
    "export const GALERIA: MoleculaGaleria[] = [",
]
for o in out:
    L.append("  {")
    for k in ["chave", "nome", "nomeEn", "tema", "smiles", "smilesIsomerico", "formula", "massaMolar", "logP", "tpsa", "doadoresH", "aceptoresH", "sdf"]:
        L.append(f"    {k}: {json.dumps(o[k], ensure_ascii=False)},")
    L.append("  },")
L.append("];")
print("\n".join(L))
