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
--   * cria as colunas que faltam (IF NOT EXISTS), com os tipos de producao
--     (economia_estimada NUMERIC(14,2): 20260728154640 e 20260825100000 declaram
--     15,2, mas sao CREATE TABLE IF NOT EXISTS e viram no-op sobre esta tabela);
--   * relaxa o NOT NULL das colunas do desenho antigo, que o simulador atual
--     não envia;
--   * aproveita ano_base como ano_referencia onde o dado antigo existir.
--   * preserva updated_at no preenchimento: os gatilhos de updated_at da tabela
--     gravariam now() e a lista de cenarios passaria a mostrar a data da
--     migracao no lugar da data historica.
-- É idempotente: em produção (já no desenho vivo) roda como no-op.
-- Índice, FK, RLS e trigger já são garantidos por 20260825100000/20260825110000.
-- ============================================================================

ALTER TABLE public.elisao_simulacoes_regime
  ADD COLUMN IF NOT EXISTS regime_atual TEXT,
  ADD COLUMN IF NOT EXISTS regime_simulado TEXT,
  ADD COLUMN IF NOT EXISTS carga_atual NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carga_simulada NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS economia_estimada NUMERIC(14,2),
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
DECLARE
  -- Gatilhos de updated_at da tabela, com o estado em que estavam ligados. Sem
  -- desliga-los, o UPDATE abaixo dispara handle_updated_at/update_updated_at_column
  -- e sobrescreve a data historica do cenario. A lista e capturada antes de
  -- desligar: depois disso todos aparecem com tgenabled = 'D'.
  alvos TEXT[] := ARRAY(
    SELECT t.tgname || '|' || t.tgenabled::text
      FROM pg_trigger t
      JOIN pg_proc p ON p.oid = t.tgfoid
     WHERE t.tgrelid = 'public.elisao_simulacoes_regime'::regclass
       AND NOT t.tgisinternal
       AND t.tgenabled <> 'D'
       AND p.proname IN ('update_updated_at_column', 'handle_updated_at')
  );
  alvo TEXT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'elisao_simulacoes_regime'
       AND column_name = 'ano_base'
  ) THEN
    FOREACH alvo IN ARRAY alvos LOOP
      EXECUTE format(
        'ALTER TABLE public.elisao_simulacoes_regime DISABLE TRIGGER %I',
        split_part(alvo, '|', 1)
      );
    END LOOP;

    UPDATE public.elisao_simulacoes_regime
       SET ano_referencia = ano_base
     WHERE ano_referencia IS NULL
       AND ano_base IS NOT NULL;

    FOREACH alvo IN ARRAY alvos LOOP
      EXECUTE format(
        'ALTER TABLE public.elisao_simulacoes_regime ENABLE %s TRIGGER %I',
        CASE split_part(alvo, '|', 2) WHEN 'A' THEN 'ALWAYS' WHEN 'R' THEN 'REPLICA' ELSE '' END,
        split_part(alvo, '|', 1)
      );
    END LOOP;
  END IF;
END;
$$;
