CREATE OR REPLACE FUNCTION public.chave_anon_vault()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'pg_catalog'
AS $function$
DECLARE
  v_chave text;
BEGIN
  SELECT decrypted_secret INTO v_chave
    FROM vault.decrypted_secrets
   WHERE name = 'anon_key'
   LIMIT 1;

  IF v_chave IS NULL OR v_chave = '' THEN
    RAISE EXCEPTION
      'Secret "anon_key" ausente no Vault. Crie-o em Project Settings > Vault com a anon key de bwwbeyolnnzppeuhgkcd.';
  END IF;

  RETURN v_chave;
END;
$function$
