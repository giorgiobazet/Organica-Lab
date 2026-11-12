"""Prepara complexos fármaco–proteína do RCSB PDB para o Laboratório Molecular.

Para cada entrada: baixa o PDB oficial, escolhe a primeira cópia do ligante, mantém as cadeias de
proteína que tocam o fármaco (com as cadeias laterais completas até 10 Å dele e só o esqueleto
N/CA/C/O no resto, suficiente para a fita), e calcula a partir das coordenadas cristalográficas:
  - resíduos do sítio: algum átomo pesado a até 4,5 Å de um átomo pesado do ligante;
  - ligações de hidrogênio prováveis: pares N/O do ligante e N/O da proteína a até 3,5 Å
    (critério geométrico usual de distância doador–aceptor; não inclui ângulos).
Título, organismo, resolução e a referência primária vêm dos próprios registros do arquivo PDB.

Uso: python scripts/build_complexos.py   (grava public/complexos/*.pdb e src/data/complexos.ts)
"""
import json
import math
import os
import urllib.request

# id PDB, código do ligante, fármaco (pt), alvo (pt), classe/explicação curta (pt), chave da galeria
ENTRADAS = [
    ("1EQG", "IBP", "Ibuprofeno", "Cicloxigenase-1 (COX-1)", "AINE: ocupa o canal da cicloxigenase e impede a entrada do ácido araquidônico.", "ibuprofeno"),
    ("1PXX", "DIF", "Diclofenaco", "Cicloxigenase-2 (COX-2)", "AINE: liga-se ao sítio ativo da COX-2 e bloqueia a síntese de prostaglandinas.", "diclofenaco"),
    ("3NT1", "NPS", "Naproxeno", "Cicloxigenase-2 (COX-2)", "AINE do grupo dos ácidos arilpropiônicos; o enantiômero (S) é o ativo.", None),
    ("5KIR", "RCX", "Rofecoxibe", "Cicloxigenase-2 (COX-2)", "Inibidor seletivo de COX-2 (coxibe), retirado do mercado por risco cardiovascular.", None),
    ("1OXR", "AIN", "Ácido acetilsalicílico (Aspirina)", "Fosfolipase A2", "Além da COX, a aspirina se liga à fosfolipase A2, enzima que libera o ácido araquidônico.", "aspirina"),
    ("4DFR", "MTX", "Metotrexato", "Di-hidrofolato redutase (DHFR)", "Antifolato: imita o di-hidrofolato e bloqueia a síntese de nucleotídeos.", None),
    ("1EVE", "E20", "Donepezila", "Acetilcolinesterase", "Usado no Alzheimer: inibe a enzima que degrada a acetilcolina.", None),
    ("1IEP", "STI", "Imatinibe", "Cinase Abl", "Terapia-alvo da leucemia mieloide crônica: ocupa o sítio de ATP da cinase.", None),
    ("1HXB", "ROC", "Saquinavir", "Protease do HIV-1", "Antirretroviral: mimetiza o estado de transição da clivagem peptídica.", None),
    ("4CI1", "EF2", "(S)-Talidomida", "Cereblon (CRBN)", "Liga-se ao cereblon e altera os alvos que a enzima marca para degradação.", "s-talidomida"),
]

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA_PDB = os.path.join(RAIZ, "public", "complexos")
SAIDA_TS = os.path.join(RAIZ, "src", "data", "complexos.ts")
CACHE = os.environ.get("PDB_CACHE", "/tmp/pdb-cache")

AA = {"ALA", "ARG", "ASN", "ASP", "CYS", "GLN", "GLU", "GLY", "HIS", "ILE", "LEU", "LYS", "MET", "PHE", "PRO", "SER", "THR", "TRP", "TYR", "VAL", "MSE"}
NOME_AA = {"ALA": "Ala", "ARG": "Arg", "ASN": "Asn", "ASP": "Asp", "CYS": "Cys", "GLN": "Gln", "GLU": "Glu", "GLY": "Gly", "HIS": "His", "ILE": "Ile",
           "LEU": "Leu", "LYS": "Lys", "MET": "Met", "PHE": "Phe", "PRO": "Pro", "SER": "Ser", "THR": "Thr", "TRP": "Trp", "TYR": "Tyr", "VAL": "Val", "MSE": "Met"}


def baixar(pid):
    os.makedirs(CACHE, exist_ok=True)
    caminho = os.path.join(CACHE, f"{pid}.pdb")
    if not os.path.exists(caminho):
        urllib.request.urlretrieve(f"https://files.rcsb.org/download/{pid}.pdb", caminho)
    with open(caminho) as f:
        return f.read().splitlines()


def atomo(l):
    return {
        "reg": l[:6].strip(), "nome": l[12:16].strip(), "alt": l[16], "res": l[17:20].strip(), "cadeia": l[21],
        "num": int(l[22:26]), "ins": l[26], "x": float(l[30:38]), "y": float(l[38:46]), "z": float(l[46:54]),
        "elem": (l[76:78].strip() or l[12:14].strip()).upper(), "linha": l,
    }


def dist(a, b):
    return math.sqrt((a["x"] - b["x"]) ** 2 + (a["y"] - b["y"]) ** 2 + (a["z"] - b["z"]) ** 2)


def campo_cabecalho(linhas, prefixo):
    return " ".join(l[10:80].strip() for l in linhas if l.startswith(prefixo)).replace("  ", " ").strip()


def processar(pid, codigo):
    linhas = baixar(pid)
    modelo = []
    for l in linhas:
        if l.startswith("ENDMDL"):
            break  # só o primeiro modelo (estruturas de RMN trazem vários)
        if l.startswith(("ATOM", "HETATM")):
            a = atomo(l)
            if a["alt"] not in (" ", "A"):
                continue  # conformações alternativas: fica a A
            modelo.append(a)

    lig_todos = [a for a in modelo if a["res"] == codigo and a["reg"] == "HETATM"]
    assert lig_todos, f"{pid}: ligante {codigo} não encontrado"
    primeiro = (lig_todos[0]["cadeia"], lig_todos[0]["num"])
    lig = [a for a in lig_todos if (a["cadeia"], a["num"]) == primeiro and a["elem"] != "H"]

    proteina = [a for a in modelo if a["reg"] == "ATOM" and a["res"] in AA and a["elem"] != "H"]
    cadeias = sorted({a["cadeia"] for a in proteina if any(dist(a, b) <= 6.0 for b in lig)})
    proteina = [a for a in proteina if a["cadeia"] in cadeias]

    perto = lambda a, r: any(dist(a, b) <= r for b in lig)  # noqa: E731
    # Cadeias laterais completas perto do fármaco; longe, só o esqueleto (basta para a fita).
    residuos_perto = {(a["cadeia"], a["num"], a["ins"]) for a in proteina if perto(a, 10.0)}
    mantidos = [a for a in proteina if (a["cadeia"], a["num"], a["ins"]) in residuos_perto or a["nome"] in ("N", "CA", "C", "O")]

    sitio = {}
    for a in proteina:
        if perto(a, 4.5):
            sitio[(a["cadeia"], a["num"], a["ins"])] = a["res"]

    polares_lig = [a for a in lig if a["elem"] in ("N", "O")]
    ligacoes = []
    for a in proteina:
        if a["elem"] not in ("N", "O"):
            continue
        for b in polares_lig:
            d = dist(a, b)
            if d <= 3.5:
                ligacoes.append({
                    "residuo": f"{NOME_AA[a['res']]}{a['num']}{a['ins'].strip()}", "cadeia": a["cadeia"], "numero": a["num"], "atomoProteina": a["nome"],
                    "atomoLigante": b["nome"], "distancia": round(d, 2),
                })
    ligacoes.sort(key=lambda h: h["distancia"])

    # SS da fita (HELIX/SHEET) das cadeias mantidas, para o 3Dmol desenhar hélices e folhas.
    ss = [l for l in linhas if (l.startswith("HELIX") and l[19] in cadeias) or (l.startswith("SHEET") and l[21] in cadeias)]
    pdb = ss + [a["linha"] for a in mantidos] + ["TER"] + [a["linha"] for a in lig] + ["END"]
    os.makedirs(SAIDA_PDB, exist_ok=True)
    with open(os.path.join(SAIDA_PDB, f"{pid}.pdb"), "w") as f:
        f.write("\n".join(pdb) + "\n")

    resolucao = next((l[23:30].strip() for l in linhas if l.startswith("REMARK   2 RESOLUTION.")), None)
    organismo = next((l.split("ORGANISM_SCIENTIFIC:")[1].strip(" ;") for l in linhas if "ORGANISM_SCIENTIFIC:" in l), None)
    jrnl = lambda tipo: " ".join(l[19:79].strip() for l in linhas if l.startswith(f"JRNL        {tipo}")).strip()  # noqa: E731
    autores = ", ".join(a.strip().title() for a in jrnl("AUTH").replace(", ", ",").split(",") if a.strip())
    r = next((l for l in linhas if l.startswith("JRNL        REF")), "")
    ref = f"{r[19:47].strip().title()} {r[51:55].strip()}, {r[56:61].strip()} ({r[62:66].strip()})" if r.strip()[16:].strip() else ""
    return {
        "ligante": {"codigo": codigo, "cadeia": primeiro[0], "numero": primeiro[1], "atomos": len(lig)},
        "cadeias": cadeias,
        "titulo": campo_cabecalho(linhas, "TITLE"),
        "organismo": organismo.capitalize() if organismo else None,
        "resolucao": float(resolucao) if resolucao and resolucao.replace(".", "").isdigit() else None,
        # Citação curta (o título do artigo vem em maiúsculas no PDB e perderia siglas como NSAID e HIV).
        "referencia": f"{autores.split(', ')[0]}{' et al.' if ', ' in autores else ''} {ref}.".strip(),
        "sitio": [{"cadeia": c, "numero": n, "residuo": f"{NOME_AA[r]}{n}{i.strip()}"} for (c, n, i), r in sorted(sitio.items())],
        "ligacoesH": ligacoes,
        "atomosArquivo": len(mantidos) + len(lig),
    }


saida = []
for pid, codigo, farmaco, alvo, nota, galeria in ENTRADAS:
    dados = processar(pid, codigo)
    saida.append({"id": pid, "farmaco": farmaco, "alvo": alvo, "nota": nota, "galeria": galeria, **dados})
    print(f"{pid} {codigo}: cadeias {dados['cadeias']}, sítio {len(dados['sitio'])} resíduos, {len(dados['ligacoesH'])} lig. H, "
          f"{dados['atomosArquivo']} átomos, {dados['organismo']}, {dados['resolucao']} Å")

ts = [
    "// Gerado por scripts/build_complexos.py a partir dos arquivos oficiais do RCSB PDB.",
    "// Sítio e ligações de H calculados das coordenadas cristalográficas (4,5 Å; N/O–N/O ≤ 3,5 Å).",
    "",
    "export interface LigacaoH {",
    "  residuo: string;",
    "  cadeia: string;",
    "  numero: number;",
    "  atomoProteina: string;",
    "  atomoLigante: string;",
    "  /** Distância doador–aceptor (Å). */",
    "  distancia: number;",
    "}",
    "",
    "export interface Complexo {",
    "  /** Código PDB; o arquivo reduzido fica em /complexos/<id>.pdb. */",
    "  id: string;",
    "  farmaco: string;",
    "  alvo: string;",
    "  nota: string;",
    "  /** Chave da molécula na galeria do laboratório, quando houver. */",
    "  galeria: string | null;",
    "  ligante: { codigo: string; cadeia: string; numero: number; atomos: number };",
    "  cadeias: string[];",
    "  titulo: string;",
    "  organismo: string | null;",
    "  resolucao: number | null;",
    "  referencia: string;",
    "  sitio: { cadeia: string; numero: number; residuo: string }[];",
    "  ligacoesH: LigacaoH[];",
    "  atomosArquivo: number;",
    "}",
    "",
    f"export const COMPLEXOS: Complexo[] = {json.dumps(saida, ensure_ascii=False, indent=2)};",
    "",
]
with open(SAIDA_TS, "w") as f:
    f.write("\n".join(ts))
