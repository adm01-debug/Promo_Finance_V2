# Anexo de evidências — Auditoria de Estado

> Suporte factual de [`ESTADO_ATUAL.md`](../ESTADO_ATUAL.md). Listas brutas, reproduzíveis.
> **Data da coleta:** 2026-08-16 · **Commit:** `4aa2f10`
> Todas as consultas ao banco foram executadas com `read_only: true`.

---

## 1. Tabelas que o código usa e que NÃO existem no banco (46)

Verificação: `select to_regclass('public.<nome>')` para cada nome — retorno `null` = ausente em
qualquer relkind (tabela, view, matview, partição). Não é inferência textual.

### 1.1 Com consumidor ativo em código (33)

| Tabela ausente | Consumidores | Evidência |
|---|---:|---|
| `asaas_credit_risk_analysis` | 1 | `supabase/functions/asaas-proxy/index.ts` |
| `auditoria_tributaria` | 1 | `supabase/functions/processar-solicitacao-lgpd/index.ts` |
| `benchmarks_setoriais` | 1 | `supabase/functions/gerar-alertas-tributarios/index.ts` |
| `beneficios_fiscais` | 1 | `supabase/functions/consulta-tributaria/index.ts` |
| `bitrix_oauth_tokens` | 2 | `functions/sync-profile-to-bitrix/index.ts`, `functions/bitrix24-sync/index.ts` |
| `bling_sync_logs` | 1 | `src/hooks/bling/useSyncLogs.ts:9` |
| `bling_tokens` | 1 | `supabase/functions/bling-proxy/index.ts` |
| `bling_webhook_events` | 2 | `src/hooks/bling/useSyncLogs.ts:24`, `functions/bling-webhook/index.ts` |
| `cnpja_cache` | 2 | `src/pages/AdminSystemHealth.tsx`, `functions/cnpja-lookup/index.ts` |
| `convites` | 3 | `src/hooks/useOrganizacoes.ts:124`, `functions/enviar-convite-organizacao`, `functions/aceitar-convite` |
| `convites_contador` | 2 | `functions/convidar-contador`, `functions/validar-token-contador` |
| `edge_function_logs` | 3 | `src/pages/AdminEdgeHealth.tsx:76`, `functions/_shared/observability.ts:55`, `functions/gerar-alertas-tributarios` |
| `elisao_simulacoes_regime` | 1 | `src/components/contabilidade/elisao/ElisaoFiscalTab.tsx` |
| `eventos_contabilizacao_log` | 1 | `supabase/functions/contabilizar-evento/index.ts` |
| `execucoes_regua_cobranca` | 1 | `supabase/functions/executar-regua-cobranca/index.ts` |
| `frontend_error_alert_state` | 1 | `src/hooks/useFrontendErrorLogs.ts` |
| `glossario_tributario` | 1 | `src/pages/tributario/GlossarioTributario.tsx:19` |
| `historico_relatorios` | 2 | `src/hooks/useRelatoriosAgendados.ts:67`, `functions/executar-relatorios` |
| **`integration_secrets`** | **4** | **`functions/_shared/auth-guard.ts`, `_shared/webhook-auth.ts`**, `functions/enviar-digest-conformidade`, `functions/gerar-snapshots-conformidade` |
| `notification_history` | 2 | `src/pages/configuracoes/HistoricoNotificacoes.tsx:86`, `functions/notify-saved-filter` |
| `organizacao_membros` | 3 | `src/hooks/useOrganizacoes.ts:84`, `functions/enviar-convite-organizacao`, `functions/aceitar-convite` |
| `overlay_rejeicoes_auditoria` | 2 | `src/hooks/useOverlayRejeicoesAuditoria.ts`, `functions/overlay-rejeicoes-auditoria` |
| `push_subscriptions` | 3 | `src/hooks/useWebPushSubscription.ts:75`, `src/hooks/usePushNotifications.ts`, `functions/send-push-notification` |
| `regime_decision_cache` | 2 | `functions/decidir-regime`, `functions/detectar-anomalias-financeiras` |
| `regras_contabilizacao_automatica` | 2 | `src/components/contabilidade/contabilizacao-automatica/useContabilizacaoMutations.ts`, `functions/contabilizar-evento` |
| `relatorios_agendados` | 2 | `src/hooks/useRelatoriosAgendados.ts:53`, `functions/executar-relatorios` |
| `saved_filter_subscriptions` | 2 | `src/hooks/useSavedFilterSubscriptions.ts:73`, `src/hooks/saved-filter-alerts/useEntitySavedFilterAlerts.ts` |
| `scim_operations_log` | 1 | `supabase/functions/scim-server/index.ts` |
| `security_alerts` | 1 | `src/hooks/useSecurityAlerts.ts:66` |
| `sso_role_mappings` | 4 | `src/hooks/useSSO.ts:100`, `functions/scim-server`, `functions/sso-test-login`, `functions/sso-callback` |
| `sso_sandbox_runs` | 1 | `src/hooks/useSSOSandboxRuns.ts` |
| `sso_user_groups` | 1 | `supabase/functions/sso-callback/index.ts` |
| `tax_audit_trail` | 1 | `supabase/functions/decidir-regime/index.ts` |

> **`integration_secrets` é o caso mais grave da lista:** é consumida pelos módulos compartilhados
> `_shared/auth-guard.ts` e `_shared/webhook-auth.ts` — o caminho de autenticação de webhooks.

### 1.2 Tipadas em `types.ts`, sem consumidor direto localizado (13)

`acessos_suspeitos` · `catalogos_fiscais_cargas` · `catalogos_tributarios_health_history` ·
`estrategias_elisao` · `frontend_error_silence_digest_log` · `index_usage_snapshots` ·
`indices_uso_excecoes` · `operacoes_icms` · `projecoes_reforma` · `retencao_politicas` ·
`simulacao_tributos_detalhados` · `simulacoes` · `sso_role_mappings` *(já em 1.1)*

Ainda assim são **erro de contrato**: `src/integrations/supabase/types.ts` afirma que existem, então
qualquer código novo que as use compila sem aviso e falha só em runtime.

---

## 2. RPCs chamadas pelo código e ausentes no banco (15)

Método: `grep -rhoP "\.rpc\(\s*['\"][a-z0-9_]+" src supabase/functions` (45 RPCs distintas chamadas)
× `pg_proc` do schema `public` (105 funções vivas, excluídas as de `pg_trgm`).

| RPC ausente | Domínio |
|---|---|
| `claim_frontend_error_alerts` | Telemetria de erros de frontend |
| `get_frontend_error_groups` | Telemetria de erros de frontend |
| `get_frontend_error_occurrences` | Telemetria de erros de frontend |
| `silenciar_alerta_erro_frontend` | Telemetria de erros de frontend |
| `get_silenciamentos_expirando` | Telemetria de erros de frontend |
| `claim_silenciamentos_digest` | Digest de silenciamentos |
| `toggle_cron_job` | SRE Command Center |
| `delete_cron_job` | SRE Command Center |
| `resolve_integrity_alert` | Integridade |
| `duplicate_saved_filter` | Filtros salvos |
| `detectar_duplicidades_financeiras` | Bloqueio de duplicidade |
| `gerar_alertas_vencimento` | Alertas financeiros |
| `gerar_contas_recorrentes` | Pagamentos recorrentes |
| `fn_balancete` | Relatórios contábeis |
| `fn_indices_contabeis` | Relatórios contábeis |

> **Falso positivo removido:** `pg_try_advisory_lock` apareceu na extração por não estar em `public`.
> É função nativa (`pg_catalog`). Não conta.

---

## 3. Cron: 16 jobs declarados, 0 ativos

`select count(*) from cron.job` → **0**

### 3.1 Jobs declarados nas migrations

`capture-index-usage-daily` · `capture-slow-queries` · `cleanup-rpc-obs-metrics-daily` ·
`cron-failure-watch` · `daily-log-cleanup` · `daily-log-retention` · `digest-silenciamentos-erro` ·
`enviar-digest-conformidade-horario` · `integrity-invariants-hourly` · `maintain-monthly-partitions` ·
`monitor-table-bloat-daily` · `pgss_baseline_cleanup` · `pgss_weekly_baseline` ·
`refresh-benchmark-setorial-weekly` · `refresh-performance-alerts-weekly` · `sefaz-observability-hourly`

17 migrations contêm `cron.schedule`. Exemplo verificado:
`supabase/migrations/20260712194623_6779ec03-860d-4d19-89b2-044aa6594ba8.sql:133`

### 3.2 Bloqueio adicional: `pg_net` ausente

`select extname from pg_extension` retorna exatamente:
`pg_cron` · `pg_stat_statements` · `pg_trgm` · `pgcrypto` · `plpgsql` · `supabase_vault` · `uuid-ossp`

`select to_regclass('net.http_request_queue')` → `null`

6 migrations usam `net.http_post` para o cron invocar Edge Functions:

- `20260418151247_d0085f49-…sql:55`
- `20260509153155_0aaef25c-…sql:10`
- `20260712194415_c4e0a8ab-…sql:37`
- `20260726180529_06dcfab8-…sql:7`
- `20260728183119_5fa30fdd-…sql:13`
- `20260728210937_aa8871bf-…sql:71,101`

**Consequência:** reagendar os crons não basta. Sem `pg_net`, os jobs que chamam Edge Function
falhariam na execução.

---

## 4. Storage buckets

| Bucket esperado | Origem da expectativa | Situação |
|---|---|---|
| `relatorios-tributarios` | migration + `storage.from()` em `src/` | **AUSENTE** |
| `nfe-certificados` | `storage.from()` em `src/` | **AUSENTE** |
| `notas-fiscais-upload` | migration | **AUSENTE** |
| `uploads` | migration | **AUSENTE** |
| `comprovantes-financeiro` | — | ✅ existe (criado 2026-05-21) |

---

## 5. Migrations aplicadas × versionadas

`supabase_migrations.schema_migrations` (9 registros, todos de 2026-05-21):

```
20260521171250  financeiro_001_schema_base_config
20260521171345  financeiro_002_vendas_unificadas
20260521171405  financeiro_003_vendas_parcelas
20260521171439  financeiro_004_trigger_recalcular
20260521171506  financeiro_005_views
20260521171528  financeiro_006_rls_e_storage
20260521171601  financeiro_007_upsert_helpers
20260521172042  financeiro_008_bulk_upsert
20260521172112  financeiro_009_bulk_security_definer
```

Repositório: **523** arquivos em `supabase/migrations/`. **Zero correspondência de nome.**

Ainda assim o banco tem 242 tabelas do domínio correto — ou seja, o schema foi aplicado por um
mecanismo que **não registra** em `schema_migrations` (comportamento típico do Lovable Cloud).
Isso explica a existência do schema, mas **não** resolve o problema: sem registro, não há como
saber quais das 523 foram aplicadas — e 46 tabelas provam que nem todas foram.

---

## 6. Tabelas vivas NÃO declaradas em nenhuma migration do repo (35)

Sinal de que o banco carrega herança de outro projeto.

**Domínio de logística/entregas (alheio ao produto) — 11:**
`active_tracking` · `driver_approval_queue` · `driver_evaluations` · `driver_incidents` ·
`driver_locations` · `drivers` · `lalamove_orders` · `lalamove_status_history` · `lalamove_stops` ·
`lalamove_uapi_sessions` · `tracking_events`

**Scratch / debug — 3:** `_dbg` · `_t` · `_v4` *(sem RLS)*

**Demais — 21:** `alert_configurations` · `alerts` · `alerts_sent` · `auth_logs` ·
`bitrix24_activities` · `bitrix24_stage_mappings` · `bitrix24_sync` · `bitrix24_tokens` ·
`cron_job_logs` · `email_verifications` · `geo_blocks` · `ip_whitelist` · `mfa_sessions` ·
`nfe_xml` · `password_reset_tokens` · `risk_rules` · `runtime_error_logs` · `subscriptions` ·
`user_devices` · `user_passkeys` · `webauthn_challenges` · `webhook_events`

---

## 7. Volume real de dados (`count(*)`, não estimativa)

### 7.1 Tabelas de negócio

| Tabela | Linhas |
|---|---:|
| `movimentacoes` | 30 |
| `nfe_recebidas` | 31 |
| `contas_pagar` | 20 |
| `contas_receber` | 20 |
| `transacoes_bancarias` | 16 |
| `clientes` | 12 |
| `conciliacoes` | 10 |
| `divergencias_conciliacao` | 10 |
| `alertas` | 10 |
| `execucoes_cobranca` | 10 |
| `boletos` | 6 |
| `alertas_preditivos` | 6 |
| `fornecedores` | 5 |
| `notas_fiscais` | 5 |
| `webhook_dlq` | 4 |
| `sso_providers` | 4 |
| `health_scores_operacionais` | 4 |
| `apuracoes_tributarias` | 3 |
| `notas_fiscais_ocr` | 3 |
| `user_roles` | 3 |
| `profiles` | 2 |
| `sefaz_dfe_cursor` | 2 |
| `empresas` | 1 |
| `conformidade_snapshots` | 12 |

### 7.2 Tabelas de feature em **zero** (prova de feature dormente)

`acoes_recomendadas` · `anomalias_detectadas` · `api_keys` · `asaas_config` · `asaas_customers` ·
`asaas_payments` · `bitrix_sync_logs` · `bitrix_webhook_events` · `bitrix24_tokens` ·
`empresas_certificados` · `expert_conversations` · `expert_messages` · `fila_cobrancas` ·
`n8n_dispatch_logs` · `n8n_workflow_configs` · `nfe_eventos` · `open_finance_consents` ·
`resumos_executivos_semanais` · `saved_filters` · `scim_tokens` · `solicitacoes_lgpd` ·
`webhooks_log` · `whatsapp_conversas`

### 7.3 Tabelas de observabilidade — as únicas com volume real

| Tabela | Linhas |
|---|---:|
| `pg_stat_statements_baseline` | 3.427 |
| `query_telemetry` | 3.309 |
| `slow_query_alerts` | 2.457 |
| `bloat_snapshots` | 2.340 |
| `frontend_performance_logs` | 982 |
| `performance_alerts` | 807 |
| `audit_logs` | 423 |

> Padrão revelador: **só a instrumentação tem dados**. O negócio, não.

### 7.4 Uso humano

| | |
|---|---|
| Usuários em `auth.users` | 3 (`teste@lovable.com`, `ti@promobrindes.com.br`, `adm01@promobrindes.com.br`) |
| Primeiro usuário criado | 2026-05-22 |
| **Último login de qualquer usuário** | **2026-07-30** (17 dias antes desta auditoria) |

---

## 8. Edge Functions × chamadores

102 Edge Functions em `supabase/functions/`. 56 nomes distintos aparecem em `functions.invoke()`.

### 8.1 Sem `invoke()`, sem menção em `src/`, sem menção em migrations (17)

`calcular-slo-metrics-diario` · `calculo-iva` · `ci-security-gate-log` · `compare-schemas` ·
`enviar-alerta-email` · `enviar-relatorios-tributarios-agendados` · `executar-analise-preditiva` ·
`executar-regua-cobranca` · `gerar-alertas-dispatcher` · `n8n-callback` · `n8n-dispatch` ·
`relatorio-diario-anomalias` · `sefaz-dfe-dispatcher` · `sefaz-dfe-puxar` ·
`sync-profile-to-bitrix` · `webhook-replay` · `whatsapp-webhook`

**Interpretação correta desta lista** — não é "17 funções mortas":

- **Webhooks** (`whatsapp-webhook`, `n8n-callback`): chamados por terceiros. Ausência de invoker é esperada.
- **Cron-only** (`executar-regua-cobranca`, `sefaz-dfe-*`, `calcular-slo-metrics-diario`,
  `relatorio-diario-anomalias`, `enviar-relatorios-tributarios-agendados`): deveriam ser acionadas por
  cron — e o cron **não existe** (§3). Estão inertes por causa do R3, não por serem código morto.
- **Genuinamente sem caminho** (`evaluate-delivery-alerts`, domínio de entregas): ⬛.

### 8.2 Distribuição

| Situação | Qtd |
|---|---:|
| Com `invoke()` direto em `src/` | 50 |
| Só mencionada em `src/` (fetch/URL) | 29 |
| Só mencionada em migrations (cron) | 5 |
| Sem chamador algum | 17 |
| *(`_shared`, `fuzz_test.ts` — não são funções)* | 2 |

### 8.3 Extremos de tamanho

| Maiores (linhas) | | Menores (linhas) | |
|---|---:|---|---:|
| `sso-callback` | 925 | `get-mapbox-token` | 17 |
| `asaas-proxy` | 879 | `simular-presumido` | 19 |
| `scim-server` | 819 | `simular-real` | 19 |
| `bitrix24-sync` | 754 | `simular-simples` | 28 |
| `open-finance` | 593 | `get-vapid-key` | 38 |
| `bling-proxy` | 563 | `calculo-iva` | 60 |
| `sefaz-dfe-puxar` | 519 | `health` | 63 |

> Os `simular-*` curtos **não são stubs**: são wrappers finos sobre
> `supabase/functions/_shared/tributario-logic.ts`, com validação Zod. Arquitetura correta.

---

## 9. Dado fictício em código de produção

`Math.random()` fora de testes em `src/`: **70 ocorrências**. A maioria é legítima
(IDs de UI, chaves de canal realtime, alturas de skeleton). As que importam:

| Local | Código | Impacto |
|---|---|---|
| `src/lib/sefaz-simulator/handlers.ts:29` | `if (Math.random() < 0.05)` | Sorteia rejeição SEFAZ |
| `src/lib/sefaz-simulator/handlers.ts:65,88,100,112` | `delay(… + Math.random() * …)` | Simula latência de rede |
| `src/components/nfe/NovaNFeForm.tsx:72` | `numero: Math.floor(1000 + Math.random() * 9000)` | **Número da NF-e é sorteado** |
| `src/components/nfe/ContingenciaNFe.tsx:101` | `const success = Math.random() > 0.1` | **Sucesso da transmissão é sorteado** |
| `src/components/nfe/CancelamentoNFe.tsx:93` | `setTimeout(… Math.random() …)` | Simula processamento |
| `src/components/nfe/InutilizacaoNFe.tsx:108` | idem | Simula processamento |

O import é explícito e honesto no código —
`import { processarSefaz } from '@/lib/sefaz-simulator'` (`NovaNFeForm.tsx:13`,
`CancelamentoNFe.tsx:19`, `InutilizacaoNFe.tsx:24`). O problema é a **documentação** classificar
isso como produção, e a UI não sinalizar ao usuário.

Outro caso: `supabase/functions/open-finance/index.ts:148` —
`// For now, return a simulated list of major Brazilian banks`, com
`OPEN_FINANCE_BASE_URL` defaultando para `.../sandbox`.

---

## 10. Testes (estático — nada foi executado)

| Métrica | Valor |
|---|---:|
| Arquivos `*.test.*` / `*.spec.*` em `src/` | 202 |
| Casos `it()` / `test()` | **2.252** |
| Blocos `describe()` | 574 |
| `.skip` / `.only` / `xit` / `xdescribe` | **0** |
| Specs E2E (`e2e/`, `e2e-tests/`) | 26 |
| Testes Deno em `supabase/tests/` | **0 arquivos** |

`.github/workflows/deno-tests.yml` existe e dispara em `push`/`pull_request` de qualquer branch, mas
`supabase/tests/` está vazio.

**Não verificado:** se algum teste é *teste-espelho* (reimplementa a lógica em vez de importar o alvo),
se há asserção vacuamente verdadeira, e se a suíte passa. Item 🟢 4 do plano.

---

## 11. CI — passos condicionados

`.github/workflows/ci.yml`, job `quality-gate`: 6 passos guardados por condição de secret.

| Linha | Condição |
|---:|---|
| 50 | `if: ${{ env.DATABASE_URL != '' }}` |
| 65 | `if: ${{ env.DATABASE_URL != '' }}` |
| 84 | `if: ${{ env.DATABASE_URL != '' }}` |
| 102 | `if: ${{ env.SUPABASE_URL != '' && env.SUPABASE_SERVICE_ROLE_KEY != '' && env.E2E_USER_EMAIL != '' }}` |
| 120 | `if: ${{ env.DATABASE_URL != '' }}` |
| 127 | `if: ${{ env.DATABASE_URL != '' && always() }}` |

Se os secrets não existirem, esses passos são **pulados silenciosamente** e o job fica verde.

`supabase-linter.yml` tem filtro de `paths` (`supabase/migrations/**`, `supabase/functions/**`):
mudanças apenas em `src/` **não disparam** esse gate — comportamento provavelmente intencional, mas
registrado.

**`NAO_VERIFICADO`:** a conclusão real dos checks. Sem acesso ao histórico do GitHub Actions.

---

## 12. Dimensionamento do repositório

| Escopo | Arquivos | Linhas |
|---|---:|---:|
| `src/components/` | 839 | 130.717 |
| `src/lib/` | 377 | 46.877 |
| `src/hooks/` | 267 | 38.887 |
| `src/pages/` | 207 | 36.717 |
| `src/integrations/` | 3 | 21.523 *(21.357 só em `types.ts`)* |
| `src/test/` | 24 | 2.302 |
| `src/types/` | 15 | 687 |
| `src/contexts/` | 2 | 208 |
| **`src/` total** | **1.739** | **278.451** |
| `supabase/functions/` | 102 fn | 32.910 |
| `supabase/migrations/` | 523 | 38.280 |

| Objeto | Repo | Banco vivo |
|---|---:|---:|
| Tabelas | 254 declaradas · 279 tipadas | **242** |
| Views | 34 declaradas · 25 tipadas | **18** (+1 matview) |
| Funções | 216 declaradas · 97 tipadas | **141** (105 fora de `pg_trgm`) |
| Rotas | **129** | — |
| Policies RLS | — | **455** |
| Triggers | — | **80** |
| Cron jobs | 16 declarados | **0** |
| Storage buckets | 5 esperados | **1** |

---

## 13. Reprodutibilidade

Comandos e consultas usados, para que qualquer pessoa reproduza os números.

**Repositório:**
```bash
# rotas
grep -oP 'path="[^"]*"' src/App.tsx | sed 's/path="//; s/"//' | sort -u | wc -l

# tabelas tipadas (seção Tables de types.ts: linhas 10–18822)
sed -n '10,18822p' src/integrations/supabase/types.ts \
  | grep -oP '^      [a-z0-9_]+: \{$' | tr -d ' {:' | sort -u

# RPCs chamadas
grep -rhoP "\.rpc\(\s*['\"][a-z0-9_]+" src supabase/functions | sed "s/.*['\"]//" | sort -u

# edge functions invocadas
grep -rhoP "functions\.invoke\(\s*['\"][a-z0-9\-]+" src supabase e2e | sed "s/.*['\"]//" | sort -u

# crons declarados
grep -rh -A2 "cron.schedule" supabase/migrations | grep -oP "^\s*'[a-z0-9\-_]+'" | tr -d " '" | sort -u
```

**Banco (todas com `read_only: true`):**
```sql
-- inventário
select
 (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r') as tabelas,
 (select count(*) from pg_policies where schemaname='public')                 as policies,
 (select count(*) from cron.job)                                              as cron_jobs;

-- existência de um objeto (o teste que derrubou 2 falsos positivos)
select to_regclass('public.<nome>');

-- extensões
select extname, extversion from pg_extension order by 1;

-- buckets
select id, name, public, created_at from storage.buckets;

-- migrations aplicadas
select * from supabase_migrations.schema_migrations;
```

---

## 14. Garantia de não-alteração

Nenhum DDL, DML, migration ou deploy foi executado contra o banco. Todas as consultas usaram
`read_only: true`. As únicas escritas desta auditoria foram os dois arquivos Markdown
(`ESTADO_ATUAL.md` e este anexo), em branch própria (`claude/system-status-roadmap-f36r0o`).

Nenhum artefato de outro agente ou trilha foi editado — as divergências encontradas em `docs/` e
`.lovable/` viraram linha de relatório (`ESTADO_ATUAL.md §9`), não edição.
