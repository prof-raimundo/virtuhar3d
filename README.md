# VIRTUHAR3D

**Laboratório Virtual 3D Educacional de Montagem e Manutenção de Computadores**

Projeto desenvolvido para a disciplina de **Arquitetura e Manutenção de Computadores** (Curso Técnico em Informática Integrado ao Ensino Médio — EEEP Profª. Maria de Jesus R. Alves).

## Estrutura do Monorepo

| Pasta      | Responsabilidade                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `/web`     | Aplicação front-end (React, TypeScript strict, Tailwind CSS, Three.js / R3F)                                      |
| `/server`  | API REST (Node.js, TypeScript strict, Fastify, PostgreSQL)                                                        |
| `/rules`   | Motor de regras puro e isolado (sem dependência de React ou Three.js)                                             |
| `/content` | Catálogo JSON (`pecas.json`, `regras.json`, `missoes/*.json`, `questoes.json`, `insignias.json`) validado via Zod |
| `/docs`    | Especificação técnica e pedagógica completa (`especificacao-completa.md`) e roteiros de operação                  |
| `/infra`   | Configurações do `nginx` com HTTPS local e geração de Autoridade Certificadora interna                            |

## Pré-requisitos

- Node.js 22+
- Docker e Docker Compose (para ambiente local completo com PostgreSQL e nginx HTTPS)

## Comandos Principais

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento (porta 3000)
npm run dev

# Validar todos os arquivos JSON de conteúdo contra os schemas Zod
npm run validate:content

# Verificar formatação, ESLint e TypeScript strict
npm run format:check
npm run lint

# Rodar testes unitários e de integração (Vitest)
npm run test

# Verificar cobertura mínima (>= 90% em /rules e >= 80% na API/lógica)
npm run test:coverage

# Validar orçamento gráfico e integridade dos assets 3D (<= 100k triângulos, <= 30 MB/missão)
npm run validate:assets

# Verificar matriz de rastreabilidade das histórias do MVP (US-01..US-11, US-21, US-22)
npm run test:traceability

# Rodar suíte E2E e auditoria WCAG 2.1 AA (Playwright + axe-core)
npm run test:e2e

# Executar pipeline completo de CI localmente
npm run ci

# Build de produção
npm run build
```

## Ambiente Docker + HTTPS Local

1. Copie `.env.example` para `.env` e ajuste as credenciais locais.
2. Gere os certificados internos para o `nginx`:
   ```bash
   chmod +x infra/nginx/generate-local-ca.sh
   ./infra/nginx/generate-local-ca.sh virtuhar3d.local
   ```
3. Compile o front-end e suba os serviços:
   ```bash
   npm run build
   docker compose up -d --build
   ```

Consulte os roteiros completos de instalação da CA nas estações Kubuntu 26.04, backup `pg_dump`, restauração e rollback em [`docs/operacao/README.md`](./docs/operacao/README.md) e a matriz de testes em [`docs/rastreabilidade-mvp.md`](./docs/rastreabilidade-mvp.md).

## Restrições de Hardware e Qualidade

- Clientes-alvo: Kubuntu 26.04 (Chromium 157.x / Firefox 160.x), Core i3 5ª geração, 4 GB RAM, NVIDIA GT 710 (`>= 30 FPS`).
- Orçamento gráfico: `<= 100.000` triângulos visíveis por cena, texturas WebP `<= 1024 px`, GLB com compressão Meshopt (`<= 1,5 MB`/peça), `<= 30 MB` por missão.
- Acessibilidade WCAG 2.1 AA: interface HTML/Tailwind sobre o canvas 3D, navegação por teclado, legendas visuais para bipes e zero violações críticas/sérias no `axe-core`.
