-- Reconciliação do ledger remoto de migrations.
--
-- A versão 20260728164234 foi aplicada em produção fora do git (era Lovable/dashboard,
-- mai–jul/2026), antes da disciplina de migrations versionadas. O DDL real já
-- existe em produção; este arquivo existe apenas para paridade entre
-- supabase/migrations/ e o ledger remoto — exigência do Supabase Preview
-- ("Remote migration versions not found in local migrations directory").
-- Não contém DDL de propósito: a versão já consta aplicada em produção.

select 1;
