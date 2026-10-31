-- Step 14: Autovacuum scale factor nas 6 tabelas financeiras críticas
-- Reduz threshold de 20% (padrão) para 5%, melhorando frequência de vacuum
ALTER TABLE public.fornecedores SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.centros_custo SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.contas_bancarias SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.conciliacoes SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.lancamentos_contabeis SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE public.solicitacoes_aprovacao SET (autovacuum_vacuum_scale_factor = 0.05);
