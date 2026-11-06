-- Shim: remove tabela extratos_bancarios_importados antes de 20260519122751
-- que tenta CREATE OR REPLACE VIEW sobre ela (42809 - is not a view)
-- (tabela criada em 20260509114452; migração 20260519122751 espera uma view)
-- Preview = sempre vazia → DROP; com dados → renomeia para liberar nome para a view seguinte
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
    ELSE
      -- Preserva dados e libera o nome para que 20260519122751 crie a view
      ALTER TABLE public.extratos_bancarios_importados
        RENAME TO extratos_bancarios_importados_pre_view;
    END IF;
  END IF;
END $$;
