/** Monta um bloco MDL Molfile V2000 a partir de elementos, ligações e coordenadas (Å). */
export function toMolBlock(
  elementos: string[],
  ligacoes: [number, number, number][],
  coords: ArrayLike<number>,
  nome = "",
): string {
  const n = elementos.length;
  if (coords.length !== n * 3) throw new Error(`Esperava ${n * 3} coordenadas, recebi ${coords.length}`);
  const f = (x: number) => x.toFixed(4).padStart(10);
  const i3 = (x: number) => String(x).padStart(3);
  const lines = [nome, "  ChemPharm         3D", ""];
  lines.push(`${i3(n)}${i3(ligacoes.length)}  0  0  0  0  0  0  0  0999 V2000`);
  for (let i = 0; i < n; i++) {
    const el = elementos[i].padEnd(3);
    lines.push(`${f(coords[3 * i])}${f(coords[3 * i + 1])}${f(coords[3 * i + 2])} ${el} 0  0  0  0  0  0  0  0  0  0  0  0`);
  }
  for (const [a, b, o] of ligacoes) lines.push(`${i3(a + 1)}${i3(b + 1)}${i3(o)}  0`);
  lines.push("M  END", "$$$$", "");
  return lines.join("\n");
}
