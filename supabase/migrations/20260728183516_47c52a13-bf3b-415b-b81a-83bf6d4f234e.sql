-- Gap #28 (correção encontrada na simulação): a versão anterior criava
-- `_digest_itens` como TEMP TABLE ... ON COMMIT DROP. Duas invocações dentro
-- da MESMA transação (retry manual, teste, ou dois jobs em uma transação)
-- falhavam com "relation _digest_itens already exists". Reescrito com CTE
-- data-modifying: a seleção e o registro continuam atômicos, sem estado
-- residual de sessão.
CREATE OR REPLACE FUNCTION public.claim_silenciamentos_digest(
  p_horas integer DEFAULT 168,
  p_min_intervalo_horas integer DEFAULT 144
)
RETURNS TABLE (
  assinatura        text,
  severity          text,
  exemplo_mensagem  text,
  silenciado_ate    timestamptz,
  horas_restantes   numeric,
  ja_expirou        boolean,
  alertas_enviados  integer
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_horas integer := least(greatest(coalesce(p_horas, 168), 1), 720);
  v_min   integer := least(greatest(coalesce(p_min_intervalo_horas, 144), 0), 720);
BEGIN
  -- Serializa execuções concorrentes do agendador antes de decidir o envio.
  LOCK TABLE public.frontend_error_silence_digest_log IN SHARE ROW EXCLUSIVE MODE;

  IF v_min > 0 AND EXISTS (
    SELECT 1 FROM public.frontend_error_silence_digest_log d
    WHERE d.executado_em > now() - make_interval(hours => v_min)
  ) THEN
    RETURN; -- digest recente já enviado
  END IF;

  RETURN QUERY
  WITH sel AS (
    SELECT
      s.assinatura,
      s.severity,
      s.exemplo_mensagem,
      s.silenciado_ate,
      round(extract(epoch FROM (s.silenciado_ate - now())) / 3600.0, 1)::numeric AS horas_restantes,
      (s.silenciado_ate <= now()) AS ja_expirou,
      s.alertas_enviados
    FROM public.frontend_error_alert_state s
    WHERE s.silenciado_ate IS NOT NULL
      AND s.silenciado_ate <= now() + make_interval(hours => v_horas)
      AND s.silenciado_ate >= now() - make_interval(hours => v_horas)
    ORDER BY s.silenciado_ate ASC
    LIMIT 200
  ),
  agg AS (
    SELECT count(*)::integer AS n, coalesce(array_agg(sel.assinatura), '{}'::text[]) AS lista
    FROM sel
  ),
  ins AS (
    -- Só consome a janela de cooldown quando há de fato o que comunicar.
    INSERT INTO public.frontend_error_silence_digest_log (janela_horas, itens, assinaturas)
    SELECT v_horas, agg.n, agg.lista FROM agg WHERE agg.n > 0
    RETURNING 1
  )
  SELECT sel.assinatura, sel.severity, sel.exemplo_mensagem, sel.silenciado_ate,
         sel.horas_restantes, sel.ja_expirou, sel.alertas_enviados
  FROM sel
  WHERE (SELECT count(*) FROM ins) >= 0
  ORDER BY sel.silenciado_ate ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_silenciamentos_digest(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_silenciamentos_digest(integer, integer) TO service_role;