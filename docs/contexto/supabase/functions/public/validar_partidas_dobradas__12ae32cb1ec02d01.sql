CREATE OR REPLACE FUNCTION public.validar_partidas_dobradas()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE v_deb numeric; v_cre numeric;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN tipo='DEBITO'  THEN valor ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tipo='CREDITO' THEN valor ELSE 0 END), 0)
  INTO v_deb, v_cre
  FROM public.partidas_contabeis
  WHERE lancamento_id = COALESCE(NEW.lancamento_id, OLD.lancamento_id);
  IF ABS(v_deb - v_cre) > 0.01 THEN
    RAISE EXCEPTION 'Partidas não balanceadas: Débitos=% Créditos=%', v_deb, v_cre;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$
