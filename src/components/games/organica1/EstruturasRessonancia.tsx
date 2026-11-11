"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ArrowRight, CheckCircle2, Repeat, Sparkles, Trophy, XCircle } from "lucide-react";
import { Molecule3DViewer, type AtomHighlight, type AtomLabel } from "@/components/Molecule3DViewer";
import { useAuth } from "@/context/AuthContext";
import { IONS_RESONANCIA, type Hibridizacao, type IonResonancia } from "@/data/resonancia";
import { toMolBlock } from "@/lib/molblock";
import { cn } from "@/lib/utils";

const DISCIPLINA = "organica-1";
const JOGO = "estruturas-ressonancia";
const XP_ETAPA = 10;
const XP_CONCLUSAO = 100;
const ORBITAL = "#8B5CF6";
const DANGER = "#F43F5E";
const EXPERIMENTO = { rota: "/organica-1#estruturas-ressonancia", titulo: "Estruturas, Carga Formal e Ressonância" };

type Etapa = "hibridizacao" | "carga" | "hibrido" | "concluido";
type Vista = 0 | 1 | "hibrido";
type Feedback = { ok: boolean; texto: string } | null;

const sinal = (c: number) => (c > 0 ? `+${c}` : c < 0 ? `−${Math.abs(c)}` : "0");
const sobrescrito = (c: number) => (c === 1 ? "⁺" : c === -1 ? "⁻" : "");

/** Átomos pesados cuja carga muda entre os contribuintes: é onde a carga se deslocaliza. */
function deslocalizados(ion: IonResonancia) {
  const [a, b] = ion.contribuintes;
  return ion.pesados.filter((i) => a.cargas[i] !== b.cargas[i]);
}

export default function EstruturasRessonancia() {
  const { concluirJogo, profile } = useAuth();
  const [idx, setIdx] = useState(0);
  const [completos, setCompletos] = useState<string[]>([]);
  const [bonus, setBonus] = useState(false);
  const jaConcluido = profile?.progresso.modulos?.[DISCIPLINA]?.concluidos.includes(JOGO) ?? false;
  const ion = IONS_RESONANCIA[idx];

  useEffect(() => {
    if (completos.length === IONS_RESONANCIA.length && !jaConcluido) {
      void concluirJogo(DISCIPLINA, JOGO, XP_CONCLUSAO).then((p) => p && setBonus(true));
    }
  }, [completos, jaConcluido, concluirJogo]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {IONS_RESONANCIA.map((m, i) => (
          <button
            key={m.key}
            onClick={() => setIdx(i)}
            className={cn(
              "chip px-3 py-1.5 text-sm",
              i === idx ? "bg-chem-primary text-lab-background" : "bg-slate-200/70 text-muted dark:bg-white/5",
            )}
          >
            {completos.includes(m.key) && <CheckCircle2 className="h-3.5 w-3.5" />}
            {m.nome}
          </button>
        ))}
        <span className="ml-auto font-mono text-xs text-muted">
          {completos.length}/{IONS_RESONANCIA.length} espécies
        </span>
        {(jaConcluido || bonus) && (
          <span className="chip bg-chem-success/15 text-chem-success">
            <Trophy className="h-3.5 w-3.5" /> Jogo concluído{bonus ? ` · +${XP_CONCLUSAO} XP` : ""}
          </span>
        )}
      </div>

      <PainelIon
        key={ion.key}
        ion={ion}
        jaCompleto={completos.includes(ion.key)}
        onCompleto={() => setCompletos((c) => (c.includes(ion.key) ? c : [...c, ion.key]))}
        onProximo={idx < IONS_RESONANCIA.length - 1 ? () => setIdx(idx + 1) : undefined}
      />
    </div>
  );
}

function PainelIon({
  ion,
  jaCompleto,
  onCompleto,
  onProximo,
}: {
  ion: IonResonancia;
  jaCompleto: boolean;
  onCompleto: () => void;
  onProximo?: () => void;
}) {
  const { addXp } = useAuth();
  const [etapa, setEtapa] = useState<Etapa>(jaCompleto ? "concluido" : "hibridizacao");
  const [vista, setVista] = useState<Vista>(jaCompleto ? "hibrido" : 0);
  const [alternando, setAlternando] = useState(false);
  const [hib, setHib] = useState<(Hibridizacao | null)[]>(() => ion.pesados.map(() => null));
  const [cargas, setCargas] = useState<number[][]>(() => [ion.pesados.map(() => 0), ion.pesados.map(() => 0)]);
  const [cargasOk, setCargasOk] = useState<[boolean, boolean]>([jaCompleto, jaCompleto]);
  const [escolhidos, setEscolhidos] = useState<number[]>([]);
  const [erradas, setErradas] = useState<number[]>([]);
  const [fb, setFb] = useState<Feedback>(null);
  const alvoDeslocal = useMemo(() => deslocalizados(ion), [ion]);

  // Alternância automática entre as estruturas I e II
  useEffect(() => {
    if (!alternando) return;
    const id = setInterval(() => setVista((v) => (v === 0 ? 1 : 0)), 1300);
    return () => clearInterval(id);
  }, [alternando]);

  const contrib = ion.contribuintes[vista === "hibrido" ? 0 : vista];
  const sdf = useMemo(() => {
    if (vista === "hibrido") {
      // No híbrido, ligações que mudam de ordem entre os contribuintes aparecem simples;
      // a deslocalização π é mostrada pelos halos violeta.
      const [a, b] = ion.contribuintes;
      const lig = a.ligacoes.map(([i, j, o], k) => [i, j, o === b.ligacoes[k][2] ? o : 1] as [number, number, number]);
      return toMolBlock(ion.elementos, lig, ion.coords, `${ion.nome} (híbrido)`);
    }
    return toMolBlock(ion.elementos, contrib.ligacoes, ion.coords, ion.nome, contrib.cargas);
  }, [ion, vista, contrib]);

  const mostrarCargas = etapa === "concluido" || etapa === "hibrido" || (vista !== "hibrido" && cargasOk[vista]);
  const labels: AtomLabel[] = ion.pesados.map((a, k) => {
    if (vista === "hibrido" && (etapa === "concluido")) {
      const q = ion.cargaHibrido[k];
      return { atom: a, text: q ? `${ion.rotulos[k]} δ${q > 0 ? "+" : "−"}` : ion.rotulos[k], color: q ? "#C4B5FD" : undefined };
    }
    const q = vista === "hibrido" ? 0 : contrib.cargas[a];
    return { atom: a, text: `${ion.rotulos[k]}${mostrarCargas ? sobrescrito(q) : ""}`, color: erradas.includes(k) ? DANGER : undefined };
  });

  const highlight: AtomHighlight[] =
    vista === "hibrido" && etapa === "concluido"
      ? [
          { atoms: ion.pesados.filter((_, k) => ion.hibridizacao[k] === "sp2"), color: ORBITAL, scale: 1.05 },
          { atoms: alvoDeslocal, color: ORBITAL, scale: 1.45 },
        ]
      : erradas.length
        ? [{ atoms: erradas.map((k) => ion.pesados[k]), color: DANGER }]
        : [];

  const verificarHib = () => {
    const erros = ion.pesados.map((_, k) => k).filter((k) => hib[k] !== ion.hibridizacao[k]);
    setErradas(erros);
    if (hib.some((h) => h === null)) return setFb({ ok: false, texto: "Escolha a hibridização de todos os átomos destacados." });
    if (erros.length) return setFb({ ok: false, texto: `${erros.length} átomo(s) errado(s), marcados em vermelho. Conte domínios eletrônicos: 4 → sp³, 3 → sp², 2 → sp. Atenção a pares isolados em sistemas conjugados.` });
    void addXp(XP_ETAPA, EXPERIMENTO);
    setFb({ ok: true, texto: `Correto! ${ion.notaHibridizacao} +${XP_ETAPA} XP` });
    setEtapa("carga");
    setVista(0);
  };

  const verificarCarga = () => {
    if (vista === "hibrido") return;
    const certas = ion.pesados.map((a) => ion.contribuintes[vista].cargas[a]);
    const erros = certas.map((c, k) => k).filter((k) => cargas[vista][k] !== certas[k]);
    setErradas(erros);
    if (erros.length) {
      return setFb({ ok: false, texto: `Revise ${erros.map((k) => ion.rotulos[k]).join(", ")}. Carga formal = elétrons de valência − elétrons não ligantes − ½ elétrons ligantes.` });
    }
    const novo: [boolean, boolean] = [...cargasOk] as [boolean, boolean];
    novo[vista] = true;
    setCargasOk(novo);
    if (novo[0] && novo[1]) {
      void addXp(XP_ETAPA, EXPERIMENTO);
      setFb({ ok: true, texto: `As duas estruturas estão corretas. Repare que a soma das cargas é sempre ${sinal(certas.reduce((s, c) => s + c, 0))}: ressonância move elétrons, nunca átomos. +${XP_ETAPA} XP` });
      setEtapa("hibrido");
    } else {
      setFb({ ok: true, texto: `Estrutura ${vista === 0 ? "I" : "II"} correta! Agora mude para a estrutura ${vista === 0 ? "II" : "I"}.` });
      setVista(vista === 0 ? 1 : 0);
    }
  };

  const verificarHibrido = () => {
    const ok = escolhidos.length === alvoDeslocal.length && alvoDeslocal.every((a) => escolhidos.includes(a));
    if (!ok) {
      setErradas([]);
      return setFb({ ok: false, texto: "Compare as estruturas I e II: a carga se deslocaliza pelos átomos em que ela muda de lugar." });
    }
    void addXp(XP_ETAPA, EXPERIMENTO);
    setFb({ ok: true, texto: `Exato! ${ion.contexto} +${XP_ETAPA} XP` });
    setEtapa("concluido");
    setVista("hibrido");
    setAlternando(false);
    onCompleto();
  };

  const etapas: { id: Etapa; label: string }[] = [
    { id: "hibridizacao", label: "1 · Hibridização" },
    { id: "carga", label: "2 · Carga formal" },
    { id: "hibrido", label: "3 · Híbrido de ressonância" },
  ];
  const ordem: Etapa[] = ["hibridizacao", "carga", "hibrido", "concluido"];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
      <div className="glass flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-0">
          <div>
            <p className="font-semibold">{ion.nome}</p>
            <p className="font-mono text-xs text-muted">{ion.formula}</p>
          </div>
          {etapa !== "hibridizacao" && (
            <div className="flex items-center gap-1">
              {([0, 1] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setAlternando(false);
                    setVista(v);
                    setErradas([]);
                  }}
                  className={cn("chip px-3 py-1 text-xs", vista === v ? "bg-chem-orbital text-white" : "bg-slate-200/70 text-muted dark:bg-white/5")}
                >
                  Estrutura {v === 0 ? "I" : "II"}
                  {cargasOk[v] && <CheckCircle2 className="h-3 w-3" />}
                </button>
              ))}
              {etapa === "concluido" && (
                <button
                  onClick={() => {
                    setAlternando(false);
                    setVista("hibrido");
                  }}
                  className={cn("chip px-3 py-1 text-xs", vista === "hibrido" ? "bg-chem-orbital text-white" : "bg-slate-200/70 text-muted dark:bg-white/5")}
                >
                  <Sparkles className="h-3 w-3" /> Híbrido
                </button>
              )}
              {etapa !== "carga" && (
                <button
                  onClick={() => {
                    setVista((v) => (v === "hibrido" ? 0 : v));
                    setAlternando((a) => !a);
                  }}
                  title="Alternar entre I e II"
                  aria-label="Alternar automaticamente entre as estruturas"
                  className={cn("rounded-lg p-1.5", alternando ? "bg-chem-orbital/20 text-chem-orbital" : "text-muted hover:text-chem-orbital")}
                >
                  <Repeat className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="relative min-h-[340px] flex-1">
          <Molecule3DViewer sdf={sdf} preserveView spin={false} transparent={false} zoom={1.25} labels={labels} highlight={highlight} className="absolute inset-0" />
        </div>
        <p className="border-t border-slate-200/70 p-3 text-xs text-muted dark:border-white/5">
          Geometria MMFF94 única para as duas estruturas: na ressonância só os elétrons mudam de lugar, os núcleos ficam parados.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-1.5">
          {etapas.map((e) => {
            const feito = ordem.indexOf(etapa) > ordem.indexOf(e.id);
            return (
              <span
                key={e.id}
                className={cn(
                  "chip flex-1 justify-center py-1.5 text-xs",
                  etapa === e.id ? "bg-chem-primary/20 text-chem-primary" : feito ? "bg-chem-success/15 text-chem-success" : "bg-slate-200/70 text-muted dark:bg-white/5",
                )}
              >
                {feito && <CheckCircle2 className="h-3 w-3" />}
                {e.label}
              </span>
            );
          })}
        </div>

        <div className="glass space-y-3 p-4">
          {etapa === "hibridizacao" && (
            <>
              <p className="text-sm font-semibold">Qual a hibridização de cada átomo pesado?</p>
              <div className="space-y-2">
                {ion.pesados.map((_, k) => (
                  <div key={k} className="flex items-center gap-3">
                    <span className={cn("w-12 font-mono text-sm font-semibold", erradas.includes(k) && "text-chem-danger")}>{ion.rotulos[k]}</span>
                    <div className="flex gap-1">
                      {(["sp3", "sp2", "sp"] as const).map((h) => (
                        <button
                          key={h}
                          onClick={() => setHib((arr) => arr.map((x, i) => (i === k ? h : x)))}
                          className={cn(
                            "rounded-md px-3 py-1 font-mono text-sm transition",
                            hib[k] === h ? "bg-chem-primary text-lab-background" : "bg-slate-200/70 text-muted hover:text-chem-primary dark:bg-white/5",
                          )}
                        >
                          {h.replace("3", "³").replace("2", "²")}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-primary w-full" onClick={verificarHib}>
                Verificar hibridização
              </button>
            </>
          )}

          {etapa === "carga" && vista !== "hibrido" && (
            <>
              <p className="text-sm font-semibold">
                Carga formal de cada átomo na <span className="text-chem-orbital">estrutura {vista === 0 ? "I" : "II"}</span>
              </p>
              <p className="text-xs text-muted">Observe as ligações duplas no modelo 3D. Os hidrogênios não precisam de carga.</p>
              <div className="space-y-2">
                {ion.pesados.map((_, k) => (
                  <div key={k} className="flex items-center gap-3">
                    <span className={cn("w-12 font-mono text-sm font-semibold", erradas.includes(k) && "text-chem-danger")}>{ion.rotulos[k]}</span>
                    <div className="flex gap-1">
                      {[-1, 0, 1].map((c) => (
                        <button
                          key={c}
                          disabled={cargasOk[vista]}
                          onClick={() => setCargas((arr) => arr.map((linha, v) => (v === vista ? linha.map((x, i) => (i === k ? c : x)) : linha)))}
                          className={cn(
                            "w-12 rounded-md py-1 font-mono text-sm transition disabled:opacity-60",
                            cargas[vista][k] === c ? "bg-chem-primary text-lab-background" : "bg-slate-200/70 text-muted hover:text-chem-primary dark:bg-white/5",
                          )}
                        >
                          {sinal(c)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {!cargasOk[vista] && (
                <button className="btn-primary w-full" onClick={verificarCarga}>
                  Verificar estrutura {vista === 0 ? "I" : "II"}
                </button>
              )}
            </>
          )}

          {etapa === "hibrido" && (
            <>
              <p className="text-sm font-semibold">Por quais átomos a carga está deslocalizada no híbrido de ressonância?</p>
              <p className="text-xs text-muted">Use o botão de alternar para comparar as estruturas I e II.</p>
              <div className="flex flex-wrap gap-2">
                {ion.pesados.map((a, k) => (
                  <button
                    key={a}
                    onClick={() => setEscolhidos((e) => (e.includes(a) ? e.filter((x) => x !== a) : [...e, a]))}
                    className={cn(
                      "rounded-md px-4 py-1.5 font-mono text-sm transition",
                      escolhidos.includes(a) ? "bg-chem-orbital text-white" : "bg-slate-200/70 text-muted hover:text-chem-orbital dark:bg-white/5",
                    )}
                  >
                    {ion.rotulos[k]}
                  </button>
                ))}
              </div>
              <button className="btn-primary w-full" onClick={verificarHibrido}>
                Verificar deslocalização
              </button>
            </>
          )}

          {etapa === "concluido" && (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-chem-success">
                <CheckCircle2 className="h-4 w-4" /> {ion.nome}: concluído
              </p>
              <p className="text-sm text-muted">
                Em violeta, a nuvem π deslocalizada; os halos maiores marcam onde a carga se divide (δ). {ion.contexto}
              </p>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                {ion.pesados.map((_, k) => (
                  <span key={k} className="rounded-md bg-slate-200/60 px-2 py-1 dark:bg-white/5">
                    {ion.rotulos[k]}: {ion.hibridizacao[k].replace("3", "³").replace("2", "²")}
                    {ion.cargaHibrido[k] ? ` · δ${ion.cargaHibrido[k] > 0 ? "+" : "−"}` : ""}
                  </span>
                ))}
              </div>
              {onProximo && (
                <button className="btn-primary w-full" onClick={onProximo}>
                  Próxima espécie <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
}
