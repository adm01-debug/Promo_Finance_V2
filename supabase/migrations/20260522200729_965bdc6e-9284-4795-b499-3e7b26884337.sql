DROP FUNCTION IF EXISTS public.has_role(uuid, text);
DROP FUNCTION IF EXISTS public.get_user_roles(uuid);
DROP FUNCTION IF EXISTS public.get_user_permissions(uuid);

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = has_role.user_id
    AND user_roles.role = has_role.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_roles(user_id uuid)
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT role FROM public.user_roles
    WHERE user_roles.user_id = get_user_roles.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id uuid)
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT permission FROM public.role_permissions
    JOIN public.user_roles ON role_permissions.role = user_roles.role
    WHERE user_roles.user_id = get_user_permissions.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;