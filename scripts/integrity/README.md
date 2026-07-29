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

## Gate #26 — Drift de baseline (CI)

`scripts/ci/check-baseline-drift.sh` compara o banco real (`PROD_DB_URL`, somente leitura) com os baselines versionados e falha o PR quando há divergência de:

- contagens de tabelas/views/índices/funções/policies (índices toleram `DRIFT_TOLERANCE`);
- policies por tabela (`added` / `removed` / `changed`);
- invariantes que nunca regridem: RLS em 100% das tabelas, `security_invoker` em 100% das views, `anon` restrito à allowlist.

Roda como job `baseline-drift` no workflow `supabase-linter`. Sem `PROD_DB_URL` o job é pulado com warning (nunca aprova silenciosamente um drift real, apenas não verifica).

Alterou schema/RLS/GRANT? Rode `dump-baseline.sh` e commite os baselines no **mesmo PR**.

## Gate #27 — SECURITY DEFINER com search_path fixo

`06_secdef.sql` audita todas as funções `SECURITY DEFINER` do schema `public`:

- `secdef.search_path_fixo` — falha se alguma função não tiver `SET search_path`.
- `secdef.search_path_seguro` — falha se o `search_path` incluir `$user`
  (schema gravável pelo chamador ⇒ risco de hijacking).

Equivalente no banco: `SELECT * FROM public.gate_27_secdef_sem_search_path();`
(execução restrita a `service_role`).

No CI, o job `secdef-search-path` de `.github/workflows/supabase-linter.yml`
bloqueia o PR em caso de falha.

> Ao criar/alterar funções, atualize `baseline/schema-counts.json`
> (`functions`) no mesmo PR, senão o Gate #26 acusa drift.

## Gate #28 — Superfície de execução SECURITY DEFINER

`07_exec_grants.sql` compara quem pode executar funções `SECURITY DEFINER`
com a allowlist versionada `baseline/allowed-secdef-exec.json`:

- `secdef.anon_exec_allowlist` — visitantes só executam o que foi liberado
  explicitamente (hoje apenas a descoberta de SSO pré-login).
- `secdef.auth_exec_allowlist` — usuários logados idem.
- `secdef.guard_interno` — toda função exposta precisa checar autorização
  (`has_role`, `empresa_acessivel`, `auth.uid()`…).
- `secdef.triggers_sem_exec` — funções de gatilho não recebem `EXECUTE`
  (gatilhos disparam sem esse privilégio).

Ao expor uma nova RPC, adicione-a à allowlist no mesmo PR — caso contrário o
job `secdef-exec-grants` bloqueia o merge.

## Gate #29 — Escopo por empresa nas RPCs privilegiadas

Funções `SECURITY DEFINER` ignoram RLS. Se uma delas lê uma tabela que possui
`empresa_id` sem aplicar `empresa_acessivel()` ou filtro explícito por
`empresa_id`, o resultado atravessa tenants mesmo com as policies corretas.

- Script: `scripts/integrity/08_rpc_tenant_scope.sql`
- Função canônica: `public.gate_29_rpc_sem_escopo_empresa()` (somente owner/service_role)
- Exceções intencionais são versionadas na cláusula `NOT IN` da função, via migration
  (hoje: `resolve_sso_providers_for_domain`, descoberta de SSO por domínio, pré-login).
- Job de CI: `rpc-tenant-scope` em `.github/workflows/supabase-linter.yml`

## Gate #30 — Views com `security_invoker` e matviews protegidas

Uma `VIEW` sem `security_invoker = on` executa com os privilégios do owner e
ignora as policies RLS das tabelas-base — vazando dados entre empresas mesmo
com o tenant isolado corretamente. `MATERIALIZED VIEWS` não suportam RLS de
forma alguma: os dados ficam persistidos e qualquer `SELECT` devolve todas as
linhas, portanto nunca podem receber `SELECT` para `anon`/`authenticated`
(consumo deve passar por RPC `SECURITY DEFINER` com filtro de tenant).

- Script: `scripts/integrity/09_views.sql`
- Função canônica: `public.gate_30_views_inseguras()` (somente owner/service_role)
- Job de CI: `views-secure` em `.github/workflows/supabase-linter.yml`
- Estado atual: 23 views com `security_invoker`, 2 matviews (`mv_benchmark_setorial`,
  `mv_performance_alerts_weekly`) sem grants para roles do app.

## Gate #31 — Índices de tenant nas tabelas com RLS

Toda policy por tenant injeta o predicado `empresa_id = ...` em qualquer query.
Sem um índice **liderado** por `empresa_id`, o planner recorre a seq scan e o
custo cresce com o total de linhas de todas as empresas — a base multi-tenant
degrada exatamente conforme cresce.

- Script: `scripts/integrity/10_tenant_indexes.sql`
- Função canônica: `public.gate_31_tenant_sem_indice()` (somente owner/service_role)
- Job de CI: `tenant-indexes` em `.github/workflows/supabase-linter.yml`
- Remediação aplicada: 27 índices `idx_<tabela>_empresa_id` criados.

## Gate #32 — Mascaramento LGPD de PII em visões

`chave_pix` costuma ser CPF, telefone ou e-mail e permite fraude por desvio de
pagamento. Papéis operacionais e de leitura não têm necessidade legítima do
valor íntegro, então as views entregam:
`CASE WHEN public.pode_ver_dado_sensivel() THEN chave_pix ELSE public.mascarar_chave_pix(chave_pix) END`
(visível apenas para `admin`, `manager` e `financeiro`).

- Script: `scripts/integrity/11_pii_mask.sql`
- Função canônica: `public.gate_32_pii_sem_mascara()` (somente owner/service_role)
- Job de CI: `pii-mask` em `.github/workflows/supabase-linter.yml`
- Remediação aplicada: `vw_contas_receber_painel` e `vw_transferencias_painel`.
