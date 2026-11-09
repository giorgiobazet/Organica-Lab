/** Monta um bloco MDL Molfile V2000 a partir de elementos, ligações e coordenadas (Å). */
export function toMolBlock(
  elementos: string[],
  ligacoes: [number, number, number][],
  coords: ArrayLike<number>,
  nome = "",
  cargas?: number[],
): string {
  const n = elementos.length;
  if (coords.length !== n * 3) throw new Error(`Esperava ${n * 3} coordenadas, recebi ${coords.length}`);
  const f = (x: number) => x.toFixed(4).padStart(10);
  const i3 = (x: number) => String(x).padStart(3);
  const lines = [nome, "  OrganicaLab       3D", ""];
  lines.push(`${i3(n)}${i3(ligacoes.length)}  0  0  0  0  0  0  0  0999 V2000`);
  for (let i = 0; i < n; i++) {
    const el = elementos[i].padEnd(3);
    lines.push(`${f(coords[3 * i])}${f(coords[3 * i + 1])}${f(coords[3 * i + 2])} ${el} 0  0  0  0  0  0  0  0  0  0  0  0`);
  }
  for (const [a, b, o] of ligacoes) lines.push(`${i3(a + 1)}${i3(b + 1)}${i3(o)}  0`);
  // Cargas formais (bloco M  CHG, até 8 por linha)
  const comCarga = (cargas ?? []).map((c, i) => [i + 1, c] as const).filter(([, c]) => c !== 0);
  for (let k = 0; k < comCarga.length; k += 8) {
    const grupo = comCarga.slice(k, k + 8);
    lines.push(`M  CHG${i3(grupo.length)}${grupo.map(([a, c]) => ` ${String(a).padStart(3)} ${String(c).padStart(3)}`).join("")}`);
  }
  lines.push("M  END", "$$$$", "");
  return lines.join("\n");
}
