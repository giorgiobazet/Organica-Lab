# OrgânicaLab

Laboratório virtual de Química Orgânica para estudantes de Farmácia e cursos afins: jogos com moléculas 3D reais (PubChem) onde a geometria muda a química, e fórmulas em bastão IUPAC onde elas bastam.

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

Sem configurar nada, o app entra em **Modo Dev**: cadastro, login e verificação de e-mail funcionam com um provedor local salvo no `localStorage`. Na tela de bloqueio aparece o botão **"Simular Clique no Link de Verificação de E-mail (Modo Dev)"**.

## Firebase (produção)

1. Crie um projeto no [console do Firebase](https://console.firebase.google.com), ative **Authentication → E-mail/senha** e o **Firestore**.
2. Copie `.env.local.example` para `.env.local` e preencha as chaves `NEXT_PUBLIC_FIREBASE_*`.
3. Publique as regras de `firestore.rules` (cada aluno lê e escreve só o próprio perfil; XP e progresso exigem e-mail verificado).
4. Reinicie `npm run dev`. O selo "Modo Dev" some do cabeçalho.

## Publicar (Firebase Hosting)

O site é exportado como arquivos estáticos (`out/`) e publicado no site de Hosting `organicalab` do projeto Firebase `chempharm-hub` → **https://organicalab.web.app**.

```bash
npx firebase-tools login
npm run deploy
```

- `npm run deploy` faz o build e publica só o Hosting.
- `npm run deploy:regras` publica as regras do Firestore (`firestore.rules`).
- `npm run preview` serve a pasta `out/` localmente, como no Hosting.

## Estrutura

| Caminho | O que é |
|---|---|
| `src/app/page.tsx` | Tela raiz split-screen: molécula 3D + Login/Cadastro em glassmorphism |
| `src/app/hub/page.tsx` | Hub Central: header do laboratório, hero e bento grid das 4 disciplinas |
| `src/app/organica-1..3`, `src/app/analise-organica` | Páginas das disciplinas (rotas protegidas) |
| `src/lib/firebase.ts` | Firebase Auth + Firestore, com fallback Modo Dev |
| `src/context/AuthContext.tsx` | Estado de sessão, verificação de e-mail, XP e último experimento |
| `src/components/Molecule3DViewer.tsx` | Visualizador 3Dmol.js: PubChem + cache local, bola-e-bastão, bastão, van der Waals, nuvem eletrônica |
| `src/components/Molecule2DStick.tsx` | Fórmula em bastão (smiles-drawer) com cunhas estereoquímicas |
| `src/services/pubchem.ts` | Cliente PUG REST (SDF 3D, propriedades, busca por nome) |
| `src/data/molecules3d.ts` | Geometrias 3D em cache, geradas por `scripts/build3d.py` |
| `src/data/chemistryData.ts` | Disciplinas, ementas, catálogo de jogos e dados de referência com fonte |

Regras científicas, paleta e a Regra de Ouro 2D vs. 3D estão nas [regras do projeto](./docs/REGRAS.md).

## Jogos

| Disciplina | Jogos |
|---|---|
| Orgânica 1 | Estruturas, Carga Formal e Ressonância · Simulador Conformacional · Desafio de Estereoquímica · Grupos Funcionais e Propriedades · Arena de Mecanismos |
| Orgânica 2 | Deckbuilder de Reações Aromáticas · Laboratório de Alcenos, Alcinos, Álcoois, Éteres e Epóxidos |
| Orgânica 3 | Bisturi Químico (retroanálise) |
| Análise Orgânica | CSI Químico (elucidação estrutural, 100% 2D) |

## Geradores de dados (Python + RDKit)

Os arquivos em `src/data/` marcados como "Gerado por" vêm de scripts em `scripts/`:

| Script | Gera | Fonte |
|---|---|---|
| `build3d.py` | `molecules3d.ts` | RDKit ETKDGv3 + MMFF94 |
| `build_ringflip.py` | `ringFlip.ts` | MMFF94 com torsões do anel restritas |
| `build_resonancia.py` | `resonancia.ts` | RDKit |
| `build_estereo.py` | `estereo.ts` | rdCIPLabeler, conferido pela geometria |
| `build_alcenos.py` | `alcenos.ts` | cis/trans conferidos pela geometria |
| `build_bisturi.py` | `bisturi.ts` | RDKit (MMFF94/UFF) |
| `build_csi.py` | `csi.ts` | espectros de IV e EM do NIST Chemistry WebBook (JCAMP-DX) |

`build_csi.py` lê os JCAMP baixados de `https://webbook.nist.gov/cgi/cbook.cgi?JCAMP=<ID>&Index=<n>&Type=Mass|IR` (os IDs e índices usados estão no próprio script).

## Regenerar o cache 3D

```bash
pip install rdkit
python scripts/build3d.py src/data/molecules3d.ts
```

Para adicionar uma molécula, inclua uma linha na lista `MOLS` do script (chave, nome, CID do PubChem, SMILES isomérico).

## Créditos

Idealizado e desenvolvido por [Giorgio Bazet](https://www.linkedin.com/in/giorgio-bazet/).
Consultoria: Rafaella Costa.

O nome, a marca e os créditos ficam em `src/config/site.ts`.
