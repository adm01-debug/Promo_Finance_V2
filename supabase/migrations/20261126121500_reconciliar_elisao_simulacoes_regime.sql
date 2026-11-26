-- ============================================================================
-- Reconciliação: public.elisao_simulacoes_regime
--
-- A tabela nasceu em 20260508140632 com o desenho antigo
-- (nome/ano_base/dados_faturamento/dados_despesas/resultado_*) e foi recriada
-- fora do versionamento já no desenho hoje em produção
-- (regime_atual/regime_simulado/carga_atual/carga_simulada/economia_estimada/
-- premissas/ano_referencia/detalhes). Tanto 20260728154640 quanto
-- 20260825100000 recriam a tabela com `CREATE TABLE IF NOT EXISTS`, que é no-op
-- quando ela já existe — logo, num banco construído apenas pelas migrations, as
-- colunas do desenho novo nunca são criadas e o INSERT do simulador de elisão
-- falha em `nome NOT NULL`.
--
-- Esta migration converge os dois estados para o desenho vivo, sem apagar dado:
--   * cria as colunas que faltam (IF NOT EXISTS);
--   * relaxa o NOT NULL das colunas do desenho antigo, que o simulador atual
--     não envia;
--   * aproveita ano_base como ano_referencia onde o dado antigo existir.
-- É idempotente: em produção (já no desenho vivo) roda como no-op.
-- Índice, FK, RLS e trigger já são garantidos por 20260825100000/20260825110000.
-- ============================================================================

ALTER TABLE public.elisao_simulacoes_regime
  ADD COLUMN IF NOT EXISTS regime_atual TEXT,
  ADD COLUMN IF NOT EXISTS regime_simulado TEXT,
  ADD COLUMN IF NOT EXISTS carga_atual NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carga_simulada NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS economia_estimada NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS premissas JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ano_referencia INTEGER,
  ADD COLUMN IF NOT EXISTS detalhes JSONB,
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- `nome` e `ano_base` só existem no desenho antigo; mantê-los NOT NULL
-- derrubava toda simulação nova, que grava apenas as colunas do desenho vivo.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'elisao_simulacoes_regime'
       AND column_name = 'nome'
       AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.elisao_simulacoes_regime ALTER COLUMN nome DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'elisao_simulacoes_regime'
       AND column_name = 'ano_base'
       AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.elisao_simulacoes_regime ALTER COLUMN ano_base DROP NOT NULL;
  END IF;
END;
$$;

-- ano_base e ano_referencia guardam a mesma informação (ano do cenário).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'elisao_simulacoes_regime'
       AND column_name = 'ano_base'
  ) THEN
    UPDATE public.elisao_simulacoes_regime
       SET ano_referencia = ano_base
     WHERE ano_referencia IS NULL
       AND ano_base IS NOT NULL;
  END IF;
END;
$$;
