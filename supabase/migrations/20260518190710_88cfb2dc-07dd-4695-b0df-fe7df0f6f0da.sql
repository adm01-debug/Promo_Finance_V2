-- Create vw_contas_receber_painel
CREATE OR REPLACE VIEW public.vw_contas_receber_painel AS
SELECT 
    cr.*,
    COALESCE(cr.cliente_nome, cl.razao_social, 'Cliente não identificado') as cliente_nome_display,
    cc.nome as centro_custo_nome,
    cb.banco as conta_bancaria_nome
FROM public.contas_receber cr
LEFT JOIN public.clientes cl ON cr.cliente_id = cl.id
LEFT JOIN public.centros_custo cc ON cr.centro_custo_id = cc.id
LEFT JOIN public.contas_bancarias cb ON cr.conta_bancaria_id = cb.id;

-- Create vw_contas_pagar_painel
CREATE OR REPLACE VIEW public.vw_contas_pagar_painel AS
SELECT 
    cp.*,
    COALESCE(cp.fornecedor_nome, f.razao_social, 'Fornecedor não identificado') as fornecedor_nome_display,
    cc.nome as centro_custo_nome,
    cb.banco as conta_bancaria_nome
FROM public.contas_pagar cp
LEFT JOIN public.fornecedores f ON cp.fornecedor_id = f.id
LEFT JOIN public.centros_custo cc ON cp.centro_custo_id = cc.id
LEFT JOIN public.contas_bancarias cb ON cp.conta_bancaria_id = cb.id;

GRANT SELECT ON public.vw_contas_receber_painel TO authenticated;
GRANT SELECT ON public.vw_contas_pagar_painel TO authenticated;
