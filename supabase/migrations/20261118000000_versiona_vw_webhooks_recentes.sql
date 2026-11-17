-- Recria `vw_webhooks_recentes` com a definição de produção e versiona o GRANT.
--
-- Sintoma. `src/hooks/useExtratoWebhooks.ts:60` faz
-- `supabase.from('vw_webhooks_recentes').select('*')`. Em produção funciona; num
-- banco reconstruído pelas migrations (replay, preview branch, ambiente novo) a
-- view NÃO existe e o PostgREST responde 42P01 — a tela de webhooks do extrato
-- fica vazia, sem erro visível.
--
-- Causa exata (não é "nenhuma migration cria"):
-- 20260825100000_reconciliar_schema_completo.sql:11539-11556 FAZ
-- `DROP VIEW ... CASCADE` e tenta recriar, selecionando
-- `id, source, event_type, status, payload, response, error_message, created_at`
-- dentro de um `DO $VBLOCK$ ... EXCEPTION WHEN undefined_column THEN NULL`.
-- No schema reconstruído, `webhooks_log` tem `last_response` e NÃO tem
-- `response` (conferido no banco do replay: ... last_response, max_attempts,
-- next_retry_at, origem, payload, processado ...). A criação levanta
-- `undefined_column`, o bloco engole o erro e a migration termina "com
-- sucesso" deixando a view inexistente. Produção tem `response`, então lá a
-- view foi criada — e depois substituída fora do versionamento pela versão com
-- os aliases que o app usa.
--
-- Como foi encontrado: `bash scripts/db/replay-migrations.sh` num Postgres 16
-- local (aplicados=1045 falharam=0 total=1045) e comparação de
-- `information_schema.tables` do banco replicado com produção, objeto por
-- objeto — 293 contra 297.
--
-- A definição abaixo é a de produção (`pg_get_viewdef`), com as mesmas colunas
-- na mesma ordem e `security_invoker = true` (AGENTS §4). É no-op em produção.
--
-- O GRANT também é versionado, e não é detalhe: no banco reconstruído a view
-- nasce só com privilégio de `postgres` (conferido no replay: `vw_dre_mensal`
-- só tem grants de postgres, embora o papel `authenticated` exista). Sem o
-- GRANT explícito, o consumidor continuaria sem acesso — agora por 42501 em vez
-- de 42P01. Em produção os dois papéis já têm SELECT, então aqui também é no-op.
--
-- `webhooks_log` tem RLS e a view usa `security_invoker`, então quem consulta
-- segue sujeito às policies da tabela base; o GRANT não eleva acesso a linha.

CREATE OR REPLACE VIEW public.vw_webhooks_recentes
WITH (security_invoker = true) AS
SELECT
  id,
  source AS endpoint,
  event_type AS evento,
  status AS status_code,
  created_at,
  error_message,
  attempts
FROM public.webhooks_log wl
ORDER BY created_at DESC
LIMIT 100;

GRANT SELECT ON public.vw_webhooks_recentes TO authenticated;
GRANT SELECT ON public.vw_webhooks_recentes TO service_role;
