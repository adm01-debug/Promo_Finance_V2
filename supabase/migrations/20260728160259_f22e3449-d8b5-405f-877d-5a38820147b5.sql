-- ============ GLOSSÁRIO TRIBUTÁRIO ============
CREATE TABLE IF NOT EXISTS public.glossario_tributario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  termo TEXT NOT NULL UNIQUE,
  sigla TEXT,
  categoria TEXT,
  significado TEXT NOT NULL,
  base_legal TEXT,
  exemplo TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_glossario_categoria ON public.glossario_tributario(categoria, termo);

GRANT SELECT ON public.glossario_tributario TO authenticated;
GRANT ALL ON public.glossario_tributario TO service_role;
ALTER TABLE public.glossario_tributario ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  DROP POLICY IF EXISTS "glossario_leitura" ON public.glossario_tributario;
  CREATE POLICY "glossario_leitura" ON public.glossario_tributario
    FOR SELECT TO authenticated USING (ativo);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  DROP POLICY IF EXISTS "glossario_admin" ON public.glossario_tributario;
  CREATE POLICY "glossario_admin" ON public.glossario_tributario
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN invalid_text_representation OR undefined_function OR undefined_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE TRIGGER trg_glossario_updated_at BEFORE UPDATE ON public.glossario_tributario
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO public.glossario_tributario (termo, sigla, categoria, significado, base_legal, ordem) VALUES
('Contribuição sobre Bens e Serviços','CBS','Reforma Tributária','Tributo federal do IVA dual que substitui PIS, COFINS e IPI, com crédito financeiro amplo e não cumulatividade plena.','EC 132/2023; LC 214/2025',1),
('Imposto sobre Bens e Serviços','IBS','Reforma Tributária','Tributo subnacional do IVA dual que substitui ICMS e ISS, arrecadado no destino e gerido pelo Comitê Gestor.','EC 132/2023; LC 214/2025',2),
('Imposto Seletivo','IS','Reforma Tributária','Imposto extrafiscal sobre bens e serviços prejudiciais à saúde ou ao meio ambiente, incidente uma única vez na cadeia.','EC 132/2023, art. 153, VIII',3),
('Split Payment','','Reforma Tributária','Recolhimento no ato da liquidação financeira: a instituição de pagamento separa e repassa o IBS/CBS diretamente ao fisco.','LC 214/2025, arts. 31 a 35',4),
('Cashback','','Reforma Tributária','Devolução de parte do IBS/CBS a famílias de baixa renda, apurada por CPF na nota fiscal.','EC 132/2023, art. 156-A, §5º, VIII',5),
('Período de Transição','','Reforma Tributária','Janela 2026-2032 em que os tributos antigos convivem com CBS e IBS em alíquotas-teste progressivas até a extinção em 2033.','EC 132/2023, art. 125 e ss.',6),
('Alíquota de Referência','','Reforma Tributária','Alíquota calculada pelo Senado para manter a carga tributária global durante a transição.','EC 132/2023, art. 130',7),
('Crédito Financeiro','','Reforma Tributária','Direito ao crédito sobre toda aquisição onerada por IBS/CBS, independentemente de o bem integrar o produto final.','LC 214/2025, art. 47',8),
('Substituição Tributária','ST','ICMS','Regime em que um contribuinte da cadeia recolhe antecipadamente o ICMS devido pelas operações subsequentes.','LC 87/1996, art. 6º',9),
('Margem de Valor Agregado','MVA','ICMS','Percentual aplicado à base para estimar o preço final na substituição tributária, ajustado (MVA ajustada) em operações interestaduais.','Convênio ICMS 142/2018',10),
('Diferencial de Alíquota','DIFAL','ICMS','Diferença entre a alíquota interna do destino e a interestadual, devida em operações destinadas a outra UF.','LC 190/2022',11),
('Fundo de Combate à Pobreza','FCP','ICMS','Adicional de até 2% sobre a alíquota interna de produtos específicos, destinado a fundos estaduais.','ADCT, art. 82, §1º',12),
('Regime Monofásico','','PIS/COFINS','Tributação concentrada em um único elo da cadeia; os demais aplicam alíquota zero sobre a revenda.','Lei 10.147/2000; Lei 10.485/2002',13),
('Não Cumulatividade','','PIS/COFINS','Sistemática em que se descontam créditos das aquisições do débito das vendas, aplicável no Lucro Real.','Leis 10.637/2002 e 10.833/2003',14),
('Contribuição Previdenciária sobre Receita Bruta','CPRB','Folha','Desoneração da folha: substitui a contribuição patronal de 20% por alíquota sobre a receita bruta em setores elegíveis.','Lei 12.546/2011',15),
('Fator Acidentário de Prevenção','FAP','Folha','Multiplicador de 0,5 a 2,0 aplicado ao RAT conforme o histórico de acidentes da empresa.','Lei 10.666/2003, art. 10',16),
('Riscos Ambientais do Trabalho','RAT','Folha','Contribuição de 1%, 2% ou 3% sobre a folha conforme o grau de risco do CNAE preponderante.','Lei 8.212/1991, art. 22, II',17),
('Livro de Apuração do Lucro Real','LALUR','Lucro Real','Livro fiscal (Parte A e B) que registra adições, exclusões e compensações para apurar o lucro real.','Decreto 9.580/2018, art. 310',18),
('Trava dos 30%','','Lucro Real','Limite de compensação de prejuízos fiscais e base negativa a 30% do lucro líquido ajustado do período.','Lei 9.065/1995, art. 15',19),
('Juros sobre Capital Próprio','JCP','Lucro Real','Remuneração dedutível ao acionista limitada à TJLP sobre o patrimônio líquido e a 50% do lucro.','Lei 9.249/1995, art. 9º',20),
('Adicional de IRPJ','','IRPJ','Alíquota extra de 10% sobre a parcela do lucro que exceder R$ 20.000,00 por mês de apuração.','Lei 9.430/1996, art. 4º',21),
('Presunção de Lucro','','Lucro Presumido','Percentual aplicado sobre a receita bruta (1,6% a 32%) para obter a base de IRPJ e CSLL.','Lei 9.249/1995, art. 15',22),
('Receita Bruta Total dos 12 meses','RBT12','Simples Nacional','Somatório da receita dos 12 meses anteriores, base para definir a faixa e a alíquota efetiva.','LC 123/2006, art. 18',23),
('Fator R','','Simples Nacional','Razão folha/receita dos 12 meses: se ≥ 28%, a atividade migra do Anexo V para o Anexo III.','LC 123/2006, art. 18, §5º-J',24),
('Sublimite Estadual','','Simples Nacional','Teto de receita (em regra R$ 3,6 mi) acima do qual ICMS e ISS passam a ser recolhidos fora do Simples.','LC 123/2006, art. 19',25),
('Documento de Arrecadação de Receitas Federais','DARF','Obrigações','Guia de recolhimento de tributos federais, identificada por código de receita e período de apuração.','IN RFB 2.043/2021',26),
('Escrituração Contábil Fiscal','ECF','Obrigações','Obrigação anual que substitui a DIPJ e integra a contabilidade ao LALUR/LACS.','IN RFB 2.004/2021',27),
('EFD-Contribuições','','Obrigações','Escrituração digital mensal de PIS/COFINS e da contribuição previdenciária sobre a receita bruta.','IN RFB 1.252/2012',28),
('Pedido de Restituição e Declaração de Compensação','PER/DCOMP','Créditos','Instrumento eletrônico para restituir, ressarcir ou compensar créditos federais.','IN RFB 2.055/2021',29),
('Elisão Fiscal','','Planejamento','Redução lícita da carga tributária por escolha de estruturas e regimes antes da ocorrência do fato gerador.','CTN, art. 116, parágrafo único',30)
ON CONFLICT (termo) DO NOTHING;

-- ============ INCENTIVOS FISCAIS ============
CREATE TABLE IF NOT EXISTS public.incentivos_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo_incentivo TEXT NOT NULL,
  ano_inicio INTEGER NOT NULL CHECK (ano_inicio BETWEEN 1990 AND 2100),
  ano_fim INTEGER NOT NULL CHECK (ano_fim BETWEEN 1990 AND 2100),
  limite_percentual NUMERIC(9,4) NOT NULL DEFAULT 0 CHECK (limite_percentual >= 0 AND limite_percentual <= 100),
  limite_valor NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (limite_valor >= 0),
  valor_utilizado_ano NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (valor_utilizado_ano >= 0),
  numero_processo TEXT,
  ato_concessorio TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT incentivo_periodo_valido CHECK (ano_fim >= ano_inicio)
);
CREATE INDEX IF NOT EXISTS idx_incentivos_empresa ON public.incentivos_fiscais(empresa_id, ativo);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.incentivos_fiscais TO authenticated;
GRANT ALL ON public.incentivos_fiscais TO service_role;
ALTER TABLE public.incentivos_fiscais ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  DROP POLICY IF EXISTS "incentivos_fiscais_acesso" ON public.incentivos_fiscais;
  CREATE POLICY "incentivos_fiscais_acesso" ON public.incentivos_fiscais FOR ALL TO authenticated
    USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE TRIGGER trg_incentivos_updated_at BEFORE UPDATE ON public.incentivos_fiscais
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============ PER/DCOMP ============
CREATE TABLE IF NOT EXISTS public.per_dcomp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('per','dcomp')),
  numero_processo TEXT,
  numero_recibo TEXT,
  data_transmissao TIMESTAMPTZ,
  tipo_credito_origem TEXT NOT NULL
    CHECK (tipo_credito_origem IN ('saldo_negativo','pagamento_indevido','retencao','ressarcimento','exportacao')),
  tributo_origem TEXT NOT NULL,
  competencia_origem TEXT NOT NULL,
  valor_original NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (valor_original >= 0),
  valor_atualizado NUMERIC(15,2) CHECK (valor_atualizado IS NULL OR valor_atualizado >= 0),
  tributo_destino TEXT,
  competencia_destino TEXT,
  valor_compensado NUMERIC(15,2) CHECK (valor_compensado IS NULL OR valor_compensado >= 0),
  creditos_ids UUID[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'rascunho'
    CHECK (status IN ('rascunho','aguardando_transmissao','transmitido','em_analise','deferido','indeferido','cancelado')),
  data_protocolo DATE,
  data_decisao DATE,
  prazo_recurso DATE,
  justificativa TEXT,
  fundamentacao_legal TEXT,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_per_dcomp_empresa ON public.per_dcomp(empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_per_dcomp_status ON public.per_dcomp(empresa_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.per_dcomp TO authenticated;
GRANT ALL ON public.per_dcomp TO service_role;
ALTER TABLE public.per_dcomp ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  DROP POLICY IF EXISTS "per_dcomp_acesso" ON public.per_dcomp;
  CREATE POLICY "per_dcomp_acesso" ON public.per_dcomp FOR ALL TO authenticated
    USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE TRIGGER trg_per_dcomp_updated_at BEFORE UPDATE ON public.per_dcomp
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
