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

export function pubchemCompoundUrl(cid: number): string {
  return `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`;
}
