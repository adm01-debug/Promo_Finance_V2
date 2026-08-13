-- Gate #34: observação de índices ociosos
CREATE TABLE IF NOT EXISTS public.index_usage_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  schema_name text NOT NULL,
  table_name text NOT NULL,
  index_name text NOT NULL,
  idx_scan bigint NOT NULL DEFAULT 0,
  size_bytes bigint NOT NULL DEFAULT 0,
  is_unique boolean NOT NULL DEFAULT false,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT index_usage_snapshots_unico UNIQUE (snapshot_date, schema_name, index_name)
);

GRANT ALL ON public.index_usage_snapshots TO service_role;
ALTER TABLE public.index_usage_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Somente admins leem snapshots de índices"
  ON public.index_usage_snapshots FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_index_usage_snapshots_idx_date
  ON public.index_usage_snapshots (index_name, snapshot_date DESC);

CREATE TABLE IF NOT EXISTS public.indices_uso_excecoes (
  index_name text PRIMARY KEY,
  motivo text NOT NULL,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.indices_uso_excecoes TO service_role;
ALTER TABLE public.indices_uso_excecoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Somente admins gerenciam exceções de índice"
  ON public.indices_uso_excecoes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Captura diária do contador acumulado de scans por índice
CREATE OR REPLACE FUNCTION public.capture_index_usage_snapshot()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_linhas integer;
BEGIN
  INSERT INTO public.index_usage_snapshots (
    snapshot_date, schema_name, table_name, index_name,
    idx_scan, size_bytes, is_unique, is_primary
  )
  SELECT CURRENT_DATE,
         s.schemaname,
         s.relname,
         s.indexrelname,
         s.idx_scan,
         pg_relation_size(s.indexrelid),
         i.indisunique,
         i.indisprimary
  FROM pg_stat_user_indexes s
  JOIN pg_index i ON i.indexrelid = s.indexrelid
  WHERE s.schemaname = 'public'
  ON CONFLICT (snapshot_date, schema_name, index_name) DO UPDATE
    SET idx_scan = EXCLUDED.idx_scan,
        size_bytes = EXCLUDED.size_bytes;

  GET DIAGNOSTICS v_linhas = ROW_COUNT;

  DELETE FROM public.index_usage_snapshots
  WHERE snapshot_date < CURRENT_DATE - INTERVAL '180 days';

  RETURN v_linhas;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_index_usage_snapshot() FROM PUBLIC, anon, authenticated;

-- Gate: índices sem nenhuma leitura na janela observada
CREATE OR REPLACE FUNCTION public.gate_34_indices_nao_utilizados(_min_dias integer DEFAULT 30)
RETURNS TABLE(tabela text, indice text, dias_observados integer, tamanho_kb bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
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

-- Snapshot inicial + agendamento diário
SELECT public.capture_index_usage_snapshot();

SELECT cron.schedule(
  'capture-index-usage-daily',
  '20 4 * * *',
  $cron$SELECT public.capture_index_usage_snapshot();$cron$
);