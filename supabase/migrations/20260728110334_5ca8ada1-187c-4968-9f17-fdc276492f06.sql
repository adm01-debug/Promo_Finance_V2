-- Duplicatas exatas (mesmas colunas/predicado); o índice único remanescente
-- atende igualmente buscas ASC e DESC (varredura reversa de índice).
DROP INDEX IF EXISTS public.idx_alert_configurations_enabled;
DROP INDEX IF EXISTS public.idx_webhooks_log_source_ext;
DROP INDEX IF EXISTS public.partidas_contabeis_lancamento_idx;
DROP INDEX IF EXISTS public.idx_bloat_snapshots_date_table;
DROP INDEX IF EXISTS public.idx_perf_alerts_source_key;
DROP INDEX IF EXISTS public.idx_nfe_rec_conta_pagar;
DROP INDEX IF EXISTS public.idx_conformidade_snapshots_empresa;
DROP INDEX IF EXISTS public.idx_aliq_inter_origem_destino;
DROP INDEX IF EXISTS public.idx_aliq_internas_uf_cat;