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
      p.id_txt,
      substring(_objeto from char_length(p.tipo) + char_length(p.id_txt) + 3) AS resto,
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
    WHERE (
        a.storage_path = _objeto
        OR a.storage_path =
           (v.tipo || '/' || split_part(a.storage_path, '/', 2) || '/' || v.resto)
      )
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

CREATE INDEX IF NOT EXISTS idx_anexos_financeiros_storage_path
  ON public.anexos_financeiros (storage_path);
