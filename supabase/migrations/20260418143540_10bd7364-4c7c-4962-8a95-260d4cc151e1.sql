
-- ========================================
-- TABELA: notas_fiscais_ocr
-- ========================================
DO $$ BEGIN
  CREATE TYPE public.status_nf_ocr AS ENUM ('processando', 'sucesso', 'erro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.notas_fiscais_ocr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  arquivo_url TEXT NOT NULL,
  arquivo_nome TEXT,
  arquivo_tipo TEXT,
  status public.status_nf_ocr NOT NULL DEFAULT 'processando',
  dados_extraidos JSONB,
  mensagem_erro TEXT,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id) ON DELETE SET NULL,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_ocr_empresa ON public.notas_fiscais_ocr(empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_ocr_criado_por ON public.notas_fiscais_ocr(criado_por, created_at DESC);

ALTER TABLE public.notas_fiscais_ocr ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados visualizam NFs OCR"
  ON public.notas_fiscais_ocr FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados criam NFs OCR"
  ON public.notas_fiscais_ocr FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = criado_por);

CREATE POLICY "Usuários atualizam suas próprias NFs OCR"
  ON public.notas_fiscais_ocr FOR UPDATE
  TO authenticated
  USING (auth.uid() = criado_por OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins deletam NFs OCR"
  ON public.notas_fiscais_ocr FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_notas_fiscais_ocr_updated_at
  BEFORE UPDATE ON public.notas_fiscais_ocr
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_notas_fiscais_ocr_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.notas_fiscais_ocr
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_tributario();

-- ========================================
-- TABELA: resumos_executivos_semanais
-- ========================================
CREATE TABLE IF NOT EXISTS public.resumos_executivos_semanais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  semana_inicio DATE NOT NULL,
  semana_fim DATE NOT NULL,
  resumo_md TEXT NOT NULL,
  kpis JSONB NOT NULL DEFAULT '{}'::jsonb,
  destinatarios TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  enviado_em TIMESTAMPTZ,
  erro_envio TEXT,
  modelo_ia TEXT DEFAULT 'openai/gpt-5-mini',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, semana_inicio)
);

CREATE INDEX IF NOT EXISTS idx_resumos_executivos_empresa ON public.resumos_executivos_semanais(empresa_id, semana_inicio DESC);

ALTER TABLE public.resumos_executivos_semanais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados visualizam resumos executivos"
  ON public.resumos_executivos_semanais FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role gerencia resumos executivos"
  ON public.resumos_executivos_semanais FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins gerenciam resumos executivos"
  ON public.resumos_executivos_semanais FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_resumos_executivos_updated_at
  BEFORE UPDATE ON public.resumos_executivos_semanais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- BUCKET: notas-fiscais-upload (privado)
-- ========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('notas-fiscais-upload', 'notas-fiscais-upload', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Usuários autenticados fazem upload de NFs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'notas-fiscais-upload' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários autenticados leem suas NFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'notas-fiscais-upload' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Usuários deletam suas NFs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'notas-fiscais-upload' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));
