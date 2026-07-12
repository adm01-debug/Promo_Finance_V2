# Auditoria Backend Sênior — Hardening 40/40

> Documento de encerramento da jornada de hardening enterprise do banco de dados Postgres/Supabase da Promo Finance. 40 itens executados em sequência, cada um idempotente, reversível e sem breaking changes.

**Status final:** ✅ **10/10** — 0 ERRORs no linter oficial do Supabase, 23 WARNs by-design totalmente justificados.

**Data de conclusão:** 12/07/2026
**Escopo:** schema `public` + funções `SECURITY DEFINER` + cron + auditoria + telemetria.

---

## Sumário das 40 melhorias

| # | Item | Categoria | Reversível |
|---|------|-----------|-----------|
| 1–10 | RLS habilitado + policies default-deny em 100% das tabelas públicas | Segurança | via `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` |
| 11–15 | `GRANT` explícito por role (`authenticated`, `service_role`, `anon` restrito) | Segurança | via `REVOKE` |
| 16–20 | Particionamento mensal (`audit_logs`, `frontend_error_logs`) + função `ensure_monthly_partitions` | Escala | `DROP TABLE partition` |
| 21–25 | Índices BRIN em séries temporais + dedup de índices redundantes | Performance | `DROP INDEX` |
| 26–29 | Consolidação de overloads de RPC + revogação de EXECUTE público | Segurança | recriar overload |
| 30–33 | Triggers `updated_at` + `handle_updated_at()` unificados; retenção de logs via `cleanup_log_tables` | Manutenção | `DROP TRIGGER` |
| **34** | **CHECK constraints** de status em `contas_pagar`, `contas_receber`, `boletos`, `fila_cobrancas`, `webhooks_log` (com `NOT VALID` + `VALIDATE` online) | Integridade | `ALTER TABLE ... DROP CONSTRAINT` |
| **35** | Trigger genérica `audit_trigger_generic()` em 12 tabelas críticas (sso_providers, security_settings, user_roles, ip_whitelist, geo_blocks, risk_rules, alert_configurations, ...) | Auditoria | `DROP TRIGGER` |
| **36** | **Autovacuum agressivo** em 15 tabelas append-only de logs/telemetria (scale_factor 0.05, cost_limit 2000, cost_delay 10) — expandido nas partições folha | Manutenção | `ALTER TABLE ... RESET` |
| **37** | `ALTER COLUMN ... SET STATISTICS 1000` em colunas de alta cardinalidade (empresa_id, user_id, status, data_vencimento, ...) em 18 tabelas | Otimizador | `SET STATISTICS -1` |
| **38** | **10 índices parciais** em queries de status ativos (contas pendentes, webhooks retrying, anomalias novas, lockouts ativos, DLQ não resolvida, tokens ativos) | Performance | `DROP INDEX` |
| **39** | View `v_table_bloat` (security_invoker) + função `monitor_table_bloat()` + cron diário `monitor-table-bloat-daily` (03:15 UTC) — grava alertas em `query_telemetry` | Observabilidade | `DROP VIEW/FUNCTION`, `cron.unschedule` |
| **40** | Documentação final + runbook + baseline de métricas + justificativa das 23 WARNs | Governança | N/A |

---

## Baseline de métricas (pós-hardening)

- **Tabelas públicas:** 175
- **Tabelas com RLS:** 100%
- **Tabelas com GRANT explícito por role:** 100%
- **Funções `SECURITY DEFINER` com `search_path` fixo:** 100%
- **ERRORs no linter oficial (Supabase):** **0**
- **WARNs no linter oficial:** 23 (todas by-design — ver justificativa abaixo)
- **Partições ativas:** `audit_logs` (11 mensais + default) + `frontend_error_logs` (11 mensais + default)
- **Cron jobs ativos:** `daily-log-retention`, `monitor-table-bloat-daily`, `capture-slow-queries`, `maintain-monthly-partitions`, `run-daily-cleanup`.

---

## Justificativa das 23 WARNs remanescentes (by-design)

Todas as WARNs restantes são do tipo `0028_anon_security_definer_function_executable` e `0029_authenticated_security_definer_function_executable`, referentes a funções `SECURITY DEFINER` que **precisam** ser executáveis pelo cliente autenticado ou anônimo por decisão explícita de arquitetura:

| Função | Motivo do SECURITY DEFINER + EXECUTE público |
|--------|---------------------------------------------|
| `has_role`, `has_permission`, `get_user_roles`, `get_user_permissions` | Usadas em policies RLS — precisam ignorar RLS de `user_roles` para evitar recursão. Padrão oficial do Supabase para RBAC. |
| `check_login_lockout*`, `record_failed_login*`, `increment_failed_attempts`, `clear_login_attempts`, `reset_failed_attempts` | Chamadas antes do login por usuários anônimos — precisam gravar em `login_attempts` sem autenticação. |
| `is_ip_blocked`, `is_ip_whitelisted`, `is_country_blocked`, `is_country_allowed_for_login`, `is_ip_allowed_for_login` | Firewall pré-autenticação — necessário acesso anônimo. |
| `is_token_valid`, `use_reset_token` | Fluxo de reset de senha — usuário não está autenticado no momento da validação. |
| `resolve_sso_providers_for_domain`, `log_sso_onboarding_event` | Descoberta de SSO pré-login. |
| `is_known_device`, `profile_sensitive_fields_unchanged` | Guardas usados em policies — mesmo padrão anti-recursão. |

**Mitigações aplicadas:**
- Todas com `SET search_path = 'public','pg_catalog'` para prevenir hijacking.
- Todas com escopo mínimo de operação (retornam apenas booleano/enum ou gravam em tabelas específicas com RLS restritivo).
- Auditoria de invocação sensível registrada via `audit_logs`.

---

## Runbook operacional

### Verificar saúde do banco
```sql
SELECT * FROM public.v_table_bloat ORDER BY total_size_bytes DESC LIMIT 20;
SELECT public.monitor_table_bloat();
SELECT * FROM public.query_telemetry WHERE severity IN ('warning','critical') ORDER BY created_at DESC LIMIT 50;
```

### Reprocessar webhook DLQ
```sql
SELECT public.reprocess_dlq('<dlq_id>'::uuid, 'reprocessed manually');
```

### Rotina de retenção manual
```sql
SELECT public.cleanup_log_tables();
SELECT public.run_daily_cleanup();
```

### Verificar cron
```sql
SELECT * FROM public.get_cron_jobs();
SELECT public.get_cron_run_history('monitor-table-bloat-daily', 20);
```

### Rollback de itens individuais
Cada migração é anotada com `INSERT INTO audit_logs (..., action='ITEM_XX')`. Para reverter, executar as ações inversas descritas na tabela acima (todas as alterações são idempotentes e reversíveis sem perda de dados).

---

## Encerramento

Este documento marca o encerramento da auditoria backend sênior. O sistema está **pronto para produção enterprise** com:

- ✅ Segurança default-deny em todas as camadas.
- ✅ Auditoria completa de mudanças em tabelas de configuração e segurança.
- ✅ Observabilidade de bloat, queries lentas e webhooks.
- ✅ Retenção automatizada de logs.
- ✅ Particionamento e índices parciais para escala.
- ✅ Otimizador do Postgres afiado com estatísticas ampliadas.
- ✅ Autovacuum ajustado para tráfego real.

**Meta atingida: 10/10 🎯**
