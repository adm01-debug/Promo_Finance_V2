-- 1) Marcador explícito de empresa padrão
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS is_padrao boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_empresas_is_padrao
  ON public.empresas ((true)) WHERE is_padrao;

-- Ao marcar uma nova padrão, desmarca as demais (mantém invariante de unicidade)
CREATE OR REPLACE FUNCTION public.empresas_unica_padrao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_padrao THEN
    IF NOT COALESCE(NEW.ativo, true) THEN
      RAISE EXCEPTION 'Uma empresa inativa não pode ser a empresa padrão';
    END IF;
    UPDATE public.empresas e
       SET is_padrao = false
     WHERE e.is_padrao AND e.id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_empresas_unica_padrao ON public.empresas;
CREATE TRIGGER trg_empresas_unica_padrao
  BEFORE INSERT OR UPDATE OF is_padrao, ativo ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.empresas_unica_padrao();

-- Seed: se ninguém está marcado, promove a ativa mais antiga
UPDATE public.empresas e
   SET is_padrao = true
 WHERE e.id = (
   SELECT id FROM public.empresas
    WHERE COALESCE(ativo, true)
    ORDER BY created_at ASC, id ASC
    LIMIT 1
 )
 AND NOT EXISTS (SELECT 1 FROM public.empresas x WHERE x.is_padrao);

-- 2) Resolução da empresa padrão: explícita > fallback histórico
CREATE OR REPLACE FUNCTION public.empresa_padrao_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT e.id FROM public.empresas e
      WHERE e.is_padrao AND COALESCE(e.ativo, true) LIMIT 1),
    (SELECT e.id FROM public.empresas e
      WHERE COALESCE(e.ativo, true)
      ORDER BY e.created_at ASC, e.id ASC LIMIT 1)
  )
$$;

-- 3) Provisionamento com trilha de auditoria (best-effort, nunca bloqueia login)
CREATE OR REPLACE FUNCTION public.provisionar_usuario(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa uuid;
  v_email text;
  v_nome text;
  v_perfil_criado boolean := false;
  v_vinculo_criado boolean := false;
  v_role_criada boolean := false;
  v_resultado jsonb;
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

  v_resultado := jsonb_build_object(
    'ok', true,
    'empresa_id', v_empresa,
    'perfil_criado', v_perfil_criado,
    'vinculo_criado', v_vinculo_criado,
    'role_criada', v_role_criada
  );

  -- 4. Trilha de auditoria — apenas quando houve efeito e sem quebrar o login
  IF v_perfil_criado OR v_vinculo_criado OR v_role_criada THEN
    BEGIN
      INSERT INTO public.audit_logs (user_id, user_email, action, table_name, record_id, new_data, details)
      VALUES (
        _user_id,
        v_email,
        'PROVISIONAMENTO_USUARIO',
        'user_empresas',
        _user_id::text,
        v_resultado,
        'Provisionamento automático no primeiro acesso'
      );
    EXCEPTION WHEN OTHERS THEN
      NULL; -- auditoria é best-effort
    END;
  END IF;

  RETURN v_resultado;
END;
$$;

-- 4) Somente admin altera a empresa padrão
CREATE OR REPLACE FUNCTION public.definir_empresa_padrao(_empresa_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ativo boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem definir a empresa padrão';
  END IF;

  SELECT COALESCE(ativo, true) INTO v_ativo FROM public.empresas WHERE id = _empresa_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empresa inexistente';
  END IF;
  IF NOT v_ativo THEN
    RAISE EXCEPTION 'Empresa inativa não pode ser a padrão';
  END IF;

  UPDATE public.empresas SET is_padrao = true WHERE id = _empresa_id;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data, details)
  VALUES (auth.uid(), 'EMPRESA_PADRAO_DEFINIDA', 'empresas', _empresa_id::text,
          jsonb_build_object('empresa_id', _empresa_id), 'Empresa padrão alterada');

  RETURN jsonb_build_object('ok', true, 'empresa_id', _empresa_id);
END;
$$;

REVOKE ALL ON FUNCTION public.definir_empresa_padrao(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.definir_empresa_padrao(uuid) TO authenticated;