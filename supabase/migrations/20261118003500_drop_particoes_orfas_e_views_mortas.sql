-- Remove 11 tabelas-resíduo de particionamento e 4 views sem consumidor.
-- Autorizado pelo dono em 2026-11-18 ("Aprovados 1,2,3", item 3).
--
-- 1) audit_logs_2026_01..10 e audit_logs_default
--    São tabelas comuns (relkind='r', relispartition=false, sem pg_inherits):
--    sobraram de uma tentativa de particionar `audit_logs` que nunca foi
--    concluída — o pai NÃO é particionado, e `maintain_monthly_partitions()`
--    (20261113114335) passou a ignorá-lo. Conferido em produção antes do DROP:
--      - 9 tabelas com 0 linhas; audit_logs_2026_05 com 6 e audit_logs_2026_07
--        com 25 linhas, e TODAS as 31 existem em `audit_logs` com o mesmo id,
--        created_at, action, table_name e user_id (duplicatas exatas) —
--        nenhum registro de auditoria se perde;
--      - 0 FKs apontando para elas, 0 triggers, 0 views dependentes, 0 funções
--        ou crons citando-as por nome; 1 policy RLS cada (cai com a tabela);
--      - nenhuma referência em src/ ou supabase/functions/ (só o types.ts
--        gerado, que fica para regerar quando houver CLI).
--
-- 2) vw_notification_history_duplicates, vw_rpc_hotspots, vw_rpc_slow_calls
--    0 referências em src/, supabase/functions/ e scripts/ (fora do types.ts),
--    0 funções e 0 crons citando-as, 0 views dependentes. As duas `vw_rpc_*`
--    aparecem em scripts/integrity/15_views_pii_rpcs.sql:58,68, mas aquele
--    teste só percorre views que EXISTEM (`FROM pg_class ... WHERE relname IN`)
--    para exigir security_invoker — view ausente não reprova.
--
-- 3) mv_benchmark_setorial + refresh_mv_benchmark_setorial()
--    Materialized view sem leitor: 0 referências em src/, supabase/functions/,
--    scripts/ e .github/; a única função que a cita é a sua própria rotina de
--    refresh, e nada chama essa rotina (0 funções, 0 crons, 0 código). Dado
--    derivado, reconstruível pela migration que a criou.
--
-- Não toca: frontend_error_logs_2026_* / _default (mesma situação, mas fora do
-- escopo aprovado — listadas em "Próximos passos"), mv_performance_alerts_weekly
-- (lida por get_performance_alerts_weekly e pelos testes de integridade).

-- Apontado por Codex (P1) na #467: num banco reconstruído pelas migrations,
-- 20260711164339:61-104 transforma `audit_logs` em particionada, cria as filhas
-- mensais e MIGRA os registros para elas — lá, estas tabelas são partições
-- reais e o pai só enxerga as linhas que estão nelas. Um DROP incondicional
-- apagaria auditoria. Produção divergiu (pai comum, filhas órfãs e duplicadas),
-- e é só esse caso que esta migration limpa: cada tabela só cai se NÃO for
-- partição anexada (relispartition = false e sem linha em pg_inherits).
-- Partição de verdade fica intocada e é registrada em NOTICE.
DO $$
DECLARE
  v_nome text;
  v_oid oid;
BEGIN
  FOREACH v_nome IN ARRAY ARRAY[
    'audit_logs_2026_01','audit_logs_2026_02','audit_logs_2026_03','audit_logs_2026_04',
    'audit_logs_2026_05','audit_logs_2026_06','audit_logs_2026_07','audit_logs_2026_08',
    'audit_logs_2026_09','audit_logs_2026_10','audit_logs_default'
  ] LOOP
    SELECT c.oid INTO v_oid
    FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace AND c.relname = v_nome AND c.relkind = 'r';

    IF v_oid IS NULL THEN
      CONTINUE;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_class WHERE oid = v_oid AND relispartition)
       OR EXISTS (SELECT 1 FROM pg_inherits WHERE inhrelid = v_oid) THEN
      RAISE NOTICE 'mantida: public.% é partição anexada de audit_logs — não é resíduo', v_nome;
      CONTINUE;
    END IF;

    EXECUTE format('DROP TABLE public.%I', v_nome);
  END LOOP;
END $$;

DROP VIEW IF EXISTS public.vw_notification_history_duplicates;
DROP VIEW IF EXISTS public.vw_rpc_hotspots;
DROP VIEW IF EXISTS public.vw_rpc_slow_calls;

DROP FUNCTION IF EXISTS public.refresh_mv_benchmark_setorial();
DROP MATERIALIZED VIEW IF EXISTS public.mv_benchmark_setorial;

-- Apontado por Devin na #467: 20260418140233 agenda
-- `refresh-benchmark-setorial-weekly` (domingo 03:00) chamando a função que
-- sai acima. Em produção o job não existe (cron.job = 0 linhas para
-- benchmark), mas num banco reconstruído pelas migrations ele seria criado e
-- falharia toda semana por função inexistente. Mesma guarda da migration que
-- o criou.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     AND EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-benchmark-setorial-weekly') THEN
    PERFORM cron.unschedule('refresh-benchmark-setorial-weekly');
  END IF;
END $$;
