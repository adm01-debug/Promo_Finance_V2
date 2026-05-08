-- Adicionar campos de premissas detalhadas para o Simulador 2025
ALTER TABLE public.elisao_simulacoes_regime 
ADD COLUMN IF NOT EXISTS premissas_reforma JSONB DEFAULT '{"aliquota_cbs": 0.088, "aliquota_ibs": 0.177, "ano_transicao": 2026}',
ADD COLUMN IF NOT EXISTS premissas_operacionais JSONB DEFAULT '{"crescimento_anual": 0.05, "margem_ebitda": 0.15, "folha_prolabore": 0.28}';

-- Função para simular crédito tributário baseado em notas fiscais existentes
CREATE OR REPLACE FUNCTION public.calcular_potencial_elisao(p_empresa_id UUID)
RETURNS TABLE (
    tipo_oportunidade TEXT,
    valor_estimado DECIMAL(15,2),
    descricao TEXT,
    ncm_relacionado TEXT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.tipo_credito as tipo_oportunidade,
        SUM(nfi.valor_total * (r.aliquota_pis_reducao + r.aliquota_cofins_reducao)) as valor_estimado,
        r.descricao,
        r.ncm
    FROM elisao_regras_creditos r
    JOIN nota_fiscal_itens nfi ON nfi.ncm = r.ncm
    JOIN notas_fiscais nf ON nf.id = nfi.nota_fiscal_id
    WHERE nf.empresa_id = p_empresa_id
      AND nf.tipo = 'entrada' -- Analisando créditos em notas de entrada
      AND nf.data_emissao >= (now() - interval '12 months')
    GROUP BY r.tipo_credito, r.descricao, r.ncm;
END;
$$;
