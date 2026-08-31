-- Drop conflicting broad policies that override the restricted ones

-- contas_bancarias
DROP POLICY IF EXISTS "Authenticated users can view contas" ON public.contas_bancarias;

-- transacoes_bancarias
DROP POLICY IF EXISTS "Authenticated users can view transacoes" ON public.transacoes_bancarias;

-- workflow_aprovacoes
-- A tabela não integra o schema canônico atual. Em bancos legados ela pode
-- existir; no replay limpo ela deve ser tratada como opcional para não criar
-- drift nem abortar a migração.
DO $workflow_aprovacoes_broad_policy$
BEGIN
  IF to_regclass('public.workflow_aprovacoes') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Usuários autenticados podem ver aprovações" ON public.workflow_aprovacoes';
  END IF;
END
$workflow_aprovacoes_broad_policy$;

-- contratos
DO $contratos_broad_policy$
BEGIN
  IF to_regclass('public.contratos') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Usuários autenticados podem ver contratos" ON public.contratos';
  END IF;
END
$contratos_broad_policy$;

-- vendedores
DROP POLICY IF EXISTS "Usuários autenticados podem ver vendedores" ON public.vendedores;

-- security_alerts (broad insert)
DROP POLICY IF EXISTS "Usuários autenticados podem inserir alertas de segurança" ON public.security_alerts;
