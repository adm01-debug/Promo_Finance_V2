-- Garante que public.profiles.role existe antes de migrations que referenciam esta coluna.
-- Esta versão coincide com a aplicada manualmente em produção (schema_migrations já possui 20260518153328).
-- Em Supabase Preview (replay do zero) este arquivo é executado e adiciona a coluna corretamente.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'visualizador';
