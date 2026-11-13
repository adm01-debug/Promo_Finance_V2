CREATE OR REPLACE FUNCTION public.calcular_potencial_elisao(p_empresa_id uuid)
 RETURNS TABLE(tipo_oportunidade text, descricao text, valor_estimado numeric, ncm_relacionado text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 'oportunidade_elisao'::TEXT,
         COALESCE(o.categoria, o.estrategia),
         o.economia_estimada,
         NULL::TEXT
  FROM public.oportunidades_elisao o
  WHERE o.empresa_id = p_empresa_id
    AND o.aplicavel
    AND o.status <> 'descartada'
  UNION ALL
  SELECT 'credito_tributario'::TEXT,
         COALESCE(c.metodologia_aplicada, 'Crédito identificado em auditoria'),
         c.valor_credito_calculado,
         c.ncm
  FROM public.elisao_creditos_auditoria c
  WHERE c.empresa_id = p_empresa_id
    AND c.status_aprovacao = 'aprovado';
$function$
