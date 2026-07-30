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
  v_reg        regclass;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado: requer papel admin';
  END IF;

  FOR r IN
    WITH log_like AS (
      SELECT c.relname::text AS nome
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relkind = 'r'
         AND NOT EXISTS (SELECT 1 FROM pg_inherits i WHERE i.inhrelid = c.oid)
         AND (
           c.relname ~ '(_log|_logs|_history|_snapshots|_events|_eventos|_attempts|_trail|_audit|_cache|_runs|_queue)$'
           OR c.relname ~ '^(historico_|auditoria_)'
           OR c.relname ~ 'telemetr'
         )
    ),
    pol AS (
      -- Normaliza: as políticas gravam o nome qualificado ("public.x").
      SELECT p.*, split_part(p.tabela, '.', greatest(1, array_length(string_to_array(p.tabela, '.'), 1)))::text AS nome
        FROM public.retencao_politicas p
    )
    SELECT COALESCE(p.tabela, 'public.' || l.nome)   AS tabela,
           p.coluna,
           p.dias,
           p.filtro,
           p.motivo,
           COALESCE(p.ativo, false)                  AS ativo,
           (p.id IS NOT NULL AND p.dias IS NULL)     AS isenta,
           (p.id IS NOT NULL)                        AS tem_politica,
           p.updated_at,
           COALESCE(p.nome, l.nome)                  AS nome
      FROM log_like l
      FULL OUTER JOIN pol p ON p.nome = l.nome
  LOOP
    v_total := NULL; v_vencidas := NULL; v_antigo := NULL;
    v_reg := to_regclass(format('public.%I', r.nome));

    IF v_reg IS NOT NULL THEN
      BEGIN
        EXECUTE format('SELECT count(*) FROM public.%I', r.nome) INTO v_total;

        IF r.coluna IS NOT NULL
           AND EXISTS (
             SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = r.nome AND column_name = r.coluna
           )
        THEN
          EXECUTE format('SELECT min(%I)::timestamptz FROM public.%I', r.coluna, r.nome)
            INTO v_antigo;

          IF r.dias IS NOT NULL THEN
            v_where := format('%I < now() - make_interval(days => %s)', r.coluna, r.dias);
            IF r.filtro IS NOT NULL AND btrim(r.filtro) <> '' THEN
              v_where := v_where || ' AND (' || r.filtro || ')';
            END IF;
            EXECUTE format('SELECT count(*) FROM public.%I WHERE %s', r.nome, v_where)
              INTO v_vencidas;
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
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