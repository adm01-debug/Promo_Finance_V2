CREATE OR REPLACE FUNCTION public.marcar_contas_vencidas()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_pagar_venc int; v_pagar_volta int; v_receber_venc int; v_receber_volta int;
BEGIN
  UPDATE public.contas_pagar SET status = 'vencido'
   WHERE status = 'pendente' AND data_vencimento < v_hoje AND deleted_at IS NULL;
  GET DIAGNOSTICS v_pagar_venc = ROW_COUNT;
  UPDATE public.contas_pagar SET status = 'pendente'
   WHERE status = 'vencido' AND data_vencimento >= v_hoje AND deleted_at IS NULL;
  GET DIAGNOSTICS v_pagar_volta = ROW_COUNT;
  -- ALTERADO 2: 'atrasado' entra na normalizacao do lado a receber.
  -- O trigger update_contas_receber_status (001_create_tables.sql:220-226,286-288)
  -- grava 'atrasado' em qualquer insert/update de linha pendente com data
  -- passada, e a constraint vigente (20260924193300:17-20) aceita esse valor.
  -- Como o UPDATE original selecionava so 'pendente', essas linhas nunca
  -- chegariam a 'vencido' e ficariam fora de todo KPI que filtra por ele.
  -- Em PRODUCAO isso e no-op: conferido, o trigger NAO existe lá (os unicos
  -- triggers de contas_receber sao set_updated_at_* e trg_anexos_sync_empresa,
  -- este AFTER UPDATE OF empresa_id) e ha 0 linhas 'atrasado'. A mudanca serve
  -- a ambiente novo criado a partir da cadeia, onde o trigger existe.
  UPDATE public.contas_receber SET status = 'vencido'
   WHERE status IN ('pendente', 'atrasado') AND data_vencimento < v_hoje AND deleted_at IS NULL;
  GET DIAGNOSTICS v_receber_venc = ROW_COUNT;
  UPDATE public.contas_receber SET status = 'pendente'
   WHERE status = 'vencido' AND data_vencimento >= v_hoje AND deleted_at IS NULL;
  GET DIAGNOSTICS v_receber_volta = ROW_COUNT;
  RETURN jsonb_build_object('data_ref', v_hoje,
    'pagar_vencidas', v_pagar_venc, 'pagar_reabertas', v_pagar_volta,
    'receber_vencidas', v_receber_venc, 'receber_reabertas', v_receber_volta);
END;
$function$
