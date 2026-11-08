CREATE OR REPLACE FUNCTION public.fn_movimentacao_origem_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF TG_OP = 'UPDATE' AND OLD.transferencia_id IS NOT NULL THEN
      NEW.origem := OLD.origem;
      NEW.transferencia_id := OLD.transferencia_id;
    ELSIF TG_OP IN ('INSERT', 'UPDATE') AND NEW.transferencia_id IS NOT NULL THEN
      NEW.transferencia_id := NULL;
    END IF;
    IF NEW.origem IN ('transferencia', 'transferencia_externa')
       AND (TG_OP = 'INSERT' OR OLD.transferencia_id IS NULL) THEN
      NEW.origem := 'manual';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
