CREATE TABLE IF NOT EXISTS public.regras_contabilizacao_automatica (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL CHECK (char_length(btrim(nome)) BETWEEN 2 AND 160),
  tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('conta_pagar','conta_receber','movimentacao')),
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  conta_debito_id UUID NOT NULL REFERENCES public.plano_contas(id) ON DELETE RESTRICT,
  conta_credito_id UUID NOT NULL REFERENCES public.plano_contas(id) ON DELETE RESTRICT,
  historico_template TEXT NOT NULL DEFAULT '',
  prioridade INTEGER NOT NULL DEFAULT 0 CHECK (prioridade >= 0),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT regra_contas_distintas CHECK (conta_debito_id <> conta_credito_id),
  CONSTRAINT regra_nome_unico_empresa UNIQUE (empresa_id, nome)
);
CREATE INDEX IF NOT EXISTS idx_regras_contab_lookup
  ON public.regras_contabilizacao_automatica (empresa_id, tipo_evento, ativo, prioridade);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.regras_contabilizacao_automatica TO authenticated;
GRANT ALL ON public.regras_contabilizacao_automatica TO service_role;
ALTER TABLE public.regras_contabilizacao_automatica ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "regras_contab_select" ON public.regras_contabilizacao_automatica
    FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "regras_contab_write" ON public.regras_contabilizacao_automatica
    FOR ALL TO authenticated
    USING (
      public.empresa_acessivel(empresa_id)
      AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro') OR public.has_role(auth.uid(), 'contador'))
    )
    WITH CHECK (
      public.empresa_acessivel(empresa_id)
      AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro') OR public.has_role(auth.uid(), 'contador'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_regras_contab_updated_at
    BEFORE UPDATE ON public.regras_contabilizacao_automatica
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== Log de eventos contabilizados =====
CREATE TABLE IF NOT EXISTS public.eventos_contabilizacao_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('conta_pagar','conta_receber','movimentacao')),
  evento_id UUID,
  regra_id UUID REFERENCES public.regras_contabilizacao_automatica(id) ON DELETE SET NULL,
  lancamento_id UUID,
  status TEXT NOT NULL CHECK (status IN ('sucesso','sem_regra','erro','duplicado','simulado')),
  detalhe TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eventos_contab_empresa
  ON public.eventos_contabilizacao_log (empresa_id, created_at DESC);
-- Idempotência: um único sucesso por evento
CREATE UNIQUE INDEX IF NOT EXISTS uq_eventos_contab_sucesso
  ON public.eventos_contabilizacao_log (tipo_evento, evento_id)
  WHERE status = 'sucesso';

GRANT SELECT ON public.eventos_contabilizacao_log TO authenticated;
GRANT ALL ON public.eventos_contabilizacao_log TO service_role;
ALTER TABLE public.eventos_contabilizacao_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "eventos_contab_select" ON public.eventos_contabilizacao_log
    FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
