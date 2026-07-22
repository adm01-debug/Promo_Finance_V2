
CREATE OR REPLACE FUNCTION public.certificado_upsert(
  p_empresa_id UUID,
  p_cnpj TEXT,
  p_razao_social TEXT,
  p_pfx_storage_path TEXT,
  p_password TEXT,
  p_master_key TEXT,
  p_valido_de TIMESTAMPTZ,
  p_valido_ate TIMESTAMPTZ,
  p_ambiente public.sefaz_ambiente,
  p_uf TEXT,
  p_criado_por UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.empresas_certificados (
    empresa_id, cnpj, razao_social, pfx_storage_path, password_encrypted,
    valido_de, valido_ate, ambiente, uf, criado_por, ativo
  ) VALUES (
    p_empresa_id, p_cnpj, p_razao_social, p_pfx_storage_path,
    extensions.pgp_sym_encrypt(p_password, p_master_key),
    p_valido_de, p_valido_ate, p_ambiente, p_uf, p_criado_por, TRUE
  )
  ON CONFLICT (empresa_id, cnpj, ambiente) DO UPDATE SET
    razao_social = EXCLUDED.razao_social,
    pfx_storage_path = EXCLUDED.pfx_storage_path,
    password_encrypted = EXCLUDED.password_encrypted,
    valido_de = EXCLUDED.valido_de,
    valido_ate = EXCLUDED.valido_ate,
    uf = EXCLUDED.uf,
    ativo = TRUE,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.certificado_upsert(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, public.sefaz_ambiente, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.certificado_upsert(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, public.sefaz_ambiente, TEXT, UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.certificado_get_password(
  p_cert_id UUID,
  p_master_key TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_pwd TEXT;
BEGIN
  SELECT extensions.pgp_sym_decrypt(password_encrypted, p_master_key)
    INTO v_pwd
    FROM public.empresas_certificados
    WHERE id = p_cert_id;
  RETURN v_pwd;
END $$;

REVOKE ALL ON FUNCTION public.certificado_get_password(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.certificado_get_password(UUID, TEXT) TO service_role;
