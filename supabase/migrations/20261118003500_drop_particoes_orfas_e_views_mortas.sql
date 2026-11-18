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

DROP TABLE IF EXISTS public.audit_logs_2026_01;
DROP TABLE IF EXISTS public.audit_logs_2026_02;
DROP TABLE IF EXISTS public.audit_logs_2026_03;
DROP TABLE IF EXISTS public.audit_logs_2026_04;
DROP TABLE IF EXISTS public.audit_logs_2026_05;
DROP TABLE IF EXISTS public.audit_logs_2026_06;
DROP TABLE IF EXISTS public.audit_logs_2026_07;
DROP TABLE IF EXISTS public.audit_logs_2026_08;
DROP TABLE IF EXISTS public.audit_logs_2026_09;
DROP TABLE IF EXISTS public.audit_logs_2026_10;
DROP TABLE IF EXISTS public.audit_logs_default;

DROP VIEW IF EXISTS public.vw_notification_history_duplicates;
DROP VIEW IF EXISTS public.vw_rpc_hotspots;
DROP VIEW IF EXISTS public.vw_rpc_slow_calls;

DROP FUNCTION IF EXISTS public.refresh_mv_benchmark_setorial();
DROP MATERIALIZED VIEW IF EXISTS public.mv_benchmark_setorial;
