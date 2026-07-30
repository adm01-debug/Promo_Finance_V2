-- ============================================================================
-- Gap #28 — Digest semanal de silenciamentos de alerta prestes a expirar
--
-- Problema real observado no Gap #26: quando um administrador silencia uma
-- assinatura ruidosa por N horas, o prazo expira em silêncio. Ninguém é
-- avisado, o alerta volta a disparar de madrugada e o time trata como novo
-- incidente. Pior: renovações sucessivas escondem um bug crônico sem que
-- exista qualquer visibilidade do tempo total silenciado.
--
-- Esta migration cria:
--   1) Trilha de digests enviados (idempotência + auditoria);
--   2) RPC de leitura para a UI admin (o que expira em breve / já expirou);
--   3) RPC de claim transacional para o agendador (sem duplo envio);
--   4) Agendamento semanal.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Trilha de digests
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.frontend_error_silence_digest_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executado_em  timestamptz NOT NULL DEFAULT now(),
  janela_horas  integer NOT NULL,
  itens         integer NOT NULL DEFAULT 0,
  assinaturas   text[]  NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.frontend_error_silence_digest_log TO authenticated;
GRANT ALL    ON public.frontend_error_silence_digest_log TO service_role;

ALTER TABLE public.frontend_error_silence_digest_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fe_silence_digest_admin_select" ON public.frontend_error_silence_digest_log;
CREATE POLICY "fe_silence_digest_admin_select"
  ON public.frontend_error_silence_digest_log
  FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_fe_silence_digest_executado
  ON public.frontend_error_silence_digest_log (executado_em DESC);

COMMENT ON TABLE public.frontend_error_silence_digest_log IS
  'Gap #28: trilha dos digests de silenciamento enviados. Serve de trava de idempotência para o agendador semanal.';

-- ----------------------------------------------------------------------------
-- 2) Leitura para a UI admin
--    Retorna silenciamentos que expiram dentro da janela E os que expiraram
--    recentemente (janela retroativa igual), para o admin decidir renovar ou
--    tratar a causa raiz.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_silenciamentos_expirando(
  p_horas integer DEFAULT 72
)
RETURNS TABLE (
  assinatura        text,
  severity          text,
  exemplo_mensagem  text,
  silenciado_ate    timestamptz,
  horas_restantes   numeric,
  ja_expirou        boolean,
  alertas_enviados  integer,
  ocorrencias_no_ultimo_alerta integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_horas integer := least(greatest(coalesce(p_horas, 72), 1), 720);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar silenciamentos.';
  END IF;

  RETURN QUERY
  SELECT
    s.assinatura,
    s.severity,
    s.exemplo_mensagem,
    s.silenciado_ate,
    round(extract(epoch FROM (s.silenciado_ate - now())) / 3600.0, 1)::numeric,
    (s.silenciado_ate <= now()),
    s.alertas_enviados,
    s.ocorrencias_no_ultimo_alerta
  FROM public.frontend_error_alert_state s
  WHERE s.silenciado_ate IS NOT NULL
    AND s.silenciado_ate <= now() + make_interval(hours => v_horas)
    AND s.silenciado_ate >= now() - make_interval(hours => v_horas)
  ORDER BY s.silenciado_ate ASC
  LIMIT 200;
END;
$$;

REVOKE ALL ON FUNCTION public.get_silenciamentos_expirando(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_silenciamentos_expirando(integer) TO authenticated, service_role;

COMMENT ON FUNCTION public.get_silenciamentos_expirando(integer) IS
  'Gap #28: silenciamentos de alerta que expiram (ou expiraram) dentro da janela informada. Somente admin.';

-- ----------------------------------------------------------------------------
-- 3) Claim transacional para o agendador
--    Registra o digest na MESMA transação em que devolve as linhas: duas
--    execuções concorrentes do cron não geram dois e-mails. Se já houve digest
--    dentro de `p_min_intervalo_horas`, retorna vazio.
-- ----------------------------------------------------------------------------
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
  v_itens integer;
  v_lista text[];
BEGIN
  -- Trava de idempotência: bloqueia a tabela de log para serializar execuções
  -- concorrentes do agendador antes de decidir se este digest deve sair.
  LOCK TABLE public.frontend_error_silence_digest_log IN SHARE ROW EXCLUSIVE MODE;

  IF v_min > 0 AND EXISTS (
    SELECT 1 FROM public.frontend_error_silence_digest_log d
    WHERE d.executado_em > now() - make_interval(hours => v_min)
  ) THEN
    RETURN; -- digest recente já enviado
  END IF;

  CREATE TEMP TABLE _digest_itens ON COMMIT DROP AS
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
  LIMIT 200;

  SELECT count(*)::integer, coalesce(array_agg(t.assinatura), '{}')
    INTO v_itens, v_lista
  FROM _digest_itens t;

  IF v_itens = 0 THEN
    RETURN; -- nada a comunicar: não consome a janela de cooldown
  END IF;

  INSERT INTO public.frontend_error_silence_digest_log (janela_horas, itens, assinaturas)
  VALUES (v_horas, v_itens, v_lista);

  RETURN QUERY SELECT t.assinatura, t.severity, t.exemplo_mensagem, t.silenciado_ate,
                      t.horas_restantes, t.ja_expirou, t.alertas_enviados
               FROM _digest_itens t
               ORDER BY t.silenciado_ate ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_silenciamentos_digest(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_silenciamentos_digest(integer, integer) TO service_role;

COMMENT ON FUNCTION public.claim_silenciamentos_digest(integer, integer) IS
  'Gap #28: reivindica (com trava e registro na mesma transação) o digest semanal de silenciamentos prestes a expirar. Somente service_role.';