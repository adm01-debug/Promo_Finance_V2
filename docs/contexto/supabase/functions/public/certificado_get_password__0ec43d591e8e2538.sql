CREATE OR REPLACE FUNCTION public.certificado_get_password(p_cert_id uuid, p_master_key text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_empresa_id UUID;
  v_pwd        TEXT;
BEGIN
  SELECT empresa_id
    INTO v_empresa_id
    FROM public.empresas_certificados
    WHERE id = p_cert_id;

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Certificado não encontrado';
  END IF;

  IF NOT public.empresa_acessivel(v_empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado ao certificado informado';
  END IF;

  SELECT extensions.pgp_sym_decrypt(password_encrypted, p_master_key)
    INTO v_pwd
    FROM public.empresas_certificados
    WHERE id = p_cert_id;

  RETURN v_pwd;
END;
$function$
