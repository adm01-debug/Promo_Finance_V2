-- Converge saved_filter_subscriptions para o desenho declarado, religando a
-- assinatura de filtro salvo.
--
-- Produção tem outro desenho da mesma tabela, e ele é autocontraditório:
--   canal      NOT NULL DEFAULT 'inapp'  + CHECK (canal IN ('email','push','whatsapp'))
--   frequencia NOT NULL DEFAULT 'diario' + CHECK (frequencia IN ('diaria','semanal','mensal'))
-- Os dois defaults violam os CHECKs da própria tabela, então nenhum INSERT que
-- use default é aceito. Reproduzi o formato num banco local e o insert mínimo
-- falha em `saved_filter_subscriptions_canal_check`.
--
-- Por cima disso, o código (src/hooks/useSavedFilterSubscriptions.ts:128) faz
-- upsert com onConflict 'user_id,saved_filter_id' — índice único que produção
-- não tem — grava 10 colunas que não existem lá e usa frequencia 'imediata',
-- fora do CHECK. A assinatura de filtro salvo nunca funcionou.
--
-- O desenho declarado pelas migrations é o que o código e a tela esperam:
-- uma linha por (user_id, saved_filter_id), com os canais em três booleanos
-- (notify_inapp/notify_push/notify_email) em vez de uma linha por canal.
--
-- Esta migration remove colunas e constraints. É seguro no sentido de dado:
-- saved_filter_subscriptions e saved_filters estão as duas com 0 linhas em
-- produção — a funcionalidade nunca foi usada. Mesmo assim, por ser deleção de
-- objeto de schema, a PR fica aberta para decisão do dono (AGENTS.md §6.6);
-- nada foi aplicado em produção por mim.

-- 1) Tipo declarado para a frequência.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_frequencia') THEN
    CREATE TYPE public.subscription_frequencia AS ENUM ('imediata', 'horaria', 'diaria');
  END IF;
END $$;

-- 2) Constraints do desenho antigo saem antes das colunas que elas usam.
ALTER TABLE public.saved_filter_subscriptions
  DROP CONSTRAINT IF EXISTS saved_filter_subscriptions_canal_check,
  DROP CONSTRAINT IF EXISTS saved_filter_subscriptions_frequencia_check,
  DROP CONSTRAINT IF EXISTS saved_filter_subscriptions_filter_id_user_id_canal_key;

-- 3) Colunas do stub que o desenho declarado não tem. `filter_id` era NOT NULL
--    sem default, então sozinha já impedia qualquer insert do código.
ALTER TABLE public.saved_filter_subscriptions
  DROP COLUMN IF EXISTS filter_id,
  DROP COLUMN IF EXISTS canal,
  DROP COLUMN IF EXISTS ativo,
  DROP COLUMN IF EXISTS ultimo_envio_em;

-- 4) frequencia passa de text para o enum. A tabela está vazia, então não há
--    valor a converter; o USING cobre o caso de a migration rodar sobre dados.
--    O passo é guardado pelo tipo atual: sem isso, numa segunda passagem o CASE
--    compararia um enum com o literal 'diario' e falharia com
--    "invalid input value for enum".
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute a
    JOIN pg_type t ON t.oid = a.atttypid
    WHERE a.attrelid = 'public.saved_filter_subscriptions'::regclass
      AND a.attname = 'frequencia'
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
