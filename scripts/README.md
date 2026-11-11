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

- Descobre automaticamente toda pasta com `index.ts` em `supabase/functions/` (ignora `_shared/`), em ordem alfabética.
  Contagem atual: `ls supabase/functions/*/index.ts | wc -l`.
- `--only` aceita CSV (espaços e repetidos são normalizados). Lista vazia, nome inválido ou function inexistente
  abortam antes de qualquer deploy — `--only ""` **não** vira deploy de tudo.
- Lê `verify_jwt` de `supabase/config.toml`: `false` → `--no-verify-jwt`; `true` → padrão da CLI (JWT exigido);
  function sem bloco `[functions.<nome>]` aborta o lote (exit 6) e bloco sem `verify_jwt` recusa só aquela function.
- Aborta (exit 5) se algum secret de `REQUIRED_SECRETS` estiver ausente no destino. Sem a variável, o lote completo
  usa os `supabase_vault` com `required=true` do `env.manifest.json`.
- `STOP_ON_FAIL=1` interrompe no primeiro deploy que falhar e registra as functions não tentadas (retome com `--only`).
- Grava log JSONL em `/tmp/deploy-log-YYYYMMDD-HHMM-<pid>.jsonl` (uma linha por function + resumo);
  `DEPLOY_LOG_DIR` troca a pasta. Sai com 1 se qualquer deploy falhar.

### `migrate-cron-jobs.sh` / `migrate-cron-jobs.sql` — Recriação dos cron jobs

```bash
export DEST_DB_URL="postgresql://postgres:<senha>@db.<ref>.supabase.co:5432/postgres"
export PROJECT_REF=<novo-ref>
export ANON_KEY=<anon-key-do-destino>

./scripts/migrate-cron-jobs.sh --dry-run
./scripts/migrate-cron-jobs.sh
```

- Cada `cron.schedule` é precedido por `unschedule` condicional → **idempotente**.
- O SQL valida, pelo nome, que todos os jobs que ele declara ficaram registrados (13 hoje). O wrapper confere
  `SELECT count(*) FROM cron.job` e falha se o total for menor que o número de `cron.schedule` do SQL.
- Qualquer argumento que não seja `--dry-run`/`--help` aborta (exit 2) — typo não aplica no banco.
- SQL renderizado e log ficam em `${TMPDIR:-/tmp}/cron-final-*.sql` e `cron-apply-*.log`.

### Validação pós-corte

```bash
# functions implantadas (comparar com: ls supabase/functions/*/index.ts | wc -l)
supabase functions list --project-ref $SUPABASE_PROJECT_REF | wc -l

# crons ativos (comparar com: grep -c '^SELECT cron.schedule(' scripts/migrate-cron-jobs.sql)
psql "$DEST_DB_URL" -c "SELECT jobname, active FROM cron.job ORDER BY jobname;"

# smoke test de function pública
curl -sS "https://$SUPABASE_PROJECT_REF.supabase.co/functions/v1/cnpja-lookup" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"cnpj":"00000000000000"}' | head -c 200
```

### Segurança

- **Nunca comitar** `SUPABASE_ACCESS_TOKEN` ou `ANON_KEY`. Use `.env` local não versionado (`.env` já está no `.gitignore`) ou o secret store do CI.
- Ambos os scripts usam `set -euo pipefail` — abortam no primeiro erro.
- `envsubst` é chamado com whitelist explícita (`'${PROJECT_REF} ${ANON_KEY}'`) para não expandir os `$cron$` delimitadores nem outras variáveis do SQL. Quando o SQL usa um desses placeholders, o valor é validado (sem aspas, espaço ou quebra de linha) antes de ser interpolado.

## Outros scripts

- `check-external-secret-isolation.sh` — auditoria de secrets isolados por integração
- `staging-migrate.sh` — orquestrador da promoção para staging (baseline → schema → secrets → functions → crons →
  integrity → healthcheck); `--help` lista as flags. Recusa rodar se o alvo for produção (ref ou URL do banco).
  `STAGING_LOG_DIR` troca a pasta dos JSONL (default `/tmp`).
- `validate-all.sh` — smoke-test de todos os scripts (sintaxe, `--help`, suítes `test_*.py` e `*.unit.mjs`
  descobertas automaticamente); `--fast` pula type-check e suítes.
- `generate-env-manifest.mjs` — gera `env.manifest.json`; `--check` é o gate do CI.
- `mcp-phd-suite.mjs` — suíte de verificação de um Worker MCP (`--help`; padrão read-only).
- `generate-design-audit.js` — inventário das classes Tailwind usadas em `src/` (grava `./design-audit-report.json`)
- `generate-simulation-report.ts` — relatório (somente leitura) da última execução do simulador de webhooks
- `stress-test.ts` — carga de leituras em `profiles` no projeto de `SUPABASE_URL`; recusa o projeto de produção
  sem `STRESS_ALLOW_PRODUCTION=1`
- `run-scenarios.ts` — harness de cenários (`docs/SCENARIOS.md`); `--help`
- `gerar-grafo-arquitetura.ts` — regenera `src/lib/arquitetura/grafo-observado.json`; `--check` só compara
- `simular-observabilidade-digest.ts`, `simular-preferencias-digest.ts`, `simular-projecao-conformidade.ts` —
  simulações determinísticas dos motores de digest/projeção (`bun run scripts/<arquivo>`)

### Testes dos scripts desta pasta

```bash
python3 scripts/test_migrate_functions.py     # migrate-functions.sh (CLI supabase falsa)
python3 scripts/test_migrate_cron_jobs.py     # migrate-cron-jobs.sh/.sql (PF_TEST_PG_URL=<postgres local> liga a integração)
python3 scripts/test_staging_migrate.py       # staging-migrate.sh
python3 scripts/test_validate_all.py          # validate-all.sh
node --test scripts/generate-env-manifest.unit.mjs scripts/generate-design-audit.unit.mjs \
  scripts/mcp-phd-suite.unit.mjs scripts/scripts-ts.unit.mjs   # este último requer bun
```

## Contexto para agentes de IA (branch `contexto`)

Três produtores independentes mantêm o retrato do estado real do projeto, publicado pelo workflow
[`contexto.yml`](../.github/workflows/contexto.yml) na branch gerada **`contexto`** (nunca na `main`):

| Pasta                | Produtor                      | Fonte de verdade                                                                                             |
| -------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `ai-context/`        | `gerar.mjs` (Node, zero deps) | código em `main`: rotas, módulos, hooks, edge functions, grafo, testes, convenções                           |
| `supabase_snapshot/` | `snapshot.py` (psycopg)       | banco OFICIAL `bwwbeyolnnzppeuhgkcd` ao vivo: tabelas, RLS, funções, triggers, cron, lints                   |
| `regras_negocio/`    | `generate.py` + `indice.py`   | regras de negócio: RLS por operação, estados, validações, fórmulas, lacunas e `docs/contexto/regras/manual/` |

Ler o resultado sem trocar de branch:

```sh
git fetch origin contexto
git show origin/contexto:docs/contexto/00-INDEX.md
```

Cada pasta tem README próprio com variáveis, secrets e testes. Regras humanas (prioridade máxima)
ficam em `docs/contexto/regras/manual/*.md` na `main`.
