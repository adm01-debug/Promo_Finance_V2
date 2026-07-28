-- ============================================================================
-- GAP #22 — frontend_error_logs: correção de schema + limites anti-abuso
-- ----------------------------------------------------------------------------
-- ACHADO 1 (funcional, crítico): src/lib/telemetry.ts inseria as colunas
--   message / stack / severity / context, mas a tabela expõe
--   error_message / error_stack / metadata e NÃO possuía severity.
--   Todo INSERT falhava com PGRST204 e era engolido pelo catch da telemetria
--   -> o monitoramento de erros em produção estava 100% cego.
--
-- ACHADO 2 (segurança): a política de INSERT aceita `user_id IS NULL`
--   (intencional: capturar falhas na tela de login, antes da sessão existir).
--   Sem limite de tamanho, error_stack/metadata são TEXT/JSONB de até ~1GB:
--   um anônimo poderia usar a tabela como storage gratuito ou inflar o custo
--   e o tempo de backup do banco. Limitar o payload fecha o abuso sem tirar
--   a captura pré-login.
--
-- ACHADO 3: created_at compõe a chave da tabela particionada. Um cliente que
--   enviasse uma data arbitrária conseguiria escolher a partição de destino
--   (ou cair na `default`), furando a rotina de retenção por período.
-- ============================================================================

-- 1) Coluna que o frontend já enviava e o banco não tinha.
ALTER TABLE public.frontend_error_logs
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'error';

ALTER TABLE public.frontend_error_logs
  DROP CONSTRAINT IF EXISTS frontend_error_logs_severity_check;
ALTER TABLE public.frontend_error_logs
  ADD CONSTRAINT frontend_error_logs_severity_check
  CHECK (severity IN ('error', 'warning', 'critical'));

-- 2) Teto declarativo de payload (defesa em profundidade: vale inclusive para
--    gravações via service_role, que ignoram RLS e o trigger de cliente).
ALTER TABLE public.frontend_error_logs
  DROP CONSTRAINT IF EXISTS frontend_error_logs_payload_bounds;
ALTER TABLE public.frontend_error_logs
  ADD CONSTRAINT frontend_error_logs_payload_bounds
  CHECK (
    length(coalesce(error_message, '')) <= 2000
    AND length(coalesce(error_stack, ''))  <= 8000
    AND length(coalesce(url, ''))          <= 2000
    AND length(coalesce(user_agent, ''))   <= 500
    AND pg_column_size(coalesce(metadata, '{}'::jsonb)) <= 16384
  );

-- 3) Normalização na borda. Trunca em vez de rejeitar: um log de erro nunca
--    deve ser perdido por ser grande demais — mas também não pode crescer sem
--    limite. Regras dependentes de now() vivem em trigger, não em CHECK
--    (CHECK precisa ser IMMUTABLE e quebraria restores).
CREATE OR REPLACE FUNCTION public.frontend_error_logs_sanitize()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- O carimbo de tempo é do servidor, sempre. Impede escolha de partição
  -- e falsificação de janela temporal do incidente.
  NEW.created_at := now();

  NEW.error_message := left(NEW.error_message, 2000);
  NEW.error_stack   := left(NEW.error_stack,   8000);
  NEW.url           := left(NEW.url,           2000);
  NEW.user_agent    := left(NEW.user_agent,     500);

  IF NEW.severity IS NULL OR NEW.severity NOT IN ('error', 'warning', 'critical') THEN
    NEW.severity := 'error';
  END IF;

  -- metadata é livre por natureza; se estourar, preserva-se o fato do erro
  -- e descarta-se o anexo, registrando o descarte.
  IF pg_column_size(coalesce(NEW.metadata, '{}'::jsonb)) > 16384 THEN
    NEW.metadata := jsonb_build_object(
      '_truncated', true,
      '_original_bytes', pg_column_size(NEW.metadata)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_frontend_error_logs_sanitize ON public.frontend_error_logs;
CREATE TRIGGER trg_frontend_error_logs_sanitize
  BEFORE INSERT ON public.frontend_error_logs
  FOR EACH ROW EXECUTE FUNCTION public.frontend_error_logs_sanitize();

-- 4) Leitura do painel admin é sempre por período + severidade.
CREATE INDEX IF NOT EXISTS idx_frontend_error_logs_sev_created
  ON public.frontend_error_logs (severity, created_at DESC);