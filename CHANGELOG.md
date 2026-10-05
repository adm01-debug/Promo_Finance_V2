# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Security

- CORS: substituído `Access-Control-Allow-Origin: *` por allowlist em todas as Edge Functions
  (`_shared/cors.ts` com `corsHeadersPara(req)`); origens configuráveis via `ALLOWED_ORIGINS`
- `health/` reduzido a liveness mínimo — removidos client SERVICE_ROLE, versão do runtime
  e sondagem de APIs externas da resposta pública
- CSP promovida de `Content-Security-Policy-Report-Only` para enforce no `vercel.json`
- Validação de magic bytes nos uploads de arquivo (bloqueia poliglotos/executáveis disfarçados)

### Added

- Correlation id (`x-request-id`) propagado entre Edge Functions e persistido em `edge_function_logs`
- CI: gate de `deno check` nas funções endurecidas, lint Deno em escopo e testes Deno completos
- CI: regeneração semanal de `src/integrations/supabase/types.ts` com PR automático em drift
- CI: checagem de paridade migrations↔schema (`supabase db diff`) e gate de formatação em arquivos alterados
- Runbooks operacionais: DR/backup (`docs/runbooks/`), uptime externo e matriz papel×rota×tabela
- Overlay `strictNullChecks` progressivo em `src/lib` (`tsconfig.strict.json` + `type-check:strict`)
- `vendor/xlsx-0.20.3.tgz` — SheetJS vendored (sha512 verificado) eliminando dependência de CDN no install

### Changed

- ESLint 9 (flat config madura) + plugins atualizados; `bun audit fix` zerou vulnerabilidades transitivas
- Logger estruturado `_shared/observability.ts` adotado nas Edge Functions (sweep console.\* → createLogger)
- AGENTS.md: fluxo de commit sem `--no-verify` (hooks husky obrigatórios no fluxo normal)
- Documentos de auditoria/planos históricos movidos para `docs/archive/`; scripts SQL ad-hoc em `docs/archive/sql/`

### Removed

- `e2e-tests/` (spec órfã duplicada por `e2e/auth/login.e2e.ts`)

### Added (anterior)

- Auditoria técnica R2 com validação live (`docs/archive/AUDITORIA_TECNICA_EXAUSTIVA_2026-09-02_R2_LIVE.md`) — nota 5.8/10, achado central: malha de validação live do banco inoperante (token expirado + `DATABASE_URL` ausente)
- Branch protection em `main` (Quality Gate + E2E Critical + Deno Tests obrigatórios)
- Sistema completo de testes (unit + E2E)
- Dark mode com ThemeProvider
- Skeleton loading states
- Empty states
- Animações com Framer Motion
- Sentry monitoring completo
- Service Worker Workbox
- Acessibilidade WCAG 2.1 AA
- CI/CD GitHub Actions
- Docker multi-stage
- Documentação técnica completa

### Changed

- Refatoração de componentes grandes
- Performance otimizada (bundle < 500KB)
- Coverage de testes 2% → 20%

### Fixed

- CLAUDE.md atualizado com números reais (105 edge functions, 571+ migrations, meta 2689 testes, `calculo-iva`)
- Lockfiles consolidados em `bun.lock` único (removidos `bun.lockb` e `package-lock.json` divergentes; supabase-js 2.87.1 × 2.110.9)
- Segurança: .env removido do repositório
- ESLint warnings
- TypeScript strict errors

## [1.0.0] - 2025-01-15

### Added

- Sistema completo de contas a pagar/receber
- Conciliação bancária com IA
- Geração de boletos
- Emissão de NFe (SEFAZ)
- Dashboard executivo
- Análise preditiva de inadimplência
- Integração Bitrix24
- Integração Open Finance
- PWA completo
- Real-time updates

### Technical

- React 18 + TypeScript 5
- Supabase backend
- 50 tabelas PostgreSQL
- 14 Edge Functions
- 27 páginas
- 197 componentes
- RLS implementado

## [0.1.0] - 2024-12-14

### Added

- Projeto inicial
- Setup básico
- Autenticação
- Estrutura de componentes

---

## Categorias

- **Added** - Novas funcionalidades
- **Changed** - Mudanças em funcionalidades existentes
- **Deprecated** - Funcionalidades obsoletas
- **Removed** - Funcionalidades removidas
- **Fixed** - Correções de bugs
- **Security** - Vulnerabilidades corrigidas
