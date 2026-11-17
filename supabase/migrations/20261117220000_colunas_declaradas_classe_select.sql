-- 20261117220000_colunas_declaradas_classe_select.sql
--
-- Cinco colunas declaradas em migrations antigas que nunca chegaram a
-- producao. Elas nao apareceram na varredura de escrita (#440) porque o codigo
-- as LE, nao as escreve: a varredura de `.select()` / `.order()` foi o que as
-- encontrou. PostgREST recusa o select inteiro com 42703 quando uma coluna nao
-- existe, entao cada uma derruba uma funcionalidade inteira:
--
--   empresas.inscricao_municipal        declarada em 20260317124844
--     -> exportar-sped-contribuicoes/index.ts:107 (bloco 0000 do EFD
--        Contribuicoes); hoje o export inteiro falha
--   profiles.telefone                   declarada em 20251214170739 e
--                                       20260317124844
--     -> sso-callback/index.ts:355 (sincronizacao de perfil no login SSO) e
--        sync-profile-to-bitrix/index.ts:162 (telefone para o Bitrix)
--   movimentacoes.centro_custo_id        declarada em 20260317000749
--     -> detectar-anomalias-financeiras/index.ts:184 (detector 1, outlier
--        acima de 3 sigma); o detector esta desligado
--   regras_conciliacao.categoria         declarada em 20260314162441
--     -> useMetricasAprendizadoIA.ts:63 (painel de regras mais aplicadas)
--   solicitacoes_lgpd.atendida_por       declarada em 20260418144137
--     -> fechamento de solicitacao LGPD; hoje gravado dentro de
--        payload_resposta (contorno da PR #439)
--
-- Tipos copiados da declaracao original de cada uma. A FK de
-- movimentacoes.centro_custo_id aponta para centros_custo(id), que existe em
-- producao; ON DELETE SET NULL para nao bloquear exclusao de centro de custo.
-- Idempotente: ADD COLUMN IF NOT EXISTS e FK sob guarda de pg_constraint.

ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefone TEXT;

ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS centro_custo_id UUID;

ALTER TABLE public.regras_conciliacao ADD COLUMN IF NOT EXISTS categoria TEXT;

ALTER TABLE public.solicitacoes_lgpd ADD COLUMN IF NOT EXISTS atendida_por UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'movimentacoes_centro_custo_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE public.movimentacoes
      ADD CONSTRAINT movimentacoes_centro_custo_id_fkey
      FOREIGN KEY (centro_custo_id)
      REFERENCES public.centros_custo(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_movimentacoes_centro_custo_id
  ON public.movimentacoes (centro_custo_id)
  WHERE centro_custo_id IS NOT NULL;
