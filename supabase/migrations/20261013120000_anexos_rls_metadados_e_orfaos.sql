-- Anexos financeiros: RLS por empresa nos METADADOS + resolução robusta de
-- empresa para os objetos do bucket `financeiro` (revisão do PR #151).
--
-- Três problemas corrigidos:
-- 1. As policies de `anexos_financeiros` filtravam por papel GLOBAL
--    (has_any_role em user_roles), não por empresa — um financeiro da
--    empresa A lia/alterava/apagava metadados de anexos da empresa B.
-- 2. `(storage.foldername(name))[2]::uuid` estourava erro quando uma pasta
--    legada não-UUID era inspecionada pela policy, quebrando a listagem.
-- 3. Ao excluir a entidade (conta/movimentação), a policy deixava de
--    resolver a empresa e os objetos viravam órfãos irremovíveis — a
--    resolução agora cai na linha de `anexos_financeiros.storage_path`.
--
-- Leitura (tabela e bucket): qualquer papel com vínculo ativo na empresa.
-- Escrita: vínculo ativo + papel em {admin, financeiro, operacional}
-- (mesmo conjunto PAPEIS_ESCRITA da edge upload-anexo).

-- Resolve a empresa dona de uma entidade anexável. Aceita singular e plural
-- (linhas legadas usavam 'conta_pagar' etc.). Tipo desconhecido → NULL
-- (policy falha fechado: ninguém além do service_role enxerga a linha).
CREATE OR REPLACE FUNCTION public.empresa_da_entidade_financeira(_tipo text, _entidade uuid)
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

-- Resolve a empresa de um OBJETO do bucket pelo path
-- `<entidadeTipo>/<entidadeId>/<uuid>.<ext>`:
--  1. pela entidade do path (comparando id::text — pasta não-UUID simples-
--     mente não casa, sem exceção de cast);
--  2. se a entidade já foi excluída, pela linha de metadados que aponta
--     para o objeto (anexos_financeiros.storage_path) — cobre o órfão.
CREATE OR REPLACE FUNCTION public.empresa_do_anexo_financeiro(_objeto text)
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
  pela_entidade AS (
    SELECT CASE
      WHEN p.tipo IN ('contas_pagar', 'conta_pagar') THEN
        (SELECT cp.empresa_id FROM public.contas_pagar cp WHERE cp.id::text = p.id_txt)
      WHEN p.tipo IN ('contas_receber', 'conta_receber') THEN
        (SELECT cr.empresa_id FROM public.contas_receber cr WHERE cr.id::text = p.id_txt)
      WHEN p.tipo IN ('movimentacoes', 'movimentacao') THEN
        (SELECT mv.empresa_id FROM public.movimentacoes mv WHERE mv.id::text = p.id_txt)
    END AS empresa_id
    FROM p
  )
  SELECT COALESCE(
    (SELECT empresa_id FROM pela_entidade),
    (SELECT public.empresa_da_entidade_financeira(a.entidade_tipo, a.entidade_id)
       FROM public.anexos_financeiros a
      WHERE a.storage_path = _objeto
      LIMIT 1)
  );
$$;

-- =========================================================================
-- storage.objects (bucket financeiro): recriar com a resolução robusta.
-- =========================================================================

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
        AND ue.empresa_id = public.empresa_do_anexo_financeiro(name)
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
        AND ue.empresa_id = public.empresa_do_anexo_financeiro(name)
    )
  );

-- =========================================================================
-- anexos_financeiros: substituir policies de papel global por escopo de
-- empresa (a resolução é a mesma função — entidade_tipo/entidade_id).
-- =========================================================================

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
        AND ue.empresa_id = public.empresa_da_entidade_financeira(entidade_tipo, entidade_id)
    )
  );

CREATE POLICY "anexos_financeiros_insercao_empresa" ON public.anexos_financeiros
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.ativo
        AND ue.role IN ('admin', 'financeiro', 'operacional')
        AND ue.empresa_id = public.empresa_da_entidade_financeira(entidade_tipo, entidade_id)
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
        AND ue.empresa_id = public.empresa_da_entidade_financeira(entidade_tipo, entidade_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.ativo
        AND ue.role IN ('admin', 'financeiro', 'operacional')
        AND ue.empresa_id = public.empresa_da_entidade_financeira(entidade_tipo, entidade_id)
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
        AND ue.empresa_id = public.empresa_da_entidade_financeira(entidade_tipo, entidade_id)
    )
  );
