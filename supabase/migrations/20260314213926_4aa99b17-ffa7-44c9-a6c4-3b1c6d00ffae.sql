-- Drop conflicting broad policies that override the restricted ones

-- contas_bancarias
DROP POLICY IF EXISTS "Authenticated users can view contas" ON public.contas_bancarias;

-- transacoes_bancarias
DROP POLICY IF EXISTS "Authenticated users can view transacoes" ON public.transacoes_bancarias;

-- workflow_aprovacoes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'workflow_aprovacoes'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Usuários autenticados podem ver aprovações" ON public.workflow_aprovacoes';
  ELSE
    RAISE NOTICE '20260314213926: workflow_aprovacoes ausente no schema atual; bloco ignorado.';
  END IF;
END
$$;

-- contratos (tabela só existe a partir de 20260518190304, posterior a este
-- arquivo — mesmo guard do bloco workflow_aprovacoes acima)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'contratos'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Usuários autenticados podem ver contratos" ON public.contratos';
  ELSE
    RAISE NOTICE '20260314213926: contratos ausente no schema atual; bloco ignorado.';
  END IF;
END
$$;

-- vendedores
DROP POLICY IF EXISTS "Usuários autenticados podem ver vendedores" ON public.vendedores;

-- security_alerts (broad insert)
DROP POLICY IF EXISTS "Usuários autenticados podem inserir alertas de segurança" ON public.security_alerts;
