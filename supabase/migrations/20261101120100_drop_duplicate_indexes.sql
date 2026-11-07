-- Step 13: DROP duplicate indexes
-- Verificado via supabase_db_duplicate_indexes: único par duplicado encontrado está no schema AUTH
-- (custom_oauth_providers_identifier_key × custom_oauth_providers_identifier_idx).
-- Schema auth é gerenciado pelo Supabase Cloud — não modificável via migration de usuário.
-- Ação: nenhum DROP executado neste step. Documentado para acompanhamento.

-- DROP INDEX CONCURRENTLY auth.custom_oauth_providers_identifier_idx; -- NÃO executar: schema auth
