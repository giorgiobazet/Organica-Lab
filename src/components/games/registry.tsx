"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

function Carregando() {
  return <div className="glass p-10 text-center text-sm text-muted">Montando a bancada do laboratório…</div>;
}

/** Jogos jogáveis, por id (o mesmo id de chemistryData.ts). Carregados sob demanda. */
export const JOGOS_DISPONIVEIS: Record<string, ComponentType> = {
  "estruturas-ressonancia": dynamic(() => import("./organica1/EstruturasRessonancia"), {
    ssr: false,
    loading: Carregando,
  }),
  "desafio-estereoquimica": dynamic(() => import("./organica1/DesafioEstereoquimica"), {
    ssr: false,
    loading: Carregando,
  }),
  "simulador-conformacional": dynamic(() => import("./organica1/SimuladorConformacional"), {
    ssr: false,
    loading: Carregando,
  }),
};
