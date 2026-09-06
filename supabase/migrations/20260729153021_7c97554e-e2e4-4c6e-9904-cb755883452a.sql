CREATE OR REPLACE FUNCTION public.pode_ver_dado_sensivel()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'financeiro'::app_role);
$$;

REVOKE ALL ON FUNCTION public.pode_ver_dado_sensivel() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_ver_dado_sensivel() TO authenticated;

CREATE OR REPLACE FUNCTION public.mascarar_chave_pix(_valor text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _valor IS NULL OR length(btrim(_valor)) = 0 THEN _valor
    WHEN length(btrim(_valor)) <= 4 THEN repeat('*', length(btrim(_valor)))
    ELSE repeat('*', greatest(length(btrim(_valor)) - 4, 3)) || right(btrim(_valor), 4)
  END;
$$;

REVOKE ALL ON FUNCTION public.mascarar_chave_pix(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mascarar_chave_pix(text) TO authenticated;

CREATE OR REPLACE VIEW public.vw_transferencias_painel
WITH (security_invoker = true) AS
 SELECT t.id,
    t.empresa_id,
    e.razao_social,
    t.asaas_id,
    t.valor,
    t.status,
    t.tipo_chave,
    CASE WHEN public.pode_ver_dado_sensivel() THEN t.chave_pix
         ELSE public.mascarar_chave_pix(t.chave_pix) END AS chave_pix,
    t.descricao,
    t.created_at,
    t.updated_at
   FROM asaas_transfers t
     LEFT JOIN empresas e ON e.id = t.empresa_id;

-- Guard: 42P16 -- drop first if column set changed on preview branch
DROP VIEW IF EXISTS public.vw_contas_receber_painel;
CREATE OR REPLACE VIEW public.vw_contas_receber_painel
WITH (security_invoker = on) AS
 SELECT cr.id, cr.descricao, cr.valor, cr.data_vencimento, cr.data_recebimento,
    cr.status, cr.cliente_id, cr.user_id, cr.created_at, cr.updated_at,
    cr.empresa_id, cr.categoria_id, cr.centro_custo_id, cr.forma_recebimento,
    cr.conta_bancaria_id, cr.numero_documento, cr.observacoes, cr.valor_recebido,
    cr.juros, cr.multa, cr.desconto, cr.recorrente, cr.parcela_atual,
    cr.total_parcelas, cr.anexo_url, cr.score, cr.metadata, cr.cliente_nome,
    cr.etapa_cobranca, cr.tipo_cobranca, cr.numero_parcela_atual, cr.valor_desconto,
    CASE WHEN public.pode_ver_dado_sensivel() THEN cr.chave_pix
         ELSE public.mascarar_chave_pix(cr.chave_pix) END AS chave_pix,
    cr.data_emissao, cr.categoria_nome,
    cl.razao_social AS cliente_razao_social,
    cl.nome_fantasia AS cliente_nome_fantasia,
    COALESCE(cr.cliente_nome, cl.razao_social, 'Cliente não identificado'::text) AS cliente_nome_display,
    cc.nome AS centro_custo_nome,
    cb.banco AS conta_bancaria_nome
   FROM contas_receber cr
     LEFT JOIN clientes cl ON cr.cliente_id = cl.id
     LEFT JOIN centros_custo cc ON cr.centro_custo_id = cc.id
     LEFT JOIN contas_bancarias cb ON cr.conta_bancaria_id = cb.id;

CREATE OR REPLACE FUNCTION public.gate_32_pii_sem_mascara()
RETURNS TABLE(objeto text, coluna text, motivo text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.relname::text, 'chave_pix',
         'view expõe chave_pix sem mascarar_chave_pix()/pode_ver_dado_sensivel()'
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'chave_pix' AND a.attnum > 0 AND NOT a.attisdropped
  WHERE n.nspname = 'public'
    AND c.relkind IN ('v','m')
    AND pg_get_viewdef(c.oid, true) NOT ILIKE '%mascarar_chave_pix%'
  ORDER BY 1;
$$;

REVOKE ALL ON FUNCTION public.gate_32_pii_sem_mascara() FROM PUBLIC, anon, authenticated;
