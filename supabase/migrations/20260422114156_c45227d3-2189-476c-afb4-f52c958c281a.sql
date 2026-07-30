ALTER TABLE public.user_anomalia_preferences
  ADD COLUMN IF NOT EXISTS toast_severidades_ativas TEXT[]
    NOT NULL DEFAULT ARRAY['critica','alta']::TEXT[],
  ADD COLUMN IF NOT EXISTS toast_duracao_segundos INT
    NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS toast_acoes JSONB
    NOT NULL DEFAULT '{"drill_down":true,"abrir_pagina":true,"copiar_id":false,"marcar_lida":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS drawer_acoes JSONB
    NOT NULL DEFAULT '{"abrir_entidade":true,"pagina_completa":true,"copiar_id":false,"marcar_lida":false}'::jsonb;

CREATE OR REPLACE FUNCTION public.validate_user_anomalia_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  sev TEXT;
BEGIN
  IF NEW.toast_duracao_segundos < 3 OR NEW.toast_duracao_segundos > 30 THEN
    RAISE EXCEPTION 'toast_duracao_segundos deve estar entre 3 e 30 segundos';
  END IF;

  IF NEW.toast_severidades_ativas IS NOT NULL THEN
    FOREACH sev IN ARRAY NEW.toast_severidades_ativas LOOP
      IF sev NOT IN ('baixa','media','alta','critica') THEN
        RAISE EXCEPTION 'Severidade invalida em toast_severidades_ativas: %', sev;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_user_anomalia_preferences
  ON public.user_anomalia_preferences;

CREATE TRIGGER trg_validate_user_anomalia_preferences
  BEFORE INSERT OR UPDATE ON public.user_anomalia_preferences
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_anomalia_preferences();