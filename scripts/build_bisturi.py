"""
Gera os dados do Bisturi Químico (retroanálise).

Para cada alvo: SMILES 2D, ligações candidatas ao corte (índices de átomos do SMILES de
entrada) com uma versão "mapeada" do SMILES ([C:1]...[O:2]) para o destaque no bastão,
escolha de grupo de proteção, synthons e equivalentes sintéticos com geometria 3D
(RDKit ETKDGv3 + MMFF94; UFF quando o MMFF não tem parâmetros, ex.: Mg).

Uso: python scripts/build_bisturi.py src/data/bisturi.ts
"""
import json, sys
from rdkit import Chem
from rdkit.Chem import AllChem

def mapeado(smi, a, b):
    m = Chem.MolFromSmiles(smi)
    for i, at in enumerate(m.GetAtoms()):
        at.SetAtomMapNum(0)
    m.GetAtomWithIdx(a).SetAtomMapNum(1)
    m.GetAtomWithIdx(b).SetAtomMapNum(2)
    assert m.GetBondBetweenAtoms(a, b) is not None, (smi, a, b)
    Chem.Kekulize(m, clearAromaticFlags=True)
    return Chem.MolToSmiles(m, canonical=False, kekuleSmiles=True)

def kekule(smi):
    m = Chem.MolFromSmiles(smi)
    Chem.Kekulize(m, clearAromaticFlags=True)
    return Chem.MolToSmiles(m, canonical=False, kekuleSmiles=True)

def geo(smi):
    m = Chem.AddHs(Chem.MolFromSmiles(smi))
    p = AllChem.ETKDGv3(); p.randomSeed = 13
    assert AllChem.EmbedMolecule(m, p) == 0, smi
    if AllChem.MMFFHasAllMoleculeParams(m):
        AllChem.MMFFOptimizeMolecule(m, maxIters=4000); ff = "MMFF94"
    else:
        AllChem.UFFOptimizeMolecule(m, maxIters=4000); ff = "UFF"
    return {
        "elementos": [a.GetSymbol() for a in m.GetAtoms()],
        "ligacoes": [[b.GetBeginAtomIdx(), b.GetEndAtomIdx(), int(b.GetBondTypeAsDouble())] for b in m.GetBonds()],
        "coords": [round(float(v), 3) for v in m.GetConformer().GetPositions().flatten()],
        "cargas": [a.GetFormalCharge() for a in m.GetAtoms()],
        "campoDeForca": ff,
    }

PROTECOES = {
    "nenhuma": "Nenhuma proteção",
    "acetal": "Acetal cíclico (etilenoglicol, H⁺) na cetona/aldeído",
    "tbdms": "Éter TBDMS (TBDMS-Cl, imidazol) no álcool",
    "aminoacido": "Boc no NH₂ e éster no COOH (aminoácidos)",
}

ALVOS = []
def alvo(id, nome, smi, uso, cortes, protecao, protecaoExpl, nuc, ele, reagentes, correta, reacao):
    for c in cortes:
        c["smilesMapeado"] = mapeado(smi, *c["atomos"])
    assert sum(1 for c in cortes if c["correta"]) == 1
    ALVOS.append({
        "id": id, "nome": nome, "smiles": kekule(smi), "uso": uso, "cortes": cortes,
        "protecao": protecao, "protecaoExplicacao": protecaoExpl,
        "nucleofilo": {**nuc, "geo": geo(nuc["smiles3d"])},
        "eletrofilo": {**ele, "geo": geo(ele["smiles3d"])},
        "reagentes": reagentes, "reagenteCorreto": correta, "reacao": reacao,
    })

def corte(a, b, rotulo, correta, expl):
    return {"atomos": [a, b], "rotulo": rotulo, "correta": correta, "explicacao": expl}

alvo("benzocaina", "Benzocaína", "CCOC(=O)c1ccc(N)cc1", "Anestésico local de uso tópico.",
     [corte(3, 2, "C(=O)–O do éster", True, "Ésteres se desconectam na ligação acila–O: ácido carboxílico + álcool (esterificação de Fischer)."),
      corte(3, 5, "anel–C=O", False, "Formar uma ligação arila–carbonila exigiria uma acilação no anel, muito mais difícil que fazer o éster."),
      corte(8, 9, "anel–NH₂", False, "O NH₂ aromático vem de redução de NO₂, não de um corte C–N; e não resolve o éster.")],
     "nenhuma", "Fischer em meio ácido: o NH₂ fica protonado (anilínio) e não compete com o etanol. Nenhuma proteção é necessária.",
     {"sinton": "CH₃CH₂O⁻", "nome": "etanol", "smiles3d": "CCO", "papel": "nucleófilo (δ−) no oxigênio"},
     {"sinton": "Ar–C⁺=O (acílio)", "nome": "ácido 4-aminobenzoico (PABA) + H⁺", "smiles3d": "Nc1ccc(C(=O)O)cc1", "papel": "eletrófilo (δ+) no carbono da carbonila"},
     ["Ácido 4-aminobenzoico + etanol, H₂SO₄ (cat.), refluxo", "4-Aminobenzaldeído + etanol, NaOH", "Ácido benzoico + etanol; depois NH₃"], 0,
     "Esterificação de Fischer: o H⁺ ativa a carbonila do PABA e o etanol faz a adição nucleofílica acílica.")

alvo("paracetamol", "Paracetamol", "CC(=O)Nc1ccc(O)cc1", "Analgésico e antitérmico.",
     [corte(1, 3, "C(=O)–N da amida", True, "Amidas se desconectam na ligação acila–N: amina + derivado de ácido (anidrido)."),
      corte(3, 4, "N–anel", False, "Ligar nitrogênio ao anel não é uma etapa simples; o 4-aminofenol já traz essa ligação pronta."),
      corte(7, 8, "anel–OH", False, "O OH fenólico já vem no material de partida; cortá-lo não aproxima de reagentes comerciais.")],
     "nenhuma", "Quimiosseletividade natural: o NH₂ é bem mais nucleofílico que o OH fenólico e é acetilado primeiro, sem proteção.",
     {"sinton": "Ar–NH⁻", "nome": "4-aminofenol", "smiles3d": "Nc1ccc(O)cc1", "papel": "nucleófilo (δ−) no nitrogênio"},
     {"sinton": "CH₃–C⁺=O (acílio)", "nome": "anidrido acético", "smiles3d": "CC(=O)OC(C)=O", "papel": "eletrófilo (δ+) no carbono acila"},
     ["4-Aminofenol + anidrido acético, H₂O, aquecimento", "Fenol + acetamida, H₂SO₄", "4-Nitrofenol + ácido acético"], 0,
     "Acetilação seletiva do NH₂ por adição-eliminação no anidrido; o acetato é o grupo de saída.")

alvo("chalcona", "Chalcona", "O=C(/C=C/c1ccccc1)c1ccccc1", "Esqueleto de flavonoides; base de vários candidatos a fármacos.",
     [corte(2, 3, "Cα=Cβ (enona)", True, "Enonas α,β-insaturadas se desconectam na dupla Cα=Cβ: condensação aldólica (Claisen-Schmidt)."),
      corte(1, 2, "C=O–Cα", False, "Esse corte separa a carbonila do sistema conjugado e não corresponde a uma reação de formação comum."),
      corte(1, 10, "C=O–anel", False, "Seria uma acilação de Friedel-Crafts com um cloreto de cinamoíla, rota mais longa que a aldólica.")],
     "nenhuma", "Só o benzaldeído (sem H α) pode ser eletrófilo e só a acetofenona forma enolato: a reação cruzada é limpa sem proteção.",
     {"sinton": "⁻CH₂–C(=O)Ph (enolato)", "nome": "enolato da acetofenona", "smiles3d": "C=C([O-])c1ccccc1", "papel": "nucleófilo (δ−) no carbono α; planar e conjugado"},
     {"sinton": "Ph–C⁺H–O⁻", "nome": "benzaldeído", "smiles3d": "O=Cc1ccccc1", "papel": "eletrófilo (δ+) no carbono sp² trigonal"},
     ["Acetofenona + benzaldeído, NaOH, etanol", "Benzofenona + acetaldeído, NaOH", "Acetofenona + ácido benzoico, H₂SO₄"], 0,
     "Claisen-Schmidt: o enolato adiciona ao benzaldeído e o aldol desidrata (E1cb) para a enona conjugada (E).")

alvo("aldol", "β-Hidroxicetona aldólica", "CC(=O)CC(C)(C)O", "4-Hidroxi-4-metilpentan-2-ona (diacetona álcool), o aldol da acetona.",
     [corte(3, 4, "Cα–Cβ", True, "β-Hidroxicarbonilas se desconectam entre Cα e Cβ: enolato + carbonila (reação aldólica)."),
      corte(1, 3, "C=O–Cα", False, "Esse corte não gera fragmentos com polaridade natural (nenhum dos dois seria um enolato)."),
      corte(4, 7, "Cβ–OH", False, "O OH em β nasce da própria carbonila do eletrófilo: ele não é um ponto de corte.")],
     "nenhuma", "Autocondensação de um único composto: não há conflito de quimiosseletividade.",
     {"sinton": "⁻CH₂–C(=O)CH₃ (enolato)", "nome": "enolato da acetona", "smiles3d": "C=C([O-])C", "papel": "nucleófilo (δ−) no carbono α; planar"},
     {"sinton": "(CH₃)₂C⁺–O⁻", "nome": "acetona", "smiles3d": "CC(C)=O", "papel": "eletrófilo (δ+) no carbono da carbonila (sp²)"},
     ["Acetona (2 equiv.), Ba(OH)₂, sem aquecimento", "Acetona + metanal, NaOH", "Propanal + propanona, H₂SO₄, calor"], 0,
     "Aldol da acetona com base: o enolato ataca outra molécula de acetona. Sem aquecimento, o aldol não desidrata.")

alvo("claisen", "β-Cetoéster de Claisen", "CCOC(=O)CC(C)=O", "Acetoacetato de etila, bloco clássico da síntese acetoacética.",
     [corte(5, 6, "Cα–C(=O) acila", True, "1,3-Dicarbonilas se desconectam entre Cα e a carbonila: enolato de éster + éster (condensação de Claisen)."),
      corte(6, 7, "C(=O)–CH₃", False, "Gera um synthon CH₃⁻ e um acílio sem equivalente simples nesta rota."),
      corte(3, 5, "C(=O)O–Cα", False, "Quebra a unidade de éster que é justamente o material de partida.")],
     "nenhuma", "Autocondensação do acetato de etila; usar etóxido como base evita transesterificação.",
     {"sinton": "⁻CH₂–CO₂Et (enolato de éster)", "nome": "enolato do acetato de etila", "smiles3d": "C=C([O-])OCC", "papel": "nucleófilo (δ−) no carbono α"},
     {"sinton": "CH₃–C⁺=O", "nome": "acetato de etila", "smiles3d": "CCOC(C)=O", "papel": "eletrófilo (δ+) no carbono acila"},
     ["Acetato de etila (2 equiv.), NaOEt, EtOH; depois H₃O⁺", "Acetato de etila + acetona, NaOH", "Acetato de etila + etanal, H₂SO₄"], 0,
     "Claisen: adição-eliminação do enolato no éster; a desprotonação do β-cetoéster (pKa ≈ 11) puxa o equilíbrio, e o H₃O⁺ final o reprotona.")

alvo("dipeptideo", "Dipeptídeo Ala-Gly", "C[C@H](N)C(=O)NCC(=O)O", "L-Alanil-glicina: modelo da ligação peptídica.",
     [corte(3, 5, "C(=O)–N (peptídica)", True, "A ligação peptídica é uma amida: corta-se acila–N, alanina (C-terminal ativado) + glicina."),
      corte(1, 3, "Cα–C(=O)", False, "Destruiria o esqueleto do aminoácido; não leva a aminoácidos comerciais."),
      corte(5, 6, "N–Cα da Gly", False, "Corte que quebra a glicina em vez de separar os dois aminoácidos.")],
     "aminoacido", "Sem proteção, alanina e glicina formariam Ala-Ala, Gly-Gly, Gly-Ala e polímeros. Protege-se o NH₂ da Ala (Boc) e o COOH da Gly (éster).",
     {"sinton": "⁻NH–CH₂CO₂R", "nome": "glicinato de metila", "smiles3d": "NCC(=O)OC", "papel": "nucleófilo (δ−) no nitrogênio"},
     {"sinton": "Boc-NH–CH(CH₃)–C⁺=O", "nome": "Boc-L-alanina (ativada com DCC)", "smiles3d": "CC(C)(C)OC(=O)N[C@@H](C)C(=O)O", "papel": "eletrófilo (δ+) no carbono acila"},
     ["Boc-Ala + Gly-OMe, DCC; depois TFA e LiOH", "Alanina + glicina, aquecimento", "Alanina + glicina, H₂SO₄ concentrado"], 0,
     "Acoplamento com DCC (ativa o COOH da Boc-Ala), depois remoção do Boc (TFA) e hidrólise do éster (LiOH).")

alvo("grignard-acetal", "5-Hidroxi-5-metil-hexan-2-ona", "CC(=O)CCC(C)(C)O", "Exige proteger a cetona antes do Grignard.",
     [corte(5, 6, "C(OH)–CH₃", True, "Álcool terciário com duas metilas iguais: vem de éster + 2 CH₃MgBr."),
      corte(1, 3, "C=O–CH₂", False, "Não há equivalente simples para esse par de synthons."),
      corte(5, 8, "C–OH", False, "O OH nasce da carbonila que recebe o Grignard; não é ponto de corte.")],
     "acetal", "O CH₃MgBr atacaria a cetona antes (ou junto) do éster. Protege-se a cetona como acetal cíclico, inerte a Grignard, e remove-se com H₃O⁺ no fim.",
     {"sinton": "CH₃⁻", "nome": "brometo de metilmagnésio", "smiles3d": "C[Mg]Br", "papel": "nucleófilo (δ−) no carbono"},
     {"sinton": "R–C⁺(OEt)O⁻", "nome": "levulinato de etila com a cetona protegida (acetal)", "smiles3d": "CCOC(=O)CCC1(C)OCCO1", "papel": "eletrófilo (δ+) no carbono do éster"},
     ["1) etilenoglicol, H⁺  2) 2 CH₃MgBr, éter  3) H₃O⁺", "2 CH₃MgBr direto no levulinato de etila, depois H₃O⁺", "CH₃Li em excesso; depois H₂O"], 0,
     "Acetal protege a cetona; 2 CH₃MgBr convertem o éster em álcool terciário; o H₃O⁺ final remove o acetal e libera a cetona.")

alvo("grignard-tbdms", "1-Fenilbutano-1,4-diol", "OCCCC(O)c1ccccc1", "Exige proteger o álcool do haleto antes de fazer o Grignard.",
     [corte(3, 4, "CH₂–CH(OH)Ph", True, "Álcool secundário: aldeído (PhCHO) + reagente de Grignard de 3 carbonos."),
      corte(0, 1, "HO–CH₂", False, "O OH primário já existe no material de partida; cortar ali não gera ligação C–C."),
      corte(4, 5, "C–OH", False, "O OH nasce da carbonila do benzaldeído; não é ponto de corte.")],
     "tbdms", "O O–H do 3-bromopropan-1-ol destruiria o Grignard (ácido-base). Protege-se como éter TBDMS e remove-se com TBAF (F⁻) no final.",
     {"sinton": "⁻CH₂CH₂CH₂OH", "nome": "1-bromo-3-(TBDMS-oxi)propano (antes do Mg)", "smiles3d": "CC(C)(C)[Si](C)(C)OCCCBr", "papel": "vira nucleófilo (δ−) no carbono após o Mg"},
     {"sinton": "Ph–C⁺H–O⁻", "nome": "benzaldeído", "smiles3d": "O=Cc1ccccc1", "papel": "eletrófilo (δ+) no carbono da carbonila"},
     ["1) TBDMS-Cl, imidazol  2) Mg, éter  3) PhCHO  4) TBAF", "Mg direto no 3-bromopropan-1-ol, depois PhCHO", "PhCHO + propan-1-ol, H⁺"], 0,
     "Protege o OH, forma o Grignard, adiciona ao benzaldeído e remove o TBDMS com fluoreto.")

ts = [
    "// Gerado por scripts/build_bisturi.py (RDKit; geometrias MMFF94, UFF quando indicado).",
    "",
    "export type Protecao = \"nenhuma\" | \"acetal\" | \"tbdms\" | \"aminoacido\";",
    f"export const PROTECOES: Record<Protecao, string> = {json.dumps(PROTECOES, ensure_ascii=False)};",
    "export interface Geo3D { elementos: string[]; ligacoes: [number, number, number][]; coords: number[]; cargas: number[]; campoDeForca: string }",
    "export interface Corte { atomos: [number, number]; rotulo: string; correta: boolean; explicacao: string; smilesMapeado: string }",
    "export interface Fragmento { sinton: string; nome: string; smiles3d: string; papel: string; geo: Geo3D }",
    "export interface AlvoBisturi {",
    "  id: string; nome: string; smiles: string; uso: string; cortes: Corte[];",
    "  protecao: Protecao; protecaoExplicacao: string; nucleofilo: Fragmento; eletrofilo: Fragmento;",
    "  reagentes: string[]; reagenteCorreto: number; reacao: string;",
    "}",
    "",
    f"export const ALVOS_BISTURI: AlvoBisturi[] = {json.dumps(ALVOS, ensure_ascii=False, separators=(',', ':'))};",
    "",
]
open(sys.argv[1], "w").write("\n".join(ts))
print("ok", len(ALVOS), [(a["id"], a["nucleofilo"]["geo"]["campoDeForca"], a["eletrofilo"]["geo"]["campoDeForca"]) for a in ALVOS])
print(ALVOS[0]["cortes"][0]["smilesMapeado"])
