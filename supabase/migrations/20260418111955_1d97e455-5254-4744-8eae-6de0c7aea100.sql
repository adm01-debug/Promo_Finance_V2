-- Bucket privado para relatórios tributários executivos
INSERT INTO storage.buckets (id, name, public)
VALUES ('relatorios-tributarios', 'relatorios-tributarios', false)
ON CONFLICT (id) DO NOTHING;

-- Apenas usuários autenticados podem ler relatórios
CREATE POLICY "Authenticated users can view tax reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'relatorios-tributarios');

-- Apenas service_role (edge functions) pode inserir relatórios
CREATE POLICY "Service role can insert tax reports"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'relatorios-tributarios');

-- Apenas admin pode deletar relatórios
CREATE POLICY "Admins can delete tax reports"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'relatorios-tributarios'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);