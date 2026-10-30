-- Shim: adiciona user_id às tabelas antes de migration 20260518172812
-- que cria policies referenciando essa coluna em tabelas criadas sem user_id:
--   historico_analises_preditivas (20251220134032) — statement 13
--   historico_cobrancas_boletos   (criada sem user_id)  — statement 28
--   auditoria_financeira          (criada sem user_id)  — statement 44
ALTER TABLE public.historico_analises_preditivas
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.historico_cobrancas_boletos
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.auditoria_financeira
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
