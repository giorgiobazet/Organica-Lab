"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GLViewer } from "3dmol";
import { AnimatePresence, m } from "framer-motion";
import { ArrowRight, CheckCircle2, Compass, Eye, RotateCw, Trophy, XCircle } from "lucide-react";
import { Molecule3DViewer, type AtomHighlight, type AtomLabel } from "@/components/Molecule3DViewer";
import { useAuth } from "@/context/AuthContext";
import { DESAFIOS_RS, PARES_ESTEREO, type DesafioRS, type MoleculaEstereo, type Relacao } from "@/data/estereo";
import { toMolBlock } from "@/lib/molblock";
import { cn } from "@/lib/utils";

const DISCIPLINA = "organica-1";
const JOGO = "desafio-estereoquimica";
const XP_CENTRO = 15;
const XP_PAR = 15;
const XP_CONCLUSAO = 100;
const EXPERIMENTO = { rota: "/organica-1#desafio-estereoquimica", titulo: "Desafio Espacial de Estereoquímica" };
const PRIMARY = "#06B6D4";
const DANGER = "#F43F5E";
const SUCCESS = "#10B981";
const LETRAS = ["a", "b", "c", "d"];

type Feedback = { ok: boolean; texto: string } | null;
type Aba = "rs" | "pares";

function formula(elementos: string[]) {
  const n: Record<string, number> = {};
  elementos.forEach((e) => (n[e] = (n[e] ?? 0) + 1));
  const ordem = ["C", "H", ...Object.keys(n).filter((e) => e !== "C" && e !== "H").sort()];
  const sub = (k: number) => (k === 1 ? "" : String(k).replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[+d]));
  return ordem.filter((e) => n[e]).map((e) => e + sub(n[e])).join("");
}

function sdfDe(m: MoleculaEstereo) {
  return toMolBlock(m.elementos, m.ligacoes, m.coords, m.nome);
}

/** Rotaciona p pelo quaternion q = [x, y, z, w] (convenção do getView do 3Dmol). */
function rotacionar(q: number[], p: number[]) {
  const [x, y, z, w] = q;
  const [px, py, pz] = p;
  const ix = w * px + y * pz - z * py;
  const iy = w * py + z * px - x * pz;
  const iz = w * pz + x * py - y * px;
  const iw = -x * px - y * py - z * pz;
  return [ix * w - iw * x - iy * z + iz * y, iy * w - iw * y - iz * x + ix * z, iz * w - iw * z - ix * y + iy * x];
}

function vetor(m: MoleculaEstereo, de: number, para: number) {
  const c = m.coords;
  const v = [c[3 * para] - c[3 * de], c[3 * para + 1] - c[3 * de + 1], c[3 * para + 2] - c[3 * de + 2]];
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
}

/** Quaternion que gira o vetor unitário u até o vetor unitário `alvo`. */
function quaternionEntre(u: number[], alvo: number[]) {
  const d = u[0] * alvo[0] + u[1] * alvo[1] + u[2] * alvo[2];
  if (d < -0.9999) {
    // 180°: qualquer eixo perpendicular a u
    const eixo = Math.abs(u[0]) < 0.9 ? [0, -u[2], u[1]] : [-u[2], 0, u[0]];
    const n = Math.hypot(...eixo);
    return [eixo[0] / n, eixo[1] / n, eixo[2] / n, 0];
  }
  const eixo = [u[1] * alvo[2] - u[2] * alvo[1], u[2] * alvo[0] - u[0] * alvo[2], u[0] * alvo[1] - u[1] * alvo[0]];
  const q = [eixo[0], eixo[1], eixo[2], 1 + d];
  const n = Math.hypot(...q);
  return q.map((x) => x / n);
}

/** Grupo 4 para trás: (0, 0, −1) aponta para longe do observador. */
const quaternionParaTras = (u: number[]) => quaternionEntre(u, [0, 0, -1]);

/** Posição inicial do desafio: grupo 4 apontando para o aluno, levemente de lado. */
const INICIAL = (() => {
  const v = [0.45, 0.35, 0.82];
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
})();

export default function DesafioEstereoquimica() {
  const [aba, setAba] = useState<Aba>("rs");
  const [rsFeitos, setRsFeitos] = useState<string[]>([]);
  const [paresFeitos, setParesFeitos] = useState<string[]>([]);
  const [bonus, setBonus] = useState(false);
  const { concluirJogo, profile } = useAuth();
  const jaConcluido = profile?.progresso.modulos?.[DISCIPLINA]?.concluidos.includes(JOGO) ?? false;

  useEffect(() => {
    if (rsFeitos.length === DESAFIOS_RS.length && paresFeitos.length === PARES_ESTEREO.length && !jaConcluido) {
      void concluirJogo(DISCIPLINA, JOGO, XP_CONCLUSAO).then((p) => p && setBonus(true));
    }
  }, [rsFeitos, paresFeitos, jaConcluido, concluirJogo]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-slate-200/60 p-1 dark:bg-ui-bg/60" role="tablist">
          {(
            [
              ["rs", `Configuração R/S · ${rsFeitos.length}/${DESAFIOS_RS.length}`],
              ["pares", `Relação entre pares · ${paresFeitos.length}/${PARES_ESTEREO.length}`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={aba === id}
              onClick={() => setAba(id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                aba === id ? "bg-chem-primary text-lab-background" : "text-muted hover:text-chem-primary",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {(jaConcluido || bonus) && (
          <span className="chip bg-chem-success/15 text-chem-success">
            <Trophy className="h-3.5 w-3.5" /> Jogo concluído{bonus ? ` · +${XP_CONCLUSAO} XP` : ""}
          </span>
        )}
      </div>
      {aba === "rs" ? (
        <ModoRS feitos={rsFeitos} onFeito={(k) => setRsFeitos((f) => (f.includes(k) ? f : [...f, k]))} />
      ) : (
        <ModoPares feitos={paresFeitos} onFeito={(k) => setParesFeitos((f) => (f.includes(k) ? f : [...f, k]))} />
      )}
    </div>
  );
}

function FeedbackBox({ fb }: { fb: Feedback }) {
  return (
    <AnimatePresence mode="wait">
      {fb && (
        <m.p
          key={fb.texto}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          role="status"
          className={cn("flex items-start gap-2 rounded-lg px-3 py-2 text-sm", fb.ok ? "bg-chem-success/10 text-chem-success" : "bg-chem-danger/10 text-chem-danger")}
        >
          {fb.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          {fb.texto}
        </m.p>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Modo R/S
// ---------------------------------------------------------------------------

function ModoRS({ feitos, onFeito }: { feitos: string[]; onFeito: (k: string) => void }) {
  const [idx, setIdx] = useState(0);
  const mol = DESAFIOS_RS[idx];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {DESAFIOS_RS.map((m, i) => (
          <button
            key={m.key}
            onClick={() => setIdx(i)}
            className={cn("chip px-3 py-1.5 text-sm", i === idx ? "bg-chem-primary text-lab-background" : "bg-slate-200/70 text-muted dark:bg-white/5")}
          >
            {feitos.includes(m.key) && <CheckCircle2 className="h-3.5 w-3.5" />}
            {m.nome}
          </button>
        ))}
      </div>
      <PainelRS
        key={mol.key}
        mol={mol}
        onFeito={() => onFeito(mol.key)}
        onProximo={idx < DESAFIOS_RS.length - 1 ? () => setIdx(idx + 1) : undefined}
      />
    </div>
  );
}

type EtapaRS = "prioridade" | "orientacao" | "rotulo" | "feito";

function PainelRS({ mol, onFeito, onProximo }: { mol: DesafioRS; onFeito: () => void; onProximo?: () => void }) {
  const { addXp } = useAuth();
  const [ci, setCi] = useState(0); // índice do estereocentro atual
  const [etapa, setEtapa] = useState<EtapaRS>("prioridade");
  const [prior, setPrior] = useState<(number | null)[]>([null, null, null, null]);
  const [erradas, setErradas] = useState<number[]>([]);
  const [fb, setFb] = useState<Feedback>(null);
  const viewerRef = useRef<GLViewer | null>(null);
  const sdf = useMemo(() => sdfDe(mol), [mol]);
  const centro = mol.centros[ci];
  const multiplos = mol.centros.length > 1;

  // Ordem embaralhada (fixa por centro) dos vizinhos rotulados a, b, c, d.
  const vizinhos = useMemo(() => {
    const v = [...centro.prioridades];
    let seed = centro.atom * 7 + mol.key.length;
    for (let i = v.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = Math.floor((seed / 233280) * (i + 1));
      [v[i], v[j]] = [v[j], v[i]];
    }
    return v;
  }, [centro, mol.key]);

  const prioridadeCerta = (k: number) => centro.prioridades.indexOf(vizinhos[k]) + 1;
  const mostrarNumeros = etapa !== "prioridade";

  const labels: AtomLabel[] = [
    ...mol.centros.map((c, i) => ({
      atom: c.atom,
      text: i < ci || etapa === "feito" && i === ci ? `C* ${c.label}` : multiplos ? `C*${i + 1}` : "C*",
      color: i === ci && etapa !== "feito" ? PRIMARY : SUCCESS,
    })),
    ...(etapa === "feito"
      ? []
      : vizinhos.map((a, k) => ({
          atom: a,
          text: mostrarNumeros ? String(prioridadeCerta(k)) : LETRAS[k],
          color: erradas.includes(k) ? DANGER : mostrarNumeros && prioridadeCerta(k) === 4 ? "#C4B5FD" : undefined,
        }))),
  ];
  const highlight: AtomHighlight[] =
    etapa === "feito"
      ? [{ atoms: mol.centros.map((c) => c.atom), color: SUCCESS, scale: 1.1 }]
      : [
          { atoms: [centro.atom], color: PRIMARY, scale: 1.1 },
          ...(etapa !== "prioridade" ? [{ atoms: [centro.prioridades[3]], color: "#8B5CF6", scale: 0.9 }] : []),
        ];

  const [viewerPronto, setViewerPronto] = useState(false);
  const onViewer = useCallback((v: GLViewer) => {
    viewerRef.current = v;
    setViewerPronto(true);
  }, []);

  // Cada estereocentro começa com o grupo 4 virado para o aluno: girar é parte do desafio.
  useEffect(() => {
    if (!viewerPronto) return;
    const id = setTimeout(() => {
      const v = viewerRef.current;
      if (!v) return;
      const view = v.getView();
      const q = quaternionEntre(vetor(mol, centro.atom, centro.prioridades[3]), INICIAL);
      v.setView([view[0], view[1], view[2], view[3], q[0], q[1], q[2], q[3]]);
      v.render();
    }, 120);
    return () => clearTimeout(id);
  }, [viewerPronto, mol, centro]);

  const grupo4ParaTras = () => {
    const v = viewerRef.current;
    if (!v) return { ok: false, z: 0 };
    const view = v.getView();
    const u = vetor(mol, centro.atom, centro.prioridades[3]);
    const [, , z] = rotacionar([view[4], view[5], view[6], view[7]], u);
    return { ok: z < -0.75, z };
  };

  const verificarPrioridades = () => {
    if (prior.some((p) => p === null)) return setFb({ ok: false, texto: "Dê uma prioridade (1 a 4) para cada grupo a, b, c, d." });
    if (new Set(prior).size !== 4) return setFb({ ok: false, texto: "Cada prioridade de 1 a 4 deve ser usada uma única vez." });
    const erros = [0, 1, 2, 3].filter((k) => prior[k] !== prioridadeCerta(k));
    setErradas(erros);
    if (erros.length) {
      return setFb({
        ok: false,
        texto: `Revise ${erros.map((k) => LETRAS[k]).join(", ")}. Regra CIP: maior número atômico no primeiro átomo vence; em empate, compare o conjunto de átomos ligados a seguir (ligação dupla conta como duplicada).`,
      });
    }
    setFb({ ok: true, texto: "Prioridades corretas! Agora gire a molécula até o grupo 4 (em violeta) apontar para trás da tela." });
    setEtapa("orientacao");
  };

  const conferirOrientacao = () => {
    const { ok } = grupo4ParaTras();
    if (!ok) return setFb({ ok: false, texto: "O grupo 4 ainda não está para trás. Arraste a molécula até o rótulo 4 ficar escondido atrás do C*." });
    setFb({ ok: true, texto: "Orientação perfeita! Agora siga 1 → 2 → 3: o sentido é horário ou anti-horário?" });
    setEtapa("rotulo");
  };

  const orientarParaMim = () => {
    const v = viewerRef.current;
    if (!v) return;
    const view = v.getView();
    const q = quaternionParaTras(vetor(mol, centro.atom, centro.prioridades[3]));
    v.setView([view[0], view[1], view[2], view[3], q[0], q[1], q[2], q[3]]);
    v.render();
    setFb({ ok: true, texto: "Pronto: o grupo 4 agora aponta para trás. Siga 1 → 2 → 3." });
    setEtapa("rotulo");
  };

  const responder = (r: "R" | "S") => {
    if (r !== centro.label) {
      return setFb({ ok: false, texto: `Não é ${r}. Com o grupo 4 para trás, horário (para a direita) = R (rectus); anti-horário = S (sinister).` });
    }
    void addXp(XP_CENTRO, EXPERIMENTO);
    if (ci < mol.centros.length - 1) {
      setFb({ ok: true, texto: `Centro ${ci + 1} é ${r}! +${XP_CENTRO} XP. Agora o próximo estereocentro.` });
      setCi(ci + 1);
      setPrior([null, null, null, null]);
      setErradas([]);
      setEtapa("prioridade");
      return;
    }
    const desc = mol.centros.map((c) => c.label).join(",");
    setFb({ ok: true, texto: `Correto: (${desc})! ${mol.contexto} +${XP_CENTRO} XP` });
    setEtapa("feito");
    onFeito();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="glass flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 pb-0">
          <div>
            <p className="font-semibold">{mol.nome}</p>
            <p className="font-mono text-xs text-muted">{formula(mol.elementos)}</p>
          </div>
          <span className="flex items-center gap-1 text-xs text-muted">
            <RotateCw className="h-3.5 w-3.5" /> arraste para girar
          </span>
        </div>
        <div className="relative min-h-[380px] flex-1">
          <Molecule3DViewer
            sdf={sdf}
            spin={false}
            transparent={false}
            zoom={1.5}
            labels={labels}
            highlight={highlight}
            onViewerReady={onViewer}
            className="absolute inset-0"
          />
        </div>
      </div>

      <div className="glass space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {multiplos ? `Estereocentro ${ci + 1} de ${mol.centros.length}` : "Estereocentro"}
        </p>

        {etapa === "prioridade" && (
          <>
            <p className="text-sm font-semibold">1 · Ordene os grupos ligados ao C* pelas regras de Cahn-Ingold-Prelog</p>
            <div className="space-y-2">
              {LETRAS.map((l, k) => (
                <div key={l} className="flex items-center gap-3">
                  <span className={cn("w-8 font-mono text-sm font-semibold", erradas.includes(k) && "text-chem-danger")}>{l}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((p) => (
                      <button
                        key={p}
                        onClick={() => setPrior((arr) => arr.map((x, i) => (i === k ? p : x === p ? null : x)))}
                        className={cn(
                          "w-10 rounded-md py-1 font-mono text-sm transition",
                          prior[k] === p ? "bg-chem-primary text-lab-background" : "bg-slate-200/70 text-muted hover:text-chem-primary dark:bg-white/5",
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <span className="font-mono text-xs text-muted">{mol.elementos[vizinhos[k]]}</span>
                </div>
              ))}
            </div>
            <button className="btn-primary w-full" onClick={verificarPrioridades}>
              Verificar prioridades
            </button>
          </>
        )}

        {etapa === "orientacao" && (
          <>
            <p className="text-sm font-semibold">2 · Gire a molécula até o grupo 4 apontar para trás</p>
            <p className="text-sm text-muted">O grupo de menor prioridade (rótulo 4, halo violeta) precisa ficar atrás do C*, longe de você.</p>
            <button className="btn-primary w-full" onClick={conferirOrientacao}>
              <Compass className="h-4 w-4" /> Conferir orientação
            </button>
            <button className="btn-ghost w-full" onClick={orientarParaMim}>
              <Eye className="h-4 w-4" /> Orientar para mim
            </button>
          </>
        )}

        {etapa === "rotulo" && (
          <>
            <p className="text-sm font-semibold">3 · Seguindo 1 → 2 → 3, qual é a configuração?</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost py-4 text-base" onClick={() => responder("R")}>
                <RotateCw className="h-5 w-5" /> R (horário)
              </button>
              <button className="btn-ghost py-4 text-base" onClick={() => responder("S")}>
                <RotateCw className="h-5 w-5 -scale-x-100" /> S (anti-horário)
              </button>
            </div>
          </>
        )}

        {etapa === "feito" && onProximo && (
          <button className="btn-primary w-full" onClick={onProximo}>
            Próxima molécula <ArrowRight className="h-4 w-4" />
          </button>
        )}

        <FeedbackBox fb={fb} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modo pares
// ---------------------------------------------------------------------------

const OPCOES: { id: Relacao; label: string }[] = [
  { id: "enantiomeros", label: "Enantiômeros" },
  { id: "diastereoisomeros", label: "Diastereoisômeros" },
  { id: "identicos", label: "Idênticos (composto meso)" },
  { id: "constitucionais", label: "Isômeros constitucionais" },
];

function ModoPares({ feitos, onFeito }: { feitos: string[]; onFeito: (k: string) => void }) {
  const { addXp } = useAuth();
  const [idx, setIdx] = useState(0);
  const [fb, setFb] = useState<Feedback>(null);
  const par = PARES_ESTEREO[idx];
  const resolvido = feitos.includes(par.key);
  const sdfA = useMemo(() => sdfDe(par.a), [par]);
  const sdfB = useMemo(() => sdfDe(par.b), [par]);

  const responder = (r: Relacao) => {
    if (r !== par.relacao) {
      const dica =
        par.relacao === "constitucionais"
          ? "Confira primeiro a conectividade: os átomos estão ligados na mesma sequência?"
          : "Mesma conectividade. Compare a configuração de cada estereocentro e procure planos de simetria.";
      return setFb({ ok: false, texto: `Ainda não. ${dica}` });
    }
    if (!resolvido) {
      void addXp(XP_PAR, EXPERIMENTO);
      onFeito(par.key);
    }
    setFb({ ok: true, texto: `${OPCOES.find((o) => o.id === r)!.label}! ${par.explicacao}${resolvido ? "" : ` +${XP_PAR} XP`}` });
  };

  const ir = (i: number) => {
    setIdx(i);
    setFb(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {PARES_ESTEREO.map((p, i) => (
          <button
            key={p.key}
            onClick={() => ir(i)}
            className={cn("chip px-3 py-1.5 font-mono text-sm", i === idx ? "bg-chem-primary text-lab-background" : "bg-slate-200/70 text-muted dark:bg-white/5")}
          >
            {feitos.includes(p.key) && <CheckCircle2 className="h-3.5 w-3.5" />}
            Par {i + 1}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { m: par.a, sdf: sdfA, tag: "A" },
          { m: par.b, sdf: sdfB, tag: "B" },
        ].map(({ m, sdf, tag }) => (
          <div key={tag} className="glass flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 pb-0">
              <p className="font-semibold">
                Molécula {tag}
                {resolvido && <span className="ml-2 text-sm font-normal text-muted">· {m.nome}</span>}
              </p>
              <span className="font-mono text-xs text-muted">{formula(m.elementos)}</span>
            </div>
            <div className="relative h-[300px]">
              <Molecule3DViewer
                key={`${par.key}-${tag}`}
                sdf={sdf}
                spin={false}
                transparent={false}
                zoom={1.35}
                highlight={resolvido ? [{ atoms: m.centros.map((c) => c.atom), color: SUCCESS }] : []}
                labels={resolvido ? m.centros.map((c) => ({ atom: c.atom, text: c.label, color: "#6EE7B7" })) : []}
                className="absolute inset-0"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="glass space-y-3 p-4">
        <p className="text-sm font-semibold">Qual é a relação entre A e B? Gire as duas moléculas para comparar.</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {OPCOES.map((o) => (
            <button key={o.id} className="btn-ghost" onClick={() => responder(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
        <FeedbackBox fb={fb} />
        {resolvido && idx < PARES_ESTEREO.length - 1 && (
          <button className="btn-primary w-full" onClick={() => ir(idx + 1)}>
            Próximo par <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
