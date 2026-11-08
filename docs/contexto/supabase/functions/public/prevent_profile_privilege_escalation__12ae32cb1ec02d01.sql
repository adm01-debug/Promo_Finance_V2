CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Não é permitido alterar o perfil de acesso diretamente.';
    END IF;

    IF NEW.empresa_id IS DISTINCT FROM OLD.empresa_id THEN
      RAISE EXCEPTION 'Não é permitido alterar a empresa do perfil diretamente.';
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Não é permitido alterar identificadores do perfil.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
