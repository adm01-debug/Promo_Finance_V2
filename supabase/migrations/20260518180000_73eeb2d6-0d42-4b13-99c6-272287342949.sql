-- empresas (tenant)
CREATE TABLE IF NOT EXISTS public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  cnpj text,
  razao_social text NOT NULL,
  nome_fantasia text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='empresas' AND policyname='Owner manage empresas') THEN
    CREATE POLICY "Owner manage empresas" ON public.empresas FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
END $$;

-- solicitacoes_aprovacao
CREATE TABLE IF NOT EXISTS public.solicitacoes_aprovacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  entidade_tipo text NOT NULL,
  entidade_id uuid,
  status text NOT NULL DEFAULT 'pendente',
  motivo_rejeicao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.solicitacoes_aprovacao ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='solicitacoes_aprovacao' AND policyname='Owner manage aprovacoes') THEN
    CREATE POLICY "Owner manage aprovacoes" ON public.solicitacoes_aprovacao FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
END $$;

-- alertas
CREATE TABLE IF NOT EXISTS public.alertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  tipo text NOT NULL,
  titulo text NOT NULL,
  mensagem text,
  prioridade text DEFAULT 'media',
  lido boolean DEFAULT false,
  entidade_id uuid,
  entidade_tipo text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='alertas' AND policyname='Owner manage alertas') THEN
    CREATE POLICY "Owner manage alertas" ON public.alertas FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
END $$;

-- logs_baixa_automatica
CREATE TABLE IF NOT EXISTS public.logs_baixa_automatica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  conta_receber_id uuid,
  resultado text,
  detalhes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.logs_baixa_automatica ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='logs_baixa_automatica' AND policyname='Owner manage logs_baixa') THEN
    CREATE POLICY "Owner manage logs_baixa" ON public.logs_baixa_automatica FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
END $$;

-- anexos_financeiros
CREATE TABLE IF NOT EXISTS public.anexos_financeiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  entidade_tipo text NOT NULL,
  entidade_id uuid NOT NULL,
  nome_arquivo text NOT NULL,
  url text NOT NULL,
  mime_type text,
  tamanho_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.anexos_financeiros ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='anexos_financeiros' AND policyname='Owner manage anexos') THEN
    CREATE POLICY "Owner manage anexos" ON public.anexos_financeiros FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
END $$;

-- execucoes_cobranca
CREATE TABLE IF NOT EXISTS public.execucoes_cobranca (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  conta_receber_id uuid,
  etapa text,
  canal text,
  status text DEFAULT 'enviado',
  mensagem text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.execucoes_cobranca ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='execucoes_cobranca' AND policyname='Owner manage execucoes') THEN
    CREATE POLICY "Owner manage execucoes" ON public.execucoes_cobranca FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
END $$;

-- acordos_parcelamento
CREATE TABLE IF NOT EXISTS public.acordos_parcelamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  conta_receber_id uuid,
  total_parcelas integer NOT NULL DEFAULT 1,
  valor_total numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.acordos_parcelamento ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='acordos_parcelamento' AND policyname='Owner manage acordos') THEN
    CREATE POLICY "Owner manage acordos" ON public.acordos_parcelamento FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
END $$;

-- boletos
CREATE TABLE IF NOT EXISTS public.boletos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  conta_receber_id uuid,
  nosso_numero text,
  linha_digitavel text,
  codigo_barras text,
  valor numeric NOT NULL DEFAULT 0,
  vencimento date,
  status text DEFAULT 'emitido',
  url_pdf text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='boletos' AND policyname='Owner manage boletos') THEN
    CREATE POLICY "Owner manage boletos" ON public.boletos FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
END $$;

-- contas_receber columns
ALTER TABLE public.contas_receber
  ADD COLUMN IF NOT EXISTS etapa_cobranca text,
  ADD COLUMN IF NOT EXISTS tipo_cobranca text,
  ADD COLUMN IF NOT EXISTS numero_parcela_atual integer;

-- contas_pagar
ALTER TABLE public.contas_pagar
  ADD COLUMN IF NOT EXISTS categoria text;

-- RPC registrar_evento_receber
CREATE OR REPLACE FUNCTION public.registrar_evento_receber(
  p_conta_id uuid,
  p_evento text,
  p_detalhes jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.logs_baixa_automatica (user_id, conta_receber_id, resultado, detalhes)
  VALUES (auth.uid(), p_conta_id, p_evento, p_detalhes)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.registrar_evento_receber(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_evento_receber(uuid, text, jsonb) TO authenticated;