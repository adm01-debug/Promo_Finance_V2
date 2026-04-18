DROP POLICY IF EXISTS "Usuários autenticados visualizam NFs OCR" ON public.notas_fiscais_ocr;
CREATE POLICY "Owner ou admin/financeiro visualiza NFs OCR"
ON public.notas_fiscais_ocr
FOR SELECT TO authenticated
USING (
  auth.uid() = criado_por
  OR public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[])
);

DROP POLICY IF EXISTS "Usuários autenticados visualizam resumos executivos" ON public.resumos_executivos_semanais;
CREATE POLICY "Admin/financeiro visualiza resumos executivos"
ON public.resumos_executivos_semanais
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

DROP POLICY IF EXISTS "Authenticated read acoes_recomendadas" ON public.acoes_recomendadas;
CREATE POLICY "Admin/financeiro lê acoes_recomendadas"
ON public.acoes_recomendadas
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

DROP POLICY IF EXISTS "Authenticated users can view tax reports" ON storage.objects;
CREATE POLICY "Admin/financeiro visualiza tax reports"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'relatorios-tributarios'
  AND public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[])
);