import { Atom, FlaskRound, Hexagon, Microscope, type LucideIcon } from "lucide-react";
import type { Disciplina, DisciplinaId, ModoRender } from "@/data/chemistryData";

/** Classes completas (o Tailwind precisa vê-las literalmente para gerá-las). */
export const COR_CLASSES: Record<
  Disciplina["cor"],
  { text: string; bg: string; dot: string; border: string; glow: string; gradient: string }
> = {
  primary: {
    text: "text-chem-primary",
    bg: "bg-chem-primary/15",
    dot: "bg-chem-primary",
    border: "hover:border-chem-primary/60",
    glow: "bg-chem-primary/20",
    gradient: "from-chem-primary/25",
  },
  orbital: {
    text: "text-chem-orbital",
    bg: "bg-chem-orbital/15",
    dot: "bg-chem-orbital",
    border: "hover:border-chem-orbital/60",
    glow: "bg-chem-orbital/20",
    gradient: "from-chem-orbital/25",
  },
  success: {
    text: "text-chem-success",
    bg: "bg-chem-success/15",
    dot: "bg-chem-success",
    border: "hover:border-chem-success/60",
    glow: "bg-chem-success/20",
    gradient: "from-chem-success/25",
  },
  danger: {
    text: "text-chem-danger",
    bg: "bg-chem-danger/15",
    dot: "bg-chem-danger",
    border: "hover:border-chem-danger/60",
    glow: "bg-chem-danger/20",
    gradient: "from-chem-danger/25",
  },
};

export const ICONE_DISCIPLINA: Record<DisciplinaId, LucideIcon> = {
  "organica-1": Atom,
  "organica-2": Hexagon,
  "organica-3": FlaskRound,
  "analise-organica": Microscope,
};

export const MODO_CLASSES: Record<ModoRender, string> = {
  "3D": "bg-chem-orbital/15 text-chem-orbital",
  "2D": "bg-chem-primary/15 text-chem-primary",
  "2D + 3D": "bg-chem-success/15 text-chem-success",
  "2D → 3D": "bg-chem-success/15 text-chem-success",
  "Cartas 2D + 3D": "bg-chem-success/15 text-chem-success",
};
