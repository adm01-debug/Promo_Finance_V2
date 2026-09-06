-- Sprint 2 / Item 5: audit_trigger_generic emite WARNING em vez de silenciar erros
CREATE OR REPLACE FUNCTION public.audit_trigger_generic()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_old JSONB;
  v_new JSONB;
  v_record_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
    BEGIN v_record_id := (OLD).id; EXCEPTION WHEN OTHERS THEN v_record_id := NULL; END;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    BEGIN v_record_id := (NEW).id; EXCEPTION WHEN OTHERS THEN v_record_id := NULL; END;
    IF v_old = v_new THEN
      RETURN NEW;
    END IF;
  ELSE
    v_old := NULL;
    v_new := to_jsonb(NEW);
    BEGIN v_record_id := (NEW).id; EXCEPTION WHEN OTHERS THEN v_record_id := NULL; END;
  END IF;

  BEGIN
    INSERT INTO public.audit_logs (
      table_name, record_id, action, details, old_data, new_data, user_id, user_email, created_at
    ) VALUES (
      TG_TABLE_NAME, v_record_id, TG_OP,
      'auto:' || TG_TABLE_NAME || ':' || TG_OP,
      v_old, v_new,
      auth.uid(),
      COALESCE((auth.jwt()->>'email'), 'system'),
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Não bloqueia a operação, mas registra o problema no log do Postgres.
    -- Isso preserva SLA de escrita e garante rastreabilidade LGPD/SOX.
    RAISE WARNING 'audit_trigger_generic falhou em % (%): % / %',
      TG_TABLE_NAME, TG_OP, SQLSTATE, SQLERRM;
  END;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;

-- Sprint 2 / Item 7: normalizar email em login_attempts e adicionar CHECK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'login_attempts' AND column_name = 'email'
  ) THEN
    UPDATE public.login_attempts
       SET email = lower(email)
     WHERE email IS NOT NULL AND email <> lower(email);

    ALTER TABLE public.login_attempts
      DROP CONSTRAINT IF EXISTS login_attempts_email_lowercase_chk;

    ALTER TABLE public.login_attempts
      ADD CONSTRAINT login_attempts_email_lowercase_chk
      CHECK (email IS NULL OR email = lower(email)) NOT VALID;

    ALTER TABLE public.login_attempts VALIDATE CONSTRAINT login_attempts_email_lowercase_chk;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') THEN
    INSERT INTO public.audit_logs (table_name, action, details, user_email, created_at)
    VALUES ('multi', 'SPRINT2_5_7', 'audit_trigger emite WARNING; login_attempts.email normalizado + CHECK', 'system', now());
  END IF;
END $$;
