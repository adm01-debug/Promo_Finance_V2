-- 1. Atualizar vw_contas_pagar_painel com campos de empresa
DROP VIEW IF EXISTS public.vw_contas_pagar_painel;
CREATE VIEW public.vw_contas_pagar_painel AS
SELECT 
    cp.*,
    e.razao_social AS empresa_razao_social,
    e.nome_fantasia AS empresa_nome_fantasia,
    e.cnpj AS empresa_cnpj,
    f.razao_social AS fornecedor_razao_social,
    f.nome_fantasia AS fornecedor_nome_fantasia,
    cc.nome AS centro_custo_nome,
    cb.banco AS banco_nome
FROM 
    public.contas_pagar cp
LEFT JOIN public.empresas e ON cp.empresa_id = e.id
LEFT JOIN public.fornecedores f ON cp.fornecedor_id = f.id
LEFT JOIN public.centros_custo cc ON cp.centro_custo_id = cc.id
LEFT JOIN public.contas_bancarias cb ON cp.conta_bancaria_id = cb.id;

ALTER VIEW public.vw_contas_pagar_painel SET (security_invoker = true);

-- 2. Atualizar vw_contas_receber_painel com campos de empresa
DROP VIEW IF EXISTS public.vw_contas_receber_painel;
CREATE VIEW public.vw_contas_receber_painel AS
SELECT 
    cr.*,
    e.razao_social AS empresa_razao_social,
    e.nome_fantasia AS empresa_nome_fantasia,
    e.cnpj AS empresa_cnpj,
    c.razao_social AS cliente_razao_social,
    c.nome_fantasia AS cliente_nome_fantasia,
    cc.nome AS centro_custo_nome,
    cb.banco AS banco_nome
FROM 
    public.contas_receber cr
LEFT JOIN public.empresas e ON cr.empresa_id = e.id
LEFT JOIN public.clientes c ON cr.cliente_id = c.id
LEFT JOIN public.centros_custo cc ON cr.centro_custo_id = cc.id
LEFT JOIN public.contas_bancarias cb ON cr.conta_bancaria_id = cb.id;

ALTER VIEW public.vw_contas_receber_painel SET (security_invoker = true);
