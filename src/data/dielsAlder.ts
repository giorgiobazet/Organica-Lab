/**
 * Diels-Alder: questões de Orgânica 2. As de estereoquímica (cis e endo/exo) usam 3D, conforme a
 * Regra de Ouro (a geometria muda o resultado); as demais ficam em 2D.
 */
export const FONTE_DIELS_ALDER = "Bruice, Química Orgânica, cap. 8 (dienos e Diels-Alder); Clayden, Organic Chemistry, cap. 34. Geometrias: RDKit (ETKDGv3 + MMFF94).";

export interface OpcaoDA {
  texto: string;
  smiles?: string;
}

export interface QuestaoDA {
  id: string;
  reacao: string;
  pergunta: string;
  opcoes: OpcaoDA[];
  correta: number;
  explicacao: string;
  /** Questões que mostram os produtos em 3D. */
  modelo3d?: "cis" | "endo-exo";
}

export const QUESTOES_DA: QuestaoDA[] = [
  {
    id: "basica",
    reacao: "1,3-Butadieno + eteno, aquecimento",
    pergunta: "Qual é o produto da cicloadição [4+2]?",
    opcoes: [
      { texto: "Cicloexeno", smiles: "C1=CCCCC1" },
      { texto: "Cicloexano", smiles: "C1CCCCC1" },
      { texto: "Hexa-1,5-dieno", smiles: "C=CCCC=C" },
      { texto: "Benzeno", smiles: "C1=CC=CC=C1" },
    ],
    correta: 0,
    explicacao:
      "Três ligações π (duas do dieno, uma do dienófilo) viram duas ligações σ novas e uma π nova, entre os antigos C2 e C3 do dieno: forma-se um anel de seis membros com uma dupla, o cicloexeno.",
  },
  {
    id: "dienofilo",
    reacao: "1,3-Butadieno + dienófilo",
    pergunta: "Com qual dienófilo a reação é mais rápida?",
    opcoes: [
      { texto: "Eteno", smiles: "C=C" },
      { texto: "Propeno", smiles: "CC=C" },
      { texto: "Anidrido maleico", smiles: "O=C1C=CC(=O)O1" },
      { texto: "But-2-eno", smiles: "CC=CC" },
    ],
    correta: 2,
    explicacao:
      "Na Diels-Alder de demanda normal, o dienófilo pobre em elétrons reage melhor: as duas carbonilas do anidrido maleico retiram elétrons e baixam o LUMO, aproximando-o do HOMO do dieno. Grupos alquila (doadores) fazem o oposto.",
  },
  {
    id: "s-cis",
    reacao: "Ciclopentadieno",
    pergunta: "Por que o ciclopentadieno é um dieno excepcionalmente reativo?",
    opcoes: [
      { texto: "Está travado na conformação s-cis, a única que reage", smiles: "C1=CCC=C1" },
      { texto: "É aromático" },
      { texto: "Tem um carbono sp" },
      { texto: "Suas duplas não são conjugadas" },
    ],
    correta: 0,
    explicacao:
      "O dieno só reage na conformação s-cis, com as duas pontas do lado do dienófilo. No 1,3-butadieno a s-trans predomina; no ciclopentadieno o anel trava o dieno em s-cis, então toda colisão útil pode reagir. Ele não é aromático (o CH₂ é sp³).",
  },
  {
    id: "cis",
    reacao: "1,3-Butadieno + anidrido maleico",
    pergunta: "Qual é a relação entre os dois H da junção dos anéis no produto?",
    opcoes: [
      { texto: "Cis (mesmo lado)", smiles: "O=C1OC(=O)[C@@H]2CC=CC[C@H]12" },
      { texto: "Trans (lados opostos)", smiles: "O=C1OC(=O)[C@@H]2CC=CC[C@@H]12" },
    ],
    correta: 0,
    explicacao:
      "A reação é concertada e suprafacial: os substituintes cis no dienófilo continuam cis no produto. No modelo 3D, os dois H da junção ficam do mesmo lado do anel (diedro H–C–C–H de cerca de 34°).",
    modelo3d: "cis",
  },
  {
    id: "endo",
    reacao: "Ciclopentadieno + anidrido maleico",
    pergunta: "Qual dos dois adutos 3D é o produto cinético (o principal)?",
    opcoes: [{ texto: "Aduto A" }, { texto: "Aduto B" }],
    correta: 1,
    explicacao:
      "Regra endo: no estado de transição, as carbonilas do dienófilo ficam sob o dieno, onde interações orbitais secundárias o estabilizam. No aduto endo (B), o anidrido aponta para a ponte com a dupla C=C (2,9 Å) e fica longe da ponte CH₂ (3,5 Å); no exo (A), é o contrário. O exo é mais estável, mas forma-se mais devagar.",
    modelo3d: "endo-exo",
  },
];
