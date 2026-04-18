-- ============================================
-- LOTE P9 — Auditoria tributária + Benchmark
-- ============================================

DO $$ BEGIN
  CREATE TYPE public.acao_auditoria_tributaria AS ENUM ('insert', 'update', 'delete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.auditoria_tributaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID,
  user_id UUID,
  user_email TEXT,
  acao public.acao_auditoria_tributaria NOT NULL,
  entidade_tipo TEXT NOT NULL,
  entidade_id TEXT,
  payload_anterior JSONB,
  payload_novo JSONB,
  ip_address TEXT,
  user_agent TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_trib_empresa ON public.auditoria_tributaria(empresa_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_trib_user ON public.auditoria_tributaria(user_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_trib_entidade ON public.auditoria_tributaria(entidade_tipo, entidade_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_trib_criado ON public.auditoria_tributaria(criado_em DESC);

ALTER TABLE public.auditoria_tributaria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auditoria_trib_admin_select" ON public.auditoria_tributaria;
CREATE POLICY "auditoria_trib_admin_select"
  ON public.auditoria_tributaria FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.fn_audit_tributario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id UUID;
  v_acao public.acao_auditoria_tributaria;
  v_user_email TEXT;
  v_new_json JSONB;
  v_old_json JSONB;
BEGIN
  v_new_json := CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END;
  v_old_json := CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END;

  IF TG_OP = 'INSERT' THEN
    v_acao := 'insert';
    v_empresa_id := (v_new_json->>'empresa_id')::uuid;
  ELSIF TG_OP = 'UPDATE' THEN
    v_acao := 'update';
    v_empresa_id := (v_new_json->>'empresa_id')::uuid;
  ELSE
    v_acao := 'delete';
    v_empresa_id := (v_old_json->>'empresa_id')::uuid;
  END IF;

  SELECT email INTO v_user_email FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.auditoria_tributaria (
    empresa_id, user_id, user_email, acao, entidade_tipo, entidade_id,
    payload_anterior, payload_novo
  ) VALUES (
    v_empresa_id,
    auth.uid(),
    v_user_email,
    v_acao,
    TG_TABLE_NAME,
    COALESCE((v_new_json->>'id'), (v_old_json->>'id')),
    v_old_json,
    v_new_json
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_apuracoes_tributarias ON public.apuracoes_tributarias;
CREATE TRIGGER trg_audit_apuracoes_tributarias
  AFTER INSERT OR UPDATE OR DELETE ON public.apuracoes_tributarias
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

DROP TRIGGER IF EXISTS trg_audit_regime_decision_cache ON public.regime_decision_cache;
CREATE TRIGGER trg_audit_regime_decision_cache
  AFTER INSERT OR UPDATE OR DELETE ON public.regime_decision_cache
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

DROP TRIGGER IF EXISTS trg_audit_verificacoes_conformidade ON public.verificacoes_conformidade;
CREATE TRIGGER trg_audit_verificacoes_conformidade
  AFTER INSERT OR UPDATE OR DELETE ON public.verificacoes_conformidade
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

DROP TRIGGER IF EXISTS trg_audit_relatorios_agendados ON public.relatorios_tributarios_agendados;
CREATE TRIGGER trg_audit_relatorios_agendados
  AFTER INSERT OR UPDATE OR DELETE ON public.relatorios_tributarios_agendados
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

CREATE OR REPLACE VIEW public.vw_auditoria_tributaria_recente
WITH (security_invoker = true)
AS
SELECT
  a.id,
  a.empresa_id,
  e.razao_social AS empresa_nome,
  a.user_id,
  COALESCE(p.full_name, a.user_email, 'Sistema') AS user_nome,
  a.user_email,
  a.acao,
  a.entidade_tipo,
  a.entidade_id,
  a.payload_anterior,
  a.payload_novo,
  a.criado_em
FROM public.auditoria_tributaria a
LEFT JOIN public.profiles p ON p.id = a.user_id
LEFT JOIN public.empresas e ON e.id = a.empresa_id
ORDER BY a.criado_em DESC
LIMIT 1000;

-- Benchmark agregado por regime tributário (única dim disponível na vw)
DROP MATERIALIZED VIEW IF EXISTS public.mv_benchmark_setorial CASCADE;

CREATE MATERIALIZED VIEW public.mv_benchmark_setorial AS
WITH carga AS (
  SELECT
    COALESCE(regime_tributario, 'nao_informado') AS regime,
    empresa_id,
    SUM(total_tributos)::numeric AS total_12m
  FROM public.vw_tributario_dashboard
  WHERE (ano * 12 + mes) >= (EXTRACT(YEAR FROM CURRENT_DATE)::int * 12 + EXTRACT(MONTH FROM CURRENT_DATE)::int - 12)
  GROUP BY regime_tributario, empresa_id
)
SELECT
  regime,
  COUNT(*) AS amostra,
  percentile_cont(0.25) WITHIN GROUP (ORDER BY total_12m) AS p25,
  percentile_cont(0.5)  WITHIN GROUP (ORDER BY total_12m) AS mediana,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY total_12m) AS p75,
  AVG(total_12m) AS media,
  now() AS atualizado_em
FROM carga
GROUP BY regime;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_benchmark_regime ON public.mv_benchmark_setorial(regime);

CREATE OR REPLACE FUNCTION public.refresh_mv_benchmark_setorial()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_benchmark_setorial;
EXCEPTION WHEN OTHERS THEN
  REFRESH MATERIALIZED VIEW public.mv_benchmark_setorial;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-benchmark-setorial-weekly') THEN
      PERFORM cron.unschedule('refresh-benchmark-setorial-weekly');
    END IF;
    PERFORM cron.schedule(
      'refresh-benchmark-setorial-weekly',
      '0 3 * * 0',
      $cron$ SELECT public.refresh_mv_benchmark_setorial(); $cron$
    );
  END IF;
END $$;

DO $$ BEGIN
  REFRESH MATERIALIZED VIEW public.mv_benchmark_setorial;
EXCEPTION WHEN OTHERS THEN NULL; END $$;