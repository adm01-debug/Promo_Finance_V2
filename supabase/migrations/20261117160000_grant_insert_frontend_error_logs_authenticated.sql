-- Recupera o grant que faltou do trabalho da branch claude/fix-grants-audit-logs-261114-1500
-- (PR #348, nunca mergeada; conteudo arquivado em arquivo/261116/claude_fix-grants-audit-logs-261114-1500).
--
-- Causa: public.frontend_error_logs tem a policy de RLS frontend_error_user_insert para o
-- papel authenticated, mas nao tem o GRANT INSERT na tabela. O Postgres barra no privilegio
-- antes de avaliar a RLS, logo a policy nunca dispara e todo erro de usuario logado se perde.
-- src/lib/telemetry.ts:226 faz supabase.from('frontend_error_logs').insert(rows) com a sessao
-- do usuario. A tabela irma frontend_performance_logs, escrita pelo mesmo arquivo, ja tem o grant.
--
-- Estado conferido em producao (bwwbeyolnnzppeuhgkcd) antes desta migration:
--   has_table_privilege('authenticated','public.frontend_error_logs','INSERT')   = false
--   has_table_privilege('authenticated','public.frontend_performance_logs','INSERT') = true
--
-- Escopo minimo: só o privilegio que falta. Os grants de audit_logs e planos_acao que a
-- migration original tambem trazia ja estao aplicados em producao e nao sao repetidos aqui.

GRANT INSERT ON public.frontend_error_logs TO authenticated;
