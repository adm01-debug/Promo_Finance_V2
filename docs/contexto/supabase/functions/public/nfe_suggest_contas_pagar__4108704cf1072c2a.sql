CREATE OR REPLACE FUNCTION public.nfe_suggest_contas_pagar(p_nfe_id uuid)
 RETURNS TABLE(conta_pagar_id uuid, descricao text, valor numeric, data_vencimento date, status text, fornecedor_cnpj text, fornecedor_nome text, score numeric, match_motivo text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_nfe public.nfe_recebidas%ROWTYPE;
  v_cnpj text;
BEGIN
  SELECT * INTO v_nfe FROM public.nfe_recebidas WHERE id = p_nfe_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NFe % não encontrada', p_nfe_id USING ERRCODE = 'no_data_found';
  END IF;

  v_cnpj := regexp_replace(coalesce(v_nfe.cnpj_emitente, ''), '\D', '', 'g');

  RETURN QUERY
  SELECT
    cp.id,
    cp.descricao::text,
    cp.valor,
    cp.data_vencimento,
    cp.status::text,
    f.cnpj::text,
    coalesce(f.nome_fantasia, f.razao_social)::text,
    -- score: 100 base, +50 se cnpj bate, +30 se valor bate, -0.5 por dia de diferença
    (
      50
      + CASE WHEN regexp_replace(coalesce(f.cnpj,''), '\D', '', 'g') = v_cnpj AND v_cnpj <> '' THEN 50 ELSE 0 END
      + CASE WHEN v_nfe.valor_total IS NOT NULL AND abs(cp.valor - v_nfe.valor_total) < 0.01 THEN 30
             WHEN v_nfe.valor_total IS NOT NULL AND abs(cp.valor - v_nfe.valor_total) / greatest(v_nfe.valor_total, 1) < 0.02 THEN 15
             ELSE 0 END
      - least(30, abs(extract(day from (cp.data_vencimento::timestamptz - coalesce(v_nfe.data_emissao, now())))) * 0.5)
    )::numeric AS score,
    concat_ws(' | ',
      CASE WHEN regexp_replace(coalesce(f.cnpj,''), '\D', '', 'g') = v_cnpj AND v_cnpj <> '' THEN 'CNPJ' END,
      CASE WHEN v_nfe.valor_total IS NOT NULL AND abs(cp.valor - v_nfe.valor_total) < 0.01 THEN 'Valor exato'
           WHEN v_nfe.valor_total IS NOT NULL AND abs(cp.valor - v_nfe.valor_total) / greatest(v_nfe.valor_total, 1) < 0.02 THEN 'Valor ~2%' END
    )::text AS match_motivo
  FROM public.contas_pagar cp
  LEFT JOIN public.fornecedores f ON f.id = cp.fornecedor_id
  WHERE cp.deleted_at IS NULL
    AND cp.status IN ('pendente', 'parcial', 'vencido', 'atrasado')
    AND cp.empresa_id IS NOT DISTINCT FROM v_nfe.empresa_id
    AND NOT EXISTS (
      SELECT 1 FROM public.nfe_recebidas nr2
      WHERE nr2.conta_pagar_id = cp.id AND nr2.id <> p_nfe_id
    )
  ORDER BY score DESC, cp.data_vencimento ASC
  LIMIT 20;
END;
$function$
