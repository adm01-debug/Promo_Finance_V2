-- Libera, com isolamento por empresa, as escritas que o front já faz em
-- pedidos_compra, itens_pedido_compra e transacoes_bancarias.
-- Causa: as 3 tabelas têm RLS ligada e só policy SELECT
--   (20260619150341_a70425ec-13b2-448f-b150-aab151532d6a.sql:85-107;
--    20260825110000_reconciliar_schema_v3_completo.sql:6232-6233 e :6630-6631),
--   então todo INSERT/UPDATE do papel authenticated é negado (42501):
--   - pedidos_compra INSERT: src/components/compras/PedidoCompraForm.tsx:92-103
--   - itens_pedido_compra INSERT: src/components/compras/PedidoCompraForm.tsx:115-117
--   - transacoes_bancarias INSERT: src/hooks/useConciliacao.ts:148-152 e :177-180,
--     src/components/contas-receber/RegistrarRecebimentoDialog.tsx:132,
--     src/components/contas-receber/BaixaAutomaticaDialog.tsx:154
--   - transacoes_bancarias UPDATE: src/components/conciliacao/ConciliacaoSplitDialog.tsx:124-131,
--     src/hooks/useConciliacaoIgnorarActions.ts:33-36 e :71-74
--   Nenhum DELETE/UPSERT nessas tabelas no front; edge functions usam service_role.
-- Efeito: só os comandos usados ganham policy, no mesmo padrão das irmãs
-- contas_bancarias/contas_pagar (admin ou financeiro + empresa_acessivel).
-- Nada de DELETE; leitura continua pelas policies *_empresa_select existentes.

-- pedidos_compra: INSERT na própria empresa
DROP POLICY IF EXISTS pedidos_compra_financeiro_insert ON public.pedidos_compra

CREATE POLICY pedidos_compra_financeiro_insert ON public.pedidos_compra
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_role((SELECT auth.uid()), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
    AND public.empresa_acessivel(empresa_id)
  )

-- itens_pedido_compra: INSERT via pedido pai da própria empresa
DROP POLICY IF EXISTS itens_pedido_compra_financeiro_insert ON public.itens_pedido_compra

CREATE POLICY itens_pedido_compra_financeiro_insert ON public.itens_pedido_compra
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_role((SELECT auth.uid()), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
    AND EXISTS (
      SELECT 1 FROM public.pedidos_compra pc
      WHERE pc.id = itens_pedido_compra.pedido_id
        AND public.empresa_acessivel(pc.empresa_id)
    )
  )

-- transacoes_bancarias: INSERT/UPDATE via conta bancária da própria empresa
DROP POLICY IF EXISTS transacoes_bancarias_financeiro_insert ON public.transacoes_bancarias

CREATE POLICY transacoes_bancarias_financeiro_insert ON public.transacoes_bancarias
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_role((SELECT auth.uid()), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
    AND conta_bancaria_id IN (
      SELECT cb.id FROM public.contas_bancarias cb
      WHERE public.empresa_acessivel(cb.empresa_id)
    )
  )

DROP POLICY IF EXISTS transacoes_bancarias_financeiro_update ON public.transacoes_bancarias

CREATE POLICY transacoes_bancarias_financeiro_update ON public.transacoes_bancarias
  FOR UPDATE TO authenticated
  USING (
    public.has_any_role((SELECT auth.uid()), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
    AND conta_bancaria_id IN (
      SELECT cb.id FROM public.contas_bancarias cb
      WHERE public.empresa_acessivel(cb.empresa_id)
    )
  )
  WITH CHECK (
    public.has_any_role((SELECT auth.uid()), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
    AND conta_bancaria_id IN (
      SELECT cb.id FROM public.contas_bancarias cb
      WHERE public.empresa_acessivel(cb.empresa_id)
    )
  )
