// Gerado por scripts/build_resonancia.py (RDKit ETKDGv3 + MMFF94).
// Geometria única por íon; os contribuintes de ressonância diferem só em ligações e cargas.

export type Hibridizacao = "sp3" | "sp2" | "sp";
export interface Contribuinte { ligacoes: [number, number, number][]; cargas: number[]; smiles: string }
export interface IonResonancia {
  key: string; nome: string; formula: string;
  /** rótulos dos átomos pesados, na ordem de `pesados` */ rotulos: string[];
  hibridizacao: Hibridizacao[]; notaHibridizacao: string;
  /** carga parcial de cada átomo pesado no híbrido de ressonância */ cargaHibrido: number[];
  contexto: string; elementos: string[]; pesados: number[]; coords: number[];
  contribuintes: Contribuinte[];
}

export const IONS_RESONANCIA: IonResonancia[] = [
 {
  "key": "enolato",
  "nome": "Ânion enolato (do acetaldeído)",
  "formula": "C₂H₃O⁻",
  "rotulos": [
   "C1",
   "C2",
   "O"
  ],
  "hibridizacao": [
   "sp2",
   "sp2",
   "sp2"
  ],
  "notaHibridizacao": "O oxigênio com carga participa da ressonância: seu par isolado ocupa um orbital p alinhado ao sistema π, então ele é sp², não sp³.",
  "cargaHibrido": [
   -0.5,
   0,
   -0.5
  ],
  "contexto": "Intermediário-chave das reações aldólicas: reage pelo carbono α (C1) mesmo com a maior parte da carga no oxigênio.",
  "elementos": [
   "C",
   "C",
   "O",
   "H",
   "H",
   "H"
  ],
  "pesados": [
   0,
   1,
   2
  ],
  "coords": [
   0.692,
   -0.041,
   -0.006,
   -0.646,
   0.025,
   0.004,
   -1.511,
   -0.879,
   -0.104,
   1.188,
   -0.998,
   -0.123,
   1.297,
   0.849,
   0.1,
   -1.02,
   1.044,
   0.128
  ],
  "contribuintes": [
   {
    "ligacoes": [
     [
      0,
      1,
      2
     ],
     [
      0,
      3,
      1
     ],
     [
      0,
      4,
      1
     ],
     [
      1,
      2,
      1
     ],
     [
      1,
      5,
      1
     ]
    ],
    "cargas": [
     0,
     0,
     -1,
     0,
     0,
     0
    ],
    "smiles": "C=C[O-]"
   },
   {
    "ligacoes": [
     [
      0,
      1,
      1
     ],
     [
      0,
      3,
      1
     ],
     [
      0,
      4,
      1
     ],
     [
      1,
      2,
      2
     ],
     [
      1,
      5,
      1
     ]
    ],
    "cargas": [
     -1,
     0,
     0,
     0,
     0,
     0
    ],
    "smiles": "[CH2-]C=O"
   }
  ]
 },
 {
  "key": "alila",
  "nome": "Cátion alila",
  "formula": "C₃H₅⁺",
  "rotulos": [
   "C1",
   "C2",
   "C3"
  ],
  "hibridizacao": [
   "sp2",
   "sp2",
   "sp2"
  ],
  "notaHibridizacao": "Os três carbonos são sp²: cada um contribui com um orbital p para um sistema π de três centros com dois elétrons.",
  "cargaHibrido": [
   0.5,
   0,
   0.5
  ],
  "contexto": "A deslocalização explica por que carbocátions alílicos são tão estáveis quanto os secundários em reações SN1.",
  "elementos": [
   "C",
   "C",
   "C",
   "H",
   "H",
   "H",
   "H",
   "H"
  ],
  "pesados": [
   0,
   1,
   2
  ],
  "coords": [
   1.1,
   -0.512,
   0.061,
   0.179,
   0.439,
   -0.125,
   -1.226,
   0.203,
   0.026,
   2.155,
   -0.29,
   -0.064,
   0.834,
   -1.527,
   0.34,
   0.487,
   1.444,
   -0.403,
   -1.923,
   1.017,
   -0.139,
   -1.606,
   -0.773,
   0.302
  ],
  "contribuintes": [
   {
    "ligacoes": [
     [
      0,
      1,
      2
     ],
     [
      0,
      3,
      1
     ],
     [
      0,
      4,
      1
     ],
     [
      1,
      2,
      1
     ],
     [
      1,
      5,
      1
     ],
     [
      2,
      6,
      1
     ],
     [
      2,
      7,
      1
     ]
    ],
    "cargas": [
     0,
     0,
     1,
     0,
     0,
     0,
     0,
     0
    ],
    "smiles": "C=C[CH2+]"
   },
   {
    "ligacoes": [
     [
      0,
      1,
      1
     ],
     [
      0,
      3,
      1
     ],
     [
      0,
      4,
      1
     ],
     [
      1,
      2,
      2
     ],
     [
      1,
      5,
      1
     ],
     [
      2,
      6,
      1
     ],
     [
      2,
      7,
      1
     ]
    ],
    "cargas": [
     1,
     0,
     0,
     0,
     0,
     0,
     0,
     0
    ],
    "smiles": "C=C[CH2+]"
   }
  ]
 },
 {
  "key": "acetato",
  "nome": "Íon acetato",
  "formula": "C₂H₃O₂⁻",
  "rotulos": [
   "CH₃",
   "C",
   "O1",
   "O2"
  ],
  "hibridizacao": [
   "sp3",
   "sp2",
   "sp2",
   "sp2"
  ],
  "notaHibridizacao": "Só a metila é sp³. A carbonila e os dois oxigênios formam o sistema π deslocalizado (sp²): as duas ligações C–O medem o mesmo (≈1,26 Å).",
  "cargaHibrido": [
   0,
   0,
   -0.5,
   -0.5
  ],
  "contexto": "A carga dividida entre dois oxigênios equivalentes explica a acidez do ácido acético (pKa 4,76) frente ao etanol (pKa ≈ 16).",
  "elementos": [
   "C",
   "C",
   "O",
   "O",
   "H",
   "H",
   "H"
  ],
  "pesados": [
   0,
   1,
   2,
   3
  ],
  "coords": [
   -0.637,
   -0.051,
   -0.041,
   0.874,
   0.064,
   0.056,
   1.305,
   1.236,
   0.244,
   1.506,
   -1.022,
   -0.062,
   -0.949,
   -1.088,
   -0.204,
   -1.002,
   0.554,
   -0.877,
   -1.097,
   0.307,
   0.885
  ],
  "contribuintes": [
   {
    "ligacoes": [
     [
      0,
      1,
      1
     ],
     [
      0,
      4,
      1
     ],
     [
      0,
      5,
      1
     ],
     [
      0,
      6,
      1
     ],
     [
      1,
      2,
      2
     ],
     [
      1,
      3,
      1
     ]
    ],
    "cargas": [
     0,
     0,
     0,
     -1,
     0,
     0,
     0
    ],
    "smiles": "CC(=O)[O-]"
   },
   {
    "ligacoes": [
     [
      0,
      1,
      1
     ],
     [
      0,
      4,
      1
     ],
     [
      0,
      5,
      1
     ],
     [
      0,
      6,
      1
     ],
     [
      1,
      2,
      1
     ],
     [
      1,
      3,
      2
     ]
    ],
    "cargas": [
     0,
     0,
     -1,
     0,
     0,
     0,
     0
    ],
    "smiles": "CC(=O)[O-]"
   }
  ]
 },
 {
  "key": "nitrometano",
  "nome": "Nitrometano",
  "formula": "CH₃NO₂",
  "rotulos": [
   "CH₃",
   "N",
   "O1",
   "O2"
  ],
  "hibridizacao": [
   "sp3",
   "sp2",
   "sp2",
   "sp2"
  ],
  "notaHibridizacao": "O nitrogênio é sp² (trigonal planar) e os dois oxigênios participam do sistema π; a metila é sp³.",
  "cargaHibrido": [
   0,
   1,
   -0.5,
   -0.5
  ],
  "contexto": "Molécula neutra com separação de cargas: +1 fixo no nitrogênio e −1 dividido entre os oxigênios. Por isso é muito polar (μ ≈ 3,5 D).",
  "elementos": [
   "C",
   "N",
   "O",
   "O",
   "H",
   "H",
   "H"
  ],
  "pesados": [
   0,
   1,
   2,
   3
  ],
  "coords": [
   -0.649,
   -0.043,
   -0.065,
   0.829,
   0.054,
   0.075,
   1.325,
   1.186,
   0.033,
   1.447,
   -1.004,
   0.243,
   -0.889,
   -1.003,
   -0.526,
   -0.989,
   0.78,
   -0.698,
   -1.073,
   0.03,
   0.938
  ],
  "contribuintes": [
   {
    "ligacoes": [
     [
      0,
      1,
      1
     ],
     [
      0,
      4,
      1
     ],
     [
      0,
      5,
      1
     ],
     [
      0,
      6,
      1
     ],
     [
      1,
      2,
      2
     ],
     [
      1,
      3,
      1
     ]
    ],
    "cargas": [
     0,
     1,
     0,
     -1,
     0,
     0,
     0
    ],
    "smiles": "C[N+](=O)[O-]"
   },
   {
    "ligacoes": [
     [
      0,
      1,
      1
     ],
     [
      0,
      4,
      1
     ],
     [
      0,
      5,
      1
     ],
     [
      0,
      6,
      1
     ],
     [
      1,
      2,
      1
     ],
     [
      1,
      3,
      2
     ]
    ],
    "cargas": [
     0,
     1,
     -1,
     0,
     0,
     0,
     0
    ],
    "smiles": "C[N+](=O)[O-]"
   }
  ]
 }
];
