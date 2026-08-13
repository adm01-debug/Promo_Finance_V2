
ALTER TABLE public.contas_bancarias ADD COLUMN IF NOT EXISTS configuracoes_conciliacao jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.divergencias_conciliacao ADD COLUMN IF NOT EXISTS conta_bancaria_id uuid REFERENCES public.contas_bancarias(id) ON DELETE SET NULL;

ALTER TABLE public.feedback_conciliacao_ia
  ADD COLUMN IF NOT EXISTS transacao_bancaria_id uuid,
  ADD COLUMN IF NOT EXISTS score_original numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS motivo_rejeicao text;

CREATE TABLE IF NOT EXISTS public.logs_conciliacao_retroativa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  empresa_id uuid,
  conta_bancaria_id uuid REFERENCES public.contas_bancarias(id) ON DELETE CASCADE,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  status text NOT NULL DEFAULT 'processando',
  progresso numeric DEFAULT 0,
  total_processado integer DEFAULT 0,
  total_conciliado integer DEFAULT 0,
  divergencias_encontradas integer DEFAULT 0,
  erro_detalhe text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.logs_conciliacao_retroativa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_retro_owner_all" ON public.logs_conciliacao_retroativa
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.conciliacoes_parciais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transacao_bancaria_id uuid NOT NULL,
  conta_pagar_id uuid,
  conta_receber_id uuid,
  valor_parcial numeric NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.conciliacoes_parciais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "concil_parciais_owner_all" ON public.conciliacoes_parciais
  FOR ALL TO authenticated
  USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
