-- Tabela: per_dcomp (Pedidos de Restituição e Declaração de Compensação)
-- Schema derivado de src/hooks/usePerDcomp.ts

CREATE TABLE IF NOT EXISTS public.per_dcomp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,

  tipo text NOT NULL CHECK (tipo IN ('per', 'dcomp')),

  numero_processo text,
  numero_recibo text,
  data_transmissao timestamptz,

  tipo_credito_origem text NOT NULL CHECK (tipo_credito_origem IN
    ('saldo_negativo', 'pagamento_indevido', 'retencao', 'ressarcimento', 'exportacao')),

  tributo_origem text NOT NULL,
  competencia_origem text NOT NULL,
  valor_original numeric(18,2) NOT NULL DEFAULT 0,
  valor_atualizado numeric(18,2),

  tributo_destino text,
  competencia_destino text,
  valor_compensado numeric(18,2),

  creditos_ids uuid[] NOT NULL DEFAULT '{}',

  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN
    ('rascunho', 'aguardando_transmissao', 'transmitido', 'em_analise', 'deferido', 'indeferido', 'cancelado')),

  data_protocolo date,
  data_decisao date,
  prazo_recurso date,

  justificativa text,
  fundamentacao_legal text,
  observacoes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_per_dcomp_empresa ON public.per_dcomp(empresa_id);
CREATE INDEX IF NOT EXISTS idx_per_dcomp_status ON public.per_dcomp(status);
CREATE INDEX IF NOT EXISTS idx_per_dcomp_created ON public.per_dcomp(created_at DESC);

ALTER TABLE public.per_dcomp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS per_dcomp_select_all ON public.per_dcomp;
CREATE POLICY per_dcomp_select_all ON public.per_dcomp
  FOR SELECT USING (true);

DROP POLICY IF EXISTS per_dcomp_admin_all ON public.per_dcomp;
CREATE POLICY per_dcomp_admin_all ON public.per_dcomp
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

NOTIFY pgrst, 'reload schema';
