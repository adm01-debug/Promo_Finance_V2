-- 1. Atualizar vw_contas_pagar_painel com campos de empresa
-- Guard: conta_bancaria_id só existe em contas_pagar a partir de
-- 20260518164611 (9 dias depois desta migration). Bare CREATE VIEW
-- referenciando cp.conta_bancaria_id quebraria o replay do zero antes disso;
-- 20260518190420/20260518190710 recriam a view de qualquer forma.
-- Guard adicional: fornecedores.razao_social pode não existir no replay incremental.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contas_pagar' AND column_name = 'conta_bancaria_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fornecedores' AND column_name = 'razao_social'
  ) THEN
    EXECUTE 'DROP VIEW IF EXISTS public.vw_contas_pagar_painel';
    EXECUTE $view$
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
      LEFT JOIN public.contas_bancarias cb ON cp.conta_bancaria_id = cb.id
    $view$;
    EXECUTE 'ALTER VIEW public.vw_contas_pagar_painel SET (security_invoker = true)';
  ELSE
    RAISE NOTICE '20260509133338: contas_pagar.conta_bancaria_id ausente; vw_contas_pagar_painel recriada em 20260518190420.';
  END IF;
END
$$;

-- 2. Atualizar vw_contas_receber_painel com campos de empresa
-- Guard adicional: clientes.razao_social pode não existir no replay incremental.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contas_receber' AND column_name = 'conta_bancaria_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'razao_social'
  ) THEN
    EXECUTE 'DROP VIEW IF EXISTS public.vw_contas_receber_painel';
    EXECUTE $view$
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
      LEFT JOIN public.contas_bancarias cb ON cr.conta_bancaria_id = cb.id
    $view$;
    EXECUTE 'ALTER VIEW public.vw_contas_receber_painel SET (security_invoker = true)';
  ELSE
    RAISE NOTICE '20260509133338: contas_receber.conta_bancaria_id ou clientes.razao_social ausente; vw_contas_receber_painel recriada em 20260518190420.';
  END IF;
END
$$;
