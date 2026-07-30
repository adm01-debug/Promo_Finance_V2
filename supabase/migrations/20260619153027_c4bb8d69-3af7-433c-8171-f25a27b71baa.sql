CREATE OR REPLACE FUNCTION public.profile_sensitive_fields_unchanged(
  _profile_id uuid,
  _user_id uuid,
  _role text,
  _empresa_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = _profile_id
      AND p.user_id IS NOT DISTINCT FROM _user_id
      AND p.role IS NOT DISTINCT FROM _role
      AND p.empresa_id IS NOT DISTINCT FROM _empresa_id
  );
$$;

REVOKE ALL ON FUNCTION public.profile_sensitive_fields_unchanged(uuid, uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profile_sensitive_fields_unchanged(uuid, uuid, text, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR auth.uid() = user_id)
  WITH CHECK (
    (auth.uid() = id OR auth.uid() = user_id)
    AND public.profile_sensitive_fields_unchanged(id, user_id, role, empresa_id)
  );