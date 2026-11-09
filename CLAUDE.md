# OrgânicaLab — Regras do Projeto

Plataforma educacional de Química Orgânica (Farmácia e cursos afins). Idealizado e desenvolvido por Giorgio Bazet; consultoria de Rafaella Costa.

- **Identidade** (nome, marca, autoria, créditos): só em `src/config/site.ts`. Não escreva o nome do projeto em outros arquivos.
- **Visual**: estilo "Orbital" — tokens semânticos (`--bg`, `--surface`, `--border`, `--text`, `--muted`, `--hero`, `--viewer`) em `src/app/globals.css`, versões clara e escura; use as classes `ui-*`, `glass`, `text-muted`, `btn-primary`, `titulo-marca` em vez de cores fixas.
- **Rodapé** (`<Rodape/>`): assinatura do autor no login, no Hub e nas disciplinas.

Stack: Next.js 15 (App Router) + TypeScript + Tailwind CSS 3 + Framer Motion + Lucide + Recharts + 3Dmol.js + smiles-drawer + Firebase.

## Comandos

- `npm run dev`: servidor de desenvolvimento (http://localhost:3000)
- `npm run build`: build de produção; rode antes de cada commit
- `npm run typecheck`: checagem TypeScript

## Regra de Ouro 2D vs. 3D (diretriz pedagógica da Rafaella)

O 3D entra **só onde a geometria espacial muda o comportamento químico**. Em qualquer outro caso, use a fórmula em bastão 2D (`<Molecule2DStick/>`).

**3D obrigatório (`<Molecule3DViewer/>`):**
- estrutura e ligações do carbono, hibridização, carga formal e ressonância;
- análise conformacional de alcanos e cicloalcanos (Newman, chair flip);
- estereoquímica (isômeros, R/S, CIP);
- Deckbuilder de aromáticos: ao adicionar um substituinte ao benzeno;
- Bisturi Químico: logo depois de desconectar os synthons.

**2D (bastão + gráficos) é o ideal:**
- grupos funcionais e nomenclatura;
- polaridade, forças intermoleculares, ponto de ebulição e solubilidade (gráficos);
- etapa inicial de corte da molécula-alvo no Bisturi Químico;
- toda a disciplina de Análise Orgânica (testes químicos, IV, EM, RMN ¹H/¹³C). **Nunca use 3D em `/analise-organica`.**

## Rigor científico

- Estruturas 3D: PubChem PUG REST (`src/services/pubchem.ts`), com fallback em `src/data/molecules3d.ts` (geometrias MMFF94 geradas com RDKit, a mesma família de campo de força dos confôrmeros 3D do PubChem).
- Dados físico-químicos e espectrais vêm de literatura oficial: Silverstein, Pavia, Bruice, Clayden, NIST Chemistry WebBook e SDBS. Todo valor novo em `src/data/chemistryData.ts` deve levar o campo `fonte`.
- 2D em padrão IUPAC (Gold Book): ângulos de 120°, cunhas cheias (para frente) e tracejadas (para trás) nos estereocentros.
- Proibido deixar placeholders (`// TODO`, "implementar depois", componentes vazios).

## Paleta "Clean Sci-Tech Lab"

| Token | Hex | Uso |
|---|---|---|
| `lab.background` | `#0B0F19` | fundo dark |
| `lab.surface` | `#1E293B` | painéis glass (60–80% + `backdrop-blur-md`) |
| `lab.light` | `#F8FAFC` | texto dark / fundo light |
| `lab.muted` | `#94A3B8` | texto secundário |
| `lab.dark` | `#0F172A` | texto no light mode |
| `chem.primary` | `#06B6D4` | ações, destaques, bisturi |
| `chem.orbital` | `#8B5CF6` | nuvens eletrônicas, ressonância, setas de mecanismo |
| `chem.success` | `#10B981` | conformações estáveis, acertos |
| `chem.danger` | `#F43F5E` | tensão estérica, 1,3-diaxial, erros |

Tipografia: **Inter** na interface e **JetBrains Mono** em fórmulas, nomes IUPAC, coordenadas e dados espectrais (classe `font-mono`).

## Autenticação

- `src/lib/firebase.ts` usa o Firebase real (projeto `chempharm-hub`, configuração pública versionada em `.env`). Sem as variáveis `NEXT_PUBLIC_FIREBASE_*` (ex.: sobrescritas vazias num `.env.local`), entra em **Modo Dev** (provedor local em `localStorage`, com botão "Simular Clique no Link de Verificação de E-mail (Modo Dev)").
- Regras de segurança em `firestore.rules` (publicadas no console). E-mails de verificação em pt-BR.
- Cadastro: nome completo, e-mail, matrícula (exatamente 12 dígitos, ex.: 202012345678), senha com 8+ caracteres, maiúscula, minúscula, número e símbolo (`REQUISITOS_SENHA` em `src/lib/validation.ts`).
- Rotas `/hub`, `/organica-1`, `/organica-2`, `/organica-3` e `/analise-organica` exigem login com `emailVerified === true` (`<RequireVerified/>`).
- Perfil no Firestore: `users/{uid}` = `{ nome, email, matricula, xp, progresso }`.
