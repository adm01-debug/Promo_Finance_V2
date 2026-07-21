# Healthcheck pós-corte

Valida **em execução real** que o ambiente recém-migrado consegue: receber webhooks,
executar crons, entregar eventos por Realtime e propagar eventos internos. Complementa
`scripts/integrity/` (que testa estrutura: RLS, grants, schema).

## Scripts

| Arquivo | Check | O que valida |
|---|---|---|
| `scripts/healthcheck/run.sh` | orquestrador | Roda os 4 checks, agrega JSONL, exit code = nº de fails |
| `01_webhooks.sh` | webhooks | POST válido → 2xx, POST inválido → 401/403, persistência em `webhooks_log`, DLQ vazia |
| `02_crons.sql` | crons | `cron.job` ativo + execuções recentes em `cron.job_run_details`; falhas nos últimos 15 min → `fail` |
| `03_realtime.mjs` | realtime | Assina `postgres_changes` em `webhook_events` e `alerts`, insere linha sintética via service_role, mede latência (5s de teto) |
| `04_events.sh` | event bus | Publica evento em `webhook_events`, aguarda propagação para `n8n_dispatch_logs` / `alerts` (30s) |

## Execução

```bash
export STAGING_DB_URL=... STAGING_PROJECT_REF=... STAGING_ANON_KEY=...
export STAGING_SERVICE_ROLE_KEY=...  # necessário para 03_realtime.mjs
export ASAAS_WEBHOOK_TOKEN=...       # opcional; sem ele, webhook.valid = unverified
bash scripts/healthcheck/run.sh
```

Já integrado ao pipeline: rodar `scripts/staging-migrate.sh` executa healthcheck após
`integrity` (opt-out via `--skip-healthcheck`).

## Guard-rails

- Aborta se `STAGING_PROJECT_REF == PROD_PROJECT_REF`.
- Todo dado sintético carrega `healthcheck_run_id = $RUN_ID` (UUID por run) em
  `raw_payload` / `metadata` / `payload`.
- `trap cleanup EXIT` em `run.sh` remove **todas** as linhas com esse marker de
  `webhook_events`, `webhooks_log`, `alerts` e `n8n_dispatch_logs`.
- Só roda contra staging — jamais em produção.

## Status por assertion

- `pass` — condição observada dentro do orçamento de tempo.
- `fail` — comportamento incorreto (webhook rejeitou payload válido, cron falhou,
  realtime não entregou, evento não propagou). Trava o pipeline.
- `unverified` — não foi possível executar (secret ausente, cron de baixa
  frequência sem execução na janela, service_role indisponível). **Nunca conta
  como aprovação**, mas não trava — é sinal para provisionar o pré-requisito.

## Interpretação rápida de falhas

| Assertion | Causa provável | Correção |
|---|---|---|
| `webhooks.<name>.valid fail http=000` | Function não deployada em staging | Rodar `migrate-functions.sh` |
| `webhooks.<name>.valid fail http=5xx` | Secret do provedor ausente ou runtime error | `supabase functions logs <name>` |
| `webhooks.<name>.invalid fail` | Function aceita payload inválido — falha de segurança | Corrigir validação HMAC/token |
| `webhooks.<name>.persisted fail` | Function respondeu 200 mas não gravou em `webhooks_log` | Bug no handler |
| `webhooks.<name>.dlq_clean fail` | Payload sintético acabou na DLQ | Investigar processador async |
| `crons.<jobname> fail failures=N` | Cron rodou e falhou nos últimos 15 min | Ver `return_message` no detail |
| `crons.<jobname> unverified` | Cron de baixa frequência sem execução na janela | Aceitável; rerodar em janela maior se dúvida |
| `realtime.<table> fail timeout` | Realtime não publica esta tabela | `ALTER PUBLICATION supabase_realtime ADD TABLE ...` |
| `events.publish.webhook_events fail` | Grant/RLS bloqueou insert com service_role | Revisar policies |
| `events.propagate.* unverified` | Evento sintético não dispara consumer para esse `event_type` | Esperado; para validar consumers, publicar payload real do provedor |

## Baseline

`scripts/healthcheck/baseline/expected-webhooks.json` lista os endpoints alvos,
método de autenticação, fixture e limites. Alterar somente via PR revisado.

Fixtures em `scripts/healthcheck/fixtures/*.json` — sem PII real; `__RUN_ID__` e
`HC_PLACEHOLDER` são substituídos em runtime pelo `run_id` gerado.
