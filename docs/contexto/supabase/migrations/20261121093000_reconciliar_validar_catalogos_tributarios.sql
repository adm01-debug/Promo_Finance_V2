-- ============================================================
-- Reconciliar public.validar_catalogos_tributarios() (contrato detalhado)
-- ------------------------------------------------------------
-- Causa raiz: PROD executa a função com o CONTRATO COMPACTO do banco
-- original do Lovable (RETURNS TABLE(tabela text, registros bigint,
-- status text)). O repositório (main) define o CONTRATO DETALHADO
-- (invariante text, severidade text, afetados bigint, detalhe text)
-- nas migrations 20260728122339/22534/24927. O dry-run do prod-migrate só
-- valida o ledger (e ignora as UUID-companions), então o drift passou
-- despercebido — o Quality Gate da #479 (que aponta o pgTAP p/ PROD)
-- falha exatamente em `column "severidade" does not exist`
-- (supabase/tests/sql/catalogos_tributarios.test.sql, linha 168).
--
-- CREATE OR REPLACE não pode trocar o tipo de retorno → DROP + CREATE.
-- Seguro: nada referencia a função com dependência dura (plpgsql resolve
-- o corpo em runtime; check_catalogos_tributarios_invariants e
-- run_integrity_cycle citam-na apenas no corpo).
-- Corpo idêntico (byte a byte) ao da 20260728124927, vencedora no main.
-- ============================================================

-- Grafismo delimitando o reparo (evita reintrodução de ALTER DATABASE/ledger)
DO $$
BEGIN
  RAISE NOTICE 'reconcile validar_catalogos_tributarios() -> contrato detalhado';
END $$

DROP FUNCTION IF EXISTS public.validar_catalogos_tributarios()

CREATE FUNCTION public.validar_catalogos_tributarios()
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
$fn$

-- Estado final de grants no main: somente service_role executa.
REVOKE ALL ON FUNCTION public.validar_catalogos_tributarios() FROM PUBLIC, anon, authenticated

GRANT EXECUTE ON FUNCTION public.validar_catalogos_tributarios() TO service_role
