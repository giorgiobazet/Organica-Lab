"use client";

import dynamic from "next/dynamic";
import { FlaskRound } from "lucide-react";
import { LabHeader } from "@/components/LabHeader";
import { RequireVerified } from "@/components/RequireVerified";
import { Rodape } from "@/components/Rodape";

// Carregado só nesta página: busca, galeria e medições não pesam no resto do site.
const LaboratorioMolecular = dynamic(() => import("@/components/laboratorio/LaboratorioMolecular").then((m) => m.LaboratorioMolecular), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center gap-3 text-muted">
      <FlaskRound className="h-5 w-5 animate-pulse text-chem-primary" /> Abrindo o Laboratório Molecular…
    </div>
  ),
});

export default function Page() {
  return (
    <RequireVerified>
      <LabHeader />
      <LaboratorioMolecular />
      <Rodape className="pb-6" />
    </RequireVerified>
  );
}
