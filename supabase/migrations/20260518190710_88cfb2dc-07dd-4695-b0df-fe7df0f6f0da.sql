-- Create vw_contas_receber_painel
-- Guard: 42P16 — drop first if column set changed on preview branch
DROP VIEW IF EXISTS public.vw_contas_receber_painel;
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
-- Guard: 42P16 — drop first if column set changed on preview branch
DROP VIEW IF EXISTS public.vw_contas_pagar_painel;
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

-- security_invoker só é setado unicamente em 20260522142604 (dias depois);
-- fixa aqui na primeira recriação pós-coluna para não deixar a view rodando
-- como owner (bypass de RLS) enquanto authenticated já tem SELECT concedido
-- (achado do cubic na PR #63).
ALTER VIEW public.vw_contas_receber_painel SET (security_invoker = true);
ALTER VIEW public.vw_contas_pagar_painel SET (security_invoker = true);

GRANT SELECT ON public.vw_contas_receber_painel TO authenticated;
GRANT SELECT ON public.vw_contas_pagar_painel TO authenticated;
