-- Versiona as DEZESSETE colunas que existem no banco de PRODUCAO e que a cadeia
-- de migrations nunca cria. Enquanto a divergencia durar, todo ambiente
-- reconstruido (restore, staging, auditoria) nasce sem elas, e os 17 indices de
-- chave estrangeira correspondentes que a
-- 20261116190000_versiona_ddl_ja_aplicado_em_producao.sql versiona caem no
-- handler `EXCEPTION WHEN undefined_column` e sao silenciosamente pulados.
--
-- O NUMERO VEIO DA PROPRIA MIGRATION, EXECUTADA SOBRE UM REPLAY DE VERDADE.
-- Um Postgres 16 local recebeu os 1025 arquivos de supabase/migrations/ em
-- ordem, e a secao 4 da 20261116190000 rodada em cima imprimiu:
--     NOTICE: indices de FK: 109 aplicados, 17 ignorados por coluna ou tabela ausente
-- Nenhuma TABELA esta ausente no replay e os 126 alvos sao todos relkind='r':
-- o que falta sao exatamente 17 COLUNAS.
--
-- Correcao do meu metodo anterior: eu havia versionado so QUATRO. Dois erros:
-- (1) meu primeiro grep era agnostico de TABELA, e deu falso negativo nas duas
-- colunas de contratos; (2) mesmo com o grep amarrado, eu respondi por leitura
-- de arquivo em vez de por execucao da cadeia. Quem responde por execucao e o
-- replay, e so ele achou as outras 13.
--
-- As 17 foram conferidas uma a uma no canonico bwwbeyolnnzppeuhgkcd via
-- pg_catalog: todas existem, todas sao uuid NULL e TODAS as 17 tem chave
-- estrangeira. Observacao de metodo: information_schema NAO expoe FK que aponta
-- para o schema auth, e por isso minha consulta anterior disse que
-- password_reset_requests.reviewed_by nao tinha FK — tem,
-- password_reset_requests_reviewed_by_fkey -> auth.users(id). Cinco das 17
-- apontam para auth.users, logo o schema do alvo e parte do dado.
--
-- Em PRODUCAO a migration inteira e no-op. No replay cria coluna e FK.

-- 1. Tres das 17 sao RENOMEACAO de fato, nao adicao: conferido em producao que
--    a coluna antiga da cadeia NAO existe mais la, so a nova. Versionar apenas
--    o ADD deixaria o replay com AS DUAS, e seguiria divergente. Vem ANTES do
--    passo 2 de proposito: assim o guard e trivial (renomeia se a antiga existe
--    e a nova nao) e o ADD COLUMN IF NOT EXISTS seguinte vira no-op.
--      asaas_audit_trail: payment_id     -> asaas_payment_id
--      asaas_sync_queue:  payment_id     -> asaas_payment_id
--      fila_cobrancas:    regua_etapa_id -> etapa_id
--    As outras 14 sao adicao: a irma antiga COEXISTE em producao, conferido
--    (feedback_conciliacao_ia.transacao_bancaria_id, fila_cobrancas.etapa,
--    oportunidades_elisao.estrategia, partidas_contabeis.conta_id,
--    password_reset_requests.aprovado_por, regua_cobranca_status.titulo_id).
DO $ren$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('asaas_audit_trail', 'payment_id', 'asaas_payment_id'),
      ('asaas_sync_queue', 'payment_id', 'asaas_payment_id'),
      ('fila_cobrancas', 'regua_etapa_id', 'etapa_id')
    ) AS t(tabela, antiga, nova)
  LOOP
    IF to_regclass('public.' || quote_ident(r.tabela)) IS NULL THEN CONTINUE; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema='public' AND table_name=r.tabela AND column_name=r.antiga) THEN
      CONTINUE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name=r.tabela AND column_name=r.nova) THEN
      RAISE NOTICE 'public.%: % e % coexistem, rename nao aplicado', r.tabela, r.antiga, r.nova;
      CONTINUE;
    END IF;
    EXECUTE format('ALTER TABLE public.%I RENAME COLUMN %I TO %I', r.tabela, r.antiga, r.nova);
    RAISE NOTICE 'renomeada public.%.% -> %', r.tabela, r.antiga, r.nova;
  END LOOP;
END
$ren$

-- 2. As 17 colunas (idempotente). Nenhuma e NOT NULL em producao, logo ADD
--    COLUMN nao precisa de default nem de backfill.
DO $cols$
DECLARE r record; n int := 0;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('anomalias_detectadas', 'user_id'),
      ('asaas_audit_trail', 'asaas_payment_id'),
      ('asaas_sync_queue', 'asaas_payment_id'),
      ('bloqueios_duplicidade', 'transacao_id'),
      ('centros_custo', 'user_id'),
      ('contratos', 'cliente_id'),
      ('contratos', 'fornecedor_id'),
      ('feedback_conciliacao_ia', 'transacao_id'),
      ('fila_cobrancas', 'etapa_id'),
      ('fluxos_aprovacao_niveis', 'configuracao_id'),
      ('historico_cobranca', 'cliente_id'),
      ('metas_financeiras', 'user_id'),
      ('oportunidades_elisao', 'estrategia_id'),
      ('partidas_contabeis', 'conta_contabil_id'),
      ('password_reset_requests', 'reviewed_by'),
      ('regua_cobranca_status', 'conta_receber_id'),
      ('transferencias', 'user_id')
    ) AS t(tabela, coluna)
  LOOP
    IF to_regclass('public.' || quote_ident(r.tabela)) IS NULL THEN
      RAISE NOTICE 'tabela public.% ausente: coluna % ignorada', r.tabela, r.coluna;
      CONTINUE;
    END IF;
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I uuid', r.tabela, r.coluna);
    n := n + 1;
  END LOOP;
  RAISE NOTICE 'colunas de FK: % tabelas atendidas', n;
END
$cols$

-- 3. As 17 chaves estrangeiras, cada uma sob guard: a coluna existe, a
--    constraint ainda nao existe E o objeto referenciado e TABELA (relkind='r')
--    no schema que producao usa.
--
--    O guard de relkind nao e decorativo. A FK de
--    oportunidades_elisao.estrategia_id aponta para
--    estrategias_elisao_catalogo, que em PRODUCAO e tabela mas que a cadeia
--    termina como VIEW: nasce tabela em 20260417155857_5c06caf2-...sql:2 e e
--    recriada como view com security_invoker em
--    20260825100000_reconciliar_schema_completo.sql:10803. PostgreSQL nao
--    aceita FK apontando para view (ERROR 42809), e sem o guard esta migration
--    abortaria exatamente no replay que ela existe para consertar — o mesmo
--    erro que a secao 3 da 20261116190000 ja tinha cometido com CREATE POLICY.
DO $fks$
DECLARE r record; n_ok int := 0; n_skip int := 0;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('anomalias_detectadas', 'user_id', 'anomalias_detectadas_user_id_fkey', 'auth', 'users', 'id', 'CASCADE'),
      ('asaas_audit_trail', 'asaas_payment_id', 'asaas_audit_trail_asaas_payment_id_fkey', 'public', 'asaas_payments', 'id', 'CASCADE'),
      ('asaas_sync_queue', 'asaas_payment_id', 'asaas_sync_queue_asaas_payment_id_fkey', 'public', 'asaas_payments', 'id', 'CASCADE'),
      ('bloqueios_duplicidade', 'transacao_id', 'bloqueios_duplicidade_transacao_id_fkey', 'public', 'transacoes_bancarias', 'id', 'SET NULL'),
      ('centros_custo', 'user_id', 'centros_custo_user_id_fkey', 'auth', 'users', 'id', 'NO ACTION'),
      ('contratos', 'cliente_id', 'contratos_cliente_id_fkey', 'public', 'clientes', 'id', 'SET NULL'),
      ('contratos', 'fornecedor_id', 'contratos_fornecedor_id_fkey', 'public', 'fornecedores', 'id', 'SET NULL'),
      ('feedback_conciliacao_ia', 'transacao_id', 'feedback_conciliacao_ia_transacao_id_fkey', 'public', 'transacoes_bancarias', 'id', 'NO ACTION'),
      ('fila_cobrancas', 'etapa_id', 'fila_cobrancas_etapa_id_fkey', 'public', 'regua_cobranca_etapas', 'id', 'NO ACTION'),
      ('fluxos_aprovacao_niveis', 'configuracao_id', 'fluxos_aprovacao_niveis_configuracao_id_fkey', 'public', 'configuracoes_aprovacao', 'id', 'NO ACTION'),
      ('historico_cobranca', 'cliente_id', 'historico_cobranca_cliente_id_fkey', 'public', 'clientes', 'id', 'NO ACTION'),
      ('metas_financeiras', 'user_id', 'metas_financeiras_user_id_fkey', 'auth', 'users', 'id', 'NO ACTION'),
      ('oportunidades_elisao', 'estrategia_id', 'oportunidades_elisao_estrategia_id_fkey', 'public', 'estrategias_elisao_catalogo', 'id', 'NO ACTION'),
      ('partidas_contabeis', 'conta_contabil_id', 'partidas_contabeis_conta_contabil_id_fkey', 'public', 'plano_contas', 'id', 'RESTRICT'),
      ('password_reset_requests', 'reviewed_by', 'password_reset_requests_reviewed_by_fkey', 'auth', 'users', 'id', 'NO ACTION'),
      ('regua_cobranca_status', 'conta_receber_id', 'regua_cobranca_status_conta_receber_id_fkey', 'public', 'contas_receber', 'id', 'NO ACTION'),
      ('transferencias', 'user_id', 'transferencias_user_id_fkey', 'auth', 'users', 'id', 'NO ACTION')
    ) AS t(tabela, coluna, constraint_nome, alvo_schema, alvo_tab, alvo_col, on_delete)
  LOOP
    IF to_regclass('public.' || quote_ident(r.tabela)) IS NULL THEN
      n_skip := n_skip + 1; CONTINUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema='public' AND table_name=r.tabela AND column_name=r.coluna) THEN
      RAISE NOTICE 'coluna %.% ausente: FK % ignorada', r.tabela, r.coluna, r.constraint_nome;
      n_skip := n_skip + 1; CONTINUE;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint
                WHERE conname = r.constraint_nome
                  AND conrelid = ('public.' || quote_ident(r.tabela))::regclass) THEN
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = r.alvo_schema AND c.relname = r.alvo_tab AND c.relkind = 'r'
    ) THEN
      RAISE NOTICE 'alvo %.% nao e tabela (relkind<>r): FK % ignorada, coluna % criada sem constraint',
                   r.alvo_schema, r.alvo_tab, r.constraint_nome, r.coluna;
      n_skip := n_skip + 1; CONTINUE;
    END IF;

    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I.%I(%I) ON DELETE %s',
      r.tabela, r.constraint_nome, r.coluna, r.alvo_schema, r.alvo_tab, r.alvo_col, r.on_delete
    );
    n_ok := n_ok + 1;
  END LOOP;
  RAISE NOTICE 'chaves estrangeiras: % criadas/ja existentes, % ignoradas', n_ok, n_skip;
END
$fks$
