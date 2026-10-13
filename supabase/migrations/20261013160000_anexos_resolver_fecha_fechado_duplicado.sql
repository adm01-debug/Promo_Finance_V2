-- Anexos financeiros: fecha o bypass por metadado duplicado no resolver do
-- bucket `financeiro` (Devin Review pós-#152).
--
-- Cenário: entidade excluída deixa órfão com metadado de empresa NULL; o UUID
-- é reutilizado por uma entidade da empresa C e um usuário de C cria UMA
-- SEGUNDA linha de metadados apontando para o mesmo storage_path + entidade
-- (o insert passa porque a entidade dele é viva e o path bate). A versão
-- anterior preferia a linha com empresa preenchida e liberava o objeto
-- histórico para C.
--
-- Regra agora: existe linha de metadado para o path → ela decide; QUALQUER
-- linha com empresa NULL ou MAIS DE UMA empresa distinta entre as linhas →
-- NULL (invisível para RLS; a limpeza fica com o service_role). Só quando
-- todas as linhas concordam numa única empresa ela é devolvida. Sem linha
-- nenhuma, a entidade viva resolve como antes.
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
    SELECT
      count(*) AS linhas,
      count(*) FILTER (WHERE a.empresa_id IS NULL) AS sem_empresa,
      count(DISTINCT a.empresa_id) AS empresas_distintas,
      (array_agg(a.empresa_id) FILTER (WHERE a.empresa_id IS NOT NULL))[1] AS empresa_id
    FROM public.anexos_financeiros a, v
    WHERE a.storage_path = _objeto
      AND a.entidade_tipo = v.tipo
      AND a.entidade_id = v.entidade_id
  )
  SELECT CASE
    WHEN (SELECT linhas FROM pelo_metadado) = 0
      THEN (SELECT empresa_id FROM pela_entidade)
    WHEN (SELECT sem_empresa FROM pelo_metadado) > 0
      OR (SELECT empresas_distintas FROM pelo_metadado) > 1
      THEN NULL
    ELSE (SELECT empresa_id FROM pelo_metadado)
  END;
$$;
