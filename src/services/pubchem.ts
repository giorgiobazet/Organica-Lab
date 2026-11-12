/**
 * Cliente da PubChem PUG REST API (NIH).
 * Docs: https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest
 *
 * Toda chamada tem timeout e cache em memória. Quando a rede falha, os
 * componentes caem para o cache local em src/data/molecules3d.ts.
 */

const BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
const TIMEOUT_MS = 8000;

export interface PubChemProperties {
  CID: number;
  /** Nome comum do composto no PubChem (ex.: "Aspirin"). */
  Title?: string;
  MolecularFormula: string;
  MolecularWeight: string;
  IUPACName?: string;
  CanonicalSMILES?: string;
  IsomericSMILES?: string;
  SMILES?: string;
  XLogP?: number;
  TPSA?: number;
  HBondDonorCount?: number;
  HBondAcceptorCount?: number;
}

const sdfCache = new Map<number, Promise<string>>();
const propCache = new Map<number, Promise<PubChemProperties>>();

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`PubChem respondeu ${res.status} para ${url}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** Confôrmero 3D oficial (SDF) de um composto pelo CID. */
export function fetchSdf3D(cid: number): Promise<string> {
  const cached = sdfCache.get(cid);
  if (cached) return cached;
  const p = fetchWithTimeout(`${BASE}/compound/cid/${cid}/SDF?record_type=3d`)
    .then((r) => r.text())
    .then((text) => {
      if (!text.includes("V2000") && !text.includes("V3000")) {
        throw new Error(`Resposta SDF inválida para o CID ${cid}`);
      }
      return text;
    });
  sdfCache.set(cid, p);
  p.catch(() => sdfCache.delete(cid));
  return p;
}

/** Propriedades físico-químicas computadas pelo PubChem. */
export function fetchProperties(cid: number): Promise<PubChemProperties> {
  const cached = propCache.get(cid);
  if (cached) return cached;
  const fields = [
    "Title",
    "MolecularFormula",
    "MolecularWeight",
    "IUPACName",
    "IsomericSMILES",
    "XLogP",
    "TPSA",
    "HBondDonorCount",
    "HBondAcceptorCount",
  ].join(",");
  const p = fetchWithTimeout(`${BASE}/compound/cid/${cid}/property/${fields}/JSON`)
    .then((r) => r.json())
    .then((json: { PropertyTable?: { Properties?: PubChemProperties[] } }) => {
      const props = json.PropertyTable?.Properties?.[0];
      if (!props) throw new Error(`Sem propriedades para o CID ${cid}`);
      return props;
    });
  propCache.set(cid, p);
  p.catch(() => propCache.delete(cid));
  return p;
}

/** Resolve um nome (ex.: "ibuprofen") para o primeiro CID correspondente. */
export async function fetchCidByName(name: string): Promise<number> {
  const res = await fetchWithTimeout(
    `${BASE}/compound/name/${encodeURIComponent(name)}/cids/JSON`,
  );
  const json = (await res.json()) as { IdentifierList?: { CID?: number[] } };
  const cid = json.IdentifierList?.CID?.[0];
  if (!cid) throw new Error(`Nenhum CID para "${name}"`);
  return cid;
}

/** Sugestões de nomes do PubChem enquanto o usuário digita (inglês). */
export async function fetchAutocomplete(texto: string, limite = 8): Promise<string[]> {
  const q = texto.trim();
  if (q.length < 2) return [];
  const res = await fetchWithTimeout(
    `https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(q)}/json?limit=${limite}`,
  );
  const json = (await res.json()) as { dictionary_terms?: { compound?: string[] } };
  return json.dictionary_terms?.compound ?? [];
}

/** CID pela estrutura (SMILES isomérico): identifica o estereoisômero certo, ao contrário do nome. */
export async function fetchCidBySmiles(smiles: string): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // POST: SMILES com "/", "#" ou "\\" não cabem com segurança no caminho da URL.
    const res = await fetch(`${BASE}/compound/smiles/cids/JSON`, {
      method: "POST",
      body: new URLSearchParams({ smiles }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`PubChem respondeu ${res.status} para o SMILES ${smiles}`);
    const json = (await res.json()) as { IdentifierList?: { CID?: number[] } };
    const cid = json.IdentifierList?.CID?.[0];
    if (!cid) throw new Error(`Nenhum composto no PubChem para o SMILES ${smiles}`);
    return cid;
  } finally {
    clearTimeout(timer);
  }
}

export function pubchemCompoundUrl(cid: number): string {
  return `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`;
}
