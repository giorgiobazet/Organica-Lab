/**
 * Detetive do IV e Detetive de Massas: usam os espectros reais do CSI Químico (NIST WebBook).
 * Assinaturas de grupos funcionais no IV: tabelas de Pavia e Silverstein.
 */
export const FONTE_ASSINATURAS_IV = "Faixas de absorção: Pavia, Introdução à Espectroscopia, cap. 2; Silverstein, cap. 2. Espectros: NIST Chemistry WebBook.";

export type ClasseIV = "cetona" | "cetona-aromatica" | "ester" | "acido" | "alcool" | "amina-aromatica";

export const CLASSES_IV: { id: ClasseIV; nome: string; assinatura: string }[] = [
  { id: "cetona", nome: "Cetona alifática", assinatura: "C=O forte perto de 1715 cm⁻¹, sem O–H nem N–H e só C–H sp³ (abaixo de 3000)." },
  { id: "cetona-aromatica", nome: "Cetona conjugada a anel aromático", assinatura: "C=O perto de 1685 cm⁻¹ (a conjugação baixa a frequência), C=C do anel em ~1600 e C–H sp² acima de 3000." },
  { id: "ester", nome: "Éster", assinatura: "C=O em 1735–1750 cm⁻¹ e C–O muito forte em 1000–1300, sem O–H." },
  { id: "acido", nome: "Ácido carboxílico", assinatura: "O–H muito largo (2500–3300 cm⁻¹ no líquido) junto com C=O; na fase gasosa aparecem o O–H livre (~3580) e o C=O do monômero (~1790)." },
  { id: "alcool", nome: "Álcool", assinatura: "O–H em 3200–3650 cm⁻¹ (largo quando há ligação de H) e C–O em 1000–1260, sem C=O." },
  { id: "amina-aromatica", nome: "Amina primária aromática", assinatura: "Duas bandas N–H (estiramentos simétrico e assimétrico) em 3300–3500 cm⁻¹, dobramento N–H ~1620 e C=C do anel." },
];

export const CLASSE_DO_CASO: Record<string, ClasseIV> = {
  acetofenona: "cetona-aromatica",
  butanona: "cetona",
  "acetato-de-etila": "ester",
  "acido-propanoico": "acido",
  "p-cloroanilina": "amina-aromatica",
  etanol: "alcool",
};
