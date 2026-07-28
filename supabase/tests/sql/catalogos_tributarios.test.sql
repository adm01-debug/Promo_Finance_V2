-- ============================================================
-- pgTAP: integridade dos catálogos tributários
-- ------------------------------------------------------------
-- Cobre:
--   * PK / UNIQUE das tabelas carregadas por seeds
--   * CHECK constraints de enum, formato e range
--   * Rejeição efetiva de dados inválidos (INSERT deve falhar)
--   * Função de auditoria validar_catalogos_tributarios()
--   * Persistência em integrity_alerts (domain = 'tributario')
--
-- Como rodar:
--   psql "$DATABASE_URL" -f supabase/tests/sql/catalogos_tributarios.test.sql
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(85);

-- ---------------------------------------------------------------------------
-- 1) Chaves primárias
-- ---------------------------------------------------------------------------
SELECT has_pk('public', t, format('%s deve ter PRIMARY KEY', t))
FROM unnest(ARRAY[
  'ufs','cnaes','ncms','aliquotas_internas_uf','aliquotas_interestaduais',
  'itens_lista_iss','aliquotas_iss_municipal','faixas_simples_nacional',
  'protocolos_st','protocolos_st_ncms','protocolos_st_ufs',
  'beneficios_fiscais','estrategias_elisao'
]) AS t;

-- ---------------------------------------------------------------------------
-- 2) Unicidade lógica (evita duplicidade de catálogo)
-- ---------------------------------------------------------------------------
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = format('public.%I', c.tbl)::regclass
      AND contype = 'u'
      AND conkey::int[] @> (
        SELECT array_agg(a.attnum ORDER BY a.attnum)::int[]
        FROM unnest(c.cols) col
        JOIN pg_attribute a
          ON a.attrelid = format('public.%I', c.tbl)::regclass
         AND a.attname = col
      )
  )
  OR EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = c.tbl
      AND indexdef ILIKE '%UNIQUE%'
      AND indexdef ILIKE '%' || array_to_string(c.cols, '%') || '%'
  ),
  format('%s deve ter UNIQUE em (%s)', c.tbl, array_to_string(c.cols, ', '))
)
FROM (VALUES
  ('ufs', ARRAY['sigla']),
  ('ufs', ARRAY['codigo_ibge']),
  ('cnaes', ARRAY['codigo']),
  ('ncms', ARRAY['codigo']),
  ('itens_lista_iss', ARRAY['codigo']),
  ('protocolos_st', ARRAY['codigo']),
  ('beneficios_fiscais', ARRAY['codigo']),
  ('estrategias_elisao', ARRAY['codigo']),
  ('aliquotas_internas_uf', ARRAY['uf','categoria_produto','vigente_de']),
  ('aliquotas_interestaduais', ARRAY['uf_origem','uf_destino','vigente_de']),
  ('faixas_simples_nacional', ARRAY['anexo','faixa','vigente_de']),
  ('protocolos_st_ncms', ARRAY['protocolo_id','ncm_codigo']),
  ('protocolos_st_ufs', ARRAY['protocolo_id','uf'])
) AS c(tbl, cols);

-- ---------------------------------------------------------------------------
-- 3) CHECK constraints obrigatórias
-- ---------------------------------------------------------------------------
SELECT ok(
  EXISTS (SELECT 1 FROM pg_constraint WHERE conname = c AND contype = 'c'),
  format('constraint %s deve existir', c)
)
FROM unnest(ARRAY[
  'ufs_aliquota_interna_range_chk',
  'ufs_aliquota_fcp_range_chk',
  'ufs_codigo_ibge_range_chk',
  'cnaes_codigo_formato_chk',
  'cnaes_rat_valores_chk',
  'ncms_codigo_formato_chk',
  'ncms_cest_formato_chk',
  'aliq_inter_valores_chk',
  'aliq_inter_ufs_distintas_chk',
  'aliq_iss_mun_range_chk',
  'faixas_simples_aliquota_range_chk',
  'beneficios_tipo_chk',
  'estrategias_regimes_chk',
  'protocolos_st_ncms_codigo_formato_chk'
]) AS c;

-- ---------------------------------------------------------------------------
-- 4) Rejeição efetiva de dados inválidos
-- ---------------------------------------------------------------------------
SELECT throws_ok(
  $$INSERT INTO public.cnaes (codigo, descricao) VALUES ('4711302', 'formato inválido')$$,
  '23514',
  NULL,
  'CNAE fora do formato NN.NN-N/NN deve ser rejeitado'
);

SELECT throws_ok(
  $$INSERT INTO public.ncms (codigo, descricao) VALUES ('123', 'NCM curto')$$,
  '23514',
  NULL,
  'NCM que não tenha 8 dígitos deve ser rejeitado'
);

SELECT throws_ok(
  $$INSERT INTO public.aliquotas_interestaduais (uf_origem, uf_destino, aliquota)
    VALUES ('SP','RJ', 0.09)$$,
  '23514',
  NULL,
  'alíquota interestadual fora de {4%, 7%, 12%} deve ser rejeitada'
);

SELECT throws_ok(
  $$INSERT INTO public.aliquotas_interestaduais (uf_origem, uf_destino, aliquota)
    VALUES ('SP','SP', 0.12)$$,
  '23514',
  NULL,
  'alíquota interestadual com origem igual ao destino deve ser rejeitada'
);

SELECT throws_ok(
  $$INSERT INTO public.beneficios_fiscais (codigo, nome, tipo)
    VALUES ('TST_BEN_X','teste','TIPO_INEXISTENTE')$$,
  '23514',
  NULL,
  'tipo de benefício fiscal fora da lista permitida deve ser rejeitado'
);

SELECT throws_ok(
  $$INSERT INTO public.estrategias_elisao (codigo, nome, regimes_aplicaveis)
    VALUES ('TST_ELI_X','teste', ARRAY['LUCRO_ESTRANHO'])$$,
  '23514',
  NULL,
  'regime não previsto em estratégia de elisão deve ser rejeitado'
);

SELECT throws_ok(
  $$INSERT INTO public.aliquotas_iss_municipal (codigo_ibge, municipio, uf, aliquota)
    VALUES (3550308,'São Paulo','SP', 0.09)$$,
  '23514',
  NULL,
  'alíquota de ISS acima de 5% deve ser rejeitada'
);

-- ---------------------------------------------------------------------------
-- 5) Função de auditoria
-- ---------------------------------------------------------------------------
SELECT has_function('public', 'validar_catalogos_tributarios', ARRAY[]::text[],
  'validar_catalogos_tributarios() deve existir');

SELECT has_function('public', 'check_catalogos_tributarios_invariants', ARRAY[]::text[],
  'check_catalogos_tributarios_invariants() deve existir');

-- Severidades sempre dentro do vocabulário aceito por integrity_alerts
SELECT is(
  (SELECT count(*) FROM public.validar_catalogos_tributarios()
    WHERE severidade NOT IN ('info','warning','critical'))::int,
  0,
  'toda severidade retornada deve ser info | warning | critical'
);

-- Nunca retorna linhas com contagem zero (ruído)
SELECT is(
  (SELECT count(*) FROM public.validar_catalogos_tributarios() WHERE afetados <= 0)::int,
  0,
  'auditoria só deve retornar invariantes efetivamente violadas'
);

-- Invariante crítica: catálogo de UFs completo
SELECT is(
  (SELECT count(*) FROM public.validar_catalogos_tributarios()
    WHERE invariante = 'ufs_incompletas')::int,
  0,
  'as 27 UFs devem estar carregadas'
);

-- Invariante crítica: faixas do Simples contínuas e completas
SELECT is(
  (SELECT count(*) FROM public.validar_catalogos_tributarios()
    WHERE invariante IN ('faixa_simples_incompleta','faixa_simples_descontinua'))::int,
  0,
  'faixas do Simples devem estar completas e sem lacunas de RBT12'
);

-- Invariante crítica: ISS municipal dentro da faixa do item da LC 116
SELECT is(
  (SELECT count(*) FROM public.validar_catalogos_tributarios()
    WHERE invariante = 'iss_municipal_fora_da_faixa_do_item')::int,
  0,
  'nenhuma alíquota municipal pode extrapolar a faixa do item da lista'
);

-- Nenhuma invariante crítica pendente
SELECT is(
  (SELECT count(*) FROM public.validar_catalogos_tributarios() WHERE severidade = 'critical')::int,
  0,
  'não deve haver invariante crítica violada nos catálogos tributários'
);

-- ---------------------------------------------------------------------------
-- 6) Persistência dos achados em integrity_alerts
-- ---------------------------------------------------------------------------
SELECT ok(
  (SELECT (public.check_catalogos_tributarios_invariants() ->> 'success')::boolean),
  'check_catalogos_tributarios_invariants() deve executar com sucesso'
);

SELECT is(
  (SELECT count(*) FROM public.integrity_alerts
    WHERE domain = 'tributario'
      AND alert_hour = date_trunc('hour', now()))::int,
  (SELECT count(*) FROM public.validar_catalogos_tributarios())::int,
  'todo achado da auditoria deve virar alerta no domínio tributario'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'integrity_alerts_domain_check'
      AND pg_get_constraintdef(oid) ILIKE '%tributario%'
  ),
  'domínio tributario deve ser aceito por integrity_alerts'
);

-- ============================================================
-- Bloco: repartição do Simples, ISS geral e vínculos de ST
-- ============================================================

SELECT is(
  (SELECT count(*) FROM public.faixas_simples_nacional WHERE reparticao = '{}'::jsonb)::int,
  0, 'todas as 30 faixas do Simples devem ter repartição preenchida'
);

SELECT ok(
  (SELECT bool_and(public.faixa_simples_reparticao_valida(reparticao))
     FROM public.faixas_simples_nacional),
  'repartição de cada faixa deve somar 100%'
);

-- Requer privilégio de UPDATE; em runners somente-leitura o teste é pulado
SELECT CASE
  WHEN has_table_privilege(current_user, 'public.faixas_simples_nacional', 'UPDATE') THEN
    throws_ok(
      $$UPDATE public.faixas_simples_nacional
           SET reparticao = '{"irpj":10,"csll":10}'::jsonb
         WHERE anexo = 'I' AND faixa = 1$$,
      '23514', NULL, 'repartição que não fecha 100% deve ser rejeitada')
  ELSE
    skip('sem privilégio de UPDATE neste papel', 1)
END;

SELECT is(
  (SELECT count(*) FROM public.ncms WHERE sujeito_st AND mva_padrao IS NULL)::int,
  0, 'todo NCM sujeito a ST deve ter MVA padrão'
);

SELECT is(
  (SELECT count(*) FROM public.protocolos_st_ncms WHERE ncm_id IS NULL)::int,
  0, 'todo item de protocolo ST deve estar vinculado a um NCM'
);

SELECT is(
  (SELECT count(*) FROM public.ufs u
    WHERE NOT EXISTS (SELECT 1 FROM public.aliquotas_internas_uf a
                       WHERE a.uf = u.sigla AND a.categoria_produto IN ('GERAL','padrao')))::int,
  0, 'as 27 UFs devem ter alíquota interna padrão detalhada'
);

SELECT is(
  (SELECT count(*) FROM (
     SELECT codigo_ibge FROM public.aliquotas_iss_municipal
      GROUP BY codigo_ibge
     HAVING count(*) FILTER (WHERE item_lista_id IS NULL) = 0) s)::int,
  0, 'todo município deve ter alíquota geral de ISS como fallback'
);


-- ============================================================
-- Blindagem de acesso: RPC de saúde fiscal e rotina de invariantes
-- ============================================================

SELECT has_function('public', 'get_catalogos_tributarios_health', ARRAY[]::text[],
  'RPC get_catalogos_tributarios_health deve existir');

SELECT is(
  (SELECT prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_catalogos_tributarios_health'),
  true, 'get_catalogos_tributarios_health deve ser SECURITY DEFINER');

SELECT ok(
  NOT has_function_privilege('anon', 'public.get_catalogos_tributarios_health()', 'EXECUTE'),
  'anon não pode executar get_catalogos_tributarios_health');

SELECT ok(
  has_function_privilege('authenticated', 'public.get_catalogos_tributarios_health()', 'EXECUTE'),
  'authenticated pode chamar a RPC (guarda de admin ocorre dentro da função)');

SELECT ok(
  NOT has_function_privilege('anon', 'public.validar_catalogos_tributarios()', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.validar_catalogos_tributarios()', 'EXECUTE'),
  'validar_catalogos_tributarios não é executável por anon nem authenticated');

-- Sem JWT admin a RPC deve negar acesso (auth.uid() nulo)
SELECT throws_ok(
  'SELECT public.get_catalogos_tributarios_health()',
  '42501',
  NULL,
  'get_catalogos_tributarios_health nega acesso sem papel admin');

-- A rotina de invariantes permanece executável por jobs internos (sem JWT)
SELECT is(
  (public.check_catalogos_tributarios_invariants() ? 'success')
  OR (public.check_catalogos_tributarios_invariants() ? 'skipped'),
  true, 'check_catalogos_tributarios_invariants roda para jobs internos sem JWT');


-- ============================================================
-- Histórico de saúde fiscal (snapshots diários) e retenção
-- ============================================================

SELECT has_table('public', 'catalogos_tributarios_health_history',
  'tabela de histórico de saúde fiscal deve existir');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'catalogos_tributarios_health_history'),
  'histórico de saúde fiscal deve ter RLS habilitada');

SELECT ok(
  NOT has_table_privilege('anon', 'public.catalogos_tributarios_health_history', 'SELECT'),
  'anon não tem SELECT no histórico de saúde fiscal');

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_index i
      JOIN pg_class c ON c.oid = i.indrelid
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY (i.indkey)
     WHERE c.relname = 'catalogos_tributarios_health_history'
       AND i.indisunique AND a.attname = 'dia'),
  'histórico deve ter unicidade por dia (idempotência do snapshot)');

SELECT has_function('public', 'get_catalogos_tributarios_history', ARRAY['integer'],
  'RPC get_catalogos_tributarios_history deve existir');

SELECT is(
  (SELECT prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_catalogos_tributarios_history'),
  true, 'get_catalogos_tributarios_history deve ser SECURITY DEFINER');

SELECT ok(
  NOT has_function_privilege('anon', 'public.get_catalogos_tributarios_history(integer)', 'EXECUTE'),
  'anon não pode executar get_catalogos_tributarios_history');

SELECT throws_ok(
  'SELECT * FROM public.get_catalogos_tributarios_history(30)',
  '42501',
  NULL,
  'get_catalogos_tributarios_history nega acesso sem papel admin');

SELECT ok(
  (SELECT prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'cleanup_log_tables')
    LIKE '%catalogos_tributarios_health_history%',
  'cleanup_log_tables deve aplicar retenção ao histórico de saúde fiscal');


-- Auto-resolução de alertas tributários corrigidos
SELECT ok(
  public.check_catalogos_tributarios_invariants() ? 'auto_resolved'
  OR public.check_catalogos_tributarios_invariants() ? 'skipped',
  'verificação retorna contagem de alertas auto-resolvidos');

SELECT ok(
  (SELECT prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'check_catalogos_tributarios_invariants')
    LIKE '%resolved_at IS NULL%',
  'rotina de invariantes fecha alertas tributários já corrigidos');


-- Notificação de administradores em caso de crítico
SELECT ok(
  (SELECT prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'check_catalogos_tributarios_invariants')
    LIKE '%catalogo_tributario%',
  'rotina notifica administradores quando há invariantes críticas');

SELECT ok(
  public.check_catalogos_tributarios_invariants() ? 'admins_notified'
  OR public.check_catalogos_tributarios_invariants() ? 'skipped',
  'verificação retorna contagem de administradores notificados');

SELECT * FROM finish();


ROLLBACK;
