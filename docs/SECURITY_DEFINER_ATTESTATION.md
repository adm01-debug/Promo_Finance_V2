# SECURITY DEFINER — Attestation & Justificativas

> **Objetivo:** Documentar cada função `SECURITY DEFINER` do schema `public`,
> justificando a elevação de privilégio, confirmando `search_path` fixo e o
> conjunto de roles autorizados a executá-la (`EXECUTE`).
>
> **Última auditoria:** 2026-07-16
> **Total de funções auditadas:** 72
> **Status geral:** ✅ Todas com `search_path` explícito (`public, pg_catalog[, extensions]`).
> **Exposição a `anon`:** apenas 1 função (`resolve_sso_providers_for_domain`), intencional.

---

## Princípios

1. **`SECURITY DEFINER` é o último recurso.** Preferimos RLS + `SECURITY INVOKER`.
   Só usamos DEFINER quando a lógica precisa cruzar policies (ex.: `has_role`),
   acessar tabelas de sistema (ex.: `pg_stat_statements`), ou consolidar
   operações multi-tabela em uma transação atômica.
2. **`search_path` sempre fixo** via `SET search_path = public, pg_catalog[, extensions]`.
   Impede *search_path hijacking* — ataque em que um schema controlado pelo
   usuário sobrepõe funções/tipos padrão.
3. **`EXECUTE` restrito**. Padrão: `authenticated` + `service_role`.
   `anon` só recebe grant após revisão explícita documentada aqui.
4. **Validações internas.** Funções expostas a `authenticated` validam
   `auth.uid()` e/ou `has_role()` antes de qualquer efeito colateral.

---

## Categorias

### 1. RBAC e permissões (fundação de autorização)

| Função | Args | Justificativa | Roles com EXECUTE |
|---|---|---|---|
| `has_role` | `_user_id uuid, _role app_role` | Consultada em toda policy RLS. DEFINER evita recursão RLS na tabela `user_roles`. | authenticated, service_role |
| `has_permission` | `_user_id uuid, _permission_name text` | Idem `has_role`, mas para permissões granulares via `role_permissions`. | authenticated, service_role |
| `get_user_roles` | `user_id uuid` | Retorna todos os roles do usuário; usada no bootstrap do frontend. | authenticated, service_role |
| `get_user_permissions` | `user_id uuid` | Idem para permissões. | authenticated, service_role |

**Risco:** baixo. Funções são `STABLE`, `RETURNS boolean/TABLE`, sem escrita.
Validam o `_user_id` recebido apenas para leitura.

---

### 2. Login lockout, brute-force e device trust

| Função | Justificativa | Roles |
|---|---|---|
| `check_login_lockout(p_email)` / `_v2(p_email, p_ip)` | Precisa ler `login_attempts` sem depender do usuário estar autenticado. | authenticated, service_role |
| `record_failed_login` / `_v2` | Escreve em `login_attempts` — chamada pelo backend de auth em contexto pré-login. | service_role (chamado por Edge Function) |
| `increment_failed_attempts` / `reset_failed_attempts` / `clear_login_attempts` | Contadores de brute-force. | service_role |
| `get_lockout_details(_email)` | Painel admin. | authenticated (validação `has_role('admin')` no corpo) |
| `is_country_allowed_for_login` / `is_country_blocked` / `is_ip_allowed_for_login` / `is_ip_blocked` / `is_ip_whitelisted` | Guards de acesso geo/IP. Sem DEFINER, o usuário anônimo não conseguiria consultar `allowed_countries` / `blocked_ips`. | service_role (via edge function `validate-ip-geo`) |
| `is_known_device(_user_id, _fingerprint)` | Consulta `user_devices` cross-user na fase de MFA challenge. | service_role |
| `sanitize_auth_log_metadata` | Trigger de sanitização em `auth_logs`. | (trigger — sem EXECUTE direto) |

**Risco:** baixo. Todas parametrizadas, sem SQL dinâmico. Auditadas em
`supabase/tests/sql/`.

---

### 3. Tokens de reset e verificação

| Função | Justificativa | Roles |
|---|---|---|
| `is_token_valid(p_token_hash)` | Verifica hash sem expor a tabela. | anon (via edge function) — **REVOGADO de anon direto** |
| `use_reset_token(p_token_hash, p_ip_address)` | Consome token atomicamente. | service_role |
| `cleanup_expired_tokens` / `invalidate_old_tokens` / `set_token_expiration` | Manutenção. | service_role, cron |

Grants em `anon` sobre estas funções foram removidos; acesso é
mediado por Edge Functions com service_role.

---

### 4. Conciliação bancária (transações multi-tabela)

| Função | Justificativa |
|---|---|
| `confirmar_conciliacao` / `confirmar_conciliacao_manual` | Atualiza `conciliacoes` + `transacoes_bancarias` + `contas_pagar/receber` em uma transação. DEFINER simplifica a policy única em vez de N policies por tabela. |
| `desfazer_conciliacao` / `desfazer_conciliacao_manual` | Reverte a operação idempotentemente. |
| `generate_reconciliation_suggestions(p_empresa_id, ...)` | Ranking de matches; lê múltiplas tabelas com escopo por `empresa_id`. Valida escopo internamente. |

**Roles:** authenticated (validação `empresa_id ∈ user_empresas` no corpo).

---

### 5. Régua de cobrança e eventos financeiros

`processar_regua_cobranca`, `confirmar_envio_cobranca`,
`registrar_evento_cobranca`, `registrar_evento_pagar`,
`registrar_evento_receber` (x2 overloads).

**Justificativa:** logging cross-tabela chamado por Edge Functions e cron.
Todas verificam `empresa_id` antes de inserir. Idempotência via chaves
naturais (`fila_id`, `provider_message_id`).

**Roles:** authenticated + service_role.

---

### 6. Auditoria e logging

| Função | Justificativa |
|---|---|
| `log_audit(...)` | Grava em `audit_logs` particionada. Chamada por triggers e serviços. |
| `audit_trigger_generic()` | Trigger `AFTER INSERT/UPDATE/DELETE` para tabelas críticas. |
| `registrar_auditoria_config(_tipo, _empresa, _detalhes)` | Grava mudanças de configuração. |
| `log_sso_onboarding_event(...)` | Observabilidade específica do fluxo SSO. |
| `profile_sensitive_fields_unchanged(...)` | Guardrail contra escalação de privilégios via `profiles`. |

**Roles:** authenticated + service_role. Sem exposição a `anon`.

---

### 7. Observabilidade de performance / pg_stat_statements

`capture_slow_queries`, `capture_pg_stat_statements_baseline`,
`cleanup_pgss_baseline`, `compare_pg_stat_baseline`, `detect_query_regressions`,
`get_performance_alerts` / `_weekly`, `refresh_performance_alerts_weekly`,
`get_table_bloat`, `snapshot_table_bloat`, `monitor_table_bloat`,
`get_bloat_history`, `get_bloat_snapshots`, `notify_performance_alert_trigger`.

**Justificativa:** acesso a `pg_stat_statements` e `pg_catalog` requer
privilégios elevados. Todas expostas somente à role `admin` via
`has_role('admin')` no corpo.

**Roles:** authenticated (com guard interno). service_role para cron.

---

### 8. Manutenção e retenção (cron)

`cleanup_log_tables`, `cleanup_old_cron_logs`, `cleanup_old_login_attempts`,
`run_daily_cleanup`, `run_daily_cleanup_with_logging`,
`ensure_monthly_partitions`, `maintain_monthly_partitions`, `get_cron_jobs`,
`get_cron_run_history` (x2 overloads).

**Justificativa:** operações de manutenção que precisam ler `pg_cron` e
`pg_class` e apagar dados de várias tabelas.

**Roles:** service_role (executado por `pg_cron`). Leitura via
`get_cron_*` liberada a `authenticated` com guard `has_role('admin')`.

---

### 9. Integrações (Asaas / Bitrix / UAPI / Webhooks)

| Função | Justificativa |
|---|---|
| `get_active_uapi_token()` | Retorna token vigente sem expor `lalamove_uapi_sessions` à RLS. |
| `get_asaas_payment_stats(p_empresa_id)` | Agrega `asaas_payments`; valida `empresa_id`. |
| `get_retencoes_pendentes_count(p_empresa_id)` | KPI simples com escopo. |
| `export_asaas_audit_csv(p_empresa_id)` | Gera CSV do audit trail. Guard `has_role('admin')`. |
| `enqueue_webhook_retry(...)` | Move item para DLQ atomicamente. |
| `reprocess_dlq(p_dlq_id, p_notes)` | Reenfileira. Guard `has_role('admin')`. |
| `trigger_bitrix24_sync()` | Fire-and-forget cross-schema. |

**Roles:** authenticated (com guards) + service_role.

---

### 10. SSO — exposição a `anon` (justificada)

| Função | Roles | Justificativa |
|---|---|---|
| `resolve_sso_providers_for_domain(p_domain)` | **anon, authenticated, service_role** | Descoberta de IdP pré-login pelo domínio de e-mail. Sem esta função, usuários SSO não conseguem iniciar o fluxo. Retorna apenas `id, provider_type, display_name` — campos públicos por design. |

**Mitigações:**

- Retorna **somente** campos não sensíveis (nada de client_secret / signing keys).
- Rate-limited pela Edge Function `sso-discovery` (10 req/min/IP).
- `p_domain` normalizado e validado (regex) dentro da função.

---

## Checklist de conformidade

- [x] Todas as 72 funções têm `search_path` explícito.
- [x] Nenhuma função executa SQL dinâmico com input não sanitizado.
- [x] Todas as funções com side-effect chamadas por `authenticated` validam
  escopo (`empresa_id`, `has_role`, `auth.uid()`) internamente.
- [x] Apenas 1 função (`resolve_sso_providers_for_domain`) exposta a `anon`,
  com justificativa documentada.
- [x] `service_role` mantém EXECUTE em todas as funções (necessário para
  Edge Functions e cron).
- [x] Testes pgTAP em `supabase/tests/sql/` cobrem RBAC (has_role,
  has_permission) e overloads.

## Próximas revisões

- **Cadência:** trimestral, ou ao adicionar qualquer nova função DEFINER.
- **Migration policy:** toda nova função `SECURITY DEFINER` deve:
  1. Iniciar com `SET search_path = public, pg_catalog`.
  2. Ter comentário `COMMENT ON FUNCTION ... IS '...'` explicando a razão.
  3. Ter linha correspondente neste documento no mesmo PR.
  4. `REVOKE ALL FROM public` explícito; grants pontuais por role.

## Comando de auditoria (reproduzível)

```sql
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef,
       p.proconfig,
       array_agg(DISTINCT r.rolname) FILTER (WHERE r.rolname IS NOT NULL) AS grantees
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
LEFT JOIN aclexplode(p.proacl) a ON true
LEFT JOIN pg_roles r ON r.oid = a.grantee AND a.privilege_type = 'EXECUTE'
WHERE n.nspname = 'public' AND p.prosecdef = true
GROUP BY p.proname, p.oid, p.prosecdef, p.proconfig
ORDER BY p.proname;
```
