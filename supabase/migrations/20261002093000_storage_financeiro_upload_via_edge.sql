-- upload-anexo: escrita no bucket `financeiro` só via edge function.
--
-- A validação de magic bytes vivia só no cliente — e `accept=`/file.type
-- são declarados pelo navegador: um usuário autenticado chamando a API do
-- Storage direto contornava a checagem e gravava executável disfarçado.
-- A edge function `upload-anexo` revalida os bytes no servidor e grava via
-- service_role (que ignora RLS); esta policy restritiva nega INSERT direto
-- do role `authenticated` no bucket, fechando o desvio. Leitura, update e
-- delete continuam cobertos pelas policies já existentes.
INSERT INTO storage.buckets (id, name, public)
VALUES ('financeiro', 'financeiro', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "bloqueia_insert_direto_financeiro" ON storage.objects;
CREATE POLICY "bloqueia_insert_direto_financeiro" ON storage.objects
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id <> 'financeiro');

-- O locator canônico do objeto: com bucket privado, `url`/`url_publica`
-- deixam de ser link HTTP e o download gera URL assinada a partir daqui.
ALTER TABLE public.anexos_financeiros
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Leitura e remoção pelo usuário logado continuam no cliente
-- (download via signed URL não passa por policy; o `remove` direto do
-- AnexoList usa o JWT e precisa desta policy num banco criado só por
-- migrations). O INSERT segue restrito à edge function acima.
DROP POLICY IF EXISTS "anexos_financeiro_leitura_autenticada" ON storage.objects;
CREATE POLICY "anexos_financeiro_leitura_autenticada" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'financeiro');

DROP POLICY IF EXISTS "anexos_financeiro_remocao_autenticada" ON storage.objects;
CREATE POLICY "anexos_financeiro_remocao_autenticada" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'financeiro');
