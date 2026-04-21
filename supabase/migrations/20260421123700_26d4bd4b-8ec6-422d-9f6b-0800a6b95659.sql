
-- Complementa plano_contas existente
ALTER TABLE public.plano_contas
  ADD COLUMN IF NOT EXISTS empresa_id UUID,
  ADD COLUMN IF NOT EXISTS centro_resultado TEXT,
  ADD COLUMN IF NOT EXISTS codigo_referencial TEXT;

CREATE INDEX IF NOT EXISTS idx_plano_contas_empresa ON public.plano_contas(empresa_id);

-- 2. Lançamentos Contábeis (cabeçalho)
CREATE TABLE public.lancamentos_contabeis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  numero_lancamento BIGINT,
  data_lancamento DATE NOT NULL,
  historico TEXT NOT NULL,
  origem TEXT NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual','conta_pagar','conta_receber','movimentacao','importacao','sistema')),
  origem_id UUID,
  valor_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmado' CHECK (status IN ('rascunho','confirmado','cancelado')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lanc_emp_data ON public.lancamentos_contabeis(empresa_id, data_lancamento DESC);
CREATE INDEX idx_lanc_origem ON public.lancamentos_contabeis(origem, origem_id);

ALTER TABLE public.lancamentos_contabeis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lanc_select" ON public.lancamentos_contabeis FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));
CREATE POLICY "lanc_insert" ON public.lancamentos_contabeis FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "lanc_update" ON public.lancamentos_contabeis FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "lanc_delete" ON public.lancamentos_contabeis FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_lanc_updated BEFORE UPDATE ON public.lancamentos_contabeis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sequência por exercício
CREATE OR REPLACE FUNCTION public.fn_lanc_numero_sequencial()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ano INT; v_seq BIGINT;
BEGIN
  IF NEW.numero_lancamento IS NULL THEN
    v_ano := EXTRACT(YEAR FROM NEW.data_lancamento);
    SELECT COALESCE(MAX(numero_lancamento),0)+1 INTO v_seq
      FROM public.lancamentos_contabeis
      WHERE empresa_id = NEW.empresa_id
        AND EXTRACT(YEAR FROM data_lancamento) = v_ano;
    NEW.numero_lancamento := v_seq;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_lanc_numero BEFORE INSERT ON public.lancamentos_contabeis
  FOR EACH ROW EXECUTE FUNCTION public.fn_lanc_numero_sequencial();

-- 3. Partidas Contábeis (D/C)
CREATE TABLE public.partidas_contabeis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lancamento_id UUID NOT NULL REFERENCES public.lancamentos_contabeis(id) ON DELETE CASCADE,
  conta_id UUID NOT NULL REFERENCES public.plano_contas(id) ON DELETE RESTRICT,
  tipo CHAR(1) NOT NULL CHECK (tipo IN ('D','C')),
  valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  historico_complementar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_partidas_lanc ON public.partidas_contabeis(lancamento_id);
CREATE INDEX idx_partidas_conta ON public.partidas_contabeis(conta_id);

ALTER TABLE public.partidas_contabeis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partidas_select" ON public.partidas_contabeis FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));
CREATE POLICY "partidas_insert" ON public.partidas_contabeis FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "partidas_update" ON public.partidas_contabeis FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "partidas_delete" ON public.partidas_contabeis FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- 4. SPED Contábil arquivos gerados
CREATE TABLE public.sped_contabil_arquivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ECD','ECF')),
  ano_calendario INT NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  storage_path TEXT NOT NULL,
  hash_sha256 TEXT,
  total_linhas INT,
  total_lancamentos INT,
  validacoes JSONB NOT NULL DEFAULT '{"erros":[],"avisos":[]}'::jsonb,
  status TEXT NOT NULL DEFAULT 'gerado' CHECK (status IN ('gerado','validado','transmitido','rejeitado')),
  recibo_transmissao TEXT,
  gerado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sped_contabil_empresa_ano ON public.sped_contabil_arquivos(empresa_id, ano_calendario DESC);

ALTER TABLE public.sped_contabil_arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sped_contabil_select" ON public.sped_contabil_arquivos FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "sped_contabil_insert" ON public.sped_contabil_arquivos FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "sped_contabil_update" ON public.sped_contabil_arquivos FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
