-- 1) Unicidade da alíquota geral por município/vigência (item_lista_id NULL)
CREATE UNIQUE INDEX IF NOT EXISTS aliq_iss_mun_geral_unq
  ON public.aliquotas_iss_municipal (codigo_ibge, vigente_de)
  WHERE item_lista_id IS NULL;

COMMENT ON COLUMN public.aliquotas_iss_municipal.item_lista_id IS
  'NULL = alíquota geral do município (fallback). Preenchido = alíquota específica do item da LC 116/2003.';

-- 2) Validador: substitui o aviso "sem vínculo com item" pela regra correta
CREATE OR REPLACE FUNCTION public.validar_catalogos_tributarios()
RETURNS TABLE(invariante text, severidade text, afetados bigint, detalhe text)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $fn$
BEGIN
  RETURN QUERY
  WITH achados AS (
    SELECT 'ufs_incompletas'::text AS inv, 'critical'::text AS sev,
           GREATEST(27 - (SELECT count(*) FROM public.ufs), 0)::bigint AS qtd,
           'catálogo de UFs deve conter as 27 unidades federativas'::text AS det
    UNION ALL
    SELECT 'ufs_flag_fcp_incoerente', 'warning',
           (SELECT count(*) FROM public.ufs WHERE possui_fcp <> (aliquota_fcp > 0)),
           'possui_fcp diverge de aliquota_fcp > 0'
    UNION ALL
    SELECT 'uf_sem_aliquota_interna_padrao', 'info',
           (SELECT count(*) FROM public.ufs u
             WHERE NOT EXISTS (SELECT 1 FROM public.aliquotas_internas_uf a
                                WHERE a.uf = u.sigla
                                  AND a.categoria_produto IN ('GERAL','padrao'))),
           'UF sem alíquota interna detalhada na categoria padrão'
    UNION ALL
    SELECT 'par_interestadual_ausente', 'warning',
           (SELECT (27::bigint * 26) - count(*) FROM public.aliquotas_interestaduais),
           'matriz interestadual incompleta (esperado 702 pares origem/destino)'
    UNION ALL
    SELECT 'ncm_st_sem_mva', 'warning',
           (SELECT count(*) FROM public.ncms WHERE sujeito_st AND mva_padrao IS NULL),
           'NCM sujeito a ST sem MVA padrão definida'
    UNION ALL
    SELECT 'protocolo_st_ncm_orfao', 'warning',
           (SELECT count(*) FROM public.protocolos_st_ncms p
             WHERE p.ncm_id IS NULL
                OR NOT EXISTS (SELECT 1 FROM public.ncms n WHERE n.codigo = p.ncm_codigo)),
           'item de protocolo ST sem NCM correspondente no catálogo'
    UNION ALL
    SELECT 'protocolo_st_sem_uf', 'warning',
           (SELECT count(*) FROM public.protocolos_st ps
             WHERE NOT EXISTS (SELECT 1 FROM public.protocolos_st_ufs u WHERE u.protocolo_id = ps.id)),
           'protocolo ST sem UF signatária'
    UNION ALL
    SELECT 'faixa_simples_incompleta', 'critical',
           (SELECT 30::bigint - count(*) FROM public.faixas_simples_nacional
             WHERE vigente_ate IS NULL),
           'esperadas 30 faixas vigentes (5 anexos x 6 faixas)'
    UNION ALL
    SELECT 'faixa_simples_reparticao_vazia', 'warning',
           (SELECT count(*) FROM public.faixas_simples_nacional
             WHERE reparticao = '{}'::jsonb),
           'faixa do Simples sem repartição de tributos preenchida'
    UNION ALL
    SELECT 'municipio_sem_aliquota_iss_geral', 'warning',
           (SELECT count(*) FROM (
              SELECT codigo_ibge FROM public.aliquotas_iss_municipal
               GROUP BY codigo_ibge
              HAVING count(*) FILTER (WHERE item_lista_id IS NULL) = 0
            ) s),
           'município com alíquotas específicas mas sem alíquota geral de fallback'
    UNION ALL
    SELECT 'iss_item_fora_lista', 'warning',
           (SELECT count(*) FROM public.aliquotas_iss_municipal a
             WHERE a.item_lista_id IS NOT NULL
               AND NOT EXISTS (SELECT 1 FROM public.itens_lista_iss i WHERE i.id = a.item_lista_id)),
           'alíquota de ISS vinculada a item inexistente na LC 116'
  )
  SELECT inv, sev, qtd, det FROM achados WHERE qtd > 0 ORDER BY
    CASE sev WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END, inv;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.validar_catalogos_tributarios() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validar_catalogos_tributarios() TO authenticated, service_role;