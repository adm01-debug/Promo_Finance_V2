-- Religa a assinatura de filtro salvo convergindo saved_filter_subscriptions
-- ao desenho declarado — SEM remover nenhuma coluna.
--
-- Produção tem outro desenho da mesma tabela, e ele é autocontraditório:
--   canal      NOT NULL DEFAULT 'inapp'  + CHECK (canal IN ('email','push','whatsapp'))
--   frequencia NOT NULL DEFAULT 'diario' + CHECK (frequencia IN ('diaria','semanal','mensal'))
-- Os dois defaults violam os CHECKs da própria tabela, então nenhum INSERT que
-- use default é aceito. Por cima disso, filter_id é NOT NULL sem default, e o
-- código (src/hooks/useSavedFilterSubscriptions.ts:128) não envia esse campo:
-- sozinho já impedia qualquer insert. O upsert do hook usa
-- onConflict 'user_id,saved_filter_id' (único que produção não tem), grava 10
-- colunas que não existem lá e usa frequencia 'imediata', fora do CHECK. A
-- assinatura de filtro salvo nunca funcionou.
--
-- A versão anterior desta migration (20261117212000, descartada) fazia
-- DROP COLUMN em filter_id, canal, ativo e ultimo_envio_em. Mesmo com as duas
-- tabelas vazias em produção, apagar objeto de schema é irreversível e não é
-- necessário: filter_id e canal com NOT NULL/DEFAULT removidos deixam de
-- bloquear o insert, e NULL satisfaz CHECK em Postgres — por isso o
-- saved_filter_subscriptions_canal_check continua de pé, intocado. A UNIQUE
-- antiga (filter_id, user_id, canal) também fica: com as duas colunas nulas,
-- NULLs são distintos e ela não bloqueia o modelo de uma linha por
-- (user_id, saved_filter_id).
--
-- O único objeto removido é o CHECK de frequencia, que é incompatível por
-- construção com o enum declarado (não aceita 'imediata'). Nenhuma coluna,
-- nenhum dado.

-- 1) Tipo declarado para a frequência.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_frequencia') THEN
    CREATE TYPE public.subscription_frequencia AS ENUM ('imediata', 'horaria', 'diaria');
  END IF;
END $$;

-- 2) Destrava as colunas do desenho antigo em vez de apagá-las.
--
--    Sob guarda de existência de propósito: `filter_id` e `canal` são do
--    formato de produção e NÃO existem num banco recriado pelas migrations —
--    o CREATE TABLE original (20260422120756_9ff79b5f-4781-4825-9569-dffd8d06df9f.sql)
--    declara `saved_filter_id`, sem `filter_id` nem `canal`, e nenhuma
--    migration posterior as acrescenta. ALTER COLUMN incondicional abortaria o
--    replay com undefined_column e travaria todo ambiente novo.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_filter_subscriptions'
      AND column_name = 'filter_id'
  ) THEN
    ALTER TABLE public.saved_filter_subscriptions ALTER COLUMN filter_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_filter_subscriptions'
      AND column_name = 'canal'
  ) THEN
    ALTER TABLE public.saved_filter_subscriptions ALTER COLUMN canal DROP NOT NULL;
    ALTER TABLE public.saved_filter_subscriptions ALTER COLUMN canal DROP DEFAULT;
  END IF;
END $$;

-- 3) O CHECK de frequencia sai: o enum declarado inclui 'imediata', que ele
--    recusa. É o único objeto que esta migration remove.
ALTER TABLE public.saved_filter_subscriptions
  DROP CONSTRAINT IF EXISTS saved_filter_subscriptions_frequencia_check;

-- 4) frequencia passa de text para o enum. Guardado pelo tipo atual: sem isso,
--    numa segunda passagem o CASE compararia um enum com o literal 'diario' e
--    falharia com "invalid input value for enum".
DO $$
BEGIN
  -- a guarda cobre dois casos: coluna ainda text (formato de produção) e
  -- coluna ausente ou já convertida (replay e segunda passagem)
  IF EXISTS (
    SELECT 1
    FROM pg_attribute a
    JOIN pg_type t ON t.oid = a.atttypid
    WHERE a.attrelid = 'public.saved_filter_subscriptions'::regclass
      AND a.attname = 'frequencia'
      AND NOT a.attisdropped
      AND t.typname = 'text'
  ) THEN
    ALTER TABLE public.saved_filter_subscriptions ALTER COLUMN frequencia DROP DEFAULT;
    ALTER TABLE public.saved_filter_subscriptions
      ALTER COLUMN frequencia TYPE public.subscription_frequencia
      USING (
        CASE frequencia
          WHEN 'diaria' THEN 'diaria'
          WHEN 'diario' THEN 'diaria'
          ELSE 'imediata'
        END
      )::public.subscription_frequencia;
    ALTER TABLE public.saved_filter_subscriptions
      ALTER COLUMN frequencia SET DEFAULT 'imediata'::public.subscription_frequencia;
  END IF;
END $$;

-- 5) As 10 colunas declaradas que faltavam.
ALTER TABLE public.saved_filter_subscriptions
  ADD COLUMN IF NOT EXISTS notify_inapp boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_push boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS horario_preferido time without time zone NOT NULL DEFAULT '09:00:00',
  ADD COLUMN IF NOT EXISTS severidades_criticas text[] NOT NULL DEFAULT ARRAY['critica']::text[],
  ADD COLUMN IF NOT EXISTS tipos_eventos_ativos text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS rate_limit_max integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS rate_limit_window_min integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS next_dispatch_at timestamptz;

-- 6) O índice único que o onConflict do upsert exige.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'saved_filter_subscriptions'
      AND c.conname = 'saved_filter_subscriptions_user_id_saved_filter_id_key'
  ) THEN
    ALTER TABLE public.saved_filter_subscriptions
      ADD CONSTRAINT saved_filter_subscriptions_user_id_saved_filter_id_key
      UNIQUE (user_id, saved_filter_id);
  END IF;
END $$;

-- 7) Índices de apoio, como as migrations os declaram.
CREATE INDEX IF NOT EXISTS idx_sfs_user ON public.saved_filter_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_sfs_filter ON public.saved_filter_subscriptions(saved_filter_id);
