CREATE OR REPLACE FUNCTION public.validar_partidas_dobradas()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE v_deb numeric; v_cre numeric; v_lanc uuid := COALESCE(NEW.lancamento_id, OLD.lancamento_id);
BEGIN
  -- Lançamento apagado por inteiro (cascade): nada a validar.
  IF NOT EXISTS (SELECT 1 FROM public.lancamentos_contabeis WHERE id = v_lanc) THEN
    RETURN NULL;
  END IF;
  SELECT
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'debito'), 0),
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'credito'), 0)
  INTO v_deb, v_cre
  FROM public.partidas_contabeis
  WHERE lancamento_id = v_lanc;
  IF ABS(v_deb - v_cre) > 0.01 THEN
    RAISE EXCEPTION 'Partidas não balanceadas no lançamento %: Débitos=% Créditos=%', v_lanc, v_deb, v_cre
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END;
$function$
