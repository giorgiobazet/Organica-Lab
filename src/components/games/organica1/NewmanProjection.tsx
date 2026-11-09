"use client";

import type { Alcano } from "@/lib/conformacoes";

/**
 * Projeção de Newman ao longo de C2→C3.
 * Carbono da frente = ponto central; carbono de trás = círculo.
 * θ = 0 aponta para cima; φ positivo gira o carbono de trás no sentido horário.
 */
export function NewmanProjection({ alcano, phi, size = 260 }: { alcano: Alcano; phi: number; size?: number }) {
  const c = size / 2;
  const R = size * 0.2; // raio do círculo (carbono de trás)
  const L = size * 0.36; // comprimento das ligações
  const frente = alcano === "butano" ? ["CH₃", "H", "H"] : ["H", "H", "H"];
  const tras = alcano === "butano" ? ["CH₃", "H", "H"] : ["H", "H", "H"];
  const pt = (thetaDeg: number, r: number) => {
    const t = ((thetaDeg - 90) * Math.PI) / 180;
    return [c + r * Math.cos(t), c + r * Math.sin(t)] as const;
  };

  const label = (thetaDeg: number, text: string, cor: string, key: string) => {
    const [x, y] = pt(thetaDeg, L + 16);
    return (
      <text key={key} x={x} y={y} textAnchor="middle" dominantBaseline="central" className="font-mono" fontSize={text === "H" ? 13 : 14} fontWeight={600} fill={cor}>
        {text}
      </text>
    );
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" role="img" aria-label={`Projeção de Newman do ${alcano} com diedro de ${Math.round(phi)} graus`}>
      {/* Ligações de trás (partem da borda do círculo) */}
      {tras.map((_, k) => {
        const th = phi + 120 * k;
        const [x1, y1] = pt(th, R);
        const [x2, y2] = pt(th, L);
        return <line key={`tb${k}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8B5CF6" strokeWidth={3} strokeLinecap="round" />;
      })}
      <circle cx={c} cy={c} r={R} fill="none" stroke="currentColor" strokeWidth={2.5} className="text-slate-500 dark:text-lab-muted" />
      {/* Ligações da frente (partem do centro) */}
      {frente.map((_, k) => {
        const [x2, y2] = pt(120 * k, L);
        return <line key={`fb${k}`} x1={c} y1={c} x2={x2} y2={y2} stroke="#06B6D4" strokeWidth={3} strokeLinecap="round" />;
      })}
      <circle cx={c} cy={c} r={3.5} fill="#06B6D4" />
      {tras.map((t, k) => label(phi + 120 * k + (eclipsa(phi + 120 * k) ? 14 : 0), t, t === "H" ? "#94A3B8" : "#8B5CF6", `tl${k}`))}
      {frente.map((t, k) => label(120 * k - (eclipsa(phi + 120 * k) ? 14 : 0), t, t === "H" ? "#94A3B8" : "#06B6D4", `fl${k}`))}
    </svg>
  );
}

/** Na conformação eclipsada os rótulos se sobrepõem: afasta-os alguns graus. */
function eclipsa(theta: number) {
  const r = ((theta % 120) + 120) % 120;
  return r < 12 || r > 108;
}
