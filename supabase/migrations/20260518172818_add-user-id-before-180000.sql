-- Shim: adiciona user_id a tabelas que existem sem essa coluna
-- antes de 20260518180000 que cria policies referenciando user_id
-- (tabelas criadas originalmente sem user_id)
ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.solicitacoes_aprovacao
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.logs_baixa_automatica
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.anexos_financeiros
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.execucoes_cobranca
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.acordos_parcelamento
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.boletos
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
