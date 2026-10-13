-- Anexos financeiros: RLS por empresa nos METADADOS + resolução robusta de
-- empresa para os objetos do bucket `financeiro` (revisão do PR #151).
--
-- Quatro problemas corrigidos:
-- 1. As policies de `anexos_financeiros` filtravam por papel GLOBAL
--    (has_any_role em user_roles), não por empresa — um financeiro da
--    empresa A lia/alterava/apagava metadados de anexos da empresa B.
-- 2. `(storage.foldername(name))[2]::uuid` estourava erro quando uma pasta
--    legada não-UUID era inspecionada pela policy, quebrando a listagem.
-- 3. Ao excluir a entidade (conta/movimentação), a policy deixava de
--    resolver a empresa e os objetos viravam órfãos irremovíveis. A linha
--    de metadados sobrevive à entidade (não há FK), mas não guardava a
--    empresa — agora `anexos_financeiros.empresa_id` é persistido e o
--    fallback usa a empresa gravada, não a entidade excluída.
-- 4. Sem validação, uma linha de metadados forjada (storage_path de um
--    objeto de outra empresa + entidade própria) sequestraria o órfão.
--    O fallback exige que os segmentos do path batam com entidade_tipo/
--    entidade_id da linha, e o WITH CHECK exige `empresa_id` igual à
--    empresa real da entidade declarada — para forjar é preciso apontar
--    para a entidade excluída de B, cuja empresa resolve NULL e o insert
--    é negado.
--
-- Leitura (tabela e bucket): qualquer papel com vínculo ativo na empresa.
-- Escrita: vínculo ativo + papel em {admin, financeiro, operacional}
-- (mesmo conjunto PAPEIS_ESCRITA da edge upload-anexo).
-- Linhas cuja empresa histórica não pode ser reconstruída (entidade já
-- excluída antes desta migration) ficam com empresa_id NULL → invisíveis
-- para RLS; a limpeza fica para o service_role (admin-ops).
--
-- As duas funções resolveras ficam no schema `private`: o PostgREST só
-- expõe `public`, então nenhum papel chama os resolvedores via /rpc/ e
-- enumera vínculo entidade→empresa de outro tenant. EXECUTE continua
-- necessário para `authenticated` porque policies avaliam a função com
-- os privilégios de quem consulta — revogar de authenticated quebraria
-- as próprias policies.

CREATE SCHEMA IF NOT EXISTS private;
-- USAGE no schema é exigência separada do EXECUTE: sem ela a chamada das
-- funções dentro das policies falha com `permission denied for schema
-- private`. Não reabre exposição — o PostgREST continua servindo só
-- `public`.
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- Resolve a empresa dona de uma entidade anexável. Aceita singular e plural
-- (linhas legadas usavam 'conta_pagar' etc.). Tipo desconhecido ou entidade
-- inexistente/excluída → NULL (policy falha fechado).
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

-- A empresa passa a ser dado do próprio anexo — sem ela, a exclusão da
-- entidade tornava o objeto irremovível e o registro ilegível.
ALTER TABLE public.anexos_financeiros
  ADD COLUMN IF NOT EXISTS empresa_id uuid;

UPDATE public.anexos_financeiros a
   SET empresa_id = private.empresa_da_entidade_financeira(a.entidade_tipo, a.entidade_id)
 WHERE a.empresa_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_anexos_financeiros_storage_path
  ON public.anexos_financeiros (storage_path);

-- Resolve a empresa de um OBJETO do bucket pelo path
-- `<entidadeTipo>/<entidadeId>/<uuid>.<ext>`:
--  1. pela entidade do path — o segmento vira uuid (regex case-insensitive
--     cobre paths legados com UUID em maiúsculas; uuid::uuid normaliza o
--     caso) e a comparação id = uuid usa o índice primário, sem varredura
--     por policy avaliada e sem exceção de cast em pasta não-UUID;
--  2. se a entidade já foi excluída, pela empresa gravada na linha de
--     metadados que aponta para o objeto — exigindo que a linha declare a
--     mesma entidade do path, senão metadados forjados sequestrariam
--     anexos de outras empresas.
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
  )
  SELECT COALESCE(
    (SELECT empresa_id FROM pela_entidade),
    (SELECT a.empresa_id
       FROM public.anexos_financeiros a, v
      WHERE a.storage_path = _objeto
        AND a.entidade_tipo = v.tipo
        AND a.entidade_id = v.entidade_id
      LIMIT 1)
  );
$$;

-- Execução direta: anon e PUBLIC fora (mesmo fora do schema exposto, o
-- padrão do repo é revogar); authenticated e service_role precisam do
-- EXECUTE porque as policies abaixo invocam as funções com os privilégios
-- de quem executa a consulta.
REVOKE ALL ON FUNCTION private.empresa_da_entidade_financeira(text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.empresa_do_anexo_financeiro(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.empresa_da_entidade_financeira(text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.empresa_do_anexo_financeiro(text) TO authenticated, service_role;

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

-- =========================================================================
-- anexos_financeiros: substituir policies de papel global por escopo de
-- empresa. `empresa_id` declarado precisa bater com a empresa real da
-- entidade (impede atribuir o anexo a outra empresa), e um storage_path
-- informado precisa bater com a entidade declarada.
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
