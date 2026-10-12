-- Bucket `financeiro`: escopo por empresa nas policies de SELECT/DELETE.
--
-- As policies criadas em 20261002093000 liberavam leitura e remoção de
-- QUALQUER objeto do bucket para qualquer usuário autenticado — cross-tenant
-- aberto. O path do objeto é `<entidadeTipo>/<entidadeId>/<uuid>.<ext>`;
-- resolvemos a empresa dona do anexo e exigimos vínculo ativo do usuário.
-- SELECT vale para qualquer papel (leitura é o papel de visualizador/
-- contador); DELETE exige papel de escrita (admin|financeiro|operacional).

DROP POLICY IF EXISTS "anexos_financeiro_leitura_autenticada" ON storage.objects;
CREATE POLICY "anexos_financeiro_leitura_autenticada" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'financeiro'
    AND EXISTS (
      SELECT 1
      FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.ativo
        AND ue.empresa_id = CASE (storage.foldername(name))[1]
          WHEN 'contas_pagar' THEN (
            SELECT cp.empresa_id FROM public.contas_pagar cp
            WHERE cp.id = (storage.foldername(name))[2]::uuid
          )
          WHEN 'contas_receber' THEN (
            SELECT cr.empresa_id FROM public.contas_receber cr
            WHERE cr.id = (storage.foldername(name))[2]::uuid
          )
          WHEN 'movimentacoes' THEN (
            SELECT mv.empresa_id FROM public.movimentacoes mv
            WHERE mv.id = (storage.foldername(name))[2]::uuid
          )
        END
    )
  );

DROP POLICY IF EXISTS "anexos_financeiro_remocao_autenticada" ON storage.objects;
CREATE POLICY "anexos_financeiro_remocao_autenticada" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'financeiro'
    AND EXISTS (
      SELECT 1
      FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.ativo
        AND ue.role IN ('admin', 'financeiro', 'operacional')
        AND ue.empresa_id = CASE (storage.foldername(name))[1]
          WHEN 'contas_pagar' THEN (
            SELECT cp.empresa_id FROM public.contas_pagar cp
            WHERE cp.id = (storage.foldername(name))[2]::uuid
          )
          WHEN 'contas_receber' THEN (
            SELECT cr.empresa_id FROM public.contas_receber cr
            WHERE cr.id = (storage.foldername(name))[2]::uuid
          )
          WHEN 'movimentacoes' THEN (
            SELECT mv.empresa_id FROM public.movimentacoes mv
            WHERE mv.id = (storage.foldername(name))[2]::uuid
          )
        END
    )
  );
