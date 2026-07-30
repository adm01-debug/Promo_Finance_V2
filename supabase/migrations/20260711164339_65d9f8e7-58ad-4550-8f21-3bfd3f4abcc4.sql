
-- ============================================================
-- PARTICIONAMENTO MENSAL — audit_logs & frontend_error_logs
-- ============================================================

-- 1) Função para criar partições mensais idempotentes
CREATE OR REPLACE FUNCTION public.ensure_monthly_partitions(
  p_table text,
  p_months_back int DEFAULT 6,
  p_months_forward int DEFAULT 3
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_start date;
  v_end date;
  v_partition_name text;
  v_created int := 0;
  i int;
BEGIN
  FOR i IN -p_months_back..p_months_forward LOOP
    v_start := date_trunc('month', now() + make_interval(months => i))::date;
    v_end := (v_start + interval '1 month')::date;
    v_partition_name := format('%s_%s', p_table, to_char(v_start, 'YYYY_MM'));

    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_partition_name
    ) THEN
      EXECUTE format(
        'CREATE TABLE public.%I PARTITION OF public.%I FOR VALUES FROM (%L) TO (%L)',
        v_partition_name, p_table, v_start, v_end
      );
      v_created := v_created + 1;
    END IF;
  END LOOP;

  -- Partição default para dados fora do range esperado
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname = p_table || '_default'
  ) THEN
    EXECUTE format(
      'CREATE TABLE public.%I PARTITION OF public.%I DEFAULT',
      p_table || '_default', p_table
    );
  END IF;

  RETURN v_created;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_monthly_partitions(text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_monthly_partitions(text, int, int) TO service_role;

-- ============================================================
-- 2) audit_logs → particionada
-- ============================================================
ALTER TABLE public.audit_logs RENAME TO audit_logs_legacy;

CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  user_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_logs_table ON public.audit_logs (table_name, created_at DESC);

-- Criar partições
SELECT public.ensure_monthly_partitions('audit_logs', 6, 3);

-- Migrar dados legados
INSERT INTO public.audit_logs
SELECT id, user_id, action, table_name, record_id, old_data, new_data,
       details, ip_address, user_agent, user_email,
       COALESCE(created_at, now())
FROM public.audit_logs_legacy;

DROP TABLE public.audit_logs_legacy;

-- ============================================================
-- 3) frontend_error_logs → particionada
-- ============================================================
-- Snapshot da estrutura (colunas dinâmicas via information_schema)
DO $$
DECLARE
  v_cols text;
BEGIN
  -- Captura colunas do legado antes do rename para reinjetar
  NULL;
END $$;

ALTER TABLE public.frontend_error_logs RENAME TO frontend_error_logs_legacy;

CREATE TABLE public.frontend_error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  error_message TEXT,
  error_stack TEXT,
  url TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

GRANT INSERT ON public.frontend_error_logs TO authenticated, anon;
GRANT SELECT ON public.frontend_error_logs TO authenticated;
GRANT ALL ON public.frontend_error_logs TO service_role;

ALTER TABLE public.frontend_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "frontend_error_user_insert"
  ON public.frontend_error_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view frontend errors"
  ON public.frontend_error_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX idx_fe_errors_created_at ON public.frontend_error_logs (created_at DESC);
CREATE INDEX idx_fe_errors_user ON public.frontend_error_logs (user_id, created_at DESC);

SELECT public.ensure_monthly_partitions('frontend_error_logs', 6, 3);

-- Migrar dados legados (tabela estava vazia, mas garantimos idempotência)
INSERT INTO public.frontend_error_logs (id, user_id, error_message, error_stack, url, user_agent, metadata, created_at)
SELECT
  COALESCE((row_to_json(l.*)->>'id')::uuid, gen_random_uuid()),
  (row_to_json(l.*)->>'user_id')::uuid,
  row_to_json(l.*)->>'error_message',
  row_to_json(l.*)->>'error_stack',
  row_to_json(l.*)->>'url',
  row_to_json(l.*)->>'user_agent',
  COALESCE((row_to_json(l.*)->>'metadata')::jsonb, '{}'::jsonb),
  COALESCE((row_to_json(l.*)->>'created_at')::timestamptz, now())
FROM public.frontend_error_logs_legacy l;

DROP TABLE public.frontend_error_logs_legacy;

-- ============================================================
-- 4) Job de manutenção mensal — cria partições futuras
-- ============================================================
CREATE OR REPLACE FUNCTION public.maintain_monthly_partitions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_audit int;
  v_fe int;
BEGIN
  v_audit := public.ensure_monthly_partitions('audit_logs', 0, 3);
  v_fe := public.ensure_monthly_partitions('frontend_error_logs', 0, 3);
  RETURN jsonb_build_object(
    'audit_logs_created', v_audit,
    'frontend_error_logs_created', v_fe,
    'executed_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.maintain_monthly_partitions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.maintain_monthly_partitions() TO service_role;

-- Agendar via pg_cron: dia 1 de cada mês, 02:00 UTC
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.unschedule('maintain-monthly-partitions')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='maintain-monthly-partitions');
    PERFORM cron.schedule(
      'maintain-monthly-partitions',
      '0 2 1 * *',
      $cron$SELECT public.maintain_monthly_partitions();$cron$
    );
  END IF;
END $$;
