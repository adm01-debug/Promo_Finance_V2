-- 1) Domínio 'nfe' estava fora do CHECK: check_nfe_xml_path_invariants falhava
--    silenciosamente (23514) sempre que encontrava uma inconsistência real.
ALTER TABLE public.integrity_alerts DROP CONSTRAINT IF EXISTS integrity_alerts_domain_check;
ALTER TABLE public.integrity_alerts
  ADD CONSTRAINT integrity_alerts_domain_check
  CHECK (domain = ANY (ARRAY['entrega','screening','financeiro','nfe','nfe_sefaz']));

-- 2) Rastreabilidade do encerramento
ALTER TABLE public.integrity_alerts
  ADD COLUMN IF NOT EXISTS resolved_reason text;

-- 3) close_stale_integrity_alerts com janela de carência (grace)
DROP FUNCTION IF EXISTS public.close_stale_integrity_alerts(timestamptz, text[]);

CREATE OR REPLACE FUNCTION public.close_stale_integrity_alerts(
  p_hour timestamptz,
  p_domains text[],
  p_grace interval DEFAULT interval '0'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_count integer := 0;
BEGIN
  IF p_hour IS NULL OR p_domains IS NULL OR array_length(p_domains, 1) IS NULL THEN
    RETURN 0;
  END IF;

  -- Um alerta representa um sintoma vivo. Se a rodada atual (p_hour) nao
  -- reproduziu o invariante, a inconsistencia foi corrigida: encerra.
  -- p_grace protege contra flapping quando uma rodada intermediaria falha
  -- ou nao executa: so encerra o que ja e mais antigo que a carencia.
  WITH fechados AS (
    UPDATE public.integrity_alerts a
    SET resolved_at = now(),
        resolved_reason = 'auto: invariante nao reproduzido em ' || p_hour::text
    WHERE a.resolved_at IS NULL
      AND a.domain = ANY (p_domains)
      AND a.alert_hour < (p_hour - p_grace)
      AND NOT EXISTS (
        SELECT 1 FROM public.integrity_alerts b
        WHERE b.domain = a.domain
          AND b.invariant = a.invariant
          AND b.alert_hour > (p_hour - p_grace)
      )
    RETURNING 1
  )
  SELECT count(*)::int INTO v_count FROM fechados;

  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.close_stale_integrity_alerts(timestamptz, text[], interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_stale_integrity_alerts(timestamptz, text[], interval) TO service_role;

-- 4) Ciclo completo: cada dominio encerra usando SUA hora de referencia.
--    Se um detector falhar, seus alertas NAO sao encerrados por engano.
CREATE OR REPLACE FUNCTION public.run_integrity_cycle()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_core   jsonb := '{}'::jsonb;
  v_nfe    jsonb := '{}'::jsonb;
  v_sefaz  jsonb := '{}'::jsonb;
  v_closed integer := 0;
  v_hour   timestamptz;
BEGIN
  -- Nucleo (entrega/screening/financeiro)
  BEGIN
    v_core := public.check_integrity_invariants();
  EXCEPTION WHEN OTHERS THEN
    v_core := jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
  END;

  IF COALESCE((v_core->>'success')::boolean, false) THEN
    v_hour := (v_core->>'alert_hour')::timestamptz;
    v_closed := v_closed + public.close_stale_integrity_alerts(
      v_hour, ARRAY['entrega','screening','financeiro'], interval '0'
    );
  END IF;

  -- NF-e (layout de xml_path)
  BEGIN
    v_nfe := public.check_nfe_xml_path_invariants();
  EXCEPTION WHEN OTHERS THEN
    v_nfe := jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
  END;

  IF COALESCE((v_nfe->>'success')::boolean, false) THEN
    v_closed := v_closed + public.close_stale_integrity_alerts(
      (v_nfe->>'alert_hour')::timestamptz, ARRAY['nfe'], interval '0'
    );
  END IF;

  -- SEFAZ DF-e: detectores olham janelas longas (7d / 6h), por isso usam
  -- carencia de 3h antes de encerrar — evita fechar/reabrir a cada hora.
  BEGIN
    v_sefaz := public.sefaz_run_observability_checks();
    v_closed := v_closed + public.close_stale_integrity_alerts(
      date_trunc('hour', now()), ARRAY['nfe_sefaz'], interval '3 hours'
    );
  EXCEPTION WHEN OTHERS THEN
    v_sefaz := jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
  END;

  RETURN COALESCE(v_core, '{}'::jsonb) || jsonb_build_object(
    'nfe_xml', v_nfe,
    'sefaz', v_sefaz,
    'alertas_encerrados', v_closed
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.run_integrity_cycle() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_integrity_cycle() TO service_role;