-- Função: enqueue_webhook_retry
-- Descrição: Registra falha em webhooks_log com backoff exponencial (1m, 5m, 30m).
--            Após 3 tentativas move o payload para webhook_dlq.
-- Segurança: SECURITY DEFINER
-- Grants: service_role
-- Última migration: 20260711153501

-- Ver migration 20260711153501 para corpo completo.
-- Uso em Edge Functions:
--   const { data } = await supabase.rpc('enqueue_webhook_retry', { ... });
