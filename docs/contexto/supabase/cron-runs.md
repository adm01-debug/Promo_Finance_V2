# Cron — execuções recentes

Últimas 3 por job (7 dias). Definições em `cron.md`.


## 2 · executar-regua-cobranca-diaria

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-13 12:00:00 | succeeded | 0.03 | 1 row |
| 2026-11-12 12:00:00 | succeeded | 0.07 | 1 row |
| 2026-11-11 12:00:00 | succeeded | 0.16 | 1 row |


## 3 · capture-slow-queries

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-14 01:00:00 | succeeded | 0.26 | 1 row |
| 2026-11-14 00:00:00 | succeeded | 0.35 | 1 row |
| 2026-11-13 23:00:00 | succeeded | 0.30 | 1 row |


## 4 · cleanup-cron-logs

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-08 04:00:00 | succeeded | 0.05 | 1 row |


## 5 · cleanup-expired-tokens

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-14 01:00:00 | succeeded | 0.16 | 1 row |
| 2026-11-13 01:00:00 | succeeded | 0.05 | 1 row |
| 2026-11-12 01:00:00 | succeeded | 0.05 | 1 row |


## 6 · cleanup-login-attempts

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-13 01:30:00 | succeeded | 0.04 | 1 row |
| 2026-11-12 01:30:00 | succeeded | 0.06 | 1 row |
| 2026-11-11 01:30:00 | succeeded | 0.14 | 1 row |


## 7 · cleanup-rpc-obs-metrics-daily

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-13 05:00:00 | succeeded | 0.12 | 1 row |
| 2026-11-12 05:00:00 | succeeded | 0.01 | 1 row |
| 2026-11-11 05:00:00 | succeeded | 0.04 | 1 row |


## 9 · daily-log-cleanup

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-13 06:00:00 | succeeded | 0.17 | 1 row |
| 2026-11-12 06:00:01 | succeeded | 0.15 | 1 row |
| 2026-11-11 06:00:00 | succeeded | 0.11 | 1 row |


## 11 · detect-query-regressions-5min

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-14 01:00:00 | succeeded | 1.04 | 1 row |
| 2026-11-14 00:30:00 | succeeded | 0.73 | 1 row |
| 2026-11-14 00:00:00 | succeeded | 0.98 | 1 row |


## 12 · integrity-invariants-hourly

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-14 00:45:00 | succeeded | 0.02 | 1 row |
| 2026-11-13 23:45:00 | succeeded | 0.00 | 1 row |
| 2026-11-13 22:45:00 | succeeded | 0.01 | 1 row |


## 13 · maintain-monthly-partitions

_nenhum_


## 14 · monitor-table-bloat-daily

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-13 02:00:00 | succeeded | 0.24 | 1 row |
| 2026-11-12 02:00:00 | succeeded | 0.13 | 1 row |
| 2026-11-11 02:00:00 | succeeded | 0.11 | 1 row |


## 15 · pgss-baseline-cleanup

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-08 23:00:00 | succeeded | 0.02 | 1 row |


## 17 · recarregar-seeds-fiscais-diario

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-14 00:00:00 | succeeded | 0.12 | 1 row |
| 2026-11-13 00:00:00 | succeeded | 0.03 | 1 row |
| 2026-11-12 00:00:00 | succeeded | 0.04 | 1 row |


## 18 · refresh-performance-alerts-weekly

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-08 01:00:00 | failed | 0.55 | ERROR:  new row for relation "performance_alerts" violates check constraint "performance_alerts_source_check" DETAIL:  Failing row contains (3c346205-db76-459b-949e-a135921647a7, weekly_trend, spike:cron:critical:2026-11-02, 2026-11-08 01:00:00+00, critical, Spike semanal: 145 alertas critical (+353 |


## 19 · sefaz-observability-hourly

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-14 00:15:00 | succeeded | 0.15 | 1 row |
| 2026-11-13 23:15:00 | succeeded | 0.14 | 1 row |
| 2026-11-13 22:15:00 | succeeded | 0.12 | 1 row |


## 20 · snapshot-table-bloat-daily

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-13 02:30:00 | succeeded | 0.74 | 1 row |
| 2026-11-12 02:30:00 | succeeded | 0.41 | 1 row |
| 2026-11-11 02:30:00 | succeeded | 0.51 | 1 row |


## 22 · gerar-alertas-vencimento-diario

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-13 08:00:00 | succeeded | 0.17 | 1 row |
| 2026-11-12 08:00:00 | succeeded | 0.82 | 1 row |
| 2026-11-11 08:00:00 | succeeded | 0.74 | 1 row |


## 23 · gerar-contas-recorrentes-diario

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-13 03:35:00 | succeeded | 0.04 | 1 row |
| 2026-11-12 03:35:00 | succeeded | 0.01 | 1 row |
| 2026-11-11 03:35:00 | succeeded | 0.03 | 1 row |


## 24 · processar-regua-cobranca-diario

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-13 09:00:00 | succeeded | 0.09 | 1 row |
| 2026-11-12 09:00:00 | succeeded | 0.02 | 1 row |
| 2026-11-11 09:00:00 | succeeded | 0.07 | 1 row |


## 29 · pgss-weekly-baseline

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-08 04:00:00 | succeeded | 0.23 | 0 rows |


## 30 · cron-failure-watch

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-14 00:10:00 | succeeded | 12.98 | 1 row |
| 2026-11-13 23:10:00 | succeeded | 1.95 | 1 row |
| 2026-11-13 22:10:00 | succeeded | 13.47 | 1 row |


## 31 · daily-log-retention

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-13 03:00:00 | succeeded | 1.73 | 1 row |
| 2026-11-12 03:00:00 | succeeded | 2.92 | 1 row |
| 2026-11-11 03:00:00 | succeeded | 1.08 | 1 row |


## 32 · sefaz-dfe-dispatcher-15min

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-14 01:00:00 | succeeded | 0.19 | 1 row |
| 2026-11-14 00:45:00 | succeeded | 0.06 | 1 row |
| 2026-11-14 00:30:00 | succeeded | 0.11 | 1 row |


## 33 · webhook-retry-worker-1min

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-14 01:09:00 | succeeded | 0.01 | 1 row |
| 2026-11-14 01:08:00 | succeeded | 0.02 | 1 row |
| 2026-11-14 01:07:00 | succeeded | 0.02 | 1 row |


## 34 · auditar-acessos-cross-tenant

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-14 00:10:00 | succeeded | 0.11 | 1 row |
| 2026-11-13 23:10:00 | succeeded | 0.09 | 1 row |
| 2026-11-13 22:10:00 | succeeded | 0.10 | 1 row |


## 35 · capture-index-usage-daily

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-13 04:20:00 | succeeded | 0.66 | 1 row |
| 2026-11-12 04:20:00 | succeeded | 0.51 | 1 row |
| 2026-11-11 04:20:00 | succeeded | 0.53 | 1 row |


## 36 · monitorar-erros-frontend

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-14 01:00:00 | succeeded | 0.16 | 1 row |
| 2026-11-14 00:30:00 | succeeded | 0.07 | 1 row |
| 2026-11-14 00:00:00 | succeeded | 0.14 | 1 row |


## 40 · gerar-snapshots-conformidade-mensal

_nenhum_


## 41 · digest-silenciamentos-erro

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-09 11:00:00 | succeeded | 0.09 | 1 row |


## 42 · enviar-digest-conformidade-horario

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-14 00:30:00 | succeeded | 0.13 | 1 row |
| 2026-11-13 23:30:00 | succeeded | 0.06 | 1 row |
| 2026-11-13 22:30:00 | succeeded | 0.02 | 1 row |


## 43 · enviar-digest-conformidade-diario

_nenhum_


## 44 · monitor-health-check

| início (UTC) | status | duração (s) | mensagem |
|---|---|---|---|
| 2026-11-14 01:00:00 | succeeded | 0.17 | 1 row |
| 2026-11-14 00:30:00 | succeeded | 0.02 | 1 row |
| 2026-11-14 00:00:00 | succeeded | 0.16 | 1 row |
