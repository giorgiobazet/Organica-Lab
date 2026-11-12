# OrgânicaLab — Regras do Projeto

Plataforma educacional de Química Orgânica (Farmácia e cursos afins). Idealizado e desenvolvido por Giorgio Bazet; consultoria de Rafaella Costa.

- **Identidade** (nome, marca, autoria, créditos): só em `src/config/site.ts`. Não escreva o nome do projeto em outros arquivos.
- **Visual**: estilo "Orbital" — tokens semânticos (`--bg`, `--surface`, `--border`, `--text`, `--muted`, `--hero`, `--viewer`) em `src/app/globals.css`, versões clara e escura; use as classes `ui-*`, `glass`, `text-muted`, `btn-primary`, `titulo-marca` em vez de cores fixas.
- **Rodapé** (`<Rodape/>`): assinatura do autor no login, no Hub e nas disciplinas.

Stack: Next.js 15 (App Router) + TypeScript + Tailwind CSS 3 + Framer Motion (via `LazyMotion`, componentes `m.*`) + Lucide + 3Dmol.js + smiles-drawer + Firebase (Auth + Firestore Lite).

## Desempenho (aparelhos simples)

- Gráficos: `<GraficoLinha/>` e `<GraficoBarras/>` em `src/components/charts/GraficoSVG.tsx` (SVG puro). Não adicione bibliotecas de gráficos.
- Animações: use `m.div` etc. (não `motion.div`); o `<LeveProvider/>` carrega só os recursos usados.
- **Modo Leve** (`html.leve`, `src/context/LeveContext.tsx`): liga sozinho em aparelhos fracos e pelo botão da pena. Tira desfoque, brilhos e transições, e o 3D começa parado e sem antialiasing. Elementos decorativos caros levam a classe `decor` (somem no Modo Leve).
- Login: pôsteres em `public/moleculas/*.webp` (gerados do próprio visualizador) aparecem antes do 3D.

## Laboratório Molecular (`/laboratorio`)

Ferramenta de exploração para aula e estudo (exige login verificado), em `src/components/laboratorio/`:
- Busca por nome em português ou inglês (`src/data/nomesQuimicos.ts` + autocomplete do PubChem), SMILES ou CID; o CID das moléculas da galeria é resolvido pela estrutura (SMILES isomérico), nunca pelo nome.
- Galeria offline em `src/data/galeria.ts`, gerada por `scripts/build_galeria.py` (RDKit; rótulos R/S conferidos pelo CIP do RDKit). Com o PubChem disponível, ficha, Lipinski e 3D passam aos dados oficiais; cada painel indica a fonte.
- Medições (distância, ângulo, torção na convenção IUPAC) clicando nos átomos; Modo Projetor; link compartilhável (`?m=g:chave`, `?cid=`, `?smiles=`); Lista da Aula no navegador (`localStorage`) e por link (`?lista=…&t=…`).
- Editor de desenho (`EditorMolecula.tsx`) com a OpenChemLib (BSD-3, versão fixada), carregada sob demanda por `ocl.ts`: geometria pelo ConformerGenerator + MMFF94s+ e propriedades calculadas no navegador (selo "calculado no navegador"); a estrutura desenhada é procurada no PubChem pelo SMILES isomérico. Os dados da biblioteca vão para `public/ocl/` no `prebuild`/`predev` (`scripts/copiar-recursos-ocl.mjs`, fora do Git).
- Fármaco no alvo: 10 complexos do RCSB PDB em `public/complexos/` + `src/data/complexos.ts`, gerados por `scripts/build_complexos.py` (cadeias que tocam o fármaco; sítio ≤ 4,5 Å e ligações de H N/O–N/O ≤ 3,5 Å calculados das coordenadas; organismo, resolução e referência lidos do próprio arquivo PDB). Visualizados por `VisualizadorComplexo.tsx` (fita, sítio, ligações de H, superfície).
- Mapa de cargas: cargas de Gasteiger–Marsili (`cargas.ts`, conferidas contra o RDKit nas 27 moléculas da galeria, erro máx. 0,002 e) na superfície de van der Waals, vermelho δ− → azul δ+; apresentado como aproximação qualitativa do potencial eletrostático.
- O botão "Abrir no Laboratório" aparece só em visualizadores com CID (visão geral das disciplinas), nunca dentro dos jogos, para não revelar respostas.
- Mostra 2D e 3D lado a lado por ser ferramenta livre de exploração; a Regra de Ouro 2D vs. 3D vale para os conteúdos das disciplinas.

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
- A mesma política de senha é exigida no servidor (Authentication → Configurações → Política de senha: "Exigir aplicação").
- Site publicado em https://organicalab.web.app (Hosting do projeto `chempharm-hub`, site `organicalab`); `npm run deploy` publica (antes, `scripts/checar-build.mjs` barra builds sem a configuração do Firebase), e o domínio está em "Domínios autorizados".
- Cabeçalhos de segurança (CSP, X-Frame-Options, HSTS etc.) em `firebase.json`; um domínio externo novo precisa entrar no `connect-src` da CSP.
- Cadastro: nome completo, e-mail, matrícula (aluno: 12 dígitos, ex.: 202012345678; professor/técnico: `00000-0`, ex.: 12345-6 → `perfil: "servidor"`, derivado do formato e conferido em `firestore.rules`; o perfil só identifica, e criar turmas exige aprovação do administrador), senha com 8+ caracteres, maiúscula, minúscula, número e símbolo (`REQUISITOS_SENHA` em `src/lib/validation.ts`).
- Rotas `/hub`, `/organica-1`, `/organica-2`, `/organica-3`, `/analise-organica`, `/laboratorio`, `/conta`, `/professor` e `/admin` exigem login com `emailVerified === true` (`<RequireVerified/>`).
- Perfil no Firestore: `users/{uid}` = `{ nome, email, matricula, perfil, xp, progresso }` (perfis antigos sem `perfil` são de alunos).
- Recuperar senha: "Esqueci minha senha" no login (`sendPasswordResetEmail`), com mensagem neutra que não revela se a conta existe.

## Professores, turmas e administração

- Matrícula de servidor só identifica o perfil. Para criar turmas, o professor pede validação em `/professor` (`verificacoes/{uid}`, com nome, e-mail e matrícula iguais aos do perfil) e o administrador aprova ou recusa em `/admin` (cria `professores/{uid}`; pode revogar com motivo).
- Administradores: documento `admins/{uid}` criado só pelo console do Firestore (nenhuma regra permite escrevê-lo pelo site).
- Turmas: `turmas/{codigo}` (código de 6 caracteres sem 0/O/1/I/L), com `tarefas` ("disciplina/jogo") e `listas` (links internos `/laboratorio?…`). O aluno entra pelo Hub ou pelo convite `/hub?turma=CÓDIGO` e grava `turmas/{codigo}/membros/{uid}` (nome e matrícula copiados do perfil, XP igual ao do perfil); o `AuthContext` sincroniza XP e jogos concluídos 1,5 s depois de cada atualização. O professor vê a tabela de progresso e baixa CSV.
- Toda a lógica fica em `src/lib/turmas.ts`; telas em `src/components/turmas/`. Não existe no Modo Dev.
- Testes das regras: emuladores do Firebase (`NEXT_PUBLIC_FIREBASE_EMULADOR=1` liga o app aos emuladores locais de Auth e Firestore; nunca no build publicado).

## Privacidade (LGPD)

- `/privacidade` (pública, linkada no rodapé e no cadastro) e `/conta`: mostra os dados, baixa um JSON e exclui a conta (pede a senha; apaga participações, turmas próprias, pedido de validação, perfil e login).
- Contato público em `SITE.contato` (`src/config/site.ts`).

## Publicação automática

- `.github/workflows/deploy.yml`: a cada push na `main`, roda typecheck, build e `checar-build.mjs` e publica no Hosting. Precisa do segredo `FIREBASE_SERVICE_ACCOUNT_CHEMPHARM_HUB` no GitHub; sem ele, só valida o build.
- Regras do Firestore são publicadas à mão: `npx firebase-tools deploy --only firestore:rules --project chempharm-hub`.
- App Check ativo com Fraud Defense (antigo reCAPTCHA Enterprise; o reCAPTCHA clássico foi descontinuado no Firebase): chave do site em `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` no `.env`, inicializado antes de Auth e Firestore em `src/lib/firebase.ts`. A CSP libera `www.google.com`, `www.gstatic.com` e `content-firebaseappcheck.googleapis.com`. O selo flutuante fica escondido e o aviso do reCAPTCHA está no `<Rodape/>`. Enforce no Firestore e no Authentication só depois de as métricas mostrarem quase tudo "Verificado".

## Segurança (auditoria de 12/11/2026)

- Sem backend próprio: toda autorização está em `firestore.rules` (negação por padrão, dono por `request.auth.uid`, administrador por `admins/{uid}`, `hasOnly`/`affectedKeys` contra campos extras, tipos e tamanhos validados). Testes no emulador cobrem 63 casos, incluindo IDOR, autoaprovação, XP arbitrário e e-mail falso no cadastro.
- XP: só cresce e no máximo 1000 por gravação; o `AuthContext` grava o perfil em fila, na ordem. Integridade total do XP exigiria Cloud Functions.
- `storage.rules` fecha o Storage (o projeto não recebe uploads; o Storage nem está ativado).
- `.env` versionado contém só valores públicos: a configuração web do Firebase, a chave do site do reCAPTCHA e `NEXT_PUBLIC_FIREBASE_EMULADOR` vazia (o build elimina o código dos emuladores). Modelo em `.env.example`; o `.gitignore` barra JSON de conta de serviço, `.pem` e `.key`.
- `scripts/checar-build.mjs` barra builds com emuladores, chaves privadas ou JSON de conta de serviço.
- Links de listas da turma só são exibidos se forem internos (`linkListaSeguro`, em `src/lib/turmas.ts`).
- Cabeçalhos em `firebase.json`: CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP, CORP e X-Permitted-Cross-Domain-Policies. `'unsafe-inline'` em `script-src` é exigido pelos scripts inline do Next (export estático); não há HTML de usuário renderizado.
- Console: política de senha forte, proteção contra enumeração de e-mails e domínios autorizados configurados. App Check ativo (Fraud Defense); falta só o Enforce.
