ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS regime_tributario TEXT
    CHECK (regime_tributario IS NULL OR regime_tributario IN
      ('mei','simples_nacional','lucro_presumido','lucro_real','arbitrado'));

-- Backfill a partir do regime ativo mais recente
UPDATE public.empresas e
   SET regime_tributario = sub.regime
  FROM (
    SELECT DISTINCT ON (r.empresa_id) r.empresa_id,
           lower(regexp_replace(btrim(r.regime_nome), '\s+', '_', 'g')) AS regime
      FROM public.regimes_tributarios r
     WHERE COALESCE(r.ativo, true)
     ORDER BY r.empresa_id, r.data_inicio DESC NULLS LAST
  ) sub
 WHERE sub.empresa_id = e.id
   AND e.regime_tributario IS NULL
   AND sub.regime IN ('mei','simples_nacional','lucro_presumido','lucro_real','arbitrado');

-- Sincroniza o regime vigente quando um novo regime ativo é cadastrado
CREATE OR REPLACE FUNCTION public.sync_regime_tributario_empresa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_regime TEXT;
BEGIN
  IF NOT COALESCE(NEW.ativo, true) THEN
    RETURN NEW;
  END IF;
  v_regime := lower(regexp_replace(btrim(NEW.regime_nome), '\s+', '_', 'g'));
  IF v_regime IN ('mei','simples_nacional','lucro_presumido','lucro_real','arbitrado') THEN
    UPDATE public.empresas SET regime_tributario = v_regime WHERE id = NEW.empresa_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_regime_empresa ON public.regimes_tributarios;
CREATE TRIGGER trg_sync_regime_empresa
  AFTER INSERT OR UPDATE ON public.regimes_tributarios
  FOR EACH ROW EXECUTE FUNCTION public.sync_regime_tributario_empresa();

REVOKE EXECUTE ON FUNCTION public.sync_regime_tributario_empresa() FROM anon, authenticated;

-- Painel passa a usar o regime consolidado na empresa
CREATE OR REPLACE VIEW public.vw_tributario_dashboard
WITH (security_invoker = true) AS
SELECT
  e.id AS empresa_id,
  e.razao_social,
  COALESCE(e.regime_tributario, 'nao_informado') AS regime_tributario,
  at_.ano,
  at_.mes,
  at_.competencia,
  COALESCE(at_.total_geral, 0) AS total_tributos,
  COALESCE(at_.total_tributos_novos, 0) AS tributos_novos,
  COALESCE(at_.total_tributos_residuais, 0) AS tributos_residuais,
  COALESCE(at_.cbs_a_pagar, 0) AS cbs,
  COALESCE(at_.ibs_a_pagar, 0) AS ibs,
  COALESCE(at_.is_a_pagar, 0) AS imposto_seletivo,
  at_.status AS status_apuracao
FROM public.empresas e
JOIN public.apuracoes_tributarias at_ ON at_.empresa_id = e.id;