CREATE OR REPLACE FUNCTION public.is_country_allowed_for_login(_country text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- `ativo` é o campo canônico; `enabled` só existe no banco consolidado.
  -- to_jsonb(record) mantém a migration compatível com o replay histórico.
  IF NOT EXISTS (
    SELECT 1
    FROM public.allowed_countries ac
    WHERE coalesce(
      nullif(to_jsonb(ac)->>'ativo', '')::boolean,
      nullif(to_jsonb(ac)->>'enabled', '')::boolean,
      false
    )
  ) THEN
    RETURN NULL;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.allowed_countries ac
    WHERE ac.country_code = _country
      AND coalesce(
        nullif(to_jsonb(ac)->>'ativo', '')::boolean,
        nullif(to_jsonb(ac)->>'enabled', '')::boolean,
        false
      )
  );
END
$function$
