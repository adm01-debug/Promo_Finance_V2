# Auditoria Técnica Sênior — Promo Finance

> Análise exaustiva de arquitetura, segurança, performance, manutenibilidade e operacionalidade.
> Realizada sob perspectiva de Back-End Sênior / DBA. Data: 2026-07-11.

---

## 1. Sumário Executivo

O sistema é uma plataforma financeira multi-empresa (React 18 + Vite + Supabase/Postgres) com forte cobertura funcional (tributário, cobrança, conciliação, integrações Bling/ASAAS/Bitrix24) e boa maturidade de testes (988+ Vitest, E2E Playwright, fuzz Deno). Existe telemetria própria, RLS ampla, RBAC de 4 papéis e Edge Functions bem segmentadas.

Apesar disso, a análise revelou **fragilidades sistêmicas** que impedem o "10/10":

| # | Área | Severidade | Prioridade |
|---|------|------------|------------|
| 1 | Fallback de credenciais Supabase hardcoded no client | **Alta** | Crítico |
| 2 | Sobrecarga funcional (54+ funções `registrar_evento_receber`, `confirmar_conciliacao`, `desfazer_conciliacao` com assinaturas ambíguas) | **Alta** | Crítico |
| 3 | Ausência de índices declarados em FKs críticas / colunas de filtro (`empresa_id`, `status`, `created_at`) | **Alta** | Crítico |
| 4 | RLS presente mas GRANTs não auditados por tabela — risco de PostgREST 401/403 silencioso ou vazamento | **Alta** | Importante |
| 5 | Validação de IP/Geo depende de API pública externa (`ipapi.co`) com fallback silencioso — bypass trivial | **Média** | Importante |
| 6 | `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` como secret — cross-project service_role é vetor de escalonamento | **Alta** | Crítico |
| 7 | 160+ tabelas em `public` schema sem particionamento (`audit_logs`, `login_attempts`, `frontend_error_logs`) | **Média** | Importante |
| 8 | Edge Functions sem rate-limit centralizado — apenas login o tem (via RPC) | **Média** | Importante |
| 9 | Ausência de migrations idempotentes visíveis / drift entre `db-functions` documentadas e reais | **Média** | Desejável |
| 10 | Custos: 60+ Edge Functions com cold start; sem CDN/edge cache para leituras públicas | **Baixa** | Desejável |

---

## 2. Detalhamento por Categoria

### 2.1 Segurança (OWASP + Postgres)

#### 🔴 CRÍTICO — Fallback hardcoded de credenciais no client
Em `src/integrations/supabase/client.ts` há `FALLBACK_PUBLISHABLE_KEY` e `FALLBACK_PROJECT_ID` para garantir boot no build publicado. Embora a *publishable key* seja pública por design, o padrão:
- Mascara falhas de deploy (build "funciona" com credenciais erradas apontando para o projeto errado).
- Cria acoplamento a um projeto específico dentro do bundle JS distribuído.

**Recomendação:**
```ts
// Fail-fast, mas não crashar árvore React
if (!import.meta.env.VITE_SUPABASE_URL) {
  document.body.innerHTML = renderConfigError();
  throw new Error("[boot] VITE_SUPABASE_URL ausente. Verifique deploy.");
}
```
Complementar a `assertSupabaseEnv` já criada em `vite.config.ts` com um health-check pós-deploy que valide `/rest/v1/` responde 200.

#### 🔴 CRÍTICO — `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY`
Ter service_role de **outro projeto** em secrets amplia o blast radius. Se qualquer Edge Function for comprometida (SSRF, prototype pollution em deps), o atacante ganha acesso irrestrito ao CRM externo.

**Recomendação:**
- Trocar por uma chave dedicada com RLS + policies escopadas (usuário `crm_reader` com `SELECT` limitado).
- Isolar acesso a essa key numa única função (`external-data`) e proibir logging da mesma.

#### 🟡 IMPORTANTE — Validação IP/Geo bypass
`useAuthValidation` chama `ipapi.co` (client-side). Um atacante controla o cliente; a chamada pode ser interceptada e falsificada. As RPCs `is_ip_allowed_for_login` / `is_country_allowed_for_login` recebem o valor **enviado pelo browser**.

**Recomendação:** mover a inferência de IP para uma Edge Function que lê `req.headers.get('x-forwarded-for')` e valida server-side antes de emitir sessão.

#### 🟡 IMPORTANTE — GRANTs não auditados
As regras do sistema exigem `GRANT` explícito por tabela. Com 160+ tabelas e a listagem mostrando apenas contagem de policies, é impossível afirmar que 100% têm o grant correto para `authenticated` / `service_role`. Falhas resultam em 401 PostgREST intermitentes.

**Ação imediata:** rodar auditoria:
```sql
SELECT c.relname, has_table_privilege('authenticated', c.oid, 'SELECT') AS auth_select
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;
```
Gerar migration remedial para os `false`.

#### 🟡 IMPORTANTE — Overloading de funções SQL
Existem 5+ variantes de `confirmar_conciliacao(...)` e 3+ de `desfazer_conciliacao(...)`, `registrar_evento_receber(...)`, com assinaturas parcialmente sobrepostas. Risco:
- Resolução ambígua em runtime (`function is not unique`).
- Callers TS podem invocar a variante errada silenciosamente (types.ts pode escolher a "primeira" matching).

**Recomendação:** unificar em uma função canônica com params opcionais nomeados e `DROP FUNCTION` das antigas em migration.

### 2.2 Banco de Dados

#### 🔴 CRÍTICO — Índices ausentes em colunas de alta cardinalidade
Não há evidência de índices em `empresa_id`, `status`, `created_at`, `user_id` nas tabelas de alto volume (`contas_pagar`, `contas_receber`, `audit_logs`, `login_attempts`, `webhook_events`). Estas colunas participam de RLS + filtros de UI.

**Ação:**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contas_receber_empresa_status
  ON public.contas_receber (empresa_id, status, data_vencimento);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created
  ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempts_email_last
  ON public.login_attempts (lower(email), last_attempt_at DESC);
```
*(Nota: `CONCURRENTLY` fora de migration transacional — usar deploy manual.)*

#### 🟡 IMPORTANTE — Sem particionamento em tabelas de log
`audit_logs`, `frontend_error_logs`, `login_attempts`, `runtime_error_logs`, `query_telemetry` crescem indefinidamente. Já existe `cleanup_old_login_attempts` (7 dias) e `cleanup_old_cron_logs` (30 dias), mas:
- `audit_logs` não tem cleanup visível.
- Ausência de `PARTITION BY RANGE (created_at)` deixa índices gigantes.

**Recomendação:** particionar por mês (`pg_partman` ou nativo) e reter 90d online, arquivar S3.

#### 🟡 IMPORTANTE — Uso de `CHECK` com `now()` documentado como proibido
Regra da própria arquitetura: usar triggers para regras dependentes de tempo. Vale auditar todas as constraints (`information_schema.check_constraints`) para garantir aderência.

#### 🟢 DESEJÁVEL — Enum vs TEXT+CHECK
A convenção interna diz "TEXT + CHECK". Já existe `app_role` como enum. Definir política única: enums são melhores para performance e integridade, apesar de exigir migration para alterar.

### 2.3 Performance & Escalabilidade

- **N+1 latente** nos hooks: hooks consomem views (`vw_contas_pagar_painel`) — validar que views não escondem `LEFT JOIN LATERAL` custosos.
- **`slow_queries` não é ligado a alertas.** Recomendo cron diário lendo `pg_stat_statements` e postando em Slack se `mean_time > 500ms`.
- **QueryClient** possui `staleTime` mas cache não é invalidado seletivamente em mudança de empresa (evento `current-empresa-changed` limpa TUDO — pode causar refetch storm).

### 2.4 Manutenibilidade

- 54 funções SQL sem versionamento por arquivo `.sql` — apenas dump. Impossível code-review.
- `useAuthValidation` usa `(supabase.from('login_attempts') as any).insert(...)` — cast quebra tipagem gerada.
- `src/hooks` tem tamanho não medido; regra é modularizar > 400 linhas.

**Ação:** ESLint rule `max-lines: 400` + gerar `db/functions/*.sql` versionado.

### 2.5 Observabilidade

Bom: telemetry.ts com breadcrumbs + Supabase Proxy, `frontend_error_logs`, `query_telemetry`.
Faltando:
- **Correlation ID** propagado Client → Edge Function → DB (`SET LOCAL app.request_id`).
- **SLO dashboard**: existe `calcular-slo-metrics-diario` mas sem alertas quando SLO cai.
- **Dead letter queue** em webhooks (`asaas-webhook`, `bling-webhook`).

### 2.6 Custos

- 60+ Edge Functions individuais → cold starts frequentes. Consolidar funções relacionadas (ex.: `gerar-alertas` + `gerar-alertas-tributarios`).
- Ausência de CDN cache em endpoints somente-leitura (`get-vapid-key`, `cnpja-lookup` com TTL longo).
- `pg_cron` roda tudo no primário; considerar worker externo para jobs pesados (`executar-analise-preditiva`).

---

## 3. Roadmap Priorizado

### Sprint 1 — Segurança e Estabilidade (bloqueia produção)
1. Remover fallback hardcoded, adicionar health-check pós-boot.
2. Auditoria GRANT + script remedial.
3. Migrar validação IP/Geo para Edge Function (server-side).
4. Consolidar `confirmar_conciliacao` / `registrar_evento_receber` em versão única.

### Sprint 2 — Performance
5. Adicionar índices em `empresa_id`, `status`, `created_at`, `user_id` (top-20 tabelas).
6. Ativar `pg_stat_statements` alerts.
7. Invalidação seletiva de React Query em troca de empresa.

### Sprint 3 — Operacional
8. Particionar `audit_logs`, `frontend_error_logs`, `query_telemetry`.
9. Correlation ID Client→Edge→DB.
10. DLQ para webhooks.

### Sprint 4 — Qualidade Contínua
11. Versionar funções SQL em `db/functions/*.sql`.
12. ESLint `max-lines`, remover `as any` restantes.
13. Consolidar Edge Functions correlatas; adicionar cache CDN.

---

## 4. Benchmarking

| Aspecto | Promo Finance | Best-in-class (Stripe/Ramp) |
|---|---|---|
| RLS coverage | ~100% (declarado) | 100% + testes de policy |
| Índices em FK | Parcial | 100% cobertos |
| Overloading SQL | Alto (5+ variantes) | Zero (função canônica) |
| Rate limit APIs | Só login | Todas as rotas críticas |
| Particionamento logs | Não | Sim (mensal) |
| Cold start Edge Fn | 60+ funções | Consolidadas + warm pool |
| Correlation ID | Ausente | Header `x-request-id` end-to-end |

---

## 5. Referências

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgREST Grants](https://postgrest.org/en/stable/references/auth.html)
- [Postgres Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- OWASP ASVS v4.0 — Sections V1 (Architecture), V4 (Access Control), V7 (Errors & Logging).

---

## 6. Status de Entrega (2026-07-11)

| # | Item | Status | Migration/Arquivo |
|---|------|--------|-------------------|
| 1 | Remover fallback hardcoded Supabase + fail-fast | ✅ | `src/integrations/supabase/client.ts` |
| 2 | Validação IP/Geo server-side | ✅ | `supabase/functions/validate-ip-geo/` |
| 3 | Auditoria GRANT/RLS (menor privilégio) | ✅ | migration 20260711145322 |
| 4 | pgTAP para sobrecargas SQL | ✅ | `supabase/tests/sql/overloads.test.sql` |
| 5 | CI supabase--linter | ✅ | `.github/workflows/supabase-linter.yml` |
| 6 | Índice `auth_logs(ip_address, created_at)` | ✅ | migration 20260711145611 |
| 7 | Alertas queries lentas (pg_stat_statements) | ✅ | migration 20260711153324 — `capture_slow_queries` + cron 15min |
| 8 | DLQ webhooks (3 falhas → dead-letter) | ✅ | migration 20260711153501 — `webhook_dlq` + `enqueue_webhook_retry` + `reprocess_dlq` |
| 9 | Retenção automática de logs | ✅ | migration 20260711153640 — `cleanup_log_tables` + cron diário |
| 10 | Correlation ID end-to-end | ✅ | `src/lib/correlation-id.ts` + `_shared/correlation.ts` + logger com `request_id` |
| 11 | ESLint `max-lines: 400` | ✅ | `eslint.config.js` |
| 12 | Versionar funções SQL | ✅ | `db/functions/` estruturado |
| 13 | Consolidar Edge Functions (alertas) | ✅ | `gerar-alertas-dispatcher` |
| 14 | Particionamento mensal `audit_logs` / `frontend_error_logs` | ✅ | migration 2026-07-11 — `ensure_monthly_partitions` + cron mensal `maintain-monthly-partitions` |
| 15 | `FORCE ROW LEVEL SECURITY` em 14 tabelas sensíveis (defense in depth) | ✅ | migration 2026-07-11 |
| 16 | pgTAP para partições, DLQ, FORCE RLS e funções de manutenção | ✅ | `supabase/tests/sql/infra.test.sql` (24 testes) |
| 17 | `no-explicit-any: error` em zonas limpas (progressivo) | ✅ | `eslint.config.js` override strict + `relatorio-pdf.ts` tipado |

**Pendentes de decisão externa** (requerem ação fora do escopo deste repositório):

- Role `crm_reader` no projeto Supabase externo (isolamento total do `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY`). Mitigado neste repo pelo guard `scripts/check-external-secret-isolation.sh`.
- Elevação global de `@typescript-eslint/no-explicit-any` para `error` — depende de refactor progressivo de ~50 arquivos legados (parcialmente entregue no item 17).
- Warm-pool de Edge Functions — depende de plano Supabase.

---

*Este relatório é vivo — cada item deve virar issue rastreável no board de engenharia.*


