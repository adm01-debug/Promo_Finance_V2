
-- Trigger para notificar usuários quando um filtro salvo for compartilhado com eles
-- (criação compartilhada OU papéis adicionados em update).

CREATE OR REPLACE FUNCTION public.fn_notificar_filtro_compartilhado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_roles public.app_role[];
  v_old_roles public.app_role[];
  v_owner_email TEXT;
  v_owner_name TEXT;
  v_should_notify BOOLEAN := false;
  v_is_new_share BOOLEAN := false;
  v_user RECORD;
BEGIN
  -- Apenas filtros compartilhados com empresa definida geram notificação
  IF NEW.is_shared IS NOT TRUE OR NEW.empresa_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_should_notify := true;
    v_is_new_share := true;
    v_target_roles := NEW.shared_with_roles;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Notificar quando o flag de compartilhamento foi ligado agora
    IF (OLD.is_shared IS NOT TRUE) AND NEW.is_shared = true THEN
      v_should_notify := true;
      v_is_new_share := true;
      v_target_roles := NEW.shared_with_roles;
    -- Ou quando novos papéis foram adicionados
    ELSIF NEW.shared_with_roles IS DISTINCT FROM OLD.shared_with_roles THEN
      v_should_notify := true;
      v_is_new_share := false;
      -- Diferença: papéis presentes em NEW mas não em OLD
      SELECT COALESCE(array_agg(r), ARRAY[]::public.app_role[])
      INTO v_target_roles
      FROM unnest(NEW.shared_with_roles) AS r
      WHERE r <> ALL(COALESCE(OLD.shared_with_roles, ARRAY[]::public.app_role[]));

      -- Caso especial: lista vazia em NEW = "todos do tenant".
      -- Se OLD tinha papéis específicos e agora abriu para todos, notifica todos
      -- que NÃO estavam cobertos antes.
      IF cardinality(NEW.shared_with_roles) = 0
         AND cardinality(COALESCE(OLD.shared_with_roles, ARRAY[]::public.app_role[])) > 0 THEN
        v_target_roles := ARRAY[]::public.app_role[]; -- sentinela = todos
      END IF;
    END IF;
  END IF;

  IF NOT v_should_notify THEN
    RETURN NEW;
  END IF;

  -- Dados do dono (para mensagem)
  SELECT email, COALESCE(full_name, email)
  INTO v_owner_email, v_owner_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Para cada usuário do tenant cujo papel está coberto, insere um alerta.
  -- Pula o próprio dono.
  FOR v_user IN
    SELECT DISTINCT ue.user_id, ue.role
    FROM public.user_empresas ue
    WHERE ue.empresa_id = NEW.empresa_id
      AND ue.ativo = true
      AND ue.user_id <> NEW.user_id
      AND (
        -- Lista vazia = todos do tenant
        cardinality(NEW.shared_with_roles) = 0
        OR ue.role = ANY(NEW.shared_with_roles)
      )
      AND (
        -- Em UPDATE com papéis específicos, só notifica quem entrou agora
        TG_OP = 'INSERT'
        OR v_is_new_share
        OR cardinality(v_target_roles) = 0
        OR ue.role = ANY(v_target_roles)
      )
  LOOP
    INSERT INTO public.alertas (
      tipo,
      titulo,
      mensagem,
      prioridade,
      entidade_tipo,
      entidade_id,
      acao_url,
      user_id
    ) VALUES (
      'filtro_compartilhado',
      CASE
        WHEN v_is_new_share THEN 'Novo filtro compartilhado com você'
        ELSE 'Acesso a filtro compartilhado atualizado'
      END,
      format(
        '%s compartilhou o filtro "%s" (%s) com o perfil %s.',
        COALESCE(v_owner_name, 'Um usuário'),
        NEW.name,
        NEW.entity_type,
        v_user.role
      ),
      'baixa'::public.prioridade_alerta,
      'saved_filter',
      NEW.id::text,
      '/admin/filtros-compartilhados',
      v_user.user_id
    );
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Falha na notificação não bloqueia escrita do filtro
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notificar_filtro_compartilhado ON public.saved_filters;
CREATE TRIGGER trg_notificar_filtro_compartilhado
  AFTER INSERT OR UPDATE OF is_shared, shared_with_roles, empresa_id
  ON public.saved_filters
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notificar_filtro_compartilhado();

COMMENT ON FUNCTION public.fn_notificar_filtro_compartilhado() IS
  'Insere alertas in-app para cada usuário do tenant cujo papel passou a ter acesso a um filtro compartilhado.';
