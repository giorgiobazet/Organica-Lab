// Copia os dados da OpenChemLib (torsões do COD e parâmetros MMFF94) para public/ocl/, de onde o
// editor do Laboratório Molecular os carrega só quando alguém gera um 3D. Roda antes do build/dev.
import fs from "node:fs";

const origem = "node_modules/openchemlib/dist/resources.json";
fs.mkdirSync("public/ocl", { recursive: true });
fs.copyFileSync(origem, "public/ocl/recursos.json");
console.log("✓ public/ocl/recursos.json atualizado");
