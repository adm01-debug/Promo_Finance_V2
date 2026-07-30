
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'financeiro'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operacional'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'visualizador'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'contador'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
      AND COALESCE(is_active, true) = true
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

ALTER TABLE public.anomalias_detectadas
  ADD COLUMN IF NOT EXISTS empresa_id uuid,
  ADD COLUMN IF NOT EXISTS entidade_tipo text,
  ADD COLUMN IF NOT EXISTS entidade_id uuid,
  ADD COLUMN IF NOT EXISTS tipo_anomalia text,
  ADD COLUMN IF NOT EXISTS severidade text DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS titulo text,
  ADD COLUMN IF NOT EXISTS centro_custo_id uuid,
  ADD COLUMN IF NOT EXISTS centro_custo_nome text,
  ADD COLUMN IF NOT EXISTS valor_envolvido numeric,
  ADD COLUMN IF NOT EXISTS score_confianca numeric,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS revisado_por uuid,
  ADD COLUMN IF NOT EXISTS revisado_em timestamptz,
  ADD COLUMN IF NOT EXISTS resolucao text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.anomalia_toast_eventos
  ADD COLUMN IF NOT EXISTS severidade text,
  ADD COLUMN IF NOT EXISTS tipo_anomalia text,
  ADD COLUMN IF NOT EXISTS titulo text,
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS centro_custo_nome text,
  ADD COLUMN IF NOT EXISTS acoes_disponiveis text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS duracao_segundos integer DEFAULT 8;

ALTER TABLE public.password_reset_requests
  ADD COLUMN IF NOT EXISTS motivo_rejeicao text,
  ADD COLUMN IF NOT EXISTS solicitado_em timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS aprovado_por uuid,
  ADD COLUMN IF NOT EXISTS aprovado_em timestamptz,
  ADD COLUMN IF NOT EXISTS user_email text;

ALTER TABLE public.contas_pagar
  ADD COLUMN IF NOT EXISTS empresa_id uuid,
  ADD COLUMN IF NOT EXISTS categoria_id uuid,
  ADD COLUMN IF NOT EXISTS centro_custo_id uuid,
  ADD COLUMN IF NOT EXISTS forma_pagamento text,
  ADD COLUMN IF NOT EXISTS conta_bancaria_id uuid,
  ADD COLUMN IF NOT EXISTS numero_documento text,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS valor_pago numeric,
  ADD COLUMN IF NOT EXISTS juros numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS multa numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recorrente boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS parcela_atual integer,
  ADD COLUMN IF NOT EXISTS total_parcelas integer,
  ADD COLUMN IF NOT EXISTS anexo_url text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.contas_receber
  ADD COLUMN IF NOT EXISTS empresa_id uuid,
  ADD COLUMN IF NOT EXISTS categoria_id uuid,
  ADD COLUMN IF NOT EXISTS centro_custo_id uuid,
  ADD COLUMN IF NOT EXISTS forma_recebimento text,
  ADD COLUMN IF NOT EXISTS conta_bancaria_id uuid,
  ADD COLUMN IF NOT EXISTS numero_documento text,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS valor_recebido numeric,
  ADD COLUMN IF NOT EXISTS juros numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS multa numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recorrente boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS parcela_atual integer,
  ADD COLUMN IF NOT EXISTS total_parcelas integer,
  ADD COLUMN IF NOT EXISTS anexo_url text,
  ADD COLUMN IF NOT EXISTS score numeric,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.historico_analises_preditivas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  empresa_id uuid,
  tipo_analise text,
  resumo_executivo text,
  alertas_gerados integer,
  score_saude_financeira numeric,
  insights jsonb DEFAULT '[]'::jsonb,
  recomendacoes jsonb DEFAULT '[]'::jsonb,
  modelo_usado text,
  duracao_ms integer,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.historico_analises_preditivas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read hap" ON public.historico_analises_preditivas;
CREATE POLICY "Authenticated read hap"
  ON public.historico_analises_preditivas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated insert hap" ON public.historico_analises_preditivas;
CREATE POLICY "Authenticated insert hap"
  ON public.historico_analises_preditivas FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can insert anomalias" ON public.anomalias_detectadas;
CREATE POLICY "Authenticated can insert anomalias"
  ON public.anomalias_detectadas FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can update anomalias" ON public.anomalias_detectadas;
CREATE POLICY "Authenticated can update anomalias"
  ON public.anomalias_detectadas FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated can insert toast eventos" ON public.anomalia_toast_eventos;
CREATE POLICY "Authenticated can insert toast eventos"
  ON public.anomalia_toast_eventos FOR INSERT TO authenticated WITH CHECK (true);
