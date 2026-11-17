-- Catálogo de estratégias de elisão fiscal
CREATE TABLE public.estrategias_elisao_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text NOT NULL,
  base_legal text NOT NULL,
  risco text NOT NULL CHECK (risco IN ('baixo', 'medio', 'alto')),
  aplicavel_a text[] NOT NULL DEFAULT '{}',
  requisitos jsonb NOT NULL DEFAULT '{}'::jsonb,
  economia_potencial_min numeric,
  economia_potencial_max numeric,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estrategias_elisao_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catálogo elisão visível para autenticados"
  ON public.estrategias_elisao_catalogo FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins gerenciam catálogo elisão"
  ON public.estrategias_elisao_catalogo FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_estrategias_elisao_updated_at
  BEFORE UPDATE ON public.estrategias_elisao_catalogo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Benchmarks setoriais
CREATE TABLE public.benchmarks_setoriais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cnae_prefix text NOT NULL,
  setor text NOT NULL,
  regime text NOT NULL CHECK (regime IN ('simples', 'presumido', 'real')),
  carga_media_pct numeric NOT NULL,
  margem_media_pct numeric NOT NULL,
  fonte text,
  ano_referencia integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cnae_prefix, regime, ano_referencia)
);

ALTER TABLE public.benchmarks_setoriais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Benchmarks visíveis para autenticados"
  ON public.benchmarks_setoriais FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins gerenciam benchmarks"
  ON public.benchmarks_setoriais FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_benchmarks_setoriais_updated_at
  BEFORE UPDATE ON public.benchmarks_setoriais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_benchmarks_cnae ON public.benchmarks_setoriais (cnae_prefix);

-- Seed: 9 estratégias de elisão
INSERT INTO public.estrategias_elisao_catalogo (codigo, nome, descricao, base_legal, risco, aplicavel_a, requisitos, economia_potencial_min, economia_potencial_max) VALUES
('MS_LC224', 'Mandado de Segurança LC 224/2025', 'Discussão judicial sobre limites e regras da Lei Complementar 224/2025 (Reforma Tributária) que afetam empresas do Simples Nacional próximas ao sublimite estadual.', 'LC 224/2025; CF/88 art. 5º, LXIX', 'medio', ARRAY['simples'], '{"rbt12_min": 3240000, "proximidade_sublimite_pct": 90}'::jsonb, 0.05, 0.15),
('JCP', 'Juros sobre Capital Próprio', 'Distribuição de JCP como despesa dedutível no Lucro Real, reduzindo IRPJ/CSLL. Limitada a TJLP × PL ou 50% do lucro.', 'Lei 9.249/95 art. 9º; RIR/2018 art. 355', 'baixo', ARRAY['real'], '{"patrimonio_liquido_min": 100000, "lucro_positivo": true}'::jsonb, 0.08, 0.18),
('REINTEGRA', 'Reintegra — Crédito sobre Exportação', 'Apuração de crédito de 0,1% a 3% sobre receita de exportação para devolução de resíduos tributários.', 'Lei 13.043/14; Decreto 8.415/15', 'baixo', ARRAY['simples', 'presumido', 'real'], '{"receita_exportacao_min": 1}'::jsonb, 0.001, 0.03),
('HOLDING', 'Holding Patrimonial / Familiar', 'Constituição de holding para concentrar participações societárias e patrimônio, otimizando ITCMD, sucessão e dividendos. Especialmente relevante com IRPFM (Lei 15.270/2025).', 'Lei 15.270/2025; CC/2002; Lei 6.404/76', 'medio', ARRAY['simples', 'presumido', 'real'], '{"dividendos_anuais_min": 600000}'::jsonb, 0.10, 0.30),
('PAT', 'Programa de Alimentação ao Trabalhador', 'Dedução de até 4% do IRPJ devido para empresas Lucro Real que custeiam alimentação dos funcionários.', 'Lei 6.321/76; Decreto 10.854/21', 'baixo', ARRAY['real'], '{"folha_minima": 50000}'::jsonb, 0.01, 0.04),
('LEI_BEM', 'Lei do Bem — Incentivo P&D', 'Exclusão de até 60% (até 100%) das despesas com Pesquisa & Desenvolvimento da base do IRPJ/CSLL.', 'Lei 11.196/05 cap. III; Decreto 5.798/06', 'medio', ARRAY['real'], '{"despesas_pd_min": 50000}'::jsonb, 0.15, 0.34),
('DRAWBACK', 'Drawback — Suspensão de Tributos', 'Suspensão/restituição de II, IPI, PIS, COFINS, ICMS sobre insumos importados destinados a produto exportado.', 'Lei 11.945/09; Portaria SECEX 23/2011', 'baixo', ARRAY['presumido', 'real'], '{"importacao_min": 100000, "exportacao_min": 100000}'::jsonb, 0.05, 0.20),
('SUBVENCAO_ICMS', 'Subvenção de ICMS — Exclusão da Base IRPJ/CSLL', 'Exclusão dos benefícios fiscais de ICMS da base de cálculo do IRPJ/CSLL (Tema 1.182 STJ).', 'LC 160/17; Lei 12.973/14 art. 30; Tema 1.182 STJ', 'medio', ARRAY['real'], '{"beneficio_icms_min": 10000}'::jsonb, 0.05, 0.34),
('BONIFICACAO', 'Bonificação em Mercadorias', 'Estruturação de bonificações comerciais para reduzir base de cálculo do ICMS, PIS e COFINS.', 'LC 87/96 art. 13; Tema 144 STJ; Lei 10.637/02', 'medio', ARRAY['presumido', 'real'], '{"volume_vendas_min": 500000}'::jsonb, 0.02, 0.09);

-- Seed: benchmarks setoriais (carga total média por setor/regime)
INSERT INTO public.benchmarks_setoriais (cnae_prefix, setor, regime, carga_media_pct, margem_media_pct, fonte, ano_referencia) VALUES
('47', 'Comércio Varejista', 'simples', 6.5, 12.0, 'IBPT 2024', 2025),
('47', 'Comércio Varejista', 'presumido', 11.3, 12.0, 'IBPT 2024', 2025),
('47', 'Comércio Varejista', 'real', 14.8, 12.0, 'IBPT 2024', 2025),
('10', 'Indústria de Alimentos', 'presumido', 13.5, 18.0, 'IBPT 2024', 2025),
('10', 'Indústria de Alimentos', 'real', 16.2, 18.0, 'IBPT 2024', 2025),
('62', 'Tecnologia / Software', 'simples', 8.7, 25.0, 'IBPT 2024', 2025),
('62', 'Tecnologia / Software', 'presumido', 13.3, 25.0, 'IBPT 2024', 2025),
('69', 'Atividades Jurídicas/Contábeis', 'simples', 12.5, 30.0, 'IBPT 2024', 2025);

-- Reconciliacao com producao, no arquivo que CRIA a tabela.
-- Este CREATE TABLE (linha 36) e o vencedor no replay: e CREATE TABLE puro e tem
-- o timestamp mais antigo, enquanto 20260728163134:6 e 20260825100000:207 sao
-- CREATE TABLE IF NOT EXISTS, no-op. Ele declara ano_referencia e NAO declara
-- vigencia_inicio/vigencia_fim, que existem em PRODUCAO (conferido no canonico:
-- bench_tem_vigencia=1, tem_benchmark_unico=1).
-- Sem estas colunas, 20260825110000:7046 falhava com
--   ERROR: column "vigencia_inicio" named in key does not exist
-- ao criar a constraint benchmark_unico (cnae_prefix, regime, vigencia_inicio),
-- e como o arquivo roda em uma transacao, derrubava a criacao de risk_rules,
-- alerts_sent, geo_blocks e watch_cron_failures junto.
-- Em producao e no-op: este arquivo ja foi aplicado.
ALTER TABLE public.benchmarks_setoriais
  ADD COLUMN IF NOT EXISTS vigencia_inicio date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS vigencia_fim date;

-- Continuacao da reconciliacao. O schema de PRODUCAO desta tabela nasceu fora
-- das migrations (era o par indicador/valor/percentis da era Lovable), entao
-- tem colunas que nenhum arquivo versionado cria -- `indicador` (NOT NULL),
-- `carga_p25_pct`, `carga_p75_pct`, `mediana` -- e NAO tem `margem_media_pct`
-- nem `ano_referencia`. O CHECK de regime da linha 40 usa o vocabulario curto, e
-- o ADD CONSTRAINT canonico de 20260825220000:146 cai em `duplicate_object`
-- (mesmo nome) sem corrigir nada.
-- Sem este bloco, o replay do historico quebra no seed de 20261117052200 com
--   ERROR: column "indicador" of relation "benchmarks_setoriais" does not exist
-- e, passando dali, com violacao do CHECK de regime.
-- Em producao e no-op: o arquivo ja foi aplicado e cada passo e condicional.
ALTER TABLE public.benchmarks_setoriais
  ADD COLUMN IF NOT EXISTS indicador text,
  ADD COLUMN IF NOT EXISTS carga_p25_pct numeric,
  ADD COLUMN IF NOT EXISTS carga_p75_pct numeric,
  ADD COLUMN IF NOT EXISTS mediana numeric;

DO $reconcilia_benchmarks$
BEGIN
  -- Vocabulario de regime: solta o CHECK antigo, converte o dado legado e so
  -- entao grava o CHECK canonico (converter antes de soltar viola o CHECK).
  IF EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.benchmarks_setoriais'::regclass
       AND conname = 'benchmarks_setoriais_regime_check'
       AND pg_get_constraintdef(oid) NOT LIKE '%simples_nacional%'
  ) THEN
    ALTER TABLE public.benchmarks_setoriais
      DROP CONSTRAINT benchmarks_setoriais_regime_check;
    UPDATE public.benchmarks_setoriais
       SET regime = CASE regime
                      WHEN 'simples' THEN 'simples_nacional'
                      WHEN 'presumido' THEN 'lucro_presumido'
                      WHEN 'real' THEN 'lucro_real'
                      ELSE regime
                    END;
    ALTER TABLE public.benchmarks_setoriais
      ADD CONSTRAINT benchmarks_setoriais_regime_check
      CHECK (regime IN ('mei', 'simples_nacional', 'lucro_presumido', 'lucro_real', 'arbitrado'));
  END IF;

  -- `indicador` e NOT NULL em producao; as linhas do seed acima medem carga total.
  UPDATE public.benchmarks_setoriais
     SET indicador = 'carga_tributaria_total'
   WHERE indicador IS NULL;
  ALTER TABLE public.benchmarks_setoriais ALTER COLUMN indicador SET NOT NULL;

  -- `margem_media_pct` nao existe em producao; onde existir (replay) nao pode
  -- bloquear um INSERT que a tabela de producao aceita.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'benchmarks_setoriais'
       AND column_name = 'margem_media_pct'
  ) THEN
    EXECUTE 'ALTER TABLE public.benchmarks_setoriais ALTER COLUMN margem_media_pct DROP NOT NULL';
  END IF;

  -- As 8 linhas do seed acima sao do ano_referencia 2025. Sem isto ficariam com
  -- vigencia_inicio = CURRENT_DATE e competiriam com o catalogo de 2026.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'benchmarks_setoriais'
       AND column_name = 'ano_referencia'
  ) THEN
    EXECUTE 'UPDATE public.benchmarks_setoriais
                SET vigencia_inicio = make_date(ano_referencia, 1, 1)
              WHERE vigencia_inicio <> make_date(ano_referencia, 1, 1)';
  END IF;
END
$reconcilia_benchmarks$;
