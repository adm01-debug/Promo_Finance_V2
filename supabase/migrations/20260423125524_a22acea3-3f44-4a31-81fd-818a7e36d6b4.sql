-- Adiciona regras de severidade crítica e tipos de eventos por assinatura.
-- severidades_criticas: subset de severidades que devem ser tratadas como
-- "críticas" (eleva prioridade do push e marca o toast). Default vazio = usa
-- a lógica antiga (apenas 'critica' é crítica).
-- tipos_eventos_ativos: lista de tipo_anomalia (ou tipo de evento) que
-- DISPARAM o alerta. Lista vazia = todos os tipos disparam (compat).
ALTER TABLE public.saved_filter_subscriptions
  ADD COLUMN IF NOT EXISTS severidades_criticas TEXT[] NOT NULL DEFAULT ARRAY['critica']::TEXT[],
  ADD COLUMN IF NOT EXISTS tipos_eventos_ativos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Validação: severidades_criticas só aceita valores conhecidos.
CREATE OR REPLACE FUNCTION public.validate_saved_filter_subscription_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_saved_filter_subscription_rules
  ON public.saved_filter_subscriptions;
CREATE TRIGGER trg_validate_saved_filter_subscription_rules
  BEFORE INSERT OR UPDATE ON public.saved_filter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_saved_filter_subscription_rules();