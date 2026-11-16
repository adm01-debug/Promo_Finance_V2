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
--
--   Correcao da segunda revisao: o DROP das 5 constraints e do 4o indice era
--   solto, e as respectivas gemeas de producao NAO sao criadas pela cadeia.
--   No replay isso removeria a unica garantia de unicidade de 5 tabelas
--   fiscais e o unico indice de empresa_id de outra. Agora cada par CRIA a
--   gemea antes de derrubar a original (secoes 1a e 1b).

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
--    (pg_indexes com os 16 nomes devolveu vazio).
DROP INDEX IF EXISTS public.uq_index_usage_snapshots_snapshot_schema_index;
DROP INDEX IF EXISTS public.ux_integration_secrets_chave;
DROP INDEX IF EXISTS public.idx_ncms_st;

-- 1a. O quarto indice exige CRIAR o gemeo ANTES de derrubar o original.
--     Producao tem idx_relatorios_tributarios_agendados_empresa em (empresa_id)
--     e NAO tem o ..._empresa_id. Mas a cadeia so cria o ..._empresa_id e nunca
--     cria o ..._empresa (conferido: grep do nome exato em supabase/migrations/
--     nao devolve nada). Derrubar sem criar deixaria o ambiente reconstruido SEM
--     nenhum indice em empresa_id nessa tabela, e a tela de relatorios agendados
--     passaria a varrer a tabela inteira.
--     Em producao as duas linhas sao no-op: a primeira porque o indice existe, a
--     segunda porque o ..._empresa_id nao existe.
CREATE INDEX IF NOT EXISTS idx_relatorios_tributarios_agendados_empresa
  ON public.relatorios_tributarios_agendados (empresa_id);
DROP INDEX IF EXISTS public.idx_relatorios_tributarios_agendados_empresa_id;

-- 1b. Cinco constraints UNIQUE que a cadeia CRIA (dentro do CREATE TABLE, em 3
--     arquivos cada) e nunca derruba, e que producao nao tem. O step13 derrubou
--     cada uma mantendo a gemea de maior idx_scan, e a gemea sobreviveu em
--     producao com AS MESMAS COLUNAS, uma a uma.
--
--     ATENCAO (achado da revisao, devin + codex, e eles estao certos): as cinco
--     gemeas existem SO em producao. A cadeia de migrations nunca as cria —
--     `grep -rn "<nome_da_gemea>" supabase/migrations/` devolve ZERO para as
--     cinco. Logo um DROP solto aqui tiraria, no replay, a UNICA garantia de
--     unicidade dessas tabelas fiscais: alicotas interestaduais e internas,
--     faixas do Simples, vinculo protocolo-UF e fechamento tributario passariam
--     a aceitar duplicata para a mesma chave e vigencia. Provar no banco de
--     producao nao prova nada sobre o replay — foi o mesmo erro da secao 3.
--
--     Por isso: CRIAR a gemea (idempotente) ANTES de derrubar a original.
--       em producao: ADD e no-op (gemea existe), DROP e no-op (original nao
--                    existe)  -> a migration inteira continua no-op
--       no replay ..: ADD cria a gemea com as mesmas colunas, DROP remove a
--                    original -> a unicidade continua garantida, sob o nome que
--                    producao usa
--
--     original derrubada                      -> gemea criada (mesmas colunas)
--       aliquotas_interestaduais_unq          -> aliquotas_interestaduais_unique
--         (uf_origem, uf_destino, vigente_de)
--       protocolos_st_ufs_unq                 -> protocolos_st_ufs_unique
--         (protocolo_id, uf)
--       aliquotas_internas_uf_unq             -> aliquotas_internas_uf_unique
--         (uf, categoria_produto, vigente_de)
--       faixas_simples_unq                    -> faixas_simples_anexo_faixa_key
--         (anexo, faixa, vigente_de)
--       fechamento_unico                      -> fechamentos_tributarios_empresa_id_ano_mes_key
--         (empresa_id, ano, mes)
--
--     Os outros 3 DROP CONSTRAINT do step13 ficam fora: a cadeia nunca cria
--     conformidade_snapshots_empresa_id_competencia_key, entregas_obrigacoes_uniq
--     nem user_active_filters_user_id_entity_type_key (o DROP seria no-op).
DO $cons$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('aliquotas_interestaduais', 'aliquotas_interestaduais_unique',
       '(uf_origem, uf_destino, vigente_de)', 'aliquotas_interestaduais_unq'),
      ('protocolos_st_ufs', 'protocolos_st_ufs_unique',
       '(protocolo_id, uf)', 'protocolos_st_ufs_unq'),
      ('aliquotas_internas_uf', 'aliquotas_internas_uf_unique',
       '(uf, categoria_produto, vigente_de)', 'aliquotas_internas_uf_unq'),
      ('faixas_simples_nacional', 'faixas_simples_anexo_faixa_key',
       '(anexo, faixa, vigente_de)', 'faixas_simples_unq'),
      ('fechamentos_tributarios', 'fechamentos_tributarios_empresa_id_ano_mes_key',
       '(empresa_id, ano, mes)', 'fechamento_unico')
    ) AS t(tabela, gemea, colunas, original)
  LOOP
    IF to_regclass('public.' || quote_ident(r.tabela)) IS NULL THEN
      RAISE NOTICE 'tabela public.% ausente: par %/% ignorado', r.tabela, r.gemea, r.original;
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
       WHERE conname = r.gemea
         AND conrelid = ('public.' || quote_ident(r.tabela))::regclass
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE %s',
                     r.tabela, r.gemea, r.colunas);
    END IF;

    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
                   r.tabela, r.original);
  END LOOP;
END
$cons$;

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
