-- Versiona DDL que JA ESTA em producao e nao existia em nenhum arquivo do
-- repositorio. Resgate das branches:
--   claude/chore-ddl-steps12-23-311026-1942   (steps 12, 13, 14, 19, 21)
--   claude/fix-realtime-performance-alerts-261113-1159
--   claude/fix-totais-movimentacoes-rpc-311031-1548
--   claude/resolve-conflicting-prs-rborrh     (sessao_id)
--
-- Nenhum destes arquivos chegou ao main, mas o efeito deles esta no banco
-- canonico bwwbeyolnnzppeuhgkcd. Consequencia: a cadeia de migrations do
-- repositorio NAO reconstroi producao — qualquer ambiente recriado a partir
-- dela (staging, recuperacao de desastre, preview do Supabase) nasce
-- diferente, e o gate de paridade do schema-drift acusa divergencia sem ter
-- o que aplicar. Esta migration fecha isso.
--
-- Todo comando aqui e idempotente E ja corresponde ao estado de producao,
-- logo aplicar e no-op lá. O valor e a reprodutibilidade, nao a mudanca.
--
-- Estado conferido por consulta antes de escrever (nao por leitura de arquivo):
--   pg_policies admin_only_integration_secrets ................ 0 (ja removida)
--   os 12 indices duplicados do step13 ........................ nenhum existe
--   reloptions das 6 tabelas do step14 ........ autovacuum_vacuum_scale_factor=0.05
--   pg_policies estrategias_elisao_catalogo_select ............ 1
--   asaas_payments.empresa_id / asaas_customers.empresa_id .... is_nullable=NO
--   pg_publication_tables performance_alerts em supabase_realtime .... 1
--   obter_totais_movimentacoes ................................ existe
--   historico_conciliacao_ia.sessao_id ........................ existe

-- step12 — a policy admin-only de integration_secrets foi substituida pelo
-- modelo de secrets por empresa; o DROP e o estado real.
DROP POLICY IF EXISTS admin_only_integration_secrets ON public.integration_secrets;

-- step13 — indices duplicados (mesma coluna de um UNIQUE ou de outro indice).
DROP INDEX IF EXISTS public.uq_index_usage_snapshots_snapshot_schema_index;
DROP INDEX IF EXISTS public.idx_bloat_snapshots_date_table;
DROP INDEX IF EXISTS public.idx_perf_alerts_source_key;
DROP INDEX IF EXISTS public.ux_integration_secrets_chave;
DROP INDEX IF EXISTS public.idx_ncms_st;
DROP INDEX IF EXISTS public.idx_alert_configurations_enabled;
DROP INDEX IF EXISTS public.idx_ncms_codigo;
DROP INDEX IF EXISTS public.idx_ufs_sigla;
DROP INDEX IF EXISTS public.idx_regras_rot_empresa;
DROP INDEX IF EXISTS public.idx_pst_ncms_protocolo;
DROP INDEX IF EXISTS public.idx_cnaes_codigo;
DROP INDEX IF EXISTS public.idx_pst_ufs_protocolo;

-- step14 — autovacuum mais agressivo nas tabelas financeiras de maior churn.
ALTER TABLE public.fornecedores           SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.centros_custo          SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.contas_bancarias       SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.conciliacoes           SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.lancamentos_contabeis  SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.solicitacoes_aprovacao SET (autovacuum_vacuum_scale_factor = 0.05);

-- step19 — catalogo publico de estrategias de elisao: leitura liberada para
-- authenticated. O USING (true) e intencional (catalogo, nao dado de empresa)
-- e esta na allowlist de scripts/security/test-canonical-db-gates.mjs:119.
DROP POLICY IF EXISTS estrategias_elisao_catalogo_select ON public.estrategias_elisao_catalogo;
CREATE POLICY estrategias_elisao_catalogo_select
  ON public.estrategias_elisao_catalogo
  FOR SELECT
  TO authenticated
  USING (true);

-- step21 — empresa_id obrigatorio nas tabelas do Asaas: sem isso uma linha sem
-- empresa escapa de toda policy de isolamento por empresa.
ALTER TABLE public.asaas_payments  ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.asaas_customers ALTER COLUMN empresa_id SET NOT NULL;

-- performance_alerts no realtime: ALTER PUBLICATION ... ADD TABLE nao e
-- idempotente (erro 42710 se a tabela ja e membro), por isso o guard.
DO $pub$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'performance_alerts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_alerts;
  END IF;
END
$pub$;

-- sessao_id em historico_conciliacao_ia (+ indice da FK).
ALTER TABLE public.historico_conciliacao_ia
  ADD COLUMN IF NOT EXISTS sessao_id UUID REFERENCES public.sessoes_conciliacao(id);
CREATE INDEX IF NOT EXISTS idx_historico_conciliacao_ia_sessao
  ON public.historico_conciliacao_ia(sessao_id);

-- obter_totais_movimentacoes — consumida por src/pages/Movimentacoes.tsx:181.
-- Corpo copiado de pg_get_functiondef em PRODUCAO, nao da branch: a versao da
-- branch devolvia uma terceira coluna `saldo` (o front calcula o saldo em
-- :193), filtrava empresa por uma tabela `empresa_usuarios` em vez da
-- `user_empresas` real, e NAO excluia transferencias — que inflariam entrada e
-- saida com movimento entre contas da propria empresa. A de producao e a
-- correta. SECURITY INVOKER de proposito: o escopo por empresa vem da RLS de
-- movimentacoes (policy "Access by empresa_id", FOR ALL), nao de filtro no
-- corpo da funcao.
CREATE OR REPLACE FUNCTION public.obter_totais_movimentacoes(
  p_start date,
  p_end date,
  p_tipo text DEFAULT NULL::text,
  p_search text DEFAULT NULL::text
)
 RETURNS TABLE(total_entradas numeric, total_saidas numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada'), 0) AS total_entradas,
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida'), 0) AS total_saidas
  FROM movimentacoes
  WHERE deleted_at IS NULL
    AND origem IS DISTINCT FROM 'transferencia'
    AND data_movimentacao >= p_start
    AND data_movimentacao <= p_end
    AND (p_tipo IS NULL OR p_tipo = 'all' OR tipo = p_tipo)
    AND (p_search IS NULL OR p_search = '' OR descricao ILIKE '%' || p_search || '%');
$function$;
