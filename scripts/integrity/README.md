# Integrity Suite

Testes pós-deploy contra o projeto Supabase de **staging**. Executados via `run.sh` ou pelo orquestrador `../staging-migrate.sh`.

## Estrutura

| Arquivo | O que valida |
|---|---|
| `01_schema.sql` | Contagens de tabelas/views/índices/funções/policies, extensões, partições mensais |
| `02_rls.sql` | RLS habilitado em 100%, sem policies `true`, tabelas escopadas referenciam `auth.uid`/`has_role`, views com `security_invoker=true` |
| `03_grants.sql` | `anon` só com `SELECT` em whitelist; `service_role` com privilégios completos; `authenticated` com `SELECT` onde há policy |
| `04_endpoints.sh` | Smoke HTTP das Edge Functions críticas (`health`, `cnpja-lookup`, `expert-agent`, `asaas-webhook`, `evaluate-delivery-alerts`, `get-mapbox-token`) |
| `05_crons.sql` | 14 jobs ativos, schedules batendo com o baseline, execução recente do job de 1 min |
| `run.sh` | Executa 01–05 e agrega JSONL. Exit code = número de fails |
| `dump-baseline.sh` | Regera `baseline/*.json` a partir de `PROD_DB_URL` (somente leitura) |

## Rodar manualmente

```bash
export STAGING_DB_URL=... STAGING_PROJECT_REF=... STAGING_ANON_KEY=...
export TEST_ADMIN_JWT=...  # opcional — sem ele, endpoints autenticados ficam "unverified"
bash scripts/integrity/run.sh
```

Status possíveis: `pass`, `fail`, `unverified`. `unverified` nunca é declarado como aprovado — o relatório mostra separadamente.

## Baselines

Arquivos em `baseline/` são **versionados**. Qualquer PR que altere schema/RLS/GRANT deve regerar via `dump-baseline.sh` e commitar as mudanças no mesmo PR, caso contrário staging quebra.

A `allowed-public-tables.json` é uma whitelist **manual** — só tabelas explicitamente públicas (catálogo, health, etc.). Nunca sobrescrita pelo dump.
