-- Shim: remove tabela extratos_bancarios_importados antes de 20260519122751
-- que tenta CREATE OR REPLACE VIEW sobre ela (42809 - is not a view)
-- (tabela criada em 20260509114452; migração 20260519122751 espera uma view)
-- Guarda: só dropa se vazia (Preview = sem dados; produção já tem esta versão em schema_migrations)
DO $$
DECLARE
  has_rows boolean;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'extratos_bancarios_importados'
    AND table_type = 'BASE TABLE'
  ) THEN
    SELECT EXISTS(SELECT 1 FROM public.extratos_bancarios_importados LIMIT 1) INTO has_rows;
    IF NOT has_rows THEN
      DROP TABLE public.extratos_bancarios_importados CASCADE;
    END IF;
  END IF;
END $$;
