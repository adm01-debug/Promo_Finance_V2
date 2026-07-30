-- Tabela para armazenar templates de pagamentos recorrentes
CREATE TABLE public.pagamentos_recorrentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  fornecedor_nome TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  frequencia TEXT NOT NULL DEFAULT 'mensal' CHECK (frequencia IN ('semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual')),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  centro_custo_id UUID REFERENCES public.centros_custo(id),
  conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
  tipo_cobranca tipo_cobranca DEFAULT 'transferencia',
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  ultima_geracao DATE,
  proxima_geracao DATE,
  total_gerado INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_pagamentos_recorrentes_empresa ON public.pagamentos_recorrentes(empresa_id);
CREATE INDEX idx_pagamentos_recorrentes_ativo ON public.pagamentos_recorrentes(ativo);
CREATE INDEX idx_pagamentos_recorrentes_proxima ON public.pagamentos_recorrentes(proxima_geracao);

-- Enable RLS
ALTER TABLE public.pagamentos_recorrentes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários autenticados podem ver pagamentos recorrentes"
  ON public.pagamentos_recorrentes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem criar pagamentos recorrentes"
  ON public.pagamentos_recorrentes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuários podem atualizar pagamentos recorrentes"
  ON public.pagamentos_recorrentes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem deletar pagamentos recorrentes"
  ON public.pagamentos_recorrentes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pagamentos_recorrentes_updated_at
  BEFORE UPDATE ON public.pagamentos_recorrentes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular próxima data de geração
CREATE OR REPLACE FUNCTION public.calcular_proxima_geracao(
  p_ultima_geracao DATE,
  p_frequencia TEXT,
  p_dia_vencimento INTEGER
)
RETURNS DATE
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_proxima DATE;
  v_intervalo INTERVAL;
BEGIN
  -- Determinar intervalo baseado na frequência
  CASE p_frequencia
    WHEN 'semanal' THEN v_intervalo := '7 days'::INTERVAL;
    WHEN 'quinzenal' THEN v_intervalo := '15 days'::INTERVAL;
    WHEN 'mensal' THEN v_intervalo := '1 month'::INTERVAL;
    WHEN 'bimestral' THEN v_intervalo := '2 months'::INTERVAL;
    WHEN 'trimestral' THEN v_intervalo := '3 months'::INTERVAL;
    WHEN 'semestral' THEN v_intervalo := '6 months'::INTERVAL;
    WHEN 'anual' THEN v_intervalo := '1 year'::INTERVAL;
    ELSE v_intervalo := '1 month'::INTERVAL;
  END CASE;

  -- Calcular próxima data
  IF p_ultima_geracao IS NULL THEN
    v_proxima := CURRENT_DATE;
  ELSE
    v_proxima := p_ultima_geracao + v_intervalo;
  END IF;

  -- Ajustar para o dia do vencimento (para frequências mensais+)
  IF p_frequencia IN ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual') THEN
    v_proxima := make_date(
      EXTRACT(YEAR FROM v_proxima)::INTEGER,
      EXTRACT(MONTH FROM v_proxima)::INTEGER,
      LEAST(p_dia_vencimento, EXTRACT(DAY FROM (date_trunc('month', v_proxima) + INTERVAL '1 month - 1 day'))::INTEGER)
    );
  END IF;

  RETURN v_proxima;
END;
$$;

-- Função para gerar contas a pagar a partir de recorrentes
CREATE OR REPLACE FUNCTION public.gerar_contas_recorrentes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recorrente RECORD;
  v_conta_id UUID;
  v_total_gerado INTEGER := 0;
  v_data_vencimento DATE;
BEGIN
  FOR v_recorrente IN
    SELECT *
    FROM public.pagamentos_recorrentes
    WHERE ativo = true
      AND (proxima_geracao IS NULL OR proxima_geracao <= CURRENT_DATE)
      AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
  LOOP
    -- Calcular data de vencimento
    v_data_vencimento := COALESCE(v_recorrente.proxima_geracao, CURRENT_DATE);
    
    -- Ajustar dia do vencimento
    IF v_recorrente.frequencia IN ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual') THEN
      v_data_vencimento := make_date(
        EXTRACT(YEAR FROM v_data_vencimento)::INTEGER,
        EXTRACT(MONTH FROM v_data_vencimento)::INTEGER,
        LEAST(v_recorrente.dia_vencimento, EXTRACT(DAY FROM (date_trunc('month', v_data_vencimento) + INTERVAL '1 month - 1 day'))::INTEGER)
      );
    END IF;

    -- Criar conta a pagar
    INSERT INTO public.contas_pagar (
      descricao,
      fornecedor_id,
      fornecedor_nome,
      valor,
      data_vencimento,
      data_emissao,
      empresa_id,
      centro_custo_id,
      conta_bancaria_id,
      tipo_cobranca,
      observacoes,
      recorrente,
      created_by
    ) VALUES (
      v_recorrente.descricao || ' (Recorrente)',
      v_recorrente.fornecedor_id,
      v_recorrente.fornecedor_nome,
      v_recorrente.valor,
      v_data_vencimento,
      CURRENT_DATE,
      v_recorrente.empresa_id,
      v_recorrente.centro_custo_id,
      v_recorrente.conta_bancaria_id,
      v_recorrente.tipo_cobranca,
      v_recorrente.observacoes,
      true,
      v_recorrente.created_by
    )
    RETURNING id INTO v_conta_id;

    -- Atualizar registro recorrente
    UPDATE public.pagamentos_recorrentes
    SET 
      ultima_geracao = v_data_vencimento,
      proxima_geracao = calcular_proxima_geracao(v_data_vencimento, v_recorrente.frequencia, v_recorrente.dia_vencimento),
      total_gerado = total_gerado + 1
    WHERE id = v_recorrente.id;

    v_total_gerado := v_total_gerado + 1;
  END LOOP;

  RETURN v_total_gerado;
END;
$$;