-- Histórico de análises de risco geradas pelo proxy Asaas/IA.
CREATE TABLE IF NOT EXISTS public.asaas_credit_risk_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  score_risco integer NOT NULL CHECK (score_risco BETWEEN 0 AND 1000),
  faixa_risco text NOT NULL CHECK (faixa_risco IN ('BAIXO', 'MEDIO', 'ALTO')),
  recomendacao text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_risk_cliente
  ON public.asaas_credit_risk_analysis (cliente_id, created_at DESC);

ALTER TABLE public.asaas_credit_risk_analysis ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.asaas_credit_risk_analysis TO authenticated;
GRANT ALL ON public.asaas_credit_risk_analysis TO service_role;

DROP POLICY IF EXISTS "credit_risk_select" ON public.asaas_credit_risk_analysis;
CREATE POLICY "credit_risk_select" ON public.asaas_credit_risk_analysis
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
      FROM public.clientes c
     WHERE c.id = asaas_credit_risk_analysis.cliente_id
       AND public.empresa_acessivel(c.empresa_id)
  ));
