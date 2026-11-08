CREATE OR REPLACE FUNCTION public.sync_regime_tributario_empresa()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_regime TEXT;
BEGIN
  IF NOT COALESCE(NEW.ativo, true) THEN
    RETURN NEW;
  END IF;
  v_regime := lower(regexp_replace(btrim(NEW.regime_nome), '\s+', '_', 'g'));
  IF v_regime IN ('mei','simples_nacional','lucro_presumido','lucro_real','arbitrado') THEN
    UPDATE public.empresas SET regime_tributario = v_regime WHERE id = NEW.empresa_id;
  END IF;
  RETURN NEW;
END;
$function$
