-- Sprint 1 / Item 2: Implementação real de get_asaas_payment_stats e export_asaas_audit_csv

CREATE OR REPLACE FUNCTION public.get_asaas_payment_stats(p_empresa_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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
$function$;

REVOKE EXECUTE ON FUNCTION public.get_asaas_payment_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_asaas_payment_stats(uuid) TO authenticated, service_role;


CREATE OR REPLACE FUNCTION public.export_asaas_audit_csv(p_empresa_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_csv text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem exportar auditoria.';
  END IF;

  WITH linhas AS (
    SELECT
      to_char(a.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
      COALESCE(a.action, '')                     AS action,
      COALESCE(a.actor::text, '')                AS actor,
      COALESCE(a.asaas_payment_id::text, '')     AS payment_id,
      COALESCE(p.asaas_id, '')                   AS asaas_id,
      COALESCE(p.status, '')                     AS status,
      COALESCE(p.valor::text, '')                AS valor,
      -- Escape CSV (RFC 4180): duplica aspas e envolve em aspas
      '"' || replace(replace(COALESCE(a.details::text, '{}'), '"', '""'), E'\n', ' ') || '"' AS details
    FROM public.asaas_audit_trail a
    LEFT JOIN public.asaas_payments p ON p.id = a.asaas_payment_id
    WHERE p.empresa_id = p_empresa_id OR p.empresa_id IS NULL
    ORDER BY a.created_at DESC
    LIMIT 50000
  )
  SELECT
    'created_at,action,actor,payment_id,asaas_id,status,valor,details' || E'\n'
    || COALESCE(string_agg(
         created_at || ',' || action || ',' || actor || ',' ||
         payment_id || ',' || asaas_id || ',' || status || ',' ||
         valor || ',' || details,
         E'\n'
       ), '')
  INTO v_csv
  FROM linhas;

  RETURN v_csv;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.export_asaas_audit_csv(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.export_asaas_audit_csv(uuid) TO authenticated, service_role;

-- Auditoria
INSERT INTO public.audit_logs (table_name, action, details, user_email, created_at)
VALUES ('pg_proc', 'IMPLEMENT_STUB', 'Sprint 1/Item 2 — get_asaas_payment_stats + export_asaas_audit_csv', 'system', now());