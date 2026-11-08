CREATE OR REPLACE FUNCTION public.get_asaas_payment_stats(p_empresa_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  -- Autorização: admin OU usuário vinculado à empresa
  IF NOT (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.empresa_id = p_empresa_id
        AND ue.ativo = true
    )
  ) THEN
    RAISE EXCEPTION 'Acesso negado: usuário sem vínculo com a empresa informada.';
  END IF;

  SELECT jsonb_build_object(
    'empresa_id',           p_empresa_id,
    'total_pagamentos',     COUNT(*),
    'total_pago',           COALESCE(SUM(CASE WHEN status IN ('RECEIVED','CONFIRMED','RECEIVED_IN_CASH') THEN valor ELSE 0 END), 0),
    'total_pendente',       COALESCE(SUM(CASE WHEN status IN ('PENDING','AWAITING_RISK_ANALYSIS') THEN valor ELSE 0 END), 0),
    'total_vencido',        COALESCE(SUM(CASE WHEN status = 'OVERDUE' THEN valor ELSE 0 END), 0),
    'total_cancelado',      COALESCE(SUM(CASE WHEN status IN ('DELETED','CANCELED') THEN valor ELSE 0 END), 0),
    'total_reembolsado',    COALESCE(SUM(CASE WHEN status IN ('REFUNDED','REFUND_REQUESTED') THEN valor ELSE 0 END), 0),
    'valor_liquido_recebido', COALESCE(SUM(CASE WHEN status IN ('RECEIVED','CONFIRMED','RECEIVED_IN_CASH') THEN COALESCE(valor_liquido, valor) ELSE 0 END), 0),
    'qtd_pago',             COUNT(*) FILTER (WHERE status IN ('RECEIVED','CONFIRMED','RECEIVED_IN_CASH')),
    'qtd_pendente',         COUNT(*) FILTER (WHERE status IN ('PENDING','AWAITING_RISK_ANALYSIS')),
    'qtd_vencido',          COUNT(*) FILTER (WHERE status = 'OVERDUE'),
    'qtd_cancelado',        COUNT(*) FILTER (WHERE status IN ('DELETED','CANCELED')),
    'ticket_medio_pago',    COALESCE(AVG(valor) FILTER (WHERE status IN ('RECEIVED','CONFIRMED','RECEIVED_IN_CASH')), 0),
    'proximo_vencimento',   MIN(data_vencimento) FILTER (WHERE status IN ('PENDING','AWAITING_RISK_ANALYSIS')),
    'ultimo_recebimento',   MAX(data_pagamento) FILTER (WHERE status IN ('RECEIVED','CONFIRMED','RECEIVED_IN_CASH')),
    'gerado_em',            now()
  )
  INTO v_result
  FROM public.asaas_payments
  WHERE empresa_id = p_empresa_id;

  RETURN COALESCE(v_result, jsonb_build_object(
    'empresa_id', p_empresa_id,
    'total_pagamentos', 0,
    'gerado_em', now()
  ));
END;
$function$
