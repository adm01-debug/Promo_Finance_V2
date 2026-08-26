-- 20260827100000_reconciliar_views_rpcs_indices_sem_drop.sql
-- Reconcilia relações legítimas ausentes, RPCs legítimas e índices de tenant
-- sem DROP de tabelas/colunas e sem tocar no escopo Lalamove.

-- ============================================================
-- 1) Relações legítimas ausentes
-- ============================================================

-- O destino legado possui esta view sem `regime_tributario`. A coluna é
-- anexada ao final para que CREATE OR REPLACE preserve as posições existentes
-- e não exija DROP da view consumida pelo frontend.
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vw_tributario_dashboard'
      AND column_name = 'regime_tributario'
  ) THEN
    EXECUTE $view$
      CREATE OR REPLACE VIEW public.vw_tributario_dashboard
      WITH (security_invoker = true) AS
      SELECT
        e.id AS empresa_id,
        e.razao_social,
        at_.ano,
        at_.mes,
        at_.competencia,
        COALESCE(at_.total_geral, 0) AS total_tributos,
        COALESCE(at_.total_tributos_novos, 0) AS tributos_novos,
        COALESCE(at_.total_tributos_residuais, 0) AS tributos_residuais,
        COALESCE(at_.cbs_a_pagar, 0) AS cbs,
        COALESCE(at_.ibs_a_pagar, 0) AS ibs,
        COALESCE(at_.is_a_pagar, 0) AS imposto_seletivo,
        at_.status AS status_apuracao,
        COALESCE(rt.regime_nome, 'nao_informado') AS regime_tributario
      FROM public.empresas e
      JOIN public.apuracoes_tributarias at_ ON at_.empresa_id = e.id
      LEFT JOIN LATERAL (
        SELECT r.regime_nome
        FROM public.regimes_tributarios r
        WHERE r.empresa_id = e.id
          AND COALESCE(r.ativo, true)
        ORDER BY r.data_inicio DESC NULLS LAST
        LIMIT 1
      ) rt ON true
    $view$;
  END IF;
END;
$do$;

GRANT SELECT ON public.vw_tributario_dashboard TO authenticated, service_role;

DO $$
BEGIN
  IF to_regclass('public.mv_benchmark_setorial') IS NULL THEN
    EXECUTE $sql$
      CREATE MATERIALIZED VIEW public.mv_benchmark_setorial AS
       WITH carga AS (
               SELECT vw_tributario_dashboard.regime_tributario AS regime,
                  vw_tributario_dashboard.empresa_id,
                  sum(vw_tributario_dashboard.total_tributos) AS total_12m
                 FROM public.vw_tributario_dashboard
                WHERE ((vw_tributario_dashboard.ano IS NOT NULL) AND (vw_tributario_dashboard.mes IS NOT NULL) AND (((vw_tributario_dashboard.ano * 12) + vw_tributario_dashboard.mes) >= ((((EXTRACT(year FROM CURRENT_DATE))::integer * 12) + (EXTRACT(month FROM CURRENT_DATE))::integer) - 12)))
                GROUP BY vw_tributario_dashboard.regime_tributario, vw_tributario_dashboard.empresa_id
              )
       SELECT regime,
          count(*) AS amostra,
          percentile_cont((0.25)::double precision) WITHIN GROUP (ORDER BY ((total_12m)::double precision)) AS p25,
          percentile_cont((0.5)::double precision) WITHIN GROUP (ORDER BY ((total_12m)::double precision)) AS mediana,
          percentile_cont((0.75)::double precision) WITHIN GROUP (ORDER BY ((total_12m)::double precision)) AS p75,
          avg(total_12m) AS media,
          now() AS atualizado_em
         FROM carga
        GROUP BY regime
        WITH NO DATA
    $sql$;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'mv_benchmark_setorial'
      AND c.relkind = 'm'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_benchmark_regime ON public.mv_benchmark_setorial(regime)';
    EXECUTE 'REVOKE ALL ON public.mv_benchmark_setorial FROM anon, authenticated';
    EXECUTE 'GRANT SELECT ON public.mv_benchmark_setorial TO service_role';
  END IF;
END;
$$;

CREATE OR REPLACE VIEW public.vw_auditoria_tributaria_recente WITH (security_invoker='true') AS
 SELECT a.id,
    a.empresa_id,
    e.razao_social AS empresa_nome,
    a.user_id,
    p.full_name AS user_nome,
    a.user_email,
    a.acao,
    a.entidade_tipo,
    a.entidade_id,
    a.payload_anterior,
    a.payload_novo,
    a.criado_em
   FROM ((public.auditoria_tributaria a
     LEFT JOIN public.empresas e ON ((e.id = a.empresa_id)))
     LEFT JOIN public.profiles p ON ((p.user_id = a.user_id)))
  ORDER BY a.criado_em DESC
 LIMIT 500;

GRANT SELECT ON public.vw_auditoria_tributaria_recente TO authenticated;
GRANT SELECT ON public.vw_auditoria_tributaria_recente TO service_role;

CREATE OR REPLACE VIEW public.vw_transferencias_painel WITH (security_invoker='true') AS
 SELECT t.id,
    t.empresa_id,
    e.razao_social,
    t.asaas_id,
    t.valor,
    t.status,
    t.tipo_chave,
        CASE
            WHEN public.pode_ver_dado_sensivel() THEN t.chave_pix
            ELSE public.mascarar_chave_pix(t.chave_pix)
        END AS chave_pix,
    t.descricao,
    t.created_at,
    t.updated_at
   FROM (public.asaas_transfers t
     LEFT JOIN public.empresas e ON ((e.id = t.empresa_id)));

GRANT SELECT ON public.vw_transferencias_painel TO authenticated;
GRANT SELECT ON public.vw_transferencias_painel TO service_role;

-- ============================================================
-- 2) RPCs legítimas
-- ============================================================

CREATE OR REPLACE FUNCTION public.calcular_potencial_elisao(p_empresa_id uuid) RETURNS TABLE(tipo_oportunidade text, descricao text, valor_estimado numeric, ncm_relacionado text)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT 'oportunidade_elisao'::TEXT,
         COALESCE(o.categoria, o.estrategia),
         o.economia_estimada,
         NULL::TEXT
  FROM public.oportunidades_elisao o
  WHERE o.empresa_id = p_empresa_id
    AND o.aplicavel
    AND o.status <> 'descartada'
  UNION ALL
  SELECT 'credito_tributario'::TEXT,
         COALESCE(c.metodologia_aplicada, 'Crédito identificado em auditoria'),
         c.valor_credito_calculado,
         c.ncm
  FROM public.elisao_creditos_auditoria c
  WHERE c.empresa_id = p_empresa_id
    AND c.status_aprovacao = 'aprovado';
$$;

REVOKE ALL ON FUNCTION public.calcular_potencial_elisao(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calcular_potencial_elisao(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calcular_potencial_elisao(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.gate_34_indices_nao_utilizados(_min_dias integer DEFAULT 30) RETURNS TABLE(tabela text, indice text, dias_observados integer, tamanho_kb bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
  WITH janela AS (
    SELECT index_name,
           max(table_name)  AS table_name,
           max(idx_scan)    AS scans_max,
           min(idx_scan)    AS scans_min,
           max(size_bytes)  AS size_bytes,
           bool_or(is_unique OR is_primary) AS protegido,
           (max(snapshot_date) - min(snapshot_date))::int AS dias
    FROM public.index_usage_snapshots
    WHERE snapshot_date >= CURRENT_DATE - (_min_dias * 2)
    GROUP BY index_name
  )
  SELECT j.table_name,
         j.index_name,
         j.dias,
         (j.size_bytes / 1024)::bigint
  FROM janela j
  WHERE NOT j.protegido
    AND j.dias >= _min_dias
    AND j.scans_max = 0
    AND j.scans_min = 0
    AND NOT EXISTS (
      SELECT 1 FROM public.indices_uso_excecoes e WHERE e.index_name = j.index_name
    )
    AND EXISTS (
      SELECT 1 FROM pg_indexes p
      WHERE p.schemaname = 'public' AND p.indexname = j.index_name
    )
$$;

REVOKE ALL ON FUNCTION public.gate_34_indices_nao_utilizados(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gate_34_indices_nao_utilizados(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.get_acessos_suspeitos(_horas integer DEFAULT 168, _somente_abertos boolean DEFAULT true) RETURNS SETOF public.acessos_suspeitos
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT s.* FROM public.acessos_suspeitos s
  WHERE public.has_role((SELECT auth.uid()), 'admin'::app_role)
    AND (s.empresa_id IS NULL OR public.empresa_acessivel(s.empresa_id))
    AND s.created_at >= now() - make_interval(hours => GREATEST(COALESCE(_horas, 168), 1))
    AND (NOT COALESCE(_somente_abertos, true) OR s.revisado_em IS NULL)
  ORDER BY (s.severidade = 'critical') DESC, s.created_at DESC
  LIMIT 500;
$$;

REVOKE ALL ON FUNCTION public.get_acessos_suspeitos(integer, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_acessos_suspeitos(integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_acessos_suspeitos(integer, boolean) TO service_role;

-- ============================================================
-- 3) Índices de tenant (somente tabelas legítimas apontadas pelo gate)
-- ============================================================

DO $$
DECLARE
  rec record;
  idx_name text;
BEGIN
  FOR rec IN
    SELECT c.relname AS tabela
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a
      ON a.attrelid = c.oid
     AND a.attname = 'empresa_id'
     AND a.attnum > 0
     AND NOT a.attisdropped
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity
      AND c.relname NOT IN (
        'active_tracking',
        'driver_approval_queue',
        'driver_evaluations',
        'driver_incidents',
        'driver_locations',
        'drivers',
        'lalamove_orders',
        'lalamove_status_history',
        'lalamove_stops',
        'lalamove_uapi_sessions',
        'tracking_events'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM pg_index i
        WHERE i.indrelid = c.oid
          AND i.indkey[0] = a.attnum
      )
    ORDER BY c.relname
  LOOP
    idx_name := format('idx_%s_empresa_id', rec.tabela);
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I USING btree (empresa_id)',
      idx_name,
      rec.tabela
    );
  END LOOP;
END;
$$;
