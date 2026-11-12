"use client";

import { LabHeader } from "@/components/LabHeader";
import { RequireVerified } from "@/components/RequireVerified";
import { Rodape } from "@/components/Rodape";
import { PainelAdmin } from "@/components/turmas/PainelAdmin";

export default function Page() {
  return (
    <RequireVerified>
      <LabHeader />
      <main className="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6">
        <PainelAdmin />
      </main>
      <Rodape />
    </RequireVerified>
  );
}
