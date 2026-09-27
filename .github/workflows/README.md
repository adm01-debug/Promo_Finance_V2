# GitHub Actions — Workflows do Promo Finance V2

Referência viva dos 8 workflows ativos. Atualizada em 2026-09-27.

---

## Visão geral

| Arquivo | Trigger | Gate obrigatório? | Duração típica |
| ------- | ------- | ----------------- | -------------- |
| `ci.yml` | push + PR → `main` | Sim (7 checks) | ~12 min |
| `deno-tests.yml` | push `main` + PR → `main` | Sim (unit-tests) | ~8 min |
| `supabase-linter.yml` | push/PR que toca banco | Sim (adicionado ao required) | ~5 min |
| `codeql.yml` | push `main` + PR → `main` + schedule semanal | Não (SARIF → Security tab) | ~15 min |
| `dependency-review.yml` | PR → `main` | Não (informativo) | ~1 min |
| `functions-deploy.yml` | `workflow_dispatch` (somente `main`) | N/A (manual) | ~5 min |
| `staging-migrate.yml` | `workflow_dispatch` | N/A (manual) | ~10 min |
| `graphify.yml` | push `main` + schedule semanal | Não | ~5 min |

---

## `ci.yml` — Pipeline principal

### Required checks (branch protection de `main`)

| Check | Job | O que valida |
| ----- | --- | ------------ |
| `Quality Gate & Tests` | `quality-gate` | lint, type-check, unit tests, cobertura, build, gates de banco |
| `E2E Critical Gate` | `e2e-critical` | telas críticas (autenticação, RBAC, pagamentos) |
| `E2E Destructive Logout` | `e2e-destructive` | fluxos de logout e revogação de sessão |
| `E2E Financeiro (offline)` | `e2e-financeiro` | telas financeiras sem dependência de prod |
| `Varredura de segredos (gitleaks)` | `secret-scan` | segredos commitados |
| `Supabase DB Linter` | `supabase-linter` job do `supabase-linter.yml` | RLS, GRANTs, policies |
| `Unit tests (offline, deterministic)` | `unit-tests` do `deno-tests.yml` | lógica Deno isolada |

### Secrets necessários

| Secret | Usado por | Onde definir |
| ------ | --------- | ------------ |
| `SUPABASE_ACCESS_TOKEN` | `quality-gate`, `supabase-linter`, `functions-deploy` | Environment `Production` |
| `DATABASE_URL` | gates de banco em `quality-gate` | Repo secret |
| `VITE_SUPABASE_URL` | `integration-tests` em `deno-tests.yml` | Repo secret |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `integration-tests` em `deno-tests.yml` | Repo secret |

Se `DATABASE_URL` estiver ausente, os 4 gates de banco registram um aviso e
`quality-gate` passa mesmo assim (comportamento documentado, não recomendado —
ver etapas 3–5 do plano de hardening).

### E2E Quarantine

Job `e2e-quarantine` **não é gate obrigatório**. Roda sempre (mesmo se jobs
anteriores falharem), usa 1 worker paralelo e publica o resultado no
step summary. Contém specs em migração para o modo offline.

---

## `deno-tests.yml` — Testes das Edge Functions Deno

Dois jobs:

1. **`unit-tests`** (offline, deterministic) — 53+ testes em funções SSO, SEFAZ e core.
   Gate obrigatório.

2. **`integration-tests`** — bate nas edge functions publicadas em produção.
   Se `VITE_SUPABASE_URL` ou `VITE_SUPABASE_PUBLISHABLE_KEY` estiverem ausentes,
   o job **falha** (`require-env.sh` com modo `fail`). Não é gate obrigatório.

---

## `supabase-linter.yml` — Linter do banco canônico

Valida o banco de **produção** (`bwwbeyolnnzppeuhgkcd`) contra regras de RLS,
GRANTs e policies. Falha o build se o linter reportar `ERROR`.

**Atenção:** valida o estado atual de produção, não o diff da PR. Para proteção
na PR, use o gate offline em `test-canonical-db-gates.test.mjs` (já no `ci.yml`).

Requer `SUPABASE_ACCESS_TOKEN` e `vars.VITE_SUPABASE_PROJECT_ID`.

---

## `codeql.yml` — Análise de segurança estática

Analisa TypeScript/JavaScript com o CodeQL. Detecta injection, path traversal,
XSS e ~75 outras classes. Resultados ficam na aba **Security → Code scanning alerts**.

Não bloqueia merge — é informativo. Roda também toda segunda-feira às 03:17 UTC.

---

## `functions-deploy.yml` — Deploy manual de Edge Function

Deploy **controlado** de uma única função aprovada. Só roda a partir de `main`
(verificação por `if: github.ref == 'refs/heads/main'`).

Disponível via **Actions → Deploy controlado de Edge Function → Run workflow**.

---

## `staging-migrate.yml` — Migração de schema para staging

Propaga migrations e funções de produção para o banco de staging. Manual.

Requer 5 secrets no repositório: `PROD_DB_URL`, `STAGING_DB_URL`,
`STAGING_PROJECT_REF`, `STAGING_ANON_KEY`, `TEST_ADMIN_JWT`.

---

## `graphify.yml` — Grafo de conhecimento do codebase

Gera o Knowledge Graph em `graphify-out/`. Roda em push em `main` e
semanalmente (terças 02:00 UTC). Resultados visíveis em `graphify-out/GRAPH_REPORT.md`.

---

## Supply chain

Todas as actions são pinadas por SHA de commit (não por tag mutável):

```yaml
uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5
uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2
uses: supabase/setup-cli@1dedf2c611547ede7232d26866dd3c56ab903bbb # v1
uses: github/codeql-action/init@28deaed4a8e2e5ec09e15a4fe47ffc84ca4faeff # v3.28.1
```

Versão do Bun gerenciada em `.bun-version` (atualmente `1.3.11`).
Versão do Supabase CLI: `2.22.6`.

Para atualizar: edite o SHA + o comentário de versão e abra PR.
