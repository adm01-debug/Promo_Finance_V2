-- asaas-proxy: listar_links_pagamento e criar_link_pagamento vazavam links de
-- pagamento entre empresas — Asaas não amarra paymentLinks a empresa_id, e
-- essas duas ações não tinham espelho local para filtrar (mesma classe de
-- achado já corrigida para listar_clientes/listar_assinaturas/extrato/
-- listar_antecipacoes, que usam asaas_customers/asaas_payments; links de
-- pagamento não tinham tabela própria).
CREATE TABLE IF NOT EXISTS public.asaas_payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_link_id TEXT NOT NULL UNIQUE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor NUMERIC(14,2),
  url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asaas_payment_links_empresa ON public.asaas_payment_links(empresa_id);

ALTER TABLE public.asaas_payment_links ENABLE ROW LEVEL SECURITY;

-- empresa_acessivel(empresa_id) é obrigatório aqui: sem ele, qualquer
-- admin/financeiro de QUALQUER empresa lê/insere links de QUALQUER outra
-- empresa via PostgREST direto (mesmo padrão de vazamento que este PR
-- corrige na edge function, mas reintroduzido na RLS). Mesmo padrão de
-- asaas_customers/asaas_payments e da correção "Grupo C"
-- (20260902200000_fix_rls_cross_tenant_leak_grupo_c.sql).
CREATE POLICY "Admins e financeiro podem ver links de pagamento ASAAS"
  ON public.asaas_payment_links FOR SELECT TO authenticated
  USING (public.has_any_role((SELECT auth.uid()), ARRAY['admin', 'financeiro']::app_role[]) AND public.empresa_acessivel(empresa_id));

CREATE POLICY "Admins e financeiro podem inserir links de pagamento ASAAS"
  ON public.asaas_payment_links FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role((SELECT auth.uid()), ARRAY['admin', 'financeiro']::app_role[]) AND public.empresa_acessivel(empresa_id));

CREATE POLICY "Service role full access asaas_payment_links"
  ON public.asaas_payment_links FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.asaas_payment_links IS
  'Espelho local de paymentLinks criados via asaas-proxy, com empresa_id — permite a listar_links_pagamento filtrar por empresa, já que a API do Asaas não amarra paymentLinks a empresa.';
