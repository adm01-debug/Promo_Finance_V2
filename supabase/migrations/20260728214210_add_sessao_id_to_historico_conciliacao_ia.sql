-- historico_conciliacao_ia was created in 20251220014622 without sessao_id.
-- The 20260519121217 CREATE TABLE IF NOT EXISTS was a no-op (table already existed),
-- so the sessao_id FK was never added. Downstream policies reference it.
ALTER TABLE public.historico_conciliacao_ia
  ADD COLUMN IF NOT EXISTS sessao_id UUID REFERENCES public.sessoes_conciliacao(id);

CREATE INDEX IF NOT EXISTS idx_historico_conciliacao_ia_sessao
  ON public.historico_conciliacao_ia(sessao_id);
