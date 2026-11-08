CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.empresa_da_entidade_financeira(_tipo text, _entidade uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _tipo IN ('contas_pagar', 'conta_pagar') THEN
      (SELECT cp.empresa_id FROM public.contas_pagar cp WHERE cp.id = _entidade)
    WHEN _tipo IN ('contas_receber', 'conta_receber') THEN
      (SELECT cr.empresa_id FROM public.contas_receber cr WHERE cr.id = _entidade)
    WHEN _tipo IN ('movimentacoes', 'movimentacao') THEN
      (SELECT mv.empresa_id FROM public.movimentacoes mv WHERE mv.id = _entidade)
  END;
$$;

ALTER TABLE public.anexos_financeiros
  ADD COLUMN IF NOT EXISTS empresa_id uuid;

CREATE INDEX IF NOT EXISTS idx_anexos_financeiros_storage_path
  ON public.anexos_financeiros (storage_path);

CREATE INDEX IF NOT EXISTS idx_anexos_financeiros_entidade
  ON public.anexos_financeiros (entidade_id, entidade_tipo);

CREATE OR REPLACE FUNCTION private.empresa_do_anexo_financeiro(_objeto text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  WITH p AS (
    SELECT
      (storage.foldername(_objeto))[1] AS tipo,
      (storage.foldername(_objeto))[2] AS id_txt
  ),
  v AS (
    SELECT
      p.tipo,
      CASE
        WHEN p.id_txt ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN p.id_txt::uuid
      END AS entidade_id
    FROM p
  ),
  pela_entidade AS (
    SELECT CASE
      WHEN v.tipo IN ('contas_pagar', 'conta_pagar') THEN
        (SELECT cp.empresa_id FROM public.contas_pagar cp WHERE cp.id = v.entidade_id)
      WHEN v.tipo IN ('contas_receber', 'conta_receber') THEN
        (SELECT cr.empresa_id FROM public.contas_receber cr WHERE cr.id = v.entidade_id)
      WHEN v.tipo IN ('movimentacoes', 'movimentacao') THEN
        (SELECT mv.empresa_id FROM public.movimentacoes mv WHERE mv.id = v.entidade_id)
    END AS empresa_id
    FROM v
  ),
  pelo_metadado AS (
    SELECT a.empresa_id
    FROM public.anexos_financeiros a, v
    WHERE a.storage_path = _objeto
      AND a.entidade_tipo = v.tipo
      AND a.entidade_id = v.entidade_id
    ORDER BY a.empresa_id IS NULL
    LIMIT 1
  )
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM pelo_metadado) THEN (SELECT empresa_id FROM pelo_metadado)
    ELSE (SELECT empresa_id FROM pela_entidade)
  END;
$$;

REVOKE ALL ON FUNCTION private.empresa_da_entidade_financeira(text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.empresa_do_anexo_financeiro(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.empresa_da_entidade_financeira(text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.empresa_do_anexo_financeiro(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "anexos_financeiro_leitura_autenticada" ON storage.objects;
CREATE POLICY "anexos_financeiro_leitura_autenticada" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'financeiro'
    AND EXISTS (
      SELECT 1
      FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.ativo
        AND ue.empresa_id = private.empresa_do_anexo_financeiro(name)
    )
  );

DROP POLICY IF EXISTS "anexos_financeiro_remocao_autenticada" ON storage.objects;
CREATE POLICY "anexos_financeiro_remocao_autenticada" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'financeiro'
    AND EXISTS (
      SELECT 1
      FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.ativo
        AND ue.role IN ('admin', 'financeiro', 'operacional')
        AND ue.empresa_id = private.empresa_do_anexo_financeiro(name)
    )
  );

DROP POLICY IF EXISTS "Auth users can read anexos_financeiros" ON public.anexos_financeiros;
DROP POLICY IF EXISTS "Auth users can insert anexos_financeiros" ON public.anexos_financeiros;
DROP POLICY IF EXISTS "Admin/financeiro can update anexos_financeiros" ON public.anexos_financeiros;
DROP POLICY IF EXISTS "Admin/financeiro can delete anexos_financeiros" ON public.anexos_financeiros;
DROP POLICY IF EXISTS "Owner manage anexos" ON public.anexos_financeiros;

CREATE POLICY "anexos_financeiros_leitura_empresa" ON public.anexos_financeiros
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.ativo
        AND ue.empresa_id = anexos_financeiros.empresa_id
    )
  );

CREATE POLICY "anexos_financeiros_insercao_empresa" ON public.anexos_financeiros
  FOR INSERT TO authenticated
  WITH CHECK (
    empresa_id IS NOT NULL
    AND empresa_id = private.empresa_da_entidade_financeira(entidade_tipo, entidade_id)
    AND (storage_path IS NULL
         OR starts_with(lower(storage_path),
                        lower(entidade_tipo || '/' || entidade_id::text || '/')))
    AND EXISTS (
      SELECT 1
      FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.ativo
        AND ue.role IN ('admin', 'financeiro', 'operacional')
        AND ue.empresa_id = anexos_financeiros.empresa_id
    )
  );

CREATE POLICY "anexos_financeiros_atualizacao_empresa" ON public.anexos_financeiros
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.ativo
        AND ue.role IN ('admin', 'financeiro', 'operacional')
        AND ue.empresa_id = anexos_financeiros.empresa_id
    )
  )
  WITH CHECK (
    empresa_id IS NOT NULL
    AND empresa_id = private.empresa_da_entidade_financeira(entidade_tipo, entidade_id)
    AND (storage_path IS NULL
         OR starts_with(lower(storage_path),
                        lower(entidade_tipo || '/' || entidade_id::text || '/')))
    AND EXISTS (
      SELECT 1
      FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.ativo
        AND ue.role IN ('admin', 'financeiro', 'operacional')
        AND ue.empresa_id = anexos_financeiros.empresa_id
    )
  );

CREATE POLICY "anexos_financeiros_remocao_empresa" ON public.anexos_financeiros
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.ativo
        AND ue.role IN ('admin', 'financeiro', 'operacional')
        AND ue.empresa_id = anexos_financeiros.empresa_id
    )
  );

CREATE OR REPLACE FUNCTION private.sincroniza_empresa_dos_anexos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.anexos_financeiros
     SET empresa_id = NEW.empresa_id
   WHERE entidade_id = NEW.id
     AND entidade_tipo IN (TG_ARGV[0], TG_ARGV[1]);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.sincroniza_empresa_dos_anexos() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_anexos_sync_empresa ON public.contas_pagar;
CREATE TRIGGER trg_anexos_sync_empresa
  AFTER UPDATE OF empresa_id ON public.contas_pagar
  FOR EACH ROW
  WHEN (OLD.empresa_id IS DISTINCT FROM NEW.empresa_id)
  EXECUTE FUNCTION private.sincroniza_empresa_dos_anexos('contas_pagar', 'conta_pagar');

DROP TRIGGER IF EXISTS trg_anexos_sync_empresa ON public.contas_receber;
CREATE TRIGGER trg_anexos_sync_empresa
  AFTER UPDATE OF empresa_id ON public.contas_receber
  FOR EACH ROW
  WHEN (OLD.empresa_id IS DISTINCT FROM NEW.empresa_id)
  EXECUTE FUNCTION private.sincroniza_empresa_dos_anexos('contas_receber', 'conta_receber');

DROP TRIGGER IF EXISTS trg_anexos_sync_empresa ON public.movimentacoes;
CREATE TRIGGER trg_anexos_sync_empresa
  AFTER UPDATE OF empresa_id ON public.movimentacoes
  FOR EACH ROW
  WHEN (OLD.empresa_id IS DISTINCT FROM NEW.empresa_id)
  EXECUTE FUNCTION private.sincroniza_empresa_dos_anexos('movimentacoes', 'movimentacao');

CREATE OR REPLACE FUNCTION private.atribui_empresa_do_anexo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_empresa := private.empresa_da_entidade_financeira(NEW.entidade_tipo, NEW.entidade_id);
  ELSE
    CASE NEW.entidade_tipo
      WHEN 'contas_pagar', 'conta_pagar' THEN
        SELECT cp.empresa_id INTO v_empresa
          FROM public.contas_pagar cp WHERE cp.id = NEW.entidade_id FOR UPDATE;
      WHEN 'contas_receber', 'conta_receber' THEN
        SELECT cr.empresa_id INTO v_empresa
          FROM public.contas_receber cr WHERE cr.id = NEW.entidade_id FOR UPDATE;
      WHEN 'movimentacoes', 'movimentacao' THEN
        SELECT mv.empresa_id INTO v_empresa
          FROM public.movimentacoes mv WHERE mv.id = NEW.entidade_id FOR UPDATE;
    END CASE;
    IF v_empresa IS NOT NULL AND NEW.user_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM public.user_empresas ue
      WHERE ue.user_id = NEW.user_id
        AND ue.ativo
        AND ue.role IN ('admin', 'financeiro', 'operacional')
        AND ue.empresa_id = v_empresa
    ) THEN
      RAISE EXCEPTION 'anexos_financeiros: usuario % sem vinculo de escrita na empresa % da entidade',
        NEW.user_id, v_empresa
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  NEW.empresa_id := COALESCE(v_empresa, NEW.empresa_id);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.atribui_empresa_do_anexo() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_anexos_atribui_empresa ON public.anexos_financeiros;
CREATE TRIGGER trg_anexos_atribui_empresa
  BEFORE INSERT OR UPDATE OF entidade_tipo, entidade_id ON public.anexos_financeiros
  FOR EACH ROW
  EXECUTE FUNCTION private.atribui_empresa_do_anexo();

UPDATE public.anexos_financeiros
   SET storage_path = split_part(substring(url from '/financeiro/(.+)$'), '?', 1)
 WHERE storage_path IS NULL
   AND url ~ '/financeiro/.+';

UPDATE public.anexos_financeiros a
   SET empresa_id = COALESCE(
     private.empresa_da_entidade_financeira(a.entidade_tipo, a.entidade_id),
     a.empresa_id
   )
 WHERE true;
