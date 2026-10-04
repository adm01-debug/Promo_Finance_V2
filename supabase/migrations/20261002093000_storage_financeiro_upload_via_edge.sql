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
