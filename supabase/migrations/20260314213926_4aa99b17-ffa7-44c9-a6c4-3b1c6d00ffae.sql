-- Drop conflicting broad policies that override the restricted ones

-- contas_bancarias
DROP POLICY IF EXISTS "Authenticated users can view contas" ON public.contas_bancarias;

-- transacoes_bancarias
DROP POLICY IF EXISTS "Authenticated users can view transacoes" ON public.transacoes_bancarias;

-- workflow_aprovacoes
DROP POLICY IF EXISTS "Usuários autenticados podem ver aprovações" ON public.workflow_aprovacoes;

-- contratos
DROP POLICY IF EXISTS "Usuários autenticados podem ver contratos" ON public.contratos;

-- vendedores
DROP POLICY IF EXISTS "Usuários autenticados podem ver vendedores" ON public.vendedores;

-- security_alerts (broad insert)
DROP POLICY IF EXISTS "Usuários autenticados podem inserir alertas de segurança" ON public.security_alerts;