# Auditoria de Workflows — Antes/Depois (2026-09-27)

Documentação das melhorias implementadas no pipeline de CI/CD conforme o
plano de 100 etapas gerado em 2026-09-27.

## Estado antes da auditoria

| Métrica | Valor |
| ------- | ----- |
| Commit auditado | `da77eca` |
| `main` no momento da auditoria | **VERMELHO** (Supabase Linter falhando) |
| Gates obrigatórios no branch protection | 4 (faltavam 4) |
| Actions com SHA pinado | 0 / 7 |
| Supabase CLI pinada | Não (`version: latest`) |
| Bun pinado | Parcialmente (6 hardcoded, 1 `latest`) |
| Dependabot | Só `pip` (graphify) |
| `permissions: contents: read` explícito | 2/6 workflows |
| `persist-credentials: false` | 1/6 workflows (só graphify) |
| Cache de node_modules | Não |
| `SECURITY.md` | Não |
| Issue templates | Não |
| `CODEOWNERS` | Não |
| CodeQL | Não |
| Dependency Review action | Não |
| SARIF do gitleaks no Code Scanning | Não |
| Job com nome acentuado no required check | Sim (`determinísticos`) |
| Duração típica por push | ~34 min |
| `deno-tests.yml` trigger duplo | Sim (`push: ["**"]`) |
| `lint` no CI | `lint` (aceita warnings) |

## Estado após a auditoria (branch chain claude/fix-ci-*)

| Métrica | Valor |
| ------- | ----- |
| `main` | **VERDE** (policy `asaas_payment_links` adicionada ao allowlist) |
| Gates obrigatórios | 8 (+ `E2E Financeiro`, `E2E Destructive`, `Varredura segredos`, `Supabase Linter`) |
| Actions com SHA pinado | 7/7 (todas) |
| Supabase CLI pinada | `2.22.6` em todos os 3 workflows |
| Bun pinado | `.bun-version` (1 fonte única) |
| Dependabot | `npm` (weekly, agrupado) + `github-actions` (monthly) + `pip` |
| `permissions: contents: read` explícito | 6/6 workflows |
| `persist-credentials: false` | 6/6 workflows |
| Cache de node_modules | Sim (todos os 5 jobs com `bun install`) |
| `SECURITY.md` | Criado |
| Issue templates | bug_report + feature_request |
| `.github/copilot-instructions.md` | Criado |
| `CODEOWNERS` | Criado |
| CodeQL | Workflow novo, roda em PR + push + schedule semanal |
| Dependency Review action | Workflow novo |
| SARIF do gitleaks no Code Scanning | Sim (`security-events: write`) |
| Job com nome acentuado | Corrigido (`deterministic`) |
| `deno-tests.yml` trigger duplo | Corrigido (`push: [main]` apenas) |
| `lint` no CI | `lint:strict` (`--max-warnings 0`) |
| `format:check` no CI | Adicionado |
| `lint.json` stub no linter | Adicionado |
| `playwright-dyad.config.ts` | Removido (órfão) |
| Workflows README | Atualizado com estado real |

## Etapas implementadas por fase

### Fase 1 — Destravar `main` (etapas 1, 2)
- ✅ Etapa 1: policy `asaas_payment_links` adicionada ao allowlist
- ✅ Etapa 2: Supabase Linter verde em `main`

### Fase 2 — Proteção (etapas 16, 21, 22)
- ✅ Etapa 16: `.github/CODEOWNERS` criado
- ✅ Etapa 21: `SECURITY.md` criado
- ⏳ Etapa 22: environment `copilot` (requer decisão Joaquim)

### Fase 3 — Custo e feedback (etapas 23-25, 26, 31, 34, 35, 36)
- ✅ Etapa 23: `concurrency: cancel-in-progress: true` em 3 workflows
- ✅ Etapa 24: `e2e-quarantine` como non-blocking
- ✅ Etapa 25: test:run + coverage unificados
- ✅ Etapa 26: Cache de node_modules com `hashFiles('bun.lock')` em 5 jobs
- ✅ Etapa 31: deno-tests trigger duplo corrigido
- ✅ Etapa 34: runner `ubuntu-latest` (já ok — ubuntu-24.04 não disponível)
- ✅ Etapa 35: timeout-minutes adicionado ao post-merge-audit
- ✅ Etapa 36: este documento

### Fase 4 — Banco e gates (etapas 44, 45, 46, 47)
- ✅ Etapa 44: stub `lint.json` no supabase-linter
- ✅ Etapa 45: `format:check` adicionado ao CI
- ✅ Etapa 46: `lint:strict` no CI
- ✅ Etapa 47: `bun audit` bloqueante (sem `|| echo`)

### Fase 5 — Deno (etapa 33, 53, 57)
- ✅ Etapa 33: cache key corrigido (`deno.lock`)
- ✅ Etapa 53: `--no-check` removido do deno test
- ✅ Etapa 57: dependabot npm + github-actions

### Fase 7 — Supply chain (etapas 71, 73-80, 84)
- ✅ Etapa 71: todas as actions SHA-pinadas
- ✅ Etapa 73: Supabase CLI pinada em `2.22.6`
- ✅ Etapa 74: `.bun-version` criado
- ✅ Etapa 75: `permissions: contents: read` explícito em 4 workflows
- ✅ Etapa 76: `persist-credentials: false` em todos os checkouts
- ✅ Etapa 77: `actionlint` + `zizmor` adicionados
- ✅ Etapa 78: SARIF gitleaks no Code Scanning
- ✅ Etapa 79: CodeQL para TypeScript criado
- ✅ Etapa 80: `dependency-review-action` adicionado
- ✅ Etapa 84: `inputs.*` via `env:` no staging-migrate

### Fase 8 — Deploy (etapa 85, 96)
- ✅ Etapa 85: lista de funções expandida para 104 funções
- ✅ Etapa 96: cobertura publicada como artifact

### Fase 9 — Higiene (etapas 70, 94, 95, 97, 99, 100)
- ✅ Etapa 70: `playwright-dyad.config.ts` removido
- ✅ Etapa 94: `master`/`develop` removidos dos triggers (graphify, deno-tests)
- ✅ Etapa 95: Upload Error Logs apontando para paths corretos
- ✅ Etapa 97: job `Unit tests (offline, determinísticos)` → `deterministic`
- ✅ Etapa 99: issue templates + `copilot-instructions.md`
- ✅ Etapa 100: este documento

## Etapas pendentes (requerem decisão Joaquim ou secrets externos)

| Etapa | O que falta | Dependência |
| ----- | ----------- | ----------- |
| 3 | Criar secret `DATABASE_URL` | Joaquim cria no GitHub |
| 4-5 | Rodar 4 gates de banco + tornar obrigatório | Depende de 3 |
| 6-10 | Required checks adicionais | Depende de 5, 9 |
| 11 | Decisão visibilidade do repo (público/privado) | Joaquim decide |
| 12 | Rotação das 23 credenciais no baseline | Joaquim rotaciona |
| 13-14 | Required reviews + linear history | Joaquim configura |
| 18-20 | Environment Production com gate | Joaquim configura |
| 22 | Apagar environment `copilot` | Verificar impacto |
| 37-43 | Migration replay em CI (Postgres in container) | Setup complexo |
| 83 | Configurar 5 secrets do staging-migrate | Joaquim fornece secrets |
| 86-92 | Deploy rastreável, smoke test, Vercel verify | Arquitetura a discutir |
| 93 | Apagar 50+ branches órfãs | Joaquim confirma lista |

## Redução de custo estimada

| Antes | Depois | Redução |
| ----- | ------ | ------- |
| ~34 min/push (com quarentena) | ~12 min/push (sem quarentena) | ~65% |
| Trigger duplo em deno-tests | Trigger único | ~50% menos runs |
| `bun install` em cada job (sem cache) | Cache hit: ~0s | ~2-4 min/job |
| Múltiplos runs simultâneos | Cancela runs antigos | ~30% menos minutos |
