---
name: Governança de retenção de dados (Gate #35)
description: Política de TTL declarativa em retencao_politicas, rotina data-driven cleanup_log_tables e gate de CI para tabelas de log sem retenção
type: feature
---

# Gate #35 — Retenção de dados

## Regra
Toda tabela do schema `public` cujo nome case com o padrão log-like
(`_log`, `_logs`, `_history`, `historico_`, `_snapshots`, `_events`, `_eventos`,
`_attempts`, `_trail`, `auditoria_`, `_audit`, `telemetr`, `_cache`, `_runs`,
`_queue`) e que possua coluna temporal DEVE ter uma linha em
`public.retencao_politicas`:

- **TTL**: `dias >= 1` + `coluna` temporal (+ `filtro` opcional);
- **Isenção**: `dias IS NULL` e `coluna IS NULL`, com `motivo` justificando.

A CHECK `retencao_politicas_coerencia` impede estados ambíguos.

## Execução
- `public.cleanup_log_tables()` (cron `daily-log-retention`, 03:00 UTC) lê as
  políticas ativas e chama `purge_old_rows`. Erro em uma política é capturado
  no JSON de resultado e **não** aborta as demais.
- Ao final chama `maintain_monthly_partitions()` (audit_logs e
  frontend_error_logs: +3 meses à frente, drop de 6 e 3 meses).

## Barreira de CI
- `scripts/integrity/14_retencao.sql` (assertions: tabela sem política,
  política com coluna inválida, job executado nas últimas 48h).
- Job dedicado em `.github/workflows/ci.yml`.
- `scripts/integrity/run.sh` agora executa **todos** os passos `NN_*.sql|sh`
  (antes rodava apenas 01–05, deixando os gates #26–#34 sem execução real).

## Retenções legais
Trilhas fiscais e financeiras (`security_audit_logs`, `user_action_audit`,
`auditoria_financeira`, `asaas_audit_trail`, `tax_audit_trail`,
`elisao_creditos_auditoria`, `nfe_eventos`, históricos de cobrança) usam
1825 dias (5 anos). Não reduzir sem decisão jurídica.
