// Gerado por scripts/build_complexos.py a partir dos arquivos oficiais do RCSB PDB.
// Sítio e ligações de H calculados das coordenadas cristalográficas (4,5 Å; N/O–N/O ≤ 3,5 Å).

export interface LigacaoH {
  residuo: string;
  cadeia: string;
  numero: number;
  atomoProteina: string;
  atomoLigante: string;
  /** Distância doador–aceptor (Å). */
  distancia: number;
}

export interface Complexo {
  /** Código PDB; o arquivo reduzido fica em /complexos/<id>.pdb. */
  id: string;
  farmaco: string;
  alvo: string;
  nota: string;
  /** Chave da molécula na galeria do laboratório, quando houver. */
  galeria: string | null;
  ligante: { codigo: string; cadeia: string; numero: number; atomos: number };
  cadeias: string[];
  titulo: string;
  organismo: string | null;
  resolucao: number | null;
  referencia: string;
  sitio: { cadeia: string; numero: number; residuo: string }[];
  ligacoesH: LigacaoH[];
  atomosArquivo: number;
}

export const COMPLEXOS: Complexo[] = [
  {
    "id": "1EQG",
    "farmaco": "Ibuprofeno",
    "alvo": "Cicloxigenase-1 (COX-1)",
    "nota": "AINE: ocupa o canal da cicloxigenase e impede a entrada do ácido araquidônico.",
    "galeria": "ibuprofeno",
    "ligante": {
      "codigo": "IBP",
      "cadeia": "A",
      "numero": 701,
      "atomos": 15
    },
    "cadeias": [
      "A"
    ],
    "titulo": "THE 2.6 ANGSTROM MODEL OF OVINE COX-1 COMPLEXED WITH IBUPROFEN",
    "organismo": "Ovis aries",
    "resolucao": 2.61,
    "referencia": "B.S.Selinsky et al. Biochemistry 40, 5172 (2001).",
    "sitio": [
      {
        "cadeia": "A",
        "numero": 116,
        "residuo": "Val116"
      },
      {
        "cadeia": "A",
        "numero": 120,
        "residuo": "Arg120"
      },
      {
        "cadeia": "A",
        "numero": 349,
        "residuo": "Val349"
      },
      {
        "cadeia": "A",
        "numero": 352,
        "residuo": "Leu352"
      },
      {
        "cadeia": "A",
        "numero": 353,
        "residuo": "Ser353"
      },
      {
        "cadeia": "A",
        "numero": 355,
        "residuo": "Tyr355"
      },
      {
        "cadeia": "A",
        "numero": 359,
        "residuo": "Leu359"
      },
      {
        "cadeia": "A",
        "numero": 385,
        "residuo": "Tyr385"
      },
      {
        "cadeia": "A",
        "numero": 387,
        "residuo": "Trp387"
      },
      {
        "cadeia": "A",
        "numero": 518,
        "residuo": "Phe518"
      },
      {
        "cadeia": "A",
        "numero": 522,
        "residuo": "Met522"
      },
      {
        "cadeia": "A",
        "numero": 523,
        "residuo": "Ile523"
      },
      {
        "cadeia": "A",
        "numero": 526,
        "residuo": "Gly526"
      },
      {
        "cadeia": "A",
        "numero": 527,
        "residuo": "Ala527"
      },
      {
        "cadeia": "A",
        "numero": 530,
        "residuo": "Ser530"
      },
      {
        "cadeia": "A",
        "numero": 531,
        "residuo": "Leu531"
      }
    ],
    "ligacoesH": [
      {
        "residuo": "Tyr355",
        "cadeia": "A",
        "numero": 355,
        "atomoProteina": "OH",
        "atomoLigante": "O1",
        "distancia": 2.78
      },
      {
        "residuo": "Arg120",
        "cadeia": "A",
        "numero": 120,
        "atomoProteina": "NE",
        "atomoLigante": "O2",
        "distancia": 2.83
      },
      {
        "residuo": "Arg120",
        "cadeia": "A",
        "numero": 120,
        "atomoProteina": "NH2",
        "atomoLigante": "O1",
        "distancia": 2.91
      }
    ],
    "atomosArquivo": 2521
  },
  {
    "id": "1PXX",
    "farmaco": "Diclofenaco",
    "alvo": "Cicloxigenase-2 (COX-2)",
    "nota": "AINE: liga-se ao sítio ativo da COX-2 e bloqueia a síntese de prostaglandinas.",
    "galeria": "diclofenaco",
    "ligante": {
      "codigo": "DIF",
      "cadeia": "A",
      "numero": 701,
      "atomos": 19
    },
    "cadeias": [
      "A"
    ],
    "titulo": "CRYSTAL STRUCTURE OF DICLOFENAC BOUND TO THE CYCLOOXYGENASE ACTIVE SITE OF COX-2",
    "organismo": "Mus musculus",
    "resolucao": 2.9,
    "referencia": "S.W.Rowlinson et al. J.Biol.Chem. 278, 45763 (2003).",
    "sitio": [
      {
        "cadeia": "A",
        "numero": 120,
        "residuo": "Arg120"
      },
      {
        "cadeia": "A",
        "numero": 205,
        "residuo": "Phe205"
      },
      {
        "cadeia": "A",
        "numero": 348,
        "residuo": "Tyr348"
      },
      {
        "cadeia": "A",
        "numero": 349,
        "residuo": "Val349"
      },
      {
        "cadeia": "A",
        "numero": 352,
        "residuo": "Leu352"
      },
      {
        "cadeia": "A",
        "numero": 353,
        "residuo": "Ser353"
      },
      {
        "cadeia": "A",
        "numero": 355,
        "residuo": "Tyr355"
      },
      {
        "cadeia": "A",
        "numero": 381,
        "residuo": "Phe381"
      },
      {
        "cadeia": "A",
        "numero": 384,
        "residuo": "Leu384"
      },
      {
        "cadeia": "A",
        "numero": 385,
        "residuo": "Tyr385"
      },
      {
        "cadeia": "A",
        "numero": 387,
        "residuo": "Trp387"
      },
      {
        "cadeia": "A",
        "numero": 522,
        "residuo": "Met522"
      },
      {
        "cadeia": "A",
        "numero": 523,
        "residuo": "Val523"
      },
      {
        "cadeia": "A",
        "numero": 526,
        "residuo": "Gly526"
      },
      {
        "cadeia": "A",
        "numero": 527,
        "residuo": "Ala527"
      },
      {
        "cadeia": "A",
        "numero": 530,
        "residuo": "Ser530"
      },
      {
        "cadeia": "A",
        "numero": 531,
        "residuo": "Leu531"
      }
    ],
    "ligacoesH": [
      {
        "residuo": "Ser530",
        "cadeia": "A",
        "numero": 530,
        "atomoProteina": "OG",
        "atomoLigante": "O2",
        "distancia": 2.65
      },
      {
        "residuo": "Tyr385",
        "cadeia": "A",
        "numero": 385,
        "atomoProteina": "OH",
        "atomoLigante": "O1",
        "distancia": 2.73
      },
      {
        "residuo": "Ser530",
        "cadeia": "A",
        "numero": 530,
        "atomoProteina": "OG",
        "atomoLigante": "O1",
        "distancia": 2.91
      }
    ],
    "atomosArquivo": 2553
  },
  {
    "id": "3NT1",
    "farmaco": "Naproxeno",
    "alvo": "Cicloxigenase-2 (COX-2)",
    "nota": "AINE do grupo dos ácidos arilpropiônicos; o enantiômero (S) é o ativo.",
    "galeria": null,
    "ligante": {
      "codigo": "NPS",
      "cadeia": "A",
      "numero": 5,
      "atomos": 17
    },
    "cadeias": [
      "A"
    ],
    "titulo": "HIGH RESOLUTION STRUCTURE OF NAPROXEN:COX-2 COMPLEX.",
    "organismo": "Mus musculus",
    "resolucao": 1.73,
    "referencia": "K.C.Duggan et al. J.Biol.Chem. 285, 34950 (2010).",
    "sitio": [
      {
        "cadeia": "A",
        "numero": 116,
        "residuo": "Val116"
      },
      {
        "cadeia": "A",
        "numero": 120,
        "residuo": "Arg120"
      },
      {
        "cadeia": "A",
        "numero": 349,
        "residuo": "Val349"
      },
      {
        "cadeia": "A",
        "numero": 352,
        "residuo": "Leu352"
      },
      {
        "cadeia": "A",
        "numero": 353,
        "residuo": "Ser353"
      },
      {
        "cadeia": "A",
        "numero": 355,
        "residuo": "Tyr355"
      },
      {
        "cadeia": "A",
        "numero": 359,
        "residuo": "Leu359"
      },
      {
        "cadeia": "A",
        "numero": 381,
        "residuo": "Phe381"
      },
      {
        "cadeia": "A",
        "numero": 384,
        "residuo": "Leu384"
      },
      {
        "cadeia": "A",
        "numero": 385,
        "residuo": "Tyr385"
      },
      {
        "cadeia": "A",
        "numero": 387,
        "residuo": "Trp387"
      },
      {
        "cadeia": "A",
        "numero": 518,
        "residuo": "Phe518"
      },
      {
        "cadeia": "A",
        "numero": 522,
        "residuo": "Met522"
      },
      {
        "cadeia": "A",
        "numero": 523,
        "residuo": "Val523"
      },
      {
        "cadeia": "A",
        "numero": 526,
        "residuo": "Gly526"
      },
      {
        "cadeia": "A",
        "numero": 527,
        "residuo": "Ala527"
      },
      {
        "cadeia": "A",
        "numero": 530,
        "residuo": "Ser530"
      },
      {
        "cadeia": "A",
        "numero": 531,
        "residuo": "Leu531"
      }
    ],
    "ligacoesH": [
      {
        "residuo": "Tyr355",
        "cadeia": "A",
        "numero": 355,
        "atomoProteina": "OH",
        "atomoLigante": "OXT",
        "distancia": 2.46
      },
      {
        "residuo": "Arg120",
        "cadeia": "A",
        "numero": 120,
        "atomoProteina": "NH2",
        "atomoLigante": "OXT",
        "distancia": 2.77
      },
      {
        "residuo": "Arg120",
        "cadeia": "A",
        "numero": 120,
        "atomoProteina": "NE",
        "atomoLigante": "O",
        "distancia": 2.92
      }
    ],
    "atomosArquivo": 2529
  },
  {
    "id": "5KIR",
    "farmaco": "Rofecoxibe",
    "alvo": "Cicloxigenase-2 (COX-2)",
    "nota": "Inibidor seletivo de COX-2 (coxibe), retirado do mercado por risco cardiovascular.",
    "galeria": null,
    "ligante": {
      "codigo": "RCX",
      "cadeia": "A",
      "numero": 601,
      "atomos": 22
    },
    "cadeias": [
      "A"
    ],
    "titulo": "THE STRUCTURE OF VIOXX BOUND TO HUMAN COX-2",
    "organismo": "Homo sapiens",
    "resolucao": 2.7,
    "referencia": "B.J.Orlando et al. Acta Crystallogr.,Sect.F 72, 772 (2016).",
    "sitio": [
      {
        "cadeia": "A",
        "numero": 90,
        "residuo": "His90"
      },
      {
        "cadeia": "A",
        "numero": 192,
        "residuo": "Gln192"
      },
      {
        "cadeia": "A",
        "numero": 349,
        "residuo": "Val349"
      },
      {
        "cadeia": "A",
        "numero": 352,
        "residuo": "Leu352"
      },
      {
        "cadeia": "A",
        "numero": 353,
        "residuo": "Ser353"
      },
      {
        "cadeia": "A",
        "numero": 355,
        "residuo": "Tyr355"
      },
      {
        "cadeia": "A",
        "numero": 385,
        "residuo": "Tyr385"
      },
      {
        "cadeia": "A",
        "numero": 387,
        "residuo": "Trp387"
      },
      {
        "cadeia": "A",
        "numero": 513,
        "residuo": "Arg513"
      },
      {
        "cadeia": "A",
        "numero": 516,
        "residuo": "Ala516"
      },
      {
        "cadeia": "A",
        "numero": 517,
        "residuo": "Ile517"
      },
      {
        "cadeia": "A",
        "numero": 518,
        "residuo": "Phe518"
      },
      {
        "cadeia": "A",
        "numero": 522,
        "residuo": "Met522"
      },
      {
        "cadeia": "A",
        "numero": 523,
        "residuo": "Val523"
      },
      {
        "cadeia": "A",
        "numero": 526,
        "residuo": "Gly526"
      },
      {
        "cadeia": "A",
        "numero": 527,
        "residuo": "Ala527"
      },
      {
        "cadeia": "A",
        "numero": 530,
        "residuo": "Ser530"
      },
      {
        "cadeia": "A",
        "numero": 531,
        "residuo": "Leu531"
      }
    ],
    "ligacoesH": [
      {
        "residuo": "Ser353",
        "cadeia": "A",
        "numero": 353,
        "atomoProteina": "O",
        "atomoLigante": "O20",
        "distancia": 3.01
      },
      {
        "residuo": "Gln192",
        "cadeia": "A",
        "numero": 192,
        "atomoProteina": "OE1",
        "atomoLigante": "O20",
        "distancia": 3.09
      },
      {
        "residuo": "Leu352",
        "cadeia": "A",
        "numero": 352,
        "atomoProteina": "O",
        "atomoLigante": "O20",
        "distancia": 3.19
      },
      {
        "residuo": "Arg513",
        "cadeia": "A",
        "numero": 513,
        "atomoProteina": "NH1",
        "atomoLigante": "O21",
        "distancia": 3.31
      }
    ],
    "atomosArquivo": 2545
  },
  {
    "id": "1OXR",
    "farmaco": "Ácido acetilsalicílico (Aspirina)",
    "alvo": "Fosfolipase A2",
    "nota": "Além da COX, a aspirina se liga à fosfolipase A2, enzima que libera o ácido araquidônico.",
    "galeria": "aspirina",
    "ligante": {
      "codigo": "AIN",
      "cadeia": "A",
      "numero": 141,
      "atomos": 13
    },
    "cadeias": [
      "A"
    ],
    "titulo": "ASPIRIN INDUCES ITS ANTI-INFLAMMATORY EFFECTS THROUGH ITS SPECIFIC BINDING TO PHOSPHOLIPASE A2: CRYSTAL STRUCTURE OF THE COMPLEX FORMED BETWEEN PHOSPHOLIPASE A2 AND ASPIRIN AT 1.9A RESOLUTION",
    "organismo": "Naja sagittifera",
    "resolucao": 1.93,
    "referencia": "R.K.Singh et al. J.Drug Target. 13, 113 (2005).",
    "sitio": [
      {
        "cadeia": "A",
        "numero": 2,
        "residuo": "Leu2"
      },
      {
        "cadeia": "A",
        "numero": 5,
        "residuo": "Phe5"
      },
      {
        "cadeia": "A",
        "numero": 22,
        "residuo": "Phe22"
      },
      {
        "cadeia": "A",
        "numero": 23,
        "residuo": "Ala23"
      },
      {
        "cadeia": "A",
        "numero": 28,
        "residuo": "Tyr28"
      },
      {
        "cadeia": "A",
        "numero": 29,
        "residuo": "Cys29"
      },
      {
        "cadeia": "A",
        "numero": 30,
        "residuo": "Gly30"
      },
      {
        "cadeia": "A",
        "numero": 31,
        "residuo": "Lys31"
      },
      {
        "cadeia": "A",
        "numero": 48,
        "residuo": "His48"
      },
      {
        "cadeia": "A",
        "numero": 49,
        "residuo": "Asp49"
      },
      {
        "cadeia": "A",
        "numero": 64,
        "residuo": "Tyr64"
      }
    ],
    "ligacoesH": [
      {
        "residuo": "Asp49",
        "cadeia": "A",
        "numero": 49,
        "atomoProteina": "OD1",
        "atomoLigante": "O1",
        "distancia": 3.04
      },
      {
        "residuo": "Gly30",
        "cadeia": "A",
        "numero": 30,
        "atomoProteina": "N",
        "atomoLigante": "O1",
        "distancia": 3.12
      },
      {
        "residuo": "Tyr28",
        "cadeia": "A",
        "numero": 28,
        "atomoProteina": "O",
        "atomoLigante": "O1",
        "distancia": 3.22
      },
      {
        "residuo": "Gly30",
        "cadeia": "A",
        "numero": 30,
        "atomoProteina": "O",
        "atomoLigante": "O1",
        "distancia": 3.24
      },
      {
        "residuo": "Gly30",
        "cadeia": "A",
        "numero": 30,
        "atomoProteina": "O",
        "atomoLigante": "O2",
        "distancia": 3.26
      },
      {
        "residuo": "Tyr64",
        "cadeia": "A",
        "numero": 64,
        "atomoProteina": "OH",
        "atomoLigante": "O2",
        "distancia": 3.33
      }
    ],
    "atomosArquivo": 707
  },
  {
    "id": "4DFR",
    "farmaco": "Metotrexato",
    "alvo": "Di-hidrofolato redutase (DHFR)",
    "nota": "Antifolato: imita o di-hidrofolato e bloqueia a síntese de nucleotídeos.",
    "galeria": null,
    "ligante": {
      "codigo": "MTX",
      "cadeia": "A",
      "numero": 161,
      "atomos": 33
    },
    "cadeias": [
      "A",
      "B"
    ],
    "titulo": "CRYSTAL STRUCTURES OF ESCHERICHIA COLI AND LACTOBACILLUS CASEI DIHYDROFOLATE REDUCTASE REFINED AT 1.7 ANGSTROMS RESOLUTION. I. GENERAL FEATURES AND BINDING OF METHOTREXATE",
    "organismo": "Escherichia coli",
    "resolucao": 1.7,
    "referencia": "J.T.Bolin et al. J.Biol.Chem. 257, 13650 (1982).",
    "sitio": [
      {
        "cadeia": "A",
        "numero": 5,
        "residuo": "Ile5"
      },
      {
        "cadeia": "A",
        "numero": 6,
        "residuo": "Ala6"
      },
      {
        "cadeia": "A",
        "numero": 7,
        "residuo": "Ala7"
      },
      {
        "cadeia": "A",
        "numero": 27,
        "residuo": "Asp27"
      },
      {
        "cadeia": "A",
        "numero": 28,
        "residuo": "Leu28"
      },
      {
        "cadeia": "A",
        "numero": 30,
        "residuo": "Trp30"
      },
      {
        "cadeia": "A",
        "numero": 31,
        "residuo": "Phe31"
      },
      {
        "cadeia": "A",
        "numero": 32,
        "residuo": "Lys32"
      },
      {
        "cadeia": "A",
        "numero": 46,
        "residuo": "Thr46"
      },
      {
        "cadeia": "A",
        "numero": 49,
        "residuo": "Ser49"
      },
      {
        "cadeia": "A",
        "numero": 50,
        "residuo": "Ile50"
      },
      {
        "cadeia": "A",
        "numero": 52,
        "residuo": "Arg52"
      },
      {
        "cadeia": "A",
        "numero": 54,
        "residuo": "Leu54"
      },
      {
        "cadeia": "A",
        "numero": 55,
        "residuo": "Pro55"
      },
      {
        "cadeia": "A",
        "numero": 57,
        "residuo": "Arg57"
      },
      {
        "cadeia": "A",
        "numero": 94,
        "residuo": "Ile94"
      },
      {
        "cadeia": "A",
        "numero": 100,
        "residuo": "Tyr100"
      },
      {
        "cadeia": "A",
        "numero": 113,
        "residuo": "Thr113"
      }
    ],
    "ligacoesH": [
      {
        "residuo": "Asp27",
        "cadeia": "A",
        "numero": 27,
        "atomoProteina": "OD2",
        "atomoLigante": "N1",
        "distancia": 2.48
      },
      {
        "residuo": "Arg57",
        "cadeia": "A",
        "numero": 57,
        "atomoProteina": "NH1",
        "atomoLigante": "O1",
        "distancia": 2.57
      },
      {
        "residuo": "Arg57",
        "cadeia": "A",
        "numero": 57,
        "atomoProteina": "NH2",
        "atomoLigante": "O2",
        "distancia": 2.72
      },
      {
        "residuo": "Ile5",
        "cadeia": "A",
        "numero": 5,
        "atomoProteina": "O",
        "atomoLigante": "NA4",
        "distancia": 2.73
      },
      {
        "residuo": "Ile94",
        "cadeia": "A",
        "numero": 94,
        "atomoProteina": "O",
        "atomoLigante": "NA4",
        "distancia": 2.84
      },
      {
        "residuo": "Asp27",
        "cadeia": "A",
        "numero": 27,
        "atomoProteina": "OD1",
        "atomoLigante": "NA2",
        "distancia": 2.88
      },
      {
        "residuo": "Arg52",
        "cadeia": "A",
        "numero": 52,
        "atomoProteina": "NH2",
        "atomoLigante": "O",
        "distancia": 2.88
      },
      {
        "residuo": "Arg57",
        "cadeia": "A",
        "numero": 57,
        "atomoProteina": "NH1",
        "atomoLigante": "O2",
        "distancia": 3.38
      },
      {
        "residuo": "Asp27",
        "cadeia": "A",
        "numero": 27,
        "atomoProteina": "OD2",
        "atomoLigante": "NA2",
        "distancia": 3.4
      },
      {
        "residuo": "Asp27",
        "cadeia": "A",
        "numero": 27,
        "atomoProteina": "OD2",
        "atomoLigante": "N8",
        "distancia": 3.43
      },
      {
        "residuo": "Arg52",
        "cadeia": "A",
        "numero": 52,
        "atomoProteina": "NH2",
        "atomoLigante": "OE2",
        "distancia": 3.43
      },
      {
        "residuo": "Tyr100",
        "cadeia": "A",
        "numero": 100,
        "atomoProteina": "OH",
        "atomoLigante": "NA4",
        "distancia": 3.45
      },
      {
        "residuo": "Arg57",
        "cadeia": "A",
        "numero": 57,
        "atomoProteina": "NH2",
        "atomoLigante": "O1",
        "distancia": 3.48
      }
    ],
    "atomosArquivo": 1612
  },
  {
    "id": "1EVE",
    "farmaco": "Donepezila",
    "alvo": "Acetilcolinesterase",
    "nota": "Usado no Alzheimer: inibe a enzima que degrada a acetilcolina.",
    "galeria": null,
    "ligante": {
      "codigo": "E20",
      "cadeia": "A",
      "numero": 2001,
      "atomos": 28
    },
    "cadeias": [
      "A"
    ],
    "titulo": "THREE DIMENSIONAL STRUCTURE OF THE ANTI-ALZHEIMER DRUG, E2020 (ARICEPT), COMPLEXED WITH ITS TARGET ACETYLCHOLINESTERASE",
    "organismo": "Torpedo californica",
    "resolucao": 2.5,
    "referencia": "G.Kryger et al. Structure Fold.Des. 7, 297 (1999).",
    "sitio": [
      {
        "cadeia": "A",
        "numero": 70,
        "residuo": "Tyr70"
      },
      {
        "cadeia": "A",
        "numero": 72,
        "residuo": "Asp72"
      },
      {
        "cadeia": "A",
        "numero": 84,
        "residuo": "Trp84"
      },
      {
        "cadeia": "A",
        "numero": 117,
        "residuo": "Gly117"
      },
      {
        "cadeia": "A",
        "numero": 118,
        "residuo": "Gly118"
      },
      {
        "cadeia": "A",
        "numero": 121,
        "residuo": "Tyr121"
      },
      {
        "cadeia": "A",
        "numero": 130,
        "residuo": "Tyr130"
      },
      {
        "cadeia": "A",
        "numero": 199,
        "residuo": "Glu199"
      },
      {
        "cadeia": "A",
        "numero": 279,
        "residuo": "Trp279"
      },
      {
        "cadeia": "A",
        "numero": 282,
        "residuo": "Leu282"
      },
      {
        "cadeia": "A",
        "numero": 286,
        "residuo": "Ser286"
      },
      {
        "cadeia": "A",
        "numero": 288,
        "residuo": "Phe288"
      },
      {
        "cadeia": "A",
        "numero": 289,
        "residuo": "Arg289"
      },
      {
        "cadeia": "A",
        "numero": 290,
        "residuo": "Phe290"
      },
      {
        "cadeia": "A",
        "numero": 330,
        "residuo": "Phe330"
      },
      {
        "cadeia": "A",
        "numero": 331,
        "residuo": "Phe331"
      },
      {
        "cadeia": "A",
        "numero": 334,
        "residuo": "Tyr334"
      },
      {
        "cadeia": "A",
        "numero": 440,
        "residuo": "His440"
      },
      {
        "cadeia": "A",
        "numero": 441,
        "residuo": "Gly441"
      }
    ],
    "ligacoesH": [],
    "atomosArquivo": 2526
  },
  {
    "id": "1IEP",
    "farmaco": "Imatinibe",
    "alvo": "Cinase Abl",
    "nota": "Terapia-alvo da leucemia mieloide crônica: ocupa o sítio de ATP da cinase.",
    "galeria": null,
    "ligante": {
      "codigo": "STI",
      "cadeia": "A",
      "numero": 201,
      "atomos": 37
    },
    "cadeias": [
      "A"
    ],
    "titulo": "CRYSTAL STRUCTURE OF THE C-ABL KINASE DOMAIN IN COMPLEX WITH STI-571.",
    "organismo": "Mus musculus",
    "resolucao": 2.1,
    "referencia": "B.Nagar et al. Cancer Res. 62, 4236 (2002).",
    "sitio": [
      {
        "cadeia": "A",
        "numero": 248,
        "residuo": "Leu248"
      },
      {
        "cadeia": "A",
        "numero": 253,
        "residuo": "Tyr253"
      },
      {
        "cadeia": "A",
        "numero": 256,
        "residuo": "Val256"
      },
      {
        "cadeia": "A",
        "numero": 269,
        "residuo": "Ala269"
      },
      {
        "cadeia": "A",
        "numero": 270,
        "residuo": "Val270"
      },
      {
        "cadeia": "A",
        "numero": 271,
        "residuo": "Lys271"
      },
      {
        "cadeia": "A",
        "numero": 286,
        "residuo": "Glu286"
      },
      {
        "cadeia": "A",
        "numero": 289,
        "residuo": "Val289"
      },
      {
        "cadeia": "A",
        "numero": 290,
        "residuo": "Met290"
      },
      {
        "cadeia": "A",
        "numero": 293,
        "residuo": "Ile293"
      },
      {
        "cadeia": "A",
        "numero": 299,
        "residuo": "Val299"
      },
      {
        "cadeia": "A",
        "numero": 313,
        "residuo": "Ile313"
      },
      {
        "cadeia": "A",
        "numero": 315,
        "residuo": "Thr315"
      },
      {
        "cadeia": "A",
        "numero": 316,
        "residuo": "Glu316"
      },
      {
        "cadeia": "A",
        "numero": 317,
        "residuo": "Phe317"
      },
      {
        "cadeia": "A",
        "numero": 318,
        "residuo": "Met318"
      },
      {
        "cadeia": "A",
        "numero": 321,
        "residuo": "Gly321"
      },
      {
        "cadeia": "A",
        "numero": 359,
        "residuo": "Phe359"
      },
      {
        "cadeia": "A",
        "numero": 360,
        "residuo": "Ile360"
      },
      {
        "cadeia": "A",
        "numero": 361,
        "residuo": "His361"
      },
      {
        "cadeia": "A",
        "numero": 362,
        "residuo": "Arg362"
      },
      {
        "cadeia": "A",
        "numero": 370,
        "residuo": "Leu370"
      },
      {
        "cadeia": "A",
        "numero": 380,
        "residuo": "Ala380"
      },
      {
        "cadeia": "A",
        "numero": 381,
        "residuo": "Asp381"
      },
      {
        "cadeia": "A",
        "numero": 382,
        "residuo": "Phe382"
      }
    ],
    "ligacoesH": [
      {
        "residuo": "Ile360",
        "cadeia": "A",
        "numero": 360,
        "atomoProteina": "O",
        "atomoLigante": "N51",
        "distancia": 2.67
      },
      {
        "residuo": "Thr315",
        "cadeia": "A",
        "numero": 315,
        "atomoProteina": "OG1",
        "atomoLigante": "N13",
        "distancia": 2.88
      },
      {
        "residuo": "Met318",
        "cadeia": "A",
        "numero": 318,
        "atomoProteina": "N",
        "atomoLigante": "N3",
        "distancia": 2.9
      },
      {
        "residuo": "Asp381",
        "cadeia": "A",
        "numero": 381,
        "atomoProteina": "N",
        "atomoLigante": "O29",
        "distancia": 2.9
      },
      {
        "residuo": "Glu286",
        "cadeia": "A",
        "numero": 286,
        "atomoProteina": "OE2",
        "atomoLigante": "N21",
        "distancia": 3.0
      },
      {
        "residuo": "His361",
        "cadeia": "A",
        "numero": 361,
        "atomoProteina": "O",
        "atomoLigante": "N51",
        "distancia": 3.19
      },
      {
        "residuo": "Met318",
        "cadeia": "A",
        "numero": 318,
        "atomoProteina": "O",
        "atomoLigante": "N3",
        "distancia": 3.43
      }
    ],
    "atomosArquivo": 1494
  },
  {
    "id": "1HXB",
    "farmaco": "Saquinavir",
    "alvo": "Protease do HIV-1",
    "nota": "Antirretroviral: mimetiza o estado de transição da clivagem peptídica.",
    "galeria": null,
    "ligante": {
      "codigo": "ROC",
      "cadeia": "A",
      "numero": 100,
      "atomos": 49
    },
    "cadeias": [
      "A",
      "B"
    ],
    "titulo": "HIV-1 PROTEINASE COMPLEXED WITH RO 31-8959",
    "organismo": "Human immunodeficiency virus type 1 (clone 12)",
    "resolucao": 2.3,
    "referencia": "A.Krohn et al. J.Med.Chem. 34, 3340 (1991).",
    "sitio": [
      {
        "cadeia": "A",
        "numero": 25,
        "residuo": "Asp25"
      },
      {
        "cadeia": "A",
        "numero": 27,
        "residuo": "Gly27"
      },
      {
        "cadeia": "A",
        "numero": 28,
        "residuo": "Ala28"
      },
      {
        "cadeia": "A",
        "numero": 29,
        "residuo": "Asp29"
      },
      {
        "cadeia": "A",
        "numero": 30,
        "residuo": "Asp30"
      },
      {
        "cadeia": "A",
        "numero": 32,
        "residuo": "Val32"
      },
      {
        "cadeia": "A",
        "numero": 47,
        "residuo": "Ile47"
      },
      {
        "cadeia": "A",
        "numero": 48,
        "residuo": "Gly48"
      },
      {
        "cadeia": "A",
        "numero": 49,
        "residuo": "Gly49"
      },
      {
        "cadeia": "A",
        "numero": 50,
        "residuo": "Ile50"
      },
      {
        "cadeia": "A",
        "numero": 80,
        "residuo": "Thr80"
      },
      {
        "cadeia": "A",
        "numero": 81,
        "residuo": "Pro81"
      },
      {
        "cadeia": "A",
        "numero": 82,
        "residuo": "Val82"
      },
      {
        "cadeia": "A",
        "numero": 84,
        "residuo": "Ile84"
      },
      {
        "cadeia": "B",
        "numero": 8,
        "residuo": "Arg8"
      },
      {
        "cadeia": "B",
        "numero": 23,
        "residuo": "Leu23"
      },
      {
        "cadeia": "B",
        "numero": 25,
        "residuo": "Asp25"
      },
      {
        "cadeia": "B",
        "numero": 27,
        "residuo": "Gly27"
      },
      {
        "cadeia": "B",
        "numero": 28,
        "residuo": "Ala28"
      },
      {
        "cadeia": "B",
        "numero": 29,
        "residuo": "Asp29"
      },
      {
        "cadeia": "B",
        "numero": 30,
        "residuo": "Asp30"
      },
      {
        "cadeia": "B",
        "numero": 32,
        "residuo": "Val32"
      },
      {
        "cadeia": "B",
        "numero": 47,
        "residuo": "Ile47"
      },
      {
        "cadeia": "B",
        "numero": 48,
        "residuo": "Gly48"
      },
      {
        "cadeia": "B",
        "numero": 49,
        "residuo": "Gly49"
      },
      {
        "cadeia": "B",
        "numero": 50,
        "residuo": "Ile50"
      },
      {
        "cadeia": "B",
        "numero": 81,
        "residuo": "Pro81"
      },
      {
        "cadeia": "B",
        "numero": 82,
        "residuo": "Val82"
      },
      {
        "cadeia": "B",
        "numero": 84,
        "residuo": "Ile84"
      }
    ],
    "ligacoesH": [
      {
        "residuo": "Asp25",
        "cadeia": "B",
        "numero": 25,
        "atomoProteina": "OD2",
        "atomoLigante": "O2",
        "distancia": 2.76
      },
      {
        "residuo": "Asp25",
        "cadeia": "A",
        "numero": 25,
        "atomoProteina": "OD1",
        "atomoLigante": "O2",
        "distancia": 2.83
      },
      {
        "residuo": "Gly48",
        "cadeia": "A",
        "numero": 48,
        "atomoProteina": "O",
        "atomoLigante": "N1",
        "distancia": 2.86
      },
      {
        "residuo": "Asp29",
        "cadeia": "A",
        "numero": 29,
        "atomoProteina": "N",
        "atomoLigante": "O",
        "distancia": 2.95
      },
      {
        "residuo": "Asp25",
        "cadeia": "A",
        "numero": 25,
        "atomoProteina": "OD2",
        "atomoLigante": "O2",
        "distancia": 2.99
      },
      {
        "residuo": "Asp25",
        "cadeia": "B",
        "numero": 25,
        "atomoProteina": "OD1",
        "atomoLigante": "O2",
        "distancia": 2.99
      },
      {
        "residuo": "Asp30",
        "cadeia": "A",
        "numero": 30,
        "atomoProteina": "N",
        "atomoLigante": "OD1",
        "distancia": 3.19
      },
      {
        "residuo": "Gly27",
        "cadeia": "A",
        "numero": 27,
        "atomoProteina": "O",
        "atomoLigante": "O2",
        "distancia": 3.25
      },
      {
        "residuo": "Gly48",
        "cadeia": "A",
        "numero": 48,
        "atomoProteina": "O",
        "atomoLigante": "N",
        "distancia": 3.26
      },
      {
        "residuo": "Gly27",
        "cadeia": "A",
        "numero": 27,
        "atomoProteina": "O",
        "atomoLigante": "N2",
        "distancia": 3.27
      },
      {
        "residuo": "Asp30",
        "cadeia": "A",
        "numero": 30,
        "atomoProteina": "OD2",
        "atomoLigante": "ND2",
        "distancia": 3.38
      },
      {
        "residuo": "Asp29",
        "cadeia": "A",
        "numero": 29,
        "atomoProteina": "N",
        "atomoLigante": "OD1",
        "distancia": 3.45
      }
    ],
    "atomosArquivo": 1114
  },
  {
    "id": "4CI1",
    "farmaco": "(S)-Talidomida",
    "alvo": "Cereblon (CRBN)",
    "nota": "Liga-se ao cereblon e altera os alvos que a enzima marca para degradação.",
    "galeria": "s-talidomida",
    "ligante": {
      "codigo": "EF2",
      "cadeia": "B",
      "numero": 1429,
      "atomos": 19
    },
    "cadeias": [
      "B"
    ],
    "titulo": "STRUCTURE OF THE DDB1-CRBN E3 UBIQUITIN LIGASE BOUND TO THALIDOMIDE",
    "organismo": "Homo sapiens",
    "resolucao": 2.98,
    "referencia": "E.S.Fischer et al. Nature 512, 49 (2014).",
    "sitio": [
      {
        "cadeia": "B",
        "numero": 352,
        "residuo": "Val352"
      },
      {
        "cadeia": "B",
        "numero": 353,
        "residuo": "Asn353"
      },
      {
        "cadeia": "B",
        "numero": 354,
        "residuo": "Pro354"
      },
      {
        "cadeia": "B",
        "numero": 355,
        "residuo": "His355"
      },
      {
        "cadeia": "B",
        "numero": 359,
        "residuo": "His359"
      },
      {
        "cadeia": "B",
        "numero": 379,
        "residuo": "Glu379"
      },
      {
        "cadeia": "B",
        "numero": 380,
        "residuo": "His380"
      },
      {
        "cadeia": "B",
        "numero": 381,
        "residuo": "Ser381"
      },
      {
        "cadeia": "B",
        "numero": 382,
        "residuo": "Trp382"
      },
      {
        "cadeia": "B",
        "numero": 388,
        "residuo": "Trp388"
      },
      {
        "cadeia": "B",
        "numero": 402,
        "residuo": "Trp402"
      },
      {
        "cadeia": "B",
        "numero": 404,
        "residuo": "Phe404"
      }
    ],
    "ligacoesH": [
      {
        "residuo": "Trp382",
        "cadeia": "B",
        "numero": 382,
        "atomoProteina": "N",
        "atomoLigante": "O05",
        "distancia": 2.86
      },
      {
        "residuo": "His380",
        "cadeia": "B",
        "numero": 380,
        "atomoProteina": "ND1",
        "atomoLigante": "O01",
        "distancia": 2.9
      },
      {
        "residuo": "His380",
        "cadeia": "B",
        "numero": 380,
        "atomoProteina": "O",
        "atomoLigante": "N03",
        "distancia": 2.93
      },
      {
        "residuo": "His380",
        "cadeia": "B",
        "numero": 380,
        "atomoProteina": "O",
        "atomoLigante": "O01",
        "distancia": 3.36
      },
      {
        "residuo": "Trp382",
        "cadeia": "B",
        "numero": 382,
        "atomoProteina": "NE1",
        "atomoLigante": "N03",
        "distancia": 3.46
      },
      {
        "residuo": "Trp382",
        "cadeia": "B",
        "numero": 382,
        "atomoProteina": "NE1",
        "atomoLigante": "O01",
        "distancia": 3.5
      }
    ],
    "atomosArquivo": 1709
  }
];
