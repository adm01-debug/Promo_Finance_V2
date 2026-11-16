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
DROP INDEX IF EXISTS public.uq_index_usage_snapshots_snapshot_schema_index

DROP INDEX IF EXISTS public.ux_integration_secrets_chave

DROP INDEX IF EXISTS public.idx_ncms_st

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
  ON public.relatorios_tributarios_agendados (empresa_id)

DROP INDEX IF EXISTS public.idx_relatorios_tributarios_agendados_empresa_id

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
$cons$

-- 2. autovacuum nas 6 tabelas que 20261101120200_autovacuum_scale_factor.sql
--    NAO cobre (lá estão movimentacoes, contas_receber, contas_pagar, boletos,
--    clientes, empresas — conjuntos disjuntos). Producao tem 0.05 nas seis;
--    o replay deixa no padrao 0.2 e a tabela incha entre vacuums.
ALTER TABLE public.fornecedores           SET (autovacuum_vacuum_scale_factor = 0.05)

ALTER TABLE public.centros_custo          SET (autovacuum_vacuum_scale_factor = 0.05)

ALTER TABLE public.contas_bancarias       SET (autovacuum_vacuum_scale_factor = 0.05)

ALTER TABLE public.conciliacoes           SET (autovacuum_vacuum_scale_factor = 0.05)

ALTER TABLE public.lancamentos_contabeis  SET (autovacuum_vacuum_scale_factor = 0.05)

ALTER TABLE public.solicitacoes_aprovacao SET (autovacuum_vacuum_scale_factor = 0.05)

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
$pol$

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

-- 4. Os 126 indices de chave estrangeira que existem em PRODUCAO (lidos de
--    pg_indexes no canonico bwwbeyolnnzppeuhgkcd) e que a cadeia de migrations
--    nao reproduz. Lote criado direto no banco por algum agente, com sufixo _fk.
--    Achado via a varredura de claude/chore-ddl-steps12-23-311026-1942 (PR #232,
--    fechada), cujo step16 pedia 2 deles com outro nome
--    (idx_partidas_contabeis_conta_contabil -> producao tem
--     idx_partidas_contabeis_conta_contabil_id_fk, mesma coluna;
--     idx_oportunidades_elisao_estrategia -> idx_oportunidades_elisao_estrategia_id_fk).
--    Os outros 14 do step16 foram descartados: ou o main ja indexa a coluna como
--    lider, ou nenhuma consulta do produto filtra por ela.
--
--    Impacto de negocio de deixar como esta: um ambiente reconstruido (restore,
--    staging, auditoria) nasce com 126 FKs sem indice. Toda exclusao ou alteracao
--    de cliente, fornecedor, categoria, conta bancaria, plano de contas ou
--    usuario passa a varrer a tabela filha inteira.
--
--    Os 126 sao btree de coluna unica, nenhum UNIQUE e nenhum parcial (conferido
--    em pg_index: indisunique=0 e indpred nulo nos 126).
--
--    CORRECAO 1 da revisao (devin, e esta certo): a primeira versao desta secao
--    era uma lista solta de CREATE INDEX IF NOT EXISTS, e IF NOT EXISTS NAO
--    protege contra COLUNA ausente. No replay a cadeia nao cria
--    oportunidades_elisao.estrategia_id (ela declara `estrategia text`) nem
--    password_reset_requests.reviewed_by (ela declara `aprovado_por`) —
--    conferido: zero ocorrencias de criacao dessas duas colunas em
--    supabase/migrations/. O CREATE abortaria a migration exatamente no replay
--    que ela existe para consertar, como ja tinha acontecido com a policy da
--    secao 3. Agora cada DDL roda em bloco proprio e as excecoes
--    undefined_column e undefined_table sao capturadas: em producao os 126
--    aplicam e sao no-op; no replay cria o que o schema suporta e registra em
--    NOTICE o que ficou de fora. A divergencia de coluna cadeia-vs-producao NAO
--    e resolvida aqui — e outra tarefa, e sem ela esses indices nao existem no
--    replay de qualquer forma.
--
--    CORRECAO 2 da revisao (devin, e esta certo): eu escrevi que nenhum dos 126
--    nomes aparece em supabase/migrations/. FALSO — eu havia grepado so linhas
--    CREATE INDEX. 20 dos 126 sao derrubados por
--    20261101140000_drop_idle_indexes.sql, como indices ociosos, e depois foram
--    recriados direto em producao: estao em pg_indexes hoje. Como esta migration
--    tem timestamp posterior, no replay a ordem e drop-depois-create e o estado
--    final bate com producao. Isso tambem significa que a decisao de 20261101140000
--    foi revertida no banco sem registro — fica anotado, nao resolvido aqui.
DO $fk$
DECLARE r record; n_ok int := 0; n_skip int := 0;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('idx_acordos_parcelamento_cliente_id_fk', 'CREATE INDEX IF NOT EXISTS idx_acordos_parcelamento_cliente_id_fk ON public.acordos_parcelamento USING btree (cliente_id)'),
      ('idx_acordos_parcelamento_created_by_fk', 'CREATE INDEX IF NOT EXISTS idx_acordos_parcelamento_created_by_fk ON public.acordos_parcelamento USING btree (created_by)'),
      ('idx_alerts_sent_alert_id_fk', 'CREATE INDEX IF NOT EXISTS idx_alerts_sent_alert_id_fk ON public.alerts_sent USING btree (alert_id)'),
      ('idx_aliquotas_iss_municipal_item_lista_id_fk', 'CREATE INDEX IF NOT EXISTS idx_aliquotas_iss_municipal_item_lista_id_fk ON public.aliquotas_iss_municipal USING btree (item_lista_id)'),
      ('idx_anomalia_detection_runs_triggered_by_fk', 'CREATE INDEX IF NOT EXISTS idx_anomalia_detection_runs_triggered_by_fk ON public.anomalia_detection_runs USING btree (triggered_by)'),
      ('idx_anomalia_toast_eventos_anomalia_id_fk', 'CREATE INDEX IF NOT EXISTS idx_anomalia_toast_eventos_anomalia_id_fk ON public.anomalia_toast_eventos USING btree (anomalia_id)'),
      ('idx_anomalia_toast_eventos_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_anomalia_toast_eventos_user_id_fk ON public.anomalia_toast_eventos USING btree (user_id)'),
      ('idx_anomalias_detectadas_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_anomalias_detectadas_user_id_fk ON public.anomalias_detectadas USING btree (user_id)'),
      ('idx_aprovacao_comentarios_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_aprovacao_comentarios_user_id_fk ON public.aprovacao_comentarios USING btree (user_id)'),
      ('idx_apuracoes_irpj_csll_created_by_fk', 'CREATE INDEX IF NOT EXISTS idx_apuracoes_irpj_csll_created_by_fk ON public.apuracoes_irpj_csll USING btree (created_by)'),
      ('idx_asaas_audit_trail_asaas_payment_id_fk', 'CREATE INDEX IF NOT EXISTS idx_asaas_audit_trail_asaas_payment_id_fk ON public.asaas_audit_trail USING btree (asaas_payment_id)'),
      ('idx_asaas_credit_risk_analysis_cliente_id_fk', 'CREATE INDEX IF NOT EXISTS idx_asaas_credit_risk_analysis_cliente_id_fk ON public.asaas_credit_risk_analysis USING btree (cliente_id)'),
      ('idx_asaas_payment_links_created_by_fk', 'CREATE INDEX IF NOT EXISTS idx_asaas_payment_links_created_by_fk ON public.asaas_payment_links USING btree (created_by)'),
      ('idx_asaas_payments_asaas_customer_id_fk', 'CREATE INDEX IF NOT EXISTS idx_asaas_payments_asaas_customer_id_fk ON public.asaas_payments USING btree (asaas_customer_id)'),
      ('idx_asaas_reconciliation_suggestions_contas_pagar_id_fk', 'CREATE INDEX IF NOT EXISTS idx_asaas_reconciliation_suggestions_contas_pagar_id_fk ON public.asaas_reconciliation_suggestions USING btree (contas_pagar_id)'),
      ('idx_asaas_reconciliation_suggestions_contas_receber_id_fk', 'CREATE INDEX IF NOT EXISTS idx_asaas_reconciliation_suggestions_contas_receber_id_fk ON public.asaas_reconciliation_suggestions USING btree (contas_receber_id)'),
      ('idx_asaas_sync_queue_asaas_payment_id_fk', 'CREATE INDEX IF NOT EXISTS idx_asaas_sync_queue_asaas_payment_id_fk ON public.asaas_sync_queue USING btree (asaas_payment_id)'),
      ('idx_bloqueios_duplicidade_transacao_id_fk', 'CREATE INDEX IF NOT EXISTS idx_bloqueios_duplicidade_transacao_id_fk ON public.bloqueios_duplicidade USING btree (transacao_id)'),
      ('idx_bloqueios_duplicidade_usuario_id_fk', 'CREATE INDEX IF NOT EXISTS idx_bloqueios_duplicidade_usuario_id_fk ON public.bloqueios_duplicidade USING btree (usuario_id)'),
      ('idx_boletos_created_by_fk', 'CREATE INDEX IF NOT EXISTS idx_boletos_created_by_fk ON public.boletos USING btree (created_by)'),
      ('idx_budgets_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_budgets_user_id_fk ON public.budgets USING btree (user_id)'),
      ('idx_categorias_plano_conta_id_fk', 'CREATE INDEX IF NOT EXISTS idx_categorias_plano_conta_id_fk ON public.categorias USING btree (plano_conta_id)'),
      ('idx_centros_custo_parent_id_fk', 'CREATE INDEX IF NOT EXISTS idx_centros_custo_parent_id_fk ON public.centros_custo USING btree (parent_id)'),
      ('idx_centros_custo_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_centros_custo_user_id_fk ON public.centros_custo USING btree (user_id)'),
      ('idx_clientes_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_clientes_user_id_fk ON public.clientes USING btree (user_id)'),
      ('idx_conciliacoes_conta_bancaria_id_fk', 'CREATE INDEX IF NOT EXISTS idx_conciliacoes_conta_bancaria_id_fk ON public.conciliacoes USING btree (conta_bancaria_id)'),
      ('idx_contas_bancarias_empresa_id_fk', 'CREATE INDEX IF NOT EXISTS idx_contas_bancarias_empresa_id_fk ON public.contas_bancarias USING btree (empresa_id)'),
      ('idx_contas_pagar_aprovado_por_fk', 'CREATE INDEX IF NOT EXISTS idx_contas_pagar_aprovado_por_fk ON public.contas_pagar USING btree (aprovado_por)'),
      ('idx_contas_pagar_categoria_id_fk', 'CREATE INDEX IF NOT EXISTS idx_contas_pagar_categoria_id_fk ON public.contas_pagar USING btree (categoria_id)'),
      ('idx_contas_pagar_fornecedor_id_fk', 'CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor_id_fk ON public.contas_pagar USING btree (fornecedor_id)'),
      ('idx_contratos_cliente_id_fk', 'CREATE INDEX IF NOT EXISTS idx_contratos_cliente_id_fk ON public.contratos USING btree (cliente_id)'),
      ('idx_contratos_fornecedor_id_fk', 'CREATE INDEX IF NOT EXISTS idx_contratos_fornecedor_id_fk ON public.contratos USING btree (fornecedor_id)'),
      ('idx_contratos_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_contratos_user_id_fk ON public.contratos USING btree (user_id)'),
      ('idx_convites_organizacao_id_fk', 'CREATE INDEX IF NOT EXISTS idx_convites_organizacao_id_fk ON public.convites USING btree (organizacao_id)'),
      ('idx_creditos_tributarios_nota_fiscal_id_fk', 'CREATE INDEX IF NOT EXISTS idx_creditos_tributarios_nota_fiscal_id_fk ON public.creditos_tributarios USING btree (nota_fiscal_id)'),
      ('idx_darfs_alerta_id_fk', 'CREATE INDEX IF NOT EXISTS idx_darfs_alerta_id_fk ON public.darfs USING btree (alerta_id)'),
      ('idx_dispositivos_conhecidos_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_dispositivos_conhecidos_user_id_fk ON public.dispositivos_conhecidos USING btree (user_id)'),
      ('idx_divergencias_conciliacao_conta_bancaria_id_fk', 'CREATE INDEX IF NOT EXISTS idx_divergencias_conciliacao_conta_bancaria_id_fk ON public.divergencias_conciliacao USING btree (conta_bancaria_id)'),
      ('idx_divergencias_conciliacao_resolvido_por_fk', 'CREATE INDEX IF NOT EXISTS idx_divergencias_conciliacao_resolvido_por_fk ON public.divergencias_conciliacao USING btree (resolvido_por)'),
      ('idx_divergencias_conciliacao_transacao_id_fk', 'CREATE INDEX IF NOT EXISTS idx_divergencias_conciliacao_transacao_id_fk ON public.divergencias_conciliacao USING btree (transacao_id)'),
      ('idx_elisao_creditos_auditoria_nota_fiscal_id_fk', 'CREATE INDEX IF NOT EXISTS idx_elisao_creditos_auditoria_nota_fiscal_id_fk ON public.elisao_creditos_auditoria USING btree (nota_fiscal_id)'),
      ('idx_elisao_creditos_auditoria_regra_id_fk', 'CREATE INDEX IF NOT EXISTS idx_elisao_creditos_auditoria_regra_id_fk ON public.elisao_creditos_auditoria USING btree (regra_id)'),
      ('idx_empresas_certificados_criado_por_fk', 'CREATE INDEX IF NOT EXISTS idx_empresas_certificados_criado_por_fk ON public.empresas_certificados USING btree (criado_por)'),
      ('idx_entregas_obrigacoes_registrado_por_fk', 'CREATE INDEX IF NOT EXISTS idx_entregas_obrigacoes_registrado_por_fk ON public.entregas_obrigacoes USING btree (registrado_por)'),
      ('idx_eventos_contabilizacao_log_regra_id_fk', 'CREATE INDEX IF NOT EXISTS idx_eventos_contabilizacao_log_regra_id_fk ON public.eventos_contabilizacao_log USING btree (regra_id)'),
      ('idx_evidencias_pacotes_verificacao_id_fk', 'CREATE INDEX IF NOT EXISTS idx_evidencias_pacotes_verificacao_id_fk ON public.evidencias_pacotes USING btree (verificacao_id)'),
      ('idx_expert_conversations_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_expert_conversations_user_id_fk ON public.expert_conversations USING btree (user_id)'),
      ('idx_expert_messages_conversation_id_fk', 'CREATE INDEX IF NOT EXISTS idx_expert_messages_conversation_id_fk ON public.expert_messages USING btree (conversation_id)'),
      ('idx_extrato_bancario_conta_bancaria_id_fk', 'CREATE INDEX IF NOT EXISTS idx_extrato_bancario_conta_bancaria_id_fk ON public.extrato_bancario USING btree (conta_bancaria_id)'),
      ('idx_faturamento_mensal_created_by_fk', 'CREATE INDEX IF NOT EXISTS idx_faturamento_mensal_created_by_fk ON public.faturamento_mensal USING btree (created_by)'),
      ('idx_fechamentos_tributarios_fechado_por_fk', 'CREATE INDEX IF NOT EXISTS idx_fechamentos_tributarios_fechado_por_fk ON public.fechamentos_tributarios USING btree (fechado_por)'),
      ('idx_feedback_conciliacao_ia_created_by_fk', 'CREATE INDEX IF NOT EXISTS idx_feedback_conciliacao_ia_created_by_fk ON public.feedback_conciliacao_ia USING btree (created_by)'),
      ('idx_feedback_conciliacao_ia_transacao_id_fk', 'CREATE INDEX IF NOT EXISTS idx_feedback_conciliacao_ia_transacao_id_fk ON public.feedback_conciliacao_ia USING btree (transacao_id)'),
      ('idx_feedback_conciliacao_ia_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_feedback_conciliacao_ia_user_id_fk ON public.feedback_conciliacao_ia USING btree (user_id)'),
      ('idx_fila_cobrancas_cliente_id_fk', 'CREATE INDEX IF NOT EXISTS idx_fila_cobrancas_cliente_id_fk ON public.fila_cobrancas USING btree (cliente_id)'),
      ('idx_fila_cobrancas_conta_receber_id_fk', 'CREATE INDEX IF NOT EXISTS idx_fila_cobrancas_conta_receber_id_fk ON public.fila_cobrancas USING btree (conta_receber_id)'),
      ('idx_fila_cobrancas_etapa_id_fk', 'CREATE INDEX IF NOT EXISTS idx_fila_cobrancas_etapa_id_fk ON public.fila_cobrancas USING btree (etapa_id)'),
      ('idx_fluxos_aprovacao_niveis_configuracao_id_fk', 'CREATE INDEX IF NOT EXISTS idx_fluxos_aprovacao_niveis_configuracao_id_fk ON public.fluxos_aprovacao_niveis USING btree (configuracao_id)'),
      ('idx_folha_pagamento_created_by_fk', 'CREATE INDEX IF NOT EXISTS idx_folha_pagamento_created_by_fk ON public.folha_pagamento USING btree (created_by)'),
      ('idx_fornecedores_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_fornecedores_user_id_fk ON public.fornecedores USING btree (user_id)'),
      ('idx_frontend_performance_logs_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_frontend_performance_logs_user_id_fk ON public.frontend_performance_logs USING btree (user_id)'),
      ('idx_geo_blocks_blocked_by_fk', 'CREATE INDEX IF NOT EXISTS idx_geo_blocks_blocked_by_fk ON public.geo_blocks USING btree (blocked_by)'),
      ('idx_historico_cobranca_cliente_id_fk', 'CREATE INDEX IF NOT EXISTS idx_historico_cobranca_cliente_id_fk ON public.historico_cobranca USING btree (cliente_id)'),
      ('idx_historico_cobranca_conta_receber_id_fk', 'CREATE INDEX IF NOT EXISTS idx_historico_cobranca_conta_receber_id_fk ON public.historico_cobranca USING btree (conta_receber_id)'),
      ('idx_historico_cobranca_whatsapp_cliente_id_fk', 'CREATE INDEX IF NOT EXISTS idx_historico_cobranca_whatsapp_cliente_id_fk ON public.historico_cobranca_whatsapp USING btree (cliente_id)'),
      ('idx_historico_conciliacao_ia_aprovado_por_fk', 'CREATE INDEX IF NOT EXISTS idx_historico_conciliacao_ia_aprovado_por_fk ON public.historico_conciliacao_ia USING btree (aprovado_por)'),
      ('idx_historico_conciliacao_ia_conta_receber_id_fk', 'CREATE INDEX IF NOT EXISTS idx_historico_conciliacao_ia_conta_receber_id_fk ON public.historico_conciliacao_ia USING btree (conta_receber_id)'),
      ('idx_historico_conciliacao_ia_created_by_fk', 'CREATE INDEX IF NOT EXISTS idx_historico_conciliacao_ia_created_by_fk ON public.historico_conciliacao_ia USING btree (created_by)'),
      ('idx_historico_conciliacao_ia_sessao_id_fk', 'CREATE INDEX IF NOT EXISTS idx_historico_conciliacao_ia_sessao_id_fk ON public.historico_conciliacao_ia USING btree (sessao_id)'),
      ('idx_historico_relatorios_relatorio_agendado_id_fk', 'CREATE INDEX IF NOT EXISTS idx_historico_relatorios_relatorio_agendado_id_fk ON public.historico_relatorios USING btree (relatorio_agendado_id)'),
      ('idx_itens_pedido_compra_pedido_id_fk', 'CREATE INDEX IF NOT EXISTS idx_itens_pedido_compra_pedido_id_fk ON public.itens_pedido_compra USING btree (pedido_id)'),
      ('idx_logs_conciliacao_retroativa_conta_bancaria_id_fk', 'CREATE INDEX IF NOT EXISTS idx_logs_conciliacao_retroativa_conta_bancaria_id_fk ON public.logs_conciliacao_retroativa USING btree (conta_bancaria_id)'),
      ('idx_metas_financeiras_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_metas_financeiras_user_id_fk ON public.metas_financeiras USING btree (user_id)'),
      ('idx_n8n_dispatch_logs_config_id_fk', 'CREATE INDEX IF NOT EXISTS idx_n8n_dispatch_logs_config_id_fk ON public.n8n_dispatch_logs USING btree (config_id)'),
      ('idx_negativacoes_cliente_id_fk', 'CREATE INDEX IF NOT EXISTS idx_negativacoes_cliente_id_fk ON public.negativacoes USING btree (cliente_id)'),
      ('idx_negativacoes_conta_receber_id_fk', 'CREATE INDEX IF NOT EXISTS idx_negativacoes_conta_receber_id_fk ON public.negativacoes USING btree (conta_receber_id)'),
      ('idx_new_device_alerts_device_id_fk', 'CREATE INDEX IF NOT EXISTS idx_new_device_alerts_device_id_fk ON public.new_device_alerts USING btree (device_id)'),
      ('idx_nfe_eventos_created_by_fk', 'CREATE INDEX IF NOT EXISTS idx_nfe_eventos_created_by_fk ON public.nfe_eventos USING btree (created_by)'),
      ('idx_nfe_recebidas_conta_pagar_id_fk', 'CREATE INDEX IF NOT EXISTS idx_nfe_recebidas_conta_pagar_id_fk ON public.nfe_recebidas USING btree (conta_pagar_id)'),
      ('idx_open_finance_consents_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_open_finance_consents_user_id_fk ON public.open_finance_consents USING btree (user_id)'),
      ('idx_oportunidades_elisao_estrategia_id_fk', 'CREATE INDEX IF NOT EXISTS idx_oportunidades_elisao_estrategia_id_fk ON public.oportunidades_elisao USING btree (estrategia_id)'),
      ('idx_parcelas_acordo_acordo_id_fk', 'CREATE INDEX IF NOT EXISTS idx_parcelas_acordo_acordo_id_fk ON public.parcelas_acordo USING btree (acordo_id)'),
      ('idx_partidas_contabeis_conta_contabil_id_fk', 'CREATE INDEX IF NOT EXISTS idx_partidas_contabeis_conta_contabil_id_fk ON public.partidas_contabeis USING btree (conta_contabil_id)'),
      ('idx_password_reset_requests_reviewed_by_fk', 'CREATE INDEX IF NOT EXISTS idx_password_reset_requests_reviewed_by_fk ON public.password_reset_requests USING btree (reviewed_by)'),
      ('idx_pedidos_compra_fornecedor_id_fk', 'CREATE INDEX IF NOT EXISTS idx_pedidos_compra_fornecedor_id_fk ON public.pedidos_compra USING btree (fornecedor_id)'),
      ('idx_per_dcomp_created_by_fk', 'CREATE INDEX IF NOT EXISTS idx_per_dcomp_created_by_fk ON public.per_dcomp USING btree (created_by)'),
      ('idx_plano_contas_empresa_id_fk', 'CREATE INDEX IF NOT EXISTS idx_plano_contas_empresa_id_fk ON public.plano_contas USING btree (empresa_id)'),
      ('idx_plano_contas_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_plano_contas_user_id_fk ON public.plano_contas USING btree (user_id)'),
      ('idx_portal_cliente_acessos_token_id_fk', 'CREATE INDEX IF NOT EXISTS idx_portal_cliente_acessos_token_id_fk ON public.portal_cliente_acessos USING btree (token_id)'),
      ('idx_prejuizos_fiscais_created_by_fk', 'CREATE INDEX IF NOT EXISTS idx_prejuizos_fiscais_created_by_fk ON public.prejuizos_fiscais USING btree (created_by)'),
      ('idx_protestos_cliente_id_fk', 'CREATE INDEX IF NOT EXISTS idx_protestos_cliente_id_fk ON public.protestos USING btree (cliente_id)'),
      ('idx_protestos_conta_receber_id_fk', 'CREATE INDEX IF NOT EXISTS idx_protestos_conta_receber_id_fk ON public.protestos USING btree (conta_receber_id)'),
      ('idx_protocolos_st_ncms_ncm_id_fk', 'CREATE INDEX IF NOT EXISTS idx_protocolos_st_ncms_ncm_id_fk ON public.protocolos_st_ncms USING btree (ncm_id)'),
      ('idx_protocolos_st_ncms_protocolo_id_fk', 'CREATE INDEX IF NOT EXISTS idx_protocolos_st_ncms_protocolo_id_fk ON public.protocolos_st_ncms USING btree (protocolo_id)'),
      ('idx_regimes_simulados_created_by_fk', 'CREATE INDEX IF NOT EXISTS idx_regimes_simulados_created_by_fk ON public.regimes_simulados USING btree (created_by)'),
      ('idx_regras_conciliacao_created_by_fk', 'CREATE INDEX IF NOT EXISTS idx_regras_conciliacao_created_by_fk ON public.regras_conciliacao USING btree (created_by)'),
      ('idx_regras_conciliacao_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_regras_conciliacao_user_id_fk ON public.regras_conciliacao USING btree (user_id)'),
      ('idx_regras_roteamento_financeiro_conta_bancaria_id_fk', 'CREATE INDEX IF NOT EXISTS idx_regras_roteamento_financeiro_conta_bancaria_id_fk ON public.regras_roteamento_financeiro USING btree (conta_bancaria_id)'),
      ('idx_regua_cobranca_etapas_regua_id_fk', 'CREATE INDEX IF NOT EXISTS idx_regua_cobranca_etapas_regua_id_fk ON public.regua_cobranca_etapas USING btree (regua_id)'),
      ('idx_regua_cobranca_etapas_template_id_fk', 'CREATE INDEX IF NOT EXISTS idx_regua_cobranca_etapas_template_id_fk ON public.regua_cobranca_etapas USING btree (template_id)'),
      ('idx_regua_cobranca_status_cliente_id_fk', 'CREATE INDEX IF NOT EXISTS idx_regua_cobranca_status_cliente_id_fk ON public.regua_cobranca_status USING btree (cliente_id)'),
      ('idx_regua_cobranca_status_conta_receber_id_fk', 'CREATE INDEX IF NOT EXISTS idx_regua_cobranca_status_conta_receber_id_fk ON public.regua_cobranca_status USING btree (conta_receber_id)'),
      ('idx_regua_cobranca_status_titulo_id_fk', 'CREATE INDEX IF NOT EXISTS idx_regua_cobranca_status_titulo_id_fk ON public.regua_cobranca_status USING btree (titulo_id)'),
      ('idx_role_permissions_permission_id_fk', 'CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id_fk ON public.role_permissions USING btree (permission_id)'),
      ('idx_saved_filters_created_by_fk', 'CREATE INDEX IF NOT EXISTS idx_saved_filters_created_by_fk ON public.saved_filters USING btree (created_by)'),
      ('idx_scim_tokens_created_by_fk', 'CREATE INDEX IF NOT EXISTS idx_scim_tokens_created_by_fk ON public.scim_tokens USING btree (created_by)'),
      ('idx_scim_tokens_provider_id_fk', 'CREATE INDEX IF NOT EXISTS idx_scim_tokens_provider_id_fk ON public.scim_tokens USING btree (provider_id)'),
      ('idx_security_audit_logs_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id_fk ON public.security_audit_logs USING btree (user_id)'),
      ('idx_sessoes_conciliacao_conta_bancaria_id_fk', 'CREATE INDEX IF NOT EXISTS idx_sessoes_conciliacao_conta_bancaria_id_fk ON public.sessoes_conciliacao USING btree (conta_bancaria_id)'),
      ('idx_solicitacoes_aprovacao_aprovado_por_fk', 'CREATE INDEX IF NOT EXISTS idx_solicitacoes_aprovacao_aprovado_por_fk ON public.solicitacoes_aprovacao USING btree (aprovado_por)'),
      ('idx_solicitacoes_aprovacao_conta_pagar_id_fk', 'CREATE INDEX IF NOT EXISTS idx_solicitacoes_aprovacao_conta_pagar_id_fk ON public.solicitacoes_aprovacao USING btree (conta_pagar_id)'),
      ('idx_solicitacoes_aprovacao_solicitado_por_fk', 'CREATE INDEX IF NOT EXISTS idx_solicitacoes_aprovacao_solicitado_por_fk ON public.solicitacoes_aprovacao USING btree (solicitado_por)'),
      ('idx_sso_sandbox_runs_provider_id_fk', 'CREATE INDEX IF NOT EXISTS idx_sso_sandbox_runs_provider_id_fk ON public.sso_sandbox_runs USING btree (provider_id)'),
      ('idx_sso_user_groups_provider_id_fk', 'CREATE INDEX IF NOT EXISTS idx_sso_user_groups_provider_id_fk ON public.sso_user_groups USING btree (provider_id)'),
      ('idx_transacoes_bancarias_confirmado_por_fk', 'CREATE INDEX IF NOT EXISTS idx_transacoes_bancarias_confirmado_por_fk ON public.transacoes_bancarias USING btree (confirmado_por)'),
      ('idx_transacoes_bancarias_regra_id_fk', 'CREATE INDEX IF NOT EXISTS idx_transacoes_bancarias_regra_id_fk ON public.transacoes_bancarias USING btree (regra_id)'),
      ('idx_transferencias_conta_destino_id_fk', 'CREATE INDEX IF NOT EXISTS idx_transferencias_conta_destino_id_fk ON public.transferencias USING btree (conta_destino_id)'),
      ('idx_transferencias_conta_origem_id_fk', 'CREATE INDEX IF NOT EXISTS idx_transferencias_conta_origem_id_fk ON public.transferencias USING btree (conta_origem_id)'),
      ('idx_transferencias_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_transferencias_user_id_fk ON public.transferencias USING btree (user_id)'),
      ('idx_user_action_audit_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_user_action_audit_user_id_fk ON public.user_action_audit USING btree (user_id)'),
      ('idx_user_filter_presets_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_user_filter_presets_user_id_fk ON public.user_filter_presets USING btree (user_id)'),
      ('idx_user_sessions_user_id_fk', 'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id_fk ON public.user_sessions USING btree (user_id)'),
      ('idx_webhook_simulation_results_run_id_fk', 'CREATE INDEX IF NOT EXISTS idx_webhook_simulation_results_run_id_fk ON public.webhook_simulation_results USING btree (run_id)'),
      ('idx_webhook_simulation_runs_created_by_fk', 'CREATE INDEX IF NOT EXISTS idx_webhook_simulation_runs_created_by_fk ON public.webhook_simulation_runs USING btree (created_by)'),
      ('idx_webhooks_log_dlq_id_fk', 'CREATE INDEX IF NOT EXISTS idx_webhooks_log_dlq_id_fk ON public.webhooks_log USING btree (dlq_id)'),
      ('idx_whatsapp_conversas_cliente_id_fk', 'CREATE INDEX IF NOT EXISTS idx_whatsapp_conversas_cliente_id_fk ON public.whatsapp_conversas USING btree (cliente_id)')
    ) AS t(nome, ddl)
  LOOP
    BEGIN
      EXECUTE r.ddl;
      n_ok := n_ok + 1;
    EXCEPTION
      WHEN undefined_column OR undefined_table THEN
        RAISE NOTICE 'indice de FK % ignorado: %', r.nome, SQLERRM;
        n_skip := n_skip + 1;
    END;
  END LOOP;
  RAISE NOTICE 'indices de FK: % aplicados, % ignorados por coluna ou tabela ausente', n_ok, n_skip;
END
$fk$
