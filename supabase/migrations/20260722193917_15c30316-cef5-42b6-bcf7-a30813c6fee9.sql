
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Ajustar tabela: trocar secrets externos por armazenamento interno seguro
ALTER TABLE public.empresas_certificados
  DROP COLUMN IF EXISTS pfx_secret_name,
  DROP COLUMN IF EXISTS password_secret_name,
  ADD COLUMN IF NOT EXISTS pfx_storage_path TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS password_encrypted BYTEA;

ALTER TABLE public.empresas_certificados ALTER COLUMN pfx_storage_path DROP DEFAULT;

-- Policies do bucket de certificados: apenas service_role
CREATE POLICY "nfe_cert_service_all" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'nfe-certificados')
  WITH CHECK (bucket_id = 'nfe-certificados');
