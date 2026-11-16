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
--   Os 16 DROP INDEX do step13, reclassificados com
--   `CREATE (UNIQUE )?INDEX( CONCURRENTLY)?( IF NOT EXISTS)? +(public\.)?<nome>\b`
--   (a primeira versao usou `CREATE INDEX[^;]*<nome>`, que NAO casa com
--   `CREATE UNIQUE INDEX`, e por isso perdeu DROP necessarios):
--     7 a cadeia nunca cria  -> DROP seria no-op, fora daqui
--     4 a cadeia cria E derruba -> ja resolvido, fora daqui
--     5 a cadeia cria e nunca derruba -> divergencia real
--   Dos 5, QUATRO entram aqui. O quinto, uq_nfe_rec_conta_pagar, NAO entra:
--   ver a nota no fim deste arquivo.
--
--   Os 8 DROP CONSTRAINT do step13: 3 a cadeia nunca cria (no-op, fora daqui)
--   e 5 ela cria e nunca derruba (divergencia real, entram aqui).

-- 1. Quatro indices que a cadeia CRIA e nunca remove, e que producao nao tem.
--    Sem estes DROP, todo ambiente reconstruido nasce com indice que producao
--    nao tem, e o gate de paridade acusa para sempre.
--      uq_index_usage_snapshots_snapshot_schema_index
--        <- 20260831153000_corrigir_12_erros_lint_funcoes.sql:292-293 (condicional)
--      ux_integration_secrets_chave
--        <- 20260827090000_reconciliar_integration_secrets_sem_drop.sql:61-62
--      idx_ncms_st  <- criado em 2 migrations
--      idx_relatorios_tributarios_agendados_empresa_id
--        <- 20260825100000_reconciliar_schema_completo.sql:10139
--    Conferido em producao: nenhum dos 16 indices do step13 existe no canonico
--    (pg_indexes com os 16 nomes devolveu vazio). Para o indice de
--    relatorios_tributarios_agendados, producao mantem o gemeo
--    idx_relatorios_tributarios_agendados_empresa, tambem em (empresa_id):
--    a cobertura de leitura nao muda.
DROP INDEX IF EXISTS public.uq_index_usage_snapshots_snapshot_schema_index;
DROP INDEX IF EXISTS public.ux_integration_secrets_chave;
DROP INDEX IF EXISTS public.idx_ncms_st;
DROP INDEX IF EXISTS public.idx_relatorios_tributarios_agendados_empresa_id;

-- 1b. Cinco constraints UNIQUE que a cadeia CRIA (dentro do CREATE TABLE, em 3
--     arquivos cada) e nunca derruba, e que producao nao tem. Sao duplicatas: o
--     step13 derrubou cada uma mantendo a gemea de maior idx_scan. Conferido em
--     producao que a gemea sobreviveu com AS MESMAS COLUNAS, uma a uma, logo a
--     unicidade do negocio continua garantida:
--       aliquotas_interestaduais_unq (uf_origem, uf_destino, vigente_de)
--         -> gemea viva: aliquotas_interestaduais_unique, mesmas colunas
--       protocolos_st_ufs_unq (protocolo_id, uf)
--         -> gemea viva: protocolos_st_ufs_unique, mesmas colunas
--       aliquotas_internas_uf_unq (uf, categoria_produto, vigente_de)
--         -> gemea viva: aliquotas_internas_uf_unique, mesmas colunas
--       faixas_simples_unq (anexo, faixa, vigente_de)
--         -> gemea viva: faixas_simples_anexo_faixa_key, mesmas colunas
--       fechamento_unico (empresa_id, ano, mes)
--         -> gemea viva: fechamentos_tributarios_empresa_id_ano_mes_key, idem
--     Os outros 3 DROP CONSTRAINT do step13 ficam fora: a cadeia nunca cria
--     conformidade_snapshots_empresa_id_competencia_key, entregas_obrigacoes_uniq
--     nem user_active_filters_user_id_entity_type_key (o DROP seria no-op).
ALTER TABLE public.aliquotas_interestaduais DROP CONSTRAINT IF EXISTS aliquotas_interestaduais_unq;
ALTER TABLE public.protocolos_st_ufs        DROP CONSTRAINT IF EXISTS protocolos_st_ufs_unq;
ALTER TABLE public.aliquotas_internas_uf    DROP CONSTRAINT IF EXISTS aliquotas_internas_uf_unq;
ALTER TABLE public.faixas_simples_nacional  DROP CONSTRAINT IF EXISTS faixas_simples_unq;
ALTER TABLE public.fechamentos_tributarios  DROP CONSTRAINT IF EXISTS fechamento_unico;

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


-- NOTA — uq_nfe_rec_conta_pagar NAO e derrubado aqui, de proposito.
-- Ele e o quinto indice que a cadeia cria e nunca derruba, e producao tambem
-- nao tem. Mas nao e duplicata: e UNIQUE PARCIAL em
-- nfe_recebidas(conta_pagar_id) WHERE conta_pagar_id IS NOT NULL, criado por
-- 20260723120045_20cca17b-987b-414b-a7c5-b3a13bdc1c26.sql:7-9 com o comentario
-- "uma conta_pagar so pode estar vinculada a UMA NFe". O step13 o tratou como
-- par duplicado de idx_nfe_recebidas_conta_pagar_id_fk, que e btree comum e nao
-- garante unicidade nenhuma. Conferido em producao: nfe_recebidas tem UNIQUE
-- apenas em (chave_acesso) e em (id); nada garante a regra. Versionar o DROP
-- aqui carimbaria a perda da garantia, nao a reconciliaria. A restauracao vai
-- em PR propria, porque cria objeto novo em producao.
