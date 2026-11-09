"""
Gera as questões do Laboratório de Alcenos, Alcinos, Álcoois, Éteres e Epóxidos.

Cada opção de produto é um SMILES; para as questões estereoquímicas, a relação cis/trans
de cada opção é CONFERIDA pela geometria 3D (RDKit ETKDGv3 + MMFF94): substituintes do
mesmo lado do plano médio do anel = cis. O produto correto ganha coordenadas 3D.

Uso: python scripts/build_alcenos.py src/data/alcenos.ts
"""
import json, sys
import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem

def embed(smi):
    m = Chem.AddHs(Chem.MolFromSmiles(smi))
    p = AllChem.ETKDGv3(); p.randomSeed = 3
    assert AllChem.EmbedMolecule(m, p) == 0, smi
    AllChem.MMFFOptimizeMolecule(m, maxIters=4000)
    return m

def rel_anel(smi):
    """'cis' ou 'trans' para os dois substituintes não-H de carbonos vizinhos num anel de 6."""
    m = embed(smi)
    pos = m.GetConformer().GetPositions()
    ring = [r for r in m.GetRingInfo().AtomRings() if len(r) == 6][0]
    P = pos[list(ring)]; c = P.mean(0); _, _, vt = np.linalg.svd(P - c); n = vt[2]
    lados = []
    for a in ring:
        at = m.GetAtomWithIdx(a)
        subs = [x for x in at.GetNeighbors() if x.GetIdx() not in ring and x.GetAtomicNum() > 1]
        # escolhe o heteroátomo/grupo de maior número atômico como referência (ex.: OH em vez de CH3? não: todos contam)
        for s in subs:
            lados.append((a, s.GetSymbol(), np.sign(np.dot(pos[s.GetIdx()] - pos[a], n))))
    assert len(lados) == 2, (smi, lados)
    return "cis" if lados[0][2] == lados[1][2] else "trans"

def rel_alceno(smi):
    m = Chem.MolFromSmiles(smi)
    for b in m.GetBonds():
        if b.GetStereo() == Chem.BondStereo.STEREOZ: return "cis"
        if b.GetStereo() == Chem.BondStereo.STEREOE: return "trans"
    raise SystemExit("sem estereo: " + smi)

def pack3d(smi):
    m = embed(smi)
    return {
        "elementos": [a.GetSymbol() for a in m.GetAtoms()],
        "ligacoes": [[b.GetBeginAtomIdx(), b.GetEndAtomIdx(), int(b.GetBondTypeAsDouble())] for b in m.GetBonds()],
        "coords": [round(float(v), 3) for v in m.GetConformer().GetPositions().flatten()],
    }

Q = []
def q(id, tipo, substrato, reagentes, opcoes, correta, explicacao, tresd=False, verif=None):
    """opcoes: lista de (smiles, nome). verif: dict nome→'cis'/'trans' conferido por geometria."""
    if verif:
        for (smi, nome) in opcoes:
            if nome in verif:
                got = verif[nome][0](smi)
                assert got == verif[nome][1], f"{id}: {nome} deu {got}, esperado {verif[nome][1]} ({smi})"
    item = {"id": id, "tipo": tipo, "substrato": substrato[0], "substratoNome": substrato[1], "reagentes": reagentes,
            "opcoes": [{"smiles": s, "nome": n} for s, n in opcoes], "correta": correta, "explicacao": explicacao}
    if tresd:
        item["produto3d"] = pack3d(opcoes[correta][0])
    Q.append(item)

# ---------------- Regiosseletividade (2D) ----------------
q("hbr", "regio", ("C=CC", "propeno"), "HBr",
  [("CC(C)Br", "2-bromopropano"), ("CCCBr", "1-bromopropano")], 0,
  "Markovnikov: o H⁺ entra no carbono com mais H e forma o carbocátion secundário, mais estável; o Br⁻ fica no C2.")
q("hbr-peroxido", "regio", ("C=CC", "propeno"), "HBr, ROOR (peróxido), hν",
  [("CC(C)Br", "2-bromopropano"), ("CCCBr", "1-bromopropano")], 1,
  "Com peróxido a adição é radicalar: o Br• ataca o carbono terminal para gerar o radical secundário, mais estável. Resultado anti-Markovnikov (só funciona com HBr).")
q("hidratacao", "regio", ("C=C(C)C", "2-metilpropeno"), "H₂O, H₂SO₄ (cat.)",
  [("CC(C)(C)O", "2-metilpropan-2-ol"), ("CC(C)CO", "2-metilpropan-1-ol")], 0,
  "Hidratação ácida via carbocátion terciário: OH no carbono mais substituído (Markovnikov).")
q("hidroboracao", "regio", ("C=C(C)C", "2-metilpropeno"), "1) BH₃·THF  2) H₂O₂, NaOH",
  [("CC(C)(C)O", "2-metilpropan-2-ol"), ("CC(C)CO", "2-metilpropan-1-ol")], 1,
  "Hidroboração-oxidação: o boro entra no carbono menos impedido e é trocado por OH com retenção. Anti-Markovnikov, sem carbocátion.")
q("oximercuracao", "regio", ("C=CCCCC", "hex-1-eno"), "1) Hg(OAc)₂, H₂O  2) NaBH₄",
  [("CC(O)CCCC", "hexan-2-ol"), ("OCCCCCC", "hexan-1-ol")], 0,
  "Oximercuração-desmercuração: Markovnikov via íon mercurínio em ponte, sem rearranjo de carbocátion.")
q("alcino-hidratacao", "regio", ("C#CC", "propino"), "H₂O, H₂SO₄, HgSO₄",
  [("CC(C)=O", "propanona"), ("CCC=O", "propanal")], 0,
  "O enol Markovnikov (OH no C2) tautomeriza para a cetona. Alcinos terminais dão metilcetonas.")
q("alcino-hidroboracao", "regio", ("C#CC", "propino"), "1) 9-BBN (ou disiamilborano)  2) H₂O₂, NaOH",
  [("CC(C)=O", "propanona"), ("CCC=O", "propanal")], 1,
  "Borano volumoso no carbono terminal → enol anti-Markovnikov → aldeído após tautomerização.")

# ---------------- Estereosseletividade (3D) ----------------
cis_t = lambda s: rel_anel(s)
q("br2", "estereo", ("C1=CCCCC1", "ciclo-hexeno"), "Br₂, CH₂Cl₂",
  [("Br[C@@H]1CCCC[C@H]1Br", "trans-1,2-dibromociclo-hexano"), ("Br[C@@H]1CCCC[C@@H]1Br", "cis-1,2-dibromociclo-hexano")], 0,
  "Adição anti: o Br⁻ abre o íon bromônio pela face oposta. Produto trans (racemato).", True,
  {"trans-1,2-dibromociclo-hexano": (cis_t, "trans"), "cis-1,2-dibromociclo-hexano": (cis_t, "cis")})
q("oso4", "estereo", ("C1=CCCCC1", "ciclo-hexeno"), "1) OsO₄  2) NaHSO₃, H₂O",
  [("O[C@@H]1CCCC[C@H]1O", "trans-ciclo-hexano-1,2-diol"), ("O[C@@H]1CCCC[C@@H]1O", "cis-ciclo-hexano-1,2-diol")], 1,
  "Adição syn: o OsO₄ forma um éster ósmico cíclico pela mesma face. Diol cis (composto meso).", True,
  {"trans-ciclo-hexano-1,2-diol": (cis_t, "trans"), "cis-ciclo-hexano-1,2-diol": (cis_t, "cis")})
q("epoxido-h3o", "estereo", ("C1=CCCCC1", "ciclo-hexeno"), "1) mCPBA  2) H₃O⁺",
  [("O[C@@H]1CCCC[C@H]1O", "trans-ciclo-hexano-1,2-diol"), ("O[C@@H]1CCCC[C@@H]1O", "cis-ciclo-hexano-1,2-diol")], 0,
  "O epóxido se forma numa face; a água abre o epóxido protonado pela face oposta (SN2). Diol trans: o complemento anti do OsO₄.", True,
  {"trans-ciclo-hexano-1,2-diol": (cis_t, "trans"), "cis-ciclo-hexano-1,2-diol": (cis_t, "cis")})
q("hidroboracao-anel", "estereo", ("CC1=CCCCC1", "1-metilciclo-hexeno"), "1) BH₃·THF  2) H₂O₂, NaOH",
  [("C[C@@H]1CCCC[C@H]1O", "trans-2-metilciclo-hexan-1-ol"), ("C[C@@H]1CCCC[C@@H]1O", "cis-2-metilciclo-hexan-1-ol"), ("CC1(O)CCCCC1", "1-metilciclo-hexan-1-ol")], 0,
  "Anti-Markovnikov e syn: H e B entram pela mesma face, e o OH substitui o B com retenção. Como o H ficou cis ao OH, a metila fica trans.", True,
  {"trans-2-metilciclo-hexan-1-ol": (cis_t, "trans"), "cis-2-metilciclo-hexan-1-ol": (cis_t, "cis")})
q("lindlar", "estereo", ("CC#CC", "but-2-ino"), "H₂, Pd/CaCO₃ (Lindlar), quinolina",
  [("C/C=C\\C", "cis-but-2-eno"), ("C/C=C/C", "trans-but-2-eno"), ("CCCC", "butano")], 0,
  "O catalisador envenenado para no alceno e entrega os dois H pela mesma face: adição syn → alceno cis (Z).", True,
  {"cis-but-2-eno": (rel_alceno, "cis"), "trans-but-2-eno": (rel_alceno, "trans")})
q("na-nh3", "estereo", ("CC#CC", "but-2-ino"), "Na, NH₃ (líq.), −78 °C",
  [("C/C=C\\C", "cis-but-2-eno"), ("C/C=C/C", "trans-but-2-eno"), ("CCCC", "butano")], 1,
  "Redução por metal dissolvido: o ânion-radical vinílico adota a geometria trans, mais estável. Alceno trans (E).", True,
  {"cis-but-2-eno": (rel_alceno, "cis"), "trans-but-2-eno": (rel_alceno, "trans")})

# ---------------- Abertura de epóxidos (2D) ----------------
q("epoxido-basico", "epoxido", ("CC1(C)CO1", "2,2-dimetiloxirano"), "CH₃O⁻ Na⁺, CH₃OH",
  [("COCC(C)(C)O", "1-metoxi-2-metilpropan-2-ol"), ("COC(C)(C)CO", "2-metoxi-2-metilpropan-1-ol")], 0,
  "Meio básico: nucleófilo forte, SN2 no carbono MENOS impedido (o CH₂).")
q("epoxido-acido", "epoxido", ("CC1(C)CO1", "2,2-dimetiloxirano"), "CH₃OH, H₂SO₄ (cat.)",
  [("COCC(C)(C)O", "1-metoxi-2-metilpropan-2-ol"), ("COC(C)(C)CO", "2-metoxi-2-metilpropan-1-ol")], 1,
  "Meio ácido: o epóxido protonado tem caráter de carbocátion no carbono MAIS substituído, e o metanol ataca lá.")

ts = [
    "// Gerado por scripts/build_alcenos.py (cis/trans conferidos pela geometria 3D no RDKit).",
    "",
    "export interface OpcaoProduto { smiles: string; nome: string }",
    "export interface QuestaoAlceno {",
    "  id: string; tipo: \"regio\" | \"estereo\" | \"epoxido\";",
    "  substrato: string; substratoNome: string; reagentes: string;",
    "  opcoes: OpcaoProduto[]; correta: number; explicacao: string;",
    "  produto3d?: { elementos: string[]; ligacoes: [number, number, number][]; coords: number[] };",
    "}",
    "",
    f"export const QUESTOES_ALCENOS: QuestaoAlceno[] = {json.dumps(Q, ensure_ascii=False, indent=1)};",
    "",
]
open(sys.argv[1], "w").write("\n".join(ts))
print("ok", len(Q), "questões")
