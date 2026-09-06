-- Migration 20260903000400
-- PROBLEMA: certificado_get_password(p_cert_id, p_master_key) retorna senha do
-- certificado digital sem verificar se o chamador tem acesso à empresa dona do cert.
-- Qualquer usuário autenticado com UUID de certificado de outra empresa consegue
-- descriptografar a senha do e-CNPJ/e-CPF desta empresa (IDOR crítico).
-- FIX: adicionar validação de empresa_acessivel() antes de retornar a senha.

BEGIN;

CREATE OR REPLACE FUNCTION public.certificado_get_password(p_cert_id uuid, p_master_key text)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'extensions'
AS $$
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
$$;

COMMIT;
