-- 1) Escopar políticas baseadas em has_role para o papel authenticated.
DO $$
DECLARE
  r RECORD;
  v_cmd TEXT;
  v_using TEXT;
  v_check TEXT;
  v_sql TEXT;
  v_count INT := 0;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl,
           p.polname AS pol,
           p.polcmd,
           pg_get_expr(p.polqual, p.polrelid)      AS qual,
           pg_get_expr(p.polwithcheck, p.polrelid) AS wcheck
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND p.polroles = '{0}'::oid[]            -- TO public
      AND p.polpermissive                       -- somente permissivas
      AND (coalesce(pg_get_expr(p.polqual, p.polrelid), '')
           || coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '')) LIKE '%has_role%'
  LOOP
    v_cmd := CASE r.polcmd
               WHEN 'r' THEN 'SELECT'
               WHEN 'a' THEN 'INSERT'
               WHEN 'w' THEN 'UPDATE'
               WHEN 'd' THEN 'DELETE'
               ELSE 'ALL'
             END;

    v_using := CASE WHEN r.qual IS NOT NULL AND v_cmd <> 'INSERT'
                    THEN format(' USING (%s)', r.qual) ELSE '' END;
    v_check := CASE WHEN r.wcheck IS NOT NULL AND v_cmd IN ('INSERT', 'UPDATE', 'ALL')
                    THEN format(' WITH CHECK (%s)', r.wcheck) ELSE '' END;

    v_sql := format('DROP POLICY %I ON public.%I', r.pol, r.tbl);
    EXECUTE v_sql;

    v_sql := format('CREATE POLICY %I ON public.%I AS PERMISSIVE FOR %s TO authenticated%s%s',
                    r.pol, r.tbl, v_cmd, v_using, v_check);
    EXECUTE v_sql;

    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Politicas reescopadas para authenticated: %', v_count;
END $$;

-- 2) Agregacao de erros de frontend por assinatura (somente admin).
CREATE OR REPLACE FUNCTION public.get_frontend_error_groups(
  p_desde TIMESTAMPTZ DEFAULT (now() - INTERVAL '7 days'),
  p_severity TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  assinatura TEXT,
  exemplo_mensagem TEXT,
  severity TEXT,
  ocorrencias BIGINT,
  usuarios_afetados BIGINT,
  urls_distintas BIGINT,
  primeira_ocorrencia TIMESTAMPTZ,
  ultima_ocorrencia TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    left(regexp_replace(
           regexp_replace(fel.error_message, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '<uuid>', 'gi'),
           '\d+', '<n>', 'g'), 200) AS assinatura,
    (array_agg(fel.error_message ORDER BY fel.created_at DESC))[1] AS exemplo_mensagem,
    (array_agg(fel.severity ORDER BY fel.created_at DESC))[1] AS severity,
    count(*) AS ocorrencias,
    count(DISTINCT fel.user_id) AS usuarios_afetados,
    count(DISTINCT fel.url) AS urls_distintas,
    min(fel.created_at) AS primeira_ocorrencia,
    max(fel.created_at) AS ultima_ocorrencia
  FROM public.frontend_error_logs fel
  WHERE fel.created_at >= p_desde
    AND (p_severity IS NULL OR fel.severity = p_severity)
  GROUP BY 1
  ORDER BY count(*) DESC
  LIMIT greatest(1, least(coalesce(p_limit, 50), 200));
END $$;

REVOKE ALL ON FUNCTION public.get_frontend_error_groups(TIMESTAMPTZ, TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_frontend_error_groups(TIMESTAMPTZ, TEXT, INT) TO authenticated;

-- 3) Detalhe das ocorrencias de uma assinatura (somente admin).
CREATE OR REPLACE FUNCTION public.get_frontend_error_occurrences(
  p_assinatura TEXT,
  p_desde TIMESTAMPTZ DEFAULT (now() - INTERVAL '7 days'),
  p_limit INT DEFAULT 25
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  severity TEXT,
  error_message TEXT,
  error_stack TEXT,
  url TEXT,
  user_agent TEXT,
  user_id UUID,
  metadata JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT fel.id, fel.created_at, fel.severity, fel.error_message, fel.error_stack,
         fel.url, fel.user_agent, fel.user_id, fel.metadata
  FROM public.frontend_error_logs fel
  WHERE fel.created_at >= p_desde
    AND left(regexp_replace(
              regexp_replace(fel.error_message, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '<uuid>', 'gi'),
              '\d+', '<n>', 'g'), 200) = p_assinatura
  ORDER BY fel.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 25), 100));
END $$;

REVOKE ALL ON FUNCTION public.get_frontend_error_occurrences(TEXT, TIMESTAMPTZ, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_frontend_error_occurrences(TEXT, TIMESTAMPTZ, INT) TO authenticated;