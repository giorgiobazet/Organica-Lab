// Gerado por scripts/build_alcenos.py (cis/trans conferidos pela geometria 3D no RDKit).

export interface OpcaoProduto { smiles: string; nome: string }
export interface QuestaoAlceno {
  id: string; tipo: "regio" | "estereo" | "epoxido";
  substrato: string; substratoNome: string; reagentes: string;
  opcoes: OpcaoProduto[]; correta: number; explicacao: string;
  produto3d?: { elementos: string[]; ligacoes: [number, number, number][]; coords: number[] };
}

export const QUESTOES_ALCENOS: QuestaoAlceno[] = [
 {
  "id": "hbr",
  "tipo": "regio",
  "substrato": "C=CC",
  "substratoNome": "propeno",
  "reagentes": "HBr",
  "opcoes": [
   {
    "smiles": "CC(C)Br",
    "nome": "2-bromopropano"
   },
   {
    "smiles": "CCCBr",
    "nome": "1-bromopropano"
   }
  ],
  "correta": 0,
  "explicacao": "Markovnikov: o H⁺ entra no carbono com mais H e forma o carbocátion secundário, mais estável; o Br⁻ fica no C2."
 },
 {
  "id": "hbr-peroxido",
  "tipo": "regio",
  "substrato": "C=CC",
  "substratoNome": "propeno",
  "reagentes": "HBr, ROOR (peróxido), hν",
  "opcoes": [
   {
    "smiles": "CC(C)Br",
    "nome": "2-bromopropano"
   },
   {
    "smiles": "CCCBr",
    "nome": "1-bromopropano"
   }
  ],
  "correta": 1,
  "explicacao": "Com peróxido a adição é radicalar: o Br• ataca o carbono terminal para gerar o radical secundário, mais estável. Resultado anti-Markovnikov (só funciona com HBr)."
 },
 {
  "id": "hidratacao",
  "tipo": "regio",
  "substrato": "C=C(C)C",
  "substratoNome": "2-metilpropeno",
  "reagentes": "H₂O, H₂SO₄ (cat.)",
  "opcoes": [
   {
    "smiles": "CC(C)(C)O",
    "nome": "2-metilpropan-2-ol"
   },
   {
    "smiles": "CC(C)CO",
    "nome": "2-metilpropan-1-ol"
   }
  ],
  "correta": 0,
  "explicacao": "Hidratação ácida via carbocátion terciário: OH no carbono mais substituído (Markovnikov)."
 },
 {
  "id": "hidroboracao",
  "tipo": "regio",
  "substrato": "C=C(C)C",
  "substratoNome": "2-metilpropeno",
  "reagentes": "1) BH₃·THF  2) H₂O₂, NaOH",
  "opcoes": [
   {
    "smiles": "CC(C)(C)O",
    "nome": "2-metilpropan-2-ol"
   },
   {
    "smiles": "CC(C)CO",
    "nome": "2-metilpropan-1-ol"
   }
  ],
  "correta": 1,
  "explicacao": "Hidroboração-oxidação: o boro entra no carbono menos impedido e é trocado por OH com retenção. Anti-Markovnikov, sem carbocátion."
 },
 {
  "id": "oximercuracao",
  "tipo": "regio",
  "substrato": "C=CCCCC",
  "substratoNome": "hex-1-eno",
  "reagentes": "1) Hg(OAc)₂, H₂O  2) NaBH₄",
  "opcoes": [
   {
    "smiles": "CC(O)CCCC",
    "nome": "hexan-2-ol"
   },
   {
    "smiles": "OCCCCCC",
    "nome": "hexan-1-ol"
   }
  ],
  "correta": 0,
  "explicacao": "Oximercuração-desmercuração: Markovnikov via íon mercurínio em ponte, sem rearranjo de carbocátion."
 },
 {
  "id": "alcino-hidratacao",
  "tipo": "regio",
  "substrato": "C#CC",
  "substratoNome": "propino",
  "reagentes": "H₂O, H₂SO₄, HgSO₄",
  "opcoes": [
   {
    "smiles": "CC(C)=O",
    "nome": "propanona"
   },
   {
    "smiles": "CCC=O",
    "nome": "propanal"
   }
  ],
  "correta": 0,
  "explicacao": "O enol Markovnikov (OH no C2) tautomeriza para a cetona. Alcinos terminais dão metilcetonas."
 },
 {
  "id": "alcino-hidroboracao",
  "tipo": "regio",
  "substrato": "C#CC",
  "substratoNome": "propino",
  "reagentes": "1) 9-BBN (ou disiamilborano)  2) H₂O₂, NaOH",
  "opcoes": [
   {
    "smiles": "CC(C)=O",
    "nome": "propanona"
   },
   {
    "smiles": "CCC=O",
    "nome": "propanal"
   }
  ],
  "correta": 1,
  "explicacao": "Borano volumoso no carbono terminal → enol anti-Markovnikov → aldeído após tautomerização."
 },
 {
  "id": "br2",
  "tipo": "estereo",
  "substrato": "C1=CCCCC1",
  "substratoNome": "ciclo-hexeno",
  "reagentes": "Br₂, CH₂Cl₂",
  "opcoes": [
   {
    "smiles": "Br[C@@H]1CCCC[C@H]1Br",
    "nome": "trans-1,2-dibromociclo-hexano"
   },
   {
    "smiles": "Br[C@@H]1CCCC[C@@H]1Br",
    "nome": "cis-1,2-dibromociclo-hexano"
   }
  ],
  "correta": 0,
  "explicacao": "Adição anti: o Br⁻ abre o íon bromônio pela face oposta. Produto trans (racemato).",
  "produto3d": {
   "elementos": [
    "Br",
    "C",
    "C",
    "C",
    "C",
    "C",
    "C",
    "Br",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H"
   ],
   "ligacoes": [
    [
     0,
     1,
     1
    ],
    [
     1,
     2,
     1
    ],
    [
     2,
     3,
     1
    ],
    [
     3,
     4,
     1
    ],
    [
     4,
     5,
     1
    ],
    [
     5,
     6,
     1
    ],
    [
     6,
     7,
     1
    ],
    [
     6,
     1,
     1
    ],
    [
     1,
     8,
     1
    ],
    [
     2,
     9,
     1
    ],
    [
     2,
     10,
     1
    ],
    [
     3,
     11,
     1
    ],
    [
     3,
     12,
     1
    ],
    [
     4,
     13,
     1
    ],
    [
     4,
     14,
     1
    ],
    [
     5,
     15,
     1
    ],
    [
     5,
     16,
     1
    ],
    [
     6,
     17,
     1
    ]
   ],
   "coords": [
    -2.85,
    1.152,
    -1.056,
    -1.335,
    0.482,
    0.009,
    -0.17,
    1.453,
    -0.207,
    1.11,
    0.96,
    0.458,
    1.473,
    -0.442,
    -0.018,
    0.331,
    -1.421,
    0.234,
    -0.978,
    -0.946,
    -0.403,
    -2.385,
    -2.202,
    0.164,
    -1.673,
    0.528,
    1.05,
    -0.426,
    2.444,
    0.188,
    0.02,
    1.587,
    -1.28,
    1.931,
    1.65,
    0.233,
    0.982,
    0.959,
    1.548,
    2.374,
    -0.786,
    0.501,
    1.708,
    -0.419,
    -1.089,
    0.205,
    -1.541,
    1.319,
    0.607,
    -2.407,
    -0.158,
    -0.923,
    -1.049,
    -1.493
   ]
  }
 },
 {
  "id": "oso4",
  "tipo": "estereo",
  "substrato": "C1=CCCCC1",
  "substratoNome": "ciclo-hexeno",
  "reagentes": "1) OsO₄  2) NaHSO₃, H₂O",
  "opcoes": [
   {
    "smiles": "O[C@@H]1CCCC[C@H]1O",
    "nome": "trans-ciclo-hexano-1,2-diol"
   },
   {
    "smiles": "O[C@@H]1CCCC[C@@H]1O",
    "nome": "cis-ciclo-hexano-1,2-diol"
   }
  ],
  "correta": 1,
  "explicacao": "Adição syn: o OsO₄ forma um éster ósmico cíclico pela mesma face. Diol cis (composto meso).",
  "produto3d": {
   "elementos": [
    "O",
    "C",
    "C",
    "C",
    "C",
    "C",
    "C",
    "O",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H"
   ],
   "ligacoes": [
    [
     0,
     1,
     1
    ],
    [
     1,
     2,
     1
    ],
    [
     2,
     3,
     1
    ],
    [
     3,
     4,
     1
    ],
    [
     4,
     5,
     1
    ],
    [
     5,
     6,
     1
    ],
    [
     6,
     7,
     1
    ],
    [
     6,
     1,
     1
    ],
    [
     0,
     8,
     1
    ],
    [
     1,
     9,
     1
    ],
    [
     2,
     10,
     1
    ],
    [
     2,
     11,
     1
    ],
    [
     3,
     12,
     1
    ],
    [
     3,
     13,
     1
    ],
    [
     4,
     14,
     1
    ],
    [
     4,
     15,
     1
    ],
    [
     5,
     16,
     1
    ],
    [
     5,
     17,
     1
    ],
    [
     6,
     18,
     1
    ],
    [
     7,
     19,
     1
    ]
   ],
   "coords": [
    2.446,
    0.591,
    -0.005,
    1.09,
    0.354,
    -0.398,
    0.178,
    1.351,
    0.325,
    -1.254,
    0.846,
    0.511,
    -1.631,
    -0.215,
    -0.514,
    -0.714,
    -1.441,
    -0.44,
    0.732,
    -1.101,
    -0.07,
    0.919,
    -1.318,
    1.335,
    2.649,
    1.519,
    -0.217,
    1.027,
    0.506,
    -1.482,
    0.165,
    2.284,
    -0.253,
    0.594,
    1.627,
    1.302,
    -1.951,
    1.69,
    0.457,
    -1.36,
    0.423,
    1.518,
    -1.574,
    0.221,
    -1.519,
    -2.671,
    -0.528,
    -0.37,
    -0.734,
    -1.932,
    -1.421,
    -1.126,
    -2.157,
    0.282,
    1.42,
    -1.789,
    -0.573,
    1.795,
    -0.93,
    1.531
   ]
  }
 },
 {
  "id": "epoxido-h3o",
  "tipo": "estereo",
  "substrato": "C1=CCCCC1",
  "substratoNome": "ciclo-hexeno",
  "reagentes": "1) mCPBA  2) H₃O⁺",
  "opcoes": [
   {
    "smiles": "O[C@@H]1CCCC[C@H]1O",
    "nome": "trans-ciclo-hexano-1,2-diol"
   },
   {
    "smiles": "O[C@@H]1CCCC[C@@H]1O",
    "nome": "cis-ciclo-hexano-1,2-diol"
   }
  ],
  "correta": 0,
  "explicacao": "O epóxido se forma numa face; a água abre o epóxido protonado pela face oposta (SN2). Diol trans: o complemento anti do OsO₄.",
  "produto3d": {
   "elementos": [
    "O",
    "C",
    "C",
    "C",
    "C",
    "C",
    "C",
    "O",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H"
   ],
   "ligacoes": [
    [
     0,
     1,
     1
    ],
    [
     1,
     2,
     1
    ],
    [
     2,
     3,
     1
    ],
    [
     3,
     4,
     1
    ],
    [
     4,
     5,
     1
    ],
    [
     5,
     6,
     1
    ],
    [
     6,
     7,
     1
    ],
    [
     6,
     1,
     1
    ],
    [
     0,
     8,
     1
    ],
    [
     1,
     9,
     1
    ],
    [
     2,
     10,
     1
    ],
    [
     2,
     11,
     1
    ],
    [
     3,
     12,
     1
    ],
    [
     3,
     13,
     1
    ],
    [
     4,
     14,
     1
    ],
    [
     4,
     15,
     1
    ],
    [
     5,
     16,
     1
    ],
    [
     5,
     17,
     1
    ],
    [
     6,
     18,
     1
    ],
    [
     7,
     19,
     1
    ]
   ],
   "coords": [
    2.436,
    0.81,
    0.16,
    1.163,
    0.339,
    -0.283,
    0.182,
    1.506,
    -0.322,
    -1.227,
    1.043,
    -0.681,
    -1.713,
    -0.068,
    0.25,
    -0.735,
    -1.238,
    0.291,
    0.673,
    -0.776,
    0.654,
    1.589,
    -1.875,
    0.589,
    2.925,
    0.018,
    0.458,
    1.311,
    -0.062,
    -1.293,
    0.171,
    2.013,
    0.651,
    0.527,
    2.257,
    -1.043,
    -1.239,
    0.68,
    -1.716,
    -1.918,
    1.892,
    -0.632,
    -1.841,
    0.336,
    1.262,
    -2.697,
    -0.42,
    -0.08,
    -0.722,
    -1.745,
    -0.683,
    -1.076,
    -1.991,
    1.012,
    0.696,
    -0.42,
    1.691,
    1.492,
    -2.296,
    -0.283
   ]
  }
 },
 {
  "id": "hidroboracao-anel",
  "tipo": "estereo",
  "substrato": "CC1=CCCCC1",
  "substratoNome": "1-metilciclo-hexeno",
  "reagentes": "1) BH₃·THF  2) H₂O₂, NaOH",
  "opcoes": [
   {
    "smiles": "C[C@@H]1CCCC[C@H]1O",
    "nome": "trans-2-metilciclo-hexan-1-ol"
   },
   {
    "smiles": "C[C@@H]1CCCC[C@@H]1O",
    "nome": "cis-2-metilciclo-hexan-1-ol"
   },
   {
    "smiles": "CC1(O)CCCCC1",
    "nome": "1-metilciclo-hexan-1-ol"
   }
  ],
  "correta": 0,
  "explicacao": "Anti-Markovnikov e syn: H e B entram pela mesma face, e o OH substitui o B com retenção. Como o H ficou cis ao OH, a metila fica trans.",
  "produto3d": {
   "elementos": [
    "C",
    "C",
    "C",
    "C",
    "C",
    "C",
    "C",
    "O",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H"
   ],
   "ligacoes": [
    [
     0,
     1,
     1
    ],
    [
     1,
     2,
     1
    ],
    [
     2,
     3,
     1
    ],
    [
     3,
     4,
     1
    ],
    [
     4,
     5,
     1
    ],
    [
     5,
     6,
     1
    ],
    [
     6,
     7,
     1
    ],
    [
     6,
     1,
     1
    ],
    [
     0,
     8,
     1
    ],
    [
     0,
     9,
     1
    ],
    [
     0,
     10,
     1
    ],
    [
     1,
     11,
     1
    ],
    [
     2,
     12,
     1
    ],
    [
     2,
     13,
     1
    ],
    [
     3,
     14,
     1
    ],
    [
     3,
     15,
     1
    ],
    [
     4,
     16,
     1
    ],
    [
     4,
     17,
     1
    ],
    [
     5,
     18,
     1
    ],
    [
     5,
     19,
     1
    ],
    [
     6,
     20,
     1
    ],
    [
     7,
     21,
     1
    ]
   ],
   "coords": [
    2.304,
    -0.169,
    -0.488,
    0.92,
    -0.196,
    0.167,
    0.079,
    -1.335,
    -0.428,
    -1.325,
    -1.379,
    0.168,
    -2.039,
    -0.041,
    0.021,
    -1.217,
    1.095,
    0.616,
    0.191,
    1.153,
    0.023,
    0.902,
    2.183,
    0.705,
    2.959,
    0.561,
    -0.003,
    2.235,
    0.086,
    -1.55,
    2.79,
    -1.148,
    -0.406,
    1.076,
    -0.394,
    1.236,
    0.575,
    -2.297,
    -0.251,
    0.005,
    -1.213,
    -1.516,
    -1.262,
    -1.645,
    1.231,
    -1.909,
    -2.165,
    -0.323,
    -2.226,
    0.16,
    -1.041,
    -3.017,
    -0.087,
    0.514,
    -1.154,
    0.978,
    1.706,
    -1.727,
    2.052,
    0.452,
    0.123,
    1.438,
    -1.035,
    1.716,
    2.363,
    0.205
   ]
  }
 },
 {
  "id": "lindlar",
  "tipo": "estereo",
  "substrato": "CC#CC",
  "substratoNome": "but-2-ino",
  "reagentes": "H₂, Pd/CaCO₃ (Lindlar), quinolina",
  "opcoes": [
   {
    "smiles": "C/C=C\\C",
    "nome": "cis-but-2-eno"
   },
   {
    "smiles": "C/C=C/C",
    "nome": "trans-but-2-eno"
   },
   {
    "smiles": "CCCC",
    "nome": "butano"
   }
  ],
  "correta": 0,
  "explicacao": "O catalisador envenenado para no alceno e entrega os dois H pela mesma face: adição syn → alceno cis (Z).",
  "produto3d": {
   "elementos": [
    "C",
    "C",
    "C",
    "C",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H"
   ],
   "ligacoes": [
    [
     0,
     1,
     1
    ],
    [
     1,
     2,
     2
    ],
    [
     2,
     3,
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
     7,
     1
    ],
    [
     2,
     8,
     1
    ],
    [
     3,
     9,
     1
    ],
    [
     3,
     10,
     1
    ],
    [
     3,
     11,
     1
    ]
   ],
   "coords": [
    1.587,
    -0.31,
    0.27,
    0.61,
    0.812,
    0.133,
    -0.709,
    0.732,
    -0.102,
    -1.536,
    -0.499,
    -0.286,
    2.37,
    -0.212,
    -0.489,
    1.136,
    -1.298,
    0.16,
    2.062,
    -0.266,
    1.255,
    1.043,
    1.807,
    0.24,
    -1.265,
    1.667,
    -0.171,
    -2.015,
    -0.477,
    -1.27,
    -0.962,
    -1.425,
    -0.214,
    -2.322,
    -0.531,
    0.474
   ]
  }
 },
 {
  "id": "na-nh3",
  "tipo": "estereo",
  "substrato": "CC#CC",
  "substratoNome": "but-2-ino",
  "reagentes": "Na, NH₃ (líq.), −78 °C",
  "opcoes": [
   {
    "smiles": "C/C=C\\C",
    "nome": "cis-but-2-eno"
   },
   {
    "smiles": "C/C=C/C",
    "nome": "trans-but-2-eno"
   },
   {
    "smiles": "CCCC",
    "nome": "butano"
   }
  ],
  "correta": 1,
  "explicacao": "Redução por metal dissolvido: o ânion-radical vinílico adota a geometria trans, mais estável. Alceno trans (E).",
  "produto3d": {
   "elementos": [
    "C",
    "C",
    "C",
    "C",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H",
    "H"
   ],
   "ligacoes": [
    [
     0,
     1,
     1
    ],
    [
     1,
     2,
     2
    ],
    [
     2,
     3,
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
     7,
     1
    ],
    [
     2,
     8,
     1
    ],
    [
     3,
     9,
     1
    ],
    [
     3,
     10,
     1
    ],
    [
     3,
     11,
     1
    ]
   ],
   "coords": [
    1.939,
    -0.164,
    0.133,
    0.483,
    -0.081,
    0.459,
    -0.483,
    0.081,
    -0.459,
    -1.939,
    0.164,
    -0.133,
    2.128,
    -0.079,
    -0.941,
    2.48,
    0.64,
    0.641,
    2.342,
    -1.122,
    0.476,
    0.221,
    -0.159,
    1.512,
    -0.221,
    0.159,
    -1.512,
    -2.128,
    0.079,
    0.941,
    -2.342,
    1.122,
    -0.476,
    -2.48,
    -0.64,
    -0.641
   ]
  }
 },
 {
  "id": "epoxido-basico",
  "tipo": "epoxido",
  "substrato": "CC1(C)CO1",
  "substratoNome": "2,2-dimetiloxirano",
  "reagentes": "CH₃O⁻ Na⁺, CH₃OH",
  "opcoes": [
   {
    "smiles": "COCC(C)(C)O",
    "nome": "1-metoxi-2-metilpropan-2-ol"
   },
   {
    "smiles": "COC(C)(C)CO",
    "nome": "2-metoxi-2-metilpropan-1-ol"
   }
  ],
  "correta": 0,
  "explicacao": "Meio básico: nucleófilo forte, SN2 no carbono MENOS impedido (o CH₂)."
 },
 {
  "id": "epoxido-acido",
  "tipo": "epoxido",
  "substrato": "CC1(C)CO1",
  "substratoNome": "2,2-dimetiloxirano",
  "reagentes": "CH₃OH, H₂SO₄ (cat.)",
  "opcoes": [
   {
    "smiles": "COCC(C)(C)O",
    "nome": "1-metoxi-2-metilpropan-2-ol"
   },
   {
    "smiles": "COC(C)(C)CO",
    "nome": "2-metoxi-2-metilpropan-1-ol"
   }
  ],
  "correta": 1,
  "explicacao": "Meio ácido: o epóxido protonado tem caráter de carbocátion no carbono MAIS substituído, e o metanol ataca lá."
 }
];
