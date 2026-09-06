-- historico_conciliacao_ia was created in 20251220014622 without sessao_id.
-- The 20260519121217 CREATE TABLE IF NOT EXISTS was a no-op (table already existed),
-- so the sessao_id FK was never added. Downstream policies reference it.
ALTER TABLE public.historico_conciliacao_ia
  ADD COLUMN IF NOT EXISTS sessao_id UUID REFERENCES public.sessoes_conciliacao(id);

CREATE INDEX IF NOT EXISTS idx_historico_conciliacao_ia_sessao
  ON public.historico_conciliacao_ia(sessao_id);

INSERT INTO supabase_migrations.schema_migrations(version,name,statements)
VALUES('20260728214210','add_sessao_id_to_historico_conciliacao_ia',ARRAY['add_sessao_id_to_historico_conciliacao_ia'])
ON CONFLICT DO NOTHING;
