-- ============================================
-- P10: Fechamento Tributário + Push Subscriptions
-- ============================================

-- Enum de status do fechamento
DO $$ BEGIN
  CREATE TYPE public.status_fechamento_tributario AS ENUM ('aberto', 'em_revisao', 'fechado', 'reaberto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela de fechamentos tributários mensais
CREATE TABLE IF NOT EXISTS public.fechamentos_tributarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  periodo TEXT GENERATED ALWAYS AS (lpad(ano::text, 4, '0') || '-' || lpad(mes::text, 2, '0')) STORED,
  status public.status_fechamento_tributario NOT NULL DEFAULT 'aberto',
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  score_conformidade NUMERIC,
  total_apurado NUMERIC,
  observacoes TEXT,
  forcado BOOLEAN NOT NULL DEFAULT false,
  justificativa_forcado TEXT,
  fechado_por UUID,
  fechado_em TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, ano, mes)
);

CREATE INDEX IF NOT EXISTS idx_fechamentos_empresa_periodo ON public.fechamentos_tributarios(empresa_id, ano DESC, mes DESC);
CREATE INDEX IF NOT EXISTS idx_fechamentos_status ON public.fechamentos_tributarios(status);

ALTER TABLE public.fechamentos_tributarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/financeiro/contador podem ler fechamentos"
  ON public.fechamentos_tributarios FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "Admin/financeiro podem inserir fechamentos"
  ON public.fechamentos_tributarios FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "Admin/financeiro podem atualizar fechamentos abertos"
  ON public.fechamentos_tributarios FOR UPDATE
  TO authenticated
  USING (
    (status <> 'fechado' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro')))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Apenas admin pode deletar fechamentos"
  ON public.fechamentos_tributarios FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_fechamentos_updated_at
  BEFORE UPDATE ON public.fechamentos_tributarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger de auditoria P9
CREATE TRIGGER trg_audit_fechamentos
  AFTER INSERT OR UPDATE OR DELETE ON public.fechamentos_tributarios
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

-- ============================================
-- Push Subscriptions (Web Push API)
-- ============================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id) WHERE ativo = true;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas subscriptions"
  ON public.push_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários criam suas subscriptions"
  ON public.push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam suas subscriptions"
  ON public.push_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam suas subscriptions"
  ON public.push_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_push_subs_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();