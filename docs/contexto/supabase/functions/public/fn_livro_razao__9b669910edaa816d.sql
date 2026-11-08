CREATE OR REPLACE FUNCTION public.fn_livro_razao(p_empresa_id uuid, p_conta_id uuid, p_data_inicio date DEFAULT (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))::date, p_data_fim date DEFAULT CURRENT_DATE)
 RETURNS TABLE(data_lancamento date, descricao text, tipo text, valor numeric, saldo_acumulado numeric)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT l.data_lancamento, l.historico, p.tipo, p.valor,
    SUM(CASE WHEN p.tipo='DEBITO' THEN p.valor ELSE -p.valor END)
      OVER (ORDER BY l.data_lancamento, l.created_at)
  FROM public.partidas_contabeis p
  JOIN public.lancamentos_contabeis l ON l.id = p.lancamento_id
  WHERE l.empresa_id = p_empresa_id
    AND p.conta_contabil_id = p_conta_id
    AND l.data_lancamento BETWEEN p_data_inicio AND p_data_fim
  ORDER BY l.data_lancamento, l.created_at;
$function$
