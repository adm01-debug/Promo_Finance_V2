CREATE OR REPLACE FUNCTION public.empresa_padrao_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT e.id
  FROM public.empresas e
  WHERE COALESCE(e.ativo, true)
  ORDER BY e.created_at ASC, e.id ASC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.provisionar_usuario(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_empresa uuid;
  v_email text;
  v_nome text;
  v_perfil_criado boolean := false;
  v_vinculo_criado boolean := false;
  v_role_criada boolean := false;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'usuario_invalido');
  END IF;

  SELECT u.email,
         COALESCE(
           NULLIF(u.raw_user_meta_data ->> 'full_name', ''),
           NULLIF(u.raw_user_meta_data ->> 'name', ''),
           split_part(COALESCE(u.email, ''), '@', 1)
         )
    INTO v_email, v_nome
  FROM auth.users u
  WHERE u.id = _user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'usuario_inexistente');
  END IF;

  v_empresa := public.empresa_padrao_id();

  -- 1. Perfil
  INSERT INTO public.profiles (id, user_id, email, full_name, empresa_id)
  VALUES (_user_id, _user_id, v_email, v_nome, v_empresa)
  ON CONFLICT (id) DO NOTHING;
  v_perfil_criado := FOUND;

  UPDATE public.profiles p
     SET empresa_id = v_empresa,
         user_id = COALESCE(p.user_id, _user_id)
   WHERE p.id = _user_id
     AND v_empresa IS NOT NULL
     AND p.empresa_id IS DISTINCT FROM v_empresa
     AND NOT EXISTS (
       SELECT 1 FROM public.user_empresas ue
       WHERE ue.user_id = _user_id AND ue.ativo
     );

  -- 2. Vínculo com a empresa padrão (menor privilégio)
  IF v_empresa IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = _user_id) THEN
    INSERT INTO public.user_empresas (user_id, empresa_id, role, is_default, provisioned_via, ativo)
    VALUES (_user_id, v_empresa, 'visualizador'::app_role, true, 'manual', true)
    ON CONFLICT (user_id, empresa_id) DO NOTHING;
    v_vinculo_criado := FOUND;
  END IF;

  -- 3. Papel global inicial (nunca rebaixa papéis existentes)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND COALESCE(ur.is_active, true)
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  ) THEN
    INSERT INTO public.user_roles (user_id, role, notes)
    VALUES (_user_id, 'visualizador'::app_role, 'Provisionamento automático no primeiro acesso')
    ON CONFLICT DO NOTHING;
    v_role_criada := FOUND;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'empresa_id', v_empresa,
    'perfil_criado', v_perfil_criado,
    'vinculo_criado', v_vinculo_criado,
    'role_criada', v_role_criada
  );
END;
$$;

REVOKE ALL ON FUNCTION public.provisionar_usuario(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.provisionar_usuario_atual()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória para provisionamento';
  END IF;
  RETURN public.provisionar_usuario(v_uid);
END;
$$;

REVOKE ALL ON FUNCTION public.provisionar_usuario_atual() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.provisionar_usuario_atual() TO authenticated;

-- Backfill dos usuários já existentes sem perfil/vínculo/papel
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT u.id
    FROM auth.users u
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
       OR NOT EXISTS (SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = u.id)
       OR NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND COALESCE(ur.is_active, true))
  LOOP
    PERFORM public.provisionar_usuario(r.id);
  END LOOP;
END;
$$;