/**
 * Banco de dados central do ChemPharm Hub: disciplinas, ementas, catálogo de jogos
 * (com o modo de renderização exigido pela Regra de Ouro 2D vs. 3D) e dados de referência.
 *
 * SMILES em forma de Kekulé: o bastão 2D mostra ligações simples/duplas alternadas no anel.
 * Todo valor físico-químico leva `fonte`. Referências usadas:
 *  - NIST Chemistry WebBook, SRD 69 (https://webbook.nist.gov)
 *  - CRC Handbook of Chemistry and Physics, 97ª ed.
 *  - PubChem (NIH), propriedades computadas e experimentais
 */

export type ModoRender = "3D" | "2D" | "2D + 3D" | "2D → 3D" | "Cartas 2D + 3D";

export type DisciplinaId = "organica-1" | "organica-2" | "organica-3" | "analise-organica";

export interface Jogo {
  id: string;
  titulo: string;
  modo: ModoRender;
  descricao: string;
  topicos: string[];
}

export interface MoleculaDestaque {
  nome: string;
  smiles: string;
  /** Chave em src/data/molecules3d.ts (só para disciplinas que usam 3D). */
  cacheKey?: string;
  cid?: number;
  legenda: string;
}

export interface Disciplina {
  id: DisciplinaId;
  ordem: number;
  titulo: string;
  tituloCurto: string;
  rota: `/${DisciplinaId}`;
  /** Cor de destaque do card (token da paleta). */
  cor: "primary" | "orbital" | "success" | "danger";
  ementa: string[];
  resumo: string;
  /** Regra de visualização da disciplina, derivada da diretriz da Rafaella. */
  regraVisual: string;
  jogos: Jogo[];
  destaque: MoleculaDestaque;
}

export const DISCIPLINAS: Disciplina[] = [
  {
    id: "organica-1",
    ordem: 1,
    titulo: "Química Orgânica Teórica 1",
    tituloCurto: "Orgânica 1",
    rota: "/organica-1",
    cor: "primary",
    resumo: "Carbono, ressonância, conformações, estereoquímica e os mecanismos SN1, SN2, E1 e E2.",
    ementa: [
      "Carbono: estrutura e ligações",
      "Carga formal e ressonância",
      "Grupos funcionais, nomenclatura e relação estrutura/propriedades físicas",
      "Análise conformacional de alcanos e cicloalcanos",
      "Estereoquímica",
      "Reações via radicais livres",
      "Ácidos e bases; eletrófilos e nucleófilos",
      "Substituição nucleofílica (SN1, SN2) e eliminação (E1, E2)",
    ],
    regraVisual:
      "3D obrigatório em estrutura/ressonância, conformações e estereoquímica; 2D em bastão para grupos funcionais, nomenclatura e propriedades físicas.",
    jogos: [
      {
        id: "estruturas-ressonancia",
        titulo: "Estruturas, Carga Formal e Ressonância",
        modo: "3D",
        descricao:
          "Identifique a hibridização (sp³, sp², sp) e as cargas formais (−1, 0, +1) em íons orgânicos reais e alterne entre os híbridos de ressonância vendo a nuvem eletrônica deslocalizada.",
        topicos: ["ânion enolato", "cátion alila", "íon acetato", "nitrometano"],
      },
      {
        id: "simulador-conformacional",
        titulo: "Simulador Conformacional",
        modo: "3D",
        descricao:
          "Gire o diedro C2–C3 do butano de 0° a 360° com projeção de Newman e curva de energia potencial (kJ/mol) em tempo real; faça o chair flip do cicloexano e encontre as interações 1,3-diaxiais.",
        topicos: ["anti", "gauche", "eclipsada", "totalmente eclipsada", "cadeira", "bote-torcido", "terc-butil equatorial"],
      },
      {
        id: "desafio-estereoquimica",
        titulo: "Desafio Espacial de Estereoquímica",
        modo: "3D",
        descricao:
          "Compare pares de moléculas de mesma fórmula (enantiômeros, diastereoisômeros, meso, constitucionais) e posicione o grupo de prioridade 4 para trás para classificar o centro como R ou S.",
        topicos: ["(S)-ibuprofeno", "(R)-talidomida", "ácido (2R,3R)-tartárico", "bromoclorofluorometano"],
      },
      {
        id: "grupos-funcionais",
        titulo: "Grupos Funcionais, Nomenclatura e Propriedades Físicas",
        modo: "2D",
        descricao:
          "Relacione estruturas em bastão a nomes IUPAC e altere cadeia, ramificações e grupos funcionais vendo o efeito em forças intermoleculares, polaridade, ponto de ebulição e solubilidade.",
        topicos: ["alcano → éter → aldeído → álcool → ácido carboxílico", "dipolo-dipolo", "ligação de hidrogênio", "dispersão de London"],
      },
      {
        id: "arena-mecanismos",
        titulo: "Arena de Mecanismos",
        modo: "2D + 3D",
        descricao:
          "Analise substrato, nucleófilo/base, grupo abandonador e solvente para prever o mecanismo dominante; veja o ataque dorsal a 180° com inversão de Walden (SN2) ou o carbocátion trigonal planar (SN1).",
        topicos: ["SN1", "SN2", "E1", "E2", "ácido-base"],
      },
      {
        id: "escada-pka",
        titulo: "Escada de pKa",
        modo: "2D",
        descricao:
          "Ordene ácidos e bases pela força e descubra o porquê: hibridização, efeito indutivo (número de halogênios e distância), ressonância e disponibilidade do par de elétrons, com valores de pKa de referência.",
        topicos: ["hibridização", "efeito indutivo", "ressonância", "basicidade de aminas"],
      },
      {
        id: "construtor-nomes",
        titulo: "Construtor de Nomenclatura IUPAC",
        modo: "2D",
        descricao:
          "Monte o nome IUPAC peça por peça (com peças-armadilha): cadeia principal, numeração, locantes, sufixos de grupos característicos e ordem alfabética dos prefixos.",
        topicos: ["cadeia principal", "menores locantes", "sufixos -ol, -ona, -al, -oico", "ordem alfabética"],
      },
    ],
    destaque: {
      nome: "Cicloexano",
      smiles: "C1CCCCC1",
      cacheKey: "cicloexano",
      cid: 8078,
      legenda: "Conformação cadeira (MMFF94): ângulos C–C–C próximos de 111°, sem tensão angular.",
    },
  },
  {
    id: "organica-2",
    ordem: 2,
    titulo: "Química Orgânica Teórica 2",
    tituloCurto: "Orgânica 2",
    rota: "/organica-2",
    cor: "orbital",
    resumo: "Alcenos, alcinos, álcoois, éteres e epóxidos; benzeno, aromaticidade, SEAr e SNAr.",
    ementa: [
      "Alcenos e alcinos",
      "Álcoois, éteres e epóxidos",
      "Benzeno e aromaticidade",
      "Substituição Aromática Eletrofílica (SEAr)",
      "Substituição Aromática Nucleofílica (SNAr)",
    ],
    regraVisual:
      "Cartas e reagentes em 2D; a molécula sintetizada vira 3D sempre que um substituinte entra no anel (orientação orto/meta/para e impedimento estérico).",
    jogos: [
      {
        id: "deckbuilder-aromaticos",
        titulo: "Deckbuilder de Reações Aromáticas",
        modo: "Cartas 2D + 3D",
        descricao:
          "Sintetize derivados benzênicos di- e trissubstituídos a partir do benzeno com cartas de reagentes reais; a cada carta jogada, a molécula aparece em 3D com a orientação e o impedimento estérico dos grupos.",
        topicos: [
          "HNO₃/H₂SO₄",
          "Br₂/FeBr₃ · Cl₂/AlCl₃",
          "SO₃/H₂SO₄",
          "Friedel-Crafts (RCl/AlCl₃, RCOCl/AlCl₃)",
          "KMnO₄/H₂O, Δ",
          "Sn/HCl · H₂/Pd",
          "SNAr",
        ],
      },
      {
        id: "lab-alcenos",
        titulo: "Laboratório de Alcenos, Alcinos, Álcoois, Éteres e Epóxidos",
        modo: "2D + 3D",
        descricao:
          "Desafio rápido de regiosseletividade (Markovnikov vs. anti-Markovnikov) e estereosseletividade (adição syn vs. anti, abertura de epóxidos em meio ácido vs. básico).",
        topicos: ["Markovnikov", "anti-Markovnikov", "adição syn/anti", "abertura de epóxido"],
      },
      {
        id: "diels-alder",
        titulo: "Diels-Alder em 3D",
        modo: "2D + 3D",
        descricao:
          "Cicloadição [4+2]: produto, dienófilos ativados, conformação s-cis e, em 3D, a conservação da estereoquímica (adução cis) e a regra endo com o ciclopentadieno.",
        topicos: ["cicloadição [4+2]", "s-cis", "suprafacial", "regra endo"],
      },
      {
        id: "aromatico-ou-nao",
        titulo: "Aromático ou Não?",
        modo: "2D + 3D",
        descricao:
          "Classifique 10 espécies (benzeno, heterociclos, íons tropílio e ciclopentadienila, ciclobutadieno) como aromáticas, antiaromáticas ou não aromáticas pela regra de Hückel; o ciclo-octatetraeno abre em 3D para mostrar a banheira.",
        topicos: ["regra de Hückel", "4n + 2", "antiaromaticidade", "heterociclos"],
      },
    ],
    destaque: {
      nome: "Benzeno",
      smiles: "C1=CC=CC=C1",
      cacheKey: "benzeno",
      cid: 241,
      legenda: "Anel planar com 6 elétrons π deslocalizados (regra de Hückel, 4n + 2 com n = 1).",
    },
  },
  {
    id: "organica-3",
    ordem: 3,
    titulo: "Química Orgânica Teórica 3",
    tituloCurto: "Orgânica 3",
    rota: "/organica-3",
    cor: "success",
    resumo: "Carbonilados, enolatos, condensações e planejamento de sínteses por retroanálise.",
    ementa: [
      "Compostos carbonilados: adição nucleofílica à carbonila",
      "Substituição no carbono acila",
      "Química dos enolatos e substituição alfa",
      "Condensações aldólica e de Claisen",
      "Biomacromoléculas correlacionadas a carbonilados",
      "Síntese orgânica multietapas: retroanálise, synthons e grupos de proteção",
    ],
    regraVisual:
      "A molécula-alvo e o corte ficam em bastão 2D; logo após a desconexão, os synthons abrem em 3D para inspecionar geometria e polaridade.",
    jogos: [
      {
        id: "bisturi-quimico",
        titulo: "Bisturi Químico: Engenharia Reversa e Retroanálise",
        modo: "2D → 3D",
        descricao:
          "Fase 1: molécula-alvo em bastão 2D. Fase 2: aplique grupos de proteção (acetal cíclico, TBDMS) e corte a ligação estratégica. Fase 3: os synthons (δ⁺/δ⁻) e seus equivalentes sintéticos abrem em 3D para escolher os reagentes da síntese direta.",
        topicos: ["benzocaína", "paracetamol", "chalcona", "β-hidroxicetona aldólica", "β-cetoéster de Claisen", "dipeptídeo"],
      },
      {
        id: "torre-reatividade",
        titulo: "Torre de Reatividade",
        modo: "2D",
        descricao:
          "Monte a torre dos derivados de ácido (cloreto de acila → anidrido → éster → amida) e preveja produtos de substituição nucleofílica acílica, da síntese da aspirina à saponificação.",
        topicos: ["grupo de saída", "substituição acílica", "síntese da aspirina", "saponificação", "SOCl₂"],
      },
      {
        id: "lab-carbonilas",
        titulo: "Laboratório de Carbonilas",
        modo: "2D",
        descricao:
          "Preveja o produto de aldeídos e cetonas com hidretos, Grignard, cianeto, dióis (acetal), ilídeos de Wittig e enolatos (aldólica).",
        topicos: ["NaBH₄", "Grignard", "cianidrina", "acetal", "Wittig", "aldólica"],
      },
      {
        id: "otimize-farmaco",
        titulo: "Otimize o Fármaco",
        modo: "2D",
        descricao:
          "Química medicinal: edite compostos-modelo que violam a Regra dos 5 de Lipinski até virarem candidatos orais, sem perder o farmacóforo. As propriedades são recalculadas a cada mudança no desenho.",
        topicos: ["Regra de Lipinski", "logP", "doadores e aceptores de H", "farmacóforo"],
      },
    ],
    destaque: {
      nome: "Benzocaína",
      smiles: "CCOC(=O)C1=CC=C(N)C=C1",
      cid: 2337,
      legenda: "Etapa de corte em 2D: a ligação C–O acila do éster é a desconexão estratégica (ácido p-aminobenzoico + etanol).",
    },
  },
  {
    id: "analise-organica",
    ordem: 4,
    titulo: "Análise Orgânica",
    tituloCurto: "Análise",
    rota: "/analise-organica",
    cor: "danger",
    resumo: "Testes químicos por via úmida e elucidação estrutural por IV, EM e RMN de ¹H e ¹³C.",
    ementa: [
      "Identificação e caracterização de substâncias orgânicas em amostras simples e misturas por métodos químicos",
      "Espectro eletromagnético",
      "Espectrometria no Infravermelho (IV)",
      "Espectrometria de Massas (EM)",
      "Ressonância Magnética Nuclear de ¹³C e ¹H",
    ],
    regraVisual: "100% 2D: fórmulas em bastão e gráficos analíticos interativos. Nenhum 3D nesta disciplina.",
    jogos: [
      {
        id: "csi-quimico",
        titulo: "CSI Químico: Elucidação Estrutural",
        modo: "2D",
        descricao:
          "Resolva casos com amostras desconhecidas usando testes clássicos (2,4-DNPH, Tollens, Lucas, NaHCO₃, Beilstein/AgNO₃) e a central espectrométrica (IV, EM, RMN ¹H e ¹³C) até montar a fórmula em bastão da substância.",
        topicos: ["acetofenona", "butanona", "acetato de etila", "ácido propanoico", "p-cloroanilina", "etanol"],
      },
      {
        id: "quebra-cabeca-rmn",
        titulo: "Quebra-cabeça de RMN",
        modo: "2D",
        descricao:
          "Leia o espectro de RMN de ¹H (deslocamento, multiplicidade e integração) e escolha, entre isômeros da mesma fórmula, a estrutura da amostra. Cada erro explica o que aquele isômero mostraria.",
        topicos: ["deslocamento químico", "regra n + 1", "integração", "simetria"],
      },
      {
        id: "detetive-iv",
        titulo: "Detetive do IV",
        modo: "2D",
        descricao:
          "Espectros reais de infravermelho (NIST): identifique o grupo funcional de cada amostra pelas bandas de C=O, O–H, N–H e C–O. Cada erro mostra a assinatura que aquele grupo teria.",
        topicos: ["C=O", "O–H", "N–H", "conjugação"],
      },
      {
        id: "detetive-massas",
        titulo: "Detetive de Massas",
        modo: "2D",
        descricao:
          "Espectros reais de massas (NIST): ache o íon molecular e explique o pico base (clivagem α, acílio, perda de radicais, padrão isotópico do cloro).",
        topicos: ["íon molecular", "pico base", "clivagem α", "M + 2"],
      },
    ],
    destaque: {
      nome: "Acetofenona",
      smiles: "CC(=O)C1=CC=CC=C1",
      legenda: "Carbonila conjugada ao anel: no IV, o estiramento C=O cai para ~1685 cm⁻¹ (vs. ~1715 cm⁻¹ em cetonas alifáticas).",
    },
  },
];

export function getDisciplina(id: DisciplinaId): Disciplina {
  const d = DISCIPLINAS.find((x) => x.id === id);
  if (!d) throw new Error(`Disciplina desconhecida: ${id}`);
  return d;
}

// ---------------------------------------------------------------------------
// Dados de referência: os 6 casos do CSI Químico
// ---------------------------------------------------------------------------

export interface CompostoReferencia {
  id: string;
  nome: string;
  iupac: string;
  smiles: string;
  formula: string;
  /** g/mol */
  massaMolar: number;
  /** °C a 1 atm */
  pontoEbulicao: number;
  fonte: string;
}

export const CASOS_ANALISE: CompostoReferencia[] = [
  {
    id: "acetofenona",
    nome: "Acetofenona",
    iupac: "1-feniletan-1-ona",
    smiles: "CC(=O)C1=CC=CC=C1",
    formula: "C8H8O",
    massaMolar: 120.15,
    pontoEbulicao: 202,
    fonte: "NIST Chemistry WebBook; CRC Handbook, 97ª ed.",
  },
  {
    id: "butanona",
    nome: "Butanona (MEK)",
    iupac: "butan-2-ona",
    smiles: "CCC(C)=O",
    formula: "C4H8O",
    massaMolar: 72.11,
    pontoEbulicao: 79.6,
    fonte: "NIST Chemistry WebBook; CRC Handbook, 97ª ed.",
  },
  {
    id: "acetato-de-etila",
    nome: "Acetato de etila",
    iupac: "etanoato de etila",
    smiles: "CCOC(C)=O",
    formula: "C4H8O2",
    massaMolar: 88.11,
    pontoEbulicao: 77.1,
    fonte: "NIST Chemistry WebBook; CRC Handbook, 97ª ed.",
  },
  {
    id: "acido-propanoico",
    nome: "Ácido propanoico",
    iupac: "ácido propanoico",
    smiles: "CCC(=O)O",
    formula: "C3H6O2",
    massaMolar: 74.08,
    pontoEbulicao: 141.2,
    fonte: "NIST Chemistry WebBook; CRC Handbook, 97ª ed.",
  },
  {
    id: "p-cloroanilina",
    nome: "p-Cloroanilina",
    iupac: "4-cloroanilina",
    smiles: "NC1=CC=C(Cl)C=C1",
    formula: "C6H6ClN",
    massaMolar: 127.57,
    pontoEbulicao: 232,
    fonte: "CRC Handbook, 97ª ed.; PubChem",
  },
  {
    id: "etanol",
    nome: "Etanol",
    iupac: "etanol",
    smiles: "CCO",
    formula: "C2H6O",
    massaMolar: 46.07,
    pontoEbulicao: 78.37,
    fonte: "NIST Chemistry WebBook; CRC Handbook, 97ª ed.",
  },
];
