# Auditoria de drift entre migrations e produção — 17/11/2026

Replay das 1034 migrations num Postgres local efêmero (`scripts/db/replay-migrations.sh`, PR #433) comparado, objeto por objeto, com o projeto canônico `bwwbeyolnnzppeuhgkcd`.

## Resumo

| medida | replay (migrations) | produção |
| --- | --- | --- |
| migrations no ledger | 1034 | 1034 |
| migrations aplicadas no replay | 1034 (0 falhas) | — |
| tabelas em `public` | 292 | 272 |

As 20 de diferença são exatamente as tabelas-resíduo do dump do Lovable tratadas na PR #435. Removendo-as do lado do replay, os dois lados ficam com **272 tabelas e o mesmo conjunto de nomes** — nenhuma tabela existe num lado e falta no outro (as partições mensais de `audit_logs` e `frontend_error_logs` diferem só porque o replay é de hoje e cria 2026-11 a 2027-02, enquanto produção tem 2026-01 a 2026-10).

Mas o schema **não** é o mesmo: **188 das 272 tabelas têm colunas diferentes**.

## As três formas de drift

1. **Produção tem coluna que nenhuma migration declara** — 85 tabelas, 272 colunas. Foram criadas direto no banco, fora do histórico. Uma restauração a partir das migrations nasce sem elas.

2. **Migration declara coluna que produção não tem** — 65 tabelas, 475 colunas. A migration está no ledger como aplicada, mas o efeito não está no banco.

3. **Mesma coluna, tipo diferente** — 38 tabelas. Padrão: as migrations declaram `character varying(n)` e `numeric(p,s)` onde produção tem `text` e `numeric` sem precisão. Ex.: `categorias.cor` é `varchar(7)` no replay e `text` em produção; `ufs.aliquota_fcp` é `numeric(6,4)` no replay e `numeric` em produção — em produção não há limite de casas decimais na alíquota.

## O que já está quebrado em produção

Cruzando as colunas do grupo 2 com o código, há **39 escritas** (`insert`/`upsert`/`update`) em **13 tabelas** que miram coluna inexistente. Cada uma dessas chamadas falha no banco por inteiro; onde o `error` não é checado, falha em silêncio.

> **Correção de 17/11/2026, após a revisão da PR #437.** A primeira versão desta
> contagem dizia 45 escritas em 14 tabelas. Devin e Codex mostraram que 7 dos
> itens eram **chaves dentro de `details`/`payload`**, não colunas: `asaas_id`,
> `asaas_link_id`, `config`, `message`, `reason` e `transfer_id` em
> `asaas_audit_trail`, e `transacao` em `webhooks_log`. O detector de chaves de
> primeiro nível errou a contagem de profundidade. Essas 7 saíram da tabela.
>
> Ao reconferir caso a caso apareceu o inverso, um falso negativo: `payment_id`
> **é** de primeiro nível em 3 inserts de `asaas_audit_trail`, e a coluna real
> em produção é `asaas_payment_id`. Entrou na tabela abaixo; corrigido na PR #441.
>
> A revisão também expôs uma classe que esta auditoria não havia varrido:
> **filtros** (`.eq`/`.in`/...) sobre coluna inexistente, que fazem a consulta
> falhar igual a uma escrita. A varredura posterior achou 5:
> `asaas_sync_queue.payment_id` (corrigido na #441),
> `transacoes_bancarias.empresa_id` (3 locais; a tabela não tem essa coluna e o
> escopo por empresa passa por `conta_bancaria_id`), `clientes.bitrix_id`,
> `empresas.ativa` (a coluna é `ativo`) e `sso_login_attempts.state`.

| tabela | coluna ausente | onde o código grava |
| --- | --- | --- |
| `asaas_audit_trail` | `payment_id` | `supabase/functions/asaas-webhook/index.ts:125` (insert), `asaas-proxy/index.ts:776,1075` (insert), `whatsapp-webhook/index.ts:135` (insert) |
| `saved_filter_subscriptions` | `horario_preferido` | `src/hooks/useSavedFilterSubscriptions.ts:128` (upsert) |
| `saved_filter_subscriptions` | `last_seen_at` | `src/hooks/useSavedFilterSubscriptions.ts:128` (upsert) |
| `saved_filter_subscriptions` | `next_dispatch_at` | `src/hooks/saved-filter-alerts/useEntitySavedFilterAlerts.ts:106` (update) |
| `saved_filter_subscriptions` | `notify_email` | `src/hooks/useSavedFilterSubscriptions.ts:128` (upsert) |
| `saved_filter_subscriptions` | `notify_inapp` | `src/hooks/useSavedFilterSubscriptions.ts:128` (upsert) |
| `saved_filter_subscriptions` | `notify_push` | `src/hooks/useSavedFilterSubscriptions.ts:128` (upsert) |
| `saved_filter_subscriptions` | `rate_limit_max` | `src/hooks/useSavedFilterSubscriptions.ts:128` (upsert) |
| `saved_filter_subscriptions` | `rate_limit_window_min` | `src/hooks/useSavedFilterSubscriptions.ts:128` (upsert) |
| `saved_filter_subscriptions` | `severidades_criticas` | `src/hooks/useSavedFilterSubscriptions.ts:128` (upsert) |
| `saved_filter_subscriptions` | `tipos_eventos_ativos` | `src/hooks/useSavedFilterSubscriptions.ts:128` (upsert) |
| `asaas_audit_trail` | `new_status` | `supabase/functions/asaas-webhook/index.ts:124` (insert) |
| `asaas_audit_trail` | `previous_status` | `supabase/functions/asaas-webhook/index.ts:124` (insert) |
| `asaas_audit_trail` | `user_id` | `supabase/functions/asaas-proxy/index.ts:1074` (insert) |
| `historico_cobranca_whatsapp` | `created_by` | `src/hooks/useWhatsAppCobrancaHistory.ts:38` (insert) |
| `historico_cobranca_whatsapp` | `enviado_em` | `src/hooks/useWhatsAppCobrancaHistory.ts:38` (insert) |
| `historico_cobranca_whatsapp` | `ia_proxima_acao` | `supabase/functions/whatsapp-ai-analyzer/index.ts:71` (update) |
| `historico_cobranca_whatsapp` | `ia_resumo` | `supabase/functions/whatsapp-ai-analyzer/index.ts:71` (update) |
| `sso_login_attempts` | `app_redirect` | `supabase/functions/sso-initiate/index.ts:123` (insert) |
| `sso_login_attempts` | `code_verifier_hash` | `supabase/functions/sso-initiate/index.ts:123` (insert) |
| `sso_login_attempts` | `duration_ms` | `supabase/functions/sso-logout/index.ts:69` (insert) |
| `sso_login_attempts` | `empresa_id` | `supabase/functions/sso-initiate/index.ts:123` (insert) |
| `anomalia_detection_runs` | `current_step` | `supabase/functions/detectar-anomalias-financeiras/index.ts:133` (update) |
| `anomalia_detection_runs` | `finished_at` | `supabase/functions/detectar-anomalias-financeiras/index.ts:85` (update) |
| `anomalia_detection_runs` | `started_at` | `supabase/functions/detectar-anomalias-financeiras/index.ts:133` (update) |
| `anomalia_detection_runs` | `step_index` | `supabase/functions/detectar-anomalias-financeiras/index.ts:133` (update) |
| `execucoes_cobranca` | `cliente_id` | `supabase/functions/processar-fila-cobrancas/index.ts:92` (insert) |
| `execucoes_cobranca` | `erro_mensagem` | `supabase/functions/processar-fila-cobrancas/index.ts:92` (insert) |
| `execucoes_cobranca` | `metadata` | `supabase/functions/whatsapp-webhook/index.ts:114` (update) |
| `fila_cobrancas` | `erro` | `supabase/functions/processar-fila-cobrancas/index.ts:123` (update) |
| `fila_cobrancas` | `erro_mensagem` | `supabase/functions/processar-fila-cobrancas/index.ts:108` (update) |
| `asaas_transfers` | `transaction_receipt_url` | `supabase/functions/asaas-proxy/index.ts:796` (update) |
| `asaas_transfers` | `user_id` | `supabase/functions/asaas-proxy/index.ts:758` (insert) |
| `resumos_executivos_semanais` | `destinatarios` | `supabase/functions/gerar-resumo-executivo-semanal/index.ts:266` (upsert) |
| `resumos_executivos_semanais` | `erro_envio` | `supabase/functions/gerar-resumo-executivo-semanal/index.ts:266` (upsert) |
| `profiles` | `phone` | `supabase/functions/processar-solicitacao-lgpd/index.ts:173` (update) |
| `solicitacoes_lgpd` | `atendida_por` | `supabase/functions/processar-solicitacao-lgpd/index.ts:194` (update) |
| `open_finance_consents` | `revoked_at` | `supabase/functions/open-finance/index.ts:527` (update) |
| `asaas_sync_queue` | `error_history` | `supabase/functions/asaas-proxy/index.ts:1160` (update) |

Amostra conferida contra produção com `information_schema.columns`: 16 de 16 ausentes. `SELECT notify_email FROM saved_filter_subscriptions` devolve `42703 column "notify_email" does not exist`.

### Impacto por funcionalidade

- **Assinatura de filtro salvo** (`src/hooks/useSavedFilterSubscriptions.ts:128`): o `upsert` grava 10 colunas e produção tem 2 delas. O botão "Assinatura ativada" não persiste nada.

- **LGPD — exclusão e anonimização** (`supabase/functions/processar-solicitacao-lgpd/index.ts:173,194`): o `update` de `profiles` grava `phone`, que não existe, e o fechamento da solicitação grava `atendida_por`, que também não existe. O pedido do titular não é anonimizado nem marcado como atendido.

- **Trilha de auditoria do Asaas** (`supabase/functions/asaas-webhook/index.ts:124`): o `insert` usa `payment_id`, `previous_status` e `new_status`; produção tem `asaas_payment_id`, `action`, `actor`, `details`. Nenhum evento de webhook do Asaas é registrado, e o erro é descartado.

- **Progresso da detecção de anomalias** (`supabase/functions/detectar-anomalias-financeiras/index.ts:85,133`): `started_at`, `finished_at`, `current_step` e `step_index` não existem — a barra de progresso da tela nunca avança.

- **Fila e histórico de cobrança** (`processar-fila-cobrancas`, `whatsapp-ai-analyzer`, `whatsapp-webhook`): `erro_mensagem`, `cliente_id`, `enviado_em`, `ia_resumo`, `ia_proxima_acao` ausentes — a falha de envio não é gravada e a análise de IA da conversa não é salva.

## Por que o ledger não pegou isso

`supabase_migrations.schema_migrations` registra a versão, não o resultado. As 1034 versões do repositório estão lá, inclusive as 16 que criam as tabelas-resíduo e as que adicionam as 475 colunas. O banco atual veio do dump do Lovable com o ledger preenchido por cima, então "aplicada" nunca significou "efeito presente".

## Ordem de correção proposta

1. ~~Adicionar as colunas do grupo 2 que o código grava~~ — feito na PR #440: 25 colunas em 10 tabelas, mais a `UNIQUE (empresa_id, semana_inicio)` de `resumos_executivos_semanais`. Ficaram de fora, de propósito, `saved_filter_subscriptions` (produção tem outro desenho da tabela, precisa de convergência de constraint) e os nomes errados de coluna, corrigidos na PR #441.

2. Versionar as colunas do grupo 1 (as 272 que só existem no banco), para a restauração não perdê-las.

3. Alinhar os tipos do grupo 3, decidindo caso a caso se vale o `ALTER TYPE`.


Dados brutos desta auditoria ficaram no container da sessão; o que importa para reproduzir está no comando do replay e nas consultas citadas.
