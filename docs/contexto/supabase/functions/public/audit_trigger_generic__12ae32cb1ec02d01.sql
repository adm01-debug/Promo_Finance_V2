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
$function$
