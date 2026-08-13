
-- Fix Function Search Path Mutable warnings: set search_path on 6 functions

CREATE OR REPLACE FUNCTION public.gerar_numero_acordo()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    RETURN 'AC-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_roles(user_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN ARRAY(
    SELECT role::text FROM public.user_roles
    WHERE user_roles.user_id = get_user_roles.user_id
      AND user_roles.is_active = true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT p.name FROM public.permissions p
    JOIN public.role_permissions rp ON p.id = rp.permission_id
    JOIN public.user_roles ur ON rp.role = ur.role
    WHERE ur.user_id = get_user_permissions.user_id
      AND ur.is_active = true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = _user_id
      AND user_roles.role = _role
      AND user_roles.is_active = true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.permissions p
    JOIN public.role_permissions rp ON p.id = rp.permission_id
    JOIN public.user_roles ur ON rp.role = ur.role
    WHERE ur.user_id = _user_id
      AND p.name = _permission_name
      AND ur.is_active = true
  );
END;
$function$;
