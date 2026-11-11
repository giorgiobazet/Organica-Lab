"use client";

import { Feather } from "lucide-react";
import { useLeve } from "@/context/LeveContext";
import { cn } from "@/lib/utils";

/** Liga/desliga o Modo Leve (fica ao lado do botão de tema). */
export function BotaoModoLeve() {
  const { leve, alternarLeve } = useLeve();
  return (
    <button
      onClick={alternarLeve}
      className={cn("btn-ghost !p-2", leve ? "!border-chem-success text-chem-success" : "text-muted")}
      aria-pressed={leve}
      aria-label={leve ? "Desativar Modo Leve" : "Ativar Modo Leve"}
      title={leve ? "Modo Leve ligado: toque para a versão completa" : "Modo Leve: mais rápido em aparelhos simples"}
    >
      <Feather className="h-4 w-4" />
    </button>
  );
}
