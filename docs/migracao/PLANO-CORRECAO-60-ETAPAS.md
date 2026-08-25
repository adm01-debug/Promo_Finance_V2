# Promo Finance V2 — Plano de Correção e Melhorias em 60 Etapas

**Base:** auditoria exaustiva origem → destino executada em 2026-08-25
**Repo:** `adm01-debug/Promo_Finance_V2` @ `1a9e423` (main)
**Origem (fonte da verdade de schema):** `lszcmoymovkpckehlagr` (Lovable Cloud)
**Destino (canônico, alvo do go-live):** `bwwbeyolnnzppeuhgkcd`
**Executor:** Claude via MCP (VPS `claude-code` + `Bun.SQL`, GitHub, Cloudflare). Única entrada humana necessária: `SUPABASE_ACCESS_TOKEN` (sbp_…) para redeploy de edge functions (E15–E18).

---

## Como usar este documento

- Cada etapa tem `- [ ]` de conclusão. Marque `- [x]` só com a **verificação** da etapa passando.
- Ordem das fases é obrigatória (segurança antes de schema; schema antes de ledger; ledger antes de cutover).
- Nenhuma etapa de Fase 4+ roda sem E01 (backup) concluída.
- Etapas marcadas **⚠ DECISÃO** precisam de um `APROVADO` do Joaquim antes de executar.
- Ferramentas de apoio já existentes na VPS: `/workspace/notes/pf-migration-audit/q.mjs` (SQL em SRC|DST) e `diff.mjs` (diff estrutural por chave).

## Painel de progresso

| Fase | Etapas | Concluídas | Foco |
|---|---|---|---|
| 0 — Salvaguardas | E01–E05 | 0/5 | backup, MCP do destino, ledger, branch |
| 1 — Segurança | E06–E14 | 0/9 | RLS aberto, grants de função, storage, segredos |
| 2 — Edge functions | E15–E22 | 0/8 | verify_jwt (59 regressões), secrets, webhooks |
| 3 — Cron e vault | E23–E29 | 0/7 | 2 jobs falhando, 8 jobs ausentes, vault |
| 4 — Convergência de schema | E30–E42 | 0/13 | 372 colunas, partições, constraints, funções, views |
| 5 — Ledger e repositório | E43–E50 | 0/8 | 526 versões, rename, CI de drift |
| 6 — Dados | E51–E55 | 0/5 | catálogos fiscais, seeds, auth |
| 7 — Validação e go-live | E56–E60 | 0/5 | diff zero, suíte, e2e, cutover |

**Critério de conclusão global (Definition of Done):**
1. `diff.mjs` (c1 + c2) = 0 divergências fora da allowlist do Apêndice A.
2. Probe HTTP das 104 edge functions no destino igual à matriz do Apêndice B.
3. `cron.job_run_details` do destino: 0 falhas em 72h.
4. Suíte de validação (E57) 100% verde contra o destino.
5. `supabase migration list` contra o destino sem versões pendentes.

---

## Fase 0 — Salvaguardas (E01–E05)

### E01 — Backup lógico completo do destino
- [ ] Concluído
**Por quê:** as fases 4–6 executam DDL destrutivo (drop de policies, swap de tabelas particionadas, drop de colunas).
**Como:** no container `claude-code`, `apt-get install -y postgresql-client-17` e `pg_dump -Fc "$DST" -f /workspace/notes/pf-migration-audit/backups/dst_$(date +%Y%m%d_%H%M).dump` (schema + dados). Repetir antes de E34 e E43. Fallback sem apt: `COPY ... TO STDOUT` por tabela via `Bun.SQL`.
**Verificação:** `pg_restore -l <dump> | wc -l` > 1000 e tamanho > 20 MB.
**Camada:** VPS · `/workspace/notes/pf-migration-audit/backups/`

### E02 — Confirmar para onde o front aponta hoje
- [ ] Concluído
**Por quê:** `client.ts` lê `VITE_SUPABASE_URL` do ambiente; Vercel referencia `@vite_supabase_url`. Se produção já apontar para `bwwbey`, as fases 1–2 viram incidente ativo, não pré-requisito.
**Como:** Vercel MCP (`get_project_deployment_context`) + Lovable MCP (`get_project`) — ler o valor efetivo de `VITE_SUPABASE_PROJECT_ID` em produção.
**Verificação:** valor registrado em `docs/migracao/ESTADO-CUTOVER.md`.
**Camada:** Vercel · Lovable

### E03 — Restaurar o MCP do destino (`public.exec_sql` wrapper)
- [ ] Concluído
**Por quê:** a wave1 (E13 antiga) moveu `exec_sql` para `private.exec_sql`; PostgREST só expõe `public`, então o worker `supabase-mcp-bwwbey` falha com "exec_sql() ainda não existe".
**Como:** `CREATE FUNCTION public.exec_sql(sql text) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=private,pg_catalog AS $$ SELECT private.exec_sql(sql) $$; REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC, anon, authenticated; GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;`
**Verificação:** `SUPABASE - PROMO FINANCE V2 - MCP:supabase_db_overview` responde; `has_function_privilege('authenticated','public.exec_sql(text)','EXECUTE') = false`.
**Camada:** destino · migration `20260826010000_restaurar_exec_sql_wrapper.sql`

### E04 — Registrar as 3 migrations aplicadas sem entrada no ledger
- [ ] Concluído
**Por quê:** `20260824124500_descomissionar_modulo_lalamove`, `20260824180000_restaurar_integridade_financeira_sem_logistica` e `20260825130000_fixes_phd_validation` têm efeito visível no destino (tabelas Lalamove ausentes, `partidas_contabeis.empresa_id`, grant anon em `gerar_numero_acordo`) mas não constam em `supabase_migrations.schema_migrations`.
**Como:** confirmar cada efeito com SQL e `INSERT INTO supabase_migrations.schema_migrations(version,name,statements)`.
**Verificação:** `select count(*) from supabase_migrations.schema_migrations where version like '202608%'` = 19.
**Camada:** destino

### E05 — Branch de trabalho + ADR de fonte da verdade
- [ ] Concluído
**Por quê:** as correções são dezenas de migrations; precisam de PR revisável e de uma regra escrita: **origem define schema/funções/policies; destino define dados de produção; repo é a única forma de aplicar mudanças** (fim de DDL manual via MCP sem migration).
**Como:** `git checkout -b fix/convergencia-destino`; criar `docs/adr/0001-fonte-da-verdade-migracao.md` (1 página).
**Verificação:** branch no GitHub + ADR commitado.
**Camada:** GitHub

---

## Fase 1 — Segurança (E06–E14)

### E06 — Fechar policies `USING (true)` em tabelas de segredos e multi-tenant
- [ ] Concluído
**Por quê:** destino tem 79 policies abertas para `authenticated` (origem: 16, só catálogos fiscais). Críticas: `api_keys:admins_all_api_keys [ALL] true`, `bitrix_oauth_tokens_select_auth [SELECT] true`, `bling_tokens_select_auth [SELECT] true`, `organizacoes:admins_all_organizacoes [ALL]`, `pagamentos_recorrentes [ALL]`, `planos_acao:authenticated_full_access_planos_acao [ALL]`, `sped_contabil_arquivos [ALL]`, `retencoes_fonte [ALL]`, `regimes_simulados [ALL]`, `resumos_executivos_semanais [ALL]`, `scim_setup_checklist [ALL]`, `kpis_operacionais [ALL]`, `conformidade_snapshots_all`, `elisao_*_all`, `oportunidades_elisao_all`, `estrategias_elisao_catalogo_all`.
**Como:** `DROP POLICY` das 63 policies que não existem na origem com `qual = true`; recriar a policy equivalente da origem (`pg_policies` de `lszcm` é a fonte) com `empresa_membro_ativo()` / `has_role()`.
**Verificação:** query de policies abertas (`qual in ('true','(true)')` para `authenticated/anon`) retorna as mesmas 16 da origem.
**Camada:** destino · migration `20260826020000_rls_fechar_policies_abertas.sql`

### E07 — Remover as policies `*_select_auth (true)` das 34 tabelas da wave1
- [ ] Concluído
**Por quê:** a wave1 (E68) criou `select_auth` + `service_all` genéricas em 34 tabelas; expõe `acessos_suspeitos`, `auditoria_tributaria`, `bling_sync_logs`, `security_alerts`, `sso_*`, `scim_operations_log`, `slo_metrics_diarias` a qualquer usuário logado, cross-tenant.
**Como:** para cada tabela, copiar o conjunto exato de policies da origem (`DROP` das genéricas + `CREATE` das originais).
**Verificação:** `diff.mjs` check E1 → `onlyDst = 0` para essas 34 tabelas.
**Camada:** destino · mesma migration da E06 (seção 2)

### E08 — Eliminar policies sobrepostas cross-tenant em tabelas financeiras
- [ ] Concluído
**Por quê:** `contas_pagar` tem 3 policies permissivas (OR): `Admins can manage contas pagar` (admin OU financeiro, **sem escopo de empresa**), `contas_pagar_tenant_rw`, `contas_pagar_empresa_select`. Mesmo padrão em `contas_receber`, `alert_configurations`, `alerts`, `bitrix24_activities`, `user_roles`.
**Como:** manter exatamente o conjunto da origem por tabela; dropar as demais (183 policies só no destino).
**Verificação:** `diff.mjs` E1 → `onlyDst = 0` (exceto allowlist).
**Camada:** destino · migration `20260826021000_rls_remover_sobrepostas.sql`

### E09 — Revogar EXECUTE de `authenticated` nas 130 funções fechadas na origem
- [ ] Concluído
**Por quê:** destino concede `authenticated` em `internal_job_secret()` (SECDEF, devolve o segredo do cron), `backfill_empresa_id`, `cleanup_log_tables`, `drop_old_partitions`, `purge_old_rows`, `recarregar_seeds_fiscais`, `confirmar_conciliacao_manual`, `enqueue_webhook_retry`, `provisionar_usuario`, `run_integrity_cycle`, `check_integrity_invariants`, `gate_*`, `capture_*`… A origem nega todas.
**Como:** gerar `REVOKE EXECUTE ... FROM authenticated` a partir do diff E3 (funções com grant explícito só no destino); `internal_job_secret()` primeiro.
**Verificação:** `has_function_privilege('authenticated', f, 'EXECUTE')` igual entre origem e destino para as 173 funções comuns.
**Camada:** destino · migration `20260826030000_revogar_execute_authenticated.sql`

### E10 — Gate de CI para funções novas nascerem fechadas
- [ ] Concluído
**Por quê:** `DEFAULT PRIVILEGES` do destino concede EXECUTE a `authenticated` em toda função nova; a v3 recriou 128 funções e todas nasceram abertas.
**Como:** SQL de gate (`gate_36_funcoes_sem_revoke`) que lista funções `public` com EXECUTE para `authenticated` fora de `docs/migracao/allowlist-rpc.txt`; rodar em `.github/workflows/ci.yml` contra o destino.
**Verificação:** job do CI falha ao introduzir função sem revoke em PR de teste.
**Camada:** repo · `.github/workflows/ci.yml`

### E11 — Recriar as 5 storage policies dos buckets NF-e
- [ ] Concluído
**Por quê:** destino tem apenas as 4 policies de `comprovantes-financeiro`; faltam `nfe_xml_empresa_read`, `nfe_xml_service_write/update/delete`, `nfe_cert_service_all`. Sem elas, `authenticated` não lê XML de NF-e (`nfe-vinculo-proxy`, `sefaz-dfe-puxar`).
**Como:** copiar de `pg_policies where schemaname='storage'` da origem.
**Verificação:** `diff.mjs` F5 → `onlySrc = 0`.
**Camada:** destino · migration `20260826040000_storage_policies_nfe.sql`

### E12 — Alinhar grants de tabela (11 divergências + 3 tabelas de token)
- [ ] Concluído
**Por quê:** destino concede `authenticated` em `integration_secrets`, `bitrix_oauth_tokens`, `bling_tokens` (origem não); e INSERT/UPDATE extras em `api_keys`, `cnpja_cache`, `frontend_error_alert_state`, `frontend_error_silence_digest_log`, `logs_baixa_automatica`, `logs_conciliacao_retroativa`, `password_reset_tokens`, `asaas_audit_trail`, `elisao_creditos_auditoria`; e restringe indevidamente `regime_decision_cache`, `tax_audit_trail` a SELECT.
**Como:** `REVOKE/GRANT` gerados do diff E2.
**Verificação:** `diff.mjs` E2 → `diff = 0` e `onlyDst` só com partições/views da allowlist.
**Camada:** destino · migration `20260826041000_grants_tabelas.sql`

### E13 — Remover o token hardcoded de `scripts/mcp-phd-suite.mjs` ⚠ DECISÃO (rotação)
- [ ] Concluído
**Por quê:** linha 14 contém o bearer do MCP da origem em repo privado, mas versionado.
**Como:** trocar por `process.env.MCP_TOKEN` obrigatório (abortar se ausente). Rotação do segredo no worker `supabase-promofinance-mcp` via `cf_secret_put` **só com APROVADO**, porque invalida o conector atual do Claude.ai.
**Verificação:** `grep -rn "eTBfUTMu" .` vazio; `node scripts/mcp-phd-suite.mjs` sem env → sai com erro claro.
**Camada:** repo · Cloudflare Worker

### E14 — Converter 281 policies para `(select auth.uid())`
- [ ] Concluído
**Por quê:** destino usa `auth.uid()` inline (avaliado por linha); origem usa initplan. Regressão de performance em toda tabela multi-tenant (advisor `auth_rls_initplan`).
**Como:** regenerar as policies a partir de `pg_get_expr` da origem (já feito em E06–E08 se a fonte for a origem; esta etapa é o `diff` final).
**Verificação:** `diff.mjs` E1 → `diff = 0`.
**Camada:** destino

---

## Fase 2 — Edge functions e integrações (E15–E22)

### E15 — `supabase/config.toml` completo (104 funções, `verify_jwt` real)
- [ ] Concluído
**Por quê:** o arquivo declara 40 funções; as 62 restantes caem no default `true` do CLI. Probe real: origem tem JWT no gateway em **4** funções (`analise-preditiva`, `bitrix24-sync`, `conciliacao-ia`, `open-finance`); destino tem em **63** → 59 regressões, incluindo `whatsapp-webhook`, `n8n-callback`, `health`, `get-mapbox-token`, `mcp-query`, `sso-generate-metadata/test-login/validate-config`, `webhook-retry-worker`, `processar-fila-cobrancas`.
**Como:** declarar as 104 (100 `false`, 4 `true`); lista canônica no Apêndice B.
**Verificação:** `grep -c "^\[functions\." supabase/config.toml` = 104 (103 sem `migrate-helper` + `evaluate-delivery-alerts` fora).
**Camada:** repo · `supabase/config.toml`

### E16 — Redeploy das 59 funções com `--no-verify-jwt` no destino
- [ ] Concluído
**Por quê:** corrigir o gateway. **Pré-requisito:** `SUPABASE_ACCESS_TOKEN` (sbp_) exportado no container `claude-code` (não existe hoje) e binário `supabase` no PATH (pacote npm global presente, binário não resolvido em `sh`).
**Como:** `./scripts/migrate-functions.sh --only <59 nomes>` com `SUPABASE_PROJECT_REF=bwwbeyolnnzppeuhgkcd`.
**Verificação:** `scripts/probe-edge-functions.sh bwwbeyolnnzppeuhgkcd` (E21) mostra 4 funções com `UNAUTHORIZED_NO_AUTH_HEADER`, não 63.
**Camada:** destino · Supabase CLI

### E17 — Secrets das edge functions no destino
- [ ] Concluído
**Por quê:** `sefaz-dfe-dispatcher` responde 500 `server-misconfigured` no destino; `asaas-webhook`, `bitrix24-webhook`, `whatsapp-webhook` respondem 503 "Webhook não configurado" **em ambos**.
**Como:** `supabase secrets list --project-ref bwwbey…` vs lista esperada em `docs/RUNBOOK.md §6`; criar faltantes (`SEFAZ_CRON_SECRET`, `INTERNAL_JOB_SECRET`, tokens de webhook, `MAPBOX_ACCESS_TOKEN`, `RESEND_API_KEY`, `LOVABLE_API_KEY`).
**Verificação:** probe de `sefaz-dfe-dispatcher` deixa de retornar `server-misconfigured`; webhooks respondem 401/400 (assinatura inválida), não 503.
**Camada:** destino · Supabase secrets

### E18 — Redeploy das 12 funções alteradas no PR #43 (contratos)
- [ ] Concluído
**Por quê:** `1a9e423` mudou `asaas-webhook`, `bitrix24-webhook`, `bling-webhook`, `digest-silenciamentos-erro`, `gerar-alertas-dispatcher`, `monitorar-erros-frontend`, `sefaz-dfe-puxar`, `webhook-replay`, `webhook-retry-worker`, `whatsapp-webhook` + `_shared/*`; não há pipeline de deploy (`.github/workflows` só lint/testes). Deploy atual é desconhecido.
**Como:** `supabase functions download` para comparar bundle; `migrate-functions.sh --only <12>` no destino.
**Verificação:** `supabase functions list` mostra `updated_at` ≥ data do deploy para as 12.
**Camada:** destino · Supabase CLI

### E19 — Configurar e testar os webhooks externos
- [ ] Concluído
**Por quê:** 3 webhooks devolvem 503 por token ausente; `bling-webhook` responde 405 em GET (ok).
**Como:** definir os secrets de assinatura (E17) e disparar `webhook-simulator` com payload assinado para Asaas, Bling, Bitrix24, WhatsApp/Evolution, N8N callback.
**Verificação:** 5 linhas em `webhook_events` com `status='processed'` no destino.
**Camada:** destino

### E20 — Apontar provedores externos para o destino ⚠ DECISÃO (cutover)
- [ ] Concluído
**Por quê:** Asaas, Bling, Bitrix24, Evolution (`wpp2`) e N8N ainda chamam `lszcm…`.
**Como:** trocar URLs de webhook nos provedores (N8N via MCP; Evolution via `evo_set_webhook`; Asaas/Bling/Bitrix via API dos provedores) — executar na janela da E59.
**Verificação:** `webhook_events` do destino recebendo eventos reais; origem parando de receber.
**Camada:** N8N · Evolution · Asaas · Bling · Bitrix24

### E21 — Script e matriz de probe HTTP versionados
- [ ] Concluído
**Por quê:** `functions_list` do MCP da origem é lista estática e errada (diz JWT ON em ~90 funções; real: 4). Precisamos de prova reproduzível.
**Como:** commitar `scripts/probe-edge-functions.sh` (o probe usado nesta auditoria: GET em `/functions/v1/<fn>`, classifica `UNAUTHORIZED_NO_AUTH_HEADER`) + `docs/migracao/edge-functions-matrix.md` com status esperado por função; job no `ci.yml` compara.
**Verificação:** CI verde com a matriz; divergência abre falha.
**Camada:** repo

### E22 — Corrigir a lista estática do worker MCP da origem
- [ ] Concluído
**Por quê:** `functions_list` "mantida no worker" omite `gerar-snapshots-conformidade`, `gerar-sped-ecd`, `gerar-sped-ecf` e marca `verify_jwt` errado.
**Como:** worker passa a ler `config.toml` do repo (raw GitHub) ou a Management API; enquanto isso, atualizar a lista.
**Verificação:** `functions_list` retorna 104 e `verify_jwt` bate com o probe.
**Camada:** Cloudflare Worker `supabase-promofinance-mcp`

---

## Fase 3 — Cron e vault (E23–E29)

### E23 — Destravar `cron-failure-watch` (CHECK `performance_alerts_source_check`)
- [ ] Concluído
**Por quê:** 5 falhas em 3 dias: `violates check constraint "performance_alerts_source_check"` — destino aceita só `query_telemetry|pg_stat_statements`; origem inclui `cron`.
**Como:** `ALTER TABLE performance_alerts DROP CONSTRAINT ..., ADD CONSTRAINT performance_alerts_source_check CHECK (source IN ('query_telemetry','pg_stat_statements','cron'))`.
**Verificação:** próxima execução (`10 * * * *`) com `status='succeeded'`.
**Camada:** destino · migration `20260826050000_fix_cron_checks.sql`

### E24 — Destravar `sefaz-observability-hourly` (`sample_ids uuid[]`)
- [ ] Concluído
**Por quê:** 5 falhas: `column "sample_ids" is of type uuid[] but expression is of type text[]` — `sefaz_run_observability_checks()` do destino diverge da origem (bodyhash diferente).
**Como:** substituir pelo corpo da origem (`pg_get_functiondef`).
**Verificação:** execução seguinte `succeeded`; `integrity_alerts` recebendo linhas do domínio `nfe_sefaz`.
**Camada:** destino · mesma migration da E23

### E25 — Vault e `integration_secrets` do destino
- [ ] Concluído
**Por quê:** origem: `MCP_GATEWAY_SECRET`, `SUPABASE_ANON_KEY` (vault) + 2 linhas em `integration_secrets` (incl. `conformidade_cron`); destino: `integration_secret_asaas/bling`, `regua_cron_secret` e `integration_secrets` vazia. Crons HTTP da origem dependem disso.
**Como:** `vault.create_secret` para os 3 nomes ausentes (valores do destino, não copiar os da origem); `INSERT` das 2 linhas de `integration_secrets` com valores novos; padronizar `internal_job_secret()` em uma única fonte (vault) e alinhar `x-cron-secret` nas functions.
**Verificação:** `select name from vault.secrets` = união dos dois conjuntos; `internal_job_secret()` retorna valor só para `service_role`/`postgres`.
**Camada:** destino

### E26 — Recriar os 8 cron jobs ausentes apontando para o destino
- [ ] Concluído
**Por quê:** faltam `webhook-retry-worker-1min`, `sefaz-dfe-dispatcher-15min`, `monitorar-erros-frontend`, `digest-silenciamentos-erro`, `enviar-digest-conformidade-horario`, `gerar-snapshots-conformidade-mensal`, `auditar-acessos-cross-tenant`, `capture-index-usage-daily`. Destino não tem nenhum job `net.http_post`.
**Como:** `cron.schedule` com `url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/...'` e headers `apikey` (vault `SUPABASE_ANON_KEY`) + `x-cron-secret` (`internal_job_secret()`). Atualizar `scripts/migrate-cron-jobs.sql` (hoje descreve 13 jobs; real: 31).
**Verificação:** `select count(*) from cron.job` = 30 (31 da origem − `cleanup-orphan-test-buckets` + `executar-regua-cobranca-diaria`); 0 jobs com `lszcm` no comando.
**Camada:** destino · `scripts/migrate-cron-jobs.sql`

### E27 — Alinhar schedule e comando dos 15 jobs divergentes
- [ ] Concluído
**Por quê:** ex.: `maintain-monthly-partitions` `0 0 1 * *` (destino) vs `10 3 * * *` (origem); `cleanup-expired-tokens` `0 1 * * *` vs `0 */6 * * *`; `integrity-invariants-hourly` `45` vs `5`; comandos com hash diferente em 15 jobs.
**Como:** `cron.alter_job` com schedule/comando da origem; divergência intencional vai para o Apêndice A.
**Verificação:** `diff.mjs` F1 → `diff` só com renames `pgss-*`.
**Camada:** destino

### E28 — Substituir stubs por funções reais
- [ ] Concluído
**Por quê:** no destino, `run_integrity_cycle()` = `RETURN jsonb('status','ok')` (o cron horário "sucede" sem verificar nada); `check_catalogos_tributarios_invariants()` (232 vs 3.996 chars), `lancamento_contabil_before_insert()` (91 vs 510), `normalizar_tipo_partida()`, `get_retencao_politicas_status()` (retorno diferente), `maintain_monthly_partitions()`, `validar_partidas_dobradas()` sem SECDEF.
**Como:** `CREATE OR REPLACE` com `pg_get_functiondef` da origem (depende de E30–E36 para colunas/constraints referenciadas).
**Verificação:** `select run_integrity_cycle()` retorna jsonb com chaves de invariantes; `diff.mjs` D1 → bodyhash igual para as 23.
**Camada:** destino · migration `20260826110000_funcoes_reais.sql`

### E29 — Alerta de falha de cron em canal externo
- [ ] Concluído
**Por quê:** as 10 falhas dos últimos 3 dias não geraram alerta (o próprio `watch_cron_failures` estava quebrado).
**Como:** após E23, `watch_cron_failures` insere em `performance_alerts` → trigger `notify_performance_alert_trigger` → `notify-performance-alert` (function) → e-mail/WhatsApp; incluir `cron_job_logs` no digest.
**Verificação:** forçar falha sintética (`cron.schedule('probe-fail','* * * * *','select 1/0')`) e receber alerta em < 15 min; remover o job.
**Camada:** destino · edge `notify-performance-alert`

---

## Fase 4 — Convergência de schema (E30–E42)

### E30 — Adicionar as 372 colunas ausentes (77 tabelas)
- [ ] Concluído
**Por quê:** o reconcile v2 (`20260825100000`) foi aplicado parcialmente — ex.: 13 `ADD COLUMN` em `oportunidades_elisao` (linhas 2456–2468) não têm efeito no destino. Lista completa gerada pelo `diff.mjs` (B4).
**Como:** gerar `ALTER TABLE ... ADD COLUMN` a partir de `information_schema.columns` da origem; colunas `NOT NULL` sem default entram como `NULL` → backfill → `SET NOT NULL` (evita o erro que abortou o v2).
**Verificação:** colunas "só na origem" em tabelas comuns = 0 (antes: 372).
**Camada:** destino · migration `20260826060000_colunas_ausentes.sql`

### E31 — Convergir tabelas tributárias de design conflitante ⚠ DECISÃO (mapeamento)
- [ ] Concluído
**Por quê:** `simulacoes` (19 cols origem vs 9 destino), `simulacao_tributos_detalhados`, `projecoes_reforma`, `operacoes_icms`, `oportunidades_elisao` têm colunas do destino inexistentes na origem (`parametros/resultado/status/tipo`, `carga_atual/carga_projetada_iva`, `cfop/cst`…). O front (tipado pela origem) não lê essas.
**Como:** para cada tabela: mapear colunas antigas → novas, `UPDATE` de migração dos dados existentes (poucas linhas, seeds), `DROP COLUMN` das antigas. Mapeamento proposto em `docs/migracao/mapeamento-colunas.md` para APROVADO.
**Verificação:** colunas "só no destino" nessas 5 tabelas = 0.
**Camada:** destino · migration `20260826070000_convergir_tributario.sql`

### E32 — Convergir tabelas de integração (`api_keys`, `bling_sync_logs`, `bitrix_oauth_tokens`, `bling_tokens`, `benchmarks_setoriais`, `auditoria_tributaria`)
- [ ] Concluído
**Por quê:** `api_keys` tem 16 colunas (superset de dois designs, falta `name`); `benchmarks_setoriais` é outro modelo (`cnae/indicador/mediana` vs `cnae_prefix/carga_media_pct`); `bling_sync_logs` idem.
**Como:** mesmo método da E31; `bitrix_oauth_tokens/bling_tokens` estão vazias — recriar com DDL da origem.
**Verificação:** `diff.mjs` B4 → 0 para as 6 tabelas.
**Camada:** destino · migration `20260826071000_convergir_integracoes.sql`

### E33 — Convergir tabelas de observabilidade/segurança
- [ ] Concluído
**Por quê:** `acessos_suspeitos`, `security_alerts`, `slo_metrics_diarias`, `frontend_error_alert_state`, `overlay_rejeicoes_auditoria`, `sped_contabil_arquivos`, `sso_sandbox_runs`, `pagamentos_recorrentes`, `pix_templates`, `scim_*`, `index_usage_snapshots` têm designs divergentes; PKs diferentes em `frontend_error_alert_state` (`assinatura` vs `id`), `indices_uso_excecoes` (`index_name` vs `id`), `slo_metrics_diarias` (`data` vs `id`).
**Como:** tabelas vazias ou só com dados de log → `DROP` + `CREATE` com DDL da origem; com dados → mapear.
**Verificação:** `diff.mjs` B4/C1 → 0 para o grupo.
**Camada:** destino · migration `20260826072000_convergir_observabilidade.sql`

### E34 — Reparticionar `audit_logs` e `frontend_error_logs`
- [ ] Concluído
**Por quê:** origem: tabelas particionadas (`relkind p`, 11 + 8 partições). Destino: tabelas planas com 426 e 0 linhas; as `_2026_01..10` e `_default` são órfãs (`pg_inherits` = 0). `maintain_monthly_partitions` mensal vai falhar; `drop_old_partitions` idem.
**Como:** `CREATE TABLE audit_logs_new (LIKE ...) PARTITION BY RANGE (created_at)`; `ATTACH PARTITION` das órfãs após conferir ranges; `INSERT ... SELECT` das 426 linhas; swap de nomes em transação; recriar índices `ON ONLY` e triggers `trg_frontend_error_logs_sanitize` nas partições; FORCE RLS + policies `admin_only_*` por partição como na origem.
**Verificação:** `diff.mjs` B3 → `relkind = p` e `part = true` iguais; F14 → `pg_inherits` com as mesmas 19 relações de partição.
**Camada:** destino · migration `20260826080000_reparticionar_logs.sql` (precedida de backup E01)

### E35 — Restaurar 256 constraints ausentes
- [ ] Concluído
**Por quê:** CHECKs de range e vigência em `aliquotas_*`, `beneficios_fiscais`, `benchmarks_setoriais`, `bling_sync_logs`, `bling_webhook_events`, `catalogos_tributarios_health_history`, `cnaes`, `api_keys`, `apuracoes_irpj_csll`… não existem no destino; UNIQUEs também.
**Como:** gerar de `pg_get_constraintdef` da origem; adicionar como `NOT VALID` + `VALIDATE CONSTRAINT` (dados que violarem → corrigir ou registrar).
**Verificação:** `diff.mjs` C1 → `onlySrc = 0` (exceto Lalamove/partições).
**Camada:** destino · migration `20260826090000_constraints.sql`

### E36 — Resolver os 14 conflitos semânticos de constraint
- [ ] Concluído
**Por quê:** `partidas_contabeis_tipo_check` = `('D','C')` origem vs `('debito','credito')` destino (192 linhas no destino usam o padrão antigo); `integrity_alerts_domain_check` sem `nfe`/`tr…`; FKs sem `ON DELETE CASCADE` (`aliquotas_iss_municipal→itens_lista_iss`, `protocolos_st_ncms→ncms`); `execucoes_regua_cobranca_status_check` com `processando` extra; `clientes_tipo_check` e `contas_*_status_check` só com forma diferente (ok).
**Como:** normalizar dados (`UPDATE partidas_contabeis SET tipo = CASE ...`), trocar CHECKs pela definição da origem, recriar FKs com CASCADE.
**Verificação:** `diff.mjs` C1 → `diff` só com reescritas cosméticas de `ARRAY[...]::text[]`.
**Camada:** destino · migration `20260826091000_constraints_conflitos.sql`

### E37 — Enum `tipo_cobranca`
- [ ] Concluído
**Por quê:** origem `boleto,pix,transferencia,cartao,debito_automatico,dinheiro,cheque`; destino sem `cartao` e com `cartao_credito`, `cartao_debito`. Colunas tipadas (`pagamentos_recorrentes.tipo_cobranca`) falham ao gravar `cartao`.
**Como:** `ALTER TYPE tipo_cobranca ADD VALUE 'cartao'`; manter os dois extras (remoção de label não é suportada) e documentar no Apêndice A.
**Verificação:** `select unnest(enum_range(null::tipo_cobranca))` inclui `cartao`.
**Camada:** destino · migration `20260826092000_enum_tipo_cobranca.sql`

### E38 — Índices: 132 ausentes e 17 degradados
- [ ] Concluído
**Por quê:** destino perdeu colunas de índices compostos (`idx_entregas_obrigacoes_empresa (empresa_id)` vs `(empresa_id, competencia)`, `idx_faixas_simples_anexo`, `idx_per_dcomp_*`, `idx_planos_acao_user`, `idx_saved_filters_shared` parcial, `idx_solicitacoes_lgpd_user`) e não tem `idx_benchmarks_lookup`, `idx_auditoria_trib_*`, `idx_contas_receber_bitrix_deal`, `idx_alertas_empresa_id`…
**Como:** `DROP INDEX` + `CREATE INDEX CONCURRENTLY` com `indexdef` da origem (fora de transação); excluir Lalamove e partições `_2026_11`.
**Verificação:** `diff.mjs` C2 → `onlySrc = 0`, `diff = 0`; `pg_index.indisvalid` = true para todos.
**Camada:** destino · script `scripts/sql/indices_convergencia.sql` (não transacional)

### E39 — Views, matview e `estrategias_elisao_catalogo`
- [ ] Concluído
**Por quê:** 9 views com definição diferente (`vw_dre_mensal`, `vw_fluxo_caixa`, `vw_saldos_contas`, `vw_dso_aging`, `vw_contas_receber_painel`, `vw_gastos_centro_custo`, `vw_metricas_cobranca`, `vw_tributario_dashboard`, `vw_webhooks_recentes`); ausentes `vw_transferencias_painel`, `vw_auditoria_tributaria_recente`, matview `mv_benchmark_setorial`; `estrategias_elisao_catalogo` é VIEW na origem e TABLE (8 linhas) no destino.
**Como:** `CREATE OR REPLACE VIEW` com `pg_get_viewdef` da origem e `security_invoker` igual; migrar as 8 linhas para `estrategias_elisao` (se não duplicadas) e `DROP TABLE` → `CREATE VIEW`; `REFRESH MATERIALIZED VIEW mv_benchmark_setorial`.
**Verificação:** `diff.mjs` D3/D4 → 0 (exceto Lalamove e `mcp_probe`).
**Camada:** destino · migration `20260826100000_views.sql`

### E40 — Funções: 23 divergentes, 14 ausentes, 14 assinaturas conflitantes
- [ ] Concluído
**Por quê:** assinaturas diferentes quebram RPC nomeada do front: `fn_livro_razao` (ordem de args), `fn_balancete` (sem `p_nivel_max`), `fn_indices_contabeis` (`p_competencia` vs datas), `get_integrity_alerts`, `mascarar_chave_pix(p_chave)`, `fe_error_signature(p_message,p_component)`, `recarregar_seeds_fiscais(p_motivo)`, `faixa_simples_reparticao_valida(p_reparticao)`, `drop_old_partitions(p_schema,p_keep_months)`; `provisionar_usuario` retorna `void` (origem `jsonb`); `validar_catalogos_tributarios` retorno diferente.
**Como:** `DROP FUNCTION` das assinaturas só do destino; `CREATE OR REPLACE` das 37 com `pg_get_functiondef` da origem; preservar `is_user_admin()`, `has_any_role()`, `invocar_regua_cobranca()`, `registrar_evento_receber()` (só destino, em uso) e registrá-las no Apêndice A.
**Verificação:** `diff.mjs` D1 → `onlySrc = 0`, `diff = 0`; `onlyDst` só com a allowlist.
**Camada:** destino · migration `20260826110000_funcoes_reais.sql` (mesma da E28)

### E41 — Triggers
- [ ] Concluído
**Por quê:** `trg_validar_partidas_dobradas` é CONSTRAINT TRIGGER deferível na origem e trigger por linha no destino (rejeita a primeira partida antes da contrapartida); 15 triggers só na origem (8 são de partições, resolvidos na E34); 6 `updated_at` só no destino.
**Como:** recriar como `CONSTRAINT TRIGGER ... DEFERRABLE INITIALLY DEFERRED`; manter os 6 extras (allowlist).
**Verificação:** inserir par débito/crédito na mesma transação no destino → commit ok; uma partida só → erro no commit.
**Camada:** destino · migration `20260826111000_triggers.sql`

### E42 — Precisão numérica, defaults, nullability, `search_path`, comentários
- [ ] Concluído
**Por quê:** 152 diffs de coluna: `numeric(6,4)` → `numeric` sem precisão em alíquotas (`aliquotas_interestaduais.aliquota_importado`, `cnaes.presuncao_*`, `faixas_simples_nacional.aliquota (8,6)`), `numeric(14,2)` extra em `apuracoes_irpj_csll`, defaults diferentes (`bling_sync_logs.status 'pendente'` vs `'pending'`), `contas_bancarias.saldo_disponivel` gerada na origem; 12 funções sem `search_path`; 6 comentários de tabela ausentes.
**Como:** `ALTER COLUMN TYPE/SET DEFAULT/SET NOT NULL` da origem; `ALTER FUNCTION ... SET search_path = public, pg_catalog`; `COMMENT ON`.
**Verificação:** `diff.mjs` B4 → `diff = 0`; F15 → 0.
**Camada:** destino · migration `20260826120000_tipos_defaults.sql`

---

## Fase 5 — Ledger e repositório (E43–E50)

### E43 — Renomear 323 migrations para as versões do ledger da origem
- [ ] Concluído
**Por quê:** nome do arquivo difere do ledger por 2–5 s (`20260518153054_*.sql` vs `20260518153051` no banco) em 323 casos; `supabase db push` contra a origem re-aplicaria tudo.
**Como:** script `scripts/rename-migrations-to-ledger.mjs` (pareia por proximidade temporal ≤ 10 s e ordem) + `git mv`; guardar mapa em `docs/migracao/mapa-versoes.csv`.
**Verificação:** versões do repo ∖ ledger da origem = 219 (só as anteriores a 2026-05-18 e as pós-migração), sem falsos pendentes.
**Camada:** repo · `supabase/migrations/`

### E44 — Backfill do ledger do destino
- [ ] Concluído
**Por quê:** ledger do destino tem 16 entradas; repo tem 542 arquivos → 526 "pendentes" para o CLI.
**Como:** após E43 e com schema convergido, `INSERT INTO supabase_migrations.schema_migrations(version,name)` para todas as versões do repo ausentes (equivalente a `supabase migration repair --status applied`).
**Verificação:** `supabase migration list --db-url $DST` sem `pending`.
**Camada:** destino

### E45 — Substituir a migration-comentário da wave1 por DDL real
- [ ] Concluído
**Por quê:** `20260825200000_plano_correcoes_100_etapas_wave1.sql` só documenta; as mudanças foram feitas direto no banco e não são reproduzíveis.
**Como:** `pg_dump --schema-only` atual vs `/workspace/notes/pf-migration-audit/dst_schema_0825.sql` (08:26, pré-wave1) → extrair o delta em `20260825200000_...sql` real. Mesmo tratamento para `20260825100000` e `20260825110000` (ledger com statement de 27–30 chars).
**Verificação:** aplicar a sequência do repo em banco vazio (E46) reproduz o schema do destino.
**Camada:** repo

### E46 — Baseline squash + prova em banco limpo ⚠ DECISÃO
- [ ] Concluído
**Por quê:** 542 arquivos, 3 gerações de design, ledger sem correspondência: o histórico não é mais confiável como fonte.
**Como:** `supabase db dump --schema-only` da origem convergida → `supabase/migrations/20260901000000_baseline.sql`; mover histórico para `supabase/migrations/_archive/`; CI aplica baseline num Postgres 17 efêmero e roda `diff.mjs` contra o destino.
**Verificação:** job `schema-from-scratch` verde.
**Camada:** repo · `.github/workflows/ci.yml`

### E47 — CI de drift origem/destino/repo
- [ ] Concluído
**Por quê:** nada hoje detecta drift; a "validação 211/211" passou com 372 colunas faltando.
**Como:** workflow `schema-drift.yml` (cron diário + PR) roda `diff.mjs` com secrets `SRC_DB_URL`/`DST_DB_URL`; falha se `onlySrc+onlyDst+diff > 0` fora de `docs/migracao/allowlist-drift.json`.
**Verificação:** run diário verde após E56.
**Camada:** repo

### E48 — Atualizar documentação operacional desatualizada
- [ ] Concluído
**Por quê:** `scripts/README.md` fala em 87 functions e 13 crons (real: 104 e 31); `ESTADO_ATUAL.md` e `docs/MIGRATION_CHECKLIST.md` refletem estado anterior à wave1.
**Como:** reescrever com os números desta auditoria e apontar para `diff.mjs`/probe.
**Verificação:** revisão no PR.
**Camada:** repo

### E49 — Tipos do front regenerados a partir do destino
- [ ] Concluído
**Por quê:** `src/integrations/supabase/types.ts` foi gerado pela origem; após E30–E42 os dois convergem, mas o arquivo precisa ser regenerado para pegar funções `is_user_admin`, `has_any_role`, `invocar_regua_cobranca` (só destino).
**Como:** `supabase gen types typescript --project-id bwwbeyolnnzppeuhgkcd > src/integrations/supabase/types.ts`; `bun run typecheck`.
**Verificação:** `tsc --noEmit` limpo; `diff` de `types.ts` só com as funções da allowlist.
**Camada:** repo

### E50 — Higiene na origem enquanto ela vive
- [ ] Concluído
**Por quê:** origem concede `anon` em `acessos_suspeitos` e `mcp_probe`; tem `cleanup-orphan-test-buckets` horário e `migrate-helper` sem JWT (auth própria por chave).
**Como:** `REVOKE ALL ON acessos_suspeitos FROM anon`; `DROP VIEW mcp_probe` + job de teste; desligar `migrate-helper` após E56 (`supabase functions delete`).
**Verificação:** `diff.mjs` E2 → `acessos_suspeitos|anon` some.
**Camada:** origem

---

## Fase 6 — Dados (E51–E55)

### E51 — Catálogos fiscais: reconciliar com a origem ⚠ DECISÃO (fonte)
- [ ] Concluído
**Por quê:** `aliquotas_iss_municipal` 62 → 28 (dedup do harness apagou 34), `protocolos_st_ufs` 165 → 80, `protocolos_st_ncms` 26 → 20, `protocolos_st` 9 → 10; em sentido oposto `itens_lista_iss` 45 → 159, `ncms` 84 → 128, `cnaes` 44 → 66, `aliquotas_internas_uf` 65 → 92 (seed do destino é mais completo?).
**Como:** exportar as tabelas de catálogo da origem (`db_export` json), comparar chave natural, decidir por tabela (origem vs seed) e recarregar via `recarregar_seeds_fiscais()` real; recalcular `catalogos_fiscais_cargas.checksum`.
**Verificação:** `check_catalogos_tributarios_invariants()` (versão real) sem `critical`.
**Camada:** destino

### E52 — Seeds de teste nas tabelas financeiras do destino ⚠ DECISÃO
- [ ] Concluído
**Por quê:** destino tem `contas_pagar` 20, `contas_receber` 20, `clientes` 12, `partidas_contabeis` 192, `lancamentos_contabeis` 31, `sso_providers` 4… que não existem na origem (0). São dados de `003_seed_data.sql`/harness, não de produção.
**Como:** marcar via `empresa_id` da empresa de seed e `DELETE` antes do go-live, ou mover para um projeto `staging`.
**Verificação:** contagens das tabelas financeiras = 0 (ou = origem) no dia do cutover.
**Camada:** destino

### E53 — Usuários e identidades
- [ ] Concluído
**Por quê:** origem 4 usuários (3 e-mail + 1 Google), destino 2 (`ti@…`, `adm***@…`); ausentes `tes***@promobrindes` e a identidade Google do admin; sobra `reg***@noop.invalid` (resíduo de teste).
**Como:** `INSERT` em `auth.users`/`auth.identities` preservando UUIDs (para `user_roles`, `user_empresas`, `profiles` casarem); remover o usuário `noop.invalid`.
**Verificação:** `auth.users` do destino ⊇ origem ∖ testes; login Google funciona.
**Camada:** destino

### E54 — Observabilidade histórica
- [ ] Concluído
**Por quê:** `index_usage_snapshots` 18k → 0, `rpc_observability_metrics` 543 → 0, `catalogos_tributarios_health_history` 22 → 0, `slo_metrics_diarias` 1 → 0, `ci_security_gate_events` 2 → 0.
**Como:** migrar só `slo_metrics_diarias`, `catalogos_tributarios_health_history`, `ci_security_gate_events` (histórico de negócio); os demais recomeçam no destino (documentar).
**Verificação:** contagens iguais para as 3 tabelas.
**Camada:** destino

### E55 — `integration_secrets`, `conformidade_snapshots`, `digest_envios_log`
- [ ] Concluído
**Por quê:** `integration_secrets` 2 → 0 (E25 cobre), `conformidade_snapshots` 7 vs 12, `digest_envios_log` 2 vs 15, `alertas_tributarios` 2 vs 6 — mistura de dados reais e de teste.
**Como:** comparar por chave natural; manter união sem duplicar.
**Verificação:** sem duplicatas por (`empresa_id`, `competencia`).
**Camada:** destino

---

## Fase 7 — Validação e go-live (E56–E60)

### E56 — Diff estrutural zero
- [ ] Concluído
**Como:** `bun diff.mjs c1.json 100 && bun diff.mjs c2.json 100`.
**Verificação:** `onlySrc = onlyDst = diff = 0` fora do Apêndice A; resultado salvo em `docs/migracao/DIFF-FINAL-<data>.txt`.
**Camada:** VPS

### E57 — Suíte de validação reescrita e ampliada
- [ ] Concluído
**Por quê:** `supabase/tests/test_harness_v2.js` depende de `psql` (não existe no container) e não testa partições, assinaturas de RPC, policies `true` nem grants de função.
**Como:** portar para `Bun.SQL`; adicionar: partições ativas, `pg_get_function_identity_arguments` igual à origem, policies abertas = 16, EXECUTE de `authenticated` só na allowlist, cron sem URL da origem, `verify_jwt` = matriz.
**Verificação:** 100% verde contra o destino; resultado em `supabase/tests/test_results_v3.json`.
**Camada:** repo · VPS

### E58 — E2E do front contra o destino
- [ ] Concluído
**Como:** Playwright existente (`playwright.config.ts`) com `VITE_SUPABASE_URL=bwwbey…`: login, DRE, fluxo de caixa, contas a pagar/receber, conciliação, simulações tributárias, SSO sandbox.
**Verificação:** suíte verde; `frontend_error_logs` do destino sem erros 4xx/5xx de RPC.
**Camada:** repo · CI

### E59 — Cutover ⚠ DECISÃO
- [ ] Concluído
**Como:** janela definida; ordem: (1) origem em modo leitura (revogar INSERT/UPDATE de `authenticated`), (2) sync final de dados (E51–E55), (3) Vercel/Lovable env → `bwwbey`, (4) E20 (webhooks), (5) smoke E21 + E58. Rollback: reverter env + grants em < 10 min.
**Verificação:** `edge_function_logs` e `webhook_events` do destino recebendo tráfego real; origem sem novos eventos.
**Camada:** Vercel · Lovable · provedores

### E60 — Pós-cutover 72 h e descomissionamento da origem
- [ ] Concluído
**Como:** monitorar `cron.job_run_details`, `edge_function_logs`, `frontend_error_logs`, `performance_alerts`; após 72 h limpas, pausar origem (Lovable Cloud) e agendar remoção em 30 dias; atualizar `ESTADO_ATUAL.md`.
**Verificação:** 0 falhas de cron, 0 erros novos no front, `health` do destino em monitor externo.
**Camada:** operação

---

## Apêndice A — Allowlist de divergências aceitas

| Objeto | Motivo |
|---|---|
| 13 tabelas Lalamove/driver/tracking, `bitrix24_sync`, `evaluate-delivery-alerts`, views `orders_*`/`drivers_safe_view`, enums de entrega | módulo descomissionado (`20260824124500`) |
| Partições `audit_logs_2026_11`, `frontend_error_logs_2026_11` (origem) e `_2026_01..04` (destino) | criadas por `maintain_monthly_partitions`; convergem sozinhas |
| Bucket `comprovantes-financeiro` + 4 policies | só destino, em uso |
| Limites de tamanho/mime nos buckets `nfe-*` | hardening do destino |
| `anon` removido do `DEFAULT PRIVILEGES` de funções | hardening do destino |
| Funções `is_user_admin()`, `has_any_role()`, `invocar_regua_cobranca()`, `registrar_evento_receber()`, `get_performance_alerts()`, `resolve_integrity_alert()`, `close/escalate_stale_integrity_alerts()`, `purge_old_rows()`, `watch_cron_failures()` | só destino, referenciadas por cron/policies |
| Cron `executar-regua-cobranca-diaria`; renames `pgss-*` | só destino |
| Enum `tipo_cobranca` com `cartao_credito`, `cartao_debito` extras | label não removível |
| 6 triggers `trg_*_updated_at` só no destino | inofensivos |
| `mcp_probe`, `migrate-helper`, `cleanup-orphan-test-buckets` | artefatos de teste da origem; não migrar |

## Apêndice B — Matriz `verify_jwt` (estado real da origem, alvo do destino)

- **ON (4):** `analise-preditiva`, `bitrix24-sync`, `conciliacao-ia`, `open-finance`
- **OFF (100):** todas as demais, incluindo webhooks (`asaas-webhook`, `bling-webhook`, `bitrix24-webhook`, `whatsapp-webhook`, `n8n-callback`, `scim-server`, `sso-*`), utilitárias (`health`, `get-mapbox-token`, `get-vapid-key`, `mcp-query`) e as invocadas por cron (`webhook-retry-worker`, `processar-fila-cobrancas`, `gerar-resumo-financeiro-diario`, `calcular-slo-metrics-diario`, `enviar-relatorios-tributarios-agendados`, `gerar-alertas-dispatcher`, `relatorio-diario-anomalias`, `sefaz-dfe-dispatcher`, `monitorar-erros-frontend`, `digest-silenciamentos-erro`, `enviar-digest-conformidade`, `gerar-snapshots-conformidade`).
- Não deployar no destino: `migrate-helper`, `evaluate-delivery-alerts`.

## Apêndice C — Números da auditoria (2026-08-25, para conferência)

| Métrica | Origem | Destino |
|---|---|---|
| Tabelas / colunas (public) | 279 / 3.891 | 271 / 3.430 |
| Constraints / índices | 855 / 908 | 655 / 846 |
| Funções / triggers / views / matviews | 173 / 166 / 24 / 2 | 178 / 157 / 17 / 1 |
| Policies (public) / abertas p/ authenticated | 507 / 16 | 616 / 79 |
| Funções com EXECUTE explícito p/ anon/auth | 73 | 177 |
| Cron jobs / falhando (3 dias) | 31 / 0 | 22 / 2 |
| Edge functions deployadas / com JWT no gateway | 104 / 4 | 102 / 63 |
| Migrations no ledger | 326 | 16 |
| Usuários auth | 4 | 2 |
| Linhas em tabelas comuns | 84.916 | 14.814 |

## Apêndice D — Evidências e ferramentas

- `/workspace/notes/pf-migration-audit/q.mjs` — `bun q.mjs DST|SRC "<sql>"`
- `/workspace/notes/pf-migration-audit/diff.mjs` — `bun diff.mjs <checks.json> [max]` (checks c1/c2 desta auditoria em `/tmp/c1.json`, `/tmp/c2.json`; versionar em `scripts/audit/`)
- Dumps: `dst_schema_0825.sql` (pré-wave1), `src_schema_0825.sql`, `DIFF_REPORT.txt`
- Probe HTTP: `src_probe.txt`, `dst_probe.txt`, `src_jwt_on.txt`, `dst_jwt_on.txt` (regerar com E21)
