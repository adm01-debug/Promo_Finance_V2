-- 09_views.sql — Gate #30: visões seguras (security_invoker) e matviews não expostas.
--
-- Por padrão uma VIEW no Postgres executa com os privilégios do owner, o que
-- ignora as policies RLS das tabelas-base e vaza dados entre empresas.
-- Toda view do schema public precisa de `security_invoker = on`.
--
-- MATERIALIZED VIEWS não suportam RLS: os dados ficam materializados e
-- qualquer SELECT devolve todas as linhas. Por isso elas nunca podem ter
-- SELECT concedido a `anon` ou `authenticated`; o consumo deve passar por
-- RPC SECURITY DEFINER com filtro de tenant ou por Edge Function.
\pset format unaligned
\pset tuples_only on
\pset fieldsep '\t'

WITH viola AS (
  SELECT objeto, tipo, motivo FROM public.gate_30_views_inseguras()
),
agg AS (
  SELECT count(*) AS n,
         string_agg(objeto || ' [' || tipo || ']: ' || motivo, '; ' ORDER BY objeto) AS list
  FROM viola
)
SELECT 'views.secure',
       CASE WHEN n = 0 THEN 'pass' ELSE 'fail' END,
       '0', n::text,
       CASE WHEN n = 0
            THEN 'todas as views usam security_invoker e nenhuma matview está exposta a anon/authenticated'
            ELSE 'visões inseguras: ' || COALESCE(list, '') END
FROM agg;
