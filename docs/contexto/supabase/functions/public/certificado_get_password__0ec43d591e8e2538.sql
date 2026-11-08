CREATE OR REPLACE FUNCTION public.certificado_get_password(p_cert_id uuid, p_master_key text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_pwd TEXT;
BEGIN
  SELECT extensions.pgp_sym_decrypt(password_encrypted, p_master_key)
    INTO v_pwd
    FROM public.empresas_certificados
    WHERE id = p_cert_id;
  RETURN v_pwd;
END $function$
