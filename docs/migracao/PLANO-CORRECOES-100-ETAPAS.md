# Promo Finance V2 — Plano de Correções e Melhorias em 100 Etapas

> **Data:** 2026-08-24 · **Autor:** auditoria assistida (Claude) sob direção de Joaquim (tech lead)
> **Escopo:** migração `lszcmoymovkpckehlagr` (origem, Lovable Cloud) → `bwwbeyolnnzppeuhgkcd` (destino canônico) + repositório `adm01-debug/Promo_Finance_V2` (main @ `486e839`).
> **Método:** `pg_dump --schema-only` dos dois bancos + inventário por catálogo (`pg_proc`, `pg_policies`, `pg_indexes`, `pg_constraint`, `cron.job`, `storage.buckets`, `vault.secrets`, `pg_publication_tables`, `information_schema.role_table_grants`, `supabase_migrations.schema_migrations`, `auth.users`) + diff item a item + sondagem HTTP das 102 edge functions nos dois projetos + leitura do repo.
> **Evidências brutas (VPS, container `claude-code`):** `/workspace/notes/pf-migration-audit/` — `src_schema.sql`, `dst_schema.sql`, `src/*.txt`, `dst/*.txt`, `DIFF_REPORT.txt`, `diff.js`, `env.sh` (credenciais — chmod 600).
> **Nada neste plano é herdado de documentação anterior.** Cada etapa cita a evidência medida.

---

## 0. Diagnóstico em uma tela

| Dimensão | Origem (Lovable) | Destino (canônico) | Lacuna |
|---|---|---|---|
| Tabelas `public` | 279 (277 + 2 particionadas) | 241 | **49 ausentes** (12 = Lalamove descomissionado, 2 = partições 2026-11, **35 sumiram sem migration**), 11 só no destino (3 lixo `_dbg/_t/_v4`) |
| Tabelas com colunas divergentes | — | — | **78 de 213 comuns** |
| Functions | 195 | 131 | **75 ausentes**, 11 só destino (4 lixo de teste + `exec_sql`), 17 divergentes |
| Triggers | 170 | 84 | **86 ausentes** (79 fora do escopo Lalamove) |
| RLS policies | 512 | 418 | 216 ausentes, 122 só destino, **45 divergências semânticas** (`TO public` vs `TO authenticated`), 239 sem o padrão initplan `(select auth.uid())` |
| Índices | 908 | 703 | **274 ausentes**, 69 só destino, 14 divergentes |
| Constraints | 855 | 585 | **326 ausentes** (191 CHECK, 39 PK, 31 UNIQUE, 29 FK, 1 constraint-trigger), 56 só destino, 11 divergentes |
| Enums | 25 | 13 | 12 ausentes (8 Lalamove + `regime_tributario_enum`, `status_workflow`, `tipo_cobranca`, `tipo_destinatario`) |
| Views/matviews | 23 + 2 | 19 + 1 | 7 ausentes, 2 só destino (`pg_stat_statements*` em `public`), **16 com definição diferente** |
| Cron jobs | **30 ativos** | **1** | 30 ausentes (6 apontam para URL da origem) |
| Buckets | `nfe-xml`, `nfe-certificados`, `mcp-test-…` | `comprovantes-financeiro` | 2 buckets NF-e ausentes; 1 bucket de teste na origem |
| Vault | 0 | 1 (`regua_cron_secret`) | origem usa tabela `integration_secrets` (2 linhas) — ausente no destino |
| Partições | `audit_logs` (11 filhas), `frontend_error_logs` (8) | **nenhuma** — tabelas flat + filhas órfãs | particionamento perdido |
| Grants `anon` em tabelas | revogados | **ALL em 252 tabelas** | regressão de hardening |
| Grants EXECUTE em functions | restritos a `service_role` | `anon,authenticated` em **88 funções** internas SECDEF | regressão de hardening |
| Migrations registradas | 326 (Lovable) | 19 (9 `financeiro_*` **de outro projeto** + 10 `reconciliar_*`) | repo (535 arquivos) não rastreado no destino |
| Edge functions deployadas | 102/102 (+`migrate-helper`) | **12/102** (2 em 503) | 90 ausentes |
| Extensões | `pg_stat_statements` em `extensions` | `pg_stat_statements` e `pg_trgm` em **`public`** | views internas expostas via PostgREST |
| Auth users | 3 | 4 (`e2e-admin@promo-finance.test` + `ti@`) | usuário de teste E2E em prod |

**Conclusão:** o destino não descende nem da origem nem do repo. É uma terceira linhagem, com resquícios de outro projeto (`financeiro_00X`), sem automações, sem 88% das edge functions e com hardening regredido. O repo é a fonte de verdade de *código*; a origem é a fonte de verdade de *schema*. O plano converge os três.

---

## 1. Legenda

- **Severidade:** `P0` bloqueia produção / risco de segurança ou perda de dado · `P1` funcionalidade quebrada · `P2` degradação / dívida · `P3` melhoria.
- **Camada:** `SEC` segurança · `SCHEMA` · `DATA` · `FN` functions/triggers · `RLS` · `EDGE` · `CRON` · `INFRA` · `REPO` · `QA`.
- **Ferramenta padrão:** SQL no destino via `SUPABASE - PROMO FINANCE V2 - MCP:supabase_db_query`; DDL versionado via arquivo em `supabase/migrations/` commitado com `GITHUB - MCP - FOREVER`; `pg_dump`/`psql` no container `claude-code` usando `/workspace/notes/pf-migration-audit/env.sh`.
- **Regra de ouro:** toda alteração de banco nasce como migration no repo (GitHub-first) e é aplicada no destino registrando `supabase_migrations.schema_migrations`. Nada de DDL solto.

---

## Fase 0 — Governança, segurança de credenciais e pré-requisitos (etapas 1–8)

### 1. Rotacionar todas as credenciais expostas nesta auditoria — `P0 · SEC`
**Evidência:** arquivo `Promo_Finance_V2 - Supabase.txt` contém senha do Postgres da origem, `service_role` (`sb_secret_…`), anon key e `ACCESS_KEY` do `migrate-helper`; `repos/supabase-full-mcp-server/wrangler.fatorx.toml:23` versiona em comentário a senha do Postgres do destino (`DJ9PcaG72-…`); `env.sh` na VPS guarda ambas.
**Ação:** (a) Supabase Dashboard → Settings → Database → *Reset database password* nos dois projetos; (b) gerar novo `service_role`/`anon` no destino; (c) remover a linha 23 do `wrangler.fatorx.toml` e fazer commit; (d) atualizar secrets dos Workers `supabase-mcp-bwwbey`, `supabase-promofinance-mcp` via `cf_secret_put`; (e) reescrever `env.sh` com as novas senhas.
**Verificação:** `supabase_db_health` nos dois MCPs responde; `git grep DJ9PcaG72` vazio.

### 2. Congelar escrita na origem (Lovable) durante a reconciliação — `P0 · INFRA`
**Evidência:** origem ainda recebe cron a cada minuto (`webhook-retry-worker-1min`, `evaluate-delivery-alerts-every-min`) e tem `migrate-helper` deployado.
**Ação:** `UPDATE cron.job SET active=false` na origem para os 30 jobs (snapshot já preservado em `src/cron.txt`); desativar deploy automático do Lovable (Settings → GitHub → *Disable auto-deploy*); comunicar que a origem vira somente-leitura até a etapa 99.
**Verificação:** `SELECT count(*) FROM cron.job WHERE active` = 0 na origem.

### 3. Backup lógico completo dos dois bancos antes de qualquer DDL — `P0 · INFRA`
**Ação (container `claude-code`):** `pg_dump "$SRC" -Fc -f /workspace/backups/pf-src-$(date +%F).dump` e o mesmo para `$DST` (inclui dados, schemas `public`, `storage`, `auth`, `cron`, `vault`); copiar para MinIO (bucket `backups`) via `mc cp`.
**Verificação:** `pg_restore --list` nos dois dumps; tamanho > 0; registrar hash SHA-256 em `/workspace/notes/pf-migration-audit/BACKUPS.md`.

### 4. Declarar formalmente a fonte de verdade por artefato — `P0 · REPO`
**Ação:** criar `docs/FONTE-DE-VERDADE.md` no repo: schema = origem (dump `src_schema.sql`) **menos** o escopo Lalamove (`20260824124500`); código/edge functions/migrations pós-30/07 = repo; dados de referência fiscal = origem; dados transacionais = destino (decidir na etapa 77 o que é seed/E2E).
**Verificação:** arquivo commitado e linkado no `README.md`.

### 5. Tornar o repositório privado e limpar `supabase/.temp` do git — `P1 · SEC`
**Evidência:** `github_get_repo` → `"private": false`; `git ls-files supabase/.temp` versiona `pooler-url`, `linked-project.json`, `project-ref`.
**Ação:** GitHub → Settings → *Change visibility → Private*; `git rm -r --cached supabase/.temp`, adicionar `supabase/.temp/` ao `.gitignore`; commit.
**Verificação:** `github_get_repo.private == true`; `git ls-files supabase/.temp` vazio.

### 6. Subir ambiente de staging isolado para ensaio das migrations — `P1 · INFRA`
**Evidência:** `.github/workflows/staging-migrate.yml` espera `STAGING_DB_URL`, `STAGING_PROJECT_REF`, `STAGING_ANON_KEY`, `SUPABASE_ACCESS_TOKEN`, `TEST_ADMIN_JWT`, `PROD_DB_URL`.
**Ação:** criar projeto Supabase `promo-finance-staging` (ou branch via `create_branch` do MCP GESTÃO DE PRODUTOS se aplicável), restaurar o dump do destino (etapa 3), cadastrar os 6 secrets no GitHub.
**Verificação:** `workflow_dispatch` de `staging-migrate` com `dry_run=true` termina verde.

### 7. Instalar gate de CI que bloqueia DDL fora de `supabase/migrations/` — `P2 · REPO`
**Ação:** job em `ci.yml` que falha se `git diff --name-only origin/main` tocar `*.sql` fora de `supabase/migrations/` ou se um arquivo de migration existente for modificado (migrations são imutáveis após merge).
**Verificação:** PR de teste alterando migration antiga é bloqueado.

### 8. Criar o script reprodutível de diff (`scripts/db-diff.sh`) a partir de `inv*.sql` + `diff.js` — `P2 · QA`
**Evidência:** os scripts já existem em `/workspace/notes/pf-migration-audit/` e funcionaram nos dois bancos.
**Ação:** versionar `inv.sql`, `inv2.sql`, `inv3.sql`, `inv5.sql`, `diff.js` em `scripts/db-diff/`; wrapper que recebe `SRC`/`DST` por env e gera `DIFF_REPORT.txt`. Será o critério de aceite das fases 3–7 (etapa 97).
**Verificação:** `scripts/db-diff/run.sh` reproduz os números da tabela do §0.

---

## Fase 1 — Hardening imediato do destino (etapas 9–20)

### 9. Remover objetos de teste/lixo do destino — `P0 · SEC`
**Evidência:** tabelas `_dbg` (0 linhas, sem PK), `_t` (7), `_v4` (6); sequences `_t_id_seq`, `_v4_id_seq`; funções `_test_fn(integer)`, `_test_fn2(text)`, `_trig_fn()` com EXECUTE para `anon,authenticated`.
**Migration:** `20260825090000_limpar_objetos_de_teste.sql` — `DROP TABLE IF EXISTS public._dbg, public._t, public._v4 CASCADE; DROP FUNCTION IF EXISTS public._test_fn(integer), public._test_fn2(text), public._trig_fn();`
**Verificação:** `SELECT relname FROM pg_class WHERE relname LIKE '\_%' AND relnamespace='public'::regnamespace` vazio.

### 10. Revogar privilégios de tabela de `anon` (252 tabelas) — `P0 · SEC`
**Evidência:** `dst/grants.txt` — `anon` tem `DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE` em 252 tabelas; origem revogou.
**Migration:** `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon; ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;` e re-conceder `SELECT` apenas nas tabelas que o front usa sem sessão (verificar `src/` por chamadas pré-login: `get-vapid-key` etc. usam edge function, não tabela).
**Verificação:** `SELECT count(*) FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public'` = 0 (ou lista aprovada).

### 11. Revogar EXECUTE de `anon`/`authenticated` nas 88 funções internas — `P0 · SEC`
**Evidência:** `DIFF_REPORT.txt § FN_GRANTS` — 76 funções restritas a `service_role` na origem e 12 a `authenticated,service_role` estão abertas a `anon` no destino (ex.: `capture_slow_queries`, `check_login_lockout`, `audit_trigger_generic`, `capture_pg_stat_statements_baseline`, `cleanup_*`, `run_observability_rpc`).
**Migration:** gerar a partir de `src/fn_grants.txt`: para cada função, `REVOKE EXECUTE ON FUNCTION … FROM PUBLIC, anon[, authenticated]; GRANT EXECUTE … TO service_role[, authenticated];` + `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;`.
**Verificação:** `diff fn_grants` = 0 divergências.

### 12. Fixar `search_path` em todas as SECURITY DEFINER sem configuração — `P0 · SEC`
**Evidência:** `is_user_admin()` e `has_any_role(uuid, app_role[])` são SECDEF com `cfg=` vazio (`dst/functions.txt`). A origem tem `gate_27_secdef_sem_search_path()` justamente para isso.
**Migration:** `ALTER FUNCTION public.is_user_admin() SET search_path = public, pg_catalog;` idem `has_any_role`; rodar `SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef AND p.proconfig IS NULL` e corrigir todas.
**Verificação:** consulta acima retorna 0 linhas.

### 13. Conter `exec_sql(text)` — `P0 · SEC`
**Evidência:** SECDEF com `search_path = public, extensions, auth, storage`, executa DDL arbitrário; EXECUTE só para `service_role` (ok), mas é o backdoor do MCP e o repo já migrou para `mcp-query` (commit `486e839`).
**Ação:** mover para schema `private` (`ALTER FUNCTION … SET SCHEMA private`), remover `auth, storage` do `search_path`, `REVOKE ALL FROM PUBLIC`, registrar em `docs/SECURITY.md`; após o MCP destino confirmar uso exclusivo de `mcp-query`, `DROP FUNCTION`.
**Verificação:** `supabase_db_query` do MCP continua funcionando via `mcp-query`.

### 14. Mover `pg_stat_statements` e `pg_trgm` de `public` para `extensions` — `P1 · SEC`
**Evidência:** `dst/extensions.txt` — ambas em `public`; views `public.pg_stat_statements`, `public.pg_stat_statements_info` expostas ao PostgREST.
**Migration:** `ALTER EXTENSION pg_stat_statements SET SCHEMA extensions; ALTER EXTENSION pg_trgm SET SCHEMA extensions;` (checar dependências: `v_table_bloat`, `vw_rpc_hotspots`, `capture_slow_queries` referenciam `pg_stat_statements` — ajustar para `extensions.pg_stat_statements`).
**Verificação:** `SELECT extnamespace::regnamespace FROM pg_extension WHERE extname IN ('pg_stat_statements','pg_trgm')` = `extensions`.

### 15. Restaurar `FORCE ROW LEVEL SECURITY` em tabelas sensíveis — `P1 · RLS`
**Evidência:** origem tem `forced=true` em `audit_logs`, `frontend_error_logs`, `password_reset_tokens`; destino só em `password_reset_tokens`.
**Migration:** `ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY; ALTER TABLE public.frontend_error_logs FORCE ROW LEVEL SECURITY;` (após etapa 51, aplicar na tabela particionada).
**Verificação:** `dst/rls.txt` sem divergência de `forced`.

### 16. Corrigir `planos_acao` (RLS ativo com 0 policies = deny-all) — `P1 · RLS`
**Evidência:** `RLS|planos_acao|enabled=true|policies=0` no destino; origem tem 1 policy tenant-based; front consome `planos_acao`.
**Migration:** recriar a policy da origem (`src/policies_norm.txt` → `public.planos_acao.*`) com `TO authenticated` e `empresa_membro_ativo(empresa_id)`.
**Verificação:** `SELECT * FROM planos_acao` como usuário autenticado retorna linhas da empresa.

### 17. Remover usuário E2E de produção e alinhar `auth.users` — `P1 · SEC`
**Evidência:** destino tem `e2e-admin@promo-finance.test` (criado 22/08, último login 24/08, `user_roles`=4); origem tem `teste.admin@promobrindes.com.br` (nunca logou).
**Ação:** mover E2E para o staging (etapa 6); `supabase_auth_delete_user` no destino após confirmar que nenhum `cron`/`edge` usa esse UID; na origem apagar `teste.admin@`.
**Verificação:** `auth.users` do destino = usuários reais (`ti@`, + 2 comuns); `TEST_ADMIN_JWT` do CI aponta para staging.

### 18. Remover o bucket de teste da origem e a edge `migrate-helper` — `P1 · SEC`
**Evidência:** bucket `mcp-test-1787607145047` na origem; `migrate-helper` deployada na origem com `ACCESS_KEY` conhecida e removida do repo em `86b2126`.
**Ação:** `supabase functions delete migrate-helper --project-ref lszcmoymovkpckehlagr`; `DELETE FROM storage.buckets WHERE id='mcp-test-1787607145047'`.
**Verificação:** `OPTIONS /functions/v1/migrate-helper` → 404.

### 19. Auditar as 35 edge functions com `verify_jwt=false` para autenticação interna obrigatória — `P0 · SEC`
**Evidência:** `config.toml` lista 35 funções sem JWT; sondagem: `POST /functions/v1/gerar-alertas` na origem executou e retornou 200 **sem credencial**.
**Ação:** para cada função da lista, exigir um dos mecanismos: header `x-cron-secret` (`CRON_DISPATCH_SECRET`/`internal_job_secret()`), assinatura de webhook (`ASAAS_WEBHOOK_TOKEN`, `BITRIX24_*`, `BLING_*`), ou JWT. Funções sem justificativa (`gerar-alertas`, `executar-relatorios`, `executar-analise-preditiva`, `enviar-alerta-email`, `analyze-document`, `categorizar-despesa`, `analise-fluxo-ia`, `insights-relatorio`, `benchmarking-setorial`, `gerar-alertas-tributarios`, `gerar-pdf-tributario`, `decidir-regime`, `cnpja-lookup`, `compare-schemas`, `external-data`) voltam para `verify_jwt=true`.
**Verificação:** script `scripts/probe-functions.sh` (curl sem token) → 401/403 em todas exceto webhooks/SSO/health.

### 20. Registrar exceções de segurança aceitas em `docs/SECURITY.md` — `P2 · REPO`
**Ação:** documentar `exec_sql` (temporário), webhooks públicos, `health`, `get-vapid-key`, `get-mapbox-token`, SSO/SCIM, com dono e data de revisão.
**Verificação:** `gate_25`–`gate_35` (etapa 59) leem a lista de exceções.

---

## Fase 2 — Baseline de migrations e trilha de versionamento (etapas 21–30)

### 21. Limpar o histórico fantasma `financeiro_001..009` do destino — `P0 · REPO`
**Evidência:** `dst/migrations.txt` — 9 versões `20260521171250..172112` nomeadas `financeiro_*` (vendas_unificadas, vendas_parcelas…) cujos objetos não existem; `wrangler.fatorx.toml` chama o ref de "Fator X".
**Ação:** `DELETE FROM supabase_migrations.schema_migrations WHERE name LIKE 'financeiro_%'` (guardar cópia em `docs/migracao/historico-fantasma.json`).
**Verificação:** `supabase migration list --linked` mostra apenas versões do repo.

### 22. Gerar a migration **baseline** a partir de `src_schema.sql` — `P0 · SCHEMA`
**Ação (container):** a partir de `/workspace/notes/pf-migration-audit/src_schema.sql`: (1) remover objetos do escopo Lalamove (lista do `20260824124500` + views `drivers_safe_view`, `orders_*_view`, coluna `bitrix24_stage_mappings.lalamove_status` → decidir na etapa 40); (2) remover `mcp-test` e qualquer referência a `lszcmoymovkpckehlagr`; (3) salvar como `supabase/migrations/20260825100000_baseline_schema_origem.sql` **idempotente** (`CREATE … IF NOT EXISTS`, `CREATE OR REPLACE`, `DO $$ … $$` para policies/enums).
**Verificação:** aplicar em staging vazio → `scripts/db-diff` staging×origem = 0 divergências (exceto Lalamove).

### 23. Definir a ordem de reconciliação no destino (não-vazio) — `P0 · SCHEMA`
**Ação:** o baseline não roda direto no destino. Sequência: fases 3→4→5→6 como migrations incrementais **derivadas do diff**, cada uma com `-- reconcile: <categoria>` no cabeçalho; o baseline (etapa 22) fica como referência e é o que se usa para criar ambientes novos.
**Verificação:** `docs/migracao/ORDEM.md` lista as migrations 20260825* e suas dependências.

### 24. Registrar no destino as migrations do repo já aplicadas de fato — `P1 · REPO`
**Evidência:** 10 `reconciliar_*` de 22/08 estão registradas; `20260824124500` e `20260824180000` não constam (objetos Lalamove não existem no destino — provavelmente nunca existiram).
**Ação:** `INSERT INTO supabase_migrations.schema_migrations(version,name)` para `20260824124500` e `20260824180000` **somente após** confirmar que `check_integrity_invariants()` do destino é a versão do arquivo (hash `1a9523…` em `dst/functions.txt` ≠ origem `5ca2df…` — comparar com o arquivo).
**Verificação:** `supabase migration list` sem pendências além das 20260825*.

### 25. Congelar o formato das migrations pós-Lovable — `P2 · REPO`
**Evidência:** repo mistura `001_create_tables.sql`, `20241231000000`, UUIDs Lovable e nomes descritivos (535 arquivos, 314 dos quais não rastreados na origem).
**Ação:** regra em `CONTRIBUTING.md`: `YYYYMMDDHHMMSS_snake_case.sql`, cabeçalho com objetivo/rollback/pré-condições (como em `20260824180000`), sem `DROP` destrutivo sem `-- APROVADO:` explícito.
**Verificação:** lint no CI (`scripts/check-migration-name.sh`).

### 26. Arquivar as migrations legadas fora de padrão — `P3 · REPO`
**Evidência:** `001_create_tables`, `002_rls_policies`, `003_seed_data`, `20241231000000/1` não são rastreadas em nenhum banco.
**Ação:** mover para `supabase/migrations/_archive/` (Supabase CLI ignora subpastas) com README explicando.
**Verificação:** `supabase db push --dry-run` não tenta aplicá-las.

### 27. Workflow de deploy de banco no CI (`db-migrate.yml`) — `P1 · REPO`
**Ação:** em push para `main`: `supabase link --project-ref bwwbeyolnnzppeuhgkcd` + `supabase db push` (usa `SUPABASE_ACCESS_TOKEN` + `SUPABASE_DB_PASSWORD` do GitHub Secrets); requer aprovação manual (environment `production`) e roda antes `staging-migrate`.
**Verificação:** merge de uma migration vazia (`select 1`) registra a versão no destino.

### 28. Workflow de deploy de edge functions no CI (`functions-deploy.yml`) — `P1 · REPO`
**Ação:** `supabase functions deploy --project-ref bwwbeyolnnzppeuhgkcd` para as pastas alteradas (matriz por diretório) + `--no-verify-jwt` **somente** para a lista aprovada da etapa 19 (ler de `config.toml`).
**Verificação:** alterar `health/index.ts` → nova versão publicada; `OPTIONS /functions/v1/health` = 200.

### 29. Desligar a integração Lovable → GitHub como origem de mudanças — `P1 · INFRA`
**Evidência:** commits "Visual edit in Lovable" (`0cc4755`) ainda existem; fluxo desejado é GitHub-first.
**Ação:** Lovable → Settings → GitHub → manter apenas *pull* (Lovable redeploya do GitHub), bloquear push do Lovable para `main` via branch protection (require PR + status checks).
**Verificação:** branch protection ativa em `main`; próximo edit no Lovable gera PR e não commit direto.

### 30. Espelhar `ESTADO_ATUAL.md` como documento vivo gerado pelo diff — `P3 · REPO`
**Ação:** `scripts/db-diff/run.sh --markdown > docs/ESTADO-BANCO.md` no CI semanal; `ESTADO_ATUAL.md` passa a linkar para ele.
**Verificação:** arquivo atualizado pelo bot toda segunda.

---

## Fase 3 — Schema: enums, tabelas e colunas (etapas 31–45)

### 31. Recriar os 4 enums fiscais ausentes — `P0 · SCHEMA`
**Evidência:** `src/enums.txt` — `regime_tributario_enum (MEI,SIMPLES,PRESUMIDO,REAL,ARBITRADO)`, `status_workflow (IDENTIFICADO…CANCELADO)`, `tipo_cobranca (boleto,pix,transferencia,cartao,debito_automatico,dinheiro,cheque)`, `tipo_destinatario (CONTRIBUINTE_REVENDA,…,EXTERIOR)` inexistem no destino; os 8 restantes são Lalamove (não recriar).
**Migration:** `20260825110000_enums_fiscais.sql` com `DO $$ BEGIN CREATE TYPE … EXCEPTION WHEN duplicate_object THEN NULL; END $$`.
**Verificação:** `diff enums` = 0 (excluindo Lalamove).

### 32. Recriar as 35 tabelas ausentes fora do escopo Lalamove — `P0 · SCHEMA`
**Evidência:** lista (comm origem−destino−Lalamove−partições): `acessos_suspeitos, auditoria_tributaria, benchmarks_setoriais, beneficios_fiscais, bitrix_oauth_tokens, bling_sync_logs, bling_tokens, bling_webhook_events, catalogos_fiscais_cargas, catalogos_tributarios_health_history, cnpja_cache, convites_contador, elisao_simulacoes_regime, estrategias_elisao, eventos_contabilizacao_log, frontend_error_alert_state, frontend_error_silence_digest_log, glossario_tributario, index_usage_snapshots, indices_uso_excecoes, integration_secrets, operacoes_icms, overlay_rejeicoes_auditoria, projecoes_reforma, regras_contabilizacao_automatica, retencao_politicas, saved_filter_subscriptions, scim_operations_log, security_alerts, simulacao_tributos_detalhados, simulacoes, slo_metrics_diarias, sso_role_mappings, sso_sandbox_runs, sso_user_groups`. Todas têm consumidor no repo (ex.: `integration_secrets` em 2 edge functions, `beneficios_fiscais` em 1, `glossario_tributario` no front).
**Migration:** `20260825111000_tabelas_ausentes.sql` — extrair `CREATE TABLE` + PK + defaults de `src_schema.sql` (39 PKs ausentes = exatamente estas tabelas + partições).
**Verificação:** `SELECT count(*) FROM pg_tables WHERE schemaname='public'` = 241 − 3 (lixo) + 35.

### 33. Decidir o destino das tabelas "só destino" (`nfe_xml`, `subscriptions`, `estrategias_elisao_catalogo`, `*_2026_01..04`) — `P1 · SCHEMA`
**Evidência:** `nfe_xml` (0 linhas) e `subscriptions` (0 linhas) não têm consumidor em `src/` nem em `supabase/functions/`; `estrategias_elisao_catalogo` é **view** na origem sobre `estrategias_elisao` e **tabela** (8 linhas) no destino, usada por 1 arquivo do front.
**Ação:** `DROP TABLE nfe_xml, subscriptions` (sem uso; a origem usa `nfe_recebidas` + bucket `nfe-xml`); renomear `estrategias_elisao_catalogo` → `_bak_estrategias_elisao_catalogo`, criar `estrategias_elisao` (etapa 32), recriar a **view** `estrategias_elisao_catalogo` com a definição da origem, migrar as 8 linhas (etapa 74) e dropar a `_bak`.
**Verificação:** front `EstrategiasElisao*` lista 17 estratégias.

### 34. `fornecedores`: restaurar 13 colunas perdidas — `P0 · SCHEMA`
**Evidência:** origem 20 colunas; destino 7 (`cnpj, created_at, id, nome_fantasia, razao_social, updated_at, user_id`). Faltam `ativo, cidade, cnpj_cpf, contato, email, endereco, estado, limite_credito, nome, observacoes, ramo_atividade, score, telefone` — `contas_pagar.fornecedor_nome` e telas de fornecedor dependem delas.
**Migration:** `ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS …` para cada uma (tipos/defaults conforme `src/` — `ativo boolean NOT NULL DEFAULT true`, `limite_credito numeric`, `score numeric`).
**Verificação:** assinatura md5 de `fornecedores` igual à origem (`bbab7b1f…`).

### 35. `empresas`: restaurar 6 colunas fiscais + regra de empresa padrão — `P0 · SCHEMA`
**Evidência:** faltam `aliquota_rat numeric(5,4)`, `aliquota_terceiros numeric(5,4)`, `cnae_principal text`, `codigo_fpas text`, `is_padrao boolean NOT NULL DEFAULT false`, `regime_tributario text`; trigger `trg_empresas_unica_padrao` e função `empresas_unica_padrao()` ausentes; `sync_regime_tributario_empresa()` ausente.
**Migration:** adicionar colunas; criar função + trigger `BEFORE INSERT OR UPDATE OF is_padrao, ativo`; backfill `is_padrao=true` na única empresa existente.
**Verificação:** `SELECT count(*) FROM empresas WHERE is_padrao` = 1; `empresa_padrao_id()` retorna o UUID.

### 36. `apuracoes_irpj_csll`: restaurar 17 colunas de apuração — `P0 · SCHEMA`
**Evidência:** origem 52 col., destino 35. Faltam `csll_a_pagar, csll_base, csll_total, data_transmissao, irpj_a_pagar, irpj_adicional, irpj_adicional_base, irpj_incentivos_deducoes, irpj_normal, irpj_total, mes, numero_recibo, saldo_negativo_csll, saldo_negativo_irpj, total_tributos, trimestre, updated_at` (todas `NOT NULL DEFAULT 0` na origem, exceto texto/data).
**Migration:** `ADD COLUMN … NOT NULL DEFAULT 0` (seguro: 2 linhas no destino) + trigger `updated_at`.
**Verificação:** edge `executar-fechamento-tributario` e tela de apuração salvam sem erro de coluna.

### 37. Grupo "elisão fiscal": realinhar 6 tabelas — `P1 · SCHEMA`
**Evidência:** `elisao_alertas` (13→9: falta `descricao, lido, referencia_id, resolvido_em, tipo_divergencia, updated_at, valor_estimado`; destino tem `contexto, mensagem, tipo` que a origem não tem), `elisao_creditos_auditoria` (18→10: falta `aprovador_id, cst_csosn, data_aprovacao, divergencias_detectadas, historico_decisoes, metodologia_aplicada, motivo_rejeicao, nota_id, score_confianca, valor_base, valor_credito_calculado`), `elisao_regras_creditos` (`aliquota numeric(9,6)`, `base_legal, ncm_prefixo, tipo_credito, updated_at` vs `fundamento_legal, ncm, nome`), `elisao_tarefas_acionaveis` (`bitrix_sync_erro, prazo, sincronizado_em, tipo_oportunidade` vs `data_vencimento, economia_associada, tipo`), `oportunidades_elisao` (23→12), `estrategias_elisao` (etapa 32).
**Migration:** adicionar colunas da origem; manter as colunas extras do destino como `DEPRECATED` por 1 ciclo; ajustar `calcular_potencial_elisao()` (etapa 57).
**Verificação:** hooks `useElisao*` do front sem erro 400 do PostgREST.

### 38. Grupo "contabilidade": `plano_contas`, `lancamentos_contabeis`, `partidas_contabeis`, `regras_contabilizacao_automatica`, `eventos_contabilizacao_log` — `P1 · SCHEMA`
**Evidência:** `plano_contas` 16→11, `lancamentos_contabeis` 13→10, `partidas_contabeis` 8→6; `plano_contas.parent_id` FK ausente; triggers `trg_lancamento_contabil_before_insert/update`, `trg_normalizar_tipo_partida`, constraint-trigger `trg_validar_partidas_dobradas` ausentes; funções `fn_balancete`, `fn_livro_razao`, `fn_indices_contabeis`, `fn_norm_conta_codigo` ausentes.
**Migration:** colunas + FK + funções + triggers (o destino tem 31 lançamentos/192 partidas — validar partidas dobradas antes de ativar o constraint-trigger; registrar exceções em `docs/migracao/partidas-invalidas.md`).
**Verificação:** `SELECT * FROM fn_balancete(<empresa>, '2026-01-01', '2026-08-31', 5)` executa; inserir lançamento desbalanceado falha.

### 39. Grupo "cobrança/financeiro": `pix_templates` (23→10), `pagamentos_recorrentes` (21→14), `contratos` (13→18), `contas_receber` (39→38: falta `bitrix_deal_id`), `contas_bancarias.saldo_disponivel` (default `saldo_atual`), `acordos_parcelamento`, `boletos`, `execucoes_cobranca`, `conciliacoes*`, `divergencias_conciliacao` (`resolvida` vs `resolvido`), `logs_*` — `P1 · SCHEMA`
**Migration:** colunas ausentes; para `contratos` manter as 5 extras do destino (`cliente_id, created_by, dias_aviso_renovacao, fornecedor_id, observacoes`) — são evolução legítima pós-Lovable; documentar em `docs/migracao/decisoes-colunas.md`; trigger `trg_pix_template_sync_legacy` + `increment_pix_template_uso()`.
**Verificação:** assinaturas md5 das tabelas do grupo iguais à origem (com exceções documentadas).

### 40. Grupo "integrações": `api_keys` (nomes conflitantes), `bitrix24_stage_mappings`, `blocked_ips` (15→11), `alert_configurations`/`alertas`/`alerts` (falta `empresa_id`), `n8n_*`, `webhook_*` — `P1 · SCHEMA`
**Evidência:** `api_keys` origem = `key_hash, key_prefix, name, scopes NOT NULL, expires_at, last_used_at, revoked_at, created_by, updated_at`; destino = `chave, nome, ativo, expira_em, ultimo_uso` — **esquemas incompatíveis**, e o front/edge usam o modelo da origem (hash, nunca chave em claro). `bitrix24_stage_mappings.lalamove_status` é Lalamove (dropar a coluna, manter a tabela). `blocked_ips` falta `blocked_until, permanent, unblocked_at, unblocked_by`.
**Migration:** recriar `api_keys` no modelo da origem (0 linhas no destino → `DROP`/`CREATE` seguro); adicionar `empresa_id` + FK em `alert_configurations`, `alertas`, `alerts`, `risk_rules`, `solicitacoes_lgpd` (FKs listadas em `DIFF § CONSTRAINTS`).
**Verificação:** `scim-server`, `validate-ip-geo`, `gerar-alertas-dispatcher` executam contra o destino.

### 41. Grupo "observabilidade": `performance_alerts` (15→13), `integrity_alerts` (14→13), `kpis_operacionais`, `frontend_error_logs` (falta `severity`), `digest_envios_log`, `user_digest_preferences`, `slo_metrics_diarias`, `index_usage_snapshots` — `P2 · SCHEMA`
**Migration:** colunas ausentes; `frontend_error_logs.severity text NOT NULL DEFAULT 'error'` é pré-requisito de `fe_error_signature()`, `claim_frontend_error_alerts()` e da edge `monitorar-erros-frontend`.
**Verificação:** `get_frontend_error_groups(now()-interval '7 days', null, 50)` executa.

### 42. Grupo "tributário/catálogos": `faturamento_mensal` (falta `observacoes`), `folha_pagamento` (falta `numero_funcionarios, observacoes`), `fechamentos_tributarios` (16→12: `checklist, created_by, forcado, justificativa_forcado, score_conformidade`), `prejuizos_fiscais`, `per_dcomp`, `incentivos_fiscais`, `regimes_simulados` (19→17), `relatorios_tributarios_agendados`, `sped_contabil_arquivos` (17→13), `retencoes_fonte`, `operacoes_tributaveis` (51 col., assinatura diferente), `notas_fiscais` (16→12), `notas_fiscais_ocr` (16→20) — `P1 · SCHEMA`
**Migration:** derivar coluna a coluna de `src_schema.sql` vs `dst_schema.sql`; `notas_fiscais_ocr` tem 4 extras no destino — manter.
**Verificação:** assinaturas iguais ou exceção documentada.

### 43. Restaurar precisão numérica perdida — `P1 · SCHEMA`
**Evidência:** `aliquotas_interestaduais/internas_uf/iss_municipal.aliquota numeric(6,4)` → `numeric`; `cnaes.presuncao_*/rat_padrao/terceiros_padrao numeric(6,4)` → `numeric`; `faixas_simples_nacional.aliquota numeric(8,6)`, `rbt12_* numeric(14,2)` → `numeric`; `conformidade_snapshots.score/pontualidade numeric(5,1)` → `numeric`; `digest_envios_log.multa_total numeric(14,2)` → `numeric`; `entregas_obrigacoes.valor_multa numeric(14,2)` → `numeric(18,2)`.
**Migration:** `ALTER TABLE … ALTER COLUMN … TYPE numeric(6,4)` etc. (dados atuais cabem; validar com `SELECT max(scale(aliquota))` antes).
**Verificação:** `diff` de assinatura das 8 tabelas = igual.

### 44. `evidencias_pacotes` (11→4) e `sped_contabil_arquivos`: restaurar colunas de storage — `P1 · SCHEMA`
**Evidência:** faltam `escopos text[] NOT NULL`, `gerado_por_email, manifest jsonb NOT NULL, periodo_fim, periodo_inicio, storage_path, tamanho_bytes`; a edge `gerar-pacote-evidencias` grava esses campos.
**Migration:** adicionar colunas (defaults `'{}'`), criar bucket `evidencias` se a edge exigir (checar `_shared/storage.ts`).
**Verificação:** `gerar-pacote-evidencias` termina 200 no destino.

### 45. Fechar o restante das 78 tabelas divergentes — `P2 · SCHEMA`
**Evidência:** `user_sessions` (10→7), `vendedores` (8→7), `centros_custo` (falta `tipo`), `conciliacoes`, `anexos_financeiros`, `ufs`, `ncms`, `itens_lista_iss`, `protocolos_st_ncms`, `scim_setup_checklist`, `user_active_filters`, `solicitacoes_lgpd` (12→10), `organizacoes` (8→12 — manter extras), `bloqueios_duplicidade` (7→20 — manter extras, são do 22/08), `relatorios_agendados`, `regras_conciliacao`, `regras_roteamento_financeiro`, `sessoes_conciliacao`, `logs_baixa_automatica`, `logs_conciliacao_retroativa`, `extrato_bancario`.
**Migration:** gerar automaticamente com `scripts/db-diff/columns.js` (a escrever) que emite `ALTER TABLE ADD COLUMN` para colunas origem−destino.
**Verificação:** `diff` de assinatura de colunas: 0 divergências não documentadas.

---

## Fase 4 — Constraints, índices, partições e realtime (etapas 46–55)

### 46. Recriar os 191 CHECK constraints ausentes — `P0 · SCHEMA`
**Evidência:** `DIFF § CONSTRAINTS` — `c=191` (status/enum-like em `contas_pagar.status`, `boletos.status`, `regua_cobranca_*`, valores ≥ 0, `faixas_simples_nacional.reparticao` via `faixa_simples_reparticao_valida()`, etc.).
**Migration:** extrair `ALTER TABLE … ADD CONSTRAINT … CHECK` de `src_schema.sql`; aplicar com `NOT VALID` + `VALIDATE CONSTRAINT` em passo separado para não travar; listar linhas que violam antes (`docs/migracao/violacoes-check.md`).
**Verificação:** `SELECT count(*) FROM pg_constraint WHERE contype='c' AND connamespace='public'::regnamespace` ≥ origem − Lalamove.

### 47. Recriar as 31 UNIQUE + 29 FK ausentes — `P0 · SCHEMA`
**Evidência:** FKs em tabelas comuns: `alert_configurations.empresa_id`, `alertas.empresa_id`, `alerts.empresa_id`, `plano_contas.parent_id`, `risk_rules.empresa_id`, `solicitacoes_lgpd.empresa_id`, `user_anomalia_preferences.user_id`, `user_digest_preferences.user_id`, `user_roles.user_id` → `auth.users`, `elisao_creditos_auditoria.nota_id`; demais FKs pertencem às tabelas da etapa 32.
**Migration:** `ADD CONSTRAINT … FOREIGN KEY … ON DELETE …` conforme origem; órfãos (ex.: `user_roles` com UID do E2E removido) tratados antes.
**Verificação:** `diff constraints` (excl. Lalamove) = 0 ausentes.

### 48. Revisar as 56 constraints e 69 índices "só destino" — `P2 · SCHEMA`
**Ação:** classificar cada um: (a) veio das migrations 22/08 (`idempotencia_regua_por_canal`, `bloqueios_duplicidade`) → manter e **portar para a origem/baseline**; (b) duplicado/redundante → `gate_33_indices_redundantes()` decide; (c) lixo (`_t_pkey`, `_v4_pkey`) → já removido na etapa 9.
**Verificação:** tabela em `docs/migracao/objetos-so-destino.md` com decisão por item.

### 49. Recriar os 274 índices ausentes (fora Lalamove) — `P1 · SCHEMA`
**Evidência:** por tabela: `aliquotas_iss_municipal(5)`, `protocolos_st_ncms(4)`, `digest_envios_log(4)`, `api_keys(3)`, `ncms(3)`, `plano_contas(3)`, `performance_alerts(2)`, `contas_receber(1)`, `clientes(1)`, `empresas(1)`, `audit_logs(1)`, … (lista completa em `DIFF § INDEXES`).
**Migration:** `CREATE INDEX CONCURRENTLY IF NOT EXISTS` (fora de transação — um statement por chamada, ou `psql` no container); índices de tenant (`*_empresa_id_idx`) primeiro — `gate_31_tenant_sem_indice()`.
**Verificação:** `diff indexes` ausentes = 0 (excl. Lalamove).

### 50. Corrigir os 14 índices e 11 constraints divergentes — `P2 · SCHEMA`
**Ação:** para cada par SRC/DST em `DIFF_REPORT.txt`, adotar a definição da origem (`DROP INDEX … ; CREATE INDEX …`), exceto quando a diferença for consequência de coluna extra do destino mantida (etapas 39/45).
**Verificação:** `diff` divergentes = 0.

### 51. Restaurar particionamento de `audit_logs` — `P1 · SCHEMA`
**Evidência:** origem `PARTITION BY RANGE (created_at)` com 11 filhas (`2026_02..2026_11` + `default`); destino tem `audit_logs` flat (424 linhas) **e** filhas `audit_logs_2026_01..10`/`default` órfãs (0–25 linhas).
**Migration:** (1) `ALTER TABLE audit_logs RENAME TO audit_logs_flat_bak`; (2) `CREATE TABLE audit_logs (…) PARTITION BY RANGE (created_at)`; (3) `ATTACH PARTITION` das filhas existentes com `FOR VALUES FROM … TO …` (após `DROP` de PK/índices incompatíveis) + criar `2026_11`, `2026_12`; (4) `INSERT INTO audit_logs SELECT * FROM audit_logs_flat_bak`; (5) recriar policies/triggers/índices na pai; (6) `FORCE RLS`; (7) manter `_flat_bak` 30 dias.
**Verificação:** `SELECT count(*) FROM audit_logs` = 424 + linhas das filhas; `\d+ audit_logs` mostra `Partition key`.

### 52. Restaurar particionamento de `frontend_error_logs` + trigger de sanitização — `P1 · SCHEMA`
**Evidência:** mesma situação; origem tem `trg_frontend_error_logs_sanitize` em cada partição chamando `frontend_error_logs_sanitize()` (remove PII do stack).
**Migration:** idem etapa 51; criar trigger na pai (Postgres propaga para filhas) — origem criou por partição; simplificar para trigger na pai.
**Verificação:** inserir erro com e-mail no `error_message` → salvo mascarado.

### 53. Recriar `maintain_monthly_partitions()` e `drop_old_partitions()` no formato da origem — `P1 · FN`
**Evidência:** `maintain_monthly_partitions` existe no destino com corpo diferente (`e907c2…` vs `351d79…`) e sem cron; `drop_old_partitions` ausente.
**Migration:** `CREATE OR REPLACE` a partir de `src_schema.sql`; testar `SELECT maintain_monthly_partitions()` → cria `2026_12`, `2027_01`.
**Verificação:** partições futuras existem; retorno JSON `created: [...]`.

### 54. Reativar publicação realtime de `performance_alerts` — `P2 · INFRA`
**Evidência:** `src/realtime.txt` = `public.performance_alerts`; destino vazio; front usa `supabase.channel('performance_alerts')`.
**Ação:** `supabase_db_realtime action=add table=performance_alerts` (ou `ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_alerts`).
**Verificação:** `pg_publication_tables` lista a tabela.

### 55. Recriar `mv_benchmark_setorial` + refresh policy — `P2 · SCHEMA`
**Evidência:** matview ausente no destino; `comparar-benchmark-setorial` (deployada) e `benchmarking-setorial` leem dela; `mv_performance_alerts_weekly` existe mas com 2 índices a menos.
**Migration:** `CREATE MATERIALIZED VIEW … WITH NO DATA` + índices + `REFRESH` via cron `refresh-performance-alerts-weekly` (etapa 89) e função `run_observability_rpc`.
**Verificação:** `REFRESH MATERIALIZED VIEW mv_benchmark_setorial` executa; `SELECT count(*)` > 0 após seed (etapa 74).

---

## Fase 5 — Functions, triggers e views (etapas 56–66)

### 56. Restaurar as funções de **tenant/segurança** — `P0 · FN`
**Evidência:** ausentes: `empresa_membro_ativo(uuid)`, `empresa_padrao_id()`, `pode_ver_dado_sensivel()`, `definir_empresa_padrao(uuid)`, `provisionar_usuario(uuid)`, `provisionar_usuario_atual()`, `auto_vincular_empresa_padrao()`, `set_empresa_id_default()`, `set_empresa_id_from_profile()`, `backfill_empresa_id(boolean)`, `auditar_acessos_cross_tenant(integer)`, `get_acessos_suspeitos(...)`. As policies da fase 6 dependem de `empresa_membro_ativo`.
**Migration:** `20260825140000_funcoes_tenant.sql` extraído de `src_schema.sql` (todas `SECURITY DEFINER SET search_path=public`).
**Verificação:** `SELECT empresa_membro_ativo(empresa_padrao_id())` como `ti@` = true.

### 57. Restaurar as funções de **domínio fiscal/contábil** — `P0 · FN`
**Evidência:** `calcular_potencial_elisao`, `check_catalogos_tributarios_invariants`, `validar_catalogos_tributarios`, `get_catalogos_tributarios_health`, `get_catalogos_tributarios_history`, `get_cobertura_fiscal_uf`, `get_ultima_carga_fiscal`, `recarregar_seeds_fiscais(text)`, `faixa_simples_reparticao_valida`, `fn_balancete`, `fn_livro_razao`, `fn_indices_contabeis`, `fn_norm_conta_codigo`, `gerar_alertas_vencimento`, `gerar_contas_recorrentes`, `detectar_duplicidades_financeiras`, `mascarar_chave_pix`, `increment_pix_template_uso`, `duplicate_saved_filter`.
**Migration:** `20260825141000_funcoes_dominio.sql`.
**Verificação:** `SELECT get_catalogos_tributarios_health()` retorna `saudavel:true` após etapa 74.

### 58. Restaurar as funções de **observabilidade/retenção** — `P1 · FN`
**Evidência:** `capture_index_usage_snapshot`, `run_integrity_cycle`, `close_stale_integrity_alerts`, `escalate_stale_integrity_alerts`, `resolve_integrity_alert`, `get_integrity_alerts(int,bool)`, `get_performance_alerts(…, p_incluir_resolvidos)`, `purge_old_rows`, `get_retencao_politicas_status`, `get_retention_history`, `claim_frontend_error_alerts`, `claim_silenciamentos_digest`, `get_silenciamentos_expirando`, `silenciar_alerta_erro_frontend`, `fe_error_signature`, `get_frontend_error_groups`, `get_frontend_error_occurrences`, `frontend_error_logs_sanitize`, `watch_cron_failures`, `delete_cron_job`, `toggle_cron_job`, `internal_job_secret()`. `check_integrity_invariants` fica na versão do repo (`20260824180000`, sem Lalamove).
**Migration:** `20260825142000_funcoes_observabilidade.sql`; `internal_job_secret()` passa a ler `vault.decrypted_secrets` (etapa 76) em vez de `integration_secrets`.
**Verificação:** `SELECT run_integrity_cycle()` retorna JSON sem erro.

### 59. Restaurar as funções **gate_25…gate_35** e ligá-las ao CI — `P1 · FN`
**Evidência:** ausentes no destino; `ci-security-gate-log` e a tabela `ci_security_gate_events` (2 eventos na origem, 0 no destino) dependem delas: `gate_25_policies_sem_tenant`, `gate_27_secdef_sem_search_path`, `gate_29_rpc_sem_escopo_empresa`, `gate_30_views_inseguras`, `gate_31_tenant_sem_indice`, `gate_32_pii_sem_mascara`, `gate_33_indices_redundantes`, `gate_34_indices_nao_utilizados`, `gate_35_tabelas_sem_retencao`.
**Migration:** `20260825143000_gates_seguranca.sql`.
**Verificação:** `gate_27_secdef_sem_search_path()` = 0 linhas após etapa 12; `gate_25_policies_sem_tenant()` = 0 após fase 6.

### 60. Restaurar `set_updated_at()`/`handle_updated_at()` e os 79 triggers ausentes — `P1 · FN`
**Evidência:** 86 triggers ausentes, 7 são Lalamove; 60+ são `BEFORE UPDATE … set_updated_at()`; os demais: `trg_*_set_empresa` (multi-tenant em `alert_configurations, alertas, alerts, risk_rules, solicitacoes_lgpd`), `trg_auto_vincular_empresa_padrao` em `user_roles`, `trg_sync_regime_empresa`, `trg_protocolo_st_ncm_autolink`, `trg_pix_template_sync_legacy`, contabilidade (etapa 38), sanitize (etapa 52).
**Migration:** `20260825144000_triggers.sql` gerado de `src/triggers.txt` (coluna 5 = `pg_get_triggerdef`).
**Verificação:** `diff triggers` ausentes = 0 (excl. Lalamove).

### 61. Corrigir os 2 triggers divergentes (`organizacoes`, `organizacao_membros`) — `P3 · FN`
**Ação:** adotar definição da origem (função `set_updated_at()` em vez da variante do destino).
**Verificação:** hash igual.

### 62. Alinhar as 17 funções divergentes — `P1 · FN`
**Evidência:** volatilidade `STABLE`→`VOLATILE` em `get_cron_jobs`, `get_cron_run_history(text,int)`, `get_retencoes_pendentes_count`, `get_user_permissions`, `get_user_roles` (origem otimizou); `search_path` sem `pg_catalog` em `is_org_membro`, `is_org_responsavel`; corpos diferentes em `cleanup_log_tables`, `empresa_acessivel`, `notify_performance_alert_trigger`, `registrar_evento_pagar`, `registrar_evento_receber(6 args)`, `sefaz_detect_nsu_gaps`, `sefaz_detect_stuck_cursors`, `check_nfe_xml_path_invariants`, `maintain_monthly_partitions`, `resolve_sso_providers_for_domain` (destino devolve `allowed_domains` a mais — **manter destino**, ajustar front/edge `sso-initiate`).
**Migration:** `CREATE OR REPLACE` com a versão da origem, exceto `resolve_sso_providers_for_domain` e `check_integrity_invariants`.
**Verificação:** `diff functions` divergentes ≤ 2 documentadas.

### 63. Resolver sobrecargas conflitantes criadas no destino — `P1 · FN`
**Evidência:** destino tem `get_integrity_alerts(p_hours int, p_only_open bool)`, `get_performance_alerts(p_days,p_severity,p_source)` e `registrar_evento_receber(p_conta_id, p_evento, p_detalhes)` **além** das assinaturas da origem → PostgREST devolve `PGRST203` (ambiguidade) quando o front chama com JSON.
**Ação:** decidir uma assinatura por função (a da origem, usada pelo front); `DROP FUNCTION` das extras; manter `20260822104000_reconciliar_observabilidade_edge.sql` como referência histórica.
**Verificação:** `POST /rest/v1/rpc/get_integrity_alerts` com `{p_limit:50,p_incluir_resolvidos:false}` → 200.

### 64. Remover `get_cron_run_history()` sem parâmetros e revisar `has_any_role`/`is_user_admin` — `P2 · FN`
**Evidência:** `get_cron_run_history()` (0 args) só no destino, duplicando a de 2 args; `has_any_role`/`is_user_admin` só no destino, EXECUTE para `anon`.
**Ação:** dropar a sobrecarga; manter `has_any_role`/`is_user_admin` com `search_path` (etapa 12) e EXECUTE só `authenticated` **se** algum código as usa (`git grep has_any_role`) — senão dropar.
**Verificação:** `diff functions` só-destino = `exec_sql` (temporário) + `invocar_regua_cobranca`.

### 65. Reconciliar as 16 views com definição diferente + 2 ausentes — `P1 · SCHEMA`
**Evidência:** `vw_contas_pagar_painel, vw_contas_receber_painel, vw_dre_mensal, vw_dso_aging, vw_fluxo_caixa, vw_fluxo_caixa_diario, vw_gastos_centro_custo, vw_metricas_cobranca, vw_saldos_contas, vw_tributario_dashboard, vw_webhooks_recentes, vw_rpc_hotspots, vw_rpc_slow_calls, v_table_bloat, v_sefaz_observability, extratos_bancarios_importados` divergem; `vw_auditoria_tributaria_recente`, `vw_transferencias_painel` ausentes; `vw_edge_health` igual.
**Migration:** `CREATE OR REPLACE VIEW … WITH (security_invoker = true)` com a definição da origem (checar `reloptions`; `gate_30_views_inseguras()` valida).
**Verificação:** `gate_30_views_inseguras()` = 0 linhas; front Dashboard/DRE/Fluxo de Caixa renderiza.

### 66. Portar para a origem/baseline as evoluções legítimas do destino — `P2 · FN`
**Evidência:** `invocar_regua_cobranca(boolean)` + cron `executar-regua-cobranca-diaria` + `vault.regua_cron_secret` + `bloqueios_duplicidade` (20 col.) + `organizacoes` (12 col.) + `contratos` (18 col.) + `has_any_role` são pós-Lovable e corretos.
**Ação:** garantir que estão no baseline (etapa 22) para que ambientes novos não os percam.
**Verificação:** staging criado do baseline tem `invocar_regua_cobranca`.

---

## Fase 6 — RLS (etapas 67–73)

### 67. Reescrever todas as policies do destino com `TO authenticated` e padrão initplan — `P0 · RLS`
**Evidência:** 45 policies com `roles=public` no destino vs `authenticated` na origem; 239 policies usam `auth.uid()` direto (origem usa `( SELECT auth.uid() )` — 1 avaliação por statement em vez de por linha; Supabase Advisor `auth_rls_initplan`).
**Migration:** `20260825150000_rls_realinhar.sql` gerada de `src/policies_norm.txt`: `DROP POLICY IF EXISTS` + `CREATE POLICY … TO authenticated USING (…) WITH CHECK (…)` para as 296 policies comuns.
**Verificação:** `SELECT count(*) FROM pg_policies WHERE 'public' = ANY(roles::text[])` = 0 (exceto `frontend_error_user_insert`, que é `anon,authenticated`).

### 68. Criar as 216 policies ausentes — `P0 · RLS`
**Evidência:** maioria pertence às 35 tabelas da etapa 32 (4 policies/tabela) + segundas policies de leitura (`*_select`, `Admin manage`) em `aliquotas_*`, `cnaes`, `ncms`, `ufs`, `itens_lista_iss`, `protocolos_st*`, `faixas_simples_nacional`, `api_keys`, `alertas` (4 vs 1), `conformidade_snapshots` (4 vs 1), `sped_contabil_arquivos` (4 vs 1), `entregas_obrigacoes` (4 vs 2), `elisao_creditos_auditoria` (3 vs 1), `logs_*`.
**Migration:** mesma geração da etapa 67 (parte "SÓ NA ORIGEM").
**Verificação:** `gate_25_policies_sem_tenant()` = 0; `diff policies_norm` ausentes = 0 (excl. Lalamove).

### 69. Revisar as 122 policies "só destino" — `P1 · RLS`
**Ação:** classificar: (a) das migrations 22/08 (`organizacoes`, `convites`, `bloqueios_duplicidade`, `regua`) → manter; (b) permissivas demais (`USING (true)` para `authenticated` em tabela com `empresa_id`) → substituir pela da origem; (c) duplicadas (`Users can manage…` + `Owner manage…` na mesma tabela com mesma lógica) → remover.
**Verificação:** tabela de decisão em `docs/migracao/policies-so-destino.md`; `gate_25` = 0.

### 70. `clientes`: restaurar as 3 policies com `empresa_membro_ativo()` — `P1 · RLS`
**Evidência:** `clientes_grupo_update`, `clientes_owner_insert`, `clientes_owner_update` no destino usam subquery inline e não exigem membresia ativa no `WITH CHECK`.
**Migration:** definição da origem (`WITH CHECK ((auth.uid() = user_id) AND (empresa_id IS NULL OR empresa_membro_ativo(empresa_id)))`).
**Verificação:** usuário sem vínculo ativo não consegue `INSERT` com `empresa_id` alheio.

### 71. Policies de storage para os buckets — `P1 · RLS`
**Evidência:** `nfe-xml`/`nfe-certificados` não existem no destino; `comprovantes-financeiro` existe sem policies auditadas (`storage.objects`).
**Migration:** criar buckets (etapa 75) + policies por prefixo `empresa_id/` para `authenticated`; `nfe-certificados` só `service_role`.
**Verificação:** upload via front com usuário da empresa A não vê arquivos da B.

### 72. Rodar o Supabase Advisor (security + performance) no destino e zerar `ERROR` — `P1 · RLS`
**Ação:** Dashboard → Advisors ou `supabase inspect`; tratar `rls_disabled_in_public`, `policy_exists_rls_disabled`, `function_search_path_mutable`, `auth_rls_initplan`, `multiple_permissive_policies`, `unindexed_foreign_keys`.
**Verificação:** 0 findings `ERROR`; `WARN` documentados.

### 73. Teste automatizado de isolamento multi-tenant — `P1 · QA`
**Ação:** `supabase/tests/rls_tenant.test.ts` (Deno): 2 usuários em 2 empresas; para cada tabela com `empresa_id` executar `select/insert/update/delete` cruzado; roda no `deno-tests.yml` contra staging.
**Verificação:** suíte verde; falha ao remover qualquer policy de tenant.

---

## Fase 7 — Dados de referência, segredos e usuários (etapas 74–79)

### 74. Copiar os catálogos fiscais da origem para o destino — `P0 · DATA`
**Evidência (linhas origem→destino):** `aliquotas_internas_uf` 65→27, `aliquotas_iss_municipal` 62→56, `ncms` 84→50, `protocolos_st_ufs` 165→80, `protocolos_st_ncms` 26→20, `faixas_simples_nacional` 30→22, `beneficios_fiscais` 9→0, `glossario_tributario` 30→0, `estrategias_elisao` 17→0(8), `retencao_politicas` 64→0, `catalogos_fiscais_cargas` 1→0, `catalogos_tributarios_health_history` 21→0, `cnaes` 44→66 (destino tem mais — unir), `itens_lista_iss` 45→159 (idem), `protocolos_st` 9→10.
**Ação (container):** `pg_dump "$SRC" --data-only -t public.<tabela> | psql "$DST"` com `ON CONFLICT DO UPDATE` (gerar via `COPY` + `INSERT … ON CONFLICT (chave natural)`); depois `SELECT recarregar_seeds_fiscais('migracao')`.
**Verificação:** `check_catalogos_tributarios_invariants()` → `criticos=0`; contagens ≥ origem.

### 75. Criar buckets `nfe-xml` e `nfe-certificados` no destino — `P0 · DATA`
**Evidência:** ausentes; edges `sefaz-dfe-puxar`, `nfe-upload-certificado`, `sefaz-manifestar` gravam neles (`sefaz-dfe-puxar` responde 503 hoje).
**Ação:** `supabase_storage_create_bucket` (private, `file_size_limit` 10 MB, mime `application/xml,text/xml` / `application/x-pkcs12`).
**Verificação:** `nfe-upload-certificado` com certificado de teste → 200.

### 76. Migrar `integration_secrets` para `vault` — `P0 · SEC`
**Evidência:** origem guarda 2 segredos em tabela (`integration_secrets`, lida por 2 edge functions); destino já usa `vault.regua_cron_secret`.
**Ação:** ler os 2 registros na origem, criar em `vault.create_secret(value, name, description)` no destino; reescrever `internal_job_secret()` e as 2 edges para `vault.decrypted_secrets`; **não** recriar a tabela — remover da baseline.
**Verificação:** `SELECT name FROM vault.secrets` lista `regua_cron_secret` + 2 novos; edges autenticam cron.

### 77. Decidir e executar a política sobre dados transacionais de seed no destino — `P1 · DATA`
**Evidência:** ~90 tabelas transacionais têm dados no destino que não existem na origem (`contas_pagar` 20, `contas_receber` 20, `clientes` 12, `boletos` 6, `lancamentos_contabeis` 31, `partidas_contabeis` 192, `nfe_recebidas` 31, `login_attempts` 183, `frontend_performance_logs` 2.167, `audit_logs` 424, `movimentacoes` 30, `plano_contas` 18, `faturamento_mensal` 19, `folha_pagamento` 19…). Parte é seed de demonstração, parte é E2E.
**Ação (decisão de negócio — Joaquim):** opção A: destino vai a produção limpo → `TRUNCATE` das transacionais (lista em `docs/migracao/truncate-list.md`) mantendo catálogos/config; opção B: manter como dados de demonstração marcados (`metadata->>'seed'='true'`). Recomendação: **A**, com dump prévio (etapa 3).
**Verificação:** contagens conforme decisão; `integrity_alerts` sem `critical`.

### 78. Reconciliar `profiles`/`user_roles`/`user_empresas` — `P1 · DATA`
**Evidência:** origem `profiles` 3 / `user_roles` 3 / `user_empresas` 3; destino 2 / 4 / 3 — há `user_roles` sem `profiles` e possivelmente do E2E.
**Ação:** `SELECT * FROM user_roles ur LEFT JOIN profiles p USING (user_id) WHERE p.user_id IS NULL`; remover órfãos; rodar `provisionar_usuario(uid)` para `ti@` e os usuários reais; `trg_auto_vincular_empresa_padrao` garante vínculo futuro.
**Verificação:** todo `auth.users` tem `profiles` + ≥1 `user_roles` + `user_empresas` ativo.

### 79. Purgar telemetria histórica e ativar retenção — `P2 · DATA`
**Evidência:** destino tem `slow_query_alerts` 2.457, `query_telemetry` 3.310, `pg_stat_statements_baseline` 3.427, `bloat_snapshots` 2.340, `performance_alerts` 807 (origem tem 10× mais — não copiar).
**Ação:** após `retencao_politicas` (etapa 74) e `purge_old_rows` (58), rodar `cleanup_log_tables()` uma vez; não migrar telemetria da origem.
**Verificação:** `get_retencao_politicas_status()` sem `linhas_vencidas` > 0.

---

## Fase 8 — Edge functions, segredos de runtime e configuração (etapas 80–88)

### 80. Cadastrar os 44 segredos de runtime no destino — `P0 · EDGE`
**Evidência:** `Deno.env.get` no repo referencia: `SUPABASE_URL`(102), `SUPABASE_SERVICE_ROLE_KEY`(93), `SUPABASE_ANON_KEY`(33), `LOVABLE_API_KEY`(18), `RESEND_API_KEY`(13), `BITRIX24_DOMAIN`(7), `BITRIX24_ACCESS_TOKEN`(5), `SLACK_WEBHOOK_URL`(3), `BLING_CLIENT_SECRET`/`BLING_CLIENT_ID`(3), `ASAAS_WEBHOOK_TOKEN`(3), `VAPID_PUBLIC_KEY`(2), `SUPABASE_JWT_SECRET`(2), `SUPABASE_DB_URL`(2), `RESEND_FROM`(2), `NFE_CERT_MASTER_KEY`(2), `DENO_TESTING`(2), `BITRIX24_CLIENT_SECRET`/`CLIENT_ID`(2), `APP_PUBLIC_URL`(2), `VAPID_PRIVATE_KEY`, `SEFAZ_CRON_SECRET`, `REGUA_CRON_SECRET`, `PUBLIC_APP_URL`, `OPEN_FINANCE_*`(4), `OPENAI_API_KEY`, `N8N_DISPATCH_SECRET`, `N8N_CALLBACK_SECRET`, `MCP_SECRET`, `MAPBOX_ACCESS_TOKEN`, `EXTERNAL_SUPABASE_URL`/`SERVICE_KEY`, `CRON_DISPATCH_SECRET`, `CNPJA_API_KEY`, `CI_GATE_LOG_SECRET`, `ASAAS_API_KEY`, `APP_BASE_URL`, `ALERTS_EMAIL_TO`/`FROM`.
**Ação:** `supabase secrets set --project-ref bwwbeyolnnzppeuhgkcd --env-file .env.functions` (arquivo fora do git); `LOVABLE_API_KEY` → substituir por `OPENAI_API_KEY`/gateway próprio (é chave do Lovable AI Gateway e morre com a origem) — refatorar `_shared/ai.ts`.
**Verificação:** `supabase secrets list` = 44 nomes; `sefaz-dfe-puxar`, `sso-initiate` deixam de responder 503.

### 81. Unificar as 3 variáveis de URL pública (`APP_PUBLIC_URL`, `APP_BASE_URL`, `PUBLIC_APP_URL`) — `P2 · EDGE`
**Ação:** padronizar em `APP_PUBLIC_URL` em `_shared/env.ts`; demais viram alias com aviso de depreciação.
**Verificação:** `grep -r "APP_BASE_URL\|PUBLIC_APP_URL" supabase/functions` só no alias.

### 82. Deployar as 90 edge functions ausentes no destino — `P0 · EDGE`
**Evidência:** sondagem `OPTIONS` — destino 404 em 90/102; deployadas: `asaas-proxy, comparar-benchmark-setorial, decidir-regime, executar-regua-cobranca, external-data, gerar-dre-tributaria, gerar-heatmap-tributario, open-finance, prever-carga-tributaria, sefaz-dfe-puxar(503), sso-initiate(503), sso-test-login`. A origem tem 102/102 + `migrate-helper`.
**Ação:** `supabase functions deploy --project-ref bwwbeyolnnzppeuhgkcd` (todas), respeitando `config.toml` pós-etapa 19; em ordem: `health`, `_shared`-dependentes, webhooks, alvos de cron, IA.
**Verificação:** `scripts/probe-functions.sh` → 0×404 no destino.

### 83. Completar `config.toml` para as 102 funções — `P1 · EDGE`
**Evidência:** só 39 funções declaradas; as 63 restantes assumem `verify_jwt=true` implícito — ok, mas `import_map`/`entrypoint` não declarados impedem deploy reproduzível.
**Ação:** gerar blocos `[functions.<nome>]` para todas com `verify_jwt` explícito.
**Verificação:** `supabase functions deploy --dry-run` sem avisos.

### 84. Corrigir `sefaz-dfe-puxar` e `sso-initiate` (503 no destino) — `P1 · EDGE`
**Evidência:** ambas deployadas e falhando no boot (provável `Deno.env.get` de `NFE_CERT_MASTER_KEY`/`SEFAZ_CRON_SECRET`/`SUPABASE_JWT_SECRET` ausentes; `resolve_sso_providers_for_domain` mudou de assinatura).
**Ação:** após etapa 80, redeploy; ler `supabase functions logs`; ajustar `sso-initiate` para a coluna `allowed_domains`.
**Verificação:** `OPTIONS` → 200/204; `POST` autenticado → 200.

### 85. Remover `LOVABLE_API_KEY` e referências a `lszcmoymovkpckehlagr` do runtime — `P1 · EDGE`
**Evidência:** 18 funções usam `LOVABLE_API_KEY` (Lovable AI Gateway); `index.html:44-45` faz `preconnect`/`dns-prefetch` para `lszcmoymovkpckehlagr.supabase.co`.
**Ação:** substituir gateway em `_shared/ai.ts` por provedor próprio (`OPENAI_API_KEY` já referenciado); editar `index.html` para usar a env var ou remover as tags.
**Verificação:** `git grep -i "lszcmoymovkpckehlagr\|LOVABLE_API_KEY" supabase/functions src index.html` vazio.

### 86. Testes Deno das edge functions no CI apontando para staging — `P2 · QA`
**Evidência:** `deno-tests.yml` existe; `fuzz_test.ts` e `stress_test.ts` estão na raiz de `supabase/functions/` e são confundidos com funções (104 entradas em vez de 102).
**Ação:** mover para `supabase/functions/_tests/`; `deno test` com `SUPABASE_URL` do staging.
**Verificação:** workflow verde; `ls supabase/functions | grep -v '^_' | wc -l` = 102.

### 87. `health` como endpoint canônico de readiness — `P2 · EDGE`
**Ação:** estender `health/index.ts` para checar `SELECT 1`, contagem de `vault.secrets`, buckets obrigatórios e `cron.job` ativos ≥ 30, retornando `{ok, checks[]}`; usar no Portainer/uptime.
**Verificação:** `GET /functions/v1/health` → `ok:true` após fase 9.

### 88. Documentar e repontar os webhooks públicos — `P2 · REPO`
**Ação:** `docs/webhooks.md` com URL do destino, método, header de assinatura, secret correspondente (etapa 80) e replay via `webhook-replay`/`webhook-simulator`; atualizar as URLs cadastradas em Asaas, Bitrix24, Bling, Evolution e n8n (hoje apontam para a origem).
**Verificação:** `webhook_events` recebe evento de teste de cada provedor no destino.

---

## Fase 9 — Cron e automações (etapas 89–93)

### 89. Recriar os 30 cron jobs no destino — `P0 · CRON`
**Evidência:** `src/cron.txt` (30 ativos) vs destino (1). Jobs SQL: `auditar-acessos-cross-tenant`, `capture-index-usage-daily`, `capture-slow-queries`, `cleanup-cron-logs`, `cleanup-expired-tokens`, `cleanup-login-attempts`, `cleanup-rpc-obs-metrics-daily`, `cron-failure-watch`, `daily-log-cleanup`, `daily-log-retention`, `detect-query-regressions-5min`, `gerar-alertas-vencimento-diario`, `gerar-contas-recorrentes-diario`, `integrity-invariants-hourly`, `maintain-monthly-partitions`, `monitor-table-bloat-daily`, `pgss_baseline_cleanup`, `pgss_weekly_baseline`, `processar-regua-cobranca-diario`, `recarregar-seeds-fiscais-diario`, `refresh-performance-alerts-weekly`, `sefaz-observability-hourly`, `snapshot-table-bloat-daily`. Jobs HTTP (`net.http_post`): `digest-silenciamentos-erro`, `enviar-digest-conformidade-horario`, `evaluate-delivery-alerts-every-min` (**Lalamove — não recriar**), `gerar-snapshots-conformidade-mensal`, `monitorar-erros-frontend`, `sefaz-dfe-dispatcher-15min`, `webhook-retry-worker-1min`.
**Migration:** `20260825170000_cron_jobs.sql` com `cron.schedule(nome, agenda, comando)` idempotente (`cron.unschedule` se existir), URL `https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/…`, header `x-cron-secret := internal_job_secret()` (vault).
**Verificação:** `SELECT count(*) FROM cron.job WHERE active` = 29 + 1 (`executar-regua-cobranca-diaria`); `cron.job_run_details` sem `failed` em 24 h.

### 90. Resolver a duplicidade da régua de cobrança — `P1 · CRON`
**Evidência:** origem tem `processar-regua-cobranca-diario` (09:00, função SQL `processar_regua_cobranca`); destino tem `executar-regua-cobranca-diaria` (12:00, `invocar_regua_cobranca` → edge).
**Ação:** manter apenas o fluxo do 22/08 (`invocar_regua_cobranca` + `idempotencia_regua_por_canal`); não recriar o job da origem; documentar.
**Verificação:** 1 execução/dia em `execucoes_regua_cobranca`.

### 91. `watch_cron_failures` + alerta para Slack/e-mail — `P1 · CRON`
**Evidência:** origem roda `cron-failure-watch` a cada hora e grava em `cron_job_logs` (46 linhas); destino tem 24 linhas paradas.
**Ação:** após etapa 89, validar `SLACK_WEBHOOK_URL`/`ALERTS_EMAIL_TO`; teste forçando falha (`cron.schedule('teste-falha','* * * * *','select 1/0')`) → alerta chega; remover o job de teste.
**Verificação:** mensagem no Slack em ≤ 15 min.

### 92. Workflows N8N e Evolution (`wpp2`) apontando para o destino — `P1 · INFRA`
**Evidência:** `n8n-dispatch`/`n8n-callback` exigem `N8N_DISPATCH_SECRET`/`N8N_CALLBACK_SECRET`; `whatsapp-webhook` recebe da Evolution; `n8n_workflow_configs` está vazia nos dois bancos.
**Ação:** `n8n_list_workflows` → localizar nós HTTP com `lszcmoymovkpckehlagr` → trocar por destino (`n8n_update_workflow`); `evo_set_webhook` da instância `wpp2` para `https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/whatsapp-webhook`.
**Verificação:** mensagem de teste no WhatsApp gera linha em `whatsapp_conversas` do destino.

### 93. Cron de detecção de drift (`scripts/db-diff` semanal no CI) — `P2 · QA`
**Ação:** GitHub Action agendada (segunda 06:00) roda o diff destino × baseline do repo (aplicado em staging descartável) e abre issue se houver divergência.
**Verificação:** primeira execução abre issue vazia / fecha automaticamente.

---

## Fase 10 — Frontend, infraestrutura e documentação (etapas 94–96)

### 94. Variáveis de ambiente do front (Vercel/Lovable) para o destino — `P0 · INFRA`
**Evidência:** `src/integrations/supabase/client.ts` lê `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`; `supabase/.temp/linked-project.json` mostra org `vercel_icfg_…`.
**Ação:** setar as 3 vars para `bwwbeyolnnzppeuhgkcd` + nova publishable key (etapa 1); redeploy; no Lovable, apontar o projeto para o destino ou desligar o preview.
**Verificação:** `view-source` da URL de produção não contém `lszcmoymovkpckehlagr`.

### 95. Atualizar os MCPs próprios e o vault "Claude Cérebro" — `P2 · INFRA`
**Ação:** `supabase-promofinance-mcp` (origem) → marcar como somente-leitura/depreciado após etapa 99; `supabase-mcp-bwwbey` → renomear para `supabase-promofinance-v2-mcp` e corrigir o comentário "Fator X" no `wrangler.fatorx.toml`; registrar no `claude-cerebro` a nova topologia (ref, pooler `aws-1-us-east-1`, buckets, nomes dos secrets).
**Verificação:** `cerebro_bootstrap` devolve o contexto correto.

### 96. Atualizar `README.md`, `ESTADO_ATUAL.md`, `.github/workflows/README.md` e `docs/` — `P2 · REPO`
**Ação:** seção "Ambientes" (origem descomissionada, destino, staging), "Como aplicar migration", "Como deployar function", "Como rodar o diff"; remover instruções Lovable-first.
**Verificação:** onboarding de um dev novo segue o README sem consultar o chat.

---

## Fase 11 — Validação, observabilidade e cutover (etapas 97–100)

### 97. Critério de aceite: diff destino × origem = 0 (fora exceções documentadas) — `P0 · QA`
**Ação:** rodar `scripts/db-diff/run.sh` (etapa 8) e `gate_25..35`; exceções permitidas: escopo Lalamove, colunas extras documentadas (etapas 37/39/42/45), `resolve_sso_providers_for_domain`, `check_integrity_invariants` (repo), objetos de 22/08.
**Verificação:** relatório anexado ao PR de cutover com todas as categorias em 0.

### 98. Smoke E2E no destino (staging → prod) — `P0 · QA`
**Ação:** roteiro em `docs/migracao/smoke.md`: login `ti@`, criar empresa padrão, cadastrar fornecedor completo (34), conta a pagar → aprovar → conciliar extrato, apuração IRPJ/CSLL (36), lançamento contábil (38), gerar DRE (65), agendar relatório, disparar régua (90), upload de certificado NF-e (75), receber webhook Asaas de teste (88), verificar alertas/performance no dashboard.
**Verificação:** 0 erros no console, 0 `frontend_error_logs` novos com `severity=error`, `integrity_alerts` sem `critical`.

### 99. Cutover e descomissionamento da origem Lovable — `P0 · INFRA`
**Pré-condições:** etapas 1–98 verdes; backup final da origem.
**Ação:** (1) `pg_dump` final da origem; (2) pausar o projeto `lszcmoymovkpckehlagr` (Dashboard → Pause) por 30 dias; (3) revogar keys; (4) remover o MCP da origem da configuração; (5) após 30 dias sem incidente, deletar.
**Verificação:** nenhum `net.http_post`/webhook/worker referencia a origem (grep em N8N, Workers, Evolution, Vercel).

### 100. Retrospectiva e "definition of done" permanente — `P2 · REPO`
**Ação:** `docs/migracao/RETRO.md` com causa-raiz (schema aplicado no destino sem migrations rastreadas + reaproveitamento de projeto "Fator X" + hardening não portado), decisões tomadas e o que automatizar; regra fixa: **nenhum objeto entra no banco sem migration + diff verde + gate verde**.
**Verificação:** documento aprovado por Joaquim; `ESTADO_ATUAL.md` atualizado.

---

## Anexo A — Ordem de execução e dependências

```
Fase 0 (1-8) ──► Fase 1 (9-20) ──► Fase 2 (21-30)
                                        │
        ┌───────────────────────────────┘
        ▼
Fase 3 (31-45) ──► Fase 4 (46-55) ──► Fase 5 (56-66) ──► Fase 6 (67-73)
                                                                │
        ┌───────────────────────────────────────────────────────┘
        ▼
Fase 7 (74-79) ──► Fase 8 (80-88) ──► Fase 9 (89-93) ──► Fase 10 (94-96) ──► Fase 11 (97-100)
```

- **Bloqueadores de produção (fazer primeiro):** 1, 3, 9, 10, 11, 12, 19, 21, 32, 34, 35, 36, 46, 47, 56, 57, 67, 68, 74, 75, 76, 80, 82, 89, 94, 97, 98, 99.
- **Decisões que exigem Joaquim:** 4 (fonte de verdade), 17 (usuário E2E), 33 (`nfe_xml`/`subscriptions`), 77 (dados de seed), 85 (provedor de IA que substitui o Lovable Gateway), 99 (data do cutover).
- **Estimativa:** Fases 0–2: 1–2 dias · Fases 3–6: 4–6 dias (geração semiautomática a partir dos dumps) · Fases 7–9: 2–3 dias · Fases 10–11: 1–2 dias.

## Anexo B — Inventário de evidências

| Arquivo (VPS `/workspace/notes/pf-migration-audit/`) | Conteúdo |
|---|---|
| `src_schema.sql` / `dst_schema.sql` | `pg_dump --schema-only -n public` (30.590 / 21.748 linhas) |
| `src/`, `dst/` | `functions, triggers, policies, policies_norm, indexes, constraints, enums, types, views, sequences, extensions, cron, buckets, vault, realtime, grants, fn_grants, partitions, rls, migrations, authusers, rowcounts` |
| `DIFF_REPORT.txt` | diff completo por categoria (só-origem / só-destino / divergentes) |
| `inv.sql, inv2.sql, inv3.sql, inv4.sql, inv5.sql, diff.js` | scripts reproduzíveis (base da etapa 8) |
| `env.sh` | credenciais de conexão (rotacionar — etapa 1) |
