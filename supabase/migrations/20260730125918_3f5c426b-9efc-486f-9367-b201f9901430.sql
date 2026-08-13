CREATE OR REPLACE FUNCTION public.get_retencao_politicas_status()
RETURNS TABLE (
  tabela            text,
  coluna            text,
  dias              integer,
  filtro            text,
  motivo            text,
  ativo             boolean,
  isenta            boolean,
  tem_politica      boolean,
  total_linhas      bigint,
  linhas_vencidas   bigint,
  registro_mais_antigo timestamptz,
  atualizado_em     timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r            record;
  v_total      bigint;
  v_vencidas   bigint;
  v_antigo     timestamptz;
  v_where      text;
BEGIN
  -- Somente administradores enxergam a governança de retenção.
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado: requer papel admin';
  END IF;

  FOR r IN
    WITH log_like AS (
      SELECT c.relname::text AS tabela
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relkind = 'r'
         AND NOT EXISTS (            -- ignora partições filhas
           SELECT 1 FROM pg_inherits i WHERE i.inhrelid = c.oid
         )
         AND (
           c.relname ~ '(_log|_logs|_history|_snapshots|_events|_eventos|_attempts|_trail|_audit|_cache|_runs|_queue)$'
           OR c.relname ~ '^(historico_|auditoria_)'
           OR c.relname ~ 'telemetr'
         )
    )
    SELECT COALESCE(p.tabela, l.tabela)      AS tabela,
           p.coluna,
           p.dias,
           p.filtro,
           p.motivo,
           COALESCE(p.ativo, false)          AS ativo,
           (p.id IS NOT NULL AND p.dias IS NULL) AS isenta,
           (p.id IS NOT NULL)                AS tem_politica,
           p.updated_at
      FROM log_like l
      FULL OUTER JOIN public.retencao_politicas p ON p.tabela = l.tabela
  LOOP
    v_total    := NULL;
    v_vencidas := NULL;
    v_antigo   := NULL;

    -- A tabela pode ter sido removida sem que a política fosse limpa.
    IF to_regclass(format('public.%I', r.tabela)) IS NOT NULL THEN
      BEGIN
        EXECUTE format('SELECT count(*) FROM public.%I', r.tabela) INTO v_total;

        IF r.coluna IS NOT NULL
           AND EXISTS (
             SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = r.tabela
                AND column_name = r.coluna
           )
        THEN
          v_where := format('%I < now() - make_interval(days => %s)', r.coluna, COALESCE(r.dias, 0));
          IF r.filtro IS NOT NULL AND btrim(r.filtro) <> '' THEN
            v_where := v_where || ' AND (' || r.filtro || ')';
          END IF;

          IF r.dias IS NOT NULL THEN
            EXECUTE format('SELECT count(*) FROM public.%I WHERE %s', r.tabela, v_where)
              INTO v_vencidas;
          END IF;

          EXECUTE format('SELECT min(%I)::timestamptz FROM public.%I', r.coluna, r.tabela)
            INTO v_antigo;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- Métricas são best-effort: nunca derrubam o painel inteiro.
        v_total := NULL; v_vencidas := NULL; v_antigo := NULL;
      END;
    END IF;

    tabela               := r.tabela;
    coluna               := r.coluna;
    dias                 := r.dias;
    filtro               := r.filtro;
    motivo               := r.motivo;
    ativo                := r.ativo;
    isenta               := r.isenta;
    tem_politica         := r.tem_politica;
    total_linhas         := v_total;
    linhas_vencidas      := v_vencidas;
    registro_mais_antigo := v_antigo;
    atualizado_em        := r.updated_at;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.get_retencao_politicas_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_retencao_politicas_status() TO authenticated;