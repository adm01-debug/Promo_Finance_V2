# Runbook — Migração para Staging

Automação end-to-end para promover o projeto Supabase de produção para um ambiente **staging** isolado, com validação pós-deploy que trava o pipeline se schema, RLS ou endpoints críticos divergirem.

Complementa:
- `MIGRATION_CHECKLIST.md` (§7 — passo a passo manual)
- `scripts/migrate-functions.sh`, `scripts/migrate-cron-jobs.sh` (§8 do RUNBOOK)

---

## 1. Pré-requisitos

- Projeto Supabase de staging **já provisionado** (o fluxo não cria projeto)
- Secrets do repositório GitHub configurados:
  - `PROD_DB_URL` — connection string somente-leitura da produção (para baselines)
  - `STAGING_DB_URL` — connection string do staging (service_role)
  - `STAGING_PROJECT_REF` — ref curto do projeto staging
  - `STAGING_ANON_KEY` — anon key do staging
  - `SUPABASE_ACCESS_TOKEN` — token do CLI Supabase
  - `TEST_ADMIN_JWT` (opcional) — JWT admin de teste no staging
- Variáveis do repositório:
  - `REQUIRED_SECRETS` (CSV) — nomes de secrets que devem existir no staging
  - `PROD_PROJECT_REF` — guard-rail contra deploy acidental em produção

---

## 2. Fluxo

```text
preflight → baseline → schema → secrets → functions → crons → integrity → summary
```

Detalhes por etapa: `scripts/staging-migrate.sh` (comentários no topo do arquivo).

### Flags

| Flag | Efeito |
|---|---|
| `--dry-run` | Todas as etapas em preview — nada é escrito em staging |
| `--skip-baseline` | Usa `scripts/integrity/baseline/*.json` já commitados |
| `--only-integrity` | Pula schema/functions/crons e roda só os testes |
| `--skip-schema` | Pula `supabase db push` e o pós-schema (`maintain_monthly_partitions`, `ANALYZE`) |
| `--skip-functions` | Pula o redeploy das Edge Functions |
| `--skip-crons` | Pula a recriação dos cron jobs |

### Execução manual

```bash
export PROD_DB_URL=... STAGING_DB_URL=... STAGING_PROJECT_REF=...
export STAGING_ANON_KEY=... SUPABASE_ACCESS_TOKEN=...
export REQUIRED_SECRETS="LOVABLE_API_KEY,MAPBOX_TOKEN,RESEND_API_KEY"
bash scripts/staging-migrate.sh --dry-run
```

### Sequência segura recomendada

1. `bash scripts/staging-migrate.sh --dry-run --skip-baseline`
2. `bash scripts/staging-migrate.sh --only-integrity`
3. `bash scripts/staging-migrate.sh --skip-functions --skip-crons`
4. `bash scripts/staging-migrate.sh --skip-schema --skip-crons`
5. `bash scripts/staging-migrate.sh --skip-schema --skip-functions`

Essa separação reduz o raio de blast: schema, functions e crons podem ser promovidos e auditados em ondas independentes.

### Execução via GitHub Actions

Aba **Actions → staging-migrate → Run workflow**. Inputs: `refresh_baseline`, `only_integrity`, `dry_run`. Artefatos JSONL ficam por 30 dias.

---

## 3. Suite de integridade (`scripts/integrity/`)

Cada assertion emite uma linha JSON com `{step, assertion, status, expected, actual, detail}`. Status possíveis:

- `pass` — condição satisfeita
- `fail` — divergência real; trava o pipeline
- `unverified` — não foi possível executar (ex.: `TEST_ADMIN_JWT` ausente). **Nunca conta como aprovação.**

Exit code do `run.sh` = número de `fail`. `unverified` não falha, mas fica visível no relatório e no artefato do workflow.

### Interpretação rápida das falhas

| Assertion | Causa provável | Correção |
|---|---|---|
| `schema.tables_count` diferente | Migration esquecida ou baseline desatualizado | Rodar `dump-baseline.sh` ou aplicar migration faltando |
| `schema.monthly_partitions` fail | `maintain_monthly_partitions()` não rodou | Executar manualmente ou verificar cron |
| `rls.all_tables_have_rls` fail | Nova tabela sem `ENABLE ROW LEVEL SECURITY` | Criar migration corrigindo — obrigatório |
| `rls.no_overpermissive_true` fail | Policy nova com `USING (true)` para anon/authenticated | Restringir com `auth.uid()` ou `has_role()` |
| `rls.user_scoped_reference_auth` fail | Tabela sem policy referenciando `auth.uid`/`has_role` | Adicionar policy escopada ou incluir em `allowed-public-tables.json` (com justificativa) |
| `grants.anon_scope` fail | anon recebeu INSERT/UPDATE/DELETE indevido | Revogar privilégios extras |
| `grants.service_role_full` fail | Nova tabela sem GRANT ALL para `service_role` | Adicionar GRANT no mesmo migration da CREATE TABLE |
| `endpoints.*` retorna 000/500 | Function não deployada, secret faltando ou erro interno | Ver logs da function em staging |
| `crons.all_expected_present` fail | `migrate-cron-jobs.sh` falhou ou baseline desatualizado | Regenerar baseline após ajustar cron.job |

### Contrato explícito de `verify_jwt`

O deploy de functions agora falha fechado se alguma das `102` Edge Functions não tiver um bloco explícito em `supabase/config.toml`.

- Sem bloco `[functions.<nome>]` o deploy é recusado.
- Sem `verify_jwt = true|false` explícito o deploy é recusado.
- O script não assume mais `--no-verify-jwt` como fallback.

Isso evita que um redeploy em massa torne pública uma função que o ambiente remoto atualmente protege na borda.

---

## 4. Baselines

Arquivos versionados em `scripts/integrity/baseline/`:

- `schema-counts.json` — contagens do schema public em prod
- `expected-policies.json` — nº de policies por tabela em prod
- `expected-crons.json` — jobname + schedule dos crons ativos em prod
- `allowed-public-tables.json` — **whitelist manual** de tabelas realmente públicas (curada em revisão de código)

**Regra:** qualquer PR que altere schema/RLS/GRANT deve regerar baselines (`bash scripts/integrity/dump-baseline.sh`) e commitar no mesmo PR. Caso contrário, staging quebra e o CI reprova.

---

## 5. Segurança

- Guard-rail no `preflight` aborta se `STAGING_PROJECT_REF == PROD_PROJECT_REF`
- `PROD_DB_URL` é usado exclusivamente em `SELECT` (dump-baseline)
- Todos os scripts com `set -euo pipefail` e `psql -v ON_ERROR_STOP=1`
- `TEST_ADMIN_JWT` é criado como usuário isolado do staging — nunca reutilizar credencial de produção
- GitHub Actions redige valores de `secrets.*` no log
- Os probes HTTP de integridade refletem o runtime atual: `health` exige bearer, `cnpja-lookup` rejeita sem bearer, `asaas-webhook` rejeita sem token com `403`, `bling-webhook` rejeita sem credencial com `401`.

---

## 6. Perguntas frequentes

**A suite pode rodar em produção?** Não. Endpoints e crons são checados no staging. `PROD_DB_URL` é somente leitura.

**Como incluir uma tabela nova de catálogo público?** Adicionar em `allowed-public-tables.json` (com comentário/link para PR) e commitar junto com a migration.

**Por que `unverified` e não `warning`?** Para respeitar a diretriz de nunca declarar sucesso sem execução real (ex.: sem JWT válido não há como afirmar 200 no endpoint autenticado).
