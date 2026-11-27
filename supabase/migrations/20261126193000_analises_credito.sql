-- Fila de análise de crédito da 1ª venda (regra resgatada do Bitrix24, SPA 2006).
--
-- O Promo Champions manda a solicitação (credito.solicitado) quando o primeiro
-- pedido de um cliente nasce; o Financeiro analisa aqui (CNPJ.já automático +
-- Escavador e consulta financeira registrados pelo analista) e devolve
-- aprovado/reprovado ao Champions (credito.decidido), que só então libera a
-- compra no Supply.
--
-- Escrita: só service_role (edge functions credito-solicitacao / credito-analise).
-- Leitura: admin e financeiro COM acesso à empresa da análise (padrão do
-- sistema: has_any_role + empresa_acessivel). Linhas ainda sem empresa
-- (cliente não cadastrado no Finance) não têm empresa para escopar e ficam
-- visíveis a qualquer admin/financeiro ativo — a edge function aplica a mesma
-- regra, para a fila não divergir da policy.

CREATE TABLE IF NOT EXISTS public.analises_credito (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origem text NOT NULL DEFAULT 'promo_champions',
  referencia_externa text NOT NULL,
  correlation_key text,
  pedido_numero text,
  valor_pedido numeric(14,2),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  -- Empresa do pedido, herdada do cadastro do cliente quando o Finance já o
  -- conhece. NULL = pedido ainda não atribuível a uma empresa (1ª venda de um
  -- cliente que o Finance não tem cadastrado): nesse caso não existe empresa
  -- para escopar, e a linha fica visível a qualquer admin/financeiro ativo.
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL,
  cliente_nome text,
  cliente_empresa text,
  cliente_email text,
  cliente_telefone text,
  cnpj text,
  vendedor_email text,
  status text NOT NULL DEFAULT 'pendente',
  dados_cnpja jsonb,
  dados_escavador jsonb,
  dados_consulta_financeira jsonb,
  alertas jsonb NOT NULL DEFAULT '[]'::jsonb,
  limite_aprovado numeric(14,2),
  parcelas_max integer,
  parecer text,
  decidido_por uuid,
  decidido_em timestamptz,
  callback_status text NOT NULL DEFAULT 'pendente',
  callback_erro text,
  callback_em timestamptz,
  solicitado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT analises_credito_status_check
    CHECK (status = ANY (ARRAY['pendente', 'em_analise', 'aprovado', 'reprovado']::text[])),
  CONSTRAINT analises_credito_callback_check
    CHECK (callback_status = ANY (ARRAY['pendente', 'enviado', 'falhou', 'nao_aplicavel']::text[])),
  CONSTRAINT analises_credito_origem_ref_key UNIQUE (origem, referencia_externa)
);

CREATE INDEX IF NOT EXISTS idx_analises_credito_status_created
  ON public.analises_credito (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analises_credito_cnpj
  ON public.analises_credito (cnpj)
  WHERE cnpj IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analises_credito_empresa_id
  ON public.analises_credito (empresa_id);

ALTER TABLE public.analises_credito ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.analises_credito FROM anon, authenticated;
GRANT SELECT ON public.analises_credito TO authenticated;
GRANT ALL ON public.analises_credito TO service_role;

DROP POLICY IF EXISTS analises_credito_leitura_financeiro ON public.analises_credito;
CREATE POLICY analises_credito_leitura_financeiro ON public.analises_credito
  FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])
    AND (empresa_id IS NULL OR empresa_acessivel(empresa_id))
  );

CREATE OR REPLACE FUNCTION public.tg_analises_credito_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_analises_credito_updated_at ON public.analises_credito;
CREATE TRIGGER trg_analises_credito_updated_at
  BEFORE UPDATE ON public.analises_credito
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_analises_credito_updated_at();
