ALTER TABLE public.saved_filter_subscriptions
  ADD COLUMN IF NOT EXISTS rate_limit_max integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS rate_limit_window_min integer NOT NULL DEFAULT 10;

CREATE OR REPLACE FUNCTION public.validate_saved_filter_subscription_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  sev TEXT;
BEGIN
  IF NEW.severidades_criticas IS NOT NULL THEN
    FOREACH sev IN ARRAY NEW.severidades_criticas LOOP
      IF sev NOT IN ('baixa','media','alta','critica') THEN
        RAISE EXCEPTION 'Severidade invalida em severidades_criticas: %', sev;
      END IF;
    END LOOP;
  END IF;
  IF NEW.rate_limit_max IS NOT NULL AND (NEW.rate_limit_max < 1 OR NEW.rate_limit_max > 100) THEN
    RAISE EXCEPTION 'rate_limit_max deve estar entre 1 e 100';
  END IF;
  IF NEW.rate_limit_window_min IS NOT NULL AND (NEW.rate_limit_window_min < 1 OR NEW.rate_limit_window_min > 1440) THEN
    RAISE EXCEPTION 'rate_limit_window_min deve estar entre 1 e 1440 minutos';
  END IF;
  RETURN NEW;
END;
$function$;