-- ============ Convites de contador ============
CREATE TABLE IF NOT EXISTS public.convites_contador (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nome TEXT,
  token_hash TEXT NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT convite_expira_no_futuro CHECK (expires_at > created_at),
  CONSTRAINT convite_revogado_nao_aceito CHECK (revoked_at IS NULL OR accepted_at IS NULL OR revoked_at >= accepted_at)
);
CREATE INDEX IF NOT EXISTS idx_convites_contador_empresa
  ON public.convites_contador (empresa_id, created_at DESC);
-- Apenas um convite ativo por e-mail/empresa
CREATE UNIQUE INDEX IF NOT EXISTS uq_convite_contador_ativo
  ON public.convites_contador (empresa_id, lower(email))
  WHERE revoked_at IS NULL AND accepted_at IS NULL;

GRANT SELECT, UPDATE ON public.convites_contador TO authenticated;
GRANT ALL ON public.convites_contador TO service_role;
ALTER TABLE public.convites_contador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "convites_contador_select" ON public.convites_contador
  FOR SELECT TO authenticated
  USING (
    public.empresa_acessivel(empresa_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro'))
  );
CREATE POLICY "convites_contador_revogar" ON public.convites_contador
  FOR UPDATE TO authenticated
  USING (
    public.empresa_acessivel(empresa_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro'))
  )
  WITH CHECK (
    public.empresa_acessivel(empresa_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro'))
  );

CREATE TRIGGER trg_convites_contador_updated_at
  BEFORE UPDATE ON public.convites_contador
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ Execuções da régua de cobrança ============
CREATE TABLE IF NOT EXISTS public.execucoes_regua_cobranca (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  conta_receber_id UUID REFERENCES public.contas_receber(id) ON DELETE CASCADE,
  etapa TEXT NOT NULL CHECK (char_length(btrim(etapa)) BETWEEN 1 AND 120),
  canal TEXT CHECK (canal IS NULL OR lower(canal) IN ('email','whatsapp','sms','telefone')),
  status TEXT NOT NULL CHECK (status IN ('sucesso','falha','erro','ignorado')),
  mensagem_erro TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT execucao_falha_tem_motivo CHECK (status = 'sucesso' OR mensagem_erro IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_execucoes_regua_empresa
  ON public.execucoes_regua_cobranca (empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execucoes_regua_conta
  ON public.execucoes_regua_cobranca (conta_receber_id, etapa, created_at DESC);
-- Idempotência diária: uma etapa por título por dia
CREATE UNIQUE INDEX IF NOT EXISTS uq_execucoes_regua_dia
  ON public.execucoes_regua_cobranca (conta_receber_id, etapa, ((created_at AT TIME ZONE 'UTC')::date))
  WHERE conta_receber_id IS NOT NULL;

GRANT SELECT ON public.execucoes_regua_cobranca TO authenticated;
GRANT ALL ON public.execucoes_regua_cobranca TO service_role;
ALTER TABLE public.execucoes_regua_cobranca ENABLE ROW LEVEL SECURITY;

CREATE POLICY "execucoes_regua_select" ON public.execucoes_regua_cobranca
  FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));

-- ============ Análise de risco de crédito (Asaas/IA) ============
CREATE TABLE IF NOT EXISTS public.asaas_credit_risk_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  score_risco INTEGER NOT NULL CHECK (score_risco BETWEEN 0 AND 1000),
  faixa_risco TEXT NOT NULL CHECK (faixa_risco IN ('BAIXO','MEDIO','ALTO')),
  recomendacao TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_risk_cliente
  ON public.asaas_credit_risk_analysis (cliente_id, created_at DESC);

GRANT SELECT ON public.asaas_credit_risk_analysis TO authenticated;
GRANT ALL ON public.asaas_credit_risk_analysis TO service_role;
ALTER TABLE public.asaas_credit_risk_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_risk_select" ON public.asaas_credit_risk_analysis
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.id = asaas_credit_risk_analysis.cliente_id
      AND public.empresa_acessivel(c.empresa_id)
  ));