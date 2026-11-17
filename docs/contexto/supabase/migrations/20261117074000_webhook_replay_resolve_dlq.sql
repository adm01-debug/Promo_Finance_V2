-- webhook_replay: resolver o item da DLQ de verdade.
--
-- A função lia `v_row.dlq_id` DEPOIS do `UPDATE ... SET dlq_id = NULL
-- RETURNING * INTO v_row`, ou seja, sempre NULL: o bloco que marcava a DLQ
-- como resolvida nunca rodava. Resultado em produção: todo webhook
-- re-enfileirado por `webhook_replay` (chamado pela Edge Function
-- `webhook-replay`) deixava o item correspondente aberto na `webhook_dlq`
-- para sempre, inflando a fila de pendências que o operador vê.
--
-- Correção: o `dlq_id` é lido antes do update, com `FOR UPDATE` na linha do
-- log para que duas execuções simultâneas não resolvam o mesmo item duas
-- vezes, e o update da DLQ só alcança item ainda aberto (`resolved_at IS
-- NULL`), preservando quem resolveu antes.
--
-- Aplicada em produção via exec_sql e verificada em transação revertida:
--   antes: dlq.resolved_at = NULL
--   depois: dlq.resolved_at=2026-11-17 07:33:40+00 | log.status=pending
--           | log.dlq_id=NULL | notes contém "webhook_replay" | caminho sem DLQ intacto

CREATE OR REPLACE FUNCTION public.webhook_replay(p_id uuid)
 RETURNS webhooks_log
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.webhooks_log%ROWTYPE;
  v_dlq_id uuid;
BEGIN
  -- Guarda: só admin ou service_role (auth.uid() nulo).
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized: admin role required to replay webhooks';
  END IF;

  -- O dlq_id tem de ser lido ANTES do update: o `RETURNING *` devolve a linha
  -- nova, em que dlq_id acabou de virar NULL, de modo que o bloco seguinte
  -- nunca rodava e o item da DLQ ficava aberto para sempre.
  SELECT dlq_id INTO v_dlq_id
    FROM public.webhooks_log
   WHERE id = p_id
     FOR UPDATE;

  UPDATE public.webhooks_log
     SET status        = 'pending',
         next_retry_at = now(),
         attempts      = LEAST(attempts, max_attempts - 1),
         error_message = NULL,
         last_error_at = NULL,
         dlq_id        = NULL
   WHERE id = p_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'webhook % not found', p_id;
  END IF;

  -- Se veio de DLQ, marca DLQ como resolvido.
  IF v_dlq_id IS NOT NULL THEN
    UPDATE public.webhook_dlq
       SET resolved_at = now(),
           resolved_by = COALESCE(resolved_by, auth.uid()),
           notes = COALESCE(notes,'') || E'\nRe-enfileirado via webhook_replay em ' || now()::text
     WHERE id = v_dlq_id
       AND resolved_at IS NULL;
  END IF;

  RETURN v_row;
END;
$function$

-- Privilégios: espelham o estado real de produção, não a definição original.
-- `20260826050000_revoke_execute_authenticated_e09.sql:148` revogou `authenticated`
-- de propósito, e a Edge Function `webhook-replay` chama a RPC com service_role
-- (`webhook-replay/index.ts:43-85`), registrando quem pediu o replay. Repetir o
-- GRANT antigo reabriria a chamada direta por administrador autenticado, sem esse
-- registro (achado do Devin e do Codex na PR #418).
--
-- Conferido em produção: proacl de webhook_replay = {postgres=X, service_role=X}
-- — `CREATE OR REPLACE FUNCTION` não altera privilégios, então nada muda lá.
REVOKE EXECUTE ON FUNCTION public.webhook_replay(UUID) FROM PUBLIC, anon, authenticated

GRANT  EXECUTE ON FUNCTION public.webhook_replay(UUID) TO service_role
