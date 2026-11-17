-- Versiona `vw_webhooks_recentes`: a view existe em PRODUÇÃO, é usada pelo
-- código e NÃO é criada por nenhuma migration.
--
-- Como foi encontrada. Rodei o harness da #433
-- (`bash scripts/db/replay-migrations.sh`) num Postgres 16 local, do zero, sobre
-- esta árvore: `aplicados=1045 falharam=0 total=1045`. Depois comparei o
-- `information_schema.tables` do banco replicado com o de produção, objeto por
-- objeto. Produção: 293. Replay: 297. No conjunto "só em produção" apareceram
-- as 8 partições mensais (criadas por rotina, esperado) e esta view.
--
-- Por que importa. `src/hooks/useExtratoWebhooks.ts:60` faz
-- `supabase.from('vw_webhooks_recentes').select('*')`. Em produção funciona,
-- porque a view foi criada fora do versionamento. Em QUALQUER banco
-- reconstruído pelas migrations — replay, preview branch do Supabase, ambiente
-- novo — a view não existe e o PostgREST responde 42P01: a tela de webhooks do
-- extrato fica vazia, sem erro visível. Era o único objeto nessa situação.
--
-- A definição abaixo é a de produção, obtida com
-- `pg_get_viewdef('public.vw_webhooks_recentes'::regclass, true)`, e as opções
-- também (`reloptions` = `{security_invoker=true}`, exigido pelo AGENTS §4).
-- Logo esta migration é no-op em produção: `CREATE OR REPLACE VIEW` com o mesmo
-- corpo e as mesmas colunas, na mesma ordem.
--
-- `webhooks_log` tem RLS e a view usa `security_invoker`, então quem consulta
-- continua sujeito às policies da tabela base — não há elevação de acesso aqui.

CREATE OR REPLACE VIEW public.vw_webhooks_recentes AS
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

ALTER VIEW public.vw_webhooks_recentes SET (security_invoker = true);
