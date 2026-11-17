-- reprocess_dlq nunca conseguia reprocessar um webhook com external_id.
--
-- A promocao ao DLQ (20260723124731:145-157) NAO apaga o registro original:
-- deixa `webhooks_log` com status 'dead' e `dlq_id` apontando para o item.
-- A versao anterior desta funcao INSERIA um segundo registro com o mesmo
-- (source, external_id), e o indice de idempotencia
--   ux_webhooks_log_source_external UNIQUE (source, external_id) WHERE external_id IS NOT NULL
-- (20260723124731:10-13) rejeitava a insercao. A excecao desfazia a transacao
-- inteira: o item continuava na DLQ, sem reagendamento, e o administrador so
-- via "duplicate key value violates unique constraint".
--
-- Agora a funcao REAGENDA o registro original (o mesmo estado que
-- webhook_replay grava: status 'pending', next_retry_at = now(), orcamento de
-- tentativas zerado, erro limpo, dlq_id solto) e so INSERE quando nao existe
-- registro original -- caso de item de DLQ importado sem par em webhooks_log.
-- O registro original e travado (`FOR UPDATE`) e o estado dele decide: em
-- 'success' o item da DLQ e resolvido SEM reexecutar (webhook_replay deixa o
-- item aberto, e reexecutar sobrescreveria um evento posterior); em
-- 'processing' a funcao recusa, para nao competir com o worker.
-- `FOR UPDATE` no item da DLQ impede que dois cliques no painel reagendem duas
-- vezes. O worker pega a linha por
--   status IN ('pending','retrying') AND next_retry_at <= now()
-- (webhook_dequeue_retries, 20260723124731:215-230).
--
-- Aplicado em producao antes deste arquivo (AGENTS.md secao 4).
CREATE OR REPLACE FUNCTION public.reprocess_dlq(p_dlq_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_dlq public.webhook_dlq%ROWTYPE;
  v_log_id UUID;
  v_log_status TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem reprocessar DLQ.';
  END IF;

  SELECT * INTO v_dlq
    FROM public.webhook_dlq
   WHERE id = p_dlq_id AND resolved_at IS NULL
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'DLQ item não encontrado ou já resolvido';
  END IF;

  -- 1) o registro original, achado pelo vinculo gravado na promocao
  SELECT id, status INTO v_log_id, v_log_status
    FROM public.webhooks_log
   WHERE dlq_id = p_dlq_id
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  -- 2) sem vinculo, cai na chave de idempotencia, que e o que o indice protege
  IF v_log_id IS NULL AND v_dlq.external_id IS NOT NULL THEN
    SELECT id, status INTO v_log_id, v_log_status
      FROM public.webhooks_log
     WHERE source = v_dlq.source AND external_id = v_dlq.external_id
     ORDER BY created_at DESC
     LIMIT 1
     FOR UPDATE;
  END IF;

  -- Evento JA CONCLUIDO por outro caminho: webhook_replay limpa `dlq_id` antes
  -- de olhar esse vinculo (20260723124731:187-200 -- o IF da 196 le o valor ja
  -- anulado), entao o item da DLQ fica aberto mesmo depois do sucesso.
  -- Reagendar aqui reexecutaria um evento
  -- concluido -- um PAYMENT_RECEIVED antigo sobrescreveria um REFUNDED
  -- posterior. Resolve so o item obsoleto e preserva o registro.
  IF v_log_status = 'success' THEN
    UPDATE public.webhook_dlq
       SET resolved_at = now(),
           resolved_by = auth.uid(),
           notes = concat_ws(
             ' | ',
             COALESCE(p_notes, notes),
             'evento ja concluido (webhooks_log.status=success): item resolvido sem reexecucao'
           )
     WHERE id = p_dlq_id;
    RETURN v_log_id;
  END IF;

  -- Em execucao agora: reiniciar competiria com o worker que o reservou.
  IF v_log_status = 'processing' THEN
    RAISE EXCEPTION 'Evento em processamento agora (webhooks_log %): aguarde o fim da tentativa atual.', v_log_id;
  END IF;

  IF v_log_id IS NOT NULL THEN
    UPDATE public.webhooks_log
       SET status        = 'pending',
           attempts      = 0,
           next_retry_at = now(),
           processed_at  = NULL,
           error_message = NULL,
           last_error_at = NULL,
           dlq_id        = NULL
     WHERE id = v_log_id;
  ELSE
    INSERT INTO public.webhooks_log (
      source, event_type, external_id, payload, status,
      attempts, next_retry_at
    ) VALUES (
      v_dlq.source, v_dlq.event_type, v_dlq.external_id, v_dlq.payload,
      'pending', 0, now()
    ) RETURNING id INTO v_log_id;
  END IF;

  UPDATE public.webhook_dlq
     SET resolved_at = now(),
         resolved_by = auth.uid(),
         notes = COALESCE(p_notes, notes)
   WHERE id = p_dlq_id;

  RETURN v_log_id;
END;
$function$

-- A liberacao para `authenticated` continua valendo (20261117052000): a funcao
-- e SECURITY DEFINER e checa `has_role(auth.uid(),'admin')` na primeira linha.
GRANT EXECUTE ON FUNCTION public.reprocess_dlq(uuid, text) TO authenticated
