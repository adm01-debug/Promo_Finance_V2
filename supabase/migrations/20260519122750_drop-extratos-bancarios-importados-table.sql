-- Shim: remove tabela extratos_bancarios_importados antes de 20260519122751
-- que tenta CREATE OR REPLACE VIEW sobre ela (42809 - is not a view)
-- (tabela criada em 20260509114452; migração 20260519122751 espera uma view)
DROP TABLE IF EXISTS public.extratos_bancarios_importados CASCADE;
