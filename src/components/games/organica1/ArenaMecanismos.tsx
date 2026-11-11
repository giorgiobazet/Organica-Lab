"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ArrowRight, CheckCircle2, FlaskConical, Pause, Play, RotateCcw, Trophy, XCircle } from "lucide-react";
import { Molecule2DStick } from "@/components/Molecule2DStick";
import { Molecule3DViewer } from "@/components/Molecule3DViewer";
import { useAuth } from "@/context/AuthContext";
import { CENARIOS, CLASSES, MECANISMOS, TIPOS, type Cenario, type Visual3D } from "@/data/mecanismos";
import { geometriaSN1, quadroSN2 } from "@/lib/mecanismos3d";
import { toMolBlock } from "@/lib/molblock";
import { cn } from "@/lib/utils";

const DISCIPLINA = "organica-1";
const JOGO = "arena-mecanismos";
const XP_ETAPA = 10;
const XP_CONCLUSAO = 100;
const EXPERIMENTO = { rota: "/organica-1#arena-mecanismos", titulo: "Arena de Mecanismos" };
const ORBITAL = "#8B5CF6";

type Etapa = "classe" | "reagente" | "mecanismo" | "feito";
type Feedback = { ok: boolean; texto: string } | null;

const DICAS = {
  classe: "Conte quantos carbonos estão ligados ao carbono que carrega o grupo abandonador.",
  reagente: "Íons grandes e polarizáveis (I⁻, RS⁻, HS⁻) são nucleófilos fortes e bases fracas; alcóxidos e HO⁻ são bases fortes; t-BuO⁻ é volumoso; H₂O e álcoois neutros são fracos.",
  mecanismo: "Fraco + terciário → via carbocátion (SN1/E1; calor favorece E1). Base forte + 2°/3° → E2. Base volumosa → E2. Nucleófilo forte e base fraca + metílico/1°/2° → SN2.",
};

export default function ArenaMecanismos() {
  const [idx, setIdx] = useState(0);
  const [feitos, setFeitos] = useState<string[]>([]);
  const [bonus, setBonus] = useState(false);
  const { concluirJogo, profile } = useAuth();
  const jaConcluido = profile?.progresso.modulos?.[DISCIPLINA]?.concluidos.includes(JOGO) ?? false;
  const c = CENARIOS[idx];

  useEffect(() => {
    if (feitos.length === CENARIOS.length && !jaConcluido) {
      void concluirJogo(DISCIPLINA, JOGO, XP_CONCLUSAO).then((p) => p && setBonus(true));
    }
  }, [feitos, jaConcluido, concluirJogo]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {CENARIOS.map((x, i) => (
          <button
            key={x.id}
            onClick={() => setIdx(i)}
            aria-label={`Cenário ${i + 1}`}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs transition",
              i === idx ? "bg-chem-primary text-lab-background" : feitos.includes(x.id) ? "bg-chem-success/15 text-chem-success" : "bg-slate-200/70 text-muted dark:bg-white/5",
            )}
          >
            {feitos.includes(x.id) && i !== idx ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
          </button>
        ))}
        <span className="ml-auto font-mono text-xs text-muted">
          {feitos.length}/{CENARIOS.length} cenários
        </span>
        {(jaConcluido || bonus) && (
          <span className="chip bg-chem-success/15 text-chem-success">
            <Trophy className="h-3.5 w-3.5" /> Jogo concluído{bonus ? ` · +${XP_CONCLUSAO} XP` : ""}
          </span>
        )}
      </div>
      <PainelCenario
        key={c.id}
        c={c}
        jaFeito={feitos.includes(c.id)}
        onFeito={() => setFeitos((f) => (f.includes(c.id) ? f : [...f, c.id]))}
        onProximo={idx < CENARIOS.length - 1 ? () => setIdx(idx + 1) : undefined}
      />
    </div>
  );
}

function PainelCenario({ c, jaFeito, onFeito, onProximo }: { c: Cenario; jaFeito: boolean; onFeito: () => void; onProximo?: () => void }) {
  const { addXp } = useAuth();
  const [etapa, setEtapa] = useState<Etapa>(jaFeito ? "feito" : "classe");
  const [fb, setFb] = useState<Feedback>(null);

  const responder = (valor: string) => {
    const certo = etapa === "classe" ? c.classe : etapa === "reagente" ? c.tipoReagente : c.mecanismo;
    if (etapa === "feito") return;
    if (valor !== certo) return setFb({ ok: false, texto: `Não é "${valor}". ${DICAS[etapa]}` });
    void addXp(XP_ETAPA, EXPERIMENTO);
    if (etapa === "classe") {
      setEtapa("reagente");
      setFb({ ok: true, texto: `Substrato ${c.classe}. +${XP_ETAPA} XP` });
    } else if (etapa === "reagente") {
      setEtapa("mecanismo");
      setFb({ ok: true, texto: `Reagente: ${c.tipoReagente}. +${XP_ETAPA} XP` });
    } else {
      setEtapa("feito");
      setFb({ ok: true, texto: `${c.mecanismo}! ${c.explicacao} +${XP_ETAPA} XP` });
      onFeito();
    }
  };

  const opcoes: readonly string[] = etapa === "classe" ? CLASSES : etapa === "reagente" ? TIPOS : MECANISMOS;
  const pergunta =
    etapa === "classe" ? "1 · Classifique o substrato" : etapa === "reagente" ? "2 · Como o reagente se comporta?" : "3 · Qual mecanismo predomina?";

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
      <div className="space-y-4">
        <div className="glass p-4">
          <p className="font-semibold">{c.titulo}</p>
          <div className="mt-2 flex justify-center">
            <Molecule2DStick smiles={c.substratoSmiles} width={300} height={150} explicitHydrogens={false} label={c.substratoNome} />
          </div>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted">Reagente</dt>
            <dd className="font-mono">{c.reagente}</dd>
            <dt className="text-muted">Solvente</dt>
            <dd>{c.solvente}</dd>
            {c.condicao && (
              <>
                <dt className="text-muted">Condição</dt>
                <dd>{c.condicao}</dd>
              </>
            )}
          </dl>
        </div>

        <div className="glass space-y-3 p-4">
          {etapa !== "feito" ? (
            <>
              <p className="text-sm font-semibold">{pergunta}</p>
              <div className={cn("grid gap-2", etapa === "mecanismo" ? "grid-cols-4" : "grid-cols-2")}>
                {opcoes.map((o) => (
                  <button key={o} className={cn("btn-ghost", etapa === "mecanismo" ? "font-mono text-base" : "text-xs")} onClick={() => responder(o)}>
                    {o}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-chem-success">
                <CheckCircle2 className="h-4 w-4" /> {c.classe} · {c.tipoReagente} → <span className="font-mono">{c.mecanismo}</span>
              </p>
              <p className="text-xs font-semibold text-muted">Produto principal</p>
              <div className="flex justify-center">
                <Molecule2DStick smiles={c.produtoSmiles} width={260} height={120} explicitHydrogens={false} label={c.produtoNome} />
              </div>
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
          {etapa === "feito" && onProximo && (
            <button className="btn-primary w-full" onClick={onProximo}>
              Próximo cenário <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="glass flex min-h-[420px] flex-col overflow-hidden">
        {etapa === "feito" && c.visual ? (
          c.visual.tipo === "sn2" ? (
            <VisualSN2 v={c.visual} temConfiguracao={Boolean(c.visual.prioridades)} />
          ) : (
            <VisualSN1 v={c.visual} />
          )
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <FlaskConical className="h-10 w-10 text-chem-primary/60" />
            <p className="max-w-sm text-sm text-muted">
              {etapa === "feito"
                ? `Eliminações (${c.mecanismo}) são avaliadas pelo produto: veja o alceno formado ao lado. O 3D desta arena fica reservado para o ataque dorsal (SN2) e o carbocátion planar (SN1).`
                : "Acerte o mecanismo para abrir a visualização. Em SN2 você verá o ataque dorsal com inversão de Walden; em SN1, o carbocátion planar."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

type SN2Visual = Extract<Visual3D, { tipo: "sn2" }>;

function VisualSN2({ v, temConfiguracao }: { v: SN2Visual; temConfiguracao: boolean }) {
  const [t, setT] = useState(0);
  const [tocando, setTocando] = useState(true);
  const tRef = useRef(0);
  const irPara = (x: number) => {
    tRef.current = x;
    setT(x);
  };

  // Avanço por tempo (≈3 s do início ao fim), independente da taxa de quadros.
  useEffect(() => {
    if (!tocando) return;
    let raf = 0;
    let ultimo = performance.now();
    const passo = (agora: number) => {
      const dt = agora - ultimo;
      ultimo = agora;
      const novo = Math.min(1, tRef.current + dt / 3000);
      tRef.current = novo;
      setT(novo);
      if (novo >= 1) setTocando(false);
      else raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [tocando]);

  const q = useMemo(() => quadroSN2(v, t), [v, t]);
  const sdf = useMemo(() => toMolBlock(q.elementos, q.ligacoes, q.coords, "SN2"), [q]);
  const cfgInicial = useMemo(() => quadroSN2(v, 0).configuracao, [v]);
  const cfgFinal = useMemo(() => quadroSN2(v, 1).configuracao, [v]);

  return (
    <>
      <div className="flex items-center justify-between p-4 pb-0">
        <p className="font-semibold">SN2: ataque dorsal a 180°</p>
        <span className={cn("chip font-mono", q.fase === "estado de transição" ? "bg-chem-orbital/15 text-chem-orbital" : "bg-slate-200/70 text-muted dark:bg-white/5")}>
          {q.fase}
          {q.configuracao ? ` · (${q.configuracao})` : ""}
        </span>
      </div>
      <div className="relative flex-1">
        <Molecule3DViewer
          sdf={sdf}
          preserveView
          spin={false}
          transparent={false}
          zoom={1.1}
          labels={q.rotulos}
          highlight={q.fase === "estado de transição" ? [{ atoms: [0], color: ORBITAL, scale: 1.2 }] : []}
          className="absolute inset-0"
        />
      </div>
      <div className="space-y-2 border-t border-slate-200/70 p-4 dark:border-white/5">
        <div className="flex items-center gap-3">
          <button
            className="btn-ghost !px-3 !py-2"
            onClick={() => {
              if (t >= 1) irPara(0);
              setTocando((x) => !x);
            }}
            aria-label={tocando ? "Pausar" : "Animar o ataque"}
          >
            {tocando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(t * 100)}
            onChange={(e) => {
              setTocando(false);
              irPara(Number(e.target.value) / 100);
            }}
            className="flex-1 accent-chem-primary"
            aria-label="Coordenada de reação"
          />
          <button className="btn-ghost !px-3 !py-2" onClick={() => irPara(0)} aria-label="Reiniciar">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted">
          O nucleófilo entra pelo lado oposto ao grupo abandonador; no estado de transição o carbono fica pentacoordenado (bipirâmide trigonal) e os três
          substituintes ficam num plano. Depois, o guarda-chuva vira.
          {temConfiguracao && cfgInicial && cfgFinal && (
            <span className="font-semibold text-chem-orbital">
              {" "}
              Configuração: ({cfgInicial}) → ({cfgFinal}).
            </span>
          )}
        </p>
      </div>
    </>
  );
}

function VisualSN1({ v }: { v: Extract<Visual3D, { tipo: "sn1" }> }) {
  const g = useMemo(() => geometriaSN1(v), [v]);
  const sdf = useMemo(() => toMolBlock(g.elementos, g.ligacoes, g.coords, "carbocátion"), [g]);
  return (
    <>
      <div className="p-4 pb-0">
        <p className="font-semibold">SN1: carbocátion trigonal planar (sp²)</p>
      </div>
      <div className="relative flex-1">
        <Molecule3DViewer
          sdf={sdf}
          spin={false}
          transparent={false}
          zoom={1.0}
          labels={g.rotulos}
          esferas={g.lobos.map((l) => ({ ...l, color: ORBITAL, opacity: 0.5 }))}
          className="absolute inset-0"
        />
      </div>
      <p className="border-t border-slate-200/70 p-4 text-xs text-muted dark:border-white/5">
        Em violeta, os dois lobos do orbital p vazio. O nucleófilo pode atacar pelas duas faces com a mesma chance: se o carbono for um estereocentro, o produto sai
        racêmico (ou quase), ao contrário da inversão total do SN2.
      </p>
    </>
  );
}
