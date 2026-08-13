
-- Policies de acesso ao bucket nfe-xml
-- Layout: {empresa_id}/{AAAAMM}/{chave}.xml

CREATE POLICY "nfe_xml_service_write" ON storage.objects
  FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'nfe-xml');

CREATE POLICY "nfe_xml_service_update" ON storage.objects
  FOR UPDATE TO service_role
  USING (bucket_id = 'nfe-xml');

CREATE POLICY "nfe_xml_service_delete" ON storage.objects
  FOR DELETE TO service_role
  USING (bucket_id = 'nfe-xml');

CREATE POLICY "nfe_xml_empresa_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'nfe-xml' AND (
      public.has_role(auth.uid(), 'admin') OR
      EXISTS (
        SELECT 1 FROM public.user_empresas ue
        WHERE ue.user_id = auth.uid()
          AND ue.empresa_id::text = split_part(name, '/', 1)
      )
    )
  );
