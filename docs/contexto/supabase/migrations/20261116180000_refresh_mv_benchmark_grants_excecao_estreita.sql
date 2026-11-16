-- Endurece public.refresh_mv_benchmark_setorial(), resgatado da branch
-- fix/codex-h111911-preserva-c696391 (arquivo
-- 20260827102000_guardrails_integration_secrets_mv_benchmark.sql, trabalho de
-- outro agente que nunca foi mergeado). Portado SÓ o que o repositório não tem
-- em lugar nenhum; a parte de integration_secrets daquele arquivo é no-op hoje
-- (ux_integration_secrets_chave já vem da 20260827090000, que está no main).
--
-- Dois defeitos na versão vigente do repositório
-- (20260418140233_7d5861e9-57bc-4df3-827b-b9fda80cc806.sql:152-163):
--
--   1. SEM REVOKE. A função é SECURITY DEFINER e, por padrão, EXECUTE é
--      concedido a PUBLIC: qualquer sessão `anon`/`authenticated` podia
--      disparar um REFRESH da materialized view via PostgREST.
--      `git grep -rn "refresh_mv_benchmark_setorial" supabase/migrations/ |
--      grep -iE "revoke|grant"` não devolve nada.
--   2. `EXCEPTION WHEN OTHERS` engole qualquer erro e cai no REFRESH NÃO
--      concorrente, que trava a view para leitura. O CONCURRENTLY só precisa
--      desse fallback quando a view nunca foi populada, e aí o erro é
--      `feature_not_supported` — qualquer outro (permissão, view ausente,
--      deadlock) passava a serializar leituras sem ninguém saber.
--
-- Estado conferido no canônico bwwbeyolnnzppeuhgkcd antes de escrever:
--   mv_benchmark_setorial existe e está populada (1 linha);
--   refresh_mv_benchmark_setorial() NÃO existe (0 em pg_proc) — ou seja, o
--   repositório declara a função e produção não a tem. Recriá-la aqui reduz o
--   drift em vez de aumentá-lo.
--   cron.job: nenhuma entrada de benchmark. O agendamento semanal que a
--   20260418140233 cria sob pg_cron não está em produção, logo a view não é
--   atualizada sozinha. Isso NÃO é tratado aqui (outro escopo).
--
-- O guard to_regclass torna a função segura mesmo onde a view não existe.

CREATE OR REPLACE FUNCTION public.refresh_mv_benchmark_setorial()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  IF to_regclass('public.mv_benchmark_setorial') IS NULL THEN
    RETURN;
  END IF;

  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_benchmark_setorial;
  EXCEPTION
    WHEN feature_not_supported THEN
      -- CONCURRENTLY exige view já populada; só neste caso cai no bloqueante.
      REFRESH MATERIALIZED VIEW public.mv_benchmark_setorial;
  END;
END;
$function$

REVOKE ALL ON FUNCTION public.refresh_mv_benchmark_setorial() FROM PUBLIC

REVOKE ALL ON FUNCTION public.refresh_mv_benchmark_setorial() FROM anon

REVOKE ALL ON FUNCTION public.refresh_mv_benchmark_setorial() FROM authenticated

GRANT EXECUTE ON FUNCTION public.refresh_mv_benchmark_setorial() TO service_role
