-- normalizar_tipo_partida convertia `tipo` para MAIÚSCULO, mas a constraint
-- partidas_contabeis_tipo_check só aceita 'debito'/'credito' (minúsculo):
-- todo INSERT/UPDATE em partidas_contabeis falhava (última partida gravada em
-- 29/07/2026). Já aplicado em produção em 11/11/2026; idempotente.
CREATE OR REPLACE FUNCTION public.normalizar_tipo_partida()
 RETURNS trigger LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  -- A constraint partidas_contabeis_tipo_check só aceita 'debito'/'credito'.
  IF NEW.tipo IS NOT NULL THEN
    NEW.tipo = LOWER(NEW.tipo);
  END IF;
  RETURN NEW;
END;
$function$;
