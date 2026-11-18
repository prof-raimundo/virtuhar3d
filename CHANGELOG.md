# Changelog — VIRTUHAR3D

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo seguindo o padrão [Conventional Commits](https://www.conventionalcommits.org/).

## [0.3.0] - Fase 5 (MVP Verificado: E2E, WCAG 2.1 AA, Orçamento 3D e Rastreabilidade)

### Adicionado

- Suíte E2E automatizada (`/e2e/virtuhar3d.e2e.spec.ts`, `playwright.config.ts`) cobrindo login, bloqueio e mensagens genéricas, painel do professor (criação de turma e importação em lote), troca obrigatória de senha, missões M00 e M01 completas via bridge de teste 3D e navegação por teclado.
- Auditoria de acessibilidade WCAG 2.1 AA (`@axe-core/playwright`) integrada a todas as telas do MVP com zero violações críticas ou sérias.
- Validador de assets 3D (`/scripts/validate-assets.ts` e `validate-assets.test.ts`) auditando binários GLB, limite de `<= 1,5 MB` por peça, `<= 30 MB` por missão, `<= 100.000` triângulos visíveis, texturas WebP `<= 1024 px`, pontos `ponto_*`, licenças CC0/CC-BY e `textoAlternativo`.
- Matriz e verificador automatizado de rastreabilidade (`scripts/traceability-report.ts` e `docs/rastreabilidade-mvp.md`) para `US-01` a `US-11`, `US-21` e `US-22`.
- Testes unitários complementares no cliente HTTP (`/web/src/api/client.test.ts`), áudio acessível (`/web/src/audio/biosAudio.test.ts`), carregador GLB (`/web/src/three/gltfLoader.test.ts`) e motor de regras (`/rules/src/engine.test.ts`) com limiares de cobertura configurados no Vitest (`>= 90%` em `/rules`, `>= 80%` na API e lógica front).
- Pipeline `.github/workflows/ci.yml` ampliado com `validate:assets`, `test:traceability`, `test:coverage`, `npm audit --omit=dev --audit-level=high` e job Playwright (`chromium` e `firefox`).
- Roteiro operacional completo de servidor local, CA interna, backup `pg_dump`/restauração e rollback em `/docs/operacao/README.md`.

### Corrigido

- Contraste WCAG AA (`>= 4.5:1`) em botões primários (`bg-sky-700`/`bg-emerald-700`) e textos auxiliares das telas do MVP, marcos `<main>`, atributos `role="status"`/`role="img"` em ícones/indicadores e alinhamento de `aria-label` com texto visível no controle de áudio (SC 2.5.3).

## [0.1.0] - Marco M1 (Fases 1 e 2)

### Adicionado

- Estrutura inicial do monorepo (`/web`, `/server`, `/rules`, `/content`, `/docs`, `/infra`).
- Configuração de TypeScript em modo `strict`, ESLint, Prettier e Vitest.
- Docker Compose (`db` PostgreSQL 16, `api`, `nginx` com HTTPS/TLS e cache agressivo) e script de CA interna.
- Schemas Zod do Documento 11 (`pecas.json`, `regras.json`, `missoes/*.json`, `questoes.json`, `insignias.json`) e dados iniciais para a bancada do MVP (M00 e M01).
- Pipeline inicial do GitHub Actions (`.github/workflows/ci.yml`).
- Motor de regras puro (`/rules`) implementado em TDD cobrindo RN-01 a RN-13, árvore de dependências, protocolo ESD e pontuação/níveis.
- Protótipo técnico 3D (`/web`) com R3F/Three.js, `RoomEnvironment`, carregador GLB + `MeshoptDecoder`, realce, encaixe por proximidade (`ponto_*`), mouse + teclado, monitor leve de FPS/triângulos e Modo de Teste 3D (`window.__VIRTUHAR3D_TEST__`).

## [0.2.0-alpha] - Fase 3 (Back-end, Autenticação Segura e Persistência - M2)

### Adicionado

- Migração relacional PostgreSQL (`/server/migrations/001_init.sql`) com versionamento em `schema_migrations`, cobrindo `usuarios`, `turmas`, `matriculas`, `liberacoes`, `sessoes_login`, `sessoes_missao`, `eventos_sessao`, `erros_sessao`, `respostas`, `autoavaliacoes`, `pontuacao_aluno`, `insignias_aluno` e `auditoria`.
- API Fastify (`/server/src/app.ts`, `/server/src/index.ts`) com `GET /api/health`, CORS com credenciais e logger estruturado.
- Autenticação segura (`/server/src/auth.ts`, `/server/src/routes/authRoutes.ts`) com Argon2id, tokens opacos em cookies `HttpOnly`/`Secure`/`SameSite=Lax`, renovação deslizante em 30 min, bloqueio temporário após 5 falhas (`RN-20`) e troca obrigatória de senha provisória (`RN-19`).
- Gestão de contas e turmas (`/server/src/routes/adminProfessorRoutes.ts`): criação de professores (`admin`), criação de turmas com M00/M01 liberadas por padrão, importação em lote de alunos, controle de liberação de missões e painel da turma.
- Motor de sessões e relatórios (`/server/src/routes/missoesSessoesRoutes.ts`): listagem/detalhe de missões, abertura de sessão, ingestão de eventos em lote, cálculo autoritativo de pontuação via `@virtuhar3d/rules`, concessão de insígnias e RBAC estrito (`aluno`, `professor`, `admin`).
- Script de seed idempotente (`/server/src/seed.ts`) e suíte de testes de integração (`/server/src/api.integration.test.ts`).

## [0.3.0-alpha] - Fase 4 (Fluxo Completo do MVP — M00, M01 e Interface Acessível)

### Adicionado

- Telas completas do MVP em HTML/Tailwind sobre o canvas (`LoginScreen`, `TrocaSenhaScreen`, `TopNavBar`, `TrilhaMissoesScreen`, `OrdemServicoScreen`, `BancadaWorkspace`, `RelatorioScreen`, `ProfessorPanelScreen`).
- Integração ponta a ponta das missões M00 (Protocolo ESD, inspeção de placa-mãe e instalação inicial de CPU) e M01 (CPU, pasta térmica, cooler, 2x RAM DDR4, fonte ATX, HDMI, ATX 24P, EPS 8P, chave da fonte, jump PWR_SW e POST no monitor virtual) com a API (`/api/sessoes`, lotes de eventos a cada 5s e conclusão autoritativa com autoavaliação).
- Síntese de bipes via Web Audio API com legendas visuais obrigatórias (`/web/src/audio/biosAudio.ts`) e suporte completo a navegação por teclado e leitores de tela.
- Servidor unificado de desenvolvimento (`/server/src/devPreview.ts`) na porta 3000 servindo Vite + Fastify API na mesma origem.
