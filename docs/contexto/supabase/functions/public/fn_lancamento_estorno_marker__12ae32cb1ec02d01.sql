CREATE OR REPLACE FUNCTION public.fn_lancamento_estorno_marker()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND current_user IN ('authenticated', 'anon')
  THEN
    IF position('[estornado pela exclusão da movimentação]' in NEW.historico) > 0 THEN
      NEW.historico := replace(NEW.historico, ' [estornado pela exclusão da movimentação]', '');
    END IF;
    IF position('[substituído pela alteração da movimentação]' in NEW.historico) > 0 THEN
      NEW.historico := replace(NEW.historico, ' [substituído pela alteração da movimentação]', '');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
