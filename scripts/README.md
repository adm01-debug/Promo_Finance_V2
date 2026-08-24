# scripts/

Utilitários operacionais do projeto.

## Migração para novo projeto Supabase

Sequência recomendada para clonar o backend inteiro em um projeto Supabase novo:

1. **Schema + RLS + índices** → seguir [`docs/MIGRATION_CHECKLIST.md`](../docs/MIGRATION_CHECKLIST.md) (fases 1–8).
2. **Secrets** → criar manualmente no vault do destino conforme [`docs/RUNBOOK.md §6`](../docs/RUNBOOK.md).
3. **Edge Functions** → `./scripts/migrate-functions.sh`
4. **Cron jobs** → `./scripts/migrate-cron-jobs.sh`

Ordem é obrigatória: crons dependem de funções PL/pgSQL (schema) e de HTTP para Edge Functions (deploy).

---

### `migrate-functions.sh` — Deploy em lote das Edge Functions

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
export SUPABASE_PROJECT_REF=<novo-ref>
export REQUIRED_SECRETS="LOVABLE_API_KEY,RESEND_API_KEY,MAPBOX_ACCESS_TOKEN"

# preview
./scripts/migrate-functions.sh --dry-run

# execução
./scripts/migrate-functions.sh

# subset
./scripts/migrate-functions.sh --only cnpja-lookup,health
```

- Descobre automaticamente as 87 funções em `supabase/functions/` (ignora `_shared/`).
- Lê `verify_jwt` de `supabase/config.toml` e escolhe `--verify-jwt` ou `--no-verify-jwt`.
- Aborta se algum secret listado em `REQUIRED_SECRETS` estiver ausente no destino.
- Grava log JSONL em `/tmp/deploy-log-YYYYMMDD-HHMM.jsonl` (uma linha por function + resumo).

### `migrate-cron-jobs.sh` / `migrate-cron-jobs.sql` — Recriação dos 13 cron jobs

```bash
export DEST_DB_URL="postgresql://postgres:<senha>@db.<ref>.supabase.co:5432/postgres"
export PROJECT_REF=<novo-ref>
export ANON_KEY=<anon-key-do-destino>

./scripts/migrate-cron-jobs.sh --dry-run
./scripts/migrate-cron-jobs.sh
```

- Cada `cron.schedule` é precedido por `unschedule` condicional → **idempotente**.
- Ao final, valida `SELECT count(*) FROM cron.job` e falha se ≠ 13.

### Validação pós-corte

```bash
# 87 functions
supabase functions list --project-ref $SUPABASE_PROJECT_REF | wc -l

# 13 crons ativos
psql "$DEST_DB_URL" -c "SELECT jobname, active FROM cron.job ORDER BY jobname;"

# smoke test de function pública
curl -sS "https://$SUPABASE_PROJECT_REF.supabase.co/functions/v1/cnpja-lookup" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"cnpj":"00000000000000"}' | head -c 200
```

### Segurança

- **Nunca comitar** `SUPABASE_ACCESS_TOKEN` ou `ANON_KEY`. Use `.env` local não versionado (`.env` já está no `.gitignore`) ou o secret store do CI.
- Ambos os scripts usam `set -euo pipefail` — abortam no primeiro erro.
- `envsubst` é chamado com whitelist explícita (`'${PROJECT_REF} ${ANON_KEY}'`) para não expandir os `$cron$` delimitadores nem outras variáveis do SQL.

## Outros scripts

- `check-external-secret-isolation.sh` — auditoria de secrets isolados por integração
- `generate-design-audit.js` — relatório de tokens semânticos vs. cores hard-coded
- `generate-simulation-report.ts` — geração de relatório de simulações tributárias
- `stress-test.ts` — cenários de carga para endpoints críticos
