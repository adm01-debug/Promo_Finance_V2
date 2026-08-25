# ADR — Migrations Consolidadas (356 migrations)

> Sumário arquitetural das 356 migrations aplicadas ao schema `public` desde o bootstrap (dez/2024). Substitui a leitura arquivo-a-arquivo por uma visão de decisões e contornos por período/tema.

Última atualização: 2026-07-21 · Total: 356 migrations · Diretório: `supabase/migrations/`

---

## 1. Distribuição temporal

| Período  | Migrations | Contexto                                                                 |
|----------|-----------:|--------------------------------------------------------------------------|
| Legacy (`001..003`) |  3 | Bootstrap manual (`create_tables`, `rls_policies`, `seed`).            |
| 2024-12  |  2 | Filtros salvos e versionamento de entidades.                             |
| 2025-12  | 38 | Núcleo financeiro Promo Brindes: contas, boletos, Bitrix24, aprovações, cron/pg_net, régua de cobrança, portal do cliente, expert conversations. |
| 2026-01  |  5 | Ajustes de índices e RLS pós go-live.                                    |
| 2026-03  | 34 | Módulo tributário v1 (Simples/Presumido/Real, DARFs, apurações).          |
| 2026-04  | 55 | Anomalias detectadas, alertas preditivos, SPED, health scores.            |
| 2026-05  |151 | Consolidação multi-empresa, SSO/SCIM, RBAC hardening, LGPD, particionamento de logs (2026_01..10), rate-limit, telemetry, security definer sweep. |
| 2026-06  | 13 | Reforma tributária, cashback, subvenção ICMS.                             |
| 2026-07  | 55 | Fase de excelência: attestation SECURITY DEFINER, revoke anon, índices dirigidos, presets de query, saved-filters anti-spam, webhook DLQ. |

## 2. Distribuição por tipo de operação

| Categoria | Ocorrências | Comentário                                                            |
|-----------|------------:|-----------------------------------------------------------------------|
| RLS / policies | 189 | Toda tabela pública nasce com policy — default-deny.               |
| Tabelas        | 160 | Domínios: financeiro, tributário, cobrança, integrações, auditoria. |
| Views          | 113 | `security_invoker = true` obrigatório (regra global).               |
| Índices        |  99 | Guiados por telemetria (`slow_queries`) e RLS join keys.            |
| Funções        | 120 | `SECURITY DEFINER` com `search_path` fixo — vide attestation.        |
| Triggers       |  90 | Updated_at, auditoria, sync Bitrix24, denormalização controlada.    |
| Cron           |   7 | Retenção de logs, recomputo de scores, dispatch de alertas.         |
| Alter / Drop   | 73/93 | Iteração incremental — nenhuma quebra retro-compatível registrada.|

## 3. Domínios cobertos

- **Financeiro core:** `contas_pagar`, `contas_receber`, `boletos`, `extrato_bancario`, `transferencias`, `conciliacoes*`, `acordos_parcelamento`.
- **Tributário:** `apuracoes_*`, `darfs`, `regimes_*`, `retencoes_fonte`, `prejuizos_fiscais`, `creditos_tributarios`, `sped_*`.
- **Cobrança & Portal:** `regua_cobranca*`, `templates_cobranca`, `portal_cliente_*`, `whatsapp_conversas`, `historico_cobrancas_*`.
- **Integrações:** `asaas_*`, `bling_*`, `bitrix24_*`, `n8n_*`.
- **Segurança & Auditoria:** `audit_logs_*` (particionado por mês), `frontend_error_logs_*`, `security_audit_logs`, `login_attempts`, `mfa_sessions`, `ip_whitelist`, `geo_blocks`, `sso_providers`, `user_passkeys`.
- **Anomalia & IA:** `anomalias_detectadas`, `alertas_preditivos`, `health_scores_operacionais`, `historico_analises_preditivas`, `recomendacoes_metas_ia`.
- **Observabilidade:** `query_telemetry`, `slow_query_alerts`, `pg_stat_statements_baseline`, `bloat_snapshots`, `webhook_dlq`.

## 4. Padrões arquiteturais aplicados a toda migration

1. `CREATE TABLE` seguido de `GRANT` explícito e `ENABLE ROW LEVEL SECURITY` na mesma migration.
2. `service_role` recebe `ALL`; `anon` só ganha `SELECT` em tabelas com policy pública.
3. Funções `SECURITY DEFINER` sempre com `SET search_path = public, pg_catalog[, extensions]` — auditadas em `docs/SECURITY_DEFINER_ATTESTATION.md`.
4. Índices parciais preferidos para colunas `is_enabled`, `deleted_at IS NULL`, `status IN (...)`.
5. Log tables (`audit_logs_*`, `frontend_error_logs_*`) particionadas por mês, com retenção via pg_cron (`cleanup_log_tables`).
6. Realtime publication (`supabase_realtime`) mantém apenas `performance_alerts` — auditado 2026-07-15.

## 5. Como navegar

- **Por data:** o nome do arquivo começa com `YYYYMMDDhhmmss` — leitura cronológica direta.
- **Por domínio:** `rg -l 'contas_receber' supabase/migrations` isola todas as migrations que tocaram a tabela.
- **Auditoria RLS:** `rg -l 'ENABLE ROW LEVEL SECURITY' supabase/migrations` e cross-check com `supabase/tests/sql/`.

## 6. Convenções para novas migrations

- Nome: `<timestamp>_<slug>.sql` — nunca renomear após aplicado.
- Toda `CREATE TABLE` pública **exige** GRANT + RLS + ao menos uma policy antes do `COMMIT`.
- Views voltadas ao cliente: `WITH (security_invoker = true)`.
- Funções sensíveis: `REVOKE EXECUTE ON FUNCTION ... FROM anon` explícito.
- Sem `DROP TABLE` em produção sem ADR dedicado neste arquivo listando o motivo e o rollback.

## 7. ADR-001 — módulo de logística/Lalamove fora de escopo

A decisão de produto registrada em [ADR-001 — Exclusão do módulo de logística/Lalamove](ADR-001-LALAMOVE-FORA-DE-ESCOPO.md) confirma que 12 tabelas e 2 views vieram de outro projeto e foram criadas por engano.

A ausência desses 14 objetos no banco canônico é intencional: eles não devem ser recuperados nem classificados como drift. Caso reapareçam em algum ambiente, podem ser removidos por migration revisada e limitada aos nomes exatos documentados no ADR. Essa autorização não se estende automaticamente a dependências ou a qualquer outro objeto do banco.
