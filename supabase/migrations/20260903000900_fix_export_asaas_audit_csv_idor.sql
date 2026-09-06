-- Migration 20260903000900
-- PROBLEMA: export_asaas_audit_csv(p_empresa_id) valida apenas has_role('admin'),
-- mas não checa empresa_acessivel(p_empresa_id). Qualquer admin global pode passar
-- o UUID de qualquer empresa e exportar até 50k linhas do Asaas audit trail dela.
-- IDOR cross-tenant de alta severidade (dados financeiros + PIX completos).
-- FIX: adicionar empresa_acessivel(p_empresa_id) após o gate de admin.

BEGIN;

CREATE OR REPLACE FUNCTION public.export_asaas_audit_csv(p_empresa_id uuid)
  RETURNS text
  LANGUAGE plpgsql STABLE
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_csv text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem exportar auditoria.'
      USING ERRCODE = '42501';
  END IF;

  IF NOT public.empresa_acessivel(p_empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado: empresa não acessível para este usuário.'
      USING ERRCODE = '42501';
  END IF;

  WITH linhas AS (
    SELECT
      to_char(a.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
      COALESCE(a.action, '')                     AS action,
      COALESCE(a.actor::text, '')                AS actor,
      COALESCE(a.payment_id::text, '')     AS payment_id,
      COALESCE(p.asaas_id, '')                   AS asaas_id,
      COALESCE(p.status, '')                     AS status,
      COALESCE(p.valor::text, '')                AS valor,
      '"' || replace(replace(COALESCE(a.details::text, '{}'), '"', '""'), E'\n', ' ') || '"' AS details
    FROM public.asaas_audit_trail a
    LEFT JOIN public.asaas_payments p ON p.id = a.payment_id
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
$$;

COMMIT;
