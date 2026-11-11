// Confere o build antes de publicar: sem a configuração do Firebase embutida, o site cairia no
// Modo Dev (contas só no navegador). Também barra dados sensíveis que não podem ir ao ar.
import fs from "node:fs";
import path from "node:path";

const OUT = "out";
const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => /^NEXT_PUBLIC_FIREBASE_\w+=/.test(l))
    .map((l) => l.split("=").map((s) => s.trim())),
);

function arquivos(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? arquivos(p) : /\.(js|html)$/.test(e.name) ? [p] : [];
  });
}

if (!fs.existsSync(OUT)) {
  console.error("✗ Pasta out/ não encontrada: rode o build antes.");
  process.exit(1);
}
const conteudo = arquivos(OUT).map((f) => fs.readFileSync(f, "utf8")).join("\n");

const faltando = ["NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_APP_ID"].filter(
  (k) => !env[k] || !conteudo.includes(env[k]),
);
if (faltando.length) {
  console.error(`✗ Build sem a configuração do Firebase (${faltando.join(", ")}): o site abriria no Modo Dev.`);
  console.error("  Confira o .env e se não há um .env.local sobrescrevendo as variáveis com valores vazios.");
  process.exit(1);
}

console.log("✓ Build com a configuração do Firebase: pode publicar.");
