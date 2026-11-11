-- Adiciona colunas is_active e expires_at em user_roles necessárias para funções de verificação de papel
-- Em produção foram adicionadas via db_query sem migration registrada
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
