-- Catalogo de estrategias de elisao fiscal: a cadeia termina como VIEW, mas em
-- PRODUCAO o objeto e TABELA. Esta migration reconcilia a cadeia com producao.
--
-- ESTADO REAL EM PRODUCAO (conferido no projeto canonico bwwbeyolnnzppeuhgkcd):
--   pg_class.relkind = 'r'  (tabela)
--   8 linhas
--   RLS ligada, 1 policy: estrategias_elisao_catalogo_select (SELECT, authenticated)
--   PK (id), UNIQUE (codigo), nenhum trigger
--   colunas: id, codigo, nome, descricao, tipo, economia_estimada_padrao, ativo, created_at
--   e alvo da FK oportunidades_elisao_estrategia_id_fkey
--
-- O QUE A CADEIA FAZ HOJE:
--   20260417155857_5c06caf2-...sql:2   CREATE TABLE  (forma ANTIGA: base_legal,
--                                      risco, aplicavel_a, requisitos,
--                                      economia_potencial_min/max, updated_at)
--   20260728154640_2b62d1ef-...sql:51  DROP TABLE ... CASCADE
--   20260728154640_2b62d1ef-...sql:62  CREATE VIEW sobre public.estrategias_elisao
--   20260825100000:10800/10803         DROP VIEW + CREATE VIEW de novo
--   ...e nunca volta a ser tabela.
--
-- POR QUE A VIEW ESTA ERRADA, e nao producao:
--   1. estrategias_elisao_catalogo e estrategias_elisao NAO sao o mesmo objeto.
--      Em producao as duas existem como tabelas separadas, com colunas e
--      conteudo diferentes (catalogo: 8 linhas, colunas tipo/economia_estimada_padrao;
--      estrategias_elisao: 17 linhas, colunas categoria/risco/base_legal/
--      regimes_aplicaveis). A view faz o nome do catalogo devolver as colunas da
--      outra tabela.
--   2. PostgreSQL nao aceita FK apontando para view (ERROR 42809), e a FK
--      oportunidades_elisao_estrategia_id_fkey existe em producao, com as 4 linhas
--      de oportunidades_elisao preenchidas.
--   3. CREATE POLICY em view tambem e rejeitado: por isso a secao 3 da
--      20261116190000 precisou de um guard por relkind, e por isso a FK de
--      estrategia_id e a unica das 17 da 20261116220000 que e ignorada no replay.
--   4. src/integrations/supabase/types.ts:6575 (gerado a partir de producao) declara
--      exatamente as 8 colunas desta tabela. O unico consumidor,
--      src/hooks/useOportunidadesElisao.ts:30, faz select('*').eq('ativo',true)
--      .order('codigo') — com a view, 'tipo' e 'economia_estimada_padrao' nao
--      chegam e colunas que o tipo nao conhece chegam no lugar.
--
-- EFEITO EM PRODUCAO: nenhum. Tudo aqui e idempotente e ja esta no estado final
-- (a view nao existe, a tabela existe com estas colunas, a policy e identica, a
-- FK existe, os 8 codigos existem). O ganho e na cadeia versionada: preview,
-- staging e recuperacao de desastre passam a nascer iguais a producao.

-- 1. Remove a view, se for view. Em producao nao e: no-op.
DO $cat$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = 'estrategias_elisao_catalogo'
       AND c.relkind = 'v'
  ) THEN
    EXECUTE 'DROP VIEW public.estrategias_elisao_catalogo CASCADE';
    RAISE NOTICE 'estrategias_elisao_catalogo era view: removida para ser recriada como tabela';
  ELSE
    RAISE NOTICE 'estrategias_elisao_catalogo nao e view: DROP ignorado';
  END IF;
END
$cat$

-- 2. A tabela, na forma exata de producao.
CREATE TABLE IF NOT EXISTS public.estrategias_elisao_catalogo (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                   text NOT NULL UNIQUE,
  nome                     text NOT NULL,
  descricao                text,
  tipo                     text,
  economia_estimada_padrao numeric,
  ativo                    boolean NOT NULL DEFAULT true,
  created_at               timestamptz NOT NULL DEFAULT now()
)

-- 3. RLS e leitura. Mesma policy que a 20261116190000 cria sob guard; aqui ela
--    deixa de depender do guard porque o objeto passa a ser tabela sempre.
--    USING (true) e deliberado: catalogo de referencia, sem dado de empresa.
--    Allowlist: scripts/security/test-canonical-db-gates.mjs:119.
ALTER TABLE public.estrategias_elisao_catalogo ENABLE ROW LEVEL SECURITY

DROP POLICY IF EXISTS estrategias_elisao_catalogo_select ON public.estrategias_elisao_catalogo

CREATE POLICY estrategias_elisao_catalogo_select
  ON public.estrategias_elisao_catalogo
  FOR SELECT
  TO authenticated
  USING (true)

GRANT SELECT ON public.estrategias_elisao_catalogo TO authenticated

GRANT SELECT ON public.estrategias_elisao_catalogo TO service_role

-- 4. Conteudo de referencia: os 8 codigos que existem em producao. Sem dado de
--    cliente, sem valor de empresa. ON CONFLICT (codigo) DO NOTHING deixa
--    producao intacta e preenche ambiente novo.
INSERT INTO public.estrategias_elisao_catalogo
  (codigo, nome, descricao, tipo, economia_estimada_padrao, ativo)
VALUES
  ('CRED_ICMS_ATIVO','Crédito de ICMS sobre Ativo Imobilizado','Aproveitamento de créditos de ICMS na aquisição de ativo imobilizado','credito_tributario',65000.00,true),
  ('CRED_ICMS_ST','Recuperação de ICMS-ST','Recuperação de ICMS pago por Substituição Tributária em operações interestaduais','credito_tributario',28000.00,true),
  ('CRED_PIS_COFINS','Crédito de PIS/COFINS sobre Insumos','Aproveitamento de créditos de PIS/COFINS sobre insumos essenciais ao processo produtivo','credito_tributario',45000.00,true),
  ('DEP_ACELERADA','Depreciação Acelerada por Inovação Tecnológica','Depreciação acelerada incentivada sobre bens adquiridos para inovação','depreciacao',18500.00,true),
  ('INOV_TECNOLOGIA','Lei do Bem - Inovação Tecnológica','Dedução de despesas com inovação tecnológica (60% adicional)','incentivo_fiscal',95000.00,true),
  ('JUCESP_DIGITAL','Redução de Custos com JUCESP Digital','Utilização de registro digital para reduzir custos cartoriais','administrativa',8500.00,true),
  ('PLR_DEDUCAO','PLR como Despesa Dedutível','Dedução da Participação nos Lucros e Resultados como despesa operacional','deducao',32000.00,true),
  ('RATEIO_CUSTOS','Rateio de Custos Compartilhados','Rateio adequado de custos entre empresas do grupo para evitar autuação','compliance',12000.00,true)
ON CONFLICT (codigo) DO NOTHING

-- 5. A FK que a 20261116220000 e obrigada a ignorar enquanto o alvo e view.
--    Em producao ja existe: no-op.
DO $fk$
BEGIN
  IF to_regclass('public.oportunidades_elisao') IS NULL THEN
    RAISE NOTICE 'public.oportunidades_elisao ausente: FK estrategia_id ignorada';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'oportunidades_elisao'
       AND column_name = 'estrategia_id'
  ) THEN
    RAISE NOTICE 'oportunidades_elisao.estrategia_id ausente: FK ignorada';
  ELSIF EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'oportunidades_elisao_estrategia_id_fkey'
       AND conrelid = 'public.oportunidades_elisao'::regclass
  ) THEN
    RAISE NOTICE 'oportunidades_elisao_estrategia_id_fkey ja existe: FK ignorada';
  ELSE
    ALTER TABLE public.oportunidades_elisao
      ADD CONSTRAINT oportunidades_elisao_estrategia_id_fkey
      FOREIGN KEY (estrategia_id)
      REFERENCES public.estrategias_elisao_catalogo(id);
    RAISE NOTICE 'oportunidades_elisao_estrategia_id_fkey criada';
  END IF;
END
$fk$
