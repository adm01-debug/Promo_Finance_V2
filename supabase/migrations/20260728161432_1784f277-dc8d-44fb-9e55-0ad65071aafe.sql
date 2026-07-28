CREATE OR REPLACE FUNCTION public.duplicate_saved_filter(_source_id uuid, _new_name text DEFAULT '')
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_source public.saved_filters%ROWTYPE;
  v_name text;
  v_new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- RLS de SELECT garante que só presets acessíveis sejam encontrados.
  SELECT * INTO v_source FROM public.saved_filters WHERE id = _source_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Preset não encontrado ou sem acesso';
  END IF;

  v_name := NULLIF(btrim(coalesce(_new_name, '')), '');
  IF v_name IS NULL THEN
    v_name := v_source.name || ' (cópia)';
  END IF;

  INSERT INTO public.saved_filters (
    user_id, created_by, entity_type, name, filters, is_default, is_shared, empresa_id, shared_with_roles
  ) VALUES (
    auth.uid(), auth.uid(), v_source.entity_type, v_name, v_source.filters, false, false, NULL, '{}'::text[]
  )
  ON CONFLICT (user_id, entity_type, name) DO UPDATE SET filters = EXCLUDED.filters, updated_at = now()
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.duplicate_saved_filter(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.duplicate_saved_filter(uuid, text) TO authenticated;