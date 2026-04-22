
-- 1) Novas colunas
ALTER TABLE public.saved_filters
  ADD COLUMN IF NOT EXISTS empresa_id uuid NULL,
  ADD COLUMN IF NOT EXISTS shared_with_roles public.app_role[] NOT NULL DEFAULT ARRAY[]::public.app_role[],
  ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid NULL;

-- Backfill: created_by = user_id
UPDATE public.saved_filters SET created_by = user_id WHERE created_by IS NULL;

-- Index para lookups por empresa
CREATE INDEX IF NOT EXISTS idx_saved_filters_empresa_shared
  ON public.saved_filters (empresa_id, entity_type)
  WHERE is_shared = true;

-- 2) Função helper: papel do usuário na empresa
CREATE OR REPLACE FUNCTION public.user_role_in_empresa(_user_id uuid, _empresa_id uuid)
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_empresas
  WHERE user_id = _user_id AND empresa_id = _empresa_id AND ativo = true
  LIMIT 1;
$$;

-- 3) Atualiza políticas RLS
DROP POLICY IF EXISTS "Users can view own filters" ON public.saved_filters;
DROP POLICY IF EXISTS "Users can insert own filters" ON public.saved_filters;
DROP POLICY IF EXISTS "Users can update own filters" ON public.saved_filters;
DROP POLICY IF EXISTS "Users can delete own filters" ON public.saved_filters;

-- SELECT: próprios + compartilhados na mesma empresa cujo papel está na lista
CREATE POLICY "saved_filters_select"
  ON public.saved_filters FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      is_shared = true
      AND empresa_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.user_empresas ue
        WHERE ue.user_id = auth.uid()
          AND ue.empresa_id = saved_filters.empresa_id
          AND ue.ativo = true
          AND (
            cardinality(saved_filters.shared_with_roles) = 0
            OR ue.role = ANY(saved_filters.shared_with_roles)
          )
      )
    )
  );

-- INSERT: usuário cria para si; se compartilhar, precisa pertencer à empresa
CREATE POLICY "saved_filters_insert"
  ON public.saved_filters FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (created_by IS NULL OR created_by = auth.uid())
    AND (
      is_shared = false
      OR (
        empresa_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.user_empresas ue
          WHERE ue.user_id = auth.uid()
            AND ue.empresa_id = saved_filters.empresa_id
            AND ue.ativo = true
        )
      )
    )
  );

-- UPDATE: somente criador (ou dono original)
CREATE POLICY "saved_filters_update"
  ON public.saved_filters FOR UPDATE
  USING (auth.uid() = COALESCE(created_by, user_id))
  WITH CHECK (auth.uid() = COALESCE(created_by, user_id));

-- DELETE: somente criador
CREATE POLICY "saved_filters_delete"
  ON public.saved_filters FOR DELETE
  USING (auth.uid() = COALESCE(created_by, user_id));

-- 4) Função para duplicar um filtro acessível para o usuário atual
CREATE OR REPLACE FUNCTION public.duplicate_saved_filter(
  _source_id uuid,
  _new_name text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_src public.saved_filters%ROWTYPE;
  v_uid uuid := auth.uid();
  v_new_id uuid;
  v_can_see boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_src FROM public.saved_filters WHERE id = _source_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Filtro não encontrado';
  END IF;

  -- Reusa a checagem de visibilidade da política
  SELECT (
    v_src.user_id = v_uid
    OR (
      v_src.is_shared = true
      AND v_src.empresa_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.user_empresas ue
        WHERE ue.user_id = v_uid
          AND ue.empresa_id = v_src.empresa_id
          AND ue.ativo = true
          AND (
            cardinality(v_src.shared_with_roles) = 0
            OR ue.role = ANY(v_src.shared_with_roles)
          )
      )
    )
  ) INTO v_can_see;

  IF NOT v_can_see THEN
    RAISE EXCEPTION 'Sem acesso ao filtro de origem';
  END IF;

  INSERT INTO public.saved_filters (
    user_id, created_by, entity_type, name, filters, is_default,
    empresa_id, shared_with_roles, is_shared
  ) VALUES (
    v_uid, v_uid, v_src.entity_type,
    COALESCE(NULLIF(trim(_new_name), ''), v_src.name || ' (cópia)'),
    v_src.filters,
    false,
    NULL, ARRAY[]::public.app_role[], false
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;
