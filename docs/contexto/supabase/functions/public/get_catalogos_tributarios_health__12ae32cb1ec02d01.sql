CREATE OR REPLACE FUNCTION public.get_catalogos_tributarios_health()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_achados jsonb := '[]'::jsonb;
  v_criticos integer := 0;
  v_avisos integer := 0;
  v_infos integer := 0;
  v_ultima timestamptz;
  v_auto_24h integer;
  v_abertos integer;
  v_registro jsonb;
  v_invariante text;
  v_severidade text;
  v_afetados bigint;
  v_detalhe text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado: requer papel admin' USING ERRCODE = '42501';
  END IF;

  FOR v_registro IN
    SELECT to_jsonb(c)
    FROM public.validar_catalogos_tributarios() c
  LOOP
    IF v_registro ? 'tabela' THEN
      -- Contrato compacto do banco canônico.
      IF upper(coalesce(v_registro->>'status', '')) = 'OK' THEN
        CONTINUE;
      END IF;

      v_invariante := 'catalogo_' || coalesce(v_registro->>'tabela', 'desconhecido')
                       || '_' || lower(coalesce(v_registro->>'status', 'desconhecido'));
      v_severidade := CASE
        WHEN upper(coalesce(v_registro->>'status', '')) IN ('VAZIO', 'INCOMPLETO')
          THEN 'critical'
        ELSE 'warning'
      END;
      v_afetados := CASE
        WHEN v_registro->>'tabela' = 'ufs'
         AND upper(coalesce(v_registro->>'status', '')) = 'INCOMPLETO'
          THEN greatest(27 - coalesce((v_registro->>'registros')::bigint, 0), 1)
        ELSE greatest(coalesce((v_registro->>'registros')::bigint, 0), 1)
      END;
      v_detalhe := format(
        'Catálogo %s com status %s (%s registro(s))',
        v_registro->>'tabela',
        v_registro->>'status',
        v_registro->>'registros'
      );
    ELSE
      -- Contrato detalhado ainda reproduzido pelo histórico de migrations.
      v_invariante := coalesce(v_registro->>'invariante', 'catalogo_desconhecido');
      v_severidade := lower(coalesce(v_registro->>'severidade', 'warning'));
      v_afetados := greatest(coalesce((v_registro->>'afetados')::bigint, 0), 1);
      v_detalhe := coalesce(v_registro->>'detalhe', 'Falha de catálogo sem detalhe');
    END IF;

    IF v_severidade = 'critical' THEN
      v_criticos := v_criticos + 1;
    ELSIF v_severidade = 'warning' THEN
      v_avisos := v_avisos + 1;
    ELSE
      v_infos := v_infos + 1;
    END IF;

    v_achados := v_achados || jsonb_build_array(jsonb_build_object(
      'invariante', v_invariante,
      'severidade', v_severidade,
      'afetados', v_afetados,
      'detalhe', v_detalhe
    ));
  END LOOP;

  SELECT max(alert_hour),
         count(*) FILTER (
           WHERE resolved_at >= now() - interval '24 hours'
             AND coalesce(resolved_reason, '') LIKE 'auto:%'
         )::integer,
         count(*) FILTER (WHERE resolved_at IS NULL)::integer
    INTO v_ultima, v_auto_24h, v_abertos
  FROM public.integrity_alerts
  WHERE domain = 'tributario';

  RETURN jsonb_build_object(
    'gerado_em', now(),
    'ultima_verificacao', v_ultima,
    'criticos', coalesce(v_criticos, 0),
    'avisos', coalesce(v_avisos, 0),
    'infos', coalesce(v_infos, 0),
    'auto_resolvidos_24h', coalesce(v_auto_24h, 0),
    'alertas_abertos', coalesce(v_abertos, 0),
    'saudavel', coalesce(v_criticos, 0) + coalesce(v_avisos, 0) = 0,
    'achados', v_achados
  );
END
$function$
