-- Restore missing RPC functions for roles and permissions

-- 1. get_user_roles
CREATE OR REPLACE FUNCTION public.get_user_roles(user_id uuid)
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT role::text FROM public.user_roles
    WHERE user_roles.user_id = get_user_roles.user_id
    AND user_roles.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = _user_id
    AND user_roles.role = _role
    AND user_roles.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. get_user_permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id uuid)
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT p.name FROM public.permissions p
    JOIN public.role_permissions rp ON p.id = rp.permission_id
    JOIN public.user_roles ur ON rp.role = ur.role
    WHERE ur.user_id = get_user_permissions.user_id
    AND ur.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. has_permission
-- Guard: 42P13 — existing function may have different parameter name; drop first
DROP FUNCTION IF EXISTS public.has_permission(uuid, text);
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_name text)
RETURNS boolean AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to these functions
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

GRANT EXECUTE ON FUNCTION public.get_user_permissions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO service_role;