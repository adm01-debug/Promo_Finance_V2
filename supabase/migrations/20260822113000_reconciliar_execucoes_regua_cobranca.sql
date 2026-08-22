-- Log transacional da régua de cobrança: reserva idempotente antes do envio.
CREATE TABLE IF NOT EXISTS public.execucoes_regua_cobranca (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  conta_receber_id uuid REFERENCES public.contas_receber(id) ON DELETE CASCADE,
  etapa text NOT NULL CHECK (char_length(btrim(etapa)) BETWEEN 1 AND 120),
  canal text CHECK (canal IS NULL OR lower(canal) IN ('email', 'whatsapp', 'sms', 'telefone')),
  status text NOT NULL CHECK (status IN ('sucesso', 'falha', 'erro', 'ignorado', 'processando')),
  mensagem_erro text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT execucao_regua_status_motivo
    CHECK (status IN ('sucesso', 'processando') OR mensagem_erro IS NOT NULL)
);

ALTER TABLE public.execucoes_regua_cobranca
  DROP CONSTRAINT IF EXISTS execucao_falha_tem_motivo,
  DROP CONSTRAINT IF EXISTS execucao_regua_status_motivo,
  DROP CONSTRAINT IF EXISTS execucoes_regua_cobranca_status_check;
ALTER TABLE public.execucoes_regua_cobranca
  ADD CONSTRAINT execucoes_regua_cobranca_status_check
    CHECK (status IN ('sucesso', 'falha', 'erro', 'ignorado', 'processando')),
  ADD CONSTRAINT execucao_regua_status_motivo
    CHECK (status IN ('sucesso', 'processando') OR mensagem_erro IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_execucoes_regua_empresa
  ON public.execucoes_regua_cobranca (empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execucoes_regua_conta
  ON public.execucoes_regua_cobranca (conta_receber_id, etapa, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_execucoes_regua_dia
  ON public.execucoes_regua_cobranca (conta_receber_id, etapa, ((created_at AT TIME ZONE 'UTC')::date))
  WHERE conta_receber_id IS NOT NULL;

ALTER TABLE public.execucoes_regua_cobranca ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.execucoes_regua_cobranca TO authenticated;
GRANT ALL ON public.execucoes_regua_cobranca TO service_role;

DROP POLICY IF EXISTS "execucoes_regua_select" ON public.execucoes_regua_cobranca;
CREATE POLICY "execucoes_regua_select" ON public.execucoes_regua_cobranca
  FOR SELECT TO authenticated
  USING (public.empresa_acessivel(empresa_id));

NOTIFY pgrst, 'reload schema';
