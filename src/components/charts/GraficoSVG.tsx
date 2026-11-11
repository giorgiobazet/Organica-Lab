"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Gráficos leves em SVG puro (linha e barras), com o mesmo visual dos jogos: grade discreta,
 * eixos em lab.muted, tooltip escuro em JetBrains Mono, cursor ao passar o mouse e marcadores
 * clicáveis. Substitui uma biblioteca de gráficos de ~370 KB por alguns KB.
 */

const COR_EIXO = "#94A3B8";
const COR_GRADE = "rgba(148,163,184,0.15)";
const COR_CURSOR = "rgba(148,163,184,0.08)";
const FONTE_EIXO = 11;

export interface Margens {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Espaço reservado para os números do eixo Y (antes da margem esquerda). */
const LARGURA_EIXO_Y = 60;
/** Altura reservada para os rótulos do eixo X. */
const ALTURA_EIXO_X = 30;

function useTamanho<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [tam, setTam] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setTam({ w: el.clientWidth, h: el.clientHeight });
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, tam] as const;
}

/**
 * Passo "redondo" no padrão dos eixos numéricos usuais: arredonda o passo bruto para cima no
 * 1º dígito (ex.: 35,25 → 40; 3,25 → 4; 13,75 → 15).
 */
function passoRedondo(bruto: number): number {
  if (bruto <= 0) return 1;
  const digitos = Math.floor(Math.log10(bruto)) + 1;
  const escala = 10 ** digitos;
  const fracao = digitos !== 1 ? 0.05 : 0.1;
  return +(Math.ceil(bruto / escala / fracao - 1e-9) * fracao * escala).toFixed(10);
}

/** Marcas de um domínio fixo: do mínimo ao máximo pelo passo redondo, sempre incluindo o máximo. */
export function marcasBonitas(min: number, max: number, quantidade = 5): number[] {
  if (max === min) return [min];
  const passo = passoRedondo((max - min) / (quantidade - 1));
  const out: number[] = [];
  for (let v = min; v < max - passo * 1e-6; v += passo) out.push(+v.toFixed(10));
  out.push(max);
  return out;
}

/** Domínio automático: começa em 0 (ou no mínimo negativo) e sobe em 4 passos redondos. */
function dominioAuto(valores: number[], quantidade = 5): [number, number] {
  const min = Math.min(0, ...valores);
  const max = Math.max(...valores);
  const passo = passoRedondo((max - min) / (quantidade - 1));
  const ini = Math.floor(min / passo) * passo;
  return [ini, +(ini + passo * Math.max(quantidade - 1, Math.ceil((max - ini) / passo - 1e-9))).toFixed(10)];
}

/** Curva monotônica (Fritsch–Carlson): suave sem criar picos falsos entre os pontos. */
function caminhoMonotono(pts: [number, number][]): string {
  const n = pts.length;
  if (n < 3) return pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join("");
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    m.push(dx[i] === 0 ? 0 : (pts[i + 1][1] - pts[i][1]) / dx[i]);
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${pts[i][0] + h},${pts[i][1] + t[i] * h} ${pts[i + 1][0] - h},${pts[i + 1][1] - t[i + 1] * h} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

interface Dica {
  x: number;
  y: number;
  titulo: string;
  nome: string;
  valor: string;
  cor: string;
}

function Tooltip({ dica, largura }: { dica: Dica | null; largura: number }) {
  if (!dica) return null;
  const aDireita = dica.x + 190 < largura;
  return (
    <div
      className="pointer-events-none absolute z-10 whitespace-nowrap px-2.5 py-2"
      style={{
        left: aDireita ? dica.x + 12 : undefined,
        right: aDireita ? undefined : largura - dica.x + 12,
        top: Math.max(0, dica.y - 30),
        background: "rgba(15,23,42,0.92)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        color: "#F8FAFC",
        fontFamily: "'JetBrains Mono Variable', monospace",
        fontSize: 12,
      }}
    >
      <p>{dica.titulo}</p>
      <p style={{ color: dica.cor }}>
        {dica.nome} : {dica.valor}
      </p>
    </div>
  );
}

function Grade({
  y,
  marcasY,
  x0,
  x1,
  verticais,
  topo,
  base,
}: {
  y: (v: number) => number;
  marcasY: number[];
  x0: number;
  x1: number;
  verticais?: number[];
  topo: number;
  base: number;
}) {
  return (
    <g stroke={COR_GRADE} strokeWidth={1}>
      {marcasY.map((v) => (
        <line key={`h${v}`} x1={x0} x2={x1} y1={y(v)} y2={y(v)} />
      ))}
      {verticais?.map((px, i) => <line key={`v${i}`} x1={px} x2={px} y1={topo} y2={base} />)}
    </g>
  );
}

function EixoY({ y, marcas, x, fmt = String }: { y: (v: number) => number; marcas: number[]; x: number; fmt?: (v: number) => string }) {
  return (
    <g fontSize={FONTE_EIXO} fill={COR_EIXO} textAnchor="end">
      <line x1={x} x2={x} y1={y(marcas[0])} y2={y(marcas[marcas.length - 1])} stroke={COR_EIXO} />
      {marcas.map((v) => (
        <g key={v}>
          <line x1={x - 6} x2={x} y1={y(v)} y2={y(v)} stroke={COR_EIXO} />
          <text x={x - 9} y={y(v)} dy="0.355em">
            {fmt(v)}
          </text>
        </g>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Linha
// ---------------------------------------------------------------------------

export interface PontoDestaque {
  x: number;
  y: number;
  raio?: number;
  cor: string;
  aoClicar?: () => void;
  rotulo?: string;
}

export interface GraficoLinhaProps {
  dados: { x: number; y: number }[];
  dominioX?: [number, number];
  dominioY?: [number, number];
  marcasX?: number[];
  /** false oculta os números do eixo X (ex.: coordenada de reação). */
  mostrarMarcasX?: boolean;
  unidadeX?: string;
  rotuloX?: string;
  invertidoX?: boolean;
  cor: string;
  espessura?: number;
  curva?: "suave" | "reta";
  destaques?: PontoDestaque[];
  margens?: Margens;
  /** Texto do tooltip: [título, nome da série, valor]. */
  dica: (p: { x: number; y: number }) => [string, string, string];
  className?: string;
}

export function GraficoLinha({
  dados,
  dominioX,
  dominioY,
  marcasX,
  mostrarMarcasX = true,
  unidadeX = "",
  rotuloX,
  invertidoX = false,
  cor,
  espessura = 2.5,
  curva = "suave",
  destaques = [],
  margens = { top: 8, right: 12, bottom: 4, left: -12 },
  dica,
  className,
}: GraficoLinhaProps) {
  const [ref, { w, h }] = useTamanho<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const dx = dominioX ?? [Math.min(...dados.map((d) => d.x)), Math.max(...dados.map((d) => d.x))];
  const dy = useMemo(() => dominioY ?? dominioAuto(dados.map((d) => d.y)), [dominioY, dados]);
  const mx = marcasX ?? marcasBonitas(dx[0], dx[1]);
  const my = marcasBonitas(dy[0], dy[1]);

  const esq = LARGURA_EIXO_Y + margens.left;
  const dir = w - margens.right;
  const topo = margens.top;
  const base = h - margens.bottom - ALTURA_EIXO_X;
  const x = (v: number) => {
    const f = (v - dx[0]) / (dx[1] - dx[0] || 1);
    return esq + (invertidoX ? 1 - f : f) * (dir - esq);
  };
  const y = (v: number) => base - ((v - dy[0]) / (dy[1] - dy[0] || 1)) * (base - topo);

  const pts = useMemo(() => dados.map((d) => [x(d.x), y(d.y)] as [number, number]), [dados, w, h, dx[0], dx[1], dy[0], dy[1], invertidoX]); // eslint-disable-line react-hooks/exhaustive-deps
  const caminho = useMemo(() => {
    const ordenados = [...pts].sort((a, b) => a[0] - b[0]);
    return curva === "suave" ? caminhoMonotono(ordenados) : ordenados.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join("");
  }, [pts, curva]);

  const aoMover = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    if (px < esq || px > dir || !pts.length) return setHover(null);
    let melhor = 0;
    for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i][0] - px) < Math.abs(pts[melhor][0] - px)) melhor = i;
    setHover(melhor);
  };

  const p = hover !== null ? dados[hover] : null;
  const [titulo, nome, valor] = p ? dica(p) : ["", "", ""];

  return (
    <div ref={ref} className={className ?? "relative h-full w-full"} style={{ position: "relative" }}>
      {w > 0 && h > 0 && (
        <svg width={w} height={h} onPointerMove={aoMover} onPointerLeave={() => setHover(null)} data-grafico="linha" role="img">
          <Grade y={y} marcasY={my} x0={esq} x1={dir} verticais={mx.map(x)} topo={topo} base={base} />
          <EixoY y={y} marcas={my} x={esq} />
          <g fontSize={FONTE_EIXO} fill={COR_EIXO} textAnchor="middle">
            <line x1={esq} x2={dir} y1={base} y2={base} stroke={COR_EIXO} />
            {mostrarMarcasX &&
              mx.map((v) => (
                <g key={v}>
                  <line x1={x(v)} x2={x(v)} y1={base} y2={base + 6} stroke={COR_EIXO} />
                  <text x={x(v)} y={base + 18}>
                    {v}
                    {unidadeX}
                  </text>
                </g>
              ))}
            {rotuloX && (
              <text x={(esq + dir) / 2} y={base + (mostrarMarcasX ? 28 : 16)}>
                {rotuloX}
              </text>
            )}
          </g>
          {p && <line x1={pts[hover!][0]} x2={pts[hover!][0]} y1={topo} y2={base} stroke="#ccc" strokeWidth={1} />}
          <path d={caminho} fill="none" stroke={cor} strokeWidth={espessura} />
          {p && <circle cx={pts[hover!][0]} cy={pts[hover!][1]} r={4} fill={cor} stroke="#fff" strokeWidth={2} />}
          {destaques.map((d, i) => (
            <circle
              key={i}
              cx={x(d.x)}
              cy={y(d.y)}
              r={d.raio ?? 6}
              fill={d.cor}
              stroke="#F8FAFC"
              strokeWidth={2}
              style={d.aoClicar ? { cursor: "pointer" } : undefined}
              onClick={d.aoClicar}
            >
              {d.rotulo && <title>{d.rotulo}</title>}
            </circle>
          ))}
        </svg>
      )}
      <Tooltip dica={p ? { x: pts[hover!][0], y: pts[hover!][1], titulo, nome, valor, cor } : null} largura={w} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barras
// ---------------------------------------------------------------------------

export interface Barra {
  chave: string | number;
  /** Categoria (eixo X por categorias) ou posição numérica (eixo X numérico). */
  x: string | number;
  valor: number;
  cor: string;
  opacidade?: number;
}

export interface GraficoBarrasProps {
  barras: Barra[];
  /** "categorias": uma faixa por barra, rótulos inclinados. "numerico": barras finas em x. */
  modo: "categorias" | "numerico";
  dominioX?: [number, number];
  dominioY?: [number, number];
  larguraBarra?: number;
  cantos?: number;
  margens?: Margens;
  aoClicar?: (b: Barra) => void;
  dica: (b: Barra) => [string, string, string];
  className?: string;
}

export function GraficoBarras({
  barras,
  modo,
  dominioX,
  dominioY,
  larguraBarra = 4,
  cantos = 0,
  margens = { top: 8, right: 8, bottom: 4, left: -8 },
  aoClicar,
  dica,
  className,
}: GraficoBarrasProps) {
  const [ref, { w, h }] = useTamanho<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const dy = useMemo(() => dominioY ?? dominioAuto(barras.map((b) => b.valor)), [dominioY, barras]);
  const my = marcasBonitas(dy[0], dy[1]);
  const altEixoX = modo === "categorias" ? ALTURA_EIXO_X + 36 : ALTURA_EIXO_X;

  const esq = LARGURA_EIXO_Y + margens.left;
  const dir = w - margens.right;
  const topo = margens.top;
  const base = h - margens.bottom - altEixoX;
  const y = (v: number) => base - ((v - dy[0]) / (dy[1] - dy[0] || 1)) * (base - topo);

  const nums = barras.map((b) => Number(b.x));
  const dx = dominioX ?? [Math.min(...nums), Math.max(...nums)];
  const mx = modo === "numerico" ? marcasBonitas(dx[0], dx[1]) : [];
  const faixa = modo === "categorias" ? (dir - esq) / Math.max(1, barras.length) : 0;
  const xNum = (v: number) => esq + ((v - dx[0]) / (dx[1] - dx[0] || 1)) * (dir - esq);
  const centro = (i: number) => (modo === "categorias" ? esq + faixa * (i + 0.5) : xNum(Number(barras[i].x)));
  const larg = modo === "categorias" ? faixa * 0.8 : larguraBarra;
  const larguraCursor = modo === "categorias" ? faixa : Math.max(8, larguraBarra * 3);

  const aoMover = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    if (px < esq || px > dir || !barras.length) return setHover(null);
    let melhor = 0;
    for (let i = 1; i < barras.length; i++) if (Math.abs(centro(i) - px) < Math.abs(centro(melhor) - px)) melhor = i;
    setHover(modo === "categorias" || Math.abs(centro(melhor) - px) < 12 ? melhor : null);
  };

  const b = hover !== null ? barras[hover] : null;
  const [titulo, nome, valor] = b ? dica(b) : ["", "", ""];

  return (
    <div ref={ref} className={className ?? "relative h-full w-full"} style={{ position: "relative" }}>
      {w > 0 && h > 0 && (
        <svg
          width={w}
          height={h}
          onPointerMove={aoMover}
          onPointerLeave={() => setHover(null)}
          onClick={() => b && aoClicar?.(b)}
          style={b && aoClicar ? { cursor: "pointer" } : undefined}
          data-grafico="barras"
          role="img"
        >
          <Grade y={y} marcasY={my} x0={esq} x1={dir} topo={topo} base={base} />
          <EixoY y={y} marcas={my} x={esq} />
          {b && <rect x={centro(hover!) - larguraCursor / 2} y={topo} width={larguraCursor} height={base - topo} fill={COR_CURSOR} />}
          {barras.map((br, i) => {
            const alt = Math.max(0, base - y(br.valor));
            const r = Math.min(cantos, larg / 2, alt);
            const x0 = centro(i) - larg / 2;
            const y0 = base - alt;
            const d = r
              ? `M${x0},${base}V${y0 + r}Q${x0},${y0} ${x0 + r},${y0}H${x0 + larg - r}Q${x0 + larg},${y0} ${x0 + larg},${y0 + r}V${base}Z`
              : `M${x0},${base}V${y0}H${x0 + larg}V${base}Z`;
            return <path key={br.chave} d={d} fill={br.cor} fillOpacity={br.opacidade ?? 1} />;
          })}
          <g fontSize={FONTE_EIXO} fill={COR_EIXO}>
            <line x1={esq} x2={dir} y1={base} y2={base} stroke={COR_EIXO} />
            {modo === "categorias"
              ? barras.map((br, i) => (
                  <g key={br.chave}>
                    <line x1={centro(i)} x2={centro(i)} y1={base} y2={base + 6} stroke={COR_EIXO} />
                    <text x={centro(i)} y={base + 16} textAnchor="end" transform={`rotate(-25 ${centro(i)} ${base + 16})`}>
                      {br.x}
                    </text>
                  </g>
                ))
              : mx.map((v) => (
                  <g key={v} textAnchor="middle">
                    <line x1={xNum(v)} x2={xNum(v)} y1={base} y2={base + 6} stroke={COR_EIXO} />
                    <text x={xNum(v)} y={base + 18}>
                      {v}
                    </text>
                  </g>
                ))}
          </g>
        </svg>
      )}
      <Tooltip dica={b ? { x: centro(hover!), y: y(b.valor), titulo, nome, valor, cor: b.cor } : null} largura={w} />
    </div>
  );
}
