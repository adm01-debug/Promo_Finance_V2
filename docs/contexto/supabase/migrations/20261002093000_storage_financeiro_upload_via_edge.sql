-- Bucket já criado via CTE. Aplicar policies e coluna.
DROP POLICY IF EXISTS "bloqueia_insert_direto_financeiro" ON storage.objects;
CREATE POLICY "bloqueia_insert_direto_financeiro" ON storage.objects
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id <> 'financeiro');

ALTER TABLE public.anexos_financeiros
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

DROP POLICY IF EXISTS "anexos_financeiro_leitura_autenticada" ON storage.objects;
CREATE POLICY "anexos_financeiro_leitura_autenticada" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'financeiro');

DROP POLICY IF EXISTS "anexos_financeiro_remocao_autenticada" ON storage.objects;
CREATE POLICY "anexos_financeiro_remocao_autenticada" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'financeiro');
