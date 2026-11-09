"""
Gera os dados do CSI Químico (Análise Orgânica) a partir dos espectros do NIST Chemistry WebBook.

Entrada: pasta com os JCAMP-DX baixados de
  https://webbook.nist.gov/cgi/cbook.cgi?JCAMP=<ID>&Index=<n>&Type=Mass|IR
  (nomes <ID>_Mass.jdx e <ID>_IR<n>.jdx; Index 0 é salvo como <ID>_IR.jdx)

- EM: picos do NIST MS Data Center normalizados ao pico base (100%).
- IV: espectro convertido para %T, reamostrado a cada 4 cm⁻¹; a posição de cada banda
  diagnóstica é o máximo de absorbância REAL dentro de uma janela.
- RMN ¹H/¹³C (CDCl₃) e testes por via úmida: valores de referência de literatura
  (Pavia, Introdução à Espectroscopia; Silverstein), não presentes no WebBook.

Uso: python scripts/build_csi.py <pasta_jcamp> src/data/csi.ts
"""
import json, math, re, sys

PASTA, SAIDA = sys.argv[1], sys.argv[2]

def ler(path):
    txt = open(path, encoding="latin-1").read().replace("\r", "")
    meta = dict(re.findall(r"^##([^=]+)=(.*)$", txt, re.M))
    return txt, meta

def ler_ms(id):
    txt, meta = ler(f"{PASTA}/{id}_Mass.jdx")
    bloco = txt.split("##PEAK TABLE=")[1].split("##END")[0]
    pares = [tuple(map(float, p.split(","))) for p in re.findall(r"\d+(?:\.\d+)?,\d+(?:\.\d+)?", bloco.split("\n", 1)[1])]
    top = max(y for _, y in pares)
    picos = [{"mz": int(round(x)), "int": round(100 * y / top, 1)} for x, y in pares if 100 * y / top >= 1.0]
    return picos, meta.get("ORIGIN", "NIST Mass Spectrometry Data Center").strip()

def ler_ir(arquivo):
    txt, meta = ler(f"{PASTA}/{arquivo}")
    xf, yf = float(meta["XFACTOR"]), float(meta["YFACTOR"])
    if "DELTAX" in meta:
        dx = float(meta["DELTAX"])
    else:
        dx = (float(meta["LASTX"]) - float(meta["FIRSTX"])) / (int(meta["NPOINTS"]) - 1)
    yunits = meta["YUNITS"].strip().upper()
    corpo = txt.split("##XYDATA=(X++(Y..Y))")[1].split("##END")[0].strip().split("\n")
    pts = {}
    for linha in corpo:
        nums = re.findall(r"[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?", linha)
        if not nums:
            continue
        x0 = float(nums[0]) * xf
        for k, v in enumerate(nums[1:]):
            pts[round(x0 + k * dx, 2)] = float(v) * yf
    xs = sorted(pts)
    # absorbância
    if "ABSORB" in yunits:
        A = {x: pts[x] for x in xs}
    else:
        T = {x: pts[x] for x in xs}
        mx = max(T.values())
        A = {x: -math.log10(max(T[x] / mx if mx > 1.5 else T[x], 1e-4)) for x in xs}
    amax = max(A.values())
    # %T normalizado (banda mais forte ≈ 5 %T) e reamostrado a 4 cm⁻¹
    def tpc(a):
        return round(100 * 10 ** (-1.3 * a / amax), 1)
    grade = []
    x = math.ceil(max(min(xs), 450) / 4) * 4
    while x <= min(max(xs), 4000):
        viz = [xx for xx in xs if abs(xx - x) <= 2.5]
        if viz:
            grade.append([x, tpc(max(A[v] for v in viz))])
        x += 4
    estado = meta.get("STATE", "").strip()
    origem = meta.get("ORIGIN", "").strip()
    return A, grade, estado, origem

def pico(A, lo, hi):
    """Posição da banda: centro do platô (≥ 97% do máximo) que contém o máximo da janela.
    Em bandas saturadas (T ≈ 0) o topo é plano, e o centro do platô é a leitura correta."""
    janela = sorted((x, a) for x, a in A.items() if lo <= x <= hi)
    if not janela:
        return None
    i_max = max(range(len(janela)), key=lambda i: janela[i][1])
    amax = janela[i_max][1]
    i0 = i1 = i_max
    while i0 > 0 and janela[i0 - 1][1] >= 0.97 * amax:
        i0 -= 1
    while i1 < len(janela) - 1 and janela[i1 + 1][1] >= 0.97 * amax:
        i1 += 1
    x = (janela[i0][0] + janela[i1][0]) / 2
    return int(5 * round(x / 5)), amax / max(A.values())

CASOS = [
    dict(id="acetofenona", nist="C98862", ir="C98862_IR3.jdx", nome="Acetofenona", smiles="CC(=O)C1=CC=CC=C1", formula="C₈H₈O", mm=120.15,
         bandas=[(3000, 3100, "C–H sp² aromático"), (1660, 1720, "C=O conjugada ao anel"), (1570, 1610, "C=C do anel"), (1240, 1300, "C–C(=O)–C"), (740, 780, "C–H fora do plano (monossubstituído)"), (680, 700, "C–H fora do plano (monossubstituído)")],
         msnotas={120: "M⁺• (C₈H₈O)", 105: "C₆H₅CO⁺ (perda de •CH₃)", 77: "C₆H₅⁺ (fenila)", 51: "C₄H₃⁺ (do anel)", 43: "CH₃CO⁺"},
         h1=[(7.96, "d", 2, 7.5, "H orto ao C=O"), (7.56, "t", 1, 7.4, "H para"), (7.46, "t", 2, 7.6, "H meta"), (2.61, "s", 3, None, "CH₃ ligado ao C=O")],
         c13=[(198.1, "C=O (cetona conjugada)"), (137.1, "C ipso"), (133.1, "CH para"), (128.6, "CH meta"), (128.3, "CH orto"), (26.6, "CH₃")],
         testes=dict(dnph=(True, "Precipitado vermelho-alaranjado (2,4-dinitrofenil-hidrazona; cor intensa por conjugação)."),
                     tollens=(False, "Nenhum espelho de prata: cetonas não são oxidadas."),
                     lucas=(False, "Não se aplica: não há OH; a mistura não turva."),
                     nahco3=(False, "Sem efervescência: não há grupo ácido."),
                     beilstein=(False, "Chama sem cor verde; AgNO₃ não precipita: sem halogênio.")),
         laudo="Cetona aromática: C=O conjugada no IV, pico base m/z 105 (benzoíla), 5 H aromáticos e um CH₃ singleto em δ 2,61."),
    dict(id="butanona", nist="C78933", ir="C78933_IR2.jdx", nome="Butanona", smiles="CCC(C)=O", formula="C₄H₈O", mm=72.11,
         bandas=[(2900, 3000, "C–H sp³"), (1700, 1740, "C=O de cetona"), (1350, 1380, "CH₃ (dobramento)"), (1150, 1200, "C–C(=O)–C")],
         msnotas={72: "M⁺• (C₄H₈O)", 57: "C₂H₅CO⁺ (perda de •CH₃)", 43: "CH₃CO⁺ (perda de •C₂H₅)", 29: "C₂H₅⁺"},
         h1=[(2.44, "q", 2, 7.3, "CH₂ vizinho ao C=O"), (2.14, "s", 3, None, "CH₃ ligado ao C=O"), (1.06, "t", 3, 7.3, "CH₃ do etila")],
         c13=[(209.3, "C=O (cetona)"), (36.9, "CH₂"), (29.4, "CH₃–C=O"), (7.9, "CH₃ do etila")],
         testes=dict(dnph=(True, "Precipitado amarelo-alaranjado (2,4-DNP-hidrazona)."),
                     tollens=(False, "Nenhum espelho de prata: cetona."),
                     lucas=(False, "Não se aplica: não há OH."),
                     nahco3=(False, "Sem efervescência."),
                     beilstein=(False, "Sem halogênio.")),
         laudo="Cetona alifática: C=O em ~1715 cm⁻¹, m/z 43 (acetila) como pico base e o padrão etila (q + t) com um CH₃ singleto."),
    dict(id="acetato-de-etila", nist="C141786", ir="C141786_IR2.jdx", nome="Acetato de etila", smiles="CCOC(C)=O", formula="C₄H₈O₂", mm=88.11,
         bandas=[(2900, 3000, "C–H sp³"), (1700, 1790, "C=O de éster"), (1200, 1270, "C–O (C(=O)–O, forte)"), (1030, 1070, "O–C–C")],
         msnotas={88: "M⁺• (C₄H₈O₂)", 61: "CH₃C(OH)₂⁺ (rearranjo)", 45: "C₂H₅O⁺", 43: "CH₃CO⁺", 29: "C₂H₅⁺"},
         h1=[(4.12, "q", 2, 7.1, "O–CH₂ (desblindado pelo O)"), (2.04, "s", 3, None, "CH₃–C=O"), (1.26, "t", 3, 7.1, "CH₃ do etila")],
         c13=[(171.1, "C=O (éster)"), (60.4, "O–CH₂"), (21.0, "CH₃–C=O"), (14.2, "CH₃ do etila")],
         testes=dict(dnph=(False, "Sem precipitado: a carbonila de éster não forma hidrazona nessas condições."),
                     tollens=(False, "Nenhum espelho de prata."),
                     lucas=(False, "Não se aplica: não há OH."),
                     nahco3=(False, "Sem efervescência: éster não é ácido."),
                     beilstein=(False, "Sem halogênio.")),
         laudo="Éster: C=O em ~1745 cm⁻¹ com C–O forte em ~1240 cm⁻¹, DNPH negativo e o quarteto do O–CH₂ deslocado para δ 4,12."),
    dict(id="acido-propanoico", nist="C79094", ir="C79094_IR.jdx", nome="Ácido propanoico", smiles="CCC(=O)O", formula="C₃H₆O₂", mm=74.08,
         bandas=[(3500, 3650, "O–H livre (monômero, fase gasosa)"), (2500, 3350, "O–H do dímero (larga, sobreposta às C–H)"), (1740, 1810, "C=O de ácido (monômero)"), (1100, 1200, "C–O")],
         msnotas={74: "M⁺• (C₃H₆O₂)", 73: "[M − H]⁺", 57: "C₂H₅CO⁺ (perda de •OH)", 45: "COOH⁺", 29: "C₂H₅⁺", 28: "C₂H₄⁺• / CO⁺•"},
         h1=[(11.7, "s", 1, None, "COOH (larga, troca com D₂O)"), (2.38, "q", 2, 7.5, "CH₂ vizinho ao C=O"), (1.16, "t", 3, 7.5, "CH₃")],
         c13=[(181.2, "C=O (ácido)"), (27.6, "CH₂"), (9.0, "CH₃")],
         testes=dict(dnph=(False, "Sem precipitado: ácidos não formam hidrazona."),
                     tollens=(False, "Nenhum espelho de prata."),
                     lucas=(False, "Sem turvação."),
                     nahco3=(True, "Efervescência imediata: libera CO₂ (ácido carboxílico, pKa 4,87)."),
                     beilstein=(False, "Sem halogênio.")),
         laudo="Ácido carboxílico: NaHCO₃ positivo, O–H muito largo no IV, H ácido em δ ~11,7 e C=O em δ 181."),
    dict(id="p-cloroanilina", nist="C106478", ir="C106478_IR1.jdx", nome="p-Cloroanilina", smiles="NC1=CC=C(Cl)C=C1", formula="C₆H₆ClN", mm=127.57,
         bandas=[(3460, 3520, "N–H (estiramento assimétrico)"), (3360, 3430, "N–H (estiramento simétrico)"), (1600, 1640, "N–H (dobramento) / C=C"), (1480, 1510, "C=C do anel"), (1080, 1100, "C–Cl aromático"), (800, 840, "C–H fora do plano (para-dissubstituído)")],
         msnotas={127: "M⁺• (³⁵Cl)", 129: "M + 2 (³⁷Cl): razão ≈ 3 : 1", 92: "[M − Cl]⁺", 65: "C₅H₅⁺"},
         h1=[(7.10, "d", 2, 8.7, "H orto ao Cl"), (6.61, "d", 2, 8.7, "H orto ao NH₂ (blindados)"), (3.65, "s", 2, None, "NH₂ (largo, troca com D₂O)")],
         c13=[(145.0, "C–N"), (129.1, "CH orto ao Cl"), (123.2, "C–Cl"), (116.3, "CH orto ao NH₂")],
         testes=dict(dnph=(False, "Sem precipitado: não há carbonila."),
                     tollens=(False, "Nenhum espelho de prata."),
                     lucas=(False, "Não se aplica: não há OH."),
                     nahco3=(False, "Sem efervescência: aminas são básicas."),
                     beilstein=(True, "Chama verde no fio de cobre; após fusão com Na, AgNO₃ dá precipitado branco de AgCl.")),
         laudo="Amina aromática clorada: dois N–H no IV, M⁺ 127 com M+2 de 1/3 (um Cl), Beilstein positivo e dois dubletos AA'BB' de anel para."),
    dict(id="etanol", nist="C64175", ir="C64175_IR3.jdx", nome="Etanol", smiles="CCO", formula="C₂H₆O", mm=46.07,
         bandas=[(3600, 3660, "O–H livre (solução diluída)"), (3250, 3500, "O–H em ligação de hidrogênio"), (2900, 3000, "C–H sp³"), (1030, 1100, "C–O de álcool primário")],
         msnotas={46: "M⁺• (C₂H₆O)", 45: "[M − H]⁺", 31: "CH₂=OH⁺ (clivagem α)", 29: "CHO⁺ / C₂H₅⁺"},
         h1=[(3.69, "q", 2, 7.0, "CH₂–O"), (2.10, "s", 1, None, "OH (largo, posição variável)"), (1.22, "t", 3, 7.0, "CH₃")],
         c13=[(58.3, "CH₂–O"), (18.4, "CH₃")],
         testes=dict(dnph=(False, "Sem precipitado: não há carbonila."),
                     tollens=(False, "Nenhum espelho de prata."),
                     lucas=(False, "A solução continua límpida: álcoois primários não reagem com o reagente de Lucas à temperatura ambiente (2° turva em minutos, 3° na hora)."),
                     nahco3=(False, "Sem efervescência: álcoois não são ácidos o bastante (pKa ≈ 16)."),
                     beilstein=(False, "Sem halogênio.")),
         laudo="Álcool primário: O–H no IV, clivagem α dando m/z 31 como pico base, Lucas negativo e o padrão etila com CH₂ em δ 3,69."),
]

saida = []
for c in CASOS:
    ms, ms_origem = ler_ms(c["nist"])
    A, grade, estado, origem = ler_ir(c["ir"])
    picos_ir = []
    for lo, hi, rot in c["bandas"]:
        p = pico(A, lo, hi)
        if p and p[1] > 0.04:
            picos_ir.append({"x": p[0], "rotulo": rot, "forca": round(p[1], 2)})
    presentes = {p["mz"] for p in ms}
    msnotas = [{"mz": mz, "rotulo": r} for mz, r in c["msnotas"].items() if mz in presentes]
    saida.append({
        "id": c["id"], "nome": c["nome"], "smiles": c["smiles"], "formula": c["formula"], "massaMolar": c["mm"],
        "testes": {k: {"positivo": v[0], "observacao": v[1]} for k, v in c["testes"].items()},
        "ms": ms, "msNotas": msnotas, "msFonte": f"NIST Mass Spectrometry Data Center ({ms_origem})",
        "ir": grade, "irPicos": picos_ir, "irFonte": f"NIST Chemistry WebBook · {origem} · {estado}",
        "h1": [{"delta": d, "mult": m, "n": n, "J": j, "atrib": a} for d, m, n, j, a in c["h1"]],
        "c13": [{"delta": d, "atrib": a} for d, a in c["c13"]],
        "laudo": c["laudo"],
    })
    print(c["id"], "| MS picos", len(ms), "base", max(ms, key=lambda p: p["int"])["mz"], "| IR pts", len(grade), "|", estado[:30], "|", [(p["x"], p["rotulo"][:14], p["forca"]) for p in picos_ir])

ts = [
    "// Gerado por scripts/build_csi.py a partir do NIST Chemistry WebBook (EM e IV).",
    "// RMN ¹H/¹³C (CDCl₃) e testes por via úmida: valores de referência (Pavia; Silverstein).",
    "",
    "export type TesteId = \"dnph\" | \"tollens\" | \"lucas\" | \"nahco3\" | \"beilstein\";",
    "export interface SinalH { delta: number; mult: \"s\" | \"d\" | \"t\" | \"q\" | \"m\"; n: number; J: number | null; atrib: string }",
    "export interface CasoCSI {",
    "  id: string; nome: string; smiles: string; formula: string; massaMolar: number;",
    "  testes: Record<TesteId, { positivo: boolean; observacao: string }>;",
    "  ms: { mz: number; int: number }[]; msNotas: { mz: number; rotulo: string }[]; msFonte: string;",
    "  /** [número de onda (cm⁻¹), %T] */ ir: [number, number][]; irPicos: { x: number; rotulo: string; forca: number }[]; irFonte: string;",
    "  h1: SinalH[]; c13: { delta: number; atrib: string }[]; laudo: string;",
    "}",
    "",
    f"export const CASOS_CSI: CasoCSI[] = {json.dumps(saida, ensure_ascii=False, separators=(',', ':'))};",
    "",
]
open(SAIDA, "w").write("\n".join(ts))
print("ok")
