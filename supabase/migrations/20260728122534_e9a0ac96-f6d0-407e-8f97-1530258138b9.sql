CREATE OR REPLACE FUNCTION public.validar_catalogos_tributarios()
RETURNS TABLE (
  invariante   text,
  severidade   text,
  afetados     bigint,
  detalhe      text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
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
             WHERE reparticao IS NULL OR reparticao = '{}'::jsonb),
           'faixa do Simples sem repartição de tributos preenchida'
    UNION ALL
    SELECT 'faixa_simples_descontinua', 'critical',
           (SELECT count(*) FROM (
              SELECT f.id FROM public.faixas_simples_nacional f
              JOIN public.faixas_simples_nacional p
                ON p.anexo = f.anexo AND p.faixa = f.faixa - 1 AND p.vigente_de = f.vigente_de
              WHERE f.rbt12_de NOT BETWEEN p.rbt12_ate AND p.rbt12_ate + 0.01
            ) s),
           'faixas do Simples com lacuna ou sobreposição de RBT12'
    UNION ALL
    SELECT 'iss_municipal_sem_item_lista', 'warning',
           (SELECT count(*) FROM public.aliquotas_iss_municipal WHERE item_lista_id IS NULL),
           'alíquota de ISS municipal sem vínculo com item da LC 116'
    UNION ALL
    SELECT 'iss_municipal_fora_da_faixa_do_item', 'critical',
           (SELECT count(*) FROM public.aliquotas_iss_municipal a
             JOIN public.itens_lista_iss i ON i.id = a.item_lista_id
             WHERE a.aliquota < i.aliquota_minima OR a.aliquota > i.aliquota_maxima),
           'alíquota municipal fora da faixa mínima/máxima do item da lista'
    UNION ALL
    SELECT 'cnae_anexo_ausente', 'warning',
           (SELECT count(*) FROM public.cnaes WHERE NOT vedado_simples AND anexo_simples IS NULL),
           'CNAE não vedado ao Simples sem anexo definido'
    UNION ALL
    SELECT 'beneficio_percentual_ausente', 'info',
           (SELECT count(*) FROM public.beneficios_fiscais
             WHERE percentual IS NULL AND tipo IN ('CREDITO_PRESUMIDO','CREDITO_OUTORGADO','REDUCAO_BASE')),
           'benefício de crédito/redução sem percentual informado'
    UNION ALL
    SELECT 'estrategia_elisao_sem_regime', 'warning',
           (SELECT count(*) FROM public.estrategias_elisao
             WHERE ativo AND cardinality(regimes_aplicaveis) = 0),
           'estratégia de elisão ativa sem regime aplicável'
  )
  SELECT a.inv, a.sev, a.qtd, a.det
  FROM achados a
  WHERE a.qtd > 0
  ORDER BY CASE a.sev WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END, a.inv;
END;
$function$;