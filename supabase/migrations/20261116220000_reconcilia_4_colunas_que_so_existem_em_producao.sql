-- Versiona QUATRO colunas que existem no banco de PRODUCAO e que a cadeia de
-- migrations nunca cria. Enquanto durar a divergencia, todo ambiente
-- reconstruido (restore, staging, auditoria) nasce sem essas colunas, e os
-- quatro indices de chave estrangeira correspondentes que a
-- 20261116190000_versiona_ddl_ja_aplicado_em_producao.sql versiona caem no
-- handler `EXCEPTION WHEN undefined_column` e sao silenciosamente pulados.
--
-- Achado na revisao da #380 (devin) e verificado por quatro agentes
-- independentes, com dois refutadores por coluna amarrando o grep a TABELA
-- certa (grep solto pelo nome da coluna da falso negativo: fornecedor_id existe
-- em contas_pagar, cliente_id em varias tabelas). Nenhuma das 8 refutacoes
-- derrubou o veredito.
--
--   coluna                               evidencia de que a cadeia nao cria
--   -----------------------------------  -----------------------------------
--   contratos.cliente_id                 unico CREATE TABLE da tabela em
--   contratos.fornecedor_id              20260518190304_430602f1-...sql:2-16,
--                                        sem as duas colunas; nenhum ALTER
--                                        TABLE public.contratos ADD COLUMN em
--                                        supabase/migrations/; nenhum DROP
--                                        TABLE contratos, logo aquele CREATE e
--                                        o estado final do replay; os arquivos
--                                        grandes de reconciliacao
--                                        (20260825100000:4707 e
--                                        20260825110000:185,5565) so citam
--                                        contratos em lista de RLS/policy.
--   oportunidades_elisao.estrategia_id   ultimo CREATE TABLE efetivo em
--                                        20260728154640_2b62d1ef-...sql:7
--                                        declara apenas `estrategia text`; o
--                                        bloco COLS de 20260825100000:3977-4056
--                                        tambem nao traz estrategia_id.
--   password_reset_requests.reviewed_by  unico CREATE TABLE em
--                                        20251231024248_d10755f4-...sql:2-12 e
--                                        o unico ALTER TABLE em
--                                        20260518164611_cc7f4f95-...sql:43-48
--                                        declaram `aprovado_por`; nenhuma
--                                        migration menciona reviewed_by.
--
-- NAO sao renomeacoes. Em producao as colunas irmas coexistem com as novas:
-- oportunidades_elisao tem `estrategia text` E `estrategia_id uuid`;
-- password_reset_requests tem `aprovado_por` E `reviewed_by`. Nada e removido
-- nem renomeado aqui.
--
-- Definicoes lidas no canonico bwwbeyolnnzppeuhgkcd (information_schema):
--   contratos.cliente_id                uuid NULL  FK -> clientes.id      ON DELETE SET NULL
--   contratos.fornecedor_id             uuid NULL  FK -> fornecedores.id  ON DELETE SET NULL
--   oportunidades_elisao.estrategia_id  uuid NULL  FK -> estrategias_elisao_catalogo.id ON DELETE NO ACTION
--   password_reset_requests.reviewed_by uuid NULL  sem FK
--
-- Em PRODUCAO a migration inteira e no-op. No replay cria as colunas e, onde a
-- FK for possivel, a FK.

-- 1. Colunas (idempotente). Nenhuma e NOT NULL em producao, entao ADD COLUMN
--    nao precisa de default nem de backfill.
ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS cliente_id uuid;
ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS fornecedor_id uuid;
ALTER TABLE public.oportunidades_elisao
  ADD COLUMN IF NOT EXISTS estrategia_id uuid;
ALTER TABLE public.password_reset_requests
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- 2. As tres chaves estrangeiras, cada uma sob guard duplo: a constraint ainda
--    nao existe E o objeto referenciado e TABELA (relkind='r').
--
--    O guard de relkind nao e decorativo. A FK de
--    oportunidades_elisao.estrategia_id aponta para
--    estrategias_elisao_catalogo, que em PRODUCAO e tabela mas que na cadeia
--    termina como VIEW: nasce tabela em 20260417155857_5c06caf2-...sql:2 e e
--    recriada como view com security_invoker em
--    20260825100000_reconciliar_schema_completo.sql:10803. PostgreSQL nao
--    aceita FK apontando para view, e sem o guard esta migration abortaria
--    exatamente no replay que ela existe para consertar — o mesmo erro que a
--    secao 3 da 20261116190000 ja tinha cometido com CREATE POLICY.
--    Reconciliar esse relkind view-vs-tabela e outra tarefa; aqui a coluna
--    passa a existir nas duas pontas e a FK e criada onde for possivel.
--
--    password_reset_requests.reviewed_by NAO entra: producao nao tem FK nessa
--    coluna, e criar uma aqui faria o replay divergir de producao no sentido
--    oposto.
DO $fks$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('contratos',            'cliente_id',    'contratos_cliente_id_fkey',
       'clientes',             'id', 'SET NULL'),
      ('contratos',            'fornecedor_id', 'contratos_fornecedor_id_fkey',
       'fornecedores',         'id', 'SET NULL'),
      ('oportunidades_elisao', 'estrategia_id', 'oportunidades_elisao_estrategia_id_fkey',
       'estrategias_elisao_catalogo', 'id', 'NO ACTION')
    ) AS t(tabela, coluna, constraint_nome, alvo, alvo_coluna, on_delete)
  LOOP
    IF to_regclass('public.' || quote_ident(r.tabela)) IS NULL THEN
      RAISE NOTICE 'tabela public.% ausente: FK % ignorada', r.tabela, r.constraint_nome;
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_constraint
       WHERE conname = r.constraint_nome
         AND conrelid = ('public.' || quote_ident(r.tabela))::regclass
    ) THEN
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relname = r.alvo
         AND c.relkind = 'r'
    ) THEN
      RAISE NOTICE 'alvo public.% nao e tabela (relkind<>r): FK % ignorada, coluna % criada sem constraint',
                   r.alvo, r.constraint_nome, r.coluna;
      CONTINUE;
    END IF;

    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(%I) ON DELETE %s',
      r.tabela, r.constraint_nome, r.coluna, r.alvo, r.alvo_coluna, r.on_delete
    );
  END LOOP;
END
$fks$;
