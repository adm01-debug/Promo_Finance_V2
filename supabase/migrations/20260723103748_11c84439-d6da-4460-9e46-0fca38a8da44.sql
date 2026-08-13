
ALTER TABLE public.sefaz_dfe_cursor
  ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS circuit_open BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_sefaz_cursor_elegiveis
  ON public.sefaz_dfe_cursor(next_run_at)
  WHERE circuit_open = false;

COMMENT ON COLUMN public.sefaz_dfe_cursor.retry_count IS 'Falhas consecutivas do puxador DFe. Reset ao primeiro sucesso.';
COMMENT ON COLUMN public.sefaz_dfe_cursor.next_run_at IS 'Próximo horário permitido para o dispatcher acionar este CNPJ (backoff exponencial).';
COMMENT ON COLUMN public.sefaz_dfe_cursor.circuit_open IS 'Se true, dispatcher pula este CNPJ até intervenção manual (>=8 falhas consecutivas).';
