
CREATE OR REPLACE FUNCTION public.audit_trigger_generic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','pg_catalog'
AS $$
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
      TG_TABLE_NAME,
      v_record_id,
      TG_OP,
      'auto:' || TG_TABLE_NAME || ':' || TG_OP,
      v_old,
      v_new,
      auth.uid(),
      COALESCE((auth.jwt()->>'email'), 'system'),
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Nunca bloquear operação por falha de auditoria
    NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_trigger_generic() FROM PUBLIC;

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'sso_providers',
    'security_settings',
    'regras_roteamento_financeiro',
    'role_permissions',
    'permissions',
    'user_roles',
    'allowed_ips',
    'allowed_countries',
    'ip_whitelist',
    'geo_blocks',
    'risk_rules',
    'alert_configurations'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
               WHERE n.nspname='public' AND c.relname=t AND c.relkind='r') THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
      EXECUTE format(
        'CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_generic()',
        t, t
      );
    END IF;
  END LOOP;
END $$;

INSERT INTO public.audit_logs (table_name, action, details, created_at)
VALUES ('_meta_hardening', 'ITEM_35', 'generic_audit_triggers_installed', now());
