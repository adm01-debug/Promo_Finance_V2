-- Fecha a divergencia REAL entre a cadeia de migrations e o banco de producao.
--
-- Origem: claude/chore-ddl-steps12-23-311026-1942 (steps 13, 14 e 19), branch
-- que nunca foi mergeada. A primeira versao desta migration carregava 8 DDL;
-- a revisao mostrou que 5 ja estavam versionados por OUTROS arquivos e que 1
-- quebrava o replay. Sobrou o que de fato falta, conferido arquivo por arquivo
-- em supabase/migrations/ e objeto por objeto no canonico bwwbeyolnnzppeuhgkcd:
--
--   ja versionado em outro arquivo, REMOVIDO daqui:
--     DROP POLICY admin_only_integration_secrets .. 20261101120000_drop_dead_rls_policy.sql:5
--     ALTER PUBLICATION .. performance_alerts ..... 20260712194216_8eb1fee3-...sql:2
--     obter_totais_movimentacoes .................. 20261027120000_transferencias_movimentacao_bilateral.sql
--     asaas_payments/customers.empresa_id NOT NULL  20260315192305_dda7f758-...sql:10,25 (no CREATE TABLE)
--     historico_conciliacao_ia.sessao_id + FK ..... 20260519121217_fe028d08-...sql:14
--
--   dos 12 indices do step13, 11 nao sao divergencia: 3 ja tem CREATE e DROP
--   na cadeia e 8 nunca sao criados por ela (o DROP seria no-op). So sobra um.

-- 1. idx_ncms_st: a cadeia CRIA e nunca remove; producao nao tem.
--    Sem isto, todo ambiente reconstruido nasce com um indice que producao
--    nao tem, e o gate de paridade acusa para sempre.
DROP INDEX IF EXISTS public.idx_ncms_st;

-- 2. autovacuum nas 6 tabelas que 20261101120200_autovacuum_scale_factor.sql
--    NAO cobre (lá estão movimentacoes, contas_receber, contas_pagar, boletos,
--    clientes, empresas — conjuntos disjuntos). Producao tem 0.05 nas seis;
--    o replay deixa no padrao 0.2 e a tabela incha entre vacuums.
ALTER TABLE public.fornecedores           SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.centros_custo          SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.contas_bancarias       SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.conciliacoes           SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.lancamentos_contabeis  SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.solicitacoes_aprovacao SET (autovacuum_vacuum_scale_factor = 0.05);

-- 3. Policy de leitura do catalogo de estrategias de elisao.
--    GUARD OBRIGATORIO: em PRODUCAO estrategias_elisao_catalogo e TABELA
--    (pg_class.relkind='r', conferido), mas a cadeia de migrations a cria como
--    VIEW com security_invoker=true (20260728154640_2b62d1ef-...sql:62, recriada
--    em 20260825100000_reconciliar_schema_completo.sql:10803) e nunca converte
--    para tabela. CREATE POLICY em view e rejeitado pelo PostgreSQL, o que
--    abortaria a migration exatamente no replay que ela existe para consertar.
--    Com o guard: em producao a policy e garantida; no replay o objeto segue
--    view e a leitura herda as permissoes e policies de estrategias_elisao
--    (que tem 2 policies), que e o comportamento de security_invoker.
--    A divergencia view-vs-tabela entre repositorio e producao NAO e resolvida
--    aqui — e decisao do dono qual das duas formas e a correta.
--    USING (true) e intencional (catalogo, nao dado de empresa) e esta na
--    allowlist exigida pelo AGENTS.md secao 4:
--    scripts/security/test-canonical-db-gates.mjs:119.
DO $pol$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = 'estrategias_elisao_catalogo'
       AND c.relkind = 'r'
  ) THEN
    DROP POLICY IF EXISTS estrategias_elisao_catalogo_select ON public.estrategias_elisao_catalogo;
    CREATE POLICY estrategias_elisao_catalogo_select
      ON public.estrategias_elisao_catalogo
      FOR SELECT
      TO authenticated
      USING (true);
  ELSE
    RAISE NOTICE 'estrategias_elisao_catalogo nao e tabela (relkind<>r): policy ignorada, leitura segue security_invoker sobre estrategias_elisao';
  END IF;
END
$pol$;
