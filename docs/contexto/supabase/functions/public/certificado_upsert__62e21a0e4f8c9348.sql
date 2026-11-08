CREATE OR REPLACE FUNCTION public.certificado_upsert(p_empresa_id uuid, p_cnpj text, p_razao_social text, p_pfx_storage_path text, p_password text, p_master_key text, p_valido_de timestamp with time zone, p_valido_ate timestamp with time zone, p_ambiente sefaz_ambiente, p_uf text, p_criado_por uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
END $function$
