/**
 * Aromático ou Não? Critérios de Hückel: anel cíclico, planar, totalmente conjugado e com
 * 4n + 2 elétrons π (aromático); 4n elétrons π nas mesmas condições (antiaromático); se falhar
 * planaridade ou conjugação, não aromático.
 */
export const FONTE_AROMATICIDADE = "Bruice, Química Orgânica, cap. 8 (aromaticidade e regra de Hückel); Clayden, Organic Chemistry, cap. 7. Geometria do ciclo-octatetraeno: RDKit (MMFF94).";

export type Classe = "aromatico" | "antiaromatico" | "nao-aromatico";

export const ROTULO_CLASSE: Record<Classe, string> = {
  aromatico: "Aromático",
  antiaromatico: "Antiaromático",
  "nao-aromatico": "Não aromático",
};

export interface EspecieAromatica {
  id: string;
  nome: string;
  smiles: string;
  classe: Classe;
  eletronsPi: number;
  planar: boolean;
  conjugado: boolean;
  explicacao: string;
  /** Mostrar em 3D (só onde a geometria decide: ciclo-octatetraeno). */
  modelo3d?: boolean;
}

export const ESPECIES: EspecieAromatica[] = [
  { id: "benzeno", nome: "Benzeno", smiles: "C1=CC=CC=C1", classe: "aromatico", eletronsPi: 6, planar: true, conjugado: true, explicacao: "Anel planar, todos os C sp² e 6 elétrons π (4n + 2 com n = 1): o caso-modelo de aromaticidade." },
  { id: "ciclobutadieno", nome: "Ciclobutadieno", smiles: "C1=CC=C1", classe: "antiaromatico", eletronsPi: 4, planar: true, conjugado: true, explicacao: "Cíclico, planar e conjugado, mas com 4 elétrons π (4n, n = 1): antiaromático, muito instável; só existe isolado a temperaturas muito baixas." },
  { id: "cot", nome: "Ciclo-octatetraeno", smiles: "C1=CC=CC=CC=C1", classe: "nao-aromatico", eletronsPi: 8, planar: false, conjugado: false, explicacao: "Com 8 elétrons π seria antiaromático se fosse planar; para escapar disso o anel dobra em forma de banheira. As duplas deixam de se sobrepor: não aromático. Gire o modelo 3D e veja.", modelo3d: true },
  { id: "piridina", nome: "Piridina", smiles: "C1=CC=NC=C1", classe: "aromatico", eletronsPi: 6, planar: true, conjugado: true, explicacao: "Como o benzeno, com um N no lugar de um CH. O par livre do N fica num orbital sp² no plano do anel, fora do sistema π: 6 elétrons π." },
  { id: "pirrol", nome: "Pirrol", smiles: "C1=CNC=C1", classe: "aromatico", eletronsPi: 6, planar: true, conjugado: true, explicacao: "Quatro elétrons π das duas duplas + o par livre do N (em orbital p) = 6 elétrons π. Por isso o N do pirrol quase não é básico." },
  { id: "furano", nome: "Furano", smiles: "C1=COC=C1", classe: "aromatico", eletronsPi: 6, planar: true, conjugado: true, explicacao: "Um dos pares do oxigênio entra no sistema π (o outro fica no plano): 4 + 2 = 6 elétrons π." },
  { id: "cicloexadieno", nome: "Cicloexa-1,3-dieno", smiles: "C1=CC=CCC1", classe: "nao-aromatico", eletronsPi: 4, planar: false, conjugado: false, explicacao: "Os dois CH₂ sp³ interrompem a conjugação do anel: não há um ciclo contínuo de orbitais p." },
  { id: "tropilio", nome: "Cátion tropílio", smiles: "C1=CC=C[CH+]C=C1", classe: "aromatico", eletronsPi: 6, planar: true, conjugado: true, explicacao: "Sete carbonos sp²; o carbocátion tem orbital p vazio, completando o ciclo. Três duplas = 6 elétrons π: aromático e surpreendentemente estável para um carbocátion." },
  { id: "ciclopentadienila-anion", nome: "Ânion ciclopentadienila", smiles: "[CH-]1C=CC=C1", classe: "aromatico", eletronsPi: 6, planar: true, conjugado: true, explicacao: "O carbânion tem o par em orbital p: 4 + 2 = 6 elétrons π. Por isso o ciclopentadieno é ácido para um hidrocarboneto (pKa ≈ 15)." },
  { id: "ciclopentadienila-cation", nome: "Cátion ciclopentadienila", smiles: "[CH+]1C=CC=C1", classe: "antiaromatico", eletronsPi: 4, planar: true, conjugado: true, explicacao: "Orbital p vazio completa o ciclo, mas sobram 4 elétrons π (4n): antiaromático, extremamente instável." },
];
