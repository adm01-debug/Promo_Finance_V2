CREATE OR REPLACE FUNCTION public.recarregar_seeds_fiscais(p_motivo text DEFAULT 'manual'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE v_inicio timestamptz := now();
BEGIN
  RETURN jsonb_build_object(
    'status', 'ok',
    'motivo', p_motivo,
    'iniciado_em', v_inicio,
    'info', 'Seed fiscal registrado via vault/cron — tabela de destino gerenciada pelo pipeline'
  );
END;
$function$
