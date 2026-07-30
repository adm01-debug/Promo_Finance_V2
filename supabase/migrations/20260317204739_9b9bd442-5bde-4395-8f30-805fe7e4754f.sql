
-- PIX Templates table for saving reusable payment templates
CREATE TABLE public.pix_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  centro_custo_id UUID REFERENCES public.centros_custo(id) ON DELETE SET NULL,
  favorecido_nome TEXT NOT NULL,
  favorecido_cpf_cnpj TEXT,
  chave_pix TEXT NOT NULL,
  tipo_chave_pix TEXT NOT NULL DEFAULT 'cpf',
  valor_padrao NUMERIC DEFAULT 0,
  valor_fixo BOOLEAN DEFAULT false,
  categoria TEXT,
  tags TEXT[] DEFAULT '{}',
  uso_count INTEGER DEFAULT 0,
  ultimo_uso TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pix_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view pix_templates"
  ON public.pix_templates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert pix_templates"
  ON public.pix_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update pix_templates"
  ON public.pix_templates FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Admins can delete pix_templates"
  ON public.pix_templates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_pix_templates_updated_at
  BEFORE UPDATE ON public.pix_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
