-- Adiciona coluna is_active em user_roles necessária para funções de verificação de papel
-- Em produção foi adicionada via db_query; este arquivo garante o replay em Preview
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
