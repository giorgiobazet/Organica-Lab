/**
 * Nomes em português → nome em inglês usado pelo PubChem.
 * O PubChem só entende nomes em inglês; este dicionário cobre os nomes mais comuns nas aulas
 * de Química Orgânica e Farmácia. O que não estiver aqui passa pela tradução por padrões
 * (traduzirNome), que segue as regras de nomenclatura IUPAC em português e inglês.
 */
export const NOMES_PT_EN: Record<string, string> = {
  // Fármacos e produtos naturais
  aspirina: "aspirin",
  "acido acetilsalicilico": "aspirin",
  paracetamol: "acetaminophen",
  acetaminofeno: "acetaminophen",
  ibuprofeno: "ibuprofen",
  dipirona: "metamizole",
  metamizol: "metamizole",
  diclofenaco: "diclofenac",
  naproxeno: "naproxen",
  cetoprofeno: "ketoprofen",
  nimesulida: "nimesulide",
  cafeina: "caffeine",
  teobromina: "theobromine",
  nicotina: "nicotine",
  morfina: "morphine",
  codeina: "codeine",
  benzocaina: "benzocaine",
  lidocaina: "lidocaine",
  procaina: "procaine",
  amoxicilina: "amoxicillin",
  penicilina: "penicillin G",
  "penicilina g": "penicillin G",
  talidomida: "thalidomide",
  omeprazol: "omeprazole",
  losartana: "losartan",
  captopril: "captopril",
  metformina: "metformin",
  sinvastatina: "simvastatin",
  atorvastatina: "atorvastatin",
  fluoxetina: "fluoxetine",
  diazepam: "diazepam",
  loratadina: "loratadine",
  dexametasona: "dexamethasone",
  prednisona: "prednisone",
  salbutamol: "salbutamol",
  adrenalina: "epinephrine",
  epinefrina: "epinephrine",
  noradrenalina: "norepinephrine",
  dopamina: "dopamine",
  serotonina: "serotonin",
  histamina: "histamine",
  "acido ascorbico": "ascorbic acid",
  "vitamina c": "ascorbic acid",
  colesterol: "cholesterol",
  testosterona: "testosterone",
  estradiol: "estradiol",
  mentol: "menthol",
  canfora: "camphor",
  capsaicina: "capsaicin",
  vanilina: "vanillin",
  limoneno: "limonene",
  // Biomoléculas
  glicose: "glucose",
  "d-glicose": "D-glucose",
  frutose: "fructose",
  sacarose: "sucrose",
  ureia: "urea",
  glicina: "glycine",
  alanina: "alanine",
  "l-alanina": "L-alanine",
  // Solventes e compostos comuns
  agua: "water",
  "alcool etilico": "ethanol",
  "alcool metilico": "methanol",
  "alcool isopropilico": "isopropanol",
  acetona: "acetone",
  propanona: "acetone",
  formol: "formaldehyde",
  formaldeido: "formaldehyde",
  metanal: "formaldehyde",
  acetaldeido: "acetaldehyde",
  etanal: "acetaldehyde",
  eter: "diethyl ether",
  "eter dietilico": "diethyl ether",
  "eter etilico": "diethyl ether",
  cloroformio: "chloroform",
  triclorometano: "chloroform",
  diclorometano: "dichloromethane",
  "tetracloreto de carbono": "carbon tetrachloride",
  tolueno: "toluene",
  xileno: "xylene",
  "o-xileno": "o-xylene",
  "m-xileno": "m-xylene",
  "p-xileno": "p-xylene",
  naftaleno: "naphthalene",
  antraceno: "anthracene",
  anilina: "aniline",
  fenol: "phenol",
  piridina: "pyridine",
  pirrol: "pyrrole",
  furano: "furan",
  tiofeno: "thiophene",
  "acido formico": "formic acid",
  "acido metanoico": "formic acid",
  "acido acetico": "acetic acid",
  "acido etanoico": "acetic acid",
  "acido latico": "lactic acid",
  "acido lactico": "lactic acid",
  "acido citrico": "citric acid",
  "acido oxalico": "oxalic acid",
  "acido benzoico": "benzoic acid",
  "acido salicilico": "salicylic acid",
  "acido butirico": "butyric acid",
  "acido butanoico": "butanoic acid",
  "acido propionico": "propionic acid",
  "acido tartarico": "tartaric acid",
  "acetato de etila": "ethyl acetate",
  glicerol: "glycerol",
  glicerina: "glycerol",
  "etilenoglicol": "ethylene glycol",
};

/** Minúsculas, sem acentos e com espaços simples (forma usada nas chaves do dicionário). */
export function normalizarNome(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Prefixos de cadeia: em inglês, met-/et- ganham "h" (methane, ethane).
const PREFIXOS: [RegExp, string][] = [
  [/^met(?=[aeiy])/, "meth"],
  [/^et(?=[aeiy])/, "eth"],
  [/^fen/, "phen"],
  [/^ciclo-?ex/, "cyclohex"],
  [/^ciclo/, "cyclo"],
];

function prefixar(termo: string): string {
  let t = termo;
  for (const [re, en] of PREFIXOS) t = t.replace(re, en);
  return t;
}

function traduzirTermo(termo: string): string {
  return prefixar(termo)
    .replace(/ilamin/, "ylamin")
    .replace(/ano$/, "ane")
    .replace(/eno$/, "ene")
    .replace(/ino$/, "yne")
    .replace(/ona$/, "one")
    .replace(/ila$/, "yl")
    .replace(/ina$/, "ine");
}

/**
 * Candidatos em inglês para um nome em português, do mais provável ao menos provável.
 * Ex.: "etanol" → ["ethanol", "etanol"]; "ácido propanoico" → ["propanoic acid", …];
 * "propanoato de metila" → ["methyl propanoate", …].
 */
export function traduzirNome(entrada: string): string[] {
  const n = normalizarNome(entrada);
  if (!n) return [];
  const candidatos: string[] = [];
  const dic = NOMES_PT_EN[n];
  if (dic) candidatos.push(dic);

  const acido = n.match(/^acido (.+)ico$/);
  const ester = n.match(/^(.+)ato de (.+)ila$/);
  if (acido) {
    candidatos.push(`${prefixar(acido[1])}ic acid`);
  } else if (ester) {
    candidatos.push(`${traduzirTermo(`${ester[2]}ila`)} ${prefixar(ester[1])}ate`);
  } else {
    candidatos.push(n.split(" ").map(traduzirTermo).join(" "));
  }
  candidatos.push(n);
  return Array.from(new Set(candidatos));
}
