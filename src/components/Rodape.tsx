import { SITE } from "@/config/site";
import { cn } from "@/lib/utils";

/** Assinatura discreta do projeto, usada no login, no Hub e nas disciplinas. */
export function Rodape({ className }: { className?: string }) {
  return (
    <footer className={cn("px-4 py-6 text-center text-xs text-muted", className)}>
      <p>
        Idealizado e desenvolvido por{" "}
        <a
          href={SITE.autor.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-ui-text underline-offset-4 transition hover:text-chem-primary hover:underline"
        >
          {SITE.autor.nome}
        </a>{" "}
        · {SITE.ano}
      </p>
      <p className="mt-1 opacity-80">Consultoria: {SITE.consultoria}</p>
    </footer>
  );
}
