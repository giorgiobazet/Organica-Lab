"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { CHAVE_MODO_LEVE } from "@/lib/scriptsIniciais";

/**
 * Modo Leve: versão do site para aparelhos menos potentes. Mantém o conteúdo e o 3D, mas troca o
 * vidro desfocado por painéis sólidos, desliga brilhos e animações e reduz a resolução do 3D.
 * Liga sozinho em aparelhos fracos (até 2 GB de memória ou 4 núcleos), com "reduzir movimento" ou
 * com economia de dados; a escolha manual do usuário (botão da pena) sempre vence.
 */
interface LeveContextValue {
  leve: boolean;
  alternarLeve(): void;
}

const LeveContext = createContext<LeveContextValue | null>(null);
const STORAGE_KEY = CHAVE_MODO_LEVE;


export function LeveProvider({ children }: { children: React.ReactNode }) {
  const [leve, setLeve] = useState(false);

  useEffect(() => {
    setLeve(document.documentElement.classList.contains("leve"));
  }, []);

  const alternarLeve = useCallback(() => {
    setLeve((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("leve", next);
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* armazenamento indisponível: a escolha vale só nesta sessão */
      }
      return next;
    });
  }, []);

  return (
    <LeveContext.Provider value={{ leve, alternarLeve }}>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion={leve ? "always" : "user"}>{children}</MotionConfig>
      </LazyMotion>
    </LeveContext.Provider>
  );
}

export function useLeve(): LeveContextValue {
  const ctx = useContext(LeveContext);
  if (!ctx) throw new Error("useLeve() precisa estar dentro de <LeveProvider>.");
  return ctx;
}
