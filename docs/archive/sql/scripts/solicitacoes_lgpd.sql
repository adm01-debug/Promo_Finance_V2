-- Tabela: solicitacoes_lgpd (LGPD - Centro de Privacidade)
-- Schema derivado de src/hooks/useSolicitacoesLGPD.ts

CREATE TABLE IF NOT EXISTS public.solicitacoes_lgpd (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('acesso', 'portabilidade', 'exclusao', 'retificacao', 'anonimizacao')),
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_analise', 'atendida', 'rejeitada')),
  justificativa text,
  payload_resposta jsonb,
  url_dump text,
  atendida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_lgpd_user ON public.solicitacoes_lgpd(user_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_lgpd_status ON public.solicitacoes_lgpd(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_lgpd_created ON public.solicitacoes_lgpd(created_at DESC);

ALTER TABLE public.solicitacoes_lgpd ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS solicitacoes_lgpd_user_select ON public.solicitacoes_lgpd;
CREATE POLICY solicitacoes_lgpd_user_select ON public.solicitacoes_lgpd
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS solicitacoes_lgpd_user_insert ON public.solicitacoes_lgpd;
CREATE POLICY solicitacoes_lgpd_user_insert ON public.solicitacoes_lgpd
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS solicitacoes_lgpd_admin_all ON public.solicitacoes_lgpd;
CREATE POLICY solicitacoes_lgpd_admin_all ON public.solicitacoes_lgpd
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

NOTIFY pgrst, 'reload schema';
