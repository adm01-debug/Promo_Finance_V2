CREATE OR REPLACE FUNCTION public.detectar_duplicidades_financeiras(p_empresa_id uuid, p_tabela text DEFAULT 'contas_pagar'::text)
 RETURNS TABLE(entidade_tipo text, contraparte_id uuid, numero_documento text, valor numeric, data_vencimento date, ocorrencias bigint, valor_total numeric, ids uuid[])
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_empresa_id IS NULL THEN
    RAISE EXCEPTION 'empresa_id é obrigatório';
  END IF;
  IF p_tabela NOT IN ('contas_pagar', 'contas_receber') THEN
    RAISE EXCEPTION 'Tabela inválida: %. Use contas_pagar ou contas_receber.', p_tabela;
  END IF;
  IF NOT public.empresa_acessivel(p_empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado à empresa informada';
  END IF;

  IF p_tabela = 'contas_pagar' THEN
    RETURN QUERY
    SELECT 'conta_pagar'::text, cp.fornecedor_id, cp.numero_documento, cp.valor,
           cp.data_vencimento::date, count(*)::bigint, sum(cp.valor)::numeric,
           array_agg(cp.id ORDER BY cp.created_at)
    FROM public.contas_pagar cp
    WHERE cp.empresa_id = p_empresa_id
      AND cp.deleted_at IS NULL
      AND COALESCE(cp.status,'pendente') <> 'cancelado'
    GROUP BY cp.fornecedor_id, cp.numero_documento, cp.valor, cp.data_vencimento::date
    HAVING count(*) > 1
    ORDER BY count(*) DESC, sum(cp.valor) DESC;
  ELSE
    RETURN QUERY
    SELECT 'conta_receber'::text, cr.cliente_id, cr.numero_documento, cr.valor,
           cr.data_vencimento::date, count(*)::bigint, sum(cr.valor)::numeric,
           array_agg(cr.id ORDER BY cr.created_at)
    FROM public.contas_receber cr
    WHERE cr.empresa_id = p_empresa_id
      AND cr.deleted_at IS NULL
      AND COALESCE(cr.status,'pendente') <> 'cancelado'
    GROUP BY cr.cliente_id, cr.numero_documento, cr.valor, cr.data_vencimento::date
    HAVING count(*) > 1
    ORDER BY count(*) DESC, sum(cr.valor) DESC;
  END IF;
END;
$function$
