"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AtomSpec, GLViewer } from "3dmol";
import { ArrowLeft, Atom, ChevronLeft, ChevronRight, Dna, Download, FlaskRound, Link2, Maximize2, Minimize2, PenLine, Ruler, Sparkles, Trash2, X } from "lucide-react";
import { Molecule3DViewer } from "@/components/Molecule3DViewer";
import { COMPLEXOS } from "@/data/complexos";
import { GALERIA, TEMAS_GALERIA, type TemaGaleria } from "@/data/galeria";
import { getCachedByCid } from "@/data/molecules3d";
import { normalizarNome, traduzirNome } from "@/data/nomesQuimicos";
import { fetchCidByName, fetchCidBySmiles, fetchProperties, fetchSdf3D } from "@/services/pubchem";
import { cn } from "@/lib/utils";
import { BuscaMolecula, type EscolhaBusca } from "./BuscaMolecula";
import { EditorMolecula } from "./EditorMolecula";
import { gerarMolecula, type MoleculaGerada } from "./ocl";
import { PainelComplexo } from "./PainelComplexo";
import { cargasGasteiger } from "./cargas";
import { VisualizadorComplexo } from "./VisualizadorComplexo";
import { FichaMolecula, PainelLipinski, SeloFonte, dadosDaMolecula } from "./FichaMolecula";
import { PainelLista, listaDaUrl, useListaAula } from "./ListaDaAula";
import {
  ATOMOS_POR_MEDIDA,
  NOME_MEDIDA,
  calcular,
  centro,
  textoValor,
  type AtomoMedido,
  type Medida,
  type TipoMedida,
} from "./medidas";
import { formulaSubscrita, mesmaRef, refParaTexto, textoParaRef, type MoleculaLab, type RefMolecula } from "./molecula";

type Aba = "ficha" | "medidas" | "lipinski" | "lista" | "galeria";
const ABAS: [Aba, string][] = [
  ["ficha", "Ficha"],
  ["medidas", "Medidas"],
  ["lipinski", "Lipinski"],
  ["lista", "Lista"],
  ["galeria", "Galeria"],
];
const AMARELO = "#FBBF24";

export function LaboratorioMolecular() {
  const [mol, setMol] = useState<MoleculaLab | null>(null);
  const [aba, setAba] = useState<Aba>("ficha");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [projetor, setProjetor] = useState(false);
  const [modo, setModo] = useState<TipoMedida | null>(null);
  const [selecionados, setSelecionados] = useState<AtomoMedido[]>([]);
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const { lista, setLista, editar } = useListaAula();
  const [cargas, setCargas] = useState(false);
  /** undefined: editor fechado; "": desenho novo; SMILES: editar a molécula atual. */
  const [editor, setEditor] = useState<string | undefined>(undefined);
  const listaPorLink = useRef(false);

  const raiz = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<GLViewer | null>(null);
  const pedido = useRef(0);

  // ---------------------------------------------------------------- avisos
  const avisar = useCallback((texto: string) => {
    setAviso(texto);
    window.setTimeout(() => setAviso((a) => (a === texto ? null : a)), 3500);
  }, []);

  // ---------------------------------------------------------------- carregar moléculas
  const enriquecer = useCallback(async (id: number, cid: number, manterNome: boolean) => {
    const [sdfR, propsR] = await Promise.allSettled([fetchSdf3D(cid), fetchProperties(cid)]);
    if (id !== pedido.current) return;
    setMol((c) => {
      if (!c) return c;
      const props = propsR.status === "fulfilled" ? propsR.value : c.props;
      const sdfOk = sdfR.status === "fulfilled";
      const smilesPubChem = props ? (props.SMILES ?? props.IsomericSMILES ?? props.CanonicalSMILES) : undefined;
      return {
        ...c,
        cid,
        props,
        nome: manterNome ? c.nome : (props?.Title ?? c.nome),
        sdf: sdfOk ? sdfR.value : c.sdf,
        origemSdf: sdfOk ? { tipo: "pubchem", cid } : c.origemSdf,
        smiles2D: c.local ? c.smiles2D : (smilesPubChem ?? c.smiles2D),
        consultando: false,
        aviso:
          !sdfOk && !c.sdf
            ? "O PubChem não tem modelo 3D deste composto (comum em sais, misturas e moléculas muito grandes). A fórmula 2D e a ficha continuam disponíveis."
            : !props && !c.local && !c.calculado
              ? "PubChem indisponível no momento: tente de novo em instantes."
              : undefined,
      };
    });
  }, []);

  const carregar = useCallback(
    async (ref: RefMolecula, nomePreferido?: string) => {
      const id = ++pedido.current;
      setMedidas([]);
      setSelecionados([]);
      if (ref.tipo === "pdb") {
        const c = COMPLEXOS.find((x) => x.id === ref.id);
        if (!c) return avisar("Complexo não encontrado.");
        setModo(null);
        setMol({ ref, nome: `${c.farmaco} · ${c.alvo}`, consultando: false });
        return;
      }
      if (ref.tipo === "galeria") {
        const g = GALERIA.find((x) => x.chave === ref.chave);
        if (!g) return avisar("Molécula não encontrada na galeria.");
        setMol({ ref, nome: g.nome, sdf: g.sdf, origemSdf: { tipo: "local" }, smiles2D: g.smiles, local: g, consultando: true });
        try {
          const cid = await fetchCidBySmiles(g.smilesIsomerico);
          if (id === pedido.current) await enriquecer(id, cid, true);
        } catch {
          if (id === pedido.current) setMol((c) => (c ? { ...c, consultando: false } : c));
        }
        return;
      }
      if (ref.tipo === "cid") {
        const cache = getCachedByCid(ref.cid);
        setMol({
          ref,
          nome: nomePreferido ?? cache?.nome ?? `CID ${ref.cid}`,
          cid: ref.cid,
          sdf: cache?.sdf,
          origemSdf: cache ? { tipo: "local" } : undefined,
          consultando: true,
        });
        await enriquecer(id, ref.cid, Boolean(nomePreferido || cache));
        return;
      }
      // SMILES (link ou desenho): 3D e dados calculados no navegador; depois, o PubChem se o conhecer.
      setMol({ ref, nome: nomePreferido ?? "Molécula desenhada", smiles2D: ref.smiles, consultando: true });
      try {
        const g = await gerarMolecula(ref.smiles);
        if (id !== pedido.current) return;
        setMol((c) => (c ? { ...c, sdf: g.molfile, origemSdf: undefined, smiles2D: g.smilesKekule, calculado: g.calculado } : c));
      } catch (e) {
        if (id === pedido.current)
          setMol((c) => (c ? { ...c, aviso: e instanceof Error ? e.message : "SMILES inválido: confira a estrutura." } : c));
      }
      await identificarNoPubChem(id, ref.smiles, Boolean(nomePreferido));
    },
    [avisar, enriquecer], // eslint-disable-line react-hooks/exhaustive-deps
  );

  /** Procura a estrutura no PubChem; se existir, passa aos dados oficiais. */
  const identificarNoPubChem = useCallback(
    async (id: number, smiles: string, manterNome: boolean) => {
      try {
        const cid = await fetchCidBySmiles(smiles);
        if (id === pedido.current) await enriquecer(id, cid, manterNome);
      } catch {
        if (id === pedido.current)
          setMol((c) =>
            c
              ? {
                  ...c,
                  consultando: false,
                  aviso: c.sdf ? "Estrutura não encontrada no PubChem: 3D e dados calculados no navegador." : c.aviso,
                }
              : c,
          );
      }
    },
    [enriquecer],
  );

  const aoGerar = useCallback(
    (g: MoleculaGerada) => {
      const id = ++pedido.current;
      setEditor(undefined);
      setAba("ficha");
      setMol({
        ref: { tipo: "smiles", smiles: g.smiles },
        nome: "Molécula desenhada",
        sdf: g.molfile,
        smiles2D: g.smilesKekule,
        calculado: g.calculado,
        consultando: true,
      });
      void identificarNoPubChem(id, g.smiles, false);
    },
    [identificarNoPubChem],
  );

  const resolverNome = useCallback(
    async (texto: string, alternativas: string[] = []) => {
      const n = normalizarNome(texto);
      const g = GALERIA.find(
        (x) => normalizarNome(x.nome.replace(/\s*\(.*\)$/, "")) === n || x.nomeEn.toLowerCase() === n || x.chave === n.replace(/ /g, "-"),
      );
      if (g) return carregar({ tipo: "galeria", chave: g.chave });
      setOcupado(true);
      try {
        for (const candidato of Array.from(new Set([...traduzirNome(texto), ...alternativas]))) {
          try {
            const cid = await fetchCidByName(candidato);
            const emPortugues = candidato !== texto.trim() && candidato !== n && !alternativas.includes(candidato);
            await carregar({ tipo: "cid", cid }, emPortugues ? texto.trim().replace(/^./, (c) => c.toUpperCase()) : undefined);
            return;
          } catch {
            /* tenta o próximo candidato */
          }
        }
        avisar(`Não encontrei “${texto}” no PubChem. Tente o nome em inglês, o SMILES ou o número CID.`);
      } finally {
        setOcupado(false);
      }
    },
    [avisar, carregar],
  );

  const escolher = useCallback(
    (e: EscolhaBusca) => {
      if ("ref" in e) void carregar(e.ref);
      else void resolverNome(e.nome, e.alternativas);
      setAba("ficha");
    },
    [carregar, resolverNome],
  );

  // Abre o que veio no link: ?lista=…, ?m=g:aspirina, ?cid=2244 ou ?smiles=…; senão, a aspirina.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const recebida = listaDaUrl(p);
    if (recebida) {
      listaPorLink.current = true;
      setLista(recebida);
      setAba("lista");
      void carregar(recebida.itens[0].ref);
      return;
    }
    const pdb = p.get("pdb");
    const m = pdb ? `p:${pdb}` : p.get("m");
    const ref: RefMolecula | null = m
      ? textoParaRef(m)
      : p.get("cid") && /^\d+$/.test(p.get("cid")!)
        ? { tipo: "cid", cid: Number(p.get("cid")) }
        : p.get("smiles")
          ? { tipo: "smiles", smiles: p.get("smiles")! }
          : null;
    void carregar(ref ?? { tipo: "galeria", chave: "aspirina" });
  }, [carregar, setLista]);

  // O endereço acompanha a molécula aberta (copiar a barra de endereço também compartilha).
  useEffect(() => {
    if (!mol || listaPorLink.current) return;
    window.history.replaceState(null, "", `/laboratorio?m=${encodeURIComponent(refParaTexto(mol.ref))}`);
  }, [mol?.ref]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nova geometria (ex.: a do PubChem substituindo a local) muda os índices: medições recomeçam.
  useEffect(() => {
    setMedidas([]);
    setSelecionados([]);
  }, [mol?.sdf]);

  // ---------------------------------------------------------------- medições no 3D
  const medidasRef = useRef<Medida[]>([]);
  medidasRef.current = medidas;
  const selRef = useRef<AtomoMedido[]>([]);
  selRef.current = selecionados;

  const desenharMedidas = useCallback((v: GLViewer) => {
    for (const a of selRef.current) v.addSphere({ center: a, radius: 0.42, color: AMARELO, opacity: 0.55 });
    for (const md of medidasRef.current) {
      for (let i = 0; i < md.atomos.length - 1; i++) {
        v.addCylinder({ start: md.atomos[i], end: md.atomos[i + 1], radius: 0.045, color: AMARELO, dashed: true, fromCap: 1, toCap: 1 });
      }
      v.addLabel(textoValor(md), {
        position: centro(md.atomos),
        backgroundColor: "#0B0F19",
        backgroundOpacity: 0.85,
        fontColor: AMARELO,
        borderColor: AMARELO,
        borderThickness: 1,
        fontSize: 14,
        font: "JetBrains Mono, monospace",
        inFront: true,
        alignment: "center",
      });
    }
  }, []);

  // Mapa de cargas: Gasteiger calculado da estrutura exibida, projetado na superfície de van der Waals.
  const cargasRef = useRef(false);
  cargasRef.current = cargas;
  const desenharCargas = useCallback((v: GLViewer) => {
    const atomos = v.selectedAtoms({});
    const pos = new Map(atomos.map((a, i) => [a.index, i]));
    const q = cargasGasteiger(
      atomos.map((a) => ({
        elem: a.elem ?? "C",
        ligacoes: (a.bonds ?? []).map((b) => pos.get(b) ?? -1).filter((b) => b >= 0),
        ordens: a.bondOrder ?? [],
        cargaFormal: (a as { formalCharge?: number }).formalCharge ?? 0,
      })),
    );
    atomos.forEach((a, i) => {
      a.properties = { ...(a.properties ?? {}), partialCharge: q[i] };
    });
    v.addSurface(1, { opacity: 0.9, colorscheme: { prop: "partialCharge", gradient: "rwb", min: -0.4, max: 0.4 } as never });
  }, []);
  const extras = useCallback(
    (v: GLViewer) => {
      desenharMedidas(v);
      if (cargasRef.current) desenharCargas(v);
    },
    [desenharMedidas, desenharCargas],
  );
  useEffect(() => {
    const v = viewerRef.current;
    if (!v || emComplexo.current) return;
    v.removeAllSurfaces();
    if (cargas) desenharCargas(v);
    v.render();
  }, [cargas, desenharCargas]);

  const emComplexo = useRef(false);
  emComplexo.current = mol?.ref.tipo === "pdb";
  const redesenhar = useCallback(() => {
    const v = viewerRef.current;
    // No complexo, as formas e rótulos (ligações de H) são do VisualizadorComplexo.
    if (!v || emComplexo.current) return;
    v.removeAllShapes();
    v.removeAllLabels();
    desenharMedidas(v);
    v.render();
  }, [desenharMedidas]);

  useEffect(redesenhar, [medidas, selecionados, redesenhar]);

  const modoRef = useRef<TipoMedida | null>(null);
  modoRef.current = modo;
  const aoClicarAtomo = useCallback((atom: AtomSpec) => {
    const tipo = modoRef.current;
    if (!tipo || atom.index === undefined) return;
    const novo: AtomoMedido = { indice: atom.index, rotulo: `${atom.elem ?? "?"}${atom.index + 1}`, x: atom.x ?? 0, y: atom.y ?? 0, z: atom.z ?? 0 };
    const sel = selRef.current;
    if (sel.length && sel[sel.length - 1].indice === novo.indice) return;
    const proximos = [...sel, novo];
    if (proximos.length < ATOMOS_POR_MEDIDA[tipo]) return setSelecionados(proximos);
    setSelecionados([]);
    setMedidas((ms) => [...ms, { tipo, atomos: proximos, valor: calcular(tipo, proximos) }]);
  }, []);

  const tornarClicavel = useCallback(
    (v: GLViewer) => {
      v.setClickable({}, true, (atom: AtomSpec) => aoClicarAtomo(atom));
      v.render(); // o 3Dmol só passa a detectar cliques nos átomos depois de renderizar de novo
    },
    [aoClicarAtomo],
  );

  const escolherModo = (t: TipoMedida) => {
    setModo((m) => (m === t ? null : t));
    setSelecionados([]);
    setAba("medidas");
  };

  // ---------------------------------------------------------------- ferramentas
  const copiar = useCallback(
    async (url: string) => {
      try {
        await navigator.clipboard.writeText(url);
        avisar("Link copiado: é só colar no grupo da turma.");
      } catch {
        window.prompt("Copie o link:", url);
      }
    },
    [avisar],
  );

  const exportarPng = () => {
    const v = viewerRef.current;
    if (!v || !mol) return;
    const a = document.createElement("a");
    a.href = v.pngURI();
    a.download = `${normalizarNome(mol.nome).replace(/[^a-z0-9]+/g, "-")}.png`;
    a.click();
  };

  const alternarProjetor = useCallback(async () => {
    if (!projetor) {
      setProjetor(true);
      try {
        // A tela cheia vai para a página inteira: o modo projetor troca a árvore de componentes.
        await document.documentElement.requestFullscreen?.();
      } catch {
        /* sem tela cheia nativa (ex.: iPhone): o modo projetor ocupa a janela */
      }
    } else {
      setProjetor(false);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
    }
  }, [projetor]);

  useEffect(() => {
    const sair = () => !document.fullscreenElement && setProjetor(false);
    document.addEventListener("fullscreenchange", sair);
    return () => document.removeEventListener("fullscreenchange", sair);
  }, []);

  // Lista da Aula: posição atual e navegação (setas do teclado no projetor).
  const posicao = mol ? lista.itens.findIndex((i) => mesmaRef(i.ref, mol.ref)) : -1;
  const irPara = useCallback(
    (i: number) => {
      const item = lista.itens[i];
      if (item) void carregar(item.ref, item.nome);
    },
    [lista.itens, carregar],
  );

  useEffect(() => {
    if (!projetor) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") irPara(posicao < 0 ? 0 : Math.min(lista.itens.length - 1, posicao + 1));
      if (e.key === "ArrowLeft" || e.key === "PageUp") irPara(Math.max(0, posicao - 1));
      if (e.key === "Escape" && !document.fullscreenElement) setProjetor(false);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [projetor, posicao, lista.itens.length, irPara]);

  const apresentar = () => {
    if (!lista.itens.length) return;
    if (posicao < 0) irPara(0);
    void alternarProjetor();
  };

  // ---------------------------------------------------------------- interface
  const d = mol ? dadosDaMolecula(mol) : null;
  const complexo = mol?.ref.tipo === "pdb" ? (COMPLEXOS.find((c) => mol.ref.tipo === "pdb" && c.id === mol.ref.id) ?? null) : null;
  const smilesAtual = mol && !complexo ? (mol.ref.tipo === "smiles" ? mol.ref.smiles : (mol.local?.smilesIsomerico ?? d?.smiles)) : undefined;
  // Complexo do PDB com o fármaco aberto (pela galeria ou pelo nome).
  const noAlvo = mol && !complexo
    ? COMPLEXOS.find((c) => (mol.ref.tipo === "galeria" && c.galeria === mol.ref.chave) || normalizarNome(c.farmaco) === normalizarNome(mol.nome))
    : undefined;
  const abrirFarmacoDoComplexo = (c: (typeof COMPLEXOS)[number]) => {
    if (c.galeria) void carregar({ tipo: "galeria", chave: c.galeria });
    else void resolverNome(c.farmaco);
  };
  const ferramentas = (
    <div className="flex flex-wrap items-center gap-1.5">
      {!complexo && (["distancia", "angulo", "torcao"] as TipoMedida[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => escolherModo(t)}
          aria-pressed={modo === t}
          className={cn("btn-ghost !px-2.5 !py-1.5 text-xs", modo === t && "!border-amber-500 bg-amber-400/15 text-amber-700 dark:text-amber-400")}
        >
          <Ruler className="h-3.5 w-3.5" /> {t === "distancia" ? "Distância" : t === "angulo" ? "Ângulo" : "Torção"}
        </button>
      ))}
      {!complexo && (
        <button
          type="button"
          onClick={() => setCargas((c) => !c)}
          aria-pressed={cargas}
          className={cn("btn-ghost !px-2.5 !py-1.5 text-xs", cargas && "!border-chem-orbital bg-chem-orbital/15 text-chem-orbital")}
          title="Superfície colorida pelas cargas parciais (Gasteiger)"
        >
          <Atom className="h-3.5 w-3.5" /> Cargas
        </button>
      )}
      {!complexo && <span className="mx-1 hidden h-5 w-px bg-ui-border/30 sm:block" />}
      <button type="button" onClick={alternarProjetor} className="btn-ghost !px-2.5 !py-1.5 text-xs">
        {projetor ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />} {projetor ? "Sair" : "Projetor"}
      </button>
      {!projetor && (
        <>
          <button
            type="button"
            onClick={() => mol && copiar(`${window.location.origin}/laboratorio?m=${encodeURIComponent(refParaTexto(mol.ref))}`)}
            className="btn-ghost !px-2.5 !py-1.5 text-xs"
          >
            <Link2 className="h-3.5 w-3.5" /> Link
          </button>
          <button type="button" onClick={exportarPng} className="btn-ghost !px-2.5 !py-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> PNG
          </button>
        </>
      )}
    </div>
  );

  const visualizador = (
    <div className={cn("relative overflow-hidden rounded-2xl", projetor ? "h-full" : "h-[52vh] min-h-[340px] lg:h-[calc(100vh-13rem)] lg:min-h-[520px]")}>
      {complexo ? (
        <VisualizadorComplexo c={complexo} className="absolute inset-0" onViewerReady={(v) => (viewerRef.current = v)} />
      ) : mol?.sdf ? (
        <Molecule3DViewer
          sdf={mol.sdf}
          origemSdf={mol.origemSdf}
          transparent={false}
          spin={false}
          linkLaboratorio={false}
          className="absolute inset-0"
          onViewerReady={(v) => {
            viewerRef.current = v;
            tornarClicavel(v);
          }}
          onCarregado={() => viewerRef.current && tornarClicavel(viewerRef.current)}
          desenharExtras={extras}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-[var(--viewer)] p-6 text-center text-sm text-muted">
          {mol?.consultando ? "Buscando o modelo 3D no PubChem…" : (mol?.aviso ?? "Escolha uma molécula na busca ou na galeria.")}
        </div>
      )}
      {cargas && !complexo && mol?.sdf && (
        <div className="pointer-events-none absolute right-3 top-12 w-48 rounded-lg bg-ui-surface/85 p-2 text-[11px]">
          <p className="mb-1 font-semibold">Cargas parciais (Gasteiger)</p>
          <div className="h-2.5 rounded-full" style={{ background: "linear-gradient(90deg, #ff0000, #ffffff, #0000ff)" }} />
          <div className="mt-0.5 flex justify-between font-mono text-muted">
            <span>δ− −0,4</span>
            <span>0</span>
            <span>+0,4 δ+</span>
          </div>
          <p className="mt-1 leading-snug text-muted">Vermelho: rico em elétrons. Azul: pobre em elétrons. Aproximação qualitativa do potencial eletrostático.</p>
        </div>
      )}
      {modo && (
        <div
          className={cn(
            "pointer-events-none absolute rounded-md bg-amber-400/20 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300",
            projetor ? "left-5 top-40 text-sm" : "left-3 top-3",
          )}
        >
          {NOME_MEDIDA[modo]}: toque em {ATOMOS_POR_MEDIDA[modo]} átomos ({selecionados.length}/{ATOMOS_POR_MEDIDA[modo]})
        </div>
      )}
    </div>
  );

  if (projetor) {
    return (
      <div ref={raiz} className="fixed inset-0 z-50 flex flex-col bg-ui-bg p-3">
        <div className="relative flex-1">
          {visualizador}
          <div className="pointer-events-none absolute left-5 top-5 max-w-[60%]">
            {lista.titulo && <p className="text-sm font-semibold uppercase tracking-widest text-chem-primary">{lista.titulo}</p>}
            <h2 className="text-3xl font-extrabold sm:text-5xl">{mol?.nome}</h2>
            {d && <p className="mt-1 font-mono text-xl text-muted sm:text-2xl">{formulaSubscrita(d.formula)}</p>}
            {complexo && <p className="mt-1 font-mono text-lg text-muted">PDB {complexo.id}</p>}
          </div>
          <div className="absolute bottom-4 left-4 max-w-[40%]">{ferramentas}</div>
          {lista.itens.length > 0 && (
            <div className="glass absolute bottom-4 right-4 flex items-center gap-2 px-2 py-1.5">
              <button type="button" onClick={() => irPara(Math.max(0, posicao - 1))} disabled={posicao <= 0} className="btn-ghost !p-2 disabled:opacity-40" aria-label="Molécula anterior">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="min-w-14 text-center font-mono text-lg">
                {posicao >= 0 ? posicao + 1 : "–"}/{lista.itens.length}
              </span>
              <button
                type="button"
                onClick={() => irPara(posicao < 0 ? 0 : Math.min(lista.itens.length - 1, posicao + 1))}
                disabled={posicao === lista.itens.length - 1}
                className="btn-ghost !p-2 disabled:opacity-40"
                aria-label="Próxima molécula"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={raiz} className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-6">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <Link href="/hub" className="btn-ghost !p-2" aria-label="Voltar ao Hub">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="flex items-center gap-2 text-lg font-bold">
            <FlaskRound className="h-5 w-5 text-chem-primary" /> Laboratório Molecular
          </h1>
        </div>
        <div className="flex items-center gap-2 lg:ml-6 lg:flex-1">
          <BuscaMolecula onEscolher={escolher} ocupado={ocupado || Boolean(mol?.consultando)} />
          <button type="button" onClick={() => setEditor("")} className="btn-primary shrink-0">
            <PenLine className="h-4 w-4" /> <span className="hidden sm:inline">Desenhar</span>
          </button>
        </div>
      </div>

      {editor !== undefined && <EditorMolecula smilesInicial={editor || undefined} onGerado={aoGerar} onFechar={() => setEditor(undefined)} />}

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <section className="glass flex flex-col gap-3 p-3">
          {ferramentas}
          {visualizador}
          {mol?.aviso && mol.sdf && <p className="text-xs text-muted">{mol.aviso}</p>}
        </section>

        <aside className="glass flex flex-col p-3 lg:max-h-[calc(100vh-9rem)]">
          <div className="mb-3 flex gap-1 overflow-x-auto rounded-xl bg-ui-bg/60 p-1" role="tablist">
            {ABAS.filter(([id]) => !complexo || (id !== "medidas" && id !== "lipinski")).map(([id, rotulo]) => (
              <button
                key={id}
                role="tab"
                aria-selected={aba === id}
                onClick={() => setAba(id)}
                className={cn(
                  "flex-1 shrink-0 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-semibold transition",
                  aba === id ? "bg-chem-primary text-lab-background" : "text-muted hover:text-chem-primary",
                )}
              >
                {complexo && id === "ficha" ? "Alvo" : rotulo}
                {id === "medidas" && medidas.length > 0 && ` · ${medidas.length}`}
                {id === "lista" && lista.itens.length > 0 && ` · ${lista.itens.length}`}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {mol && !complexo && aba !== "galeria" && aba !== "lista" && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">{mol.nome}</h2>
                <SeloFonte m={mol} />
              </div>
            )}

            {aba === "ficha" && complexo && <PainelComplexo c={complexo} onAbrirFarmaco={() => abrirFarmacoDoComplexo(complexo)} />}
            {aba === "ficha" && mol && !complexo && (
              <>
                {noAlvo && (
                  <button
                    type="button"
                    onClick={() => void carregar({ tipo: "pdb", id: noAlvo.id })}
                    className="mb-3 flex w-full items-center gap-2 rounded-lg border border-chem-orbital/40 bg-chem-orbital/10 px-3 py-2 text-left text-sm hover:border-chem-orbital"
                  >
                    <Dna className="h-4 w-4 shrink-0 text-chem-orbital" />
                    <span>
                      Ver no alvo biológico: <strong>{noAlvo.alvo}</strong> <span className="font-mono text-xs text-muted">(PDB {noAlvo.id})</span>
                    </span>
                  </button>
                )}
                <FichaMolecula m={mol} />
                {smilesAtual && (
                  <button type="button" onClick={() => setEditor(smilesAtual)} className="btn-ghost mt-3 w-full text-sm">
                    <PenLine className="h-4 w-4" /> Editar esta molécula no desenho
                  </button>
                )}
              </>
            )}
            {aba === "lipinski" && mol && <PainelLipinski m={mol} />}

            {aba === "medidas" && (
              <div className="space-y-3 text-sm">
                <p className="text-muted">
                  Escolha o tipo de medida e toque nos átomos do modelo 3D, na ordem. A medida aparece em amarelo no
                  modelo e na lista abaixo.
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["distancia", "angulo", "torcao"] as TipoMedida[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => escolherModo(t)}
                      className={cn("btn-ghost !px-2 !py-2 text-xs", modo === t && "!border-amber-500 bg-amber-400/15 text-amber-700 dark:text-amber-400")}
                    >
                      {t === "distancia" ? "Distância (2)" : t === "angulo" ? "Ângulo (3)" : "Torção (4)"}
                    </button>
                  ))}
                </div>
                {selecionados.length > 0 && (
                  <p className="font-mono text-xs text-amber-700 dark:text-amber-400">Selecionados: {selecionados.map((a) => a.rotulo).join(" – ")}</p>
                )}
                {medidas.length ? (
                  <ul className="space-y-1.5">
                    {medidas.map((md, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-amber-400/10 px-3 py-2">
                        <span>
                          <span className="block text-xs text-muted">{NOME_MEDIDA[md.tipo]}</span>
                          <span className="font-mono">{md.atomos.map((a) => a.rotulo).join("–")}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">{textoValor(md)}</span>
                          <button type="button" onClick={() => setMedidas((ms) => ms.filter((_, j) => j !== i))} className="text-muted hover:text-chem-danger" aria-label="Remover medida">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg border border-dashed border-ui-border/30 px-3 py-4 text-center text-muted">Nenhuma medida ainda.</p>
                )}
                {medidas.length > 0 && (
                  <button type="button" onClick={() => setMedidas([])} className="flex items-center gap-1.5 text-xs text-muted hover:text-chem-danger">
                    <Trash2 className="h-3.5 w-3.5" /> Limpar medidas
                  </button>
                )}
                <p className="font-mono text-[10.5px] leading-relaxed text-muted">
                  Valores típicos para comparar: ângulos sp³ ≈ 109,5°, sp² ≈ 120°, sp = 180°; C–C ≈ 1,54 Å, C=C ≈ 1,34 Å,
                  C≡C ≈ 1,20 Å, C–H ≈ 1,09 Å (Bruice, Química Orgânica, cap. 1). As medidas vêm da geometria exibida
                  (PubChem ou MMFF94).
                </p>
              </div>
            )}

            {aba === "lista" && (
              <PainelLista
                lista={lista}
                editar={(f) => {
                  listaPorLink.current = false;
                  editar(f);
                }}
                atual={mol?.ref ?? null}
                nomeAtual={mol?.nome ?? ""}
                onAbrir={(ref) => {
                  const item = lista.itens.find((i) => mesmaRef(i.ref, ref));
                  void carregar(ref, item?.nome);
                }}
                onApresentar={apresentar}
                onCopiarLink={copiar}
              />
            )}

            {aba === "galeria" && (
              <div className="space-y-4">
                <div>
                  <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted">
                    <Dna className="h-3 w-3 text-chem-orbital" /> Fármaco no alvo (PDB)
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {COMPLEXOS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          void carregar({ tipo: "pdb", id: c.id });
                          setAba("ficha");
                        }}
                        className={cn(
                          "rounded-lg border px-2.5 py-2 text-left text-xs transition",
                          complexo?.id === c.id ? "border-chem-orbital bg-chem-orbital/10" : "border-ui-border/20 hover:border-chem-orbital/60",
                        )}
                      >
                        <span className="block font-semibold leading-tight">{c.farmaco}</span>
                        <span className="text-[11px] text-muted">{c.alvo}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {(Object.keys(TEMAS_GALERIA) as TemaGaleria[]).map((tema) => (
                  <div key={tema}>
                    <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted">
                      <Sparkles className="h-3 w-3 text-chem-primary" /> {TEMAS_GALERIA[tema]}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {GALERIA.filter((g) => g.tema === tema).map((g) => {
                        const ativa = mol?.ref.tipo === "galeria" && mol.ref.chave === g.chave;
                        return (
                          <button
                            key={g.chave}
                            type="button"
                            onClick={() => {
                              void carregar({ tipo: "galeria", chave: g.chave });
                              setAba("ficha");
                            }}
                            className={cn(
                              "rounded-lg border px-2.5 py-2 text-left text-xs transition",
                              ativa ? "border-chem-primary bg-chem-primary/10" : "border-ui-border/20 hover:border-chem-primary/60",
                            )}
                          >
                            <span className="block font-semibold leading-tight">{g.nome}</span>
                            <span className="font-mono text-[11px] text-muted">{formulaSubscrita(g.formula)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {aviso && (
        <div className="glass-strong fixed bottom-5 left-1/2 z-50 -translate-x-1/2 px-4 py-2.5 text-sm" role="status">
          {aviso}
        </div>
      )}
    </div>
  );
}
