-- Restaura o controle de cota da consulta de CNPJ, hoje inexistente em produção.
--
-- `supabase/functions/cnpja-lookup/index.ts:179` chama
-- `cnpja_check_rate_limit`, e o banco canônico responde
-- `42883 function public.cnpja_check_rate_limit(uuid, integer, integer) does not exist`.
-- Como a função devolve HTTP 503 quando essa RPC falha, todo CNPJ fora do
-- `cnpja_cache` respondia 503 e nunca chegava ao provedor: o preenchimento
-- automático por CNPJ só funcionava para CNPJ já consultado antes.
--
-- A tabela e a função são declaradas em `20260418121937` e nunca chegaram ao
-- banco — mesmo drift documentado em `docs/agentes/auditoria-drift-banco-2026-11-17.md`.
-- A migration `20261117190000` as removeu do replay para convergir com o estado
-- (quebrado) de produção; esta, de timestamp posterior, as recria. O estado
-- final do replay passa a ser o correto: tabela e função presentes.
--
-- O desenho original é mantido tal e qual, porque ele já resolve o que um
-- contador em duas idas ao banco não resolve:
--   * `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` incrementa e lê numa só
--     operação, então duas consultas simultâneas do mesmo usuário não passam
--     ambas com a mesma contagem;
--   * a tabela tem RLS com policy apenas de SELECT — não há policy de INSERT,
--     logo um usuário autenticado não consegue gravar linha atribuindo cota a
--     outra pessoa para negar a consulta dela;
--   * a janela é fixa (`date_trunc` por `_window_minutes`), então a cota renova
--     na virada da janela, não por janela deslizante.
--
-- Idempotente: `IF NOT EXISTS` na tabela e no índice, `CREATE OR REPLACE` na
-- função, e a policy criada só quando ausente.

CREATE TABLE IF NOT EXISTS public.cnpja_rate_limit (
  user_id UUID NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, window_start)
)

CREATE INDEX IF NOT EXISTS idx_cnpja_rate_limit_window
  ON public.cnpja_rate_limit(window_start)

ALTER TABLE public.cnpja_rate_limit ENABLE ROW LEVEL SECURITY

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'cnpja_rate_limit'
      AND policyname = 'Usuário vê próprio uso CNPJá'
  ) THEN
    CREATE POLICY "Usuário vê próprio uso CNPJá"
      ON public.cnpja_rate_limit FOR SELECT
      TO authenticated
      USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$

CREATE OR REPLACE FUNCTION public.cnpja_check_rate_limit(
  _user_id UUID,
  _max INTEGER DEFAULT 10,
  _window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_window := date_trunc('minute', now()) - (EXTRACT(MINUTE FROM now())::INTEGER % _window_minutes) * INTERVAL '1 minute';

  INSERT INTO public.cnpja_rate_limit (user_id, window_start, request_count)
  VALUES (_user_id, v_window, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET request_count = cnpja_rate_limit.request_count + 1
  RETURNING request_count INTO v_count;

  -- Limpa janelas antigas (best-effort)
  DELETE FROM public.cnpja_rate_limit
  WHERE window_start < now() - INTERVAL '1 day';

  RETURN v_count <= _max;
END;
$$

REVOKE ALL ON FUNCTION public.cnpja_check_rate_limit(uuid, integer, integer) FROM PUBLIC

GRANT EXECUTE ON FUNCTION public.cnpja_check_rate_limit(uuid, integer, integer) TO service_role
